# Site CONCAM — Agence de Communication & Marketing (Conakry, Guinée)

Site institutionnel bilingue FR/EN, galerie de réalisations, Conseiller commercial IA (texte + voix),
plaquette PDF générée à la volée et tableau de bord d'administration complet de l'agence
**CONCAM** (Com'Com), Manquepas — Kaloum, Conakry.

## Architecture de déploiement

| Brique | Service |
|---|---|
| Code source | **GitHub** — `Lycarisgbessi/concam_site` |
| Base de données | **Neon** (PostgreSQL serverless) |
| Hébergement | **Vercel** (SPA statique + fonctions serverless `api/`) |

| Couche | Technologie |
|---|---|
| Frontend | React 19 · react-router 7 · Tailwind CSS 4 · Motion (Framer) — build Vite dans `dist/` |
| API | Fonction serverless Vercel `api/index.ts` exécutant l'app Express complète |
| Base | PostgreSQL via `pg` (pool Neon) — 14 tables + `system_snapshots`, seed automatique |
| IA | Google Gemini (RAG lexical, JSON structuré) — repli déterministe sans clé |
| Sauvegardes | Snapshots JSON stockés **dans PostgreSQL**, créés/restaurés depuis `/admin` + cron Vercel quotidien |

## Déploiement sur Vercel (une seule fois)

1. **Vercel → Add New → Project** → importer le dépôt GitHub `Lycarisgbessi/concam_site`.
2. Variables d'environnement (Project → Settings → Environment Variables) :

   | Variable | Obligatoire | Description |
   |---|---|---|
   | `DATABASE_URL` | ✅ | Chaîne Neon (`postgresql://…?sslmode=require`) |
   | `SESSION_SECRET` | ✅ | ≥ 24 caractères (signature des sessions admin) |
   | `GEMINI_API_KEY` | — | Clé Google AI Studio (sans elle : chatbot en mode scripté) |
   | `BLOB_READ_WRITE_TOKEN` | — | Vercel Blob pour les médias téléversés (Storage → Create Blob) |
   | `APP_URL` | — | URL publique finale (sitemap) |
   | `SEED_ADMIN_PASSWORD` / `SEED_EDITOR_PASSWORD` / `SEED_SALES_PASSWORD` | — | Mots de passe initiaux (avant 1er démarrage) |

3. **Deploy** — build automatique (`vite build`), SPA servie depuis `dist/`, API via `api/index.ts`
   (règles `vercel.json`), cron de sauvegarde quotidien à 03:00 UTC (`/api/cron/backup`).

> Note : le mode vocal temps réel (WebSocket Gemini Live) n'est pas disponible sur fonctions
> serverless — le Conseiller IA bascule automatiquement sur le mode vocal par tour (HTTP).

## Développement local

```bash
npm install                # ou : bun install
cp .env.example .env       # renseigner DATABASE_URL (obligatoire)
npm run dev                # http://localhost:3000 — serveur local complet (WS vocal inclus)
```

Build et test production locaux :

```bash
npm run build
NODE_ENV=production npm start
```

## Comptes d'administration (`/admin`)

| Rôle | Courriel | Mot de passe par défaut |
|---|---|---|
| Administrateur | `admin@concam.gn` | `ConcamAdmin2026!` |
| Éditeur | `editeur@concam.gn` | `ConcamEditeur2026!` |
| Commercial | `commercial@concam.gn` | `ConcamSales2026!` |

> ⚠️ **Changez ces mots de passe** (module Utilisateurs & Audit) ou définissez
> `SEED_ADMIN_PASSWORD` etc. avant le premier démarrage. Détails : `GUIDE_EXPLOITATION_CONCAM.md`.

## Documentation

- `GUIDE_EXPLOITATION_CONCAM.md` — guide d'exploitation, micro-textes FR/EN, sécurité
- `RAPPORT_ETUDE_COMPLETE.md` — étude technique complète du code + correctifs appliqués
