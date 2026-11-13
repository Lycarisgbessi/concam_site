import 'dotenv/config';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import {
  initDatabase,
  getPublicSiteData,
  getSettings,
  saveSettings,
  getMediaHub,
  saveMediaHub,
  getPageContent,
  savePageContent,
  getChatbotConfig,
  saveChatbotConfig,
  getServices,
  upsertService,
  deleteService,
  getGalleryCategories,
  upsertGalleryCategory,
  deleteGalleryCategory,
  countGalleryItemsInCategory,
  getGalleryItems,
  upsertGalleryItem,
  deleteGalleryItem,
  getBlogPosts,
  upsertBlogPost,
  deleteBlogPost,
  getSeoConfigs,
  upsertSeoConfig,
  getRedirects,
  upsertRedirect,
  deleteRedirect,
  getKbDocuments,
  upsertKbDocument,
  deleteKbDocument,
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  purgeExpiredLeads,
  unsubscribeLead,
  getOrCreateChatSession,
  getChatSession,
  appendChatMessage,
  updateChatSessionMeta,
  getAllChatSessions,
  deleteChatSession,
  recordAnalyticsEvent,
  getAnalyticsSummary,
  findUserByEmail,
  findUserById,
  updateUserPassword,
  setUserTotp,
  getAdminUsers,
  createAdminUser,
  updateAdminUserRole,
  addAuditLog,
  getAuditLogs,
  searchPublishedContent,
  createDatabaseBackup,
  listDatabaseBackups,
  getBackupContent,
  ensureDailyBackup,
  restoreDatabaseBackup,
  rebuildRagIndex,
} from './server/db.ts';
import {
  buildAdvisorSystemInstruction,
  generateCommercialReply,
  retrieveRelevantKnowledge,
  synthesizeSpeechWav,
  transcribeAudioBase64,
} from './server/ai.ts';
import {
  getOrCreateSessionSecret,
  generateTotpSecret,
  verifyTotpToken,
  buildTotpOtpAuthUri,
} from './server/security.ts';
import { generateInstitutionalBrochurePdf } from './server/pdfBrochure.ts';
import type { AdminRole, Lang, MediaHeadline } from './src/types/concam.ts';

const IS_VERCEL = Boolean(process.env.VERCEL);

// Lazy one-time database bootstrap (schema + seed), shared by the classic server
// boot and the Vercel serverless handler — runs once per warm instance.
let dbReadyPromise: Promise<void> | null = null;
export function dbReady(): Promise<void> {
  if (!dbReadyPromise) {
    dbReadyPromise = initDatabase().catch((err) => {
      dbReadyPromise = null;
      throw err;
    });
  }
  return dbReadyPromise;
}

// Local scratch directory for uploaded media (fallback when no blob storage).
// Serverless hosts only expose /tmp as writable.
const uploadsDir = IS_VERCEL ? '/tmp/concam-uploads' : path.join(process.cwd(), 'data', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
// Derive the real client IP when running behind exactly one reverse proxy (nginx, Vercel…).
// Without this, req.ip is the proxy address and every visitor shares one rate-limit bucket.
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 3000);

// Every request waits for the one-time schema/seed bootstrap (per warm instance).
app.use(async (_req, res, next) => {
  try {
    await dbReady();
    next();
  } catch (err) {
    console.error('Database bootstrap error:', err);
    res.status(500).json({ error: 'Initialisation de la base de données impossible.' });
  }
});
const SESSION_SECRET = getOrCreateSessionSecret();
const COOKIE_NAME = 'concam_session';

// Security & compression middleware
app.use(compression());
app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'microphone=(self), geolocation=()');
  // 'unsafe-inline' remains required for the JSON-LD scripts injected by SeoHead;
  // 'unsafe-eval' was dropped — no bundled code relies on eval/new Function.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; frame-src 'self' https://www.openstreetmap.org; connect-src 'self' ws: wss: https:;",
  );
  next();
});

// Serve uploaded images & videos with HTTP Range (206) support
app.use(
  '/uploads',
  express.static(uploadsDir, {
    acceptRanges: true,
    maxAge: '7d',
  }),
);

// Simple in-memory rate limiter with periodic cleanup
// (cleanup timer only on classic servers — timers block serverless freezing).
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
if (!IS_VERCEL) {
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of rateBuckets.entries()) {
      if (b.resetAt < now) rateBuckets.delete(k);
    }
  }, 5 * 60 * 1000).unref();
}

function rateLimit(maxPerMinute: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
      if (maxPerMinute < 1) {
        return res.status(429).json({ error: 'Trop de requêtes. Veuillez patienter une minute.' });
      }
      return next();
    }
    if (bucket.count >= maxPerMinute) {
      return res.status(429).json({ error: 'Trop de requêtes. Veuillez patienter une minute.' });
    }
    bucket.count += 1;
    next();
  };
}

// Signed session tokens
interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  exp: number;
}

function signSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySession(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: SessionPayload;
    }
  }
}

function requireRole(allowedRoles: AdminRole[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = verifySession(req.cookies?.[COOKIE_NAME]);
    if (!session) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }
    // Revalidate the account on every request so a disabled user loses access immediately,
    // instead of keeping a valid session cookie for up to 24h.
    const dbUser = await findUserById(session.userId);
    if (!dbUser) {
      return res.status(401).json({ error: 'Compte désactivé ou supprimé.' });
    }
    if (!allowedRoles.includes(session.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes pour cette action.' });
    }
    req.adminUser = session;
    next();
  };
}

// Dynamic 301 Redirects middleware
app.use(async (req, res, next) => {
  try {
    if (req.path.startsWith('/api/') || req.path.startsWith('/assets/')) return next();
    const rules = await getRedirects();
    const match = rules.find((r) => r.fromPath === req.path);
    if (match) {
      return res.redirect(match.statusCode || 301, match.toPath);
    }
  } catch (err) {
    console.error('Redirect middleware error:', err);
  }
  next();
});

// ==================== PUBLIC ROUTES ====================

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'concam-web', timestamp: new Date().toISOString() });
});

app.get('/api/public/site-data', async (_req, res) => {
  res.json(await getPublicSiteData());
});

app.get('/api/public/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const lang: Lang = req.query.lang === 'en' ? 'en' : 'fr';
  res.json({ query: q, results: await searchPublishedContent(q, lang) });
});

app.get('/api/public/brochure.pdf', async (req, res) => {
  try {
    const lang: Lang = req.query.lang === 'en' ? 'en' : 'fr';
    const [settings, services, gallery, pageContent, mediaHub] = await Promise.all([
      getSettings(),
      getServices(false),
      getGalleryItems(false),
      getPageContent(),
      getMediaHub(),
    ]);
    const pdfBuffer = await generateInstitutionalBrochurePdf({
      lang,
      settings,
      services,
      gallery,
      pageContent,
      mediaHub,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="CONCAM-Plaquette-Institutionnelle-${lang.toUpperCase()}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Brochure PDF generation error:', err);
    res.status(500).json({ error: 'Impossible de générer la plaquette PDF.' });
  }
});

// Cached multi-site media headlines aggregator (tolerant to mediainfopro.net unavailability)
let mediaFeedCache: { fetchedAt: number; items: MediaHeadline[]; sourceStatus: Record<string, string> } | null = null;

async function fetchRssHeadlines(url: string, source: 'reussite' | 'mediainfopro', sourceName: string): Promise<{ items: MediaHeadline[]; ok: boolean }> {
  try {
    // Only public http(s) origins are allowed — blocks file:// and other exotic schemes
    // that could be configured from the media-hub admin module.
    const parsedOrigin = new URL(url);
    if (parsedOrigin.protocol !== 'https:' && parsedOrigin.protocol !== 'http:') {
      return { items: [], ok: false };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`${url.replace(/\/$/, '')}/feed/`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CONCAM-Hub/1.0' },
    });
    clearTimeout(timer);
    if (!resp.ok) return { items: [], ok: false };
    const xml = await resp.text();
    const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, 3);
    const parsed: MediaHeadline[] = itemMatches.map((m, idx) => {
      const block = m[1];
      const titleMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
      const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const rawTitle = (titleMatch?.[1] || titleMatch?.[2] || 'Article').replace(/<[^>]+>/g, '').trim();
      const rawDate = dateMatch?.[1] ? new Date(dateMatch[1]).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      return {
        id: `${source}-live-${idx}`,
        source,
        sourceName,
        titleFr: rawTitle,
        titleEn: rawTitle,
        date: rawDate,
        url: linkMatch?.[1]?.trim() || url,
        liveFetched: true,
      };
    });
    return { items: parsed, ok: parsed.length > 0 };
  } catch {
    return { items: [], ok: false };
  }
}

app.get('/api/public/media-feed', async (_req, res) => {
  const hub = await getMediaHub();
  if (mediaFeedCache && Date.now() - mediaFeedCache.fetchedAt < 10 * 60 * 1000) {
    return res.json(mediaFeedCache);
  }

  const items: MediaHeadline[] = [];
  const sourceStatus: Record<string, string> = {};

  if (hub.reussiteMagazineEnabled && hub.reussiteMagazineUrl) {
    const r = await fetchRssHeadlines(hub.reussiteMagazineUrl, 'reussite', 'Réussite Magazine');
    if (r.ok) {
      items.push(...r.items);
      sourceStatus.reussite = 'online';
    } else {
      sourceStatus.reussite = 'fallback';
    }
  }

  if (hub.mediaInfoProEnabled && hub.mediaInfoProUrl) {
    const m = await fetchRssHeadlines(hub.mediaInfoProUrl, 'mediainfopro', 'MediaInfoPro');
    if (m.ok) {
      items.push(...m.items);
      sourceStatus.mediainfopro = 'online';
    } else {
      sourceStatus.mediainfopro = 'pending_dns';
    }
  }

  // Always ensure 3 clean editorial cards when feeds are unavailable or partial
  const fallbackItems: MediaHeadline[] = [
    {
      id: 'fallback-rm-1',
      source: 'reussite',
      sourceName: 'Réussite Magazine',
      titleFr: 'Entrepreneuriat en Guinée : comment les PME structurent leur crédibilité institutionnelle',
      titleEn: 'Entrepreneurship in Guinea: how SMEs build institutional credibility',
      date: '2026-11-10',
      url: hub.reussiteMagazineUrl || 'https://reussitemagazine.info',
      liveFetched: false,
    },
    {
      id: 'fallback-rm-2',
      source: 'reussite',
      sourceName: 'Réussite Magazine',
      titleFr: 'Décryptage : transformation des acteurs bancaires et industriels à Conakry',
      titleEn: 'Analysis: transformation of banking and industrial leaders in Conakry',
      date: '2026-11-04',
      url: hub.reussiteMagazineUrl || 'https://reussitemagazine.info',
      liveFetched: false,
    },
    {
      id: 'fallback-mi-1',
      source: hub.mediaInfoProEnabled ? 'mediainfopro' : 'reussite',
      sourceName: hub.mediaInfoProEnabled ? 'MediaInfoPro' : 'Réussite Magazine',
      titleFr: 'Veille économique : les grands chantiers de communication publique et d’investissement',
      titleEn: 'Economic brief: major public communication and investment initiatives',
      date: '2026-10-29',
      url: hub.mediaInfoProEnabled ? hub.mediaInfoProUrl : hub.reussiteMagazineUrl,
      liveFetched: false,
    },
  ];

  for (const fb of fallbackItems) {
    if (items.length >= 3) break;
    if (!hub.mediaInfoProEnabled && fb.source === 'mediainfopro') continue;
    items.push(fb);
  }

  mediaFeedCache = { fetchedAt: Date.now(), items: items.slice(0, 3), sourceStatus };
  res.json(mediaFeedCache);
});

// Lead capture (contact, quote, popups, chatbot)
app.post('/api/leads', rateLimit(25), async (req, res) => {
  const { name, organization, email, phone, serviceSlug, message, source, consentRgpd } = req.body || {};
  if (!consentRgpd) {
    return res.status(400).json({ error: 'Le consentement explicite RGPD est requis.' });
  }
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Adresse courriel invalide.' });
  }
  const cleanName = String(name || '').trim() || (source === 'popup_newsletter' ? 'Abonné Veille Économique' : '');
  if (!cleanName) {
    return res.status(400).json({ error: 'Le nom est requis.' });
  }

  const allowedSources = ['contact_form', 'quote_form', 'popup_quote', 'popup_brochure', 'popup_newsletter', 'chatbot'];
  const validSource = allowedSources.includes(source) ? source : 'contact_form';

  const lead = await createLead({
    name: cleanName.slice(0, 120),
    organization: String(organization || '').trim().slice(0, 160),
    email: cleanEmail.slice(0, 160),
    phone: String(phone || '').trim().slice(0, 40),
    serviceSlug: String(serviceSlug || '').trim().slice(0, 80),
    message: String(message || '').trim().slice(0, 2000),
    source: validSource,
    consentRgpd: true,
    doubleOptInConfirmed: validSource !== 'popup_newsletter',
  });

  await recordAnalyticsEvent('lead_created', validSource, serviceSlug || validSource);

  res.status(201).json({
    ok: true,
    leadId: lead.id,
    requiresDoubleOptIn: validSource === 'popup_newsletter',
    confirmUrl: validSource === 'popup_newsletter' ? `/api/leads/confirm?id=${encodeURIComponent(lead.id)}` : null,
  });
});

app.get('/api/leads/confirm', rateLimit(20), async (req, res) => {
  const id = String(req.query.id || '');
  const updated = await updateLead(id, { doubleOptInConfirmed: true });
  if (!updated) {
    return res.status(404).send('Lien de confirmation expiré ou introuvable.');
  }
  res.send(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Confirmation Réussite Magazine</title></head><body style="font-family:sans-serif;max-width:520px;margin:60px auto;padding:24px;border:1px solid #E1DFDE;border-radius:6px"><h1 style="color:#931916">Abonnement confirmé</h1><p>Votre inscription à la veille économique de Réussite Magazine (Groupe CONCAM) est confirmée.</p><p style="font-size:13px;color:#6E6B6B"><a href="/desinscription?id=${encodeURIComponent(id)}" style="color:#6E6B6B">Se désinscrire</a> · <a href="/" style="color:#A30013">Retour au site CONCAM</a></p></body></html>`,
  );
});

app.post('/api/leads/unsubscribe', rateLimit(20), async (req, res) => {
  const id = typeof req.body?.id === 'string' ? req.body.id : undefined;
  const email = typeof req.body?.email === 'string' ? req.body.email : undefined;
  if (!id && !email) {
    return res.status(400).json({ error: 'Adresse courriel ou identifiant requis.' });
  }
  const removed = await unsubscribeLead({ id, email });
  res.json({ ok: true, removed });
});

app.post('/api/analytics', rateLimit(120), async (req, res) => {
  const { eventType, path: pathStr, label, value } = req.body || {};
  if (!eventType || typeof eventType !== 'string') {
    return res.status(400).json({ error: 'eventType requis.' });
  }
  await recordAnalyticsEvent(
    eventType.slice(0, 40),
    String(pathStr || '/').slice(0, 160),
    String(label || '').slice(0, 120),
    typeof value === 'number' && Number.isFinite(value) ? value : null,
  );
  res.json({ ok: true });
});

// Chatbot Text & Voice Fallback Routes
app.post('/api/chat/message', rateLimit(40), async (req, res) => {
  try {
    const { sessionId, message, lang, currentPath, pagesVisited, mode } = req.body || {};
    const cleanMsg = String(message || '').trim();
    if (!cleanMsg) {
      return res.status(400).json({ error: 'Message vide.' });
    }

    const sid = String(sessionId || `sess-${Date.now()}`);
    const visitorLang: Lang = lang === 'en' ? 'en' : 'fr';
    const session = await getOrCreateChatSession(sid, visitorLang, Array.isArray(pagesVisited) ? pagesVisited : [currentPath || '/']);

    await appendChatMessage(sid, 'user', cleanMsg, mode === 'voice' ? 'voice' : 'text');

    const history = (session.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await generateCommercialReply({
      message: cleanMsg,
      history,
      lang: visitorLang,
      currentPath: String(currentPath || '/'),
    });

    await appendChatMessage(sid, 'assistant', result.reply, mode === 'voice' ? 'voice' : 'text');

    const outcomeMap: Record<string, 'en_cours' | 'devis' | 'whatsapp' | 'rappel'> = {
      devis: 'devis',
      whatsapp: 'whatsapp',
      rappel: 'rappel',
    };

    await updateChatSessionMeta(sid, {
      detectedNeed: result.detectedNeed || session.detectedNeed,
      painPoint: result.painPoint || session.painPoint,
      recommendedService: result.recommendedServiceSlug || session.recommendedService,
      outcome: outcomeMap[result.recommendedAction] || session.outcome,
      summary: result.sessionSummary || session.summary,
    });

    res.json({
      sessionId: sid,
      ...result,
    });
  } catch (err) {
    console.error('Chat message error:', err);
    res.status(500).json({ error: 'Le conseiller IA rencontre une indisponibilité momentanée.' });
  }
});

app.post('/api/chat/voice-turn', rateLimit(20), async (req, res) => {
  try {
    const { sessionId, audioBase64, mimeType, lang, currentPath, pagesVisited } = req.body || {};
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio manquant.' });
    }
    const transcript = await transcribeAudioBase64(String(audioBase64), String(mimeType || 'audio/webm'));
    if (!transcript) {
      return res.status(422).json({ error: 'Audio inaudible. Veuillez réessayer ou écrire votre message.' });
    }

    const sid = String(sessionId || `sess-${Date.now()}`);
    const visitorLang: Lang = lang === 'en' ? 'en' : 'fr';
    const session = await getOrCreateChatSession(sid, visitorLang, Array.isArray(pagesVisited) ? pagesVisited : [currentPath || '/']);

    await appendChatMessage(sid, 'user', transcript, 'voice');
    const history = (session.messages || []).map((m) => ({ role: m.role, content: m.content }));
    const result = await generateCommercialReply({
      message: transcript,
      history,
      lang: visitorLang,
      currentPath: String(currentPath || '/'),
    });

    await appendChatMessage(sid, 'assistant', result.reply, 'voice');
    await updateChatSessionMeta(sid, {
      detectedNeed: result.detectedNeed || session.detectedNeed,
      painPoint: result.painPoint || session.painPoint,
      recommendedService: result.recommendedServiceSlug || session.recommendedService,
      summary: result.sessionSummary || session.summary,
    });

    const audioWavBase64 = await synthesizeSpeechWav(result.reply, result.detectedLang);

    res.json({
      sessionId: sid,
      transcript,
      audioWavBase64,
      ...result,
    });
  } catch (err) {
    console.error('Voice turn error:', err);
    res.status(503).json({
      error: 'Mode vocal momentanément indisponible — bascule automatique vers le mode écrit.',
      fallbackToText: true,
    });
  }
});

app.post('/api/chat/outcome', async (req, res) => {
  const { sessionId, outcome, satisfaction } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId requis.' });
  await updateChatSessionMeta(String(sessionId), {
    outcome: outcome || undefined,
    satisfaction: typeof satisfaction === 'number' ? satisfaction : undefined,
  });
  res.json({ ok: true });
});

// Dynamic SEO Sitemap & Robots.txt
app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL')
    ? process.env.APP_URL.replace(/\/$/, '')
    : `${req.protocol}://${req.get('host')}`;
  const [services, posts] = await Promise.all([getServices(false), getBlogPosts(false)]);
  const staticRoutes = [
    '',
    '/a-propos',
    '/services',
    '/presse-edition',
    '/galerie',
    '/actualites-conseils',
    '/contact',
    '/recherche',
    '/mentions-legales',
    '/confidentialite',
  ];

  const allUrls = [
    ...staticRoutes,
    ...services.map((s) => `/services/${s.slug}`),
    ...posts.map((p) => `/actualites-conseils/${p.slug}`),
  ];

  const entries = allUrls
    .map((u) => {
      const frLoc = `${baseUrl}${u || '/'}`;
      const enLoc = `${baseUrl}/en${u}`;
      return `  <url>
    <loc>${frLoc}</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${frLoc}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${frLoc}"/>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${enLoc}</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${frLoc}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}"/>
    <changefreq>weekly</changefreq>
  </url>`;
    })
    .join('\n');

  res.setHeader('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  const baseUrl = (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL')
    ? process.env.APP_URL.replace(/\/$/, '')
    : `${req.protocol}://${req.get('host')}`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

// ==================== AUTH & ADMIN ROUTES ====================

interface Pending2faPayload {
  userId: string;
  purpose: '2fa_login';
  exp: number;
}

function signPending2fa(userId: string): string {
  const payload: Pending2faPayload = { userId, purpose: '2fa_login', exp: Date.now() + 5 * 60 * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyPending2fa(token: string): Pending2faPayload | null {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as Pending2faPayload;
    if (parsed.purpose !== '2fa_login' || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function issueSessionCookie(res: express.Response, user: { id: string; email: string; name: string; role: AdminRole }) {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const token = signSession(payload);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

app.post('/api/auth/login', rateLimit(15), async (req, res) => {
  const { email, password } = req.body || {};
  const user = await findUserByEmail(String(email || ''));
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }
  if (user.totp_enabled && user.totp_secret) {
    return res.json({
      requires2fa: true,
      pendingToken: signPending2fa(user.id),
      email: user.email,
    });
  }
  issueSessionCookie(res, user);
  await addAuditLog(user.email, user.role, 'LOGIN', 'auth', 'session', 'Connexion au tableau de bord');
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      totpEnabled: Boolean(user.totp_enabled),
    },
  });
});

app.post('/api/auth/verify-2fa', rateLimit(15), async (req, res) => {
  const { pendingToken, code } = req.body || {};
  const pending = verifyPending2fa(String(pendingToken || ''));
  if (!pending) {
    return res.status(401).json({ error: 'Jeton 2FA expiré. Veuillez vous reconnecter.' });
  }
  const user = await findUserById(pending.userId);
  if (!user || !user.totp_enabled || !user.totp_secret) {
    return res.status(401).json({ error: 'Utilisateur ou 2FA introuvable.' });
  }
  if (!verifyTotpToken(user.totp_secret, String(code || ''))) {
    return res.status(401).json({ error: 'Code d’authentification à 6 chiffres invalide.' });
  }
  issueSessionCookie(res, user);
  await addAuditLog(user.email, user.role, 'LOGIN_2FA', 'auth', 'totp', 'Connexion validée par double authentification (2FA)');
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      totpEnabled: true,
    },
  });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res) => {
  const session = verifySession(req.cookies?.[COOKIE_NAME]);
  if (!session) return res.status(401).json({ user: null });
  const dbUser = await findUserById(session.userId);
  if (!dbUser) return res.status(401).json({ user: null });
  res.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      totpEnabled: Boolean(dbUser.totp_enabled),
    },
  });
});

app.post('/api/auth/change-password', requireRole(['admin', 'editor', 'commercial']), async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe (min. 8 caractères) requis.' });
  }
  const user = await findUserById(req.adminUser!.userId);
  if (!user || !bcrypt.compareSync(String(currentPassword), user.password_hash)) {
    return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
  }
  await updateUserPassword(user.id, String(newPassword));
  await addAuditLog(user.email, user.role, 'PASSWORD_CHANGE', 'user', user.email, 'Mot de passe modifié par l’utilisateur');
  res.json({ ok: true });
});

app.post('/api/admin/2fa/setup', requireRole(['admin', 'editor', 'commercial']), async (req, res) => {
  const user = await findUserById(req.adminUser!.userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  const secret = generateTotpSecret();
  await setUserTotp(user.id, secret, false);
  const otpAuthUrl = buildTotpOtpAuthUri(user.email, secret);
  const qrDataUrl = await QRCode.toDataURL(otpAuthUrl, { width: 220, margin: 1 });
  res.json({ secret, otpAuthUrl, qrDataUrl });
});

app.post('/api/admin/2fa/enable', requireRole(['admin', 'editor', 'commercial']), async (req, res) => {
  const user = await findUserById(req.adminUser!.userId);
  if (!user || !user.totp_secret) {
    return res.status(400).json({ error: 'Veuillez d’abord initialiser la configuration 2FA.' });
  }
  if (!verifyTotpToken(user.totp_secret, String(req.body?.code || ''))) {
    return res.status(400).json({ error: 'Code à 6 chiffres incorrect.' });
  }
  await setUserTotp(user.id, user.totp_secret, true);
  await addAuditLog(user.email, user.role, 'ENABLE_2FA', 'user', user.email, 'Double authentification TOTP activée');
  res.json({ ok: true, totpEnabled: true });
});

app.post('/api/admin/2fa/disable', requireRole(['admin', 'editor', 'commercial']), async (req, res) => {
  const user = await findUserById(req.adminUser!.userId);
  if (!user || !bcrypt.compareSync(String(req.body?.password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Mot de passe requis pour désactiver la 2FA.' });
  }
  await setUserTotp(user.id, '', false);
  await addAuditLog(user.email, user.role, 'DISABLE_2FA', 'user', user.email, 'Double authentification TOTP désactivée');
  res.json({ ok: true, totpEnabled: false });
});

// Media upload (images & MP4/WebM videos up to 35 MB)
app.post(
  '/api/admin/upload-media',
  requireRole(['admin', 'editor']),
  express.raw({
    type: ['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp'],
    limit: '35mb',
  }),
  async (req, res) => {
    const body = req.body as Buffer;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({ error: 'Fichier vide ou type MIME non supporté (MP4, WebM, JPEG, PNG, WebP).' });
    }
    const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const extMap: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const ext = extMap[contentType];
    if (!ext) {
      return res.status(400).json({ error: 'Format non pris en charge.' });
    }
    const rawHeaderName = String(req.headers['x-filename'] || `media${ext}`);
    const baseName = path
      .basename(rawHeaderName, path.extname(rawHeaderName))
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 48) || 'media';
    const filename = `${Date.now()}-${baseName}${ext}`;
    const mediaType = contentType.startsWith('video/') ? 'video' : 'image';

    // On serverless hosts the filesystem is ephemeral: store media in Vercel Blob
    // when a token is configured, otherwise fall back to the local disk.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`concam/${filename}`, body, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
      });
      await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPLOAD', 'media', filename, `Téléversement média blob (${mediaType}, ${(body.length / 1024).toFixed(0)} Ko)`);
      res.json({
        ok: true,
        url: blob.url,
        mediaType,
        sizeBytes: body.length,
      });
      return;
    }

    const targetPath = path.join(uploadsDir, filename);
    fs.writeFileSync(targetPath, body);
    await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPLOAD', 'media', filename, `Téléversement média (${mediaType}, ${(body.length / 1024).toFixed(0)} Ko)`);
    res.json({
      ok: true,
      url: `/uploads/${filename}`,
      mediaType,
      sizeBytes: body.length,
    });
  },
);

// Admin Overview & Full State
app.get('/api/admin/overview', requireRole(['admin', 'editor', 'commercial']), async (req, res) => {
  const role = req.adminUser!.role;
  const [analytics, leads, chatSessions, settings, mediaHub, services, galleryCategories, galleryItems, pageContent, blogPosts, seoConfigs, redirects, chatbotConfig, kbDocuments, users, auditLogs] =
    await Promise.all([
      getAnalyticsSummary(),
      role === 'editor' ? Promise.resolve([]) : getLeads(),
      role === 'editor' ? Promise.resolve([]) : getAllChatSessions(),
      getSettings(),
      getMediaHub(),
      getServices(true),
      getGalleryCategories(),
      getGalleryItems(true),
      getPageContent(),
      getBlogPosts(true),
      getSeoConfigs(),
      getRedirects(),
      getChatbotConfig(),
      role === 'editor' ? Promise.resolve([]) : getKbDocuments(),
      role === 'admin' ? getAdminUsers() : Promise.resolve([]),
      role === 'admin' ? getAuditLogs(100) : Promise.resolve([]),
    ]);
  const backups = role === 'admin' ? listDatabaseBackups() : [];

  res.json({
    role,
    analytics,
    leads,
    chatSessions,
    settings,
    mediaHub,
    services,
    galleryCategories,
    galleryItems,
    pageContent,
    blogPosts,
    seoConfigs,
    redirects,
    chatbotConfig,
    kbDocuments,
    users,
    auditLogs,
    backups,
  });
});

// 1. Contacts & Settings
app.put('/api/admin/settings', requireRole(['admin']), async (req, res) => {
  await saveSettings(req.body);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPDATE', 'settings', 'all', 'Mise à jour coordonnées et paramètres globaux');
  res.json({ ok: true, settings: await getSettings() });
});

// 2. Services
app.post('/api/admin/services', requireRole(['admin', 'editor']), async (req, res) => {
  await upsertService(req.body);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPSERT', 'service', req.body.slug, `Service enregistré : ${req.body.titleFr}`);
  res.json({ ok: true, services: await getServices(true) });
});

app.delete('/api/admin/services/:id', requireRole(['admin']), async (req, res) => {
  await deleteService(req.params.id);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'DELETE', 'service', req.params.id, `Service supprimé : ${req.params.id}`);
  res.json({ ok: true, services: await getServices(true) });
});

// 3. Gallery & Categories
app.post('/api/admin/gallery/categories', requireRole(['admin', 'editor']), async (req, res) => {
  await upsertGalleryCategory(req.body);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPSERT', 'gallery_category', req.body.slug, `Catégorie galerie : ${req.body.nameFr}`);
  res.json({ ok: true, categories: await getGalleryCategories() });
});

app.delete('/api/admin/gallery/categories/:id', requireRole(['admin']), async (req, res) => {
  // Refuse deletion while items still reference the category — prevents orphaned gallery items.
  const itemCount = await countGalleryItemsInCategory(req.params.id);
  if (itemCount > 0) {
    return res.status(409).json({
      error: `Impossible de supprimer : ${itemCount} réalisation(s) sont encore rattachées à cette catégorie. Déplacez-les d'abord.`,
    });
  }
  await deleteGalleryCategory(req.params.id);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'DELETE', 'gallery_category', req.params.id, `Catégorie supprimée`);
  res.json({ ok: true, categories: await getGalleryCategories() });
});

app.post('/api/admin/gallery/items', requireRole(['admin', 'editor']), async (req, res) => {
  await upsertGalleryItem(req.body);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPSERT', 'gallery_item', req.body.id, `Réalisation : ${req.body.titleFr}`);
  res.json({ ok: true, items: await getGalleryItems(true) });
});

app.delete('/api/admin/gallery/items/:id', requireRole(['admin', 'editor']), async (req, res) => {
  await deleteGalleryItem(req.params.id);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'DELETE', 'gallery_item', req.params.id, `Réalisation supprimée`);
  res.json({ ok: true, items: await getGalleryItems(true) });
});

// 4. Pages, Blocks & Blog
app.put('/api/admin/pages', requireRole(['admin', 'editor']), async (req, res) => {
  await savePageContent(req.body);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPDATE', 'pages', 'home/about', 'Contenus pages et ordre des blocs mis à jour');
  res.json({ ok: true, pageContent: await getPageContent() });
});

app.post('/api/admin/blog', requireRole(['admin', 'editor']), async (req, res) => {
  await upsertBlogPost(req.body);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPSERT', 'blog', req.body.slug, `Article : ${req.body.titleFr}`);
  res.json({ ok: true, posts: await getBlogPosts(true) });
});

app.delete('/api/admin/blog/:id', requireRole(['admin', 'editor']), async (req, res) => {
  await deleteBlogPost(req.params.id);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'DELETE', 'blog', req.params.id, `Article supprimé`);
  res.json({ ok: true, posts: await getBlogPosts(true) });
});

// 5. Media Hub & Live RSS check
app.put('/api/admin/media-hub', requireRole(['admin', 'editor']), async (req, res) => {
  await saveMediaHub(req.body);
  mediaFeedCache = null; // bust feed cache immediately
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPDATE', 'media_hub', 'gateways', 'Paramètres passerelles médias mis à jour');
  res.json({ ok: true, mediaHub: await getMediaHub() });
});

app.get('/api/admin/media-hub/check-rss', requireRole(['admin', 'editor']), async (_req, res) => {
  const hub = await getMediaHub();
  const reussite = hub.reussiteMagazineUrl
    ? await fetchRssHeadlines(hub.reussiteMagazineUrl, 'reussite', 'Réussite Magazine')
    : { items: [], ok: false };
  const mediainfopro = hub.mediaInfoProUrl
    ? await fetchRssHeadlines(hub.mediaInfoProUrl, 'mediainfopro', 'MediaInfoPro')
    : { items: [], ok: false };
  res.json({
    reussite: { ok: reussite.ok, count: reussite.items.length },
    mediainfopro: { ok: mediainfopro.ok, count: mediainfopro.items.length },
  });
});

// 6. Prospects / Leads & CSV Export
app.post('/api/admin/leads', requireRole(['admin', 'commercial']), async (req, res) => {
  const { name, organization, email, phone, serviceSlug, message, notes } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Nom et adresse courriel requis.' });
  }
  const lead = await createLead({
    name: String(name).trim().slice(0, 120),
    organization: String(organization || '').trim().slice(0, 160),
    email: String(email).trim().slice(0, 160),
    phone: String(phone || '').trim().slice(0, 40),
    serviceSlug: String(serviceSlug || '').trim().slice(0, 80),
    message: String(message || '').trim().slice(0, 2000),
    source: 'admin_manual',
    consentRgpd: true,
    doubleOptInConfirmed: true,
  });
  if (notes) {
    await updateLead(lead.id, { notes: String(notes).slice(0, 1000) });
  }
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'CREATE', 'lead', lead.id, `Prospect ajouté manuellement : ${lead.name}`);
  res.status(201).json({ ok: true, leads: await getLeads() });
});

app.post('/api/admin/leads/purge-expired', requireRole(['admin']), async (req, res) => {
  const purged = await purgeExpiredLeads();
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'PURGE', 'lead', 'rgpd', `Purge RGPD manuelle : ${purged} prospect(s) expiré(s)`);
  res.json({ ok: true, purged, leads: await getLeads() });
});

app.patch('/api/admin/leads/:id', requireRole(['admin', 'commercial']), async (req, res) => {
  const updated = await updateLead(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Prospect introuvable.' });
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPDATE', 'lead', req.params.id, `Statut : ${updated.status}`);
  res.json({ ok: true, lead: updated });
});

app.delete('/api/admin/leads/:id', requireRole(['admin']), async (req, res) => {
  await deleteLead(req.params.id);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'DELETE', 'lead', req.params.id, `Prospect supprimé (RGPD)`);
  res.json({ ok: true });
});

app.get('/api/admin/leads/export', requireRole(['admin', 'commercial']), async (_req, res) => {
  const leads = await getLeads();
  // Neutralise spreadsheet formula injection (=, +, -, @) by prefixing a single quote.
  const escapeCsv = (v: string) => {
    const s = String(v || '');
    const guarded = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${guarded.replace(/"/g, '""')}"`;
  };
  const header = ['ID', 'Date', 'Nom', 'Organisation', 'Courriel', 'Téléphone', 'Service', 'Source', 'Statut', 'RGPD', 'DoubleOptIn', 'Message', 'Notes'];
  const rows = leads.map((l) =>
    [
      l.id,
      l.createdAt,
      l.name,
      l.organization,
      l.email,
      l.phone,
      l.serviceSlug,
      l.source,
      l.status,
      l.consentRgpd ? 'Oui' : 'Non',
      l.doubleOptInConfirmed ? 'Oui' : 'En attente',
      l.message,
      l.notes,
    ]
      .map(escapeCsv)
      .join(','),
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="concam-prospects.csv"');
  res.send('\uFEFF' + [header.join(','), ...rows].join('\n'));
});

// 7. Chatbot Config & KB
app.put('/api/admin/chatbot/config', requireRole(['admin']), async (req, res) => {
  await saveChatbotConfig(req.body);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPDATE', 'chatbot_config', 'settings', 'Réglages chatbot mis à jour');
  res.json({ ok: true, chatbotConfig: await getChatbotConfig() });
});

app.post('/api/admin/chatbot/kb', requireRole(['admin', 'commercial']), async (req, res) => {
  await upsertKbDocument({
    id: req.body.id || `kb-${Date.now()}`,
    title: req.body.title,
    category: req.body.category || 'commercial_playbook',
    content: req.body.content,
    active: req.body.active !== false,
    autoIndexed: false,
  });
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPSERT', 'kb_document', req.body.title, 'Document RAG ajouté/modifié');
  res.json({ ok: true, kbDocuments: await getKbDocuments() });
});

app.delete('/api/admin/chatbot/kb/:id', requireRole(['admin']), async (req, res) => {
  await deleteKbDocument(req.params.id);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'DELETE', 'kb_document', req.params.id, 'Document RAG supprimé');
  res.json({ ok: true, kbDocuments: await getKbDocuments() });
});

app.delete('/api/admin/chat-sessions/:id', requireRole(['admin']), async (req, res) => {
  await deleteChatSession(req.params.id);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'DELETE', 'chat_session', req.params.id, 'Conversation chatbot supprimée');
  res.json({ ok: true, chatSessions: await getAllChatSessions() });
});

// 9. Users, Audit Export & PostgreSQL JSON Backups
app.post('/api/admin/users', requireRole(['admin']), async (req, res) => {
  const { email, name, role, password } = req.body || {};
  if (!email || !name || !password || password.length < 8) {
    return res.status(400).json({ error: 'Email, nom et mot de passe (min 8 car.) requis.' });
  }
  const user = await createAdminUser({ email, name, role, password });
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'CREATE', 'user', email, `Compte créé (${role})`);
  res.status(201).json({ ok: true, user, users: await getAdminUsers() });
});

app.patch('/api/admin/users/:id', requireRole(['admin']), async (req, res) => {
  await updateAdminUserRole(req.params.id, req.body.role, req.body.active !== false);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPDATE', 'user', req.params.id, `Rôle/statut modifié`);
  res.json({ ok: true, users: await getAdminUsers() });
});

app.get('/api/admin/audit/export', requireRole(['admin']), async (_req, res) => {
  const logs = await getAuditLogs(500);
  // Neutralise spreadsheet formula injection (=, +, -, @) by prefixing a single quote.
  const esc = (v: string) => {
    const s = String(v || '');
    const guarded = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${guarded.replace(/"/g, '""')}"`;
  };
  const header = ['Date', 'Acteur', 'Rôle', 'Action', 'Entité', 'Champ', 'Résumé'];
  const rows = logs.map((l) => [l.createdAt, l.actorEmail, l.actorRole, l.action, l.entity, l.field, l.summary].map(esc).join(','));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="concam-audit-logs.csv"');
  res.send('\uFEFF' + [header.join(','), ...rows].join('\n'));
});

app.get('/api/admin/backups', requireRole(['admin']), (_req, res) => {
  res.json({ backups: listDatabaseBackups() });
});

app.post('/api/admin/backups', requireRole(['admin']), async (req, res) => {
  const backup = await createDatabaseBackup('manual');
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'BACKUP', 'database', backup.filename, `Instantané base créé (${Math.round(backup.sizeBytes / 1024)} Ko)`);
  res.json({ ok: true, backup, backups: listDatabaseBackups() });
});

app.get('/api/admin/backups/:filename', requireRole(['admin']), async (req, res) => {
  const content = await getBackupContent(req.params.filename);
  if (!content) return res.status(404).json({ error: 'Archive introuvable.' });
  const cleanName = path.basename(String(req.params.filename || 'backup.json')).replace(/[/\\]/g, '');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${cleanName}"`);
  res.send(content);
});

app.post('/api/admin/backups/:filename/restore', requireRole(['admin']), async (req, res) => {
  try {
    const result = await restoreDatabaseBackup(req.params.filename);
    await rebuildRagIndex();
    await addAuditLog(
      req.adminUser!.email,
      req.adminUser!.role,
      'RESTORE',
      'database',
      req.params.filename,
      `Base restaurée depuis ${req.params.filename} (filet sécurité : ${result.preRestoreSnapshot})`,
    );
    res.json({ ok: true, preRestoreSnapshot: result.preRestoreSnapshot, backups: listDatabaseBackups() });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur de restauration.' });
  }
});

// 10. SEO & Redirects
app.put('/api/admin/seo', requireRole(['admin', 'editor']), async (req, res) => {
  await upsertSeoConfig(req.body);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPDATE', 'seo', req.body.routeKey, `Métadonnées SEO : ${req.body.routeKey}`);
  res.json({ ok: true, seoConfigs: await getSeoConfigs() });
});

app.post('/api/admin/redirects', requireRole(['admin']), async (req, res) => {
  await upsertRedirect({
    id: req.body.id || `red-${Date.now()}`,
    fromPath: req.body.fromPath,
    toPath: req.body.toPath,
    statusCode: Number(req.body.statusCode || 301),
  });
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'UPSERT', 'redirect', req.body.fromPath, `Redirection 301 ajoutée`);
  res.json({ ok: true, redirects: await getRedirects() });
});

app.delete('/api/admin/redirects/:id', requireRole(['admin']), async (req, res) => {
  await deleteRedirect(req.params.id);
  await addAuditLog(req.adminUser!.email, req.adminUser!.role, 'DELETE', 'redirect', req.params.id, `Redirection supprimée`);
  res.json({ ok: true, redirects: await getRedirects() });
});

// Unknown API paths must return JSON 404 — registered after all routes so it
// applies in every runtime (local server and Vercel serverless handler alike).
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route API introuvable.' });
});

// ==================== REAL-TIME VOICE LIVE API WEBSOCKET ====================
// WebSocket upgrade is impossible on serverless hosts (Vercel): the client's
// AdvisorWidget automatically falls back to the per-turn HTTP voice mode.
// This section only runs on the classic local/standalone server.

function attachRealtimeVoice(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  // Gemini Live guard rails: per-IP concurrent connections, connection rate,
  // maximum session duration and inbound message budget. Each session consumes a
  // streaming Live API slot, so unbounded access would be a cost/abuse vector.
  const VOICE_MAX_CONCURRENT_PER_IP = 3;
  const VOICE_MAX_CONNECTIONS_PER_MINUTE = 10;
  const VOICE_MAX_SESSION_MS = 10 * 60 * 1000;
  const VOICE_MAX_INBOUND_MESSAGES = 6000;
  const voiceConnectionsByIp = new Map<string, { count: number }>();
  const voiceConnectionTimestamps = new Map<string, number[]>();

  function voiceConnectionAllowed(ip: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const timestamps = (voiceConnectionTimestamps.get(ip) || []).filter((t) => now - t < 60_000);
    if (timestamps.length >= VOICE_MAX_CONNECTIONS_PER_MINUTE) {
      voiceConnectionTimestamps.set(ip, timestamps);
      return { allowed: false, reason: 'voice_rate_limited' };
    }
    timestamps.push(now);
    voiceConnectionTimestamps.set(ip, timestamps);
    const entry = voiceConnectionsByIp.get(ip);
    if (entry && entry.count >= VOICE_MAX_CONCURRENT_PER_IP) {
      return { allowed: false, reason: 'voice_busy' };
    }
    return { allowed: true };
  }

  function voiceConnectionOpen(ip: string) {
    const entry = voiceConnectionsByIp.get(ip) || { count: 0 };
    entry.count += 1;
    voiceConnectionsByIp.set(ip, entry);
  }

  function voiceConnectionClose(ip: string) {
    const entry = voiceConnectionsByIp.get(ip);
    if (entry) {
      entry.count = Math.max(0, entry.count - 1);
      if (entry.count === 0) voiceConnectionsByIp.delete(ip);
    }
  }

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '/', `http://${request.headers.host}`);
    if (url.pathname === '/api/live-voice') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, url);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket, url: URL) => {
  const clientIp = (clientWs as unknown as { _socket?: { remoteAddress?: string } })._socket?.remoteAddress || 'unknown';
  const guard = voiceConnectionAllowed(clientIp);
  if (!guard.allowed) {
    clientWs.send(JSON.stringify({ error: guard.reason }));
    clientWs.close();
    return;
  }
  voiceConnectionOpen(clientIp);

  const lang = (url.searchParams.get('lang') === 'en' ? 'en' : 'fr') as Lang;
  const currentPath = url.searchParams.get('path') || '/';
  const sessionId = url.searchParams.get('sessionId') || `voice-${Date.now()}`;
  const apiKey = process.env.GEMINI_API_KEY;

  const closeVoiceSession = () => {
    voiceConnectionClose(clientIp);
  };
  clientWs.on('close', closeVoiceSession);
  clientWs.on('error', closeVoiceSession);

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !(await getChatbotConfig()).voiceEnabled) {
    clientWs.send(JSON.stringify({ error: 'voice_unavailable' }));
    clientWs.close();
    return;
  }

  await getOrCreateChatSession(sessionId, lang, [currentPath]);

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const knowledge = await retrieveRelevantKnowledge(`conseil impression marquage manuels ${currentPath}`);
  const systemInstruction = await buildAdvisorSystemInstruction(lang, currentPath, knowledge);

  let liveSession: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
  let userTranscriptBuffer = '';
  let modelTranscriptBuffer = '';
  let inboundMessages = 0;

  // Hard session timeout — a forgotten open tab must not stream Gemini Live forever.
  const sessionTimer = setTimeout(() => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: 'voice_session_expired' }));
      clientWs.close();
    }
  }, VOICE_MAX_SESSION_MS);

  try {
    liveSession = await ai.live.connect({
      model: process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const content = message.serverContent;
          if (content?.inputTranscription?.text) {
            userTranscriptBuffer += content.inputTranscription.text;
            clientWs.send(JSON.stringify({ inputTranscript: content.inputTranscription.text }));
          }
          if (content?.outputTranscription?.text) {
            modelTranscriptBuffer += content.outputTranscription.text;
            clientWs.send(JSON.stringify({ outputTranscript: content.outputTranscription.text }));
          }
          for (const part of content?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
          }
          if (content?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
          if (content?.turnComplete) {
            if (userTranscriptBuffer.trim()) {
              appendChatMessage(sessionId, 'user', userTranscriptBuffer.trim(), 'voice').catch(() => {});
              userTranscriptBuffer = '';
            }
            if (modelTranscriptBuffer.trim()) {
              appendChatMessage(sessionId, 'assistant', modelTranscriptBuffer.trim(), 'voice').catch(() => {});
              modelTranscriptBuffer = '';
            }
            clientWs.send(JSON.stringify({ turnComplete: true }));
          }
        },
        onerror: (err) => {
          console.error('Live API error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: 'live_error' }));
          }
        },
      },
    });

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ ready: true, sessionId }));
    }
  } catch (err) {
    clearTimeout(sessionTimer);
    console.error('Failed to connect Gemini Live API:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: 'live_connect_failed' }));
      clientWs.close();
    }
    return;
  }

  clientWs.on('message', (raw) => {
    if (!liveSession) return;
    inboundMessages += 1;
    if (inboundMessages > VOICE_MAX_INBOUND_MESSAGES) {
      clientWs.send(JSON.stringify({ error: 'voice_budget_exceeded' }));
      clientWs.close();
      return;
    }
    try {
      const data = JSON.parse(raw.toString());
      if (data.audio) {
        liveSession.sendRealtimeInput({
          audio: { data: data.audio, mimeType: 'audio/pcm;rate=16000' },
        });
      } else if (data.text) {
        liveSession.sendRealtimeInput({ text: String(data.text) });
      }
    } catch {
      // Ignore malformed chunk
    }
  });

  clientWs.on('close', () => {
    clearTimeout(sessionTimer);
    try {
      liveSession?.close();
    } catch {
      // Ignore
    }
  });
  });
}

// ==================== LOCAL / STANDALONE SERVER ====================
// On Vercel the Express app runs as a serverless handler (api/index.ts) and this
// whole section is skipped: no HTTP listener, no WebSocket, no Vite middleware.

async function startLocalServer() {
  await dbReady();
  await ensureDailyBackup().catch(() => {});
  setInterval(() => {
    ensureDailyBackup().catch((err) => console.error('Backup interval error:', err));
  }, 12 * 60 * 60 * 1000).unref();

  const server = http.createServer(app);
  attachRealtimeVoice(server);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!IS_VERCEL) {
    const distDir = path.join(process.cwd(), 'dist');
    app.use(express.static(distDir, { maxAge: '7d' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }
  // NOTE: the /api JSON-404 catch-all and the Vercel rewrites are registered at
  // module scope and in vercel.json respectively — nothing else needed here.

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CONCAM institutional server running on http://0.0.0.0:${PORT}`);
  });
}

if (!IS_VERCEL) {
  startLocalServer().catch((err) => {
    console.error('Fatal boot error:', err);
    process.exit(1);
  });
}

export { app };
