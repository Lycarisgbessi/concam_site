# Rapport d'étude complète — Site CONCAM (Agence de Communication & Marketing, Conakry)

> Étude statique intégrale du code (~20 000 lignes). Date : 13/11/2026.

## 1. Nature du projet

Site institutionnel + back-office + assistant commercial IA pour la **SOCIÉTÉ CONCAM SARL UNIPERSONNELLE** (« Agence CONCAM / Com'Com »), agence de communication fondée en 2010 à Conakry (Guinée). Généré initialement dans Google AI Studio (dossier `.aistudio/`, `metadata.json`), le projet est un monolithe full-stack :

| Couche | Technologie |
|---|---|
| Frontend | React 19, react-router-dom 7, Tailwind CSS 4 (`@theme`), Motion/Framer Motion 12, lucide-react |
| Backend | Express 4, ws (WebSocket), better-sqlite3 (WAL), pdfkit, bcryptjs, @google/genai |
| Build/run | Vite 8 en middleware, tsx (ou **bun** en contournement Windows), TypeScript 7 |
| Données | SQLite `data/concam.db`, backups `VACUUM INTO` dans `data/backups/` |

Point d'entrée unique : `server.ts` (1 296 l.) — Express + Vite + WebSocket sur le même serveur HTTP (port 3000 par défaut).

## 2. Architecture

```
server.ts ................ Serveur unifié : middleware, routes API, WS /api/live-voice, rate limiter maison
├─ server/db.ts .......... Schéma SQLite (15 tables), seed, backup/restore, recherche, agrégats analytics
├─ server/seedData.ts .... Données initiales (identité, 4 services, galerie, blog, SEO, playbooks RAG)
├─ server/ai.ts .......... Couche Gemini : RAG lexical, réponse structurée, STT/TTS, fallback déterministe
├─ server/security.ts .... Secret de session persistant + TOTP (2FA) implémenté à la main
└─ server/pdfBrochure.ts . Plaquette institutionnelle PDF A4 3 pages générée à la volée

src/main.tsx → App.tsx ... SPA : /admin (dashboard) + routes publiques FR & /en miroir
├─ context/SiteContext ... État global : données /api/public/site-data, langue, modales, analytics, CWV
├─ components/ ........... Layout (header/footer), overlays globaux (recherche ⌘K, devis, WhatsApp/popups, conseiller IA)
├─ pages/ ................ 13 pages publiques + AdminDashboard (1 949 l.)
└─ index.css ............. Design tokens + utilitaires maison (plaques, marquee, Ken Burns, lettrine…)
```

## 3. Le site public

**13 routes FR + 13 miroir EN** (`src/App.tsx:48-75`) : accueil, à-propos, services (index + 4 fiches `:slug`), presse-édition, galerie, actualités-conseils (index + `:slug`), contact, recherche, désinscription, mentions légales, confidentialité.

**Contenu de l'agence (source `server/seedData.ts`, piloté CMS)** :
- Identité légale : RCCM GN-KAL/038.316A/2012, NCC 823202379, NIF 009632Q, siège Manquepas (Kaloum).
- Chiffres clés : 16+ ans, 420+ projets, 135+ clients ; 9 partenaires affichés (Ecobank, UGAR, Activa…).
- **4 pôles facturables** : I. Conseil en communication 360° · II. Manuels & supports d'information · III. Marquage de gadgets publicitaires · IV. Impression numérique et offset — chacun avec 3 offerings, process 4 étapes, FAQ bilingue, message WhatsApp pré-rempli.
- Branche **Presse & édition non facturable** : Réussite Magazine (2016) + MediaInfoPro (agrégateur RSS tolérant aux pannes).
- Accueil = 7 blocs activables/réordonnables depuis l'admin (`homeBlocks`) : hero → partenaires → services → stats → médias → galerie → bannière contact.

**Design system** : style « chancellerie souveraine » — ivoire `#F7F4EF`, encre `#181413`, grenat institutionnel `#931916`, Cormorant Garamond + Public Sans. Bibliothèque maison de ~25 primitives d'animation (`MotionPrimitives.tsx`, 1 594 l.) : parallaxe multi-plans réglable CMS (subtle→ultra), sceau rotatif, deck sticky, marquee, tilt 3D, CTA magnétiques — avec respect systématique de `prefers-reduced-motion` et `saveData`.

**Fonctions interactives** :
- Recherche plein site : overlay ⌘K debounced 200 ms + page `/recherche` (API ET-logique sur services/galerie/blog).
- Modal devis contextuelle pré-remplie ; bouton WhatsApp flottant avec message selon la page ; 3 popups de conversion avec anti-fatigue 7 jours ; bandeau cookies.
- Conseiller IA (voir §5).

**SEO** : `SeoHead` dynamique (canonical + hreflang FR/EN/x-default), JSON-LD `Organization`/`LocalBusiness` + `BreadcrumbList` auto + `Service`/`FAQPage`/`Article` selon la page, sitemap.xml bilingue généré serveur, robots.txt (`Disallow: /admin`, `/api/`), 8 configs SEO éditables par route.

## 4. Base de données (15 tables)

`kv_store` (settings, page_content, media_hub, chatbot_config), `services`, `gallery_categories`, `gallery_items`, `blog_posts`, `seo_configs`, `redirects` (301 dynamiques), `kb_documents` (RAG), `leads` (RGPD : consent + double opt-in + `expires_at` 12 mois), `chat_sessions`/`chat_messages` (CRM conversationnel), `analytics_events` (pageviews, WhatsApp, CWV), `users` (bcrypt + TOTP), `audit_logs`. Pattern général : colonnes d'indexation + blob JSON `data`. 100 % de requêtes préparées.

## 5. Assistant commercial IA (Gemini, serveur uniquement)

- **Texte** `/api/chat/message` : `gemini-4-hydrogen`, sortie JSON forcée (besoin détecté, pain point, service recommandé, action `devis|whatsapp|rappel`, pré-remplissage devis), historique 12 tours.
- **Voix temps réel** WebSocket `/api/live-voice` : `gemini-3.8-live` (voix Charon, PCM 16 kHz, barge-in) ; **fallback par tour** `/api/chat/voice-turn` : STT `gemini-3.5-transcribe` → réponse → TTS `gemini-3.8-flash-lite-tts` (WAV base64). Triple dégradation sans perte d'historique.
- **RAG lexical maison** : top 7 docs `kb_documents` (contenu publié auto-réindexé à chaque écriture + 2 playbooks commerciaux BANT/objections) injectés dans l'instruction système ; garde-fous anti-hallucination (prix/délais interdits, escalade humaine).
- **Fallback déterministe** scripté si clé API absente ou erreur — le service ne tombe jamais.

## 6. Administration (`/admin`)

Login email/bcrypt + **2FA TOTP optionnelle** (QR, fenêtre ±30 s). 3 rôles appliqués **à l'identique en UI et côté serveur** :
- **admin** : 10 modules (tout) ; **éditeur** : contenus (services, galerie, pages/blocs, médias, SEO) ; **commercial** : prospects, chatbot/RAG, stats.

Modules : Informations de contact (source unique de vérité → site, footer, PDF, RAG), Services (éditeur complet + sync RAG), Galerie (catégories, réalisations multi-images, drag & drop), Pages/Blocs/Blog (hero, 7 en-têtes carrousel image/vidéo, ordre des blocs accueil, chorégraphie d'animation), Médias du groupe (passerelles + test RSS), Prospects/CRM (statuts, notes, export CSV, purge RGPD), Chatbot & RAG (config, base documentaire, journaux complets), Statistiques & Core Web Vitals, Utilisateurs & Audit (2FA, sauvegardes VACUUM INTO avec restauration transactionnelle + snapshot pré-restauration, logs exportables), SEO (métas par route + redirections 301).

Comptes seedés (`server/db.ts:445-467`) : `admin@concam.gn`/`ConcamAdmin2026!`, `editeur@concam.gn`/`ConcamEditeur2026!`, `commercial@concam.gn`/`ConcamSales2026!` — **à changer avant mise en production** (documenté dans `GUIDE_EXPLOITATION_CONCAM.md`).

## 7. Sécurité

En place : sessions HMAC-SHA256 `timingSafeEqual` (cookie httpOnly/sameSite=lax/secure en prod, 24 h), secret persistant `data/.session_secret` (jamais hardcoded), rate limiter maison par IP+route (login 15/min, chat 40/min…), CSP + headers (X-Frame-Options, Referrer-Policy, Permissions-Policy micro), uploads whitelist MIME + noms sanitisés, requêtes préparées partout, audit trail systématique, RGPD réellement implémenté (consentement obligatoire, double opt-in, purge 12 mois, désinscription).

Faiblesses : mots de passe seedés en clair dans le code ; CSP avec `unsafe-inline`/`unsafe-eval` ; WS vocal sans auth/limite (coût Gemini abusable) ; rate limiter in-memory (multi-instance/restart) ; pas de `trust proxy` ; `/api/leads/confirm` non limité (énumération d'IDs) ; pas d'envoi SMTP réel (le `confirmUrl` du double opt-in n'est jamais transmis par email) ; `analytics_events`/`audit_logs` sans rétention ; backups uniquement locaux.

## 8. Bugs et incohérences relevés

1. Paramètre `animation` de `renderBlock` ignoré (`HomePage.tsx:232`) — le réglage d'animation par bloc du CMS est décoratif.
2. « Réalisations associées » non filtrées par service (`ServiceDetailPage.tsx:60` — toujours les 3 premières).
3. BreadcrumbList JSON-LD dupliqué sur `/a-propos` (`AboutPage.tsx:75-83` + auto `SeoHead`).
4. Adresse codée en dur dans le JSON-LD (`SeoHead.tsx:106-108`) — ne suit pas le CMS.
5. Perte des query params lors du changement de langue (`switchLanguage`).
6. Résultats recherche galerie sans `?item=` (deep-link lightbox rompu) (`db.ts` searchPublishedContent).
7. Toasts de succès admin sans vérifier `res.ok` — échec serveur affiché comme succès (`AdminDashboard.tsx` handlers).
8. Session expirée → UI admin bloquée sur « Chargement » sans retour au login.
9. Contrôle éditeur sur animations/intensité ignoré à l'enregistrement (réservé admin, sans avertissement).
10. Noms de modèles Gemini (`gemini-4-hydrogen`…) à vérifier — sinon repli silencieux en fallback déterministe.
11. `app.get('*')` en prod renvoie du HTML sur les chemins `/api/` inconnus.
12. Utilisateur désactivé garde sa session jusqu'à 24 h (`verifySession` ne revalide pas `active`).
13. Date RSS fallback codée en dur `'2026-11-12'`.
14. Suppression de catégorie galerie sans nettoyer les items liés (orphelins possibles).
15. Injection de formules CSV possible dans les exports (`=cmd()` non neutralisé).
16. `/recherche` absent du sitemap.

## 9. Points forts

- Chaîne commerciale complète et traçée : chatbot IA → action devis/WhatsApp/rappel → modal pré-remplie → CRM statuts/notes → analytics (outcomes, satisfaction, CWV réels).
- 100 % du contenu piloté par le CMS bilingue ; le PDF, le footer et le RAG suivent la même source.
- Dégradation gracieuse généralisée (IA sans clé, RSS mort, animations réduites, vidéo→poster).
- RGPD concret (pas décoratif) ; audit trail ; backup atomique `VACUUM INTO` + restauration sécurisée.
- Qualité d'accessibilité animatoire remarquable (reduced-motion, saveData, focus-visible, aria).

## 10. Recommandations prioritaires avant mise en production

1. **Changer les 3 mots de passe admin** et activer la 2FA (module Utilisateurs).
2. Vérifier les **noms de modèles Gemini** réellement disponibles sur la clé API.
3. Ajouter un **transport email** (SMTP) pour le double opt-in newsletter — sinon le désactiver.
4. Rate-limiter `/api/leads/confirm` + auth/limite sur le WS vocal.
5. Corriger les bugs 1-9 ci-dessus (faible coût, gain réel).
6. Prévoir un backup distant (la base et ses sauvegardes sont sur le même disque).
7. Durcir la CSP (retirer `unsafe-eval` au minimum) et ajouter `app.set('trust proxy', 1)` si derrière reverse proxy.

## Annexe — vérifications d'exécution effectuées avant arrêt (à titre indicatif)

Le serveur a été lancé (bun, port 3456) et les points suivants confirmés fonctionnels : seed complet de la base, `/api/health`, `/api/public/site-data`, recherche, sitemap/robots, génération PDF (10 Ko), login admin, overview admin, refus RGPD sans consentement, capture de lead, flux médias avec cartes fallback, chatbot en mode fallback déterministe sans clé API, rendu complet de l'accueil (7 blocs) et d'une fiche service dans le navigateur. Néanmoins, cette étude repose sur l'analyse du code source.
