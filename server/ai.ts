import { GoogleGenAI, Type } from '@google/genai';
import { getChatbotConfig, getKbDocuments, getSettings } from './db.ts';
import type { Lang } from '../src/types/concam.ts';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function retrieveRelevantKnowledge(query: string): Promise<string> {
  const docs = (await getKbDocuments()).filter((d) => d.active);
  const tokens = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);

  const scored = docs.map((doc) => {
    const haystack = (doc.title + ' ' + doc.content)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    let score = doc.category === 'commercial_playbook' || doc.id === 'auto-agency-identity' ? 10 : 0;
    for (const t of tokens) {
      if (haystack.includes(t)) score += 2;
    }
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topDocs = scored.slice(0, 7).map((s) => `### ${s.doc.title}\n${s.doc.content}`);
  return topDocs.join('\n\n');
}

export async function buildAdvisorSystemInstruction(lang: Lang, currentPath: string, knowledgeContext: string): Promise<string> {
  const cfg = await getChatbotConfig();
  const settings = await getSettings();
  const voiceGuidance = cfg.voiceEnabled
    ? 'Le mode vocal est ACTIF : si le visiteur exprime un besoin flou ou complexe (« je ne sais pas trop », « notre image est vieillissante »), propose-lui chaleureusement de cliquer sur le bouton micro pour en discuter de vive voix.'
    : 'Le mode vocal est actuellement désactivé dans les réglages.';

  return `Tu es « Conseiller CONCAM », le représentant commercial senior de l'agence ${settings.brandAlias} (${settings.companyName}) située à ${settings.address.fr}.
Tu parles couramment français et anglais. Détecte automatiquement la langue du dernier message du visiteur et réponds dans cette langue (${lang === 'en' ? 'English preferred unless user writes in French' : 'Français par défaut sauf si le visiteur écrit en anglais'}).

TON ET POSTURE :
- Français : ${cfg.toneFr}
- English : ${cfg.toneEn}
- Page actuellement consultée par le visiteur : ${currentPath}
- ${voiceGuidance}

RÈGLES STRICTES (GARDE-FOUS) :
1. Base-toi EXCLUSIVEMENT sur la base documentaire ci-dessous. N'invente JAMAIS de prix chiffrés fermes, de remises inventées, de délais contractuels fermes ni de clients qui ne figurent pas dans la base.
2. Si une information est absente de la base, dis-le honnêtement et propose la mise en relation humaine (${settings.whatsappNumber} ou ${settings.agencyEmail}).
3. Ne pose que 1 à 2 questions courtes par réponse pour qualifier le besoin (BANT simplifié : organisation/secteur, projet & volume, échéance, existence de maquette/budget) — jamais un questionnaire long.
4. En cas d'objection prix : reconnais l'enjeu, explique la valeur (conception, relectures, épreuves, niveau institutionnel prouvé), et propose d'ajuster sur le volume, le papier/grammage ou l'étendue de la conception via un devis gradué sous 24 heures ouvrées.
5. Lorsque le besoin est suffisamment cerné, propose de conclure par un formulaire de devis pré-rempli, un récapitulatif WhatsApp ou un rappel téléphonique.

BASE DOCUMENTAIRE OFFICIELLE CONCAM (RAG) :
${knowledgeContext}`;
}

export interface CommercialTurnResult {
  reply: string;
  detectedLang: Lang;
  detectedNeed: string;
  painPoint: string;
  recommendedServiceSlug: string;
  recommendedAction: 'none' | 'devis' | 'whatsapp' | 'rappel' | 'voice_invite';
  prefillNotes: string;
  sessionSummary: string;
}

export async function generateCommercialReply(params: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  lang: Lang;
  currentPath: string;
}): Promise<CommercialTurnResult> {
  const knowledge = await retrieveRelevantKnowledge(params.message + ' ' + params.currentPath);
  const ai = getAiClient();

  if (!ai) {
    return buildDeterministicFallback(params.message, params.lang, params.currentPath);
  }

  const systemInstruction = await buildAdvisorSystemInstruction(params.lang, params.currentPath, knowledge);

  const conversationContents = [
    ...params.history.slice(-12).map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    {
      role: 'user',
      parts: [{ text: params.message }],
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_TEXT_MODEL || 'gemini-4-hydrogen',
      contents: conversationContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'The natural commercial reply to the visitor in their language.',
            },
            detectedLang: {
              type: Type.STRING,
              description: 'Either fr or en based on the user message.',
            },
            detectedNeed: {
              type: Type.STRING,
              description: 'Short label of the prospect project need, empty if not yet clear.',
            },
            painPoint: {
              type: Type.STRING,
              description: 'Identified business pain point (credibility, visibility, cost, deadline, brand refresh).',
            },
            recommendedServiceSlug: {
              type: Type.STRING,
              description:
                'One of conseil-communication, manuels-supports, marquage-gadgets-publicitaires, impression-numerique-offset, or empty string.',
            },
            recommendedAction: {
              type: Type.STRING,
              description: 'One of none, devis, whatsapp, rappel, voice_invite.',
            },
            prefillNotes: {
              type: Type.STRING,
              description: 'Concise scope summary to pre-fill a quote or WhatsApp message.',
            },
            sessionSummary: {
              type: Type.STRING,
              description: 'One-sentence CRM summary for CONCAM sales team.',
            },
          },
          required: ['reply', 'detectedLang', 'recommendedAction'],
        },
      },
    });

    const raw = (response.text ?? '').trim();
    const parsed = JSON.parse(raw) as Partial<CommercialTurnResult>;
    return {
      reply: parsed.reply || 'Je vous écoute pour préciser votre projet.',
      detectedLang: parsed.detectedLang === 'en' ? 'en' : 'fr',
      detectedNeed: parsed.detectedNeed || '',
      painPoint: parsed.painPoint || '',
      recommendedServiceSlug: parsed.recommendedServiceSlug || '',
      recommendedAction: (parsed.recommendedAction as CommercialTurnResult['recommendedAction']) || 'none',
      prefillNotes: parsed.prefillNotes || '',
      sessionSummary: parsed.sessionSummary || '',
    };
  } catch (err) {
    console.error('Gemini chat error:', err);
    return buildDeterministicFallback(params.message, params.lang, params.currentPath);
  }
}

export async function transcribeAudioBase64(base64Audio: string, mimeType: string): Promise<string> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY manquante côté serveur pour la transcription vocale.');
  }
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_STT_MODEL || 'gemini-3.5-transcribe',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: base64Audio,
          },
        },
        {
          text: 'Transcris fidèlement cet audio (français ou anglais) sans commentaire.',
        },
      ],
    },
  });
  return (response.text ?? '').trim();
}

export async function synthesizeSpeechWav(text: string, lang: Lang): Promise<string | null> {
  const ai = getAiClient();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style:
                  lang === 'en'
                    ? 'Calm, poised, executive senior communication advisor'
                    : 'Voix posée, professionnelle et chaleureuse de conseiller senior en agence de communication',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
  } catch (err) {
    console.error('TTS error:', err);
    return null;
  }
}

function buildDeterministicFallback(message: string, lang: Lang, currentPath: string): CommercialTurnResult {
  const lower = message.toLowerCase();
  const isEn = lang === 'en' || /\b(hello|hi|print|quote|price|cost|brand|manual)\b/i.test(lower);

  if (lower.includes('tarif') || lower.includes('cher') || lower.includes('prix') || lower.includes('expensive')) {
    return {
      reply: isEn
        ? 'I understand — budget is always decisive. Our quotes cover end-to-end support (design, proofreading, pre-press proofs) and reflect the standards we deliver for Ecobank, Activa and ANIES. We also provide tiered options: would you prefer to adjust print volume, paper weight/finishes, or design scope?'
        : 'Je comprends — le budget est toujours un critère décisif. Nos devis incluent l’accompagnement complet (conception, relectures, épreuves) avec le niveau d’exigence attendu par nos partenaires institutionnels (Ecobank, Activa, ANIES). Nos propositions sont graduées : sur quel poste souhaitez-vous ajuster — le volume, le papier et les finitions, ou l’étendue de la conception ?',
      detectedLang: isEn ? 'en' : 'fr',
      detectedNeed: 'Optimisation budgétaire sur devis',
      painPoint: 'Maîtrise du rapport qualité-coût',
      recommendedServiceSlug: 'impression-numerique-offset',
      recommendedAction: 'devis',
      prefillNotes: 'Demande de devis gradué avec options de papier et de finitions.',
      sessionSummary: 'Traitement objection prix — proposition options graduées.',
    };
  }

  if (lower.includes('vieillissant') || lower.includes('ne sais pas') || lower.includes('flou') || lower.includes('not sure')) {
    return {
      reply: isEn
        ? 'Thank you for your candor — that is very common. Would you like to discuss it by voice? Tap the microphone button and tell me about your current brand challenges in two minutes so we can map a clear identity refresh.'
        : 'Merci pour cette franchise — c’est un cas très courant. Que diriez-vous qu’on en parle de vive voix ? Vous pouvez appuyer sur le bouton micro et m’expliquer votre situation en deux minutes ; je vous proposerai ensuite une démarche de rafraîchissement d’identité claire.',
      detectedLang: isEn ? 'en' : 'fr',
      detectedNeed: 'Refonte ou diagnostic d’image de marque',
      painPoint: 'Image institutionnelle à moderniser',
      recommendedServiceSlug: 'conseil-communication',
      recommendedAction: 'voice_invite',
      prefillNotes: 'Diagnostic d’image et rafraîchissement d’identité visuelle.',
      sessionSummary: 'Besoin flou détecté — invitation bascule vocale.',
    };
  }

  if (lower.includes('impression') || lower.includes('rapport') || lower.includes('brochure') || lower.includes('print')) {
    return {
      reply: isEn
        ? 'Yes, digital and offset printing is one of our core pillars — business cards, brochures, annual reports and large formats. To guide you best, what is the nature of your project, your target deadline and estimated run size?'
        : 'Oui, l’impression numérique et offset est l’un de nos métiers historiques — cartes de visite, brochures, rapports annuels et grands formats. Pour vous orienter au mieux : quelle est la nature exacte de votre projet, pour quelle organisation et à quelle échéance ?',
      detectedLang: isEn ? 'en' : 'fr',
      detectedNeed: 'Impression numérique ou offset',
      painPoint: 'Qualité d’impression et respect des délais',
      recommendedServiceSlug: 'impression-numerique-offset',
      recommendedAction: 'devis',
      prefillNotes: `Projet d'impression consulté depuis ${currentPath}`,
      sessionSummary: 'Intérêt confirmé pour impression numérique/offset.',
    };
  }

  return {
    reply: isEn
      ? 'Welcome to CONCAM Agency. We advise organizations in Conakry across four pillars: Communication Advisory, Institutional Manuals, Corporate Merchandise, and Digital & Offset Printing. Which project are you planning and on what timeline?'
      : 'Bienvenue chez CONCAM. Nous accompagnons entreprises et institutions à Conakry sur quatre pôles : Conseil en communication, Manuels et supports, Marquage publicitaire, et Impression numérique & offset. Quel projet souhaitez-vous lancer et pour quelle échéance ?',
    detectedLang: isEn ? 'en' : 'fr',
    detectedNeed: '',
    painPoint: '',
    recommendedServiceSlug: '',
    recommendedAction: 'none',
    prefillNotes: '',
    sessionSummary: 'Premier échange d’accueil.',
  };
}
