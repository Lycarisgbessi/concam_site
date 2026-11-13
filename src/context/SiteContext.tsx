import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PublicSiteData, Lang } from '../types/concam';

interface QuotePrefill {
  serviceSlug?: string;
  notes?: string;
}

interface SiteContextValue {
  data: PublicSiteData | null;
  loading: boolean;
  lang: Lang;
  switchLanguage: (target: Lang) => void;
  refreshSiteData: () => Promise<void>;
  quoteModalOpen: boolean;
  quotePrefill: QuotePrefill;
  openQuoteModal: (prefill?: QuotePrefill) => void;
  closeQuoteModal: () => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatDraftPrompt: string;
  setChatDraftPrompt: (prompt: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  pagesVisited: string[];
  trackEvent: (eventType: string, label?: string, value?: number) => void;
  cookieConsent: 'pending' | 'accepted' | 'essential';
  setCookieConsent: (val: 'accepted' | 'essential') => void;
}

const SiteContext = createContext<SiteContextValue | null>(null);

const ROUTE_MAP_FR_TO_EN: Record<string, string> = {
  '/': '/en',
  '/a-propos': '/en/about',
  '/services': '/en/services',
  '/presse-edition': '/en/press-publishing',
  '/galerie': '/en/gallery',
  '/actualites-conseils': '/en/insights',
  '/contact': '/en/contact',
  '/recherche': '/en/search',
  '/desinscription': '/en/unsubscribe',
  '/mentions-legales': '/en/legal',
  '/confidentialite': '/en/privacy',
};

const ROUTE_MAP_EN_TO_FR: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTE_MAP_FR_TO_EN).map(([fr, en]) => [en, fr]),
);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<PublicSiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefill>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraftPrompt, setChatDraftPrompt] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [pagesVisited, setPagesVisited] = useState<string[]>([]);
  const [cookieConsent, setCookieConsentState] = useState<'pending' | 'accepted' | 'essential'>(() => {
    const saved = localStorage.getItem('concam_cookie_consent');
    if (saved === 'accepted' || saved === 'essential') return saved;
    return 'pending';
  });

  const lang: Lang = location.pathname.startsWith('/en') ? 'en' : 'fr';

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('concam_lang', lang);
  }, [lang]);

  const refreshSiteData = useCallback(async () => {
    try {
      const res = await fetch('/api/public/site-data');
      if (res.ok) {
        const json = (await res.json()) as PublicSiteData;
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load site data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSiteData();
  }, [refreshSiteData]);

  const trackEvent = useCallback(
    (eventType: string, label = '', value?: number) => {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          path: location.pathname,
          label,
          value,
        }),
      }).catch(() => {});
    },
    [location.pathname],
  );

  // Track page views & visited history
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    setPagesVisited((prev) => Array.from(new Set([...prev, location.pathname])).slice(-12));
    trackEvent('pageview', document.title || location.pathname);

    // Track visit count for newsletter popup trigger (2nd visit)
    const count = Number(localStorage.getItem('concam_visit_count') || '0') + 1;
    localStorage.setItem('concam_visit_count', String(count));
  }, [location.pathname, trackEvent]);

  // Global Cmd/Ctrl + K search shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (location.pathname.startsWith('/admin')) return;
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [location.pathname]);

  // Record UTM / referrer traffic source once per browser session
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    if (sessionStorage.getItem('concam_source_tracked')) return;
    sessionStorage.setItem('concam_source_tracked', '1');
    const params = new URLSearchParams(location.search);
    const utm = params.get('utm_source');
    let sourceLabel = 'Direct';
    if (utm) {
      sourceLabel = `UTM: ${utm}`;
    } else if (document.referrer) {
      try {
        const refHost = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (refHost && refHost !== window.location.hostname) {
          sourceLabel = refHost;
        }
      } catch {
        // Ignore invalid referrer URL
      }
    }
    trackEvent('traffic_source', sourceLabel);
  }, [location.pathname, location.search, trackEvent]);

  // Measure real Core Web Vitals (LCP, CLS, INP) once per session
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    let lcpReported = false;
    let clsValue = 0;
    let maxInp = 0;

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last && !lcpReported) {
          lcpReported = true;
          trackEvent('cwv_lcp', 'LCP', Math.round(last.startTime));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
          if (!entry.hadRecentInput && entry.value) {
            clsValue += entry.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      let inpObserver: PerformanceObserver | null = null;
      try {
        inpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { interactionId?: number }>) {
            if (entry.interactionId && entry.duration > maxInp) {
              maxInp = entry.duration;
            }
          }
        });
        inpObserver.observe({ type: 'event', buffered: true } as PerformanceObserverInit);
      } catch {
        inpObserver = null;
      }

      const onHide = () => {
        if (clsValue > 0) {
          trackEvent('cwv_cls', 'CLS', Number(clsValue.toFixed(3)));
        }
        if (maxInp > 0) {
          trackEvent('cwv_inp', 'INP', Math.round(maxInp));
        }
      };
      window.addEventListener('visibilitychange', onHide, { once: true });

      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        inpObserver?.disconnect();
      };
    } catch {
      return;
    }
  }, [trackEvent]);

  const switchLanguage = useCallback(
    (target: Lang) => {
      const current = location.pathname;
      // Keep query params (e.g. /recherche?q=… or /galerie?item=…) across the switch.
      const search = location.search || '';
      const navigateWithSearch = (to: string) => navigate(`${to}${search}`);
      if (target === lang) return;

      if (target === 'en') {
        if (ROUTE_MAP_FR_TO_EN[current]) {
          navigateWithSearch(ROUTE_MAP_FR_TO_EN[current]);
          return;
        }
        if (current.startsWith('/services/')) {
          navigateWithSearch(`/en${current}`);
          return;
        }
        if (current.startsWith('/actualites-conseils/')) {
          navigateWithSearch(current.replace('/actualites-conseils/', '/en/insights/'));
          return;
        }
        navigateWithSearch('/en');
      } else {
        if (ROUTE_MAP_EN_TO_FR[current]) {
          navigateWithSearch(ROUTE_MAP_EN_TO_FR[current]);
          return;
        }
        if (current.startsWith('/en/services/')) {
          navigateWithSearch(current.replace('/en/services/', '/services/'));
          return;
        }
        if (current.startsWith('/en/insights/')) {
          navigateWithSearch(current.replace('/en/insights/', '/actualites-conseils/'));
          return;
        }
        navigateWithSearch('/');
      }
    },
    [lang, location.pathname, location.search, navigate],
  );

  const openQuoteModal = useCallback((prefill?: QuotePrefill) => {
    setQuotePrefill(prefill || {});
    setQuoteModalOpen(true);
  }, []);

  const closeQuoteModal = useCallback(() => {
    setQuoteModalOpen(false);
  }, []);

  const setCookieConsent = useCallback((val: 'accepted' | 'essential') => {
    localStorage.setItem('concam_cookie_consent', val);
    setCookieConsentState(val);
  }, []);

  return (
    <SiteContext.Provider
      value={{
        data,
        loading,
        lang,
        switchLanguage,
        refreshSiteData,
        quoteModalOpen,
        quotePrefill,
        openQuoteModal,
        closeQuoteModal,
        chatOpen,
        setChatOpen,
        chatDraftPrompt,
        setChatDraftPrompt,
        searchOpen,
        setSearchOpen,
        pagesVisited,
        trackEvent,
        cookieConsent,
        setCookieConsent,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
}
