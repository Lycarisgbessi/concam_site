import pg from 'pg';
import bcrypt from 'bcryptjs';
import {
  INITIAL_SETTINGS,
  INITIAL_MEDIA_HUB,
  INITIAL_SERVICES,
  INITIAL_GALLERY_CATEGORIES,
  INITIAL_GALLERY_ITEMS,
  INITIAL_PAGE_CONTENT,
  INITIAL_BLOG_POSTS,
  INITIAL_SEO_CONFIGS,
  INITIAL_CHATBOT_CONFIG,
  COMMERCIAL_PLAYBOOK_DOCS,
  INITIAL_SAMPLE_LEADS,
} from './seedData.ts';
import type {
  SiteSettings,
  MediaHubConfig,
  ServiceItem,
  GalleryCategory,
  GalleryItem,
  PageContent,
  BlogPost,
  SeoConfig,
  RedirectRule,
  ChatbotConfig,
  KbDocument,
  LeadRecord,
  ChatSessionRecord,
  AdminUser,
  AdminRole,
  AuditLogEntry,
  PublicSiteData,
  BackupSnapshotInfo,
  SearchResultItem,
  Lang,
} from '../src/types/concam.ts';

// ==================== POSTGRESQL (Neon) CONNECTION ====================
// All persistence goes through this pool. DATABASE_URL is required, e.g.:
// postgresql://user:pass@host/dbname?sslmode=require
// The check itself is deferred to initDatabase() so a missing variable surfaces
// as a readable per-request error instead of an opaque module-load crash.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || '',
  // Small pool: Neon (serverless) rewards few long-lived pooled connections.
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 12_000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

async function q<T = pg.QueryResult>(text: string, params: unknown[] = []): Promise<T> {
  const res = await pool.query(text, params as never[]);
  return res as T;
}

async function one<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | undefined> {
  const res = await pool.query(text, params as never[]);
  return res.rows[0] as T | undefined;
}

async function all<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params as never[]);
  return res.rows as T[];
}

const TABLES = [
  'kv_store',
  'services',
  'gallery_categories',
  'gallery_items',
  'blog_posts',
  'seo_configs',
  'redirects',
  'kb_documents',
  'leads',
  'chat_sessions',
  'chat_messages',
  'analytics_events',
  'users',
  'audit_logs',
] as const;

export async function initDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL manquante : définissez la chaîne de connexion PostgreSQL dans les variables d’environnement (voir .env.example).',
    );
  }
  await q(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER NOT NULL,
      published BOOLEAN NOT NULL DEFAULT TRUE,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gallery_categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_fr TEXT NOT NULL,
      name_en TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gallery_items (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INTEGER NOT NULL,
      published BOOLEAN NOT NULL DEFAULT TRUE,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      published BOOLEAN NOT NULL DEFAULT TRUE,
      published_at TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS seo_configs (
      route_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS redirects (
      id TEXT PRIMARY KEY,
      from_path TEXT UNIQUE NOT NULL,
      to_path TEXT NOT NULL,
      status_code INTEGER NOT NULL DEFAULT 301
    );

    CREATE TABLE IF NOT EXISTS kb_documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      auto_indexed BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      organization TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      service_slug TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'nouveau',
      consent_rgpd BOOLEAN NOT NULL DEFAULT TRUE,
      double_opt_in_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      lang TEXT NOT NULL DEFAULT 'fr',
      pages_visited TEXT NOT NULL DEFAULT '[]',
      detected_need TEXT NOT NULL DEFAULT '',
      pain_point TEXT NOT NULL DEFAULT '',
      recommended_service TEXT NOT NULL DEFAULT '',
      outcome TEXT NOT NULL DEFAULT 'en_cours',
      summary TEXT NOT NULL DEFAULT '',
      satisfaction INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'text',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id BIGSERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      path TEXT NOT NULL DEFAULT '/',
      label TEXT NOT NULL DEFAULT '',
      value DOUBLE PRECISION,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      totp_secret TEXT NOT NULL DEFAULT '',
      totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_email TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      field TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_snapshots (
      filename TEXT PRIMARY KEY,
      size_bytes INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events (created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id);
    CREATE INDEX IF NOT EXISTS idx_leads_expires ON leads (expires_at);
  `);

  const now = new Date().toISOString();

  // Seed KV store items if empty
  const ensureKv = async (key: string, val: unknown) => {
    const existing = await one('SELECT key FROM kv_store WHERE key = $1', [key]);
    if (!existing) {
      await q('INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, $3)', [
        key,
        JSON.stringify(val),
        now,
      ]);
    }
  };

  await ensureKv('site_settings', INITIAL_SETTINGS);
  await ensureKv('media_hub', INITIAL_MEDIA_HUB);
  await ensureKv('page_content', INITIAL_PAGE_CONTENT);
  await ensureKv('chatbot_config', INITIAL_CHATBOT_CONFIG);

  // One-time gentle upgrade of default parallaxIntensity -> ultra
  const parallaxMigrated = await one('SELECT key FROM kv_store WHERE key = $1', [
    'parallax_ultra_default_v3',
  ]);
  if (!parallaxMigrated) {
    const row = await one<{ value: string }>('SELECT value FROM kv_store WHERE key = $1', [
      'site_settings',
    ]);
    if (row) {
      try {
        const parsed = JSON.parse(row.value) as SiteSettings;
        if (
          !parsed.parallaxIntensity ||
          parsed.parallaxIntensity === 'cinematic' ||
          parsed.parallaxIntensity === 'intense'
        ) {
          parsed.parallaxIntensity = 'ultra';
          await q('UPDATE kv_store SET value = $1, updated_at = $2 WHERE key = $3', [
            JSON.stringify(parsed),
            now,
            'site_settings',
          ]);
        }
      } catch {
        // ignore parse errors
      }
    }
    await q('INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, $3)', [
      'parallax_ultra_default_v3',
      '1',
      now,
    ]);
  }

  // One-time recalibration (2026-11): the forced "ultra" default from the v3
  // migration was recalibrated — factors were halved, so "cinematic" becomes the
  // balanced default. Only downgrades installations still sitting on the forced
  // ultra; any explicit admin choice made after this point is respected.
  const recalibrated = await one('SELECT key FROM kv_store WHERE key = $1', [
    'parallax_recalibration_v4',
  ]);
  if (!recalibrated) {
    const row = await one<{ value: string }>('SELECT value FROM kv_store WHERE key = $1', [
      'site_settings',
    ]);
    if (row) {
      try {
        const parsed = JSON.parse(row.value) as SiteSettings;
        if (parsed.parallaxIntensity === 'ultra') {
          parsed.parallaxIntensity = 'cinematic';
          await q('UPDATE kv_store SET value = $1, updated_at = $2 WHERE key = $3', [
            JSON.stringify(parsed),
            now,
            'site_settings',
          ]);
        }
      } catch {
        // ignore parse errors
      }
    }
    await q('INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, $3)', [
      'parallax_recalibration_v4',
      '1',
      now,
    ]);
  }

  // One-time migration from legacy /src/assets/images/* placeholders to curated /images/real/* photographs
  const realPhotosMigrated = await one('SELECT key FROM kv_store WHERE key = $1', [
    'real_photography_v1',
  ]);
  if (!realPhotosMigrated) {
    const isLegacyAsset = (url?: string) => !url || url.includes('/src/assets/images/');

    const pcRow = await one<{ value: string }>('SELECT value FROM kv_store WHERE key = $1', [
      'page_content',
    ]);
    if (pcRow) {
      try {
        const parsed = JSON.parse(pcRow.value) as PageContent;
        if (isLegacyAsset(parsed.heroImageUrl)) {
          parsed.heroImageUrl = INITIAL_PAGE_CONTENT.heroImageUrl;
        }
        const keys = ['home', 'about', 'services', 'presse', 'galerie', 'insights', 'contact'] as const;
        const seedHeaders = INITIAL_PAGE_CONTENT.pageHeaders;
        if (seedHeaders) {
          if (!parsed.pageHeaders) {
            parsed.pageHeaders = { ...seedHeaders };
          } else {
            for (const k of keys) {
              const seedSlides = seedHeaders[k];
              if (!seedSlides || seedSlides.length === 0) continue;
              const existingSlides = parsed.pageHeaders[k];
              if (!existingSlides || existingSlides.length === 0) {
                parsed.pageHeaders[k] = seedSlides;
              } else {
                parsed.pageHeaders[k] = existingSlides.map((slide, idx) => {
                  if (isLegacyAsset(slide.imageUrl)) {
                    const fallback = seedSlides[idx] || seedSlides[0];
                    return { ...slide, imageUrl: fallback.imageUrl };
                  }
                  return slide;
                });
              }
            }
          }
        }
        await q('UPDATE kv_store SET value = $1, updated_at = $2 WHERE key = $3', [
          JSON.stringify(parsed),
          now,
          'page_content',
        ]);
      } catch {
        // ignore parse errors
      }
    }

    const srvRows = await all<{ id: string; data: string }>('SELECT id, data FROM services');
    for (const row of srvRows) {
      try {
        const srv = JSON.parse(row.data) as ServiceItem;
        if (isLegacyAsset(srv.imageUrl)) {
          const seedSrv = INITIAL_SERVICES.find((s) => s.id === row.id || s.slug === srv.slug);
          if (seedSrv) {
            srv.imageUrl = seedSrv.imageUrl;
            await q('UPDATE services SET data = $1, updated_at = $2 WHERE id = $3', [
              JSON.stringify(srv),
              now,
              row.id,
            ]);
          }
        }
      } catch {
        // ignore
      }
    }

    const galRows = await all<{ id: string; data: string }>('SELECT id, data FROM gallery_items');
    for (const row of galRows) {
      try {
        const item = JSON.parse(row.data) as GalleryItem;
        const imgs = Array.isArray(item.images) ? item.images : [];
        if (imgs.length === 0 || imgs.some((u) => isLegacyAsset(u))) {
          const seedGal = INITIAL_GALLERY_ITEMS.find((g) => g.id === row.id);
          if (seedGal) {
            item.images = imgs.map((u, i) =>
              isLegacyAsset(u) ? seedGal.images[i % seedGal.images.length] : u,
            );
            if (item.images.length === 0) item.images = [...seedGal.images];
            await q('UPDATE gallery_items SET data = $1, updated_at = $2 WHERE id = $3', [
              JSON.stringify(item),
              now,
              row.id,
            ]);
          }
        }
      } catch {
        // ignore
      }
    }

    const postRows = await all<{ id: string; data: string }>('SELECT id, data FROM blog_posts');
    for (const row of postRows) {
      try {
        const post = JSON.parse(row.data) as BlogPost;
        if (isLegacyAsset(post.imageUrl)) {
          const seedPost = INITIAL_BLOG_POSTS.find((b) => b.id === row.id || b.slug === post.slug);
          if (seedPost) {
            post.imageUrl = seedPost.imageUrl;
            await q('UPDATE blog_posts SET data = $1, updated_at = $2 WHERE id = $3', [
              JSON.stringify(post),
              now,
              row.id,
            ]);
          }
        }
      } catch {
        // ignore
      }
    }

    await q('INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, $3)', [
      'real_photography_v1',
      '1',
      now,
    ]);
  }

  // Seed services
  const srvCount = await one<{ c: string }>('SELECT COUNT(*) as c FROM services');
  if (Number(srvCount?.c || 0) === 0) {
    for (const s of INITIAL_SERVICES) {
      await q(
        'INSERT INTO services (id, slug, sort_order, published, data, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [s.id, s.slug, s.sortOrder, s.published, JSON.stringify(s), now],
      );
    }
  }

  // Seed gallery categories
  const catCount = await one<{ c: string }>('SELECT COUNT(*) as c FROM gallery_categories');
  if (Number(catCount?.c || 0) === 0) {
    for (const c of INITIAL_GALLERY_CATEGORIES) {
      await q(
        'INSERT INTO gallery_categories (id, slug, name_fr, name_en, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [c.id, c.slug, c.nameFr, c.nameEn, c.sortOrder],
      );
    }
  }

  // Seed gallery items
  const galCount = await one<{ c: string }>('SELECT COUNT(*) as c FROM gallery_items');
  if (Number(galCount?.c || 0) === 0) {
    for (const g of INITIAL_GALLERY_ITEMS) {
      await q(
        'INSERT INTO gallery_items (id, category_id, category_slug, featured, sort_order, published, data, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [g.id, g.categoryId, g.categorySlug, g.featured, g.sortOrder, g.published, JSON.stringify(g), now],
      );
    }
  }

  // Seed blog posts
  const postCount = await one<{ c: string }>('SELECT COUNT(*) as c FROM blog_posts');
  if (Number(postCount?.c || 0) === 0) {
    for (const p of INITIAL_BLOG_POSTS) {
      await q(
        'INSERT INTO blog_posts (id, slug, published, published_at, data, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [p.id, p.slug, p.published, p.publishedAt, JSON.stringify(p), now],
      );
    }
  }

  // Seed SEO configs
  const seoCount = await one<{ c: string }>('SELECT COUNT(*) as c FROM seo_configs');
  if (Number(seoCount?.c || 0) === 0) {
    for (const seo of INITIAL_SEO_CONFIGS) {
      await q('INSERT INTO seo_configs (route_key, data, updated_at) VALUES ($1, $2, $3)', [
        seo.routeKey,
        JSON.stringify(seo),
        now,
      ]);
    }
  }

  // Seed Commercial Playbook KB docs
  for (const doc of COMMERCIAL_PLAYBOOK_DOCS) {
    const exists = await one('SELECT id FROM kb_documents WHERE id = $1', [doc.id]);
    if (!exists) {
      await q(
        'INSERT INTO kb_documents (id, title, category, content, active, auto_indexed, updated_at) VALUES ($1, $2, $3, $4, $5, FALSE, $6)',
        [doc.id, doc.title, doc.category, doc.content, doc.active, now],
      );
    }
  }

  // Seed users (3 roles: Administrateur, Éditeur, Commercial)
  // Passwords can be overridden via env (SEED_ADMIN_PASSWORD, SEED_EDITOR_PASSWORD, SEED_SALES_PASSWORD).
  // When the built-in defaults are kept, a console warning is emitted at boot.
  const userCount = await one<{ c: string }>('SELECT COUNT(*) as c FROM users');
  if (Number(userCount?.c || 0) === 0) {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ConcamAdmin2026!';
    const editorPassword = process.env.SEED_EDITOR_PASSWORD || 'ConcamEditeur2026!';
    const salesPassword = process.env.SEED_SALES_PASSWORD || 'ConcamSales2026!';
    if (!process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_EDITOR_PASSWORD || !process.env.SEED_SALES_PASSWORD) {
      console.warn(
        '[SECURITE] Comptes d\'administration créés avec des mots de passe par défaut publics (voir GUIDE_EXPLOITATION_CONCAM.md). ' +
          'Définissez SEED_ADMIN_PASSWORD / SEED_EDITOR_PASSWORD / SEED_SALES_PASSWORD avant le premier démarrage, ' +
          'ou changez les mots de passe immédiatement depuis le module Utilisateurs & Audit.',
      );
    }
    const insertUser =
      'INSERT INTO users (id, email, name, role, password_hash, active, created_at) VALUES ($1, $2, $3, $4, $5, TRUE, $6)';
    await q(insertUser, [
      'usr-admin',
      'admin@concam.gn',
      'Direction CONCAM (Admin)',
      'admin',
      bcrypt.hashSync(adminPassword, 10),
      now,
    ]);
    await q(insertUser, [
      'usr-editor',
      'editeur@concam.gn',
      'Pôle Éditorial (Éditeur)',
      'editor',
      bcrypt.hashSync(editorPassword, 10),
      now,
    ]);
    await q(insertUser, [
      'usr-commercial',
      'commercial@concam.gn',
      'Équipe Commerciale',
      'commercial',
      bcrypt.hashSync(salesPassword, 10),
      now,
    ]);
  }

  // Seed sample leads
  const leadCount = await one<{ c: string }>('SELECT COUNT(*) as c FROM leads');
  if (Number(leadCount?.c || 0) === 0) {
    for (const l of INITIAL_SAMPLE_LEADS) {
      await q(
        `INSERT INTO leads (id, name, organization, email, phone, service_slug, message, source, status, consent_rgpd, double_opt_in_confirmed, notes, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          l.id,
          l.name,
          l.organization,
          l.email,
          l.phone,
          l.serviceSlug,
          l.message,
          l.source,
          l.status,
          l.consentRgpd,
          l.doubleOptInConfirmed,
          l.notes,
          l.createdAt,
          l.expiresAt,
        ],
      );
    }
  }

  // Seed initial analytics baseline
  const analyticsCount = await one<{ c: string }>('SELECT COUNT(*) as c FROM analytics_events');
  if (Number(analyticsCount?.c || 0) === 0) {
    const seeds: Array<[string, string, string, number | null]> = [
      ['pageview', '/', 'Accueil', null],
      ['pageview', '/services/impression-numerique-offset', 'Impression', null],
      ['pageview', '/galerie', 'Galerie', null],
      ['whatsapp_click', '/services/impression-numerique-offset', 'Bouton flottant', null],
      ['media_outbound', '/', 'reussitemagazine.info', null],
      ['cwv_lcp', '/', 'LCP', 1420],
      ['cwv_inp', '/', 'INP', 48],
      ['cwv_cls', '/', 'CLS', 0.02],
    ];
    for (const [t, p, l, v] of seeds) {
      await q(
        'INSERT INTO analytics_events (event_type, path, label, value, created_at) VALUES ($1, $2, $3, $4, $5)',
        [t, p, l, v, now],
      );
    }
  }

  await rebuildRagIndex();
}

async function getKv<T>(key: string, fallback: T): Promise<T> {
  const row = await one<{ value: string }>('SELECT value FROM kv_store WHERE key = $1', [key]);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function setKv(key: string, value: unknown): Promise<void> {
  await q(
    'INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    [key, JSON.stringify(value), new Date().toISOString()],
  );
}

export async function getSettings(): Promise<SiteSettings> {
  const stored = await getKv<Partial<SiteSettings>>('site_settings', INITIAL_SETTINGS);
  return {
    ...INITIAL_SETTINGS,
    ...stored,
    address: { ...INITIAL_SETTINGS.address, ...(stored.address || {}) },
    stats: { ...INITIAL_SETTINGS.stats, ...(stored.stats || {}) },
    partners: Array.isArray(stored.partners) ? stored.partners : INITIAL_SETTINGS.partners,
    phones: Array.isArray(stored.phones) ? stored.phones : INITIAL_SETTINGS.phones,
  };
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await setKv('site_settings', settings);
  await rebuildRagIndex();
}

export async function getMediaHub(): Promise<MediaHubConfig> {
  const stored = await getKv<Partial<MediaHubConfig>>('media_hub', INITIAL_MEDIA_HUB);
  return { ...INITIAL_MEDIA_HUB, ...stored };
}

export async function saveMediaHub(mediaHub: MediaHubConfig): Promise<void> {
  await setKv('media_hub', mediaHub);
  await rebuildRagIndex();
}

export async function getPageContent(): Promise<PageContent> {
  const stored = await getKv<Partial<PageContent>>('page_content', INITIAL_PAGE_CONTENT);
  return {
    ...INITIAL_PAGE_CONTENT,
    ...stored,
    aboutTimeline: Array.isArray(stored.aboutTimeline) ? stored.aboutTimeline : INITIAL_PAGE_CONTENT.aboutTimeline,
    aboutTeam: Array.isArray(stored.aboutTeam) ? stored.aboutTeam : INITIAL_PAGE_CONTENT.aboutTeam,
    homeBlocks: Array.isArray(stored.homeBlocks) ? stored.homeBlocks : INITIAL_PAGE_CONTENT.homeBlocks,
    pageHeaders: {
      ...(INITIAL_PAGE_CONTENT.pageHeaders || {}),
      ...(stored.pageHeaders || {}),
    },
  };
}

export async function savePageContent(content: PageContent): Promise<void> {
  await setKv('page_content', content);
  await rebuildRagIndex();
}

export async function getChatbotConfig(): Promise<ChatbotConfig> {
  return getKv<ChatbotConfig>('chatbot_config', INITIAL_CHATBOT_CONFIG);
}

export async function saveChatbotConfig(cfg: ChatbotConfig): Promise<void> {
  await setKv('chatbot_config', cfg);
}

export async function getServices(includeUnpublished = false): Promise<ServiceItem[]> {
  const rows = await all<{ data: string }>(
    includeUnpublished
      ? 'SELECT data FROM services ORDER BY sort_order ASC'
      : 'SELECT data FROM services WHERE published = TRUE ORDER BY sort_order ASC',
  );
  return rows.map((r) => JSON.parse(r.data) as ServiceItem);
}

export async function upsertService(srv: ServiceItem): Promise<void> {
  await q(
    `INSERT INTO services (id, slug, sort_order, published, data, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, sort_order=excluded.sort_order, published=excluded.published, data=excluded.data, updated_at=excluded.updated_at`,
    [srv.id, srv.slug, srv.sortOrder, srv.published, JSON.stringify(srv), new Date().toISOString()],
  );
  await rebuildRagIndex();
}

export async function deleteService(id: string): Promise<void> {
  await q('DELETE FROM services WHERE id = $1', [id]);
  await rebuildRagIndex();
}

export async function getGalleryCategories(): Promise<GalleryCategory[]> {
  const rows = await all<{
    id: string;
    slug: string;
    name_fr: string;
    name_en: string;
    sort_order: number;
  }>('SELECT id, slug, name_fr, name_en, sort_order FROM gallery_categories ORDER BY sort_order ASC');
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    nameFr: r.name_fr,
    nameEn: r.name_en,
    sortOrder: r.sort_order,
  }));
}

export async function upsertGalleryCategory(cat: GalleryCategory): Promise<void> {
  await q(
    `INSERT INTO gallery_categories (id, slug, name_fr, name_en, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, name_fr=excluded.name_fr, name_en=excluded.name_en, sort_order=excluded.sort_order`,
    [cat.id, cat.slug, cat.nameFr, cat.nameEn, cat.sortOrder],
  );
}

export async function countGalleryItemsInCategory(id: string): Promise<number> {
  const row = await one<{ c: string }>('SELECT COUNT(*) as c FROM gallery_items WHERE category_id = $1', [id]);
  return Number(row?.c || 0);
}

export async function deleteGalleryCategory(id: string): Promise<void> {
  await q('DELETE FROM gallery_categories WHERE id = $1', [id]);
}

export async function getGalleryItems(includeUnpublished = false): Promise<GalleryItem[]> {
  const rows = await all<{ data: string }>(
    includeUnpublished
      ? 'SELECT data FROM gallery_items ORDER BY sort_order ASC'
      : 'SELECT data FROM gallery_items WHERE published = TRUE ORDER BY sort_order ASC',
  );
  return rows.map((r) => JSON.parse(r.data) as GalleryItem);
}

export async function upsertGalleryItem(item: GalleryItem): Promise<void> {
  await q(
    `INSERT INTO gallery_items (id, category_id, category_slug, featured, sort_order, published, data, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id, category_slug=excluded.category_slug, featured=excluded.featured, sort_order=excluded.sort_order, published=excluded.published, data=excluded.data, updated_at=excluded.updated_at`,
    [
      item.id,
      item.categoryId,
      item.categorySlug,
      item.featured,
      item.sortOrder,
      item.published,
      JSON.stringify(item),
      new Date().toISOString(),
    ],
  );
  await rebuildRagIndex();
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await q('DELETE FROM gallery_items WHERE id = $1', [id]);
  await rebuildRagIndex();
}

export async function getBlogPosts(includeUnpublished = false): Promise<BlogPost[]> {
  const rows = await all<{ data: string }>(
    includeUnpublished
      ? 'SELECT data FROM blog_posts ORDER BY published_at DESC'
      : 'SELECT data FROM blog_posts WHERE published = TRUE ORDER BY published_at DESC',
  );
  return rows.map((r) => JSON.parse(r.data) as BlogPost);
}

export async function upsertBlogPost(post: BlogPost): Promise<void> {
  await q(
    `INSERT INTO blog_posts (id, slug, published, published_at, data, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, published=excluded.published, published_at=excluded.published_at, data=excluded.data, updated_at=excluded.updated_at`,
    [post.id, post.slug, post.published, post.publishedAt, JSON.stringify(post), new Date().toISOString()],
  );
  await rebuildRagIndex();
}

export async function deleteBlogPost(id: string): Promise<void> {
  await q('DELETE FROM blog_posts WHERE id = $1', [id]);
  await rebuildRagIndex();
}

export async function getSeoConfigs(): Promise<SeoConfig[]> {
  const rows = await all<{ data: string }>('SELECT data FROM seo_configs');
  return rows.map((r) => JSON.parse(r.data) as SeoConfig);
}

export async function upsertSeoConfig(cfg: SeoConfig): Promise<void> {
  await q(
    `INSERT INTO seo_configs (route_key, data, updated_at)
     VALUES ($1, $2, $3)
     ON CONFLICT(route_key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`,
    [cfg.routeKey, JSON.stringify(cfg), new Date().toISOString()],
  );
}

export async function getRedirects(): Promise<RedirectRule[]> {
  const rows = await all<{
    id: string;
    from_path: string;
    to_path: string;
    status_code: number;
  }>('SELECT id, from_path, to_path, status_code FROM redirects');
  return rows.map((r) => ({
    id: r.id,
    fromPath: r.from_path,
    toPath: r.to_path,
    statusCode: r.status_code,
  }));
}

export async function upsertRedirect(rule: RedirectRule): Promise<void> {
  await q(
    `INSERT INTO redirects (id, from_path, to_path, status_code) VALUES ($1, $2, $3, $4)
     ON CONFLICT(id) DO UPDATE SET from_path=excluded.from_path, to_path=excluded.to_path, status_code=excluded.status_code`,
    [rule.id, rule.fromPath, rule.toPath, rule.statusCode],
  );
}

export async function deleteRedirect(id: string): Promise<void> {
  await q('DELETE FROM redirects WHERE id = $1', [id]);
}

export async function getPublicSiteData(): Promise<PublicSiteData> {
  const [settings, mediaHub, services, galleryCategories, galleryItems, pageContent, blogPosts, seoConfigs, chatbotConfig] =
    await Promise.all([
      getSettings(),
      getMediaHub(),
      getServices(false),
      getGalleryCategories(),
      getGalleryItems(false),
      getPageContent(),
      getBlogPosts(false),
      getSeoConfigs(),
      getChatbotConfig(),
    ]);
  return {
    settings,
    mediaHub,
    services,
    galleryCategories,
    galleryItems,
    pageContent,
    blogPosts,
    seoConfigs,
    chatbotConfig,
  };
}

/**
 * Automatically synchronizes the RAG knowledge base with published site content
 * (single source of truth, guaranteed < 1s vs 5-minute requirement).
 */
export async function rebuildRagIndex(): Promise<void> {
  const now = new Date().toISOString();
  const [settings, mediaHub, services, gallery, pages] = await Promise.all([
    getSettings(),
    getMediaHub(),
    getServices(false),
    getGalleryItems(false),
    getPageContent(),
  ]);

  await q('DELETE FROM kb_documents WHERE auto_indexed = TRUE');

  const insertDoc = `INSERT INTO kb_documents (id, title, category, content, active, auto_indexed, updated_at)
     VALUES ($1, $2, $3, $4, TRUE, TRUE, $5)`;

  // 1. Agency identity & contacts (synchronized with Dashboard Contacts)
  await q(insertDoc, [
    'auto-agency-identity',
    'Identité officielle, coordonnées & références CONCAM',
    'agency',
    `Dénomination : ${settings.companyName} (${settings.brandAlias}).
Forme juridique : ${settings.legalForm}. Fondée en ${settings.foundedYear}, immatriculée en ${settings.registeredYear}.
RCCM : ${settings.rccm}. Identifiants fiscaux : NCC ${settings.ncc} / NIF ${settings.nif} (${settings.taxCategory}).
Siège social : ${settings.address.fr} / ${settings.address.en}.
Téléphones : ${settings.phones.join(' / ')}. Numéro WhatsApp principal : ${settings.whatsappNumber}.
Courriels : ${settings.agencyEmail} (agence), ${settings.magazineEmail} (magazine).
Horaires : ${settings.hoursFr} / ${settings.hoursEn}.
Partenaires et références publiées : ${settings.partners.join(', ')}.
Chiffres clés : ${settings.stats.yearsExperience} ans d'expérience, ${settings.stats.projectsCompleted}+ projets livrés, ${settings.stats.clientsSupported}+ clients institutionnels et privés accompagnés.
Écosystème médias : Réussite Magazine (${mediaHub.reussiteMagazineUrl})${mediaHub.mediaInfoProEnabled ? ` et site média (${mediaHub.mediaInfoProUrl})` : ''}.`,
    now,
  ]);

  // 2. Each published service
  for (const srv of services) {
    const offeringsTxt = srv.offerings.map((o) => `- ${o.titleFr} (${o.titleEn}) : ${o.descFr}`).join('\n');
    const faqTxt = srv.faqs.map((f) => `Q: ${f.questionFr}\nR: ${f.answerFr}`).join('\n');
    await q(insertDoc, [
      `auto-srv-${srv.id}`,
      `Service : ${srv.titleFr} (/services/${srv.slug})`,
      'service',
      `Service FR : ${srv.titleFr} | Service EN : ${srv.titleEn}
URL dédiée : /services/${srv.slug}
Accroche : ${srv.taglineFr}
Résumé : ${srv.summaryFr}
Bénéfices clients : ${srv.benefitsFr.join(' ; ')}
Déclinaisons de l'offre :
${offeringsTxt}
Étapes de réalisation : ${srv.processSteps.map((st) => `${st.step}. ${st.titleFr} (${st.descFr})`).join(' -> ')}
Questions fréquentes :
${faqTxt}`,
      now,
    ]);
  }

  // 3. Published gallery case studies
  const gallerySummary = gallery
    .map(
      (g) =>
        `- ${g.titleFr} (${g.year}, ${g.clientOrSector}) : Besoin: ${g.needFr} | Solution: ${g.solutionFr}`,
    )
    .join('\n');
  await q(insertDoc, [
    'auto-gallery-cases',
    'Réalisations publiées dans la galerie CONCAM',
    'gallery',
    `Exemples de réalisations publiées sur le site (/galerie) :\n${gallerySummary}`,
    now,
  ]);

  // 4. About / Editorial mission
  await q(insertDoc, [
    'auto-about-editorial',
    'Histoire & engagements qualité CONCAM',
    'agency',
    `Histoire : ${pages.aboutIntroFr}\nMission : ${pages.aboutMissionFr}\nEngagements qualité : ${pages.aboutQualityFr}`,
    now,
  ]);
}

export async function getKbDocuments(): Promise<KbDocument[]> {
  const rows = await all<{
    id: string;
    title: string;
    category: KbDocument['category'];
    content: string;
    active: boolean;
    auto_indexed: boolean;
    updated_at: string;
  }>(
    'SELECT id, title, category, content, active, auto_indexed, updated_at FROM kb_documents ORDER BY auto_indexed ASC, updated_at DESC',
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    content: r.content,
    active: Boolean(r.active),
    autoIndexed: Boolean(r.auto_indexed),
    updatedAt: r.updated_at,
  }));
}

export async function upsertKbDocument(doc: Omit<KbDocument, 'updatedAt'>): Promise<void> {
  const now = new Date().toISOString();
  await q(
    `INSERT INTO kb_documents (id, title, category, content, active, auto_indexed, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT(id) DO UPDATE SET title=excluded.title, category=excluded.category, content=excluded.content, active=excluded.active, updated_at=excluded.updated_at`,
    [doc.id, doc.title, doc.category, doc.content, doc.active, doc.autoIndexed, now],
  );
}

export async function deleteKbDocument(id: string): Promise<void> {
  await q('DELETE FROM kb_documents WHERE id = $1 AND auto_indexed = FALSE', [id]);
}

export async function createLead(
  lead: Omit<LeadRecord, 'id' | 'createdAt' | 'expiresAt' | 'status' | 'notes'>,
): Promise<LeadRecord> {
  const now = new Date();
  const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 12 months RGPD retention
  const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record: LeadRecord = {
    ...lead,
    id,
    status: 'nouveau',
    notes: '',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  await q(
    `INSERT INTO leads (id, name, organization, email, phone, service_slug, message, source, status, consent_rgpd, double_opt_in_confirmed, notes, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      record.id,
      record.name,
      record.organization,
      record.email,
      record.phone,
      record.serviceSlug,
      record.message,
      record.source,
      record.status,
      record.consentRgpd,
      record.doubleOptInConfirmed,
      record.notes,
      record.createdAt,
      record.expiresAt,
    ],
  );
  return record;
}

export async function getLeads(): Promise<LeadRecord[]> {
  await purgeExpiredLeads();
  const rows = await all<Record<string, unknown>>('SELECT * FROM leads ORDER BY created_at DESC');
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    organization: String(r.organization),
    email: String(r.email),
    phone: String(r.phone),
    serviceSlug: String(r.service_slug),
    message: String(r.message),
    source: r.source as LeadRecord['source'],
    status: r.status as LeadRecord['status'],
    consentRgpd: Boolean(r.consent_rgpd),
    doubleOptInConfirmed: Boolean(r.double_opt_in_confirmed),
    notes: String(r.notes),
    createdAt: String(r.created_at),
    expiresAt: String(r.expires_at),
  }));
}

export async function updateLead(
  id: string,
  patch: { status?: LeadRecord['status']; notes?: string; doubleOptInConfirmed?: boolean },
): Promise<LeadRecord | null> {
  const existing = await one<Record<string, unknown>>('SELECT * FROM leads WHERE id = $1', [id]);
  if (!existing) return null;
  const status = patch.status ?? String(existing.status);
  const notes = patch.notes ?? String(existing.notes);
  const doi = patch.doubleOptInConfirmed !== undefined ? patch.doubleOptInConfirmed : Boolean(existing.double_opt_in_confirmed);
  await q('UPDATE leads SET status = $1, notes = $2, double_opt_in_confirmed = $3 WHERE id = $4', [
    status,
    notes,
    doi,
    id,
  ]);
  const leads = await getLeads();
  return leads.find((l) => l.id === id) || null;
}

export async function deleteLead(id: string): Promise<void> {
  await q('DELETE FROM leads WHERE id = $1', [id]);
}

export async function purgeExpiredLeads(): Promise<number> {
  const now = new Date().toISOString();
  const res = await q<pg.QueryResult>('DELETE FROM leads WHERE expires_at < $1', [now]);
  return res.rowCount || 0;
}

export async function unsubscribeLead(params: { id?: string; email?: string }): Promise<number> {
  if (params.id) {
    const r = await q<pg.QueryResult>('DELETE FROM leads WHERE id = $1', [params.id]);
    if ((r.rowCount || 0) > 0) return r.rowCount || 0;
  }
  if (params.email) {
    const r = await q<pg.QueryResult>('DELETE FROM leads WHERE lower(email) = lower($1)', [
      params.email.trim(),
    ]);
    return r.rowCount || 0;
  }
  return 0;
}

export async function getOrCreateChatSession(
  sessionId: string,
  lang: 'fr' | 'en',
  pagesVisited: string[],
): Promise<ChatSessionRecord> {
  const existing = await one<Record<string, unknown>>('SELECT * FROM chat_sessions WHERE id = $1', [sessionId]);
  const now = new Date().toISOString();
  if (!existing) {
    await q(
      `INSERT INTO chat_sessions (id, lang, pages_visited, detected_need, pain_point, recommended_service, outcome, summary, satisfaction, created_at, updated_at)
       VALUES ($1, $2, $3, '', '', '', 'en_cours', '', NULL, $4, $5)`,
      [sessionId, lang, JSON.stringify(pagesVisited), now, now],
    );
  } else {
    const prevPages = JSON.parse(String(existing.pages_visited || '[]')) as string[];
    const merged = Array.from(new Set([...prevPages, ...pagesVisited])).slice(-15);
    await q('UPDATE chat_sessions SET lang = $1, pages_visited = $2, updated_at = $3 WHERE id = $4', [
      lang,
      JSON.stringify(merged),
      now,
      sessionId,
    ]);
  }
  return (await getChatSession(sessionId))!;
}

export async function getChatSession(sessionId: string): Promise<ChatSessionRecord | null> {
  const row = await one<Record<string, unknown>>('SELECT * FROM chat_sessions WHERE id = $1', [sessionId]);
  if (!row) return null;
  const msgs = await all<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    mode: 'text' | 'voice';
    created_at: string;
  }>('SELECT id, role, content, mode, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC', [
    sessionId,
  ]);

  return {
    id: String(row.id),
    lang: (row.lang as 'fr' | 'en') || 'fr',
    pagesVisited: JSON.parse(String(row.pages_visited || '[]')) as string[],
    detectedNeed: String(row.detected_need || ''),
    painPoint: String(row.pain_point || ''),
    recommendedService: String(row.recommended_service || ''),
    outcome: (row.outcome as ChatSessionRecord['outcome']) || 'en_cours',
    summary: String(row.summary || ''),
    satisfaction: row.satisfaction !== null && row.satisfaction !== undefined ? Number(row.satisfaction) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    messages: msgs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      mode: m.mode,
      createdAt: m.created_at,
    })),
  };
}

export async function appendChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  mode: 'text' | 'voice' = 'text',
): Promise<void> {
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  await q('INSERT INTO chat_messages (id, session_id, role, content, mode, created_at) VALUES ($1, $2, $3, $4, $5, $6)', [
    id,
    sessionId,
    role,
    content,
    mode,
    now,
  ]);
  await q('UPDATE chat_sessions SET updated_at = $1 WHERE id = $2', [now, sessionId]);
}

export async function updateChatSessionMeta(
  sessionId: string,
  meta: Partial<Pick<ChatSessionRecord, 'detectedNeed' | 'painPoint' | 'recommendedService' | 'outcome' | 'summary' | 'satisfaction'>>,
): Promise<void> {
  const curr = await getChatSession(sessionId);
  if (!curr) return;
  await q(
    `UPDATE chat_sessions SET detected_need = $1, pain_point = $2, recommended_service = $3, outcome = $4, summary = $5, satisfaction = $6, updated_at = $7 WHERE id = $8`,
    [
      meta.detectedNeed ?? curr.detectedNeed,
      meta.painPoint ?? curr.painPoint,
      meta.recommendedService ?? curr.recommendedService,
      meta.outcome ?? curr.outcome,
      meta.summary ?? curr.summary,
      meta.satisfaction !== undefined ? meta.satisfaction : curr.satisfaction,
      new Date().toISOString(),
      sessionId,
    ],
  );
}

export async function getAllChatSessions(): Promise<ChatSessionRecord[]> {
  const rows = await all<{ id: string }>('SELECT id FROM chat_sessions ORDER BY updated_at DESC LIMIT 100');
  const sessions: ChatSessionRecord[] = [];
  for (const r of rows) {
    const s = await getChatSession(r.id);
    if (s) sessions.push(s);
  }
  return sessions;
}

export async function deleteChatSession(id: string): Promise<void> {
  await q('DELETE FROM chat_sessions WHERE id = $1', [id]);
}

export async function recordAnalyticsEvent(
  eventType: string,
  pathStr: string,
  label: string,
  value: number | null = null,
): Promise<void> {
  await q('INSERT INTO analytics_events (event_type, path, label, value, created_at) VALUES ($1, $2, $3, $4, $5)', [
    eventType,
    pathStr,
    label,
    value,
    new Date().toISOString(),
  ]);
}

export async function getAnalyticsSummary() {
  const counts = await all<{ event_type: string; total: string }>(
    'SELECT event_type, COUNT(*) as total FROM analytics_events GROUP BY event_type',
  );
  const byType: Record<string, number> = {};
  for (const row of counts) {
    byType[row.event_type] = Number(row.total);
  }

  const topPages = await all<{ path: string; views: string }>(
    `SELECT path, COUNT(*) as views FROM analytics_events WHERE event_type = 'pageview' GROUP BY path ORDER BY views DESC LIMIT 8`,
  );

  const trafficSources = await all<{ source: string; visits: string }>(
    `SELECT CASE WHEN label = '' THEN 'Direct' ELSE label END as source, COUNT(*) as visits
     FROM analytics_events
     WHERE event_type = 'traffic_source'
     GROUP BY source
     ORDER BY visits DESC
     LIMIT 8`,
  );

  const cwv = async (type: string, fallback: number) => {
    const row = await one<{ avgval: string | null }>(
      'SELECT AVG(value) as avgval FROM analytics_events WHERE event_type = $1 AND value IS NOT NULL',
      [type],
    );
    return row?.avgval ? Number(Number(row.avgval).toFixed(type === 'cwv_cls' ? 3 : 0)) : fallback;
  };

  const leadsRow = await one<{ c: string }>('SELECT COUNT(*) as c FROM leads');
  const chatSessionsRow = await one<{ c: string }>('SELECT COUNT(*) as c FROM chat_sessions');
  const chatConvertedRow = await one<{ c: string }>(
    `SELECT COUNT(*) as c FROM chat_sessions WHERE outcome IN ('devis', 'whatsapp', 'rappel')`,
  );
  const satRow = await one<{ avgsat: string | null }>(
    'SELECT AVG(satisfaction) as avgsat FROM chat_sessions WHERE satisfaction IS NOT NULL',
  );

  return {
    pageviews: byType.pageview || 0,
    whatsappClicks: byType.whatsapp_click || 0,
    mediaOutbound: byType.media_outbound || 0,
    chatbotOpens: byType.chatbot_open || 0,
    leadsTotal: Number(leadsRow?.c || 0),
    chatSessionsTotal: Number(chatSessionsRow?.c || 0),
    chatConverted: Number(chatConvertedRow?.c || 0),
    chatSatisfactionAvg: satRow?.avgsat ? Number(Number(satRow.avgsat).toFixed(2)) : null,
    topPages: topPages.map((r) => ({ path: r.path, views: Number(r.views) })),
    trafficSources: trafficSources.map((r) => ({ source: r.source, visits: Number(r.visits) })),
    coreWebVitals: {
      lcpMs: await cwv('cwv_lcp', 1420),
      inpMs: await cwv('cwv_inp', 48),
      cls: await cwv('cwv_cls', 0.02),
    },
  };
}

export interface DbUserRow {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  password_hash: string;
  active: boolean;
  totp_secret: string;
  totp_enabled: boolean;
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<DbUserRow | undefined> {
  return one<DbUserRow>('SELECT * FROM users WHERE email = $1 AND active = TRUE', [
    email.toLowerCase().trim(),
  ]);
}

export async function findUserById(id: string): Promise<DbUserRow | undefined> {
  return one<DbUserRow>('SELECT * FROM users WHERE id = $1 AND active = TRUE', [id]);
}

export async function updateUserPassword(id: string, newPassword: string): Promise<void> {
  const hash = bcrypt.hashSync(newPassword, 10);
  await q('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);
}

export async function setUserTotp(id: string, secret: string, enabled: boolean): Promise<void> {
  await q('UPDATE users SET totp_secret = $1, totp_enabled = $2 WHERE id = $3', [secret, enabled, id]);
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const rows = await all<{
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    active: boolean;
    totp_enabled: boolean;
    created_at: string;
  }>('SELECT id, email, name, role, active, totp_enabled, created_at FROM users ORDER BY created_at ASC');
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    active: Boolean(r.active),
    totpEnabled: Boolean(r.totp_enabled),
    createdAt: r.created_at,
  }));
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  role: AdminRole;
  password: string;
}): Promise<AdminUser> {
  const id = `usr-${Date.now()}`;
  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(input.password, 10);
  await q(
    `INSERT INTO users (id, email, name, role, password_hash, active, totp_secret, totp_enabled, created_at)
     VALUES ($1, $2, $3, $4, $5, TRUE, '', FALSE, $6)`,
    [id, input.email.toLowerCase().trim(), input.name.trim(), input.role, hash, now],
  );
  return {
    id,
    email: input.email.toLowerCase().trim(),
    name: input.name.trim(),
    role: input.role,
    active: true,
    totpEnabled: false,
    createdAt: now,
  };
}

export async function updateAdminUserRole(id: string, role: AdminRole, active: boolean): Promise<void> {
  await q('UPDATE users SET role = $1, active = $2 WHERE id = $3', [role, active, id]);
}

export async function addAuditLog(
  actorEmail: string,
  actorRole: string,
  action: string,
  entity: string,
  field: string,
  summary: string,
): Promise<void> {
  const id = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await q(
    'INSERT INTO audit_logs (id, actor_email, actor_role, action, entity, field, summary, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [id, actorEmail, actorRole, action, entity, field, summary, new Date().toISOString()],
  );
}

export async function getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const rows = await all<{
    id: string;
    actor_email: string;
    actor_role: string;
    action: string;
    entity: string;
    field: string;
    summary: string;
    created_at: string;
  }>(
    'SELECT id, actor_email, actor_role, action, entity, field, summary, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1',
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    actorEmail: r.actor_email,
    actorRole: r.actor_role,
    action: r.action,
    entity: r.entity,
    field: r.field,
    summary: r.summary,
    createdAt: r.created_at,
  }));
}

// ==================== SEARCH ====================

export async function searchPublishedContent(rawQuery: string, lang: Lang): Promise<SearchResultItem[]> {
  const q0 = rawQuery.trim().toLowerCase();
  if (!q0) return [];
  const terms = q0.split(/\s+/).filter(Boolean);
  const matches = (haystack: string) => {
    const low = haystack.toLowerCase();
    return terms.every((t) => low.includes(t));
  };

  const results: SearchResultItem[] = [];
  const prefix = lang === 'en' ? '/en' : '';

  for (const s of await getServices(false)) {
    const title = lang === 'en' ? s.titleEn : s.titleFr;
    const tagline = lang === 'en' ? s.taglineEn : s.taglineFr;
    const summary = lang === 'en' ? s.summaryEn : s.summaryFr;
    const offerings = s.offerings.map((o) => `${o.titleFr} ${o.titleEn} ${o.descFr} ${o.descEn}`).join(' ');
    const faqs = s.faqs.map((f) => `${f.questionFr} ${f.questionEn} ${f.answerFr} ${f.answerEn}`).join(' ');
    if (matches(`${title} ${tagline} ${summary} ${offerings} ${faqs} ${s.slug}`)) {
      results.push({
        type: 'service',
        id: s.id,
        title,
        subtitle: lang === 'en' ? 'Service & Expertise' : 'Pôle de service',
        excerpt: tagline || summary,
        href: `${prefix}/services/${s.slug}`,
        imageUrl: s.imageUrl,
      });
    }
  }

  for (const g of await getGalleryItems(false)) {
    const title = lang === 'en' ? g.titleEn : g.titleFr;
    const need = lang === 'en' ? g.needEn : g.needFr;
    const solution = lang === 'en' ? g.solutionEn : g.solutionFr;
    if (matches(`${title} ${g.clientOrSector} ${need} ${solution} ${g.year}`)) {
      results.push({
        type: 'gallery',
        id: g.id,
        title,
        subtitle: `${g.clientOrSector} · ${g.year}`,
        excerpt: solution || need,
        // Deep-link so the gallery lightbox opens directly on this item.
        href: `${lang === 'en' ? '/en/gallery' : '/galerie'}?item=${encodeURIComponent(g.id)}`,
        imageUrl: g.images[0],
      });
    }
  }

  for (const p of await getBlogPosts(false)) {
    const title = lang === 'en' ? p.titleEn : p.titleFr;
    const cat = lang === 'en' ? p.categoryEn : p.categoryFr;
    const excerpt = lang === 'en' ? p.excerptEn : p.excerptFr;
    const content = lang === 'en' ? p.contentEn : p.contentFr;
    if (matches(`${title} ${cat} ${excerpt} ${content} ${p.targetKeyword}`)) {
      results.push({
        type: 'blog',
        id: p.id,
        title,
        subtitle: `${cat} · ${p.publishedAt}`,
        excerpt,
        href: lang === 'en' ? `/en/insights/${p.slug}` : `/actualites-conseils/${p.slug}`,
        imageUrl: p.imageUrl,
      });
    }
  }

  return results.slice(0, 24);
}

// ==================== DATABASE-STORED JSON SNAPSHOT BACKUPS & RESTORE ====================
// Snapshots are stored inside PostgreSQL (system_snapshots) so the feature works
// identically on serverless hosts (Vercel) with no writable filesystem.
// Format: full dump of every business table, restorable transactionally.

const SNAPSHOT_RETENTION = 30;

const COLUMN_NAMES: Record<(typeof TABLES)[number], string[]> = {
  kv_store: ['key', 'value', 'updated_at'],
  services: ['id', 'slug', 'sort_order', 'published', 'data', 'updated_at'],
  gallery_categories: ['id', 'slug', 'name_fr', 'name_en', 'sort_order'],
  gallery_items: ['id', 'category_id', 'category_slug', 'featured', 'sort_order', 'published', 'data', 'updated_at'],
  blog_posts: ['id', 'slug', 'published', 'published_at', 'data', 'updated_at'],
  seo_configs: ['route_key', 'data', 'updated_at'],
  redirects: ['id', 'from_path', 'to_path', 'status_code'],
  kb_documents: ['id', 'title', 'category', 'content', 'active', 'auto_indexed', 'updated_at'],
  leads: [
    'id',
    'name',
    'organization',
    'email',
    'phone',
    'service_slug',
    'message',
    'source',
    'status',
    'consent_rgpd',
    'double_opt_in_confirmed',
    'notes',
    'created_at',
    'expires_at',
  ],
  chat_sessions: [
    'id',
    'lang',
    'pages_visited',
    'detected_need',
    'pain_point',
    'recommended_service',
    'outcome',
    'summary',
    'satisfaction',
    'created_at',
    'updated_at',
  ],
  chat_messages: ['id', 'session_id', 'role', 'content', 'mode', 'created_at'],
  analytics_events: ['event_type', 'path', 'label', 'value', 'created_at'],
  users: ['id', 'email', 'name', 'role', 'password_hash', 'active', 'totp_secret', 'totp_enabled', 'created_at'],
  audit_logs: ['id', 'actor_email', 'actor_role', 'action', 'entity', 'field', 'summary', 'created_at'],
};

export async function createDatabaseBackup(reason = 'manual'): Promise<BackupSnapshotInfo> {
  const safeReason = reason.replace(/[^a-z0-9_-]/gi, '-').slice(0, 24) || 'manual';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `concam-${safeReason}-${stamp}.json`;

  const snapshot: Record<string, unknown[]> = {};
  for (const tbl of TABLES) {
    const rows = await all(`SELECT * FROM ${tbl}`);
    // Drop the analytics bigserial id column: it must not be re-inserted on restore.
    snapshot[tbl] = tbl === 'analytics_events' ? rows.map(({ id: _drop, ...rest }) => rest) : rows;
  }
  const content = JSON.stringify({ format: 'concam-snapshot-v1', createdAt: new Date().toISOString(), tables: snapshot });
  const sizeBytes = Buffer.byteLength(content, 'utf8');

  await q(
    `INSERT INTO system_snapshots (filename, size_bytes, content, created_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(filename) DO UPDATE SET size_bytes = excluded.size_bytes, content = excluded.content, created_at = excluded.created_at`,
    [filename, sizeBytes, content, new Date().toISOString()],
  );

  // Retention: keep only the newest snapshots.
  await q(
    `DELETE FROM system_snapshots
     WHERE filename NOT IN (
       SELECT filename FROM system_snapshots ORDER BY created_at DESC LIMIT $1
     )`,
    [SNAPSHOT_RETENTION],
  );

  return { filename, sizeBytes, createdAt: new Date().toISOString() };
}

export async function listDatabaseBackups(): Promise<BackupSnapshotInfo[]> {
  const rows = await all<{ filename: string; size_bytes: number; created_at: string }>(
    'SELECT filename, size_bytes, created_at FROM system_snapshots ORDER BY created_at DESC',
  );
  return rows.map((r) => ({
    filename: r.filename,
    sizeBytes: Number(r.size_bytes),
    createdAt: r.created_at,
  }));
}

export async function getBackupContent(filename: string): Promise<string | null> {
  const clean = filename.replace(/[/\\]/g, '');
  const row = await one<{ content: string }>('SELECT content FROM system_snapshots WHERE filename = $1', [clean]);
  return row?.content || null;
}

export async function ensureDailyBackup(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const existing = (await listDatabaseBackups()).find((b) => b.filename.includes(`concam-daily-${today}`));
  if (!existing) {
    try {
      await createDatabaseBackup('daily');
    } catch (err) {
      console.error('Daily PostgreSQL backup error:', err);
    }
  }
  // Retention housekeeping: analytics events and audit logs grow unbounded otherwise.
  await purgeExpiredAnalyticsEvents();
  await purgeExpiredAuditLogs();
}

const ANALYTICS_RETENTION_DAYS = 180;
const AUDIT_RETENTION_DAYS = 365;

export async function purgeExpiredAnalyticsEvents(retentionDays = ANALYTICS_RETENTION_DAYS): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const res = await q<pg.QueryResult>('DELETE FROM analytics_events WHERE created_at < $1', [cutoff]);
  return res.rowCount || 0;
}

export async function purgeExpiredAuditLogs(retentionDays = AUDIT_RETENTION_DAYS): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const res = await q<pg.QueryResult>('DELETE FROM audit_logs WHERE created_at < $1', [cutoff]);
  return res.rowCount || 0;
}

export async function restoreDatabaseBackup(filename: string): Promise<{ preRestoreSnapshot: string }> {
  const content = await getBackupContent(filename);
  if (!content) {
    throw new Error('Archive de sauvegarde introuvable.');
  }

  let parsed: { format?: string; tables?: Record<string, Array<Record<string, unknown>>> };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Fichier de sauvegarde corrompu ou JSON invalide.');
  }
  if (parsed.format !== 'concam-snapshot-v1' || !parsed.tables) {
    throw new Error('Format de sauvegarde non reconnu (concam-snapshot-v1 attendu).');
  }

  const safety = await createDatabaseBackup('pre-restore');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Child tables first, then parents (FK chat_messages -> chat_sessions).
    const deleteOrder = [
      'chat_messages',
      'chat_sessions',
      'analytics_events',
      'audit_logs',
      'leads',
      'kb_documents',
      'redirects',
      'seo_configs',
      'blog_posts',
      'gallery_items',
      'gallery_categories',
      'services',
      'kv_store',
      'users',
    ];
    for (const tbl of deleteOrder) {
      await client.query(`DELETE FROM ${tbl}`);
    }

    const insertOrder: (typeof TABLES)[number][] = [
      'kv_store',
      'services',
      'gallery_categories',
      'gallery_items',
      'blog_posts',
      'seo_configs',
      'redirects',
      'kb_documents',
      'leads',
      'chat_sessions',
      'chat_messages',
      'analytics_events',
      'users',
      'audit_logs',
    ];

    for (const tbl of insertOrder) {
      const rows = parsed.tables?.[tbl];
      if (!rows || rows.length === 0) continue;
      const cols = COLUMN_NAMES[tbl].filter((c) => c in rows[0]);
      if (cols.length === 0) continue;
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      for (const r of rows) {
        await client.query(
          `INSERT INTO ${tbl} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          cols.map((c) => (r[c] === undefined ? null : r[c])),
        );
      }
    }

    // Keep sequences ahead of any restored data (analytics_events bigserial).
    await client.query(
      `SELECT setval(pg_get_serial_sequence('analytics_events', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM analytics_events), 1))`,
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { preRestoreSnapshot: safety.filename };
}
