# Site CONCAM — Agence de Communication & Marketing (Conakry, Guinée)

Site institutionnel bilingue FR/EN, galerie de réalisations, Conseiller commercial IA (texte + voix),
plaquette PDF générée à la volée et tableau de bord d'administration complet de l'agence
**CONCAM** (Com'Com), Manquepas — Kaloum, Conakry.

## Stack

| Couche | Technologie |
|---|---|
| Frontend | React 19 · react-router 7 · Tailwind CSS 4 · Motion (Framer) |
| Backend | Node 20+ · Express · WebSocket (`ws`) · `tsx` |
| Base de données | **PostgreSQL** (Neon) via `pg` — 14 tables, seed automatique |
| IA | Google Gemini (RAG lexical, JSON structuré, Live API vocale) — repli déterministe sans clé |

## Démarrage local

```bash
npm install                # ou : bun install
cp .env.example .env       # renseigner DATABASE_URL (obligatoire)
npm run dev                # http://localhost:3000
```

Le premier démarrage crée le schéma et injecte tout le contenu initial (4 pôles de services,
galerie, blog, SEO, playbooks commerciaux RAG, 3 comptes admin).

## Comptes d'administration (`/admin`)

| Rôle | Courriel | Mot de passe par défaut |
|---|---|---|
| Administrateur | `admin@concam.gn` | `ConcamAdmin2026!` |
| Éditeur | `editeur@concam.gn` | `ConcamEditeur2026!` |
| Commercial | `commercial@concam.gn` | `ConcamSales2026!` |

> ⚠️ **Changez ces mots de passe** (module Utilisateurs & Audit) ou définissez
> `SEED_ADMIN_PASSWORD` / `SEED_EDITOR_PASSWORD` / `SEED_SALES_PASSWORD` avant le
> premier démarrage. Détails : `GUIDE_EXPLOITATION_CONCAM.md`.

## Déploiement

### Option A — Render.com (recommandé, `render.yaml` inclus)

1. Sur [Neon](https://neon.tech) : créer un projet PostgreSQL et copier la chaîne
   `DATABASE_URL` (avec `?sslmode=require`).
2. Sur [Render](https://render.com) : **New → Blueprint**, sélectionner ce dépôt.
3. Renseigner les variables sensibles :
   - `DATABASE_URL` → la chaîne Neon
   - `GEMINI_API_KEY` → clé Google AI Studio (optionnelle)
   - `APP_URL` → l'URL publique Render (après le premier déploiement)
4. Déployer. Health check : `/api/health`.

### Option B — toute plateforme Node (Railway, Fly.io, VPS…)

```bash
npm install
npm run build      # génère dist/ (SPA)
NODE_ENV=production npm start
```

Variables requises : `DATABASE_URL` (obligatoire), `SESSION_SECRET` (recommandé),
`GEMINI_API_KEY` / `APP_URL` (optionnels).

## Sauvegardes

- Instantanés **JSON** quotidiens de toute la base PostgreSQL dans `data/backups/`
  (rétention 30 fichiers) + création manuelle, téléchargement et restauration
  transactionnelle (avec filet de sécurité pré-restauration) depuis `/admin`.
- Retention automatique : analytics 180 jours, journaux d'audit 365 jours.

## Documentation

- `GUIDE_EXPLOITATION_CONCAM.md` — guide d'exploitation, micro-textes FR/EN, sécurité
- `RAPPORT_ETUDE_COMPLETE.md` — étude technique complète du code + correctifs appliqués
