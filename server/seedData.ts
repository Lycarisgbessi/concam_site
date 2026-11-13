import type {
  SiteSettings,
  MediaHubConfig,
  ServiceItem,
  GalleryCategory,
  GalleryItem,
  PageContent,
  BlogPost,
  SeoConfig,
  ChatbotConfig,
  KbDocument,
  LeadRecord,
} from '../src/types/concam.ts';

export const HERO_IMG = '/images/real/hdr_home_advisory.jpg';
export const CONSEIL_IMG = '/images/real/srv_conseil_360.jpg';
export const IMPRESSION_IMG = '/images/real/srv_impression_offset.jpg';
export const MARQUAGE_IMG = '/images/real/srv_marquage_corporate.jpg';
export const MANUELS_IMG = '/images/real/srv_manuels_edition.jpg';

export const INITIAL_SETTINGS: SiteSettings = {
  companyName: 'SOCIÉTÉ CONCAM SARL UNIPERSONNELLE',
  brandAlias: "Agence CONCAM (Com'Com)",
  legalForm: 'SARL unipersonnelle',
  foundedYear: 2010,
  registeredYear: 2012,
  rccm: 'GN-KAL/038.316A/2012 — Tribunal de commerce, section Kaloum',
  ncc: '823202379',
  nif: '009632Q',
  taxCategory: 'PME — centre CIME — activité 110 « prestation de services »',
  address: {
    fr: 'Quartier Manquepas, Commune de Kaloum, Conakry — République de Guinée',
    en: 'Manquepas District, Kaloum Municipality, Conakry — Republic of Guinea',
  },
  phones: ['+224 622 85 70 35', '+224 620 42 87 29', '+224 628 20 98 66'],
  whatsappNumber: '+224 622 85 70 35',
  whatsappDefaultMsgFr:
    "Bonjour Agence CONCAM, je souhaite obtenir des informations et un devis pour un projet de communication.",
  whatsappDefaultMsgEn:
    'Hello CONCAM Agency, I would like information and a quote for a communication project.',
  agencyEmail: 'agenceconcam2@gmail.com',
  magazineEmail: 'reussitemagazine16@gmail.com',
  hoursFr: 'Lundi – Vendredi : 08h30 – 17h30 | Samedi : 09h00 – 13h00',
  hoursEn: 'Monday – Friday: 8:30 AM – 5:30 PM | Saturday: 9:00 AM – 1:00 PM',
  mapLat: 9.5126,
  mapLng: -13.7122,
  socialFacebook: 'https://www.facebook.com/Agenceconcam',
  socialTiktok: 'https://www.tiktok.com/@agence.concam5',
  socialLinkedin: 'https://www.linkedin.com/company/agence-concam',
  preloaderEnabled: true,
  animationsEnabled: true,
  parallaxIntensity: 'ultra',
  maintenanceMode: false,
  maintenanceMessageFr:
    'Notre site institutionnel fait l’objet d’une opération de maintenance planifiée. Nos équipes restent joignables par téléphone et WhatsApp.',
  maintenanceMessageEn:
    'Our institutional website is undergoing scheduled maintenance. Our advisors remain reachable by phone and WhatsApp.',
  partners: [
    'Ecobank',
    'UGAR',
    'Activa',
    'ANIES',
    'GUI',
    'Tractopo Guinée',
    'Kagny Technology',
    'UBAC',
    'NSS',
  ],
  stats: {
    yearsExperience: 16,
    projectsCompleted: 420,
    clientsSupported: 135,
  },
};

export const INITIAL_MEDIA_HUB: MediaHubConfig = {
  reussiteMagazineUrl: 'https://reussitemagazine.info',
  reussiteMagazineEnabled: true,
  reussiteMagazineDescFr:
    'Le magazine digital des entrepreneurs et décideurs en Guinée : décryptages économiques, interviews, analyses, vidéos et podcasts.',
  reussiteMagazineDescEn:
    'The digital magazine for Guinean entrepreneurs and decision-makers: economic insights, interviews, analysis, videos and podcasts.',
  mediaInfoProUrl: 'https://mediainfopro.net',
  mediaInfoProEnabled: true,
  mediaInfoProStatusNote: 'À confirmer — domaine en cours de configuration DNS (vérifié le 12/11/2026)',
  mediaInfoProDescFr:
    "Portail d'information continue et d'actualité institutionnelle et économique du groupe CONCAM.",
  mediaInfoProDescEn:
    'Continuous institutional and economic news portal of the CONCAM group.',
  headlinesFeedEnabled: true,
};

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-conseil',
    slug: 'conseil-communication',
    sortOrder: 1,
    published: true,
    titleFr: 'Conseil en communication',
    titleEn: 'Communication Advisory',
    taglineFr: 'Stratégie 360°, identité institutionnelle et campagnes à fort impact en Guinée.',
    taglineEn: '360° strategy, institutional identity and high-impact campaigns across Guinea.',
    summaryFr:
      'Nous accompagnons entreprises privées, banques, projets publics et ONG dans le cadrage de leur prise de parole, leur identité de marque et leurs campagnes événementielles et médias.',
    summaryEn:
      'We support private enterprises, banks, public institutions and NGOs in structuring their positioning, brand identity, and media or event campaigns.',
    benefitsFr: [
      'Audit complet de positionnement et de perception institutionnelle',
      'Plans de communication 360° adaptés aux réalités guinéennes et sous-régionales',
      'Accompagnement de direction : relations presse, lancement de marque et communication de crise',
      'Cohérence garantie entre supports imprimés, digitaux et prise de parole publique',
    ],
    benefitsEn: [
      'Comprehensive positioning and institutional perception audit',
      '360° communication plans tailored to Guinean and West African markets',
      'Executive advisory: media relations, brand launches and crisis communications',
      'Guaranteed consistency across print, digital and public speaking channels',
    ],
    offerings: [
      {
        titleFr: 'Stratégie de marque & identité visuelle',
        titleEn: 'Brand Strategy & Visual Identity',
        descFr: 'Plateforme de marque, charte graphique complète, logotype et déclinaisons institutionnelles.',
        descEn: 'Brand platform, complete visual guidelines, logo system and institutional templates.',
      },
      {
        titleFr: 'Campagnes publicitaires & plan média',
        titleEn: 'Advertising Campaigns & Media Planning',
        descFr: 'Conception de campagnes multicanales (affichage urbain Conakry, presse, radio, digital).',
        descEn: 'Multichannel campaign design across Conakry outdoor, print press, radio and digital.',
      },
      {
        titleFr: 'Événementiel institutionnel & relations publiques',
        titleEn: 'Institutional Events & Public Relations',
        descFr: 'Organisation de forums économiques, inaugurations, conférences de presse et lancements.',
        descEn: 'Organization of economic forums, inaugurations, press briefings and corporate launches.',
      },
    ],
    processSteps: [
      {
        step: 1,
        titleFr: 'Diagnostic & écoute',
        titleEn: 'Audit & Discovery',
        descFr: 'Entretiens dirigeants, analyse concurrentielle et clarification des objectifs mesurables.',
        descEn: 'Executive interviews, competitive landscape analysis and clear measurable targets.',
      },
      {
        step: 2,
        titleFr: 'Architecture stratégique',
        titleEn: 'Strategic Architecture',
        descFr: 'Rédaction du plan d’action, messages clés, calendrier éditorial et budget gradué.',
        descEn: 'Action plan, key messaging matrix, editorial calendar and tiered budget proposal.',
      },
      {
        step: 3,
        titleFr: 'Création & validation',
        titleEn: 'Creative Direction & Sign-off',
        descFr: 'Direction artistique, maquettes, tests de lisibilité et validation rigoureuse par jalons.',
        descEn: 'Art direction, prototypes, legibility checks and milestone-based executive sign-off.',
      },
      {
        step: 4,
        titleFr: 'Déploiement & mesure',
        titleEn: 'Rollout & Measurement',
        descFr: 'Pilotage des prestataires, suivi média et bilan d’impact post-campagne.',
        descEn: 'Vendor coordination, media monitoring and post-campaign impact reporting.',
      },
    ],
    faqs: [
      {
        questionFr: 'Accompagnez-vous les institutions publiques et les ONG internationales ?',
        questionEn: 'Do you work with public institutions and international NGOs?',
        answerFr:
          'Oui. Depuis 2010, CONCAM accompagne des programmes nationaux, des institutions financières et des organisations internationales avec des livrables conformes aux standards de gouvernance et de transparence.',
        answerEn:
          'Yes. Since 2010, CONCAM has advised national programs, financial institutions and international organizations with deliverables meeting strict governance standards.',
      },
      {
        questionFr: 'Quel est le délai pour obtenir une proposition stratégique ?',
        questionEn: 'How fast can we receive a strategic proposal?',
        answerFr:
          'Après un premier cadrage de votre besoin, nous transmettons une proposition structurée et graduée sous 24 heures ouvrées.',
        answerEn:
          'Following an initial scoping call or chat, we deliver a structured, tiered proposal within 24 business hours.',
      },
    ],
    imageUrl: CONSEIL_IMG,
    whatsappMessageFr:
      'Bonjour, je souhaite un devis pour un accompagnement en Conseil en communication.',
    whatsappMessageEn:
      'Hello, I would like a quote for Communication Advisory services.',
  },
  {
    id: 'srv-manuels',
    slug: 'manuels-supports',
    sortOrder: 2,
    published: true,
    titleFr: 'Manuels & supports d’information',
    titleEn: 'Manuals & Information Materials',
    taglineFr: 'Rapports annuels, manuels de procédures et brochures conçus avec rigueur éditoriale.',
    taglineEn: 'Annual reports, procedure manuals and corporate brochures crafted with editorial precision.',
    summaryFr:
      'Nous prenons en charge la chaîne complète : structuration éditoriale, secrétariat de rédaction, mise en page professionnelle, infographies et préparation aux normes d’impression.',
    summaryEn:
      'We handle the full editorial chain: content structuring, copy-editing, professional layout, data infographics and print-ready production.',
    benefitsFr: [
      'Mise en page éditoriale claire inspirée des standards de la presse économique',
      'Relecture typographique et cohérence graphique sur 20 à 300+ pages',
      'Création de graphiques financiers, cartes et schémas institutionnels',
      'Livraison en version imprimée haute qualité et PDF interactif optimisé web',
    ],
    benefitsEn: [
      'Editorial layout inspired by top business press standards',
      'Rigorous proofreading and visual consistency across 20 to 300+ pages',
      'Custom financial charts, maps and institutional diagrams',
      'Delivered both in premium print and web-optimized interactive PDF',
    ],
    offerings: [
      {
        titleFr: 'Rapports annuels & bilans d’activité',
        titleEn: 'Annual Reports & Activity Reviews',
        descFr: 'Valorisation des résultats financiers, gouvernance et impact social pour conseils d’administration et bailleurs.',
        descEn: 'Executive presentation of financial results, governance and social impact for boards and donors.',
      },
      {
        titleFr: 'Manuels de procédures & guides terrain',
        titleEn: 'Procedure Manuals & Field Guides',
        descFr: 'Supports pédagogiques structurés pour administrations, mines, banques et programmes ONG.',
        descEn: 'Structured operational and training handbooks for ministries, mining, banking and NGOs.',
      },
      {
        titleFr: 'Plaquettes institutionnelles & dossiers de presse',
        titleEn: 'Corporate Brochures & Press Kits',
        descFr: 'Documents de présentation bilingues conçus pour convaincre investisseurs et partenaires.',
        descEn: 'Bilingual presentation dossiers tailored for investors and institutional partners.',
      },
    ],
    processSteps: [
      {
        step: 1,
        titleFr: 'Cadrage éditorial & sommaire',
        titleEn: 'Editorial Brief & Outline',
        descFr: 'Collecte des textes bruts, données chiffrées et validation du chemin de fer.',
        descEn: 'Gathering raw manuscripts, datasets and validating the pagination blueprint.',
      },
      {
        step: 2,
        titleFr: 'Direction artistique & gabarits',
        titleEn: 'Art Direction & Master Grids',
        descFr: 'Proposition de maquette sur quelques pages types avant déploiement intégral.',
        descEn: 'Sample spread approval before rolling out layout across the entire publication.',
      },
      {
        step: 3,
        titleFr: 'Maquettage, infographies & relecture',
        titleEn: 'Typesetting, Charts & Proofing',
        descFr: 'Intégration complète, traitement des tableaux, deux cycles de corrections.',
        descEn: 'Full layout integration, data visualization and two structured correction rounds.',
      },
      {
        step: 4,
        titleFr: 'Bon à tirer & fabrication',
        titleEn: 'Pre-press Sign-off & Production',
        descFr: 'Contrôle colorimétrique, épreuve contractuelle et suivi d’impression.',
        descEn: 'Color proofing, contract proof sign-off and print production supervision.',
      },
    ],
    faqs: [
      {
        questionFr: 'Pouvez-vous concevoir la maquette si nous n’avons que des fichiers Word et Excel ?',
        questionEn: 'Can you design the layout if we only have Word and Excel files?',
        answerFr:
          'Oui, c’est notre flux le plus courant. Nous transformons vos textes et tableaux bruts en une publication structurée, illustrée d’infographies lisibles, prête pour l’impression et la diffusion numérique.',
        answerEn:
          'Yes, that is our most common workflow. We turn raw manuscripts and spreadsheets into a structured, illustrated publication ready for print and digital release.',
      },
    ],
    imageUrl: MANUELS_IMG,
    whatsappMessageFr:
      "Bonjour, je souhaite un devis pour la réalisation de manuels ou supports d'information.",
    whatsappMessageEn:
      'Hello, I would like a quote for Manuals & Information Materials.',
  },
  {
    id: 'srv-marquage',
    slug: 'marquage-gadgets-publicitaires',
    sortOrder: 3,
    published: true,
    titleFr: 'Marquage de gadgets publicitaires',
    titleEn: 'Promotional Branding & Merchandise',
    taglineFr: 'Objets d’entreprise, textile personnalisé et coffrets dirigeants aux finitions durables.',
    taglineEn: 'Corporate gifts, custom apparel and executive kits with lasting finishing quality.',
    summaryFr:
      'Nous fournissons et marquons des supports publicitaires et cadeaux institutionnels (agendas, stylos, mugs, textiles, clés USB, signalétique) adaptés à vos congrès, séminaires et vœux.',
    summaryEn:
      'We source and brand corporate merchandise and executive gifts (notebooks, pens, mugs, textiles, USB drives, signage) for conferences, seminars and corporate milestones.',
    benefitsFr: [
      'Sélection d’articles durables testés pour l’usage quotidien des décideurs',
      'Techniques de marquage adaptées : sérigraphie, tampographie, gravure laser, broderie, flocage',
      'Respect fidèle de vos codes couleurs Pantone et de la zone de protection de votre logo',
      'Conditionnement en lots pour vos délégations, foires et campagnes terrain',
    ],
    benefitsEn: [
      'Curated durable merchandise suited for daily executive use',
      'Precision branding: screen printing, pad printing, laser engraving, embroidery',
      'Strict adherence to brand color codes and logo clear-space rules',
      'Kit packaging ready for delegations, trade fairs and field deployments',
    ],
    offerings: [
      {
        titleFr: 'Coffrets VIP & papeterie de direction',
        titleEn: 'Executive Kits & Branded Stationery',
        descFr: 'Carnets reliés, stylos métalliques gravés, porte-documents et clés USB personnalisées.',
        descEn: 'Hardcover notebooks, laser-engraved metal pens, folios and custom USB drives.',
      },
      {
        titleFr: 'Textile & équipements terrain',
        titleEn: 'Apparel & Field Gear',
        descFr: 'Polos brodés, t-shirts événementiels, casquettes, gilets haute visibilité et tote bags.',
        descEn: 'Embroidered polos, event tees, caps, high-visibility vests and structured tote bags.',
      },
      {
        titleFr: 'Signalétique & PLV d’entreprise',
        titleEn: 'Corporate Signage & Display',
        descFr: 'Roll-ups, kakémonos, drapeaux publicitaires, plaques de porte et habillage de stands.',
        descEn: 'Roll-ups, X-banners, feather flags, office plaques and exhibition booth branding.',
      },
    ],
    processSteps: [
      {
        step: 1,
        titleFr: 'Sélection & recommandation',
        titleEn: 'Curation & Sourcing',
        descFr: 'Choix des supports adaptés à votre cible, quantité et enveloppe budgétaire.',
        descEn: 'Matching item quality and quantities to your audience and target budget.',
      },
      {
        step: 2,
        titleFr: 'Simulation visuelle (BAT)',
        titleEn: 'Digital Mockup Approval',
        descFr: 'Positionnement exact du logo et choix de la technique de marquage par article.',
        descEn: 'Exact logo placement proof and marking technique specification per item.',
      },
      {
        step: 3,
        titleFr: 'Production & contrôle qualité',
        titleEn: 'Production & Quality Check',
        descFr: 'Marquage en atelier, contrôle d’adhérence et vérification unitaire des lots.',
        descEn: 'In-house or partner workshop branding with batch durability inspection.',
      },
      {
        step: 4,
        titleFr: 'Livraison sur Conakry et régions',
        titleEn: 'Delivery in Conakry & Regions',
        descFr: 'Remise conditionnée au siège ou expédition sécurisée vers vos sites.',
        descEn: 'Packaged delivery to your headquarters or regional project sites.',
      },
    ],
    faqs: [
      {
        questionFr: 'Faut-il un minimum de commande pour les objets publicitaires ?',
        questionEn: 'Is there a minimum order quantity for promotional items?',
        answerFr:
          'Nous adaptons les seuils selon la technique : dès 25 à 50 pièces pour certains coffrets gravés ou impressions numériques, et par séries optimisées à partir de 100 pièces pour les grands événements.',
        answerEn:
          'Minimums depend on technique: starting from 25–50 units for engraved executive kits, and volume-optimized runs from 100+ units for major events.',
      },
    ],
    imageUrl: MARQUAGE_IMG,
    whatsappMessageFr:
      'Bonjour, je souhaite un devis pour le marquage de gadgets publicitaires.',
    whatsappMessageEn:
      'Hello, I would like a quote for Promotional Branding & Merchandise.',
  },
  {
    id: 'srv-impression',
    slug: 'impression-numerique-offset',
    sortOrder: 4,
    published: true,
    titleFr: 'Impression numérique et offset',
    titleEn: 'Digital & Offset Printing',
    taglineFr: 'Petits tirages urgents ou grands volumes institutionnels avec finitions haut de gamme.',
    taglineEn: 'Fast short-run digital or high-volume offset printing with executive finishes.',
    summaryFr:
      'Notre atelier maîtrise l’impression numérique haute définition pour vos besoins rapides et l’impression offset pour les grands tirages économiques : cartes de visite, brochures, affiches, bâches et rapports.',
    summaryEn:
      'We master high-definition digital printing for rapid turnarounds and commercial offset printing for cost-effective volume runs: business cards, brochures, posters, banners and annual reports.',
    benefitsFr: [
      'Arbitrage transparent entre numérique (court tirage rapide) et offset (grand volume optimisé)',
      'Large choix de papiers couchés, texturés et grammages jusqu’à 350 g/m²',
      'Finitions soignées : pelliculage mat/soft-touch, vernis sélectif, dos carré collé, piqûre à cheval',
      'Grand format extérieur et intérieur : bâches microperforées, vinyles, panneaux rigides',
    ],
    benefitsEn: [
      'Transparent guidance between digital (rapid short runs) and offset (volume cost efficiency)',
      'Curated selection of coated and textured paper stocks up to 350 gsm',
      'Executive finishing: matte/soft-touch lamination, spot UV, perfect binding, saddle stitch',
      'Large-format indoor & outdoor: mesh banners, adhesive vinyls, rigid boards',
    ],
    offerings: [
      {
        titleFr: 'Papeterie & documents commerciaux',
        titleEn: 'Stationery & Commercial Print',
        descFr: 'Cartes de visite, papier à en-tête, chemises à rabats, flyers, dépliants et carnets autocopiants.',
        descEn: 'Business cards, letterheads, pocket folders, flyers, tri-folds and carbonless forms.',
      },
      {
        titleFr: 'Éditions reliées & catalogues',
        titleEn: 'Bound Publications & Catalogs',
        descFr: 'Rapports annuels, magazines, livres institutionnels, brochures dos carré collé.',
        descEn: 'Annual reports, magazines, institutional books and perfect-bound brochures.',
      },
      {
        titleFr: 'Grands formats & affichage',
        titleEn: 'Large Format & Outdoor Display',
        descFr: 'Bâches grand format, vinyles vitrine, panneaux Forex/Alucobond et affiches événementielles.',
        descEn: 'Large-format banners, window vinyls, rigid Forex/Alucobond boards and event posters.',
      },
    ],
    processSteps: [
      {
        step: 1,
        titleFr: 'Spécification technique',
        titleEn: 'Technical Specification',
        descFr: 'Choix du format, papier, grammage, tirage et finition selon votre budget.',
        descEn: 'Selecting dimensions, stock weight, run volume and binding tailored to budget.',
      },
      {
        step: 2,
        titleFr: 'Vérification prépresse',
        titleEn: 'Pre-press Preflight',
        descFr: 'Contrôle des fonds perdus, résolution 300 DPI et profils CMJN avant calage.',
        descEn: 'Checking bleed margins, 300 DPI resolution and CMYK color profiles prior to press.',
      },
      {
        step: 3,
        titleFr: 'Impression & façonnage',
        titleEn: 'Press Run & Finishing',
        descFr: 'Tirage numérique ou offset, massicotage, pliage, pelliculage et reliure.',
        descEn: 'Digital or offset press run, precision trimming, folding, lamination and binding.',
      },
      {
        step: 4,
        titleFr: 'Contrôle & livraison',
        titleEn: 'Inspection & Delivery',
        descFr: 'Vérification colorimétrique par échantillonnage et livraison rapide à Conakry.',
        descEn: 'Sample-checked color accuracy and prompt delivery across Conakry.',
      },
    ],
    faqs: [
      {
        questionFr: 'Comment ajuster le coût d’un gros tirage sans perdre en qualité perçue ?',
        questionEn: 'How can we optimize a large print budget without losing executive quality?',
        answerFr:
          'Nous proposons systématiquement des options graduées sur le grammage intérieur, le format fini ou le passage en offset dès que le volume le justifie, tout en préservant une couverture noble.',
        answerEn:
          'We systematically offer tiered options on interior paper weight, trimmed dimensions, or switching to offset for higher volumes while keeping a premium cover stock.',
      },
    ],
    imageUrl: IMPRESSION_IMG,
    whatsappMessageFr:
      "Bonjour, je souhaite un devis pour l'impression numérique et offset.",
    whatsappMessageEn:
      'Hello, I would like a quote for Digital & Offset Printing.',
  },
];

export const INITIAL_GALLERY_CATEGORIES: GalleryCategory[] = [
  { id: 'cat-branding', slug: 'identite-visuelle', nameFr: 'Identité visuelle & Branding', nameEn: 'Visual Identity & Branding', sortOrder: 1 },
  { id: 'cat-print', slug: 'imprimerie-grands-formats', nameFr: 'Imprimerie & Grands formats', nameEn: 'Print & Large Format', sortOrder: 2 },
  { id: 'cat-merch', slug: 'marquage-objets', nameFr: 'Marquage & Objets publicitaires', nameEn: 'Promotional Merchandise', sortOrder: 3 },
  { id: 'cat-events', slug: 'evenementiel', nameFr: 'Événementiel', nameEn: 'Institutional Events', sortOrder: 4 },
  { id: 'cat-manuals', slug: 'supports-manuels', nameFr: 'Supports institutionnels & Manuels', nameEn: 'Institutional Manuals', sortOrder: 5 },
];

export const INITIAL_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    categoryId: 'cat-manuals',
    categorySlug: 'supports-manuels',
    titleFr: 'Rapport annuel & bilan d’impact institutionnel',
    titleEn: 'Annual Report & Institutional Impact Review',
    clientOrSector: 'Secteur bancaire & financier — Conakry',
    clientApproved: true,
    needFr:
      'Structurer 120 pages d’indicateurs financiers et d’engagements sociétaux dans un support bilingue destiné aux actionnaires et régulateurs.',
    needEn:
      'Structure 120 pages of financial metrics and social impact commitments in a bilingual publication for shareholders and regulators.',
    solutionFr:
      'Conception éditoriale complète, création de 28 infographies financières, couverture pelliculée soft-touch avec marquage grenat et impression offset en 800 exemplaires.',
    solutionEn:
      'Full editorial layout, 28 custom financial infographics, soft-touch laminated cover with garnet foil accents and 800-copy offset print run.',
    year: '2026',
    images: ['/images/real/gal_1_annual_report_a.jpg', '/images/real/gal_1_annual_report_b.jpg'],
    featured: true,
    sortOrder: 1,
    published: true,
  },
  {
    id: 'gal-2',
    categoryId: 'cat-print',
    categorySlug: 'imprimerie-grands-formats',
    titleFr: 'Chaîne d’impression offset pour édition économique',
    titleEn: 'Commercial Offset Press Run for Business Publication',
    clientOrSector: 'Presse & édition économique — Kaloum',
    clientApproved: true,
    needFr:
      'Garantir une régularité colorimétrique stricte et un façonnage dos carré collé pour une parution trimestrielle à grand tirage.',
    needEn:
      'Ensure strict color consistency and perfect-bound finishing for a high-volume quarterly business publication.',
    solutionFr:
      'Calage offset quadrichromie sur papier couché mat 135 g/m², couverture 300 g/m² vernis sélectif, livraison cadencée sous 7 jours ouvrés.',
    solutionEn:
      'Four-color offset run on 135 gsm matte coated stock, 300 gsm spot-UV cover, delivered on schedule within 7 business days.',
    year: '2026',
    images: ['/images/real/gal_2_offset_press_a.jpg', '/images/real/gal_2_offset_press_b.jpg'],
    featured: true,
    sortOrder: 2,
    published: true,
  },
  {
    id: 'gal-3',
    categoryId: 'cat-merch',
    categorySlug: 'marquage-objets',
    titleFr: 'Coffrets VIP & dotation séminaire de direction',
    titleEn: 'Executive Gift Kits & Leadership Summit Merchandise',
    clientOrSector: 'Acteur industriel & logistique — Guinée',
    clientApproved: true,
    needFr:
      'Équiper 250 participants d’un sommet sectoriel avec des objets utiles, sobres et fidèles à la charte de l’organisation.',
    needEn:
      'Equip 250 summit delegates with practical, refined corporate merchandise aligned with strict brand guidelines.',
    solutionFr:
      'Carnets reliés embossés, stylos métal gravés au laser, mugs céramique bicolores et sacs cabas en coton épais conditionnés par kit individuel.',
    solutionEn:
      'Debossed hardcover notebooks, laser-engraved metal pens, two-tone ceramic mugs and heavy cotton totes packed into individual delegate kits.',
    year: '2025',
    images: ['/images/real/gal_3_vip_gifts_a.jpg', '/images/real/gal_3_vip_gifts_b.jpg'],
    featured: true,
    sortOrder: 3,
    published: true,
  },
  {
    id: 'gal-4',
    categoryId: 'cat-branding',
    categorySlug: 'identite-visuelle',
    titleFr: 'Refonte d’identité visuelle & charte institutionnelle',
    titleEn: 'Corporate Rebranding & Visual Identity System',
    clientOrSector: 'Programme national & services — Conakry',
    clientApproved: true,
    needFr:
      'Moderniser une identité vieillissante afin de renforcer la crédibilité auprès des bailleurs internationaux et des usagers.',
    needEn:
      'Modernize an aging visual identity to strengthen credibility with international donors and national stakeholders.',
    solutionFr:
      'Audit de marque, nouveau système typographique et chromatique, guide normatif de 48 pages et déclinaison complète de la papeterie.',
    solutionEn:
      'Brand audit, new typography and color architecture, 48-page brand manual and full stationery suite.',
    year: '2025',
    images: ['/images/real/gal_4_branding_a.jpg', '/images/real/gal_4_branding_b.jpg'],
    featured: true,
    sortOrder: 4,
    published: true,
  },
  {
    id: 'gal-5',
    categoryId: 'cat-events',
    categorySlug: 'evenementiel',
    titleFr: 'Forum économique & dispositif d’accueil institutionnel',
    titleEn: 'Economic Forum & Institutional Event Branding',
    clientOrSector: 'Rencontres économiques — Conakry',
    clientApproved: true,
    needFr:
      'Concevoir l’ensemble de la signalétique, des fonds de scène, badges et dossiers participants pour un forum de deux jours.',
    needEn:
      'Design full wayfinding signage, stage backdrops, delegate badges and summit folders for a two-day economic forum.',
    solutionFr:
      'Direction artistique unifiée, production grand format anti-reflet, livrets programmes imprimés en numérique et accueil presse coordonné.',
    solutionEn:
      'Unified art direction, glare-free stage backdrops, digitally printed program booklets and coordinated press desk.',
    year: '2025',
    images: ['/images/real/gal_5_forum_event_a.jpg', '/images/real/gal_5_forum_event_b.jpg'],
    featured: true,
    sortOrder: 5,
    published: true,
  },
  {
    id: 'gal-6',
    categoryId: 'cat-manuals',
    categorySlug: 'supports-manuels',
    titleFr: 'Manuels de procédures & kits de formation terrain',
    titleEn: 'Operational Procedure Manuals & Field Training Kits',
    clientOrSector: 'Organisation internationale & santé publique',
    clientApproved: true,
    needFr:
      'Rendre accessibles des protocoles techniques complexes à des équipes régionales déployées sur l’ensemble du territoire.',
    needEn:
      'Make complex technical protocols clear and durable for regional field teams across the country.',
    solutionFr:
      'Simplification schématique, codification couleur par chapitre, reliure spirale métallique renforcée et couverture lavable.',
    solutionEn:
      'Visual diagramming, chapter color-coding, reinforced wire-o binding and wipeable protective covers.',
    year: '2026',
    images: ['/images/real/gal_6_manuals_a.jpg', '/images/real/gal_6_manuals_b.jpg'],
    featured: true,
    sortOrder: 6,
    published: true,
  },
];

export const INITIAL_PAGE_CONTENT: PageContent = {
  heroKickerFr: 'Agence conseil en communication 360° · Conakry depuis 2010',
  heroKickerEn: '360° Communication Advisory · Conakry since 2010',
  heroTitleFr: 'Donnez à votre institution l’image de son exigence.',
  heroTitleEn: 'Give your institution the stature of its ambition.',
  heroSubtitleFr:
    'De la stratégie éditoriale à l’impression offset et au marquage d’entreprise, CONCAM accompagne les décideurs publics et privés en République de Guinée.',
  heroSubtitleEn:
    'From brand strategy to commercial offset printing and corporate branding, CONCAM advises public and private leaders across the Republic of Guinea.',
  heroImageUrl: HERO_IMG,
  aboutIntroFr:
    'Fondée en 2010 au cœur de Kaloum et immatriculée en 2012, l’agence CONCAM — familièrement appelée « Com’Com » — réunit conseil stratégique, studio graphique, production imprimée et édition de presse économique au sein d’un même groupe.',
  aboutIntroEn:
    'Founded in 2010 in the heart of Kaloum and incorporated in 2012, CONCAM Agency — known locally as "Com’Com" — brings together strategic advisory, design studio, commercial print production and business media under one roof.',
  aboutMissionFr:
    'Notre vocation est double : doter les entreprises et institutions guinéennes d’outils de communication irréprochables sur le fond comme sur la forme, et éclairer l’écosystème entrepreneurial à travers Réussite Magazine et notre pôle média.',
  aboutMissionEn:
    'Our mission is twofold: equip Guinean companies and institutions with communication tools of impeccable substance and craft, and inform the business community through Réussite Magazine and our media division.',
  aboutQualityFr:
    'Chaque dossier bénéficie d’un interlocuteur unique, d’épreuves vérifiées avant tirage, d’une traçabilité rigoureuse et de délais tenus.',
  aboutQualityEn:
    'Every engagement includes a single dedicated account lead, verified pre-press proofs, strict quality traceability and reliable delivery schedules.',
  aboutTimeline: [
    {
      year: '2010',
      titleFr: 'Création de l’agence à Conakry',
      titleEn: 'Agency founded in Conakry',
      descFr: 'Lancement des premières activités de conseil en communication, publicité et production de supports pour les entreprises de la capitale.',
      descEn: 'Launch of communication advisory, advertising and print production services for Conakry enterprises.',
    },
    {
      year: '2012',
      titleFr: 'Immatriculation officielle & structuration SARLU',
      titleEn: 'Official Incorporation & SARLU Structuring',
      descFr: 'Inscription au RCCM du Tribunal de commerce de Kaloum et ouverture aux grands marchés institutionnels et bancaires.',
      descEn: 'Registered at the Kaloum Commercial Court (RCCM), expanding into institutional and banking tenders.',
    },
    {
      year: '2016',
      titleFr: 'Lancement de Réussite Magazine à Conakry',
      titleEn: 'Launch of Réussite Magazine in Conakry',
      descFr: 'Création de la branche presse économique du groupe, dédiée aux entrepreneurs, dirigeants et acteurs du développement guinéen.',
      descEn: 'Creation of the group’s business press arm dedicated to Guinean entrepreneurs and executives.',
    },
    {
      year: '2026',
      titleFr: 'Transformation digitale & hub média unifié',
      titleEn: 'Digital Transformation & Unified Media Hub',
      descFr: 'Déploiement de l’écosystème CONCAM intégrant conseil IA, catalogue administrable et passerelles vers les médias du groupe.',
      descEn: 'Launch of the unified CONCAM digital hub integrating AI advisory, dynamic portfolio and group media gateways.',
    },
  ],
  aboutTeam: [
    {
      name: 'Direction Générale CONCAM',
      roleFr: 'Stratégie & Relations Institutionnelles',
      roleEn: 'Strategy & Institutional Relations',
      bioFr: 'Pilote l’accompagnement des comptes bancaires, publics et internationaux depuis Manquepas, Kaloum.',
      bioEn: 'Leads banking, public-sector and international organization engagements from Manquepas, Kaloum.',
    },
    {
      name: 'Pôle Création & Édition',
      roleFr: 'Direction Artistique & Maquettage',
      roleEn: 'Art Direction & Editorial Layout',
      bioFr: 'Conçoit chartes graphiques, rapports annuels, manuels techniques et identités visuelles bilingues.',
      bioEn: 'Designs brand systems, annual reports, technical manuals and bilingual visual identities.',
    },
    {
      name: 'Atelier Production & Marquage',
      roleFr: 'Impression Numérique, Offset & Objets',
      roleEn: 'Digital, Offset Print & Merchandise',
      bioFr: 'Assure le contrôle prépresse, le tirage haute précision, le façonnage et le marquage d’objets.',
      bioEn: 'Oversees pre-press checks, high-precision press runs, finishing and executive merchandise branding.',
    },
    {
      name: 'Rédaction Réussite Magazine',
      roleFr: 'Presse Économique & Contenus Médias',
      roleEn: 'Business Press & Media Content',
      bioFr: 'Produit décryptages économiques, portraits de décideurs et relais éditoriaux sur reussitemagazine.info.',
      bioEn: 'Produces economic analyses, executive profiles and editorial coverage on reussitemagazine.info.',
    },
  ],
  presseIntroFr:
    'Au-delà des prestations d’agence, le groupe CONCAM anime un écosystème éditorial indépendant au service de l’information économique et entrepreneuriale en Guinée.',
  presseIntroEn:
    'Beyond agency services, the CONCAM group operates an independent editorial ecosystem serving economic and entrepreneurial journalism in Guinea.',
  homeBlocks: [
    { id: 'blk-hero', key: 'hero', labelFr: 'Bannière Hero', enabled: true, sortOrder: 1, animation: 'fade-up' },
    { id: 'blk-partners', key: 'partners', labelFr: 'Bandeau partenaires', enabled: true, sortOrder: 2, animation: 'none' },
    { id: 'blk-services', key: 'services', labelFr: 'Quatre services', enabled: true, sortOrder: 3, animation: 'slide-left' },
    { id: 'blk-stats', key: 'stats', labelFr: 'Compteurs clés', enabled: true, sortOrder: 4, animation: 'fade-up' },
    { id: 'blk-media', key: 'media_hub', labelFr: 'À la une (Médias)', enabled: true, sortOrder: 5, animation: 'fade-up' },
    { id: 'blk-gallery', key: 'gallery', labelFr: 'Sélection galerie', enabled: true, sortOrder: 6, animation: 'zoom-soft' },
    { id: 'blk-contact', key: 'contact_banner', labelFr: 'Bandeau contact', enabled: true, sortOrder: 7, animation: 'fade-up' },
  ],
  pageHeaders: {
    home: [
      {
        id: 'hdr-home-1',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_home_advisory.jpg',
        videoUrl: '',
        captionFr: 'Kaloum, Conakry · Conseil stratégique 360° & direction artistique',
        captionEn: 'Kaloum, Conakry · 360° Strategic Advisory & Art Direction',
        tagFr: 'Pôle I · Conseil 360°',
        tagEn: 'Pillar I · 360° Advisory',
        cardTitleFr: 'Conseil en communication 360°',
        cardTitleEn: '360° Communication Advisory',
        cardDescFr: 'Stratégie de marque, campagnes multicanales et relations publiques.',
        cardDescEn: 'Brand strategy, multi-channel campaigns & PR.',
        href: '/services/conseil-communication',
      },
      {
        id: 'hdr-home-2',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_home_conakry.jpg',
        videoUrl: '',
        captionFr: 'Ancrage institutionnel en République de Guinée depuis 2010',
        captionEn: 'Institutional anchorage in the Republic of Guinea since 2010',
        tagFr: 'Pôle II · Édition & Manuels',
        tagEn: 'Pillar II · Manuals & Guides',
        cardTitleFr: 'Manuels de procédures & supports',
        cardTitleEn: 'Procedure Manuals & Guides',
        cardDescFr: 'Ingénierie documentaire pour banques, ministères et grands groupes.',
        cardDescEn: 'Editorial documentation for banks, ministries & enterprises.',
        href: '/services/manuels-supports',
      },
      {
        id: 'hdr-home-3',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_home_offset.jpg',
        videoUrl: '',
        captionFr: 'Atelier d’édition et impression offset haute précision à Conakry',
        captionEn: 'Publishing studio and high-precision offset printing in Conakry',
        tagFr: 'Pôle III · Atelier Offset',
        tagEn: 'Pillar III · Offset Press',
        cardTitleFr: 'Impression numérique & offset',
        cardTitleEn: 'Digital & Offset Printing',
        cardDescFr: 'Tirages rapides, finitions luxe, catalogues et PLV durable.',
        cardDescEn: 'Rapid print runs, luxury finishes, catalogs and display.',
        href: '/services/impression-numerique-offset',
      },
      {
        id: 'hdr-home-4',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_home_summit.jpg',
        videoUrl: '',
        captionFr: 'Objets de direction, presse économique & Réussite Magazine',
        captionEn: 'Executive branding, business press & Réussite Magazine',
        tagFr: 'Pôle IV · Marquage & Média',
        tagEn: 'Pillar IV · Branding & Press',
        cardTitleFr: 'Marquage de gadgets publicitaires',
        cardTitleEn: 'Promotional Branding & Merchandise',
        cardDescFr: 'Coffrets dirigeants, textile brodé et signalétique sur mesure.',
        cardDescEn: 'Executive gift boxes, embroidered apparel and custom signage.',
        href: '/services/marquage-gadgets-publicitaires',
      },
    ],
    about: [
      {
        id: 'hdr-about-1',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_about_kaloum.jpg',
        videoUrl: '',
        captionFr: 'Kaloum, Conakry · Siège historique de l’agence CONCAM',
        captionEn: 'Kaloum, Conakry · Historic headquarters of CONCAM Agency',
      },
      {
        id: 'hdr-about-2',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_about_boardroom.jpg',
        videoUrl: '',
        captionFr: 'Direction conseil, relations institutionnelles et pilotage 360°',
        captionEn: 'Advisory boardroom, institutional relations and 360° leadership',
      },
      {
        id: 'hdr-about-3',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_about_atelier.jpg',
        videoUrl: '',
        captionFr: 'Atelier d’édition et contrôle qualité prépresse depuis 2010',
        captionEn: 'Publishing atelier and pre-press quality control since 2010',
      },
    ],
    services: [
      {
        id: 'hdr-srv-1',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_services_atelier.jpg',
        videoUrl: '',
        captionFr: 'Studio de conception éditoriale et préparation de supports institutionnels',
        captionEn: 'Editorial design studio and institutional publishing preparation',
      },
      {
        id: 'hdr-srv-2',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_services_press.jpg',
        videoUrl: '',
        captionFr: 'Impression numérique & offset grand volume à Conakry',
        captionEn: 'Commercial digital & offset printing press in Conakry',
      },
      {
        id: 'hdr-srv-3',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_services_advisory.jpg',
        videoUrl: '',
        captionFr: 'Conseil 360° et pilotage des campagnes institutionnelles',
        captionEn: '360° advisory and institutional campaign management',
      },
    ],
    presse: [
      {
        id: 'hdr-prs-1',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_presse_summit.jpg',
        videoUrl: '',
        captionFr: 'Couverture des sommets économiques et tribunes d’entrepreneurs en Guinée',
        captionEn: 'Coverage of economic summits and executive forums in Guinea',
      },
      {
        id: 'hdr-prs-2',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_presse_magazine.jpg',
        videoUrl: '',
        captionFr: 'Réussite Magazine — Rédaction, maquette et édition depuis 2016',
        captionEn: 'Réussite Magazine — Editorial desk, layout and publishing since 2016',
      },
      {
        id: 'hdr-prs-3',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_presse_newsroom.jpg',
        videoUrl: '',
        captionFr: 'MediaInfoPro — Fil d’information économique continue à Conakry',
        captionEn: 'MediaInfoPro — Continuous business news wire in Conakry',
      },
    ],
    galerie: [
      {
        id: 'hdr-gal-1',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_galerie_showcase.jpg',
        videoUrl: '',
        captionFr: 'Marquage premium, objets direction & identité de marque',
        captionEn: 'Executive branding, corporate gifts & brand architecture',
      },
      {
        id: 'hdr-gal-2',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_galerie_binding.jpg',
        videoUrl: '',
        captionFr: 'Édition technique, manuels de procédures et rapports annuels',
        captionEn: 'Technical publishing, procedure manuals and annual reports',
      },
      {
        id: 'hdr-gal-3',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_galerie_signage.jpg',
        videoUrl: '',
        captionFr: 'Signalétique institutionnelle et événements majeurs en Guinée',
        captionEn: 'Institutional signage and major economic forums in Guinea',
      },
    ],
    insights: [
      {
        id: 'hdr-ins-1',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_insights_desk.jpg',
        videoUrl: '',
        captionFr: 'Cahiers pratiques & guides éditoriaux pour directions communication',
        captionEn: 'Practical briefs & editorial guides for communication leaders',
      },
      {
        id: 'hdr-ins-2',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_insights_swatches.jpg',
        videoUrl: '',
        captionFr: 'Bonnes pratiques d’impression offset, reliure et manuels techniques',
        captionEn: 'Offset printing, bookbinding and technical manual best practices',
      },
      {
        id: 'hdr-ins-3',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_insights_strategy.jpg',
        videoUrl: '',
        captionFr: 'Accompagnement stratégique et structuration éditoriale en Guinée',
        captionEn: 'Strategic advisory and editorial structuring in Guinea',
      },
    ],
    contact: [
      {
        id: 'hdr-ctc-1',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_contact_street.jpg',
        videoUrl: '',
        captionFr: 'Quartier Manquepas · Commune de Kaloum, Conakry',
        captionEn: 'Manquepas District · Kaloum Municipality, Conakry',
      },
      {
        id: 'hdr-ctc-2',
        mediaType: 'image',
        imageUrl: '/images/real/hdr_contact_office.jpg',
        videoUrl: '',
        captionFr: 'Accueil sur rendez-vous et réponse garantie sous 24 heures ouvrées',
        captionEn: 'Consultations by appointment and 24-hour response pledge',
      },
    ],
  },
};

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'reussir-rapport-annuel-institutionnel-conakry',
    published: true,
    publishedAt: '2026-10-28',
    categoryFr: 'Supports institutionnels',
    categoryEn: 'Institutional Print',
    titleFr: 'Comment structurer un rapport annuel institutionnel crédible en Guinée',
    titleEn: 'How to structure a credible institutional annual report in Guinea',
    excerptFr:
      'Délais, choix du papier, mise en scène des chiffres clés et contrôle prépresse : la méthode CONCAM pour livrer sans stress.',
    excerptEn:
      'Timelines, paper stock selection, data visualization and pre-press checks: the CONCAM workflow for stress-free delivery.',
    contentFr: `Un rapport annuel est souvent le premier document examiné par un conseil d'administration, un partenaire technique ou un bailleur international. À Conakry, trop d'organisations lancent le maquettage à la dernière semaine avec des fichiers hétérogènes.

Chez CONCAM, nous recommandons d'anticiper sur cinq à six semaines dès que le volume dépasse 80 pages. La première étape consiste à geler le chemin de fer et à confier la conversion des tableaux Excel en infographies épurées.

Côté fabrication, le choix entre impression numérique et offset dépend directement du tirage : en deçà de 150 exemplaires, le numérique haute définition offre une réactivité idéale ; au-delà, l'offset réduit sensiblement le coût unitaire tout en autorisant des papiers texturés et des pelliculages soft-touch durables.

Vous préparez votre prochain bilan d'activité ? Consultez notre offre dédiée aux manuels et supports d'information ou échangez directement avec notre Conseiller CONCAM pour obtenir une estimation graduée sous 24 heures ouvrées.`,
    contentEn: `An annual report is often the first document scrutinized by a board of directors, technical partner or international donor. In Conakry, too many organizations start layout design in the final week with fragmented files.

At CONCAM, we recommend a five-to-six-week runway whenever a report exceeds 80 pages. The first milestone is locking the pagination plan and converting raw spreadsheets into clear executive infographics.

On production, choosing between digital and offset printing hinges on run size: under 150 copies, high-definition digital offers unmatched speed; above that threshold, commercial offset lowers unit costs significantly while enabling tactile cover stocks and soft-touch lamination.

Preparing your next activity review? Explore our Manuals & Information Materials service or speak with our CONCAM Advisor for a tiered estimate within 24 business hours.`,
    targetKeyword: 'conception rapport annuel Guinée',
    relatedServiceSlug: 'manuels-supports',
    imageUrl: '/images/real/blog_annual_report.jpg',
    readMinutes: 4,
  },
  {
    id: 'post-2',
    slug: 'impression-numerique-ou-offset-conakry-guide',
    published: true,
    publishedAt: '2026-10-14',
    categoryFr: 'Imprimerie Conakry',
    categoryEn: 'Printing Conakry',
    titleFr: 'Impression numérique ou offset à Conakry : quel choix pour optimiser votre budget ?',
    titleEn: 'Digital vs. offset printing in Conakry: how to optimize your print budget',
    excerptFr:
      'Comprendre le seuil de rentabilité, le rendu des couleurs et les finitions disponibles pour vos brochures, flyers et catalogues.',
    excerptEn:
      'Understanding cost thresholds, color fidelity and finishing options for corporate brochures, flyers and catalogs.',
    contentFr: `Lorsqu'une direction marketing ou un service achats demande un devis d'imprimerie à Conakry, la question du procédé — numérique ou offset — détermine à la fois le prix unitaire et le délai de livraison.

L'impression numérique convient parfaitement aux tirages urgents (24 à 72 heures), aux cartes de visite, aux dossiers de présentation en petite série ou aux documents personnalisés. L'impression offset, qui requiert la confection de plaques, devient très avantageuse dès 300 à 500 exemplaires sur des brochures, magazines ou affiches.

Pour maîtriser votre enveloppe budgétaire sans sacrifier la tenue du document, il est souvent plus judicieux d'ajuster le grammage des pages intérieures (par exemple 115 g/m² au lieu de 135 g/m²) tout en conservant une couverture épaisse de 300 g/m² avec pelliculage mat.

Demandez une étude comparative sur notre page Impression numérique et offset : nous fournissons systématiquement deux à trois options graduées.`,
    contentEn: `When a procurement or marketing team requests a printing quote in Conakry, choosing between digital and offset directly shapes both unit cost and turnaround time.

Digital printing excels for urgent turnarounds (24 to 72 hours), business cards, short-run board packets or variable-data mailings. Offset printing requires plate setup and becomes substantially more cost-effective from 300–500 copies upward on brochures, magazines and posters.

To optimize budget without compromising executive feel, adjusting interior paper weight (e.g., 115 gsm instead of 135 gsm) while maintaining a 300 gsm matte-laminated cover delivers nearly identical visual stature at a controlled cost.

Request a side-by-side comparison on our Digital & Offset Printing page: we always provide tiered options.`,
    targetKeyword: 'impression numérique et offset Guinée',
    relatedServiceSlug: 'impression-numerique-offset',
    imageUrl: '/images/real/blog_offset_digital.jpg',
    readMinutes: 3,
  },
  {
    id: 'post-3',
    slug: 'marquage-objets-publicitaires-evenements-guinee',
    published: true,
    publishedAt: '2026-09-29',
    categoryFr: 'Marque & Événementiel',
    categoryEn: 'Branding & Events',
    titleFr: 'Objets publicitaires d’entreprise à Conakry : miser sur l’utile plutôt que le jetable',
    titleEn: 'Corporate merchandise in Conakry: choosing lasting utility over throwaway items',
    excerptFr:
      'Pourquoi les institutions privilégient désormais carnets gravés, textiles brodés et kits dirigeants — et nos relais dans Réussite Magazine.',
    excerptEn:
      'Why institutions now favor engraved notebooks, embroidered apparel and executive kits — plus coverage in Réussite Magazine.',
    contentFr: `À l'occasion d'un forum économique, d'une assemblée générale ou d'une campagne institutionnelle à Conakry, les goodies distribués prolongent directement l'image de votre organisation dans le bureau de vos partenaires.

Un stylo qui s'efface ou un sac fragile dessert le message. À l'inverse, un carnet à couverture rigide embossée, un polo brodé au fil haute densité ou un mug céramique sobre restent visibles plusieurs années sur le lieu de travail.

À travers nos collaborations avec des acteurs majeurs publiés sur Réussite Magazine (reussitemagazine.info), nous observons une nette montée en gamme des dotations d'entreprise en Guinée.

Découvrez nos gammes de marquage de gadgets publicitaires ou demandez un BAT simulé avec votre logo sous 24 heures ouvrées.`,
    contentEn: `During an economic forum, annual general meeting or institutional campaign in Conakry, the corporate gifts you distribute carry your brand directly onto your partners' desks.

A pen that fails or a flimsy bag undermines your message. By contrast, a debossed hardcover notebook, high-density embroidered polo or understated ceramic mug stays visible for years.

Across our work with leading organizations featured in Réussite Magazine (reussitemagazine.info), we see a decisive shift toward refined, durable executive merchandise across Guinea.

Explore our Promotional Branding & Merchandise catalog or request a branded digital mockup within 24 business hours.`,
    targetKeyword: 'objets publicitaires Conakry',
    relatedServiceSlug: 'marquage-gadgets-publicitaires',
    imageUrl: '/images/real/blog_corporate_gifts.jpg',
    readMinutes: 3,
  },
];

export const INITIAL_SEO_CONFIGS: SeoConfig[] = [
  {
    routeKey: 'home',
    titleFr: 'CONCAM — Agence de communication à Conakry, Guinée (Com’Com)',
    titleEn: 'CONCAM — Communication & Marketing Agency in Conakry, Guinea',
    descriptionFr:
      'Agence conseil 360° à Conakry depuis 2010 : stratégie de communication, impression numérique et offset, manuels institutionnels et marquage publicitaire.',
    descriptionEn:
      '360° communication agency in Conakry since 2010: brand strategy, digital and offset printing, institutional manuals and corporate merchandise.',
    keywordsFr: 'agence de communication Conakry, agence de communication en Guinée, agence publicitaire Conakry',
    keywordsEn: 'communication agency Conakry, marketing agency Guinea, corporate printing Conakry',
    noIndex: false,
  },
  {
    routeKey: 'about',
    titleFr: 'À propos — Agence CONCAM (Com’Com) | Kaloum, Conakry',
    titleEn: 'About Us — CONCAM Agency (Com’Com) | Kaloum, Conakry',
    descriptionFr:
      'Fondée en 2010 à Kaloum, CONCAM SARLU accompagne institutions nationales, banques et entreprises privées en Guinée. Références, équipe et identité légale.',
    descriptionEn:
      'Founded in 2010 in Kaloum, CONCAM SARLU advises national institutions, banks and private companies in Guinea.',
    keywordsFr: 'communication institutionnelle Guinée, agence CONCAM Kaloum, Com Com Conakry',
    keywordsEn: 'institutional communication Guinea, CONCAM agency Conakry',
    noIndex: false,
  },
  {
    routeKey: 'services',
    titleFr: 'Services — Conseil, Impression, Manuels & Marquage | CONCAM Conakry',
    titleEn: 'Services — Advisory, Printing, Manuals & Branding | CONCAM Conakry',
    descriptionFr:
      'Découvrez les quatre pôles d’expertise de l’agence CONCAM à Conakry et notre branche presse économique.',
    descriptionEn:
      'Explore CONCAM Agency’s four core service lines in Conakry and our business media division.',
    keywordsFr: 'agence publicitaire Guinée, imprimerie Conakry, objets publicitaires Conakry',
    keywordsEn: 'advertising agency Guinea, printing Conakry, corporate gifts Conakry',
    noIndex: false,
  },
  {
    routeKey: 'galerie',
    titleFr: 'Galerie de réalisations — Projets institutionnels & marques | CONCAM',
    titleEn: 'Portfolio Gallery — Institutional & Brand Projects | CONCAM',
    descriptionFr:
      'Parcourez les réalisations CONCAM par catégorie : identité visuelle, rapports annuels, impression offset, marquage et événementiel en Guinée.',
    descriptionEn:
      'Browse CONCAM case studies by category: visual identity, annual reports, offset print, corporate gifts and events in Guinea.',
    keywordsFr: 'branding et identité visuelle Conakry, événementiel Conakry, réalisations CONCAM',
    keywordsEn: 'branding Conakry, event production Guinea, CONCAM portfolio',
    noIndex: false,
  },
  {
    routeKey: 'contact',
    titleFr: 'Contact & Devis — Agence CONCAM Manquepas, Kaloum, Conakry',
    titleEn: 'Contact & Quote — CONCAM Agency Manquepas, Kaloum, Conakry',
    descriptionFr:
      'Contactez l’agence CONCAM à Manquepas (Kaloum, Conakry) par formulaire, téléphone ou WhatsApp. Réponse et devis gradué sous 24 heures ouvrées.',
    descriptionEn:
      'Reach CONCAM Agency in Manquepas (Kaloum, Conakry) via form, phone or WhatsApp. Tiered quote within 24 business hours.',
    keywordsFr: 'contact agence communication Conakry, devis imprimerie Conakry',
    keywordsEn: 'contact communication agency Conakry, print quote Guinea',
    noIndex: false,
  },
  {
    routeKey: 'presse-edition',
    titleFr: 'Presse et édition — Réussite Magazine & pôle média | Groupe CONCAM',
    titleEn: 'Press & Publishing — Réussite Magazine & Media Hub | CONCAM Group',
    descriptionFr:
      'Découvrez la branche presse du groupe CONCAM : Réussite Magazine (reussitemagazine.info) et le site d’information mediainfopro.net.',
    descriptionEn:
      'Discover the CONCAM Group press division: Réussite Magazine (reussitemagazine.info) and mediainfopro.net.',
    keywordsFr: 'magazine économique Guinée, Réussite Magazine Guinée, site média info Guinée',
    keywordsEn: 'Guinean business magazine, Reussite Magazine Guinea',
    noIndex: false,
  },
  {
    routeKey: 'actualites-conseils',
    titleFr: 'Actualités et conseils en communication & impression | CONCAM',
    titleEn: 'Insights & Advisory on Communication & Print | CONCAM',
    descriptionFr:
      'Guides pratiques, études de cas et conseils d’experts sur la communication institutionnelle, l’impression et le branding en Guinée.',
    descriptionEn:
      'Practical guides, case studies and expert insights on institutional communication, print and branding in Guinea.',
    keywordsFr: 'conseil communication entreprise Guinée, impression brochures Conakry',
    keywordsEn: 'corporate communication advice Guinea, brochure printing Conakry',
    noIndex: false,
  },
];

export const INITIAL_CHATBOT_CONFIG: ChatbotConfig = {
  voiceEnabled: true,
  toneFr:
    'Professionnel, posé, empathique et orienté conversion : écoute active, qualification BANT concise, argumentation par les références publiées et orientation vers devis ou WhatsApp.',
  toneEn:
    'Professional, composed, empathetic and conversion-focused: active listening, concise BANT qualification, proof-backed recommendations and clear next step.',
  welcomeFr:
    'Bonjour et bienvenue chez CONCAM. Je suis votre Conseiller CONCAM : quel projet de communication, d’impression ou de marquage souhaitez-vous concrétiser ?',
  welcomeEn:
    'Hello and welcome to CONCAM. I am your CONCAM Advisor: which communication, printing or corporate branding project would you like to launch?',
  escalationEmail: 'agenceconcam2@gmail.com',
  escalationWhatsapp: '+224 622 85 70 35',
};

export const COMMERCIAL_PLAYBOOK_DOCS: Array<Omit<KbDocument, 'updatedAt'>> = [
  {
    id: 'kb-playbook-bant',
    title: 'Méthode commerciale BANT & qualification CONCAM',
    category: 'commercial_playbook',
    active: true,
    autoIndexed: false,
    content: `IDENTITÉ : Tu es « Conseiller CONCAM », représentant commercial senior de l'agence CONCAM (Com'Com) à Manquepas, Kaloum, Conakry, Guinée.
MÉTHODE DE VENTE EN 5 ÉTAPES :
1. Accueil & cadrage : salue chaleureusement en une phrase et adapte ta question d'ouverture à la page consultée par le visiteur.
2. Découverte du besoin (3 à 6 questions courtes, jamais toutes d'un bloc — 1 à 2 questions par tour) : secteur & organisation, projet visé (nature, volume/pages), échéance souhaitée, budget indicatif ou existence d'une maquette, décideur.
3. Point de douleur : reformule le besoin et mets en évidence l'enjeu business sous-jacent (crédibilité institutionnelle, visibilité, qualité de finition, respect des délais, maîtrise du coût) puis demande validation.
4. Recommandation argumentée : propose le service exact de CONCAM (Conseil en communication / Manuels & supports / Marquage de gadgets / Impression numérique & offset) avec 2 à 3 arguments de valeur appuyés sur nos références publiées (Ecobank, UGAR, Activa, ANIES, GUI, Tractopo Guinée, Kagny Technology, UBAC, NSS) et nos réalisations de la galerie, avec le lien vers la page service.
5. Conclusion & transfert : propose l'une des trois issues concrètes :
   - Préparation du formulaire de devis pré-rempli (« proposition graduée sous 24 heures ouvrées ») ;
   - Transfert WhatsApp avec le récapitulatif de l'échange pré-rempli ;
   - Collecte de nom, organisation, courriel et téléphone pour rappel planifié.`,
  },
  {
    id: 'kb-playbook-objections',
    title: 'Traitement des objections (prix, délais, crédibilité, besoin flou)',
    category: 'commercial_playbook',
    active: true,
    autoIndexed: false,
    content: `RÈGLES SUR LES OBJECTIONS : Ton empathique, posé, jamais défensif.
- OBJECTION PRIX (« vos tarifs sont trop élevés par rapport à un autre devis ») :
  1. Reconnais légitimement le critère budgétaire.
  2. Précise la valeur incluse dans nos devis : accompagnement complet (conception, relectures, épreuves contractuelles, contrôle qualité) et niveau d'exigence éprouvé auprès d'acteurs institutionnels (Ecobank, Activa, ANIES, UGAR).
  3. Propose des options graduées sans brader ni inventer de tarif ferme : demande sur quel poste le visiteur souhaite ajuster — le volume/tirage, le grammage/papier et finitions, ou l'étendue de la conception. Si le visiteur choisit le papier, explique que deux grammages et finitions offrent un rendu visuel très proche à coût maîtrisé, puis propose un devis ajusté par courriel ou WhatsApp.
- OBJECTION DÉLAIS : ne jamais inventer de délai contractuel ferme ; indique un ordre de grandeur indicatif selon la complexité (ex. 4 à 6 semaines pour un rapport annuel avec conception + offset, 24 à 72h pour de petits tirages numériques simples après validation du BAT) et renvoie au devis pour calendrier engageant.
- BESOIN FLOU (« notre image est vieillissante », « je ne sais pas trop ce qu'il me faut ») :
  Normalise la situation, et si le mode vocal est activé, propose explicitement de passer en mode vocal (« Que diriez-vous qu'on en parle de vive voix ? Vous pouvez appuyer sur le bouton micro pour m'expliquer votre situation en deux minutes ») afin de bâtir ensuite une démarche claire (rafraîchissement d'identité, étapes, réalisations comparables de la galerie).
- GARDE-FOUS ABSOLUS :
  Ne jamais inventer de prix chiffrés fermes, de remises chiffrées inventées, de délais contractuels ou de références clients absentes de la base. Si une question sort du périmètre publié, réponds honnêtement et propose la mise en relation avec un conseiller humain.`,
  },
];

export const INITIAL_SAMPLE_LEADS: LeadRecord[] = [
  {
    id: 'lead-demo-1',
    name: 'Mamadou Saliou Diallo',
    organization: 'Banque Atlantique Guinée — Direction Communication',
    email: 'm.diallo@exemple-institution.gn',
    phone: '+224 622 00 11 22',
    serviceSlug: 'manuels-supports',
    message: 'Demande de devis pour la conception et l’impression offset de notre rapport annuel (120 pages, 500 exemplaires).',
    source: 'chatbot',
    status: 'qualifie',
    consentRgpd: true,
    doubleOptInConfirmed: true,
    notes: 'Qualifié par Conseiller CONCAM — échéance 6 semaines, maquette à concevoir.',
    createdAt: '2026-11-11T10:15:00.000Z',
    expiresAt: '2027-11-11T10:15:00.000Z',
  },
  {
    id: 'lead-demo-2',
    name: 'Aïssatou Barry',
    organization: 'ONG Horizon Santé Guinée',
    email: 'abarry@horizonsante-gn.org',
    phone: '+224 628 45 78 90',
    serviceSlug: 'marquage-gadgets-publicitaires',
    message: 'Besoin de 200 carnets embossés, stylos gravés et polos brodés pour notre atelier national à Conakry.',
    source: 'quote_form',
    status: 'devis_envoye',
    consentRgpd: true,
    doubleOptInConfirmed: true,
    notes: 'Devis gradué transmis avec deux options de grammage papier pour les carnets.',
    createdAt: '2026-11-10T14:30:00.000Z',
    expiresAt: '2027-11-10T14:30:00.000Z',
  },
];
