export type Lang = 'fr' | 'en';

export type AnimationPreset = 'fade-up' | 'slide-left' | 'slide-right' | 'zoom-soft' | 'none';

export type ParallaxIntensity = 'subtle' | 'cinematic' | 'intense' | 'ultra';

export type HeaderPageKey =
  | 'home'
  | 'about'
  | 'services'
  | 'presse'
  | 'galerie'
  | 'insights'
  | 'contact';

export interface HeaderSlideItem {
  id: string;
  mediaType: 'image' | 'video';
  imageUrl: string;
  videoUrl?: string;
  captionFr: string;
  captionEn: string;
  tagFr?: string;
  tagEn?: string;
  cardTitleFr?: string;
  cardTitleEn?: string;
  cardDescFr?: string;
  cardDescEn?: string;
  href?: string;
}

export interface BilingualText {
  fr: string;
  en: string;
}

export interface SiteSettings {
  companyName: string;
  brandAlias: string;
  legalForm: string;
  foundedYear: number;
  registeredYear: number;
  rccm: string;
  ncc: string;
  nif: string;
  taxCategory: string;
  address: BilingualText;
  phones: string[];
  whatsappNumber: string;
  whatsappDefaultMsgFr: string;
  whatsappDefaultMsgEn: string;
  agencyEmail: string;
  magazineEmail: string;
  hoursFr: string;
  hoursEn: string;
  mapLat: number;
  mapLng: number;
  socialFacebook: string;
  socialTiktok: string;
  socialLinkedin: string;
  preloaderEnabled: boolean;
  animationsEnabled: boolean;
  parallaxIntensity?: ParallaxIntensity;
  maintenanceMode: boolean;
  maintenanceMessageFr: string;
  maintenanceMessageEn: string;
  partners: string[];
  stats: {
    yearsExperience: number;
    projectsCompleted: number;
    clientsSupported: number;
  };
}

export interface MediaHubConfig {
  reussiteMagazineUrl: string;
  reussiteMagazineEnabled: boolean;
  reussiteMagazineDescFr: string;
  reussiteMagazineDescEn: string;
  mediaInfoProUrl: string;
  mediaInfoProEnabled: boolean;
  mediaInfoProStatusNote: string;
  mediaInfoProDescFr: string;
  mediaInfoProDescEn: string;
  headlinesFeedEnabled: boolean;
}

export interface ServiceOffering {
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
}

export interface ServiceProcessStep {
  step: number;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
}

export interface ServiceFaq {
  questionFr: string;
  questionEn: string;
  answerFr: string;
  answerEn: string;
}

export interface ServiceItem {
  id: string;
  slug: string;
  sortOrder: number;
  published: boolean;
  titleFr: string;
  titleEn: string;
  taglineFr: string;
  taglineEn: string;
  summaryFr: string;
  summaryEn: string;
  benefitsFr: string[];
  benefitsEn: string[];
  offerings: ServiceOffering[];
  processSteps: ServiceProcessStep[];
  faqs: ServiceFaq[];
  imageUrl: string;
  whatsappMessageFr: string;
  whatsappMessageEn: string;
}

export interface GalleryCategory {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  sortOrder: number;
}

export interface GalleryItem {
  id: string;
  categoryId: string;
  categorySlug: string;
  titleFr: string;
  titleEn: string;
  clientOrSector: string;
  clientApproved: boolean;
  needFr: string;
  needEn: string;
  solutionFr: string;
  solutionEn: string;
  year: string;
  images: string[];
  featured: boolean;
  sortOrder: number;
  published: boolean;
}

export interface HomeBlockConfig {
  id: string;
  key: 'hero' | 'partners' | 'services' | 'stats' | 'media_hub' | 'gallery' | 'contact_banner';
  labelFr: string;
  enabled: boolean;
  sortOrder: number;
  animation: AnimationPreset;
}

export interface PageContent {
  heroTitleFr: string;
  heroTitleEn: string;
  heroSubtitleFr: string;
  heroSubtitleEn: string;
  heroKickerFr: string;
  heroKickerEn: string;
  heroImageUrl: string;
  aboutIntroFr: string;
  aboutIntroEn: string;
  aboutMissionFr: string;
  aboutMissionEn: string;
  aboutQualityFr: string;
  aboutQualityEn: string;
  aboutTimeline: Array<{
    year: string;
    titleFr: string;
    titleEn: string;
    descFr: string;
    descEn: string;
  }>;
  aboutTeam: Array<{
    name: string;
    roleFr: string;
    roleEn: string;
    bioFr: string;
    bioEn: string;
  }>;
  presseIntroFr: string;
  presseIntroEn: string;
  homeBlocks: HomeBlockConfig[];
  pageHeaders?: Partial<Record<HeaderPageKey, HeaderSlideItem[]>>;
}

export interface BlogPost {
  id: string;
  slug: string;
  published: boolean;
  publishedAt: string;
  categoryFr: string;
  categoryEn: string;
  titleFr: string;
  titleEn: string;
  excerptFr: string;
  excerptEn: string;
  contentFr: string;
  contentEn: string;
  targetKeyword: string;
  relatedServiceSlug: string;
  imageUrl: string;
  readMinutes: number;
}

export interface SeoConfig {
  routeKey: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  keywordsFr: string;
  keywordsEn: string;
  noIndex: boolean;
}

export interface RedirectRule {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
}

export interface MediaHeadline {
  id: string;
  source: 'reussite' | 'mediainfopro';
  sourceName: string;
  titleFr: string;
  titleEn: string;
  date: string;
  url: string;
  liveFetched: boolean;
}

export interface ChatbotConfig {
  voiceEnabled: boolean;
  toneFr: string;
  toneEn: string;
  welcomeFr: string;
  welcomeEn: string;
  escalationEmail: string;
  escalationWhatsapp: string;
}

export interface KbDocument {
  id: string;
  title: string;
  category: 'commercial_playbook' | 'service' | 'gallery' | 'agency' | 'faq';
  content: string;
  active: boolean;
  autoIndexed: boolean;
  updatedAt: string;
}

export interface LeadRecord {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  serviceSlug: string;
  message: string;
  source: 'contact_form' | 'quote_form' | 'popup_quote' | 'popup_brochure' | 'popup_newsletter' | 'chatbot' | 'admin_manual';
  status: 'nouveau' | 'en_cours' | 'qualifie' | 'devis_envoye' | 'cloture';
  consentRgpd: boolean;
  doubleOptInConfirmed: boolean;
  notes: string;
  createdAt: string;
  expiresAt: string;
}

export interface ChatSessionRecord {
  id: string;
  lang: Lang;
  pagesVisited: string[];
  detectedNeed: string;
  painPoint: string;
  recommendedService: string;
  outcome: 'en_cours' | 'devis' | 'whatsapp' | 'rappel';
  summary: string;
  satisfaction: number | null;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    mode: 'text' | 'voice';
    createdAt: string;
  }>;
}

export interface PublicSiteData {
  settings: SiteSettings;
  mediaHub: MediaHubConfig;
  services: ServiceItem[];
  galleryCategories: GalleryCategory[];
  galleryItems: GalleryItem[];
  pageContent: PageContent;
  blogPosts: BlogPost[];
  seoConfigs: SeoConfig[];
  chatbotConfig: ChatbotConfig;
}

export type AdminRole = 'admin' | 'editor' | 'commercial';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entity: string;
  field: string;
  summary: string;
  createdAt: string;
}

export interface BackupSnapshotInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export interface SearchResultItem {
  type: 'service' | 'gallery' | 'blog';
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  href: string;
  imageUrl?: string;
}
