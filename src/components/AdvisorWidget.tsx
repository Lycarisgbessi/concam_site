import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquareText,
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  ArrowRight,
  PhoneCall,
  Star,
  MessageCircle,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useSite } from '../context/SiteContext';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: 'text' | 'voice';
  action?: 'none' | 'devis' | 'whatsapp' | 'rappel' | 'voice_invite';
  recommendedServiceSlug?: string;
  prefillNotes?: string;
}

function floatTo16BitPcmBase64(float32: Float32Array): string {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64PcmToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const len = bytes.byteLength / 2;
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = view.getInt16(i * 2, true) / 32768;
  }
  return out;
}

export function AdvisorWidget() {
  const {
    data,
    lang,
    chatOpen,
    setChatOpen,
    chatDraftPrompt,
    setChatDraftPrompt,
    openQuoteModal,
    pagesVisited,
    trackEvent,
  } = useSite();
  const location = useLocation();

  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem('concam_chat_sid');
    if (existing) return existing;
    const created = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem('concam_chat_sid', created);
    return created;
  });

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Voice mode states
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'fallback_recording'>('idle');
  const [liveUserSubtitle, setLiveUserSubtitle] = useState('');
  const [liveAiSubtitle, setLiveAiSubtitle] = useState('');
  const [voiceError, setVoiceError] = useState('');

  // Callback mini-form inside widget
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [cbName, setCbName] = useState('');
  const [cbPhone, setCbPhone] = useState('');
  const [cbEmail, setCbEmail] = useState('');
  const [cbConsent, setCbConsent] = useState(false);
  const [cbSent, setCbSent] = useState(false);

  // Optional satisfaction
  const [rating, setRating] = useState<number | null>(null);

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fallbackChunksRef = useRef<Blob[]>([]);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  // Contextual welcome message based on visited page
  useEffect(() => {
    if (messages.length > 0) return;
    const currentService = data?.services.find((s) => location.pathname.includes(`/services/${s.slug}`));
    const welcome = currentService
      ? lang === 'en'
        ? `Hello, I am your CONCAM Advisor. You are viewing ${currentService.titleEn} — what project timeline or specifications do you have in mind?`
        : `Bonjour, je suis votre Conseiller CONCAM. Vous consultez notre pôle ${currentService.titleFr} : quel projet souhaitez-vous chiffrer ou cadrer ?`
      : lang === 'en'
      ? data?.chatbotConfig.welcomeEn ||
        'Hello and welcome to CONCAM. I am your CONCAM Advisor: what communication or printing project are you planning?'
      : data?.chatbotConfig.welcomeFr ||
        'Bonjour et bienvenue chez CONCAM. Je suis votre Conseiller CONCAM : quel projet de communication ou d’impression souhaitez-vous lancer ?';

    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: welcome,
        mode: 'text',
      },
    ]);
  }, [data, lang, location.pathname, messages.length]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveUserSubtitle, liveAiSubtitle]);

  // Handle pre-filled prompt triggered from page buttons
  useEffect(() => {
    if (chatDraftPrompt && chatOpen) {
      setInput(chatDraftPrompt);
      setChatDraftPrompt('');
    }
  }, [chatDraftPrompt, chatOpen, setChatDraftPrompt]);

  if (location.pathname.startsWith('/admin')) return null;

  const stopVoiceSession = () => {
    setVoiceActive(false);
    setVoiceStatus('idle');
    setLiveUserSubtitle('');
    setLiveAiSubtitle('');
    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }
    wsRef.current = null;
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    micStreamRef.current = null;
    try {
      inputCtxRef.current?.close();
      outputCtxRef.current?.close();
    } catch {
      // ignore
    }
    inputCtxRef.current = null;
    outputCtxRef.current = null;
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const sendTextMessage = async (textToSend?: string) => {
    const clean = (textToSend ?? input).trim();
    if (!clean || sending) return;
    if (!textToSend) setInput('');

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: clean,
      mode: 'text',
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: clean,
          lang,
          currentPath: location.pathname,
          pagesVisited,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: json.reply,
          mode: 'text',
          action: json.recommendedAction,
          recommendedServiceSlug: json.recommendedServiceSlug,
          prefillNotes: json.prefillNotes,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: p(
            'Une erreur réseau est survenue. Vous pouvez réessayer ou poursuivre directement sur WhatsApp.',
            'A network error occurred. Please retry or continue directly on WhatsApp.',
          ),
          mode: 'text',
          action: 'whatsapp',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const startVoiceFallbackRecorder = async (stream: MediaStream) => {
    setVoiceError(
      p(
        'Connexion directe instable : mode vocal par tour activé (enregistrement puis réponse vocale).',
        'Live stream unstable: switched to push-turn voice mode automatically.',
      ),
    );
    setVoiceStatus('fallback_recording');
    fallbackChunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) fallbackChunksRef.current.push(ev.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(fallbackChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = String(reader.result || '').split(',')[1];
        if (!base64) return;
        setSending(true);
        try {
          const res = await fetch('/api/chat/voice-turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              audioBase64: base64,
              mimeType: blob.type,
              lang,
              currentPath: location.pathname,
              pagesVisited,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Fallback error');

          setMessages((prev) => [
            ...prev,
            { id: `vu-${Date.now()}`, role: 'user', content: json.transcript, mode: 'voice' },
            {
              id: `va-${Date.now()}`,
              role: 'assistant',
              content: json.reply,
              mode: 'voice',
              action: json.recommendedAction,
              recommendedServiceSlug: json.recommendedServiceSlug,
              prefillNotes: json.prefillNotes,
            },
          ]);

          if (json.audioWavBase64) {
            const audio = new Audio(`data:audio/wav;base64,${json.audioWavBase64}`);
            audio.play().catch(() => {});
          }
        } catch {
          setVoiceError(
            p(
              'Le mode vocal a basculé vers le mode écrit sans perte de votre historique.',
              'Voice switched to text mode seamlessly without losing history.',
            ),
          );
          stopVoiceSession();
        } finally {
          setSending(false);
        }
      };
      reader.readAsDataURL(blob);
    };
    recorder.start();
  };

  const toggleVoiceMode = async () => {
    if (voiceActive) {
      if (voiceStatus === 'fallback_recording' && mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        setVoiceActive(false);
        setVoiceStatus('idle');
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        return;
      }
      stopVoiceSession();
      return;
    }

    if (data && !data.chatbotConfig.voiceEnabled) {
      setVoiceError(p('Le mode vocal est désactivé par l’administrateur.', 'Voice mode is currently disabled.'));
      return;
    }

    setVoiceError('');
    setVoiceActive(true);
    setVoiceStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/api/live-voice?lang=${lang}&path=${encodeURIComponent(location.pathname)}&sessionId=${encodeURIComponent(sessionId)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextPlayTimeRef.current = outputCtx.currentTime;

      let userAcc = '';
      let aiAcc = '';

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          ws.close();
          startVoiceFallbackRecorder(stream);
          return;
        }
        if (msg.ready) {
          setVoiceStatus('listening');
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          source.connect(processor);
          processor.connect(inputCtx.destination);
          processor.onaudioprocess = (ev) => {
            if (ws.readyState === WebSocket.OPEN) {
              const b64 = floatTo16BitPcmBase64(ev.inputBuffer.getChannelData(0));
              ws.send(JSON.stringify({ audio: b64 }));
            }
          };
        }
        if (msg.inputTranscript) {
          userAcc += msg.inputTranscript;
          setLiveUserSubtitle(userAcc);
        }
        if (msg.outputTranscript) {
          aiAcc += msg.outputTranscript;
          setLiveAiSubtitle(aiAcc);
        }
        if (msg.interrupted) {
          // Barge-in: stop active playback immediately
          activeSourcesRef.current.forEach((s) => {
            try {
              s.stop();
            } catch {
              // ignore
            }
          });
          activeSourcesRef.current = [];
          nextPlayTimeRef.current = outputCtx.currentTime;
          setVoiceStatus('listening');
        }
        if (msg.audio) {
          setVoiceStatus('speaking');
          const float32 = base64PcmToFloat32(msg.audio);
          const buffer = outputCtx.createBuffer(1, float32.length, 24000);
          buffer.getChannelData(0).set(float32);
          const source = outputCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(outputCtx.destination);
          const startAt = Math.max(nextPlayTimeRef.current, outputCtx.currentTime);
          source.start(startAt);
          nextPlayTimeRef.current = startAt + buffer.duration;
          activeSourcesRef.current.push(source);
          source.onended = () => {
            activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
            if (activeSourcesRef.current.length === 0) setVoiceStatus('listening');
          };
        }
        if (msg.turnComplete) {
          const finalU = userAcc.trim();
          const finalA = aiAcc.trim();
          if (finalU || finalA) {
            setMessages((prev) => [
              ...prev,
              ...(finalU ? [{ id: `vu-${Date.now()}`, role: 'user' as const, content: finalU, mode: 'voice' as const }] : []),
              ...(finalA ? [{ id: `va-${Date.now() + 1}`, role: 'assistant' as const, content: finalA, mode: 'voice' as const }] : []),
            ]);
          }
          userAcc = '';
          aiAcc = '';
          setLiveUserSubtitle('');
          setLiveAiSubtitle('');
        }
      };

      ws.onerror = () => {
        startVoiceFallbackRecorder(stream);
      };
    } catch {
      setVoiceError(
        p(
          'Accès au microphone indisponible — vous pouvez poursuivre la conversation par écrit.',
          'Microphone access unavailable — please continue via text chat.',
        ),
      );
      stopVoiceSession();
    }
  };

  const handleOpenWhatsAppSummary = (notes?: string) => {
    const waNum = (data?.settings.whatsappNumber || '+224622857035').replace(/[^\d]/g, '');
    const summaryText = notes || messages.slice(-2).map((m) => m.content).join(' | ').slice(0, 300);
    const fullMsg = p(
      `Bonjour CONCAM, suite à mon échange avec Conseiller CONCAM : ${summaryText}`,
      `Hello CONCAM, following my chat with CONCAM Advisor: ${summaryText}`,
    );
    fetch('/api/chat/outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, outcome: 'whatsapp' }),
    }).catch(() => {});
    trackEvent('whatsapp_click', 'chatbot_transfer');
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(fullMsg)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbConsent) return;
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cbName,
        phone: cbPhone,
        email: cbEmail,
        message: messages.slice(-4).map((m) => `${m.role}: ${m.content}`).join('\n'),
        source: 'chatbot',
        consentRgpd: true,
      }),
    });
    await fetch('/api/chat/outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, outcome: 'rappel' }),
    });
    setCbSent(true);
  };

  const handleRating = (stars: number) => {
    setRating(stars);
    fetch('/api/chat/outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, satisfaction: stars }),
    }).catch(() => {});
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence mode="wait">
        {!chatOpen ? (
          <motion.button
            key="advisor-trigger"
            type="button"
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => {
              setChatOpen(true);
              trackEvent('chatbot_open', location.pathname);
            }}
            className="magnetic-sheen inline-flex items-center gap-2.5 px-4 py-3 bg-[#931916] hover:bg-[#A30013] border border-white/20 text-white font-semibold text-sm rounded-[4px] shadow-[0_14px_34px_rgba(17,13,12,0.45)] transition-colors cursor-pointer"
          >
            <MessageSquareText className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
            <span className="whitespace-nowrap">{p('Conseiller CONCAM', 'CONCAM Advisor')}</span>
          </motion.button>
        ) : (
          <motion.div
            key="advisor-dialog"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-[92vw] sm:w-[395px] h-[545px] max-h-[82vh] bg-page text-ink border border-hairline rounded-[4px] shadow-[0_28px_72px_rgba(0,0,0,0.55)] flex flex-col overflow-hidden"
            role="dialog"
            aria-label="Conseiller CONCAM"
          >
            {/* Header */}
            <div className="bg-[#110D0C] border-b border-[#931916] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Conseiller CONCAM</h3>
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/75 font-medium">
                  {p('Conseil commercial · Texte & Voix FR/EN', 'Commercial Advisor · Text & Voice FR/EN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopVoiceSession();
                  setChatOpen(false);
                }}
                aria-label={p('Fermer le conseiller', 'Close advisor')}
                className="p-1.5 text-[#D6CEC2] hover:text-white hover:bg-white/10 rounded-[4px] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-page">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-[4px] text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#931916] text-white border border-[#931916]'
                        : 'bg-surface text-ink border border-hairline shadow-xs'
                    }`}
                  >
                    {m.mode === 'voice' && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide mr-1.5 font-semibold ${
                          m.role === 'user' ? 'text-white/90' : 'text-[#931916]'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" /> {p('Voix', 'Voice')} ·
                      </span>
                    )}
                    {m.content}
                  </div>

                  {/* Commercial Conversion Actions */}
                  {m.role === 'assistant' && m.action && m.action !== 'none' && (
                    <div className="mt-2 flex flex-wrap gap-2 max-w-[90%]">
                      {(m.action === 'devis' || m.recommendedServiceSlug) && (
                        <button
                          type="button"
                          onClick={() => {
                            fetch('/api/chat/outcome', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ sessionId, outcome: 'devis' }),
                            }).catch(() => {});
                            openQuoteModal({
                              serviceSlug: m.recommendedServiceSlug || undefined,
                              notes: m.prefillNotes || m.content.slice(0, 180),
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] transition-colors cursor-pointer"
                        >
                          {p('Ouvrir le devis pré-rempli', 'Open Pre-filled Quote')}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppSummary(m.prefillNotes)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#25D366] hover:bg-[#20bd5b] text-[#110D0C] rounded-[4px] transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {p('Transférer sur WhatsApp', 'Continue on WhatsApp')}
                      </button>

                      {m.action === 'rappel' && (
                        <button
                          type="button"
                          onClick={() => setShowCallbackForm(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface border border-hairline hover:border-[#931916] text-ink rounded-[4px] transition-colors cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-[#931916]" />
                          {p('Planifier un rappel', 'Schedule Callback')}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Live Voice Subtitles */}
              {voiceActive && (liveUserSubtitle || liveAiSubtitle) && (
                <div className="space-y-1.5 pt-2 border-t border-hairline">
                  {liveUserSubtitle && (
                    <p className="text-xs text-muted italic text-right">{liveUserSubtitle}</p>
                  )}
                  {liveAiSubtitle && (
                    <p className="text-xs text-ink font-medium bg-limestone border border-[#931916]/35 px-3 py-2 rounded-[4px]">
                      {liveAiSubtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Inline Callback Capture */}
              {showCallbackForm && (
                <form onSubmit={handleCallbackSubmit} className="bg-surface border border-hairline p-3.5 rounded-[4px] space-y-2.5">
                  {cbSent ? (
                    <p className="text-xs text-[#931916] font-semibold">
                      {p('Rappel planifié ! Un conseiller vous contactera rapidement.', 'Callback scheduled! An advisor will reach out shortly.')}
                    </p>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-ink">
                        {p('Vos coordonnées pour rappel', 'Your callback details')}
                      </p>
                      <input
                        type="text"
                        required
                        value={cbName}
                        onChange={(e) => setCbName(e.target.value)}
                        placeholder={p('Nom complet', 'Full name')}
                        className="w-full px-2.5 py-1.5 text-xs bg-page text-ink placeholder:text-faint border border-hairline rounded-[4px] focus:border-[#931916] focus:outline-none"
                      />
                      <input
                        type="tel"
                        required
                        value={cbPhone}
                        onChange={(e) => setCbPhone(e.target.value)}
                        placeholder="+224 ..."
                        className="w-full px-2.5 py-1.5 text-xs bg-page text-ink placeholder:text-faint border border-hairline rounded-[4px] focus:border-[#931916] focus:outline-none"
                      />
                      <input
                        type="email"
                        required
                        value={cbEmail}
                        onChange={(e) => setCbEmail(e.target.value)}
                        placeholder={p('Courriel', 'Email')}
                        className="w-full px-2.5 py-1.5 text-xs bg-page text-ink placeholder:text-faint border border-hairline rounded-[4px] focus:border-[#931916] focus:outline-none"
                      />
                      <label className="flex items-start gap-1.5 text-[11px] text-muted">
                        <input type="checkbox" checked={cbConsent} onChange={(e) => setCbConsent(e.target.checked)} required className="mt-0.5 accent-[#931916]" />
                        <span>{p('Accord RGPD pour ce rappel', 'Consent for callback')}</span>
                      </label>
                      <button
                        type="submit"
                        className="w-full py-1.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] transition-colors cursor-pointer"
                      >
                        {p('Confirmer le rappel', 'Confirm Callback')}
                      </button>
                    </>
                  )}
                </form>
              )}

              {sending && (
                <div className="text-xs text-[#931916] italic">
                  {p('Conseiller CONCAM rédige sa réponse...', 'CONCAM Advisor is typing...')}
                </div>
              )}
              <div ref={listEndRef} />
            </div>

            {/* Voice Status / Error Strip */}
            {(voiceActive || voiceError) && (
              <div className="px-3 py-2 bg-limestone border-t border-[#931916]/35 text-[11px] text-ink flex items-center justify-between gap-2">
                <span className="truncate font-medium">
                  {voiceError ||
                    (voiceStatus === 'connecting'
                      ? p('Connexion vocale en cours...', 'Connecting voice...')
                      : voiceStatus === 'speaking'
                      ? p('Conseiller parle — parlez pour interrompre', 'Advisor speaking — speak to interrupt')
                      : voiceStatus === 'fallback_recording'
                      ? p('Enregistrement en cours — recliquez micro pour envoyer', 'Recording — click mic to send')
                      : p('Micro actif — je vous écoute', 'Mic live — listening'))}
                </span>
                {voiceActive && (
                  <button
                    type="button"
                    onClick={stopVoiceSession}
                    className="underline font-semibold shrink-0 text-[#931916] cursor-pointer"
                  >
                    {p('Arrêter', 'Stop')}
                  </button>
                )}
              </div>
            )}

            {/* Satisfaction strip after 3+ messages */}
            {messages.length >= 4 && rating === null && (
              <div className="px-3 py-1.5 bg-limestone border-t border-hairline flex items-center justify-between text-[11px] text-muted">
                <span>{p('Échange utile ?', 'Helpful chat?')}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleRating(n)}
                      aria-label={`${n} étoiles`}
                      className="p-0.5 text-faint hover:text-[#931916] transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendTextMessage();
              }}
              className="p-3 bg-surface border-t border-hairline flex items-center gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={toggleVoiceMode}
                title={p('Mode vocal conversationnel', 'Conversational voice mode')}
                aria-label={p('Activer le micro', 'Toggle voice microphone')}
                className={`p-2.5 rounded-[4px] border transition-colors cursor-pointer shrink-0 ${
                  voiceActive
                    ? 'bg-[#931916] text-white border-[#931916]'
                    : 'bg-page text-ink border-hairline hover:border-[#931916]'
                }`}
              >
                {voiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={p('Décrivez votre besoin...', 'Describe your project...')}
                className="flex-1 px-3 py-2 text-sm bg-page text-ink placeholder:text-faint border border-hairline rounded-[4px] focus:border-[#931916] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label={p('Envoyer', 'Send')}
                className="p-2.5 bg-[#931916] hover:bg-[#A30013] disabled:opacity-40 text-white rounded-[4px] transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
