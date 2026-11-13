import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Layers,
  Images,
  FileText,
  Newspaper,
  Users,
  Bot,
  BarChart3,
  Shield,
  Search,
  LogOut,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  ExternalLink,
  GripVertical,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { ConcamLogo } from '../components/ConcamLogo';
import { useSite } from '../context/SiteContext';
import {
  ProspectsModule,
  ChatbotModule,
  StatisticsModule,
  UsersAndAuditModule,
  SeoModule,
  type AnalyticsOverview,
} from '../components/AdminModulesPart2';
import {
  AboutAndPresseEditor,
  BlogPostFullEditor,
  PageHeadersEditor,
  ServiceFullEditor,
  uploadMediaFile,
} from '../components/AdminEditors';
import type {
  AdminRole,
  AdminUser,
  AnimationPreset,
  AuditLogEntry,
  BackupSnapshotInfo,
  BlogPost,
  ChatbotConfig,
  ChatSessionRecord,
  GalleryCategory,
  GalleryItem,
  KbDocument,
  LeadRecord,
  MediaHubConfig,
  PageContent,
  RedirectRule,
  SeoConfig,
  ServiceItem,
  SiteSettings,
} from '../types/concam';

type ModuleKey =
  | 'contacts'
  | 'services'
  | 'gallery'
  | 'pages'
  | 'media'
  | 'leads'
  | 'chatbot'
  | 'stats'
  | 'users'
  | 'seo';

interface AdminOverviewData {
  role: AdminRole;
  analytics: AnalyticsOverview;
  leads: LeadRecord[];
  chatSessions: ChatSessionRecord[];
  settings: SiteSettings;
  mediaHub: MediaHubConfig;
  services: ServiceItem[];
  galleryCategories: GalleryCategory[];
  galleryItems: GalleryItem[];
  pageContent: PageContent;
  blogPosts: BlogPost[];
  seoConfigs: SeoConfig[];
  redirects: RedirectRule[];
  chatbotConfig: ChatbotConfig;
  kbDocuments: KbDocument[];
  users: AdminUser[];
  auditLogs: AuditLogEntry[];
  backups: BackupSnapshotInfo[];
}

export function AdminDashboard() {
  const { refreshSiteData } = useSite();
  const [authUser, setAuthUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    totpEnabled?: boolean;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login form & 2FA state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [pending2faToken, setPending2faToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleKey>('stats');
  const [toast, setToast] = useState('');

  // Editable states for Modules 1-5
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings | null>(null);
  const [mediaDraft, setMediaDraft] = useState<MediaHubConfig | null>(null);
  const [pagesDraft, setPagesDraft] = useState<PageContent | null>(null);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [draggedGalleryIdx, setDraggedGalleryIdx] = useState<number | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [newCatFr, setNewCatFr] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [rssCheckResult, setRssCheckResult] = useState<{
    reussite: { ok: boolean; count: number };
    mediainfopro: { ok: boolean; count: number };
  } | null>(null);
  const [rssChecking, setRssChecking] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3500);
  };

  // Central admin fetch wrapper: surfaces server errors instead of silently
  // pretending success, and returns to the login screen when the session
  // cookie has expired (or the account was disabled) mid-session.
  const adminFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit): Promise<{ ok: boolean; json: any }> => {
      let res: Response;
      try {
        res = await fetch(input, init);
      } catch {
        return { ok: false, json: { error: 'Connexion au serveur impossible.' } };
      }
      if (res.status === 401) {
        setAuthUser(null);
        setOverview(null);
        setLoginError('Session expirée — veuillez vous reconnecter.');
        return { ok: false, json: { error: 'Session expirée.' } };
      }
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = {};
      }
      return { ok: res.ok, json };
    },
    [],
  );

  const fetchOverview = useCallback(async () => {
    const res = await fetch('/api/admin/overview');
    if (res.status === 401) {
      setAuthUser(null);
      setOverview(null);
      setLoginError('Session expirée — veuillez vous reconnecter.');
      return;
    }
    if (res.ok) {
      const json = (await res.json()) as AdminOverviewData;
      setOverview(json);
      setSettingsDraft(json.settings);
      setMediaDraft(json.mediaHub);
      setPagesDraft(json.pageContent);
      if (!editingService && json.services[0]) setEditingService(json.services[0]);
      await refreshSiteData();
    }
  }, [refreshSiteData, editingService]);

  const refreshAuthUser = useCallback(async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const json = await res.json();
      if (json.user) setAuthUser(json.user);
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((json) => {
        if (json.user) {
          setAuthUser(json.user);
          const defaultMod: ModuleKey = json.user.role === 'editor' ? 'services' : json.user.role === 'commercial' ? 'leads' : 'stats';
          setActiveModule(defaultMod);
          fetchOverview();
        }
      })
      .finally(() => setAuthLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completeAuthSuccess = async (user: {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    totpEnabled?: boolean;
  }) => {
    setAuthUser(user);
    setPending2faToken(null);
    setTotpCode('');
    const defaultMod: ModuleKey = user.role === 'editor' ? 'services' : user.role === 'commercial' ? 'leads' : 'stats';
    setActiveModule(defaultMod);
    await fetchOverview();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoginError(json.error || 'Identifiants invalides');
      return;
    }
    if (json.requires2fa && json.pendingToken) {
      setPending2faToken(json.pendingToken);
      return;
    }
    await completeAuthSuccess(json.user);
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendingToken: pending2faToken, code: totpCode }),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoginError(json.error || 'Code 2FA invalide');
      return;
    }
    await completeAuthSuccess(json.user);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
    setOverview(null);
    setPending2faToken(null);
    setLoginPassword('');
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#F5F3F3] text-[#0F0C0C]/70 flex items-center justify-center text-sm">Chargement...</div>;
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-[#F5F3F3] text-[#0F0C0C] flex items-center justify-center p-4">
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] w-full max-w-md p-8 space-y-6 shadow-sm">
          <div className="space-y-2">
            <ConcamLogo size="md" />
            <h1 className="font-serif text-2xl font-bold text-[#0F0C0C] pt-2">
              Administration CONCAM
            </h1>
            <p className="text-xs text-[#0F0C0C]/65">
              Accès réservé aux administrateurs, éditeurs et responsables commerciaux habilités.
            </p>
          </div>

          {pending2faToken ? (
            <form onSubmit={handleVerify2fa} className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A30013]">
                <ShieldCheck className="w-4 h-4" />
                <span>Vérification en deux étapes (TOTP)</span>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Code à 6 chiffres généré par votre application d’authentification
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-3 py-2.5 text-base tracking-[0.25em] text-center font-mono tabular-nums border border-[#E1DFDE] rounded-[6px]"
                />
              </div>
              {loginError && <p className="text-xs text-[#E40014] font-medium">{loginError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold bg-[#A30013] hover:bg-[#861213] text-white rounded-[6px] cursor-pointer"
              >
                Valider la connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setPending2faToken(null);
                  setTotpCode('');
                  setLoginError('');
                }}
                className="w-full py-2 text-xs text-[#0F0C0C]/65 hover:text-[#0F0C0C] cursor-pointer"
              >
                ← Revenir à l’identification
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Courriel professionnel</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nom@concam.gn"
                  className="w-full px-3 py-2.5 text-sm border border-[#E1DFDE] rounded-[6px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E1DFDE] rounded-[6px]"
                />
              </div>
              {loginError && <p className="text-xs text-[#E40014] font-medium">{loginError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold bg-[#A30013] hover:bg-[#861213] text-white rounded-[6px] cursor-pointer"
              >
                Se connecter
              </button>
            </form>
          )}

          <div className="border-t border-[#E1DFDE] pt-4 text-center">
            <Link to="/" className="text-xs font-semibold text-[#A30013] hover:underline">
              ← Retour au site public CONCAM
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{ key: ModuleKey; label: string; icon: React.ReactNode; roles: AdminRole[] }> = [
    { key: 'stats', label: 'Statistiques & CWV', icon: <BarChart3 className="w-4 h-4" />, roles: ['admin', 'editor', 'commercial'] },
    { key: 'leads', label: 'Prospects & Leads', icon: <Users className="w-4 h-4" />, roles: ['admin', 'commercial'] },
    { key: 'chatbot', label: 'Chatbot & RAG', icon: <Bot className="w-4 h-4" />, roles: ['admin', 'commercial'] },
    { key: 'contacts', label: 'Informations de contact', icon: <Phone className="w-4 h-4" />, roles: ['admin'] },
    { key: 'services', label: 'Services', icon: <Layers className="w-4 h-4" />, roles: ['admin', 'editor'] },
    { key: 'gallery', label: 'Galerie', icon: <Images className="w-4 h-4" />, roles: ['admin', 'editor'] },
    { key: 'pages', label: 'Pages, Blocs & Blog', icon: <FileText className="w-4 h-4" />, roles: ['admin', 'editor'] },
    { key: 'media', label: 'Médias du groupe', icon: <Newspaper className="w-4 h-4" />, roles: ['admin', 'editor'] },
    { key: 'seo', label: 'Paramètres SEO', icon: <Search className="w-4 h-4" />, roles: ['admin', 'editor'] },
    { key: 'users', label: 'Utilisateurs & Audit', icon: <Shield className="w-4 h-4" />, roles: ['admin'] },
  ];

  const allowedNav = navItems.filter((n) => n.roles.includes(authUser.role));

  // Save handlers for Modules 1-5
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsDraft) return;
    const { ok, json } = await adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsDraft),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’enregistrement des coordonnées.');
      return;
    }
    await fetchOverview();
    notify('Coordonnées & paramètres répercutés sur tout le site et le chatbot.');
  };

  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    const { ok, json } = await adminFetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingService),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’enregistrement du service.');
      return;
    }
    await fetchOverview();
    notify('Service enregistré et réindexé dans le chatbot.');
  };

  const deleteServiceItem = async (id: string) => {
    const { ok, json } = await adminFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    if (!ok) {
      notify(json.error || 'Échec de la suppression du service.');
      return;
    }
    setEditingService(null);
    await fetchOverview();
    notify('Service supprimé.');
  };

  const saveGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem) return;
    const { ok, json } = await adminFetch('/api/admin/gallery/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingGalleryItem,
        images: editingGalleryItem.images.filter(Boolean),
      }),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’enregistrement de la réalisation.');
      return;
    }
    setEditingGalleryItem(null);
    await fetchOverview();
    notify('Réalisation enregistrée dans la galerie.');
  };

  const reorderGalleryTo = async (fromIdx: number, toIdx: number) => {
    if (!overview || fromIdx === toIdx || toIdx < 0 || toIdx >= overview.galleryItems.length) return;
    const reordered = [...overview.galleryItems];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    // Sequential requests: parallel posts can be processed out of order and
    // leave the persisted sortOrder inconsistent with the requested layout.
    for (let i = 0; i < reordered.length; i++) {
      const { ok } = await adminFetch('/api/admin/gallery/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reordered[i], sortOrder: i + 1 }),
      });
      if (!ok) {
        notify('Échec du réordonnancement de la galerie.');
        await fetchOverview();
        return;
      }
    }
    await fetchOverview();
    notify('Ordre de la galerie mis à jour.');
  };

  const moveGalleryItem = async (idx: number, dir: -1 | 1) => {
    await reorderGalleryTo(idx, idx + dir);
  };

  const savePages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagesDraft) return;
    const pagesRes = await adminFetch('/api/admin/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pagesDraft),
    });
    if (!pagesRes.ok) {
      notify(pagesRes.json.error || 'Échec de l’enregistrement des contenus pages.');
      return;
    }
    // Global animation settings are admin-only; editors never persist them here.
    if (settingsDraft && authUser?.role === 'admin') {
      const settingsRes = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsDraft),
      });
      if (!settingsRes.ok) {
        notify(settingsRes.json.error || 'Contenus pages enregistrés, mais échec des paramètres d’animations.');
        await fetchOverview();
        return;
      }
    }
    await fetchOverview();
    notify('Contenus pages, ordre des blocs et paramètres d’animations mis à jour.');
  };

  const moveHomeBlock = (idx: number, dir: -1 | 1) => {
    if (!pagesDraft) return;
    const sorted = [...pagesDraft.homeBlocks].sort((a, b) => a.sortOrder - b.sortOrder);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const swapped = [...sorted];
    const tmp = swapped[idx];
    swapped[idx] = swapped[target];
    swapped[target] = tmp;
    const reindexed = swapped.map((b, i) => ({ ...b, sortOrder: i + 1 }));
    setPagesDraft({ ...pagesDraft, homeBlocks: reindexed });
  };

  const applyAllBlockChoreography = (mode: 'alternating' | 'zoom-soft' | 'none') => {
    if (!pagesDraft) return;
    const updated = pagesDraft.homeBlocks.map((b, idx) => ({
      ...b,
      animation:
        mode === 'alternating'
          ? ((idx % 2 === 0 ? 'slide-left' : 'slide-right') as AnimationPreset)
          : (mode as AnimationPreset),
    }));
    setPagesDraft({ ...pagesDraft, homeBlocks: updated });
  };

  const saveMediaHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaDraft) return;
    const { ok, json } = await adminFetch('/api/admin/media-hub', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaDraft),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’enregistrement des passerelles médias.');
      return;
    }
    await fetchOverview();
    notify('Passerelles médias du groupe mises à jour.');
  };

  const saveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    const { ok, json } = await adminFetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingPost),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’enregistrement de l’article.');
      return;
    }
    setEditingPost(null);
    await fetchOverview();
    notify('Article publié et indexé.');
  };

  return (
    <div className="min-h-screen bg-[#F5F3F3] text-[#0F0C0C] flex flex-col lg:flex-row">
      {/* Sidebar 260px */}
      <aside className="w-full lg:w-64 bg-[#0C0909] text-white shrink-0 flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-white/10 flex items-center justify-between lg:block space-y-2">
            <ConcamLogo size="sm" />
            <p className="text-[11px] text-[#FFD2CB] hidden lg:block">Administration CONCAM</p>
          </div>
          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {allowedNav.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveModule(item.key)}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[6px] whitespace-nowrap transition-colors cursor-pointer ${
                  activeModule === item.key
                    ? 'bg-[#A30013] text-white'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 space-y-3 text-xs hidden lg:block">
          <div>
            <p className="font-semibold text-white">{authUser.name}</p>
            <p className="text-white/60 font-mono">{authUser.role}</p>
          </div>
          <div className="flex items-center justify-between">
            <Link to="/" target="_blank" className="inline-flex items-center gap-1 text-[#FFD2CB] hover:underline">
              <span>Voir le site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-white/70 hover:text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#E1DFDE] px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="text-xs text-[#0F0C0C]/65">
            Administration <span className="mx-1.5">/</span>
            <span className="font-semibold text-[#0F0C0C]">
              {allowedNav.find((n) => n.key === activeModule)?.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-semibold text-[#A30013] hover:underline whitespace-nowrap">
              Site public →
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden text-xs text-[#0F0C0C]/70 cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {toast && (
          <div className="mx-6 mt-4 bg-[#0C0909] text-white text-xs px-4 py-2.5 rounded-[6px] border border-white/15">
            {toast}
          </div>
        )}

        <main className="p-6 max-w-6xl w-full">
          {!overview ? (
            <div className="text-sm text-[#0F0C0C]/60">Chargement des données...</div>
          ) : (
            <>
              {/* Module 1: Contacts & Global Settings */}
              {activeModule === 'contacts' && settingsDraft && (
                <form onSubmit={saveSettings} className="space-y-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold">Informations de contact, Mentions & Paramètres</h2>
                    <p className="text-xs text-[#0F0C0C]/65">
                      Source unique : toute modification met à jour les pages, le pied de page, WhatsApp, la plaquette PDF et le RAG chatbot.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-medium mb-1">Dénomination officielle</label>
                      <input
                        type="text"
                        value={settingsDraft.companyName}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, companyName: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Numéro WhatsApp principal</label>
                      <input
                        type="text"
                        value={settingsDraft.whatsappNumber}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, whatsappNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Téléphones (séparés par virgule)</label>
                      <input
                        type="text"
                        value={settingsDraft.phones.join(', ')}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            phones: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Courriel agence</label>
                      <input
                        type="email"
                        value={settingsDraft.agencyEmail}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, agencyEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Courriel magazine & presse</label>
                      <input
                        type="email"
                        value={settingsDraft.magazineEmail}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, magazineEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Catégorie fiscale / Régime</label>
                      <input
                        type="text"
                        value={settingsDraft.taxCategory}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, taxCategory: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Adresse (FR)</label>
                      <input
                        type="text"
                        value={settingsDraft.address.fr}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, address: { ...settingsDraft.address, fr: e.target.value } })
                        }
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Adresse (EN)</label>
                      <input
                        type="text"
                        value={settingsDraft.address.en}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, address: { ...settingsDraft.address, en: e.target.value } })
                        }
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Horaires (FR)</label>
                      <input
                        type="text"
                        value={settingsDraft.hoursFr}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, hoursFr: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Hours (EN)</label>
                      <input
                        type="text"
                        value={settingsDraft.hoursEn}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, hoursEn: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Message WhatsApp par défaut (FR)</label>
                      <input
                        type="text"
                        value={settingsDraft.whatsappDefaultMsgFr}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, whatsappDefaultMsgFr: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Default WhatsApp Message (EN)</label>
                      <input
                        type="text"
                        value={settingsDraft.whatsappDefaultMsgEn}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, whatsappDefaultMsgEn: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">RCCM</label>
                      <input
                        type="text"
                        value={settingsDraft.rccm}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, rccm: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium mb-1">NCC</label>
                        <input
                          type="text"
                          value={settingsDraft.ncc}
                          onChange={(e) => setSettingsDraft({ ...settingsDraft, ncc: e.target.value })}
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">NIF</label>
                        <input
                          type="text"
                          value={settingsDraft.nif}
                          onChange={(e) => setSettingsDraft({ ...settingsDraft, nif: e.target.value })}
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium mb-1">Latitude carte</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={settingsDraft.mapLat}
                          onChange={(e) => setSettingsDraft({ ...settingsDraft, mapLat: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Longitude carte</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={settingsDraft.mapLng}
                          onChange={(e) => setSettingsDraft({ ...settingsDraft, mapLng: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-medium mb-1">Années d’exp.</label>
                        <input
                          type="number"
                          min={1}
                          value={settingsDraft.stats.yearsExperience}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              stats: { ...settingsDraft.stats, yearsExperience: Number(e.target.value) || 1 },
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Projets livrés</label>
                        <input
                          type="number"
                          min={1}
                          value={settingsDraft.stats.projectsCompleted}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              stats: { ...settingsDraft.stats, projectsCompleted: Number(e.target.value) || 1 },
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Organisations</label>
                        <input
                          type="number"
                          min={1}
                          value={settingsDraft.stats.clientsSupported}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              stats: { ...settingsDraft.stats, clientsSupported: Number(e.target.value) || 1 },
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium mb-1">URL Facebook</label>
                        <input
                          type="url"
                          value={settingsDraft.socialFacebook}
                          onChange={(e) => setSettingsDraft({ ...settingsDraft, socialFacebook: e.target.value })}
                          placeholder="https://facebook.com/..."
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">URL LinkedIn</label>
                        <input
                          type="url"
                          value={settingsDraft.socialLinkedin}
                          onChange={(e) => setSettingsDraft({ ...settingsDraft, socialLinkedin: e.target.value })}
                          placeholder="https://linkedin.com/company/..."
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">URL TikTok</label>
                        <input
                          type="url"
                          value={settingsDraft.socialTiktok}
                          onChange={(e) => setSettingsDraft({ ...settingsDraft, socialTiktok: e.target.value })}
                          placeholder="https://tiktok.com/@..."
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-medium mb-1">Partenaires affichés (séparés par virgule)</label>
                      <input
                        type="text"
                        value={settingsDraft.partners.join(', ')}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            partners: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                      />
                    </div>
                    <div className="md:col-span-2 pt-3 border-t border-[#E1DFDE] space-y-3">
                      <div className="flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsDraft.preloaderEnabled}
                            onChange={(e) => setSettingsDraft({ ...settingsDraft, preloaderEnabled: e.target.checked })}
                          />
                          <span>Préloader logo à l’ouverture (max 1,5s)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsDraft.animationsEnabled}
                            onChange={(e) => setSettingsDraft({ ...settingsDraft, animationsEnabled: e.target.checked })}
                          />
                          <span>Animations au défilement actives</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="font-medium text-[#0F0C0C]" htmlFor="admin-parallax-intensity">
                            Intensité parallaxe :
                          </label>
                          <select
                            id="admin-parallax-intensity"
                            value={settingsDraft.parallaxIntensity || 'ultra'}
                            onChange={(e) =>
                              setSettingsDraft({
                                ...settingsDraft,
                                parallaxIntensity: e.target.value as 'subtle' | 'cinematic' | 'intense' | 'ultra',
                              })
                            }
                            className="px-2.5 py-1.5 border border-[#E1DFDE] rounded-[6px] bg-white font-medium"
                          >
                            <option value="subtle">Subtil</option>
                            <option value="cinematic">Cinématique</option>
                            <option value="intense">Intense</option>
                            <option value="ultra">Ultra-Intense (recommandé)</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-2 font-semibold text-[#A30013] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(settingsDraft.maintenanceMode)}
                            onChange={(e) => setSettingsDraft({ ...settingsDraft, maintenanceMode: e.target.checked })}
                          />
                          <span>Activer le mode maintenance sur le site public</span>
                        </label>
                      </div>
                      {settingsDraft.maintenanceMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-[#FFF8F6] border border-[#E1DFDE] rounded-[6px]">
                          <div>
                            <label className="block font-medium mb-1">Message de maintenance (FR)</label>
                            <input
                              type="text"
                              value={settingsDraft.maintenanceMessageFr || ''}
                              onChange={(e) => setSettingsDraft({ ...settingsDraft, maintenanceMessageFr: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px]"
                            />
                          </div>
                          <div>
                            <label className="block font-medium mb-1">Maintenance Message (EN)</label>
                            <input
                              type="text"
                              value={settingsDraft.maintenanceMessageEn || ''}
                              onChange={(e) => setSettingsDraft({ ...settingsDraft, maintenanceMessageEn: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold bg-[#A30013] hover:bg-[#861213] text-white rounded-[6px] cursor-pointer"
                  >
                    Enregistrer et synchroniser
                  </button>
                </form>
              )}

              {/* Module 2: Services */}
              {activeModule === 'services' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-bold">Gestion des services</h2>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingService({
                          id: `srv-${Date.now()}`,
                          slug: `nouveau-service-${Date.now().toString().slice(-4)}`,
                          sortOrder: overview.services.length + 1,
                          published: true,
                          titleFr: 'Nouveau service',
                          titleEn: 'New Service',
                          taglineFr: 'Accroche du service',
                          taglineEn: 'Service tagline',
                          summaryFr: 'Description détaillée',
                          summaryEn: 'Detailed description',
                          benefitsFr: ['Bénéfice 1'],
                          benefitsEn: ['Benefit 1'],
                          offerings: [],
                          processSteps: [],
                          faqs: [],
                          imageUrl: overview.services[0]?.imageUrl || '',
                          whatsappMessageFr: 'Bonjour, je souhaite un devis.',
                          whatsappMessageEn: 'Hello, I would like a quote.',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nouveau service</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {overview.services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setEditingService(s)}
                        className={`px-3 py-2 text-xs font-semibold rounded-[6px] border cursor-pointer ${
                          editingService?.id === s.id
                            ? 'bg-[#A30013] text-white border-[#A30013]'
                            : 'bg-white border-[#E1DFDE]'
                        }`}
                      >
                        {s.sortOrder}. {s.titleFr} {!s.published && '(Brouillon)'}
                      </button>
                    ))}
                  </div>

                  {editingService && (
                    <ServiceFullEditor
                      service={editingService}
                      role={authUser.role}
                      onChange={setEditingService}
                      onSave={saveService}
                      onDelete={deleteServiceItem}
                      notify={notify}
                    />
                  )}
                </div>
              )}

              {/* Module 3: Gallery */}
              {activeModule === 'gallery' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="font-serif text-2xl font-bold">Galerie de réalisations</h2>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingGalleryItem({
                          id: `gal-${Date.now()}`,
                          categoryId: overview.galleryCategories[0]?.id || 'cat-branding',
                          categorySlug: overview.galleryCategories[0]?.slug || 'identite-visuelle',
                          titleFr: '',
                          titleEn: '',
                          clientOrSector: '',
                          clientApproved: true,
                          needFr: '',
                          needEn: '',
                          solutionFr: '',
                          solutionEn: '',
                          year: '2026',
                          images: [overview.services[0]?.imageUrl || ''],
                          featured: false,
                          sortOrder: overview.galleryItems.length + 1,
                          published: true,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#A30013] text-white rounded-[6px] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter une réalisation</span>
                    </button>
                  </div>

                  {/* Category Manager */}
                  <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-4 space-y-3 text-xs">
                    <p className="font-semibold">Catégories thématiques</p>
                    <div className="flex flex-wrap gap-2">
                      {overview.galleryCategories.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F3F3] border border-[#E1DFDE] rounded-[6px]"
                        >
                          <span>{c.nameFr} / {c.nameEn}</span>
                          {authUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={async () => {
                                const { ok, json } = await adminFetch(`/api/admin/gallery/categories/${c.id}`, { method: 'DELETE' });
                                if (!ok) {
                                  notify(json.error || 'Échec de la suppression de la catégorie.');
                                  return;
                                }
                                await fetchOverview();
                                notify('Catégorie supprimée.');
                              }}
                              title="Supprimer cette catégorie"
                              className="text-[#0F0C0C]/50 hover:text-[#A30013] cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={newCatFr}
                        onChange={(e) => setNewCatFr(e.target.value)}
                        placeholder="Nouvelle catégorie (FR)"
                        className="px-3 py-1.5 border border-[#E1DFDE] rounded-[6px]"
                      />
                      <input
                        type="text"
                        value={newCatEn}
                        onChange={(e) => setNewCatEn(e.target.value)}
                        placeholder="Category (EN)"
                        className="px-3 py-1.5 border border-[#E1DFDE] rounded-[6px]"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newCatFr.trim()) return;
                          const slug = newCatFr.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                          const { ok, json } = await adminFetch('/api/admin/gallery/categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: `cat-${Date.now()}`,
                              slug,
                              nameFr: newCatFr,
                              nameEn: newCatEn || newCatFr,
                              sortOrder: overview.galleryCategories.length + 1,
                            }),
                          });
                          if (!ok) {
                            notify(json.error || 'Échec de l’ajout de la catégorie.');
                            return;
                          }
                          setNewCatFr('');
                          setNewCatEn('');
                          await fetchOverview();
                          notify('Catégorie ajoutée.');
                        }}
                        className="px-3 py-1.5 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {editingGalleryItem && (
                    <form onSubmit={saveGalleryItem} className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg font-bold">Éditer la réalisation</h3>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingGalleryItem.published}
                              onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, published: e.target.checked })}
                            />
                            <span>Publiée</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingGalleryItem.clientApproved}
                              onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, clientApproved: e.target.checked })}
                            />
                            <span>Client validé (nom public)</span>
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          required
                          value={editingGalleryItem.titleFr}
                          onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, titleFr: e.target.value })}
                          placeholder="Titre (FR) *"
                          className="px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                        />
                        <input
                          type="text"
                          required
                          value={editingGalleryItem.titleEn}
                          onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, titleEn: e.target.value })}
                          placeholder="Title (EN) *"
                          className="px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                        />
                        <input
                          type="text"
                          value={editingGalleryItem.year}
                          onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, year: e.target.value })}
                          placeholder="Année (ex: 2026)"
                          className="px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono tabular-nums"
                        />
                        <select
                          value={editingGalleryItem.categoryId}
                          onChange={(e) => {
                            const cat = overview.galleryCategories.find((c) => c.id === e.target.value);
                            if (cat) {
                              setEditingGalleryItem({
                                ...editingGalleryItem,
                                categoryId: cat.id,
                                categorySlug: cat.slug,
                              });
                            }
                          }}
                          className="px-3 py-2 border border-[#E1DFDE] rounded-[6px] bg-white"
                        >
                          {overview.galleryCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nameFr}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editingGalleryItem.clientOrSector}
                          onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, clientOrSector: e.target.value })}
                          placeholder="Client ou secteur"
                          className="px-3 py-2 border border-[#E1DFDE] rounded-[6px] md:col-span-2"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea
                          rows={2}
                          value={editingGalleryItem.needFr}
                          onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, needFr: e.target.value })}
                          placeholder="Besoin client (FR)"
                          className="p-2.5 border border-[#E1DFDE] rounded-[6px]"
                        />
                        <textarea
                          rows={2}
                          value={editingGalleryItem.needEn}
                          onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, needEn: e.target.value })}
                          placeholder="Client Need (EN)"
                          className="p-2.5 border border-[#E1DFDE] rounded-[6px]"
                        />
                        <textarea
                          rows={2}
                          value={editingGalleryItem.solutionFr}
                          onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, solutionFr: e.target.value })}
                          placeholder="Solution déployée (FR)"
                          className="p-2.5 border border-[#E1DFDE] rounded-[6px]"
                        />
                        <textarea
                          rows={2}
                          value={editingGalleryItem.solutionEn}
                          onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, solutionEn: e.target.value })}
                          placeholder="Deployed Solution (EN)"
                          className="p-2.5 border border-[#E1DFDE] rounded-[6px]"
                        />
                      </div>

                      {/* Multi-image manager */}
                      <div className="space-y-3 pt-2 border-t border-[#E1DFDE]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold">Visuels de la réalisation ({editingGalleryItem.images.filter(Boolean).length})</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingGalleryItem({
                                  ...editingGalleryItem,
                                  images: [...editingGalleryItem.images, ''],
                                })
                              }
                              className="px-2.5 py-1 border border-[#E1DFDE] rounded-[6px] hover:border-[#A30013] cursor-pointer"
                            >
                              + Ajouter une URL
                            </button>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{galleryUploading ? 'Envoi...' : 'Téléverser une image'}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setGalleryUploading(true);
                                  try {
                                    const res = await uploadMediaFile(file);
                                    setEditingGalleryItem({
                                      ...editingGalleryItem,
                                      images: [...editingGalleryItem.images.filter(Boolean), res.url],
                                    });
                                    notify('Image téléversée dans la galerie.');
                                  } catch (err) {
                                    notify(err instanceof Error ? err.message : 'Erreur téléversement');
                                  } finally {
                                    setGalleryUploading(false);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {editingGalleryItem.images.map((imgUrl, iIdx) => (
                            <div key={iIdx} className="flex items-center gap-2">
                              {imgUrl ? (
                                <img src={imgUrl} alt="" className="w-12 h-9 object-cover rounded-[4px] border border-[#E1DFDE] shrink-0" />
                              ) : (
                                <div className="w-12 h-9 bg-[#F5F3F3] border border-[#E1DFDE] rounded-[4px] shrink-0" />
                              )}
                              <input
                                type="text"
                                value={imgUrl}
                                onChange={(e) => {
                                  const next = [...editingGalleryItem.images];
                                  next[iIdx] = e.target.value;
                                  setEditingGalleryItem({ ...editingGalleryItem, images: next });
                                }}
                                placeholder="/uploads/... ou https://..."
                                className="flex-1 px-2.5 py-1.5 border border-[#E1DFDE] rounded-[6px] font-mono"
                              />
                              <button
                                type="button"
                                disabled={iIdx === 0}
                                onClick={() => {
                                  const next = [...editingGalleryItem.images];
                                  const tmp = next[iIdx - 1];
                                  next[iIdx - 1] = next[iIdx];
                                  next[iIdx] = tmp;
                                  setEditingGalleryItem({ ...editingGalleryItem, images: next });
                                }}
                                className="p-1 border border-[#E1DFDE] rounded-[4px] disabled:opacity-35 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={iIdx === editingGalleryItem.images.length - 1}
                                onClick={() => {
                                  const next = [...editingGalleryItem.images];
                                  const tmp = next[iIdx + 1];
                                  next[iIdx + 1] = next[iIdx];
                                  next[iIdx] = tmp;
                                  setEditingGalleryItem({ ...editingGalleryItem, images: next });
                                }}
                                className="p-1 border border-[#E1DFDE] rounded-[4px] disabled:opacity-35 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingGalleryItem({
                                    ...editingGalleryItem,
                                    images: editingGalleryItem.images.filter((_, idx) => idx !== iIdx),
                                  })
                                }
                                className="p-1 text-[#A30013] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={editingGalleryItem.featured}
                          onChange={(e) => setEditingGalleryItem({ ...editingGalleryItem, featured: e.target.checked })}
                        />
                        <span>Afficher en vedette sur l’accueil</span>
                      </label>

                      <div className="flex gap-3">
                        <button type="submit" className="px-4 py-2 bg-[#A30013] text-white font-semibold rounded-[6px] cursor-pointer">
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingGalleryItem(null)}
                          className="px-4 py-2 border border-[#E1DFDE] rounded-[6px] cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="bg-white border border-[#E1DFDE] rounded-[6px] divide-y divide-[#E1DFDE]">
                    <div className="px-4 py-2.5 text-[11px] text-[#0F0C0C]/60 bg-[#F5F3F3]">
                      Glissez-déposez les réalisations ou utilisez les flèches pour réorganiser l’ordre d’affichage.
                    </div>
                    {overview.galleryItems.map((item, idx) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => setDraggedGalleryIdx(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedGalleryIdx !== null) {
                            reorderGalleryTo(draggedGalleryIdx, idx);
                            setDraggedGalleryIdx(null);
                          }
                        }}
                        className={`p-4 flex items-center justify-between gap-4 text-xs transition-colors ${
                          draggedGalleryIdx === idx ? 'bg-[#FFF5F4]' : 'hover:bg-[#F5F3F3]/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="w-4 h-4 text-[#0F0C0C]/35 cursor-grab shrink-0" />
                          <img src={item.images[0]} alt="" className="w-16 h-12 object-cover rounded-[6px] bg-[#F5F3F3] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {item.titleFr} {!item.published && '(Brouillon)'}
                            </p>
                            <p className="text-[#0F0C0C]/60">
                              {item.categorySlug} · {item.clientOrSector} · {item.year} ·{' '}
                              {item.featured ? 'Vedette accueil' : 'Galerie'} · {item.images.length} photo(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button type="button" onClick={() => moveGalleryItem(idx, -1)} className="p-1.5 border border-[#E1DFDE] rounded-[6px] cursor-pointer">
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => moveGalleryItem(idx, 1)} className="p-1.5 border border-[#E1DFDE] rounded-[6px] cursor-pointer">
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGalleryItem(item)}
                            className="px-3 py-1.5 border border-[#E1DFDE] rounded-[6px] cursor-pointer"
                          >
                            Éditer
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const { ok, json } = await adminFetch(`/api/admin/gallery/items/${item.id}`, { method: 'DELETE' });
                              if (!ok) {
                                notify(json.error || 'Échec de la suppression de la réalisation.');
                                return;
                              }
                              await fetchOverview();
                              notify('Réalisation supprimée.');
                            }}
                            className="p-1.5 text-[#E40014] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Module 4: Pages, Blocs & Blog */}
              {activeModule === 'pages' && pagesDraft && (
                <div className="space-y-8">
                  <form onSubmit={savePages} className="space-y-6">
                    <h2 className="font-serif text-2xl font-bold">Pages, Blocs d’accueil & Animations</h2>

                    <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-medium mb-1">Accroche / Kicker Hero (FR)</label>
                        <input
                          type="text"
                          value={pagesDraft.heroKickerFr}
                          onChange={(e) => setPagesDraft({ ...pagesDraft, heroKickerFr: e.target.value })}
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Hero Kicker (EN)</label>
                        <input
                          type="text"
                          value={pagesDraft.heroKickerEn}
                          onChange={(e) => setPagesDraft({ ...pagesDraft, heroKickerEn: e.target.value })}
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Titre Hero (FR)</label>
                        <input
                          type="text"
                          value={pagesDraft.heroTitleFr}
                          onChange={(e) => setPagesDraft({ ...pagesDraft, heroTitleFr: e.target.value })}
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Hero Title (EN)</label>
                        <input
                          type="text"
                          value={pagesDraft.heroTitleEn}
                          onChange={(e) => setPagesDraft({ ...pagesDraft, heroTitleEn: e.target.value })}
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Sous-titre Hero (FR)</label>
                        <textarea
                          rows={2}
                          value={pagesDraft.heroSubtitleFr}
                          onChange={(e) => setPagesDraft({ ...pagesDraft, heroSubtitleFr: e.target.value })}
                          className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Hero Subtitle (EN)</label>
                        <textarea
                          rows={2}
                          value={pagesDraft.heroSubtitleEn}
                          onChange={(e) => setPagesDraft({ ...pagesDraft, heroSubtitleEn: e.target.value })}
                          className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
                        />
                      </div>
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className="block font-medium mb-1">Image principale du Header animé (URL)</label>
                          <input
                            type="text"
                            value={pagesDraft.heroImageUrl}
                            onChange={(e) => setPagesDraft({ ...pagesDraft, heroImageUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Ou téléverser un visuel Header</label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const res = await uploadMediaFile(file);
                                setPagesDraft({ ...pagesDraft, heroImageUrl: res.url });
                                notify('Visuel header téléversé.');
                              } catch (err) {
                                notify(err instanceof Error ? err.message : 'Erreur téléversement');
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Multi-slides & Video MP4 headers per page */}
                    <PageHeadersEditor pagesDraft={pagesDraft} onChange={setPagesDraft} notify={notify} />

                    {/* About, Mission, Quality, Presse, Timeline & Leadership */}
                    <AboutAndPresseEditor pagesDraft={pagesDraft} onChange={setPagesDraft} />

                    {/* Global Special Effects & Animation Controls */}
                    {settingsDraft && (
                      <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-4 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-serif text-lg font-bold">Effets spéciaux, Carrousels & Chorégraphie globale</h3>
                            <p className="text-[#0F0C0C]/65">
                              Pilotez les rideaux d’images, parallaxe 3D, carrousels automatiques et bandeaux défilants.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => applyAllBlockChoreography('alternating')}
                              className="px-3 py-1.5 bg-[#0F0C0C] text-white font-semibold rounded-[6px] cursor-pointer"
                            >
                              Chorégraphie Gauche / Droite
                            </button>
                            <button
                              type="button"
                              onClick={() => applyAllBlockChoreography('zoom-soft')}
                              className="px-3 py-1.5 border border-[#E1DFDE] hover:border-[#A30013] font-semibold rounded-[6px] cursor-pointer"
                            >
                              Tout en Zoom cinématique
                            </button>
                          </div>
                        </div>

                        {/* Global animation settings are admin-only: the server rejects
                            them for editors, so they are hidden to avoid silent no-ops. */}
                        {authUser.role === 'admin' && (
                          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#E1DFDE]">
                            <label className="flex items-center gap-2 font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settingsDraft.animationsEnabled}
                                onChange={(e) => setSettingsDraft({ ...settingsDraft, animationsEnabled: e.target.checked })}
                              />
                              <span>Activer toutes les animations & effets spéciaux (Parallaxe, 3D, Rideaux)</span>
                            </label>
                            <label className="flex items-center gap-2 font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settingsDraft.preloaderEnabled}
                                onChange={(e) => setSettingsDraft({ ...settingsDraft, preloaderEnabled: e.target.checked })}
                              />
                              <span>Activer le rideau d’ouverture logo CONCAM</span>
                            </label>
                          </div>
                        )}

                        {authUser.role === 'admin' && (
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E1DFDE]">
                            <div>
                              <p className="font-semibold text-[#0F0C0C]">
                                Intensité des effets parallaxe scénographiques (mobile renforcé inclus)
                              </p>
                              <p className="text-[#0F0C0C]/65">
                                Pilote le chevauchement en rideau des sections, les cartes empilées collantes, la perspective 3D au défilement, la profondeur curseur des en-têtes et les rubans horizontaux.
                              </p>
                            </div>
                            <div className="inline-flex flex-wrap rounded-[6px] border border-[#E1DFDE] bg-[#F5F3F3] p-1 gap-1">
                              {(
                                [
                                  ['subtle', 'Subtil'],
                                  ['cinematic', 'Cinématique'],
                                  ['intense', 'Intense'],
                                  ['ultra', 'Ultra-Intense'],
                                ] as const
                              ).map(([val, label]) => {
                                const active = (settingsDraft.parallaxIntensity || 'ultra') === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => setSettingsDraft({ ...settingsDraft, parallaxIntensity: val })}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] cursor-pointer transition-colors ${
                                      active
                                        ? 'bg-[#A30013] text-white'
                                        : 'text-[#0F0C0C]/75 hover:bg-white'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Homepage Blocks Order & Animations */}
                    <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-3 text-xs">
                      <h3 className="font-serif text-lg font-bold">Ordre & animation des blocs de l’accueil</h3>
                      <div className="divide-y divide-[#E1DFDE]">
                        {[...pagesDraft.homeBlocks]
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((blk, i, arr) => {
                            const origIdx = pagesDraft.homeBlocks.findIndex((b) => b.id === blk.id);
                            return (
                              <div key={blk.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[11px] text-[#0F0C0C]/50 w-6">0{i + 1}</span>
                                  <input
                                    type="checkbox"
                                    checked={blk.enabled}
                                    onChange={(e) => {
                                      const next = [...pagesDraft.homeBlocks];
                                      next[origIdx] = { ...blk, enabled: e.target.checked };
                                      setPagesDraft({ ...pagesDraft, homeBlocks: next });
                                    }}
                                  />
                                  <span className="font-semibold">{blk.labelFr}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={i === 0}
                                    onClick={() => moveHomeBlock(i, -1)}
                                    title="Monter"
                                    className="p-1.5 border border-[#E1DFDE] rounded-[6px] disabled:opacity-35 cursor-pointer"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={i === arr.length - 1}
                                    onClick={() => moveHomeBlock(i, 1)}
                                    title="Descendre"
                                    className="p-1.5 border border-[#E1DFDE] rounded-[6px] disabled:opacity-35 cursor-pointer"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <select
                                    value={blk.animation}
                                    onChange={(e) => {
                                      const next = [...pagesDraft.homeBlocks];
                                      next[origIdx] = { ...blk, animation: e.target.value as AnimationPreset };
                                      setPagesDraft({ ...pagesDraft, homeBlocks: next });
                                    }}
                                    className="px-2.5 py-1.5 border border-[#E1DFDE] rounded-[6px] bg-white"
                                  >
                                    <option value="fade-up">Fondu montant</option>
                                    <option value="slide-left">Entrée gauche</option>
                                    <option value="slide-right">Entrée droite</option>
                                    <option value="zoom-soft">Zoom léger</option>
                                    <option value="none">Statique</option>
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-semibold bg-[#A30013] hover:bg-[#861213] text-white rounded-[6px] cursor-pointer"
                    >
                      Enregistrer les pages, headers, blocs & animations
                    </button>
                  </form>

                  {/* Blog Manager */}
                  <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg font-bold">Articles « Actualités et conseils » (SEO)</h3>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingPost({
                            id: `post-${Date.now()}`,
                            slug: `article-${Date.now().toString().slice(-4)}`,
                            published: true,
                            publishedAt: new Date().toISOString().slice(0, 10),
                            categoryFr: 'Conseil',
                            categoryEn: 'Advisory',
                            titleFr: '',
                            titleEn: '',
                            excerptFr: '',
                            excerptEn: '',
                            contentFr: '',
                            contentEn: '',
                            targetKeyword: '',
                            relatedServiceSlug: overview.services[0]?.slug || 'conseil-communication',
                            imageUrl: overview.services[0]?.imageUrl || '',
                            readMinutes: 3,
                          })
                        }
                        className="px-3 py-1.5 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer"
                      >
                        + Nouvel article
                      </button>
                    </div>

                    {editingPost && (
                      <BlogPostFullEditor
                        post={editingPost}
                        services={overview.services}
                        onChange={setEditingPost}
                        onSave={saveBlogPost}
                        onCancel={() => setEditingPost(null)}
                        notify={notify}
                      />
                    )}

                    <div className="divide-y divide-[#E1DFDE]">
                      {overview.blogPosts.map((bp) => (
                        <div key={bp.id} className="py-2.5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {bp.titleFr} {!bp.published && '(Brouillon)'}
                            </p>
                            <p className="text-[#0F0C0C]/60 font-mono truncate">
                              {bp.publishedAt} · {bp.targetKeyword} · /{bp.slug}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingPost(bp)}
                              className="text-[#A30013] hover:underline cursor-pointer"
                            >
                              Éditer
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const { ok, json } = await adminFetch(`/api/admin/blog/${bp.id}`, { method: 'DELETE' });
                                if (!ok) {
                                  notify(json.error || 'Échec de la suppression de l’article.');
                                  return;
                                }
                                await fetchOverview();
                                notify('Article supprimé.');
                              }}
                              title="Supprimer l’article"
                              className="text-[#0F0C0C]/50 hover:text-[#E40014] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Module 5: Media Hub */}
              {activeModule === 'media' && mediaDraft && (
                <form onSubmit={saveMediaHub} className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold">Médias du groupe & Passerelles</h2>
                      <p className="text-xs text-[#0F0C0C]/65">
                        Paramétrez les URLs, textes FR/EN, flux RSS et visibilité de chaque carte passerelle.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={rssChecking}
                      onClick={async () => {
                        setRssChecking(true);
                        try {
                          const { ok, json } = await adminFetch('/api/admin/media-hub/check-rss');
                          if (ok) {
                            setRssCheckResult(json);
                            notify('Vérification des flux RSS terminée.');
                          } else {
                            notify(json.error || 'Impossible de vérifier les flux RSS.');
                          }
                        } finally {
                          setRssChecking(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0F0C0C] hover:bg-[#A30013] text-white rounded-[6px] cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${rssChecking ? 'animate-spin' : ''}`} />
                      <span>Tester les flux RSS maintenant</span>
                    </button>
                  </div>

                  {rssCheckResult && (
                    <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-4 text-xs flex flex-wrap gap-6">
                      <span>
                        <strong>Réussite Magazine :</strong>{' '}
                        <span className={rssCheckResult.reussite.ok ? 'text-emerald-700 font-semibold' : 'text-[#A30013]'}>
                          {rssCheckResult.reussite.ok
                            ? `En ligne (${rssCheckResult.reussite.count} articles RSS)`
                            : 'Hors ligne / repli actif'}
                        </span>
                      </span>
                      <span>
                        <strong>MediaInfoPro :</strong>{' '}
                        <span className={rssCheckResult.mediainfopro.ok ? 'text-emerald-700 font-semibold' : 'text-[#A30013]'}>
                          {rssCheckResult.mediainfopro.ok
                            ? `En ligne (${rssCheckResult.mediainfopro.count} articles RSS)`
                            : 'Hors ligne / en attente DNS'}
                        </span>
                      </span>
                    </div>
                  )}

                  <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-6 text-xs">
                    <div className="space-y-3 pb-4 border-b border-[#E1DFDE]">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg font-bold">Réussite Magazine</h3>
                        <label className="flex items-center gap-2 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mediaDraft.reussiteMagazineEnabled}
                            onChange={(e) => setMediaDraft({ ...mediaDraft, reussiteMagazineEnabled: e.target.checked })}
                          />
                          <span>Carte visible sur le site</span>
                        </label>
                      </div>
                      <input
                        type="url"
                        value={mediaDraft.reussiteMagazineUrl}
                        onChange={(e) => setMediaDraft({ ...mediaDraft, reussiteMagazineUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium mb-1">Description carte (FR)</label>
                          <textarea
                            rows={2}
                            value={mediaDraft.reussiteMagazineDescFr}
                            onChange={(e) => setMediaDraft({ ...mediaDraft, reussiteMagazineDescFr: e.target.value })}
                            className="w-full p-2 border border-[#E1DFDE] rounded-[6px]"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Card Description (EN)</label>
                          <textarea
                            rows={2}
                            value={mediaDraft.reussiteMagazineDescEn}
                            onChange={(e) => setMediaDraft({ ...mediaDraft, reussiteMagazineDescEn: e.target.value })}
                            className="w-full p-2 border border-[#E1DFDE] rounded-[6px]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pb-4 border-b border-[#E1DFDE]">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg font-bold">Site média (MediaInfoPro)</h3>
                        <label className="flex items-center gap-2 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mediaDraft.mediaInfoProEnabled}
                            onChange={(e) => setMediaDraft({ ...mediaDraft, mediaInfoProEnabled: e.target.checked })}
                          />
                          <span>Carte visible sur le site</span>
                        </label>
                      </div>
                      <input
                        type="url"
                        value={mediaDraft.mediaInfoProUrl}
                        onChange={(e) => setMediaDraft({ ...mediaDraft, mediaInfoProUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
                      />
                      <div>
                        <label className="block font-medium mb-1">Note de statut (ex: En cours de réactivation DNS)</label>
                        <input
                          type="text"
                          value={mediaDraft.mediaInfoProStatusNote}
                          onChange={(e) => setMediaDraft({ ...mediaDraft, mediaInfoProStatusNote: e.target.value })}
                          className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium mb-1">Description carte (FR)</label>
                          <textarea
                            rows={2}
                            value={mediaDraft.mediaInfoProDescFr}
                            onChange={(e) => setMediaDraft({ ...mediaDraft, mediaInfoProDescFr: e.target.value })}
                            className="w-full p-2 border border-[#E1DFDE] rounded-[6px]"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Card Description (EN)</label>
                          <textarea
                            rows={2}
                            value={mediaDraft.mediaInfoProDescEn}
                            onChange={(e) => setMediaDraft({ ...mediaDraft, mediaInfoProDescEn: e.target.value })}
                            className="w-full p-2 border border-[#E1DFDE] rounded-[6px]"
                          />
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mediaDraft.headlinesFeedEnabled}
                        onChange={(e) => setMediaDraft({ ...mediaDraft, headlinesFeedEnabled: e.target.checked })}
                      />
                      <span>Afficher le flux automatique « À la une » sur la page d’accueil</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold bg-[#A30013] text-white rounded-[6px] cursor-pointer"
                  >
                    Enregistrer les passerelles
                  </button>
                </form>
              )}

              {/* Modules 6-10 */}
              {activeModule === 'leads' && (
                <ProspectsModule leads={overview.leads} role={authUser.role} onRefresh={fetchOverview} notify={notify} />
              )}
              {activeModule === 'chatbot' && (
                <ChatbotModule
                  config={overview.chatbotConfig}
                  kbDocuments={overview.kbDocuments}
                  chatSessions={overview.chatSessions}
                  role={authUser.role}
                  onRefresh={fetchOverview}
                  notify={notify}
                />
              )}
              {activeModule === 'stats' && <StatisticsModule analytics={overview.analytics} />}
              {activeModule === 'users' && (
                <UsersAndAuditModule
                  users={overview.users}
                  auditLogs={overview.auditLogs}
                  backups={overview.backups || []}
                  currentUser={authUser}
                  onRefresh={fetchOverview}
                  onAuthRefresh={refreshAuthUser}
                  notify={notify}
                />
              )}
              {activeModule === 'seo' && (
                <SeoModule
                  seoConfigs={overview.seoConfigs}
                  redirects={overview.redirects}
                  role={authUser.role}
                  onRefresh={fetchOverview}
                  notify={notify}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
