import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, ChevronRight, ArrowUpRight, Mail, Phone, MapPin, Search, FileDown } from 'lucide-react';
import { ConcamLogo } from './ConcamLogo';
import {
  MagneticWrapper,
  ParallaxBackdropPlate,
  ParallaxSealDrift,
  ScrollProgressBar,
} from './MotionPrimitives';
import { useSite } from '../context/SiteContext';

export function Breadcrumbs({ items }: { items: Array<{ label: string; to?: string }> }) {
  const { lang } = useSite();
  return (
    <nav aria-label={lang === 'en' ? 'Breadcrumb' : "Fil d'Ariane"} className="bg-[#EFEAE1] border-b border-[#DDD5C9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs text-[#574E4A] overflow-x-auto whitespace-nowrap">
        <Link to={lang === 'en' ? '/en' : '/'} className="hover:text-[#931916] transition-colors font-medium">
          {lang === 'en' ? 'Home' : 'Accueil'}
        </Link>
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-[#9C9188] shrink-0" aria-hidden="true" />
            {item.to ? (
              <Link to={item.to} className="hover:text-[#931916] transition-colors font-medium">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#181413] font-semibold truncate">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { data, lang, switchLanguage, openQuoteModal, setSearchOpen, trackEvent } = useSite();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Newsletter state in footer
  const [newsEmail, setNewsEmail] = useState('');
  const [newsConsent, setNewsConsent] = useState(false);
  const [newsStatus, setNewsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsMsg, setNewsMsg] = useState('');
  const [newsConfirmUrl, setNewsConfirmUrl] = useState<string | null>(null);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: p('À propos', 'About'), to: p('/a-propos', '/en/about') },
    { label: p('Services', 'Services'), to: p('/services', '/en/services') },
    { label: p('Galerie', 'Portfolio'), to: p('/galerie', '/en/gallery') },
    { label: p('Nos médias', 'Our Media'), to: p('/presse-edition', '/en/press-publishing') },
    { label: p('Contact', 'Contact'), to: p('/contact', '/en/contact') },
  ];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsConsent) {
      setNewsStatus('error');
      setNewsMsg(p('Veuillez cocher la case de consentement.', 'Please confirm your consent.'));
      return;
    }
    setNewsStatus('loading');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsEmail,
          source: 'popup_newsletter',
          consentRgpd: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setNewsStatus('success');
      if (typeof json.confirmUrl === 'string' && json.confirmUrl) {
        // No SMTP transport yet: surface the double opt-in link directly so the
        // subscription can be confirmed in one click instead of silently pending.
        setNewsConfirmUrl(json.confirmUrl);
        setNewsMsg(
          p(
            'Inscription enregistrée. Confirmez-la d’un clic pour activer la veille :',
            'Subscription recorded. Confirm with one click to activate the briefing:',
          ),
        );
      } else {
        setNewsConfirmUrl(null);
        setNewsMsg(
          p(
            'Vérifiez votre messagerie : un lien de confirmation vous permet de valider votre abonnement.',
            'Check your inbox to confirm your double opt-in subscription.',
          ),
        );
      }
      setNewsEmail('');
      setNewsConsent(false);
    } catch (err) {
      setNewsStatus('error');
      setNewsMsg(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const settings = data?.settings;
  const mediaHub = data?.mediaHub;

  if (settings?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-[#110D0C] text-[#F6F2EA] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full border border-white/15 bg-[#181413] rounded-[4px] p-8 sm:p-10 space-y-6 shadow-2xl">
          <div className="flex justify-center">
            <ConcamLogo size="lg" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#E40014] font-semibold">
            {p('Intervention technique programmée', 'Scheduled Maintenance')}
          </p>
          <h1 className="font-serif text-3xl font-bold text-white">
            {p('Portail CONCAM temporairement en maintenance', 'CONCAM Portal Under Maintenance')}
          </h1>
          <p className="text-sm text-white/75 leading-relaxed">
            {lang === 'en'
              ? settings.maintenanceMessageEn || 'Our institutional portal is currently being updated. We will be back online shortly.'
              : settings.maintenanceMessageFr || 'Notre portail institutionnel fait actuellement l’objet d’une mise à jour. Nous serons de retour très rapidement.'}
          </p>
          <div className="pt-4 border-t border-white/15 text-xs text-white/65 space-y-1.5 tabular-nums">
            <p>{settings.phones[0]} · {settings.agencyEmail}</p>
            <Link to="/admin" className="inline-block text-white hover:text-[#E40014] hover:underline pt-2">
              {p('Accès Administration CMS', 'CMS Admin Access')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EF] text-[#181413] relative selection:bg-[#931916] selection:text-white">
      <ScrollProgressBar />

      {/* Top Bar Contract: 3 zones, sovereign chancery header with crisp hairline */}
      <header
        className={`sticky top-0 z-40 h-16 transition-all duration-300 border-b ${
          scrolled
            ? 'bg-[#110D0C]/95 backdrop-blur-md border-white/15 shadow-[0_14px_36px_-18px_rgba(0,0,0,0.65)]'
            : 'bg-[#110D0C]/85 backdrop-blur-sm border-white/10'
        }`}
      >
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark only */}
          <Link
            to={p('/', '/en')}
            aria-label="CONCAM Accueil"
            className="shrink-0 transition-transform duration-300 hover:scale-[1.02]"
          >
            <ConcamLogo size="md" />
          </Link>

          {/* Zone 2: 5 concise single-line nav links with blood-red underline sweep */}
          <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-7 text-[13.5px] font-medium text-white/80">
            {navLinks.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to !== '/' && item.to !== '/en' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-active={active}
                  className={`editorial-link whitespace-nowrap shrink-0 py-1.5 transition-colors ${
                    active ? 'text-white font-semibold' : 'hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Search button + Language switch + Single magnetic CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={p('Rechercher sur le site (⌘K)', 'Search site (⌘K)')}
              title={p('Rechercher (⌘K)', 'Search (⌘K)')}
              className="p-2 rounded-[4px] border border-white/20 bg-[#1A1413] text-white/85 hover:text-white hover:border-[#931916] transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>

            <div className="hidden sm:flex items-center text-xs font-medium rounded-[4px] overflow-hidden border border-white/20 text-white/85 bg-[#1A1413]">
              <button
                type="button"
                onClick={() => switchLanguage('fr')}
                className={`px-2.5 py-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  lang === 'fr' ? 'bg-white text-[#110D0C] font-semibold' : 'hover:bg-white/10'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => switchLanguage('en')}
                className={`px-2.5 py-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  lang === 'en' ? 'bg-white text-[#110D0C] font-semibold' : 'hover:bg-white/10'
                }`}
              >
                EN
              </button>
            </div>

            <MagneticWrapper strength={0.2}>
              <button
                type="button"
                onClick={() => openQuoteModal()}
                className="magnetic-sheen px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#931916] hover:bg-[#A30013] border border-[#931916] rounded-[4px] transition-all duration-300 shadow-[0_8px_20px_-8px_rgba(147,25,22,0.65)] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {p('Demander un devis', 'Request a Quote')}
              </button>
            </MagneticWrapper>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={p('Ouvrir le menu', 'Toggle menu')}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-[4px] cursor-pointer transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Animated Sovereign Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden bg-[#110D0C] border-b border-white/15 px-5 py-5 space-y-3 shadow-2xl"
            >
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-medium text-white/90 hover:text-[#E40014] border-b border-white/10"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to={p('/actualites-conseils', '/en/insights')}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-white/90 hover:text-[#E40014] border-b border-white/10"
              >
                {p('Actualités & conseils', 'Insights & Advice')}
              </Link>
              <Link
                to={p('/recherche', '/en/search')}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-white/90 hover:text-[#E40014] border-b border-white/10"
              >
                {p('Recherche sur le site', 'Site Search')}
              </Link>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    switchLanguage('fr');
                    setMobileOpen(false);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-[4px] border cursor-pointer ${
                    lang === 'fr' ? 'bg-white text-[#110D0C] border-white font-semibold' : 'border-white/25 text-white/80'
                  }`}
                >
                  Français
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchLanguage('en');
                    setMobileOpen(false);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-[4px] border cursor-pointer ${
                    lang === 'en' ? 'bg-white text-[#110D0C] border-white font-semibold' : 'border-white/25 text-white/80'
                  }`}
                >
                  English
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 relative z-10">{children}</main>

      {/* Sovereign State Chancery Footer */}
      <footer className="relative z-10 bg-[#110D0C] text-[#F6F2EA] border-t border-white/15 overflow-hidden">
        <ParallaxBackdropPlate variant="dark-grid" offset={42} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
          {/* Column 1: Brand & Official Registry Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ConcamLogo size="md" />
              <ParallaxSealDrift size={54} tone="light" offset={16} rotateDeg={24} className="opacity-85 shrink-0" />
            </div>
            <p className="text-sm text-white/75 leading-relaxed">
              {p(
                'Agence conseil 360° en communication, imprimerie numérique et offset, marquage publicitaire et édition de presse à Conakry depuis 2010.',
                '360° communication advisory, commercial digital & offset printing, corporate branding and business press in Conakry since 2010.',
              )}
            </p>
            {settings && (
              <div className="text-xs text-white/65 space-y-1 tabular-nums pt-3 border-t border-white/15">
                <p className="font-semibold text-white">{settings.companyName}</p>
                <p>RCCM : {settings.rccm.split('—')[0].trim()}</p>
                <p>NCC {settings.ncc} · NIF {settings.nif}</p>
              </div>
            )}
          </div>

          {/* Column 2: Navigation & Services */}
          <div className="space-y-3.5">
            <h3 className="font-serif text-lg font-semibold text-white tracking-wide">
              {p('Navigation & Services', 'Navigation & Services')}
            </h3>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <Link to={p('/a-propos', '/en/about')} className="editorial-link hover:text-white transition-colors">
                  {p('À propos de CONCAM', 'About CONCAM')}
                </Link>
              </li>
              {data?.services.map((srv) => (
                <li key={srv.id}>
                  <Link
                    to={lang === 'en' ? `/en/services/${srv.slug}` : `/services/${srv.slug}`}
                    className="editorial-link hover:text-white transition-colors"
                  >
                    {lang === 'en' ? srv.titleEn : srv.titleFr}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={p('/galerie', '/en/gallery')} className="editorial-link hover:text-white transition-colors">
                  {p('Galerie de réalisations', 'Portfolio Gallery')}
                </Link>
              </li>
              <li>
                <Link to={p('/actualites-conseils', '/en/insights')} className="editorial-link hover:text-white transition-colors">
                  {p('Actualités et conseils', 'Insights & Advice')}
                </Link>
              </li>
              <li>
                <Link to={p('/recherche', '/en/search')} className="editorial-link hover:text-white transition-colors">
                  {p('Rechercher sur le site', 'Search the site')}
                </Link>
              </li>
              <li className="pt-1">
                <a
                  href={`/api/public/brochure.pdf?lang=${lang}`}
                  download
                  onClick={() => trackEvent('brochure_download', `footer_${lang}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-[#E40014] transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#E40014]" aria-hidden="true" />
                  <span>{p('Plaquette officielle (PDF)', 'Official Brochure (PDF)')}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contacts & Group Media */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-white tracking-wide">
              {p('Siège & Médias du groupe', 'Headquarters & Group Media')}
            </h3>
            {settings && (
              <div className="space-y-2.5 text-sm text-white/75">
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#E40014] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{lang === 'en' ? settings.address.en : settings.address.fr}</span>
                </p>
                <p className="flex items-center gap-2.5 tabular-nums text-xs">
                  <Phone className="w-4 h-4 text-[#E40014] shrink-0" aria-hidden="true" />
                  <a href={`tel:${settings.phones[0]?.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                    {settings.phones[0]}
                  </a>
                </p>
                <p className="flex items-center gap-2.5 text-xs">
                  <Mail className="w-4 h-4 text-[#E40014] shrink-0" aria-hidden="true" />
                  <a href={`mailto:${settings.agencyEmail}`} className="hover:text-white transition-colors">
                    {settings.agencyEmail}
                  </a>
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-white/15 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#E40014]">
                {p('Passerelles médias du groupe', 'Group Media Gateways')}
              </p>
              {mediaHub?.reussiteMagazineEnabled && (
                <a
                  href={mediaHub.reussiteMagazineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('media_outbound', 'reussitemagazine.info')}
                  className="group sovereign-plate-subtle flex items-center justify-between text-xs text-white px-3.5 py-2.5 rounded-[4px] hover:border-[#931916] transition-all"
                >
                  <span>Réussite Magazine</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#E40014] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </a>
              )}
              {mediaHub?.mediaInfoProEnabled && (
                <a
                  href={mediaHub.mediaInfoProUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('media_outbound', 'mediainfopro.net')}
                  className="group sovereign-plate-subtle flex items-center justify-between text-xs text-white px-3.5 py-2.5 rounded-[4px] hover:border-[#931916] transition-all"
                >
                  <span>MediaInfoPro</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#E40014] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* Column 4: Newsletter Réussite Magazine */}
          <div className="space-y-3.5">
            <h3 className="font-serif text-lg font-semibold text-white tracking-wide">
              {p('Veille économique', 'Business Intelligence')}
            </h3>
            <p className="text-xs text-white/75 leading-relaxed">
              {p(
                'Recevez les décryptages de Réussite Magazine et nos conseils de communication institutionnelle.',
                'Receive Réussite Magazine insights and institutional communication briefs.',
              )}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
              <input
                type="email"
                required
                value={newsEmail}
                onChange={(e) => setNewsEmail(e.target.value)}
                placeholder={p('Votre courriel professionnel', 'Your work email')}
                className="w-full px-3.5 py-2.5 text-xs bg-[#1A1413] border border-white/20 rounded-[4px] text-white placeholder:text-white/45 focus:border-[#931916] focus:outline-none transition-colors"
              />
              <label className="flex items-start gap-2 text-[11px] text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsConsent}
                  onChange={(e) => setNewsConsent(e.target.checked)}
                  className="mt-0.5 accent-[#931916]"
                />
                <span>
                  {p(
                    'J’accepte de recevoir la lettre d’information.',
                    'I agree to receive the newsletter.',
                  )}{' '}
                  <Link to={p('/desinscription', '/en/unsubscribe')} className="underline text-white hover:text-[#E40014]">
                    {p('Désinscription en un clic', 'One-click unsubscribe')}
                  </Link>
                </span>
              </label>
              <button
                type="submit"
                disabled={newsStatus === 'loading'}
                className="magnetic-sheen w-full py-2.5 px-3 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] transition-colors cursor-pointer"
              >
                {newsStatus === 'loading'
                  ? p('Envoi...', 'Sending...')
                  : p('S’abonner à la veille', 'Subscribe')}
              </button>
              {newsMsg && (
                <p className={`text-[11px] ${newsStatus === 'error' ? 'text-[#E40014]' : 'text-emerald-300'}`}>
                  {newsMsg}
                </p>
              )}
              {newsStatus === 'success' && newsConfirmUrl && (
                <a
                  href={newsConfirmUrl}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-[#931916] hover:bg-[#A30013] border border-[#931916] rounded-[4px] px-3 py-1.5 transition-colors"
                >
                  {p('Confirmer mon abonnement', 'Confirm my subscription')} →
                </a>
              )}
            </form>

            {settings && (settings.socialFacebook || settings.socialTiktok || settings.socialLinkedin) && (
              <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs text-white/75">
                {settings.socialFacebook && (
                  <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Facebook
                  </a>
                )}
                {settings.socialLinkedin && (
                  <a href={settings.socialLinkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    LinkedIn
                  </a>
                )}
                {settings.socialTiktok && (
                  <a href={settings.socialTiktok} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    TikTok
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Official bottom legal ledger bar */}
        <div className="border-t border-white/15">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
            <p>
              © {new Date().getFullYear()} {settings?.companyName || 'SOCIÉTÉ CONCAM SARL UNIPERSONNELLE'} — Conakry, République de Guinée.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link to={p('/mentions-legales', '/en/legal')} className="hover:text-white transition-colors">
                {p('Mentions légales', 'Legal Notice')}
              </Link>
              <Link to={p('/confidentialite', '/en/privacy')} className="hover:text-white transition-colors">
                {p('Confidentialité & RGPD', 'Privacy & GDPR')}
              </Link>
              <Link to={p('/desinscription', '/en/unsubscribe')} className="hover:text-white transition-colors">
                {p('Désinscription', 'Unsubscribe')}
              </Link>
              <Link to="/admin" className="hover:text-white transition-colors">
                {p('Espace Administration', 'Admin Dashboard')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
