import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { SiteProvider } from './context/SiteContext';
import { Layout } from './components/Layout';
import { Preloader, prefersReducedOrDataSaver } from './components/MotionPrimitives';
import { QuoteModal } from './components/QuoteModal';
import { SearchOverlay } from './components/SearchOverlay';
import { WhatsAppAndPopups } from './components/WhatsAppAndPopups';
import { AdvisorWidget } from './components/AdvisorWidget';
import { LegalNoticePage, PrivacyPolicyPage } from './pages/LegalPages';

// Découpage du bundle par route : chaque page (et tout l'espace admin,
// ~4 000 lignes) est chargée uniquement lorsqu'elle est visitée.
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ServicesIndexPage = lazy(() => import('./pages/ServicesIndexPage').then((m) => ({ default: m.ServicesIndexPage })));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage').then((m) => ({ default: m.ServiceDetailPage })));
const PresseEditionPage = lazy(() => import('./pages/PresseEditionPage').then((m) => ({ default: m.PresseEditionPage })));
const GalleryPage = lazy(() => import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const UnsubscribePage = lazy(() => import('./pages/UnsubscribePage').then((m) => ({ default: m.UnsubscribePage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));

/** Écran d'attente neutre pendant le chargement d'un segment de route :
 *  fond du thème actif + lueur éditoriale discrète, sans flash ni saut. */
function RouteFallback() {
  return (
    <div
      aria-hidden="true"
      style={{ minHeight: '55vh', background: 'var(--c-page, #F7F4EF)' }}
      className="relative overflow-hidden"
    >
      <div
        style={{
          position: 'absolute',
          inset: '18% 12%',
          background: 'linear-gradient(100deg, transparent 30%, var(--c-hairline, #DDD5C9) 50%, transparent 70%)',
          opacity: 0.25,
          animation: 'concam-fallback-sweep 1.2s ease-in-out infinite',
        }}
      />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // 'instant' est crucial : le CSS global applique scroll-behavior:smooth,
    // qui transformerait ce reset en long défilement animé à chaque navigation
    // (source majeure de la sensation de navigation « saccadée »).
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

/** Précharge tous les segments de routes pendant l'inactivité : la première
 *  navigation vers une page devient instantanée (chunk déjà en cache), ce qui
 *  supprime l'impression de « plantage » au premier clic sur un lien. */
function useRoutePreload() {
  useEffect(() => {
    const preload = () => {
      void Promise.all([
        import('./pages/HomePage'),
        import('./pages/AboutPage'),
        import('./pages/ServicesIndexPage'),
        import('./pages/ServiceDetailPage'),
        import('./pages/PresseEditionPage'),
        import('./pages/GalleryPage'),
        import('./pages/BlogPage'),
        import('./pages/ContactPage'),
        import('./pages/SearchPage'),
        import('./pages/UnsubscribePage'),
        import('./pages/AdminDashboard'),
      ]).catch(() => {});
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(preload, { timeout: 2500 });
    } else {
      const t = window.setTimeout(preload, 1800);
      return () => window.clearTimeout(t);
    }
  }, []);
}

function PublicRoutes() {
  const location = useLocation();
  const reduced = prefersReducedOrDataSaver();
  useRoutePreload();

  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          {/* Transition resserrée : sortie en fondu pur très bref (0.15 s),
              entrée douce 0.26 s — la navigation paraît immédiate. */}
          <motion.div
            key={location.pathname}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes location={location}>
            {/* French Default Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/services" element={<ServicesIndexPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/presse-edition" element={<PresseEditionPage />} />
            <Route path="/galerie" element={<GalleryPage />} />
            <Route path="/actualites-conseils" element={<BlogPage />} />
            <Route path="/actualites-conseils/:slug" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/recherche" element={<SearchPage />} />
            <Route path="/desinscription" element={<UnsubscribePage />} />
            <Route path="/mentions-legales" element={<LegalNoticePage />} />
            <Route path="/confidentialite" element={<PrivacyPolicyPage />} />

            {/* English Dedicated Routes */}
            <Route path="/en" element={<HomePage />} />
            <Route path="/en/about" element={<AboutPage />} />
            <Route path="/en/services" element={<ServicesIndexPage />} />
            <Route path="/en/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/en/press-publishing" element={<PresseEditionPage />} />
            <Route path="/en/gallery" element={<GalleryPage />} />
            <Route path="/en/insights" element={<BlogPage />} />
            <Route path="/en/insights/:slug" element={<BlogPage />} />
            <Route path="/en/contact" element={<ContactPage />} />
            <Route path="/en/search" element={<SearchPage />} />
            <Route path="/en/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/en/legal" element={<LegalNoticePage />} />
            <Route path="/en/privacy" element={<PrivacyPolicyPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
      <BrowserRouter>
      <SiteProvider>
        <ScrollToTop />
        <Preloader />
        <Routes>
          <Route
            path="/admin"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route path="/*" element={<PublicRoutes />} />
        </Routes>
        <SearchOverlay />
        <QuoteModal />
        <WhatsAppAndPopups />
        <AdvisorWidget />
      </SiteProvider>
    </BrowserRouter>
  );
}
