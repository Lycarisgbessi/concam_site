import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { SiteProvider } from './context/SiteContext';
import { Layout } from './components/Layout';
import { Preloader, prefersReducedOrDataSaver } from './components/MotionPrimitives';
import { QuoteModal } from './components/QuoteModal';
import { SearchOverlay } from './components/SearchOverlay';
import { WhatsAppAndPopups } from './components/WhatsAppAndPopups';
import { AdvisorWidget } from './components/AdvisorWidget';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesIndexPage } from './pages/ServicesIndexPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { PresseEditionPage } from './pages/PresseEditionPage';
import { GalleryPage } from './pages/GalleryPage';
import { BlogPage } from './pages/BlogPage';
import { ContactPage } from './pages/ContactPage';
import { SearchPage } from './pages/SearchPage';
import { UnsubscribePage } from './pages/UnsubscribePage';
import { LegalNoticePage, PrivacyPolicyPage } from './pages/LegalPages';
import { AdminDashboard } from './pages/AdminDashboard';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PublicRoutes() {
  const location = useLocation();
  const reduced = prefersReducedOrDataSaver();

  return (
    <Layout>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
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
          <Route path="/admin" element={<AdminDashboard />} />
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
