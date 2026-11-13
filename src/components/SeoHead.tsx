import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

interface SeoHeadProps {
  routeKey?: string;
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function SeoHead({
  routeKey,
  customTitle,
  customDescription,
  customKeywords,
  jsonLd,
}: SeoHeadProps) {
  const { data, lang } = useSite();
  const location = useLocation();

  useEffect(() => {
    const seoMatch = data?.seoConfigs.find((s) => s.routeKey === routeKey);
    const title =
      customTitle ||
      (seoMatch ? (lang === 'en' ? seoMatch.titleEn : seoMatch.titleFr) : undefined) ||
      'CONCAM — Agence de Communication & Marketing à Conakry';
    const description =
      customDescription ||
      (seoMatch ? (lang === 'en' ? seoMatch.descriptionEn : seoMatch.descriptionFr) : undefined) ||
      'Agence conseil 360° à Conakry depuis 2010 : stratégie de communication, impression numérique et offset, manuels et marquage publicitaire.';
    const keywords =
      customKeywords ||
      (seoMatch ? (lang === 'en' ? seoMatch.keywordsEn : seoMatch.keywordsFr) : '');

    document.title = title;

    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', description);
    // Always (re)write the keywords meta — removing it when the current page has
    // none, otherwise the previous page's value lingers in the <head>.
    setMeta('meta[name="keywords"]', 'name', 'keywords', keywords || '');
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="robots"]', 'name', 'robots', seoMatch?.noIndex ? 'noindex,nofollow' : 'index,follow');

    const origin = window.location.origin;
    const currentUrl = `${origin}${location.pathname}`;
    setMeta('meta[property="og:url"]', 'property', 'og:url', currentUrl);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    const rawOgImg = data?.pageContent.heroImageUrl || '/images/real/hdr_home_advisory.jpg';
    const absOgImg = rawOgImg.startsWith('http') ? rawOgImg : `${origin}${rawOgImg}`;
    setMeta('meta[property="og:image"]', 'property', 'og:image', absOgImg);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', absOgImg);

    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
      let el = document.querySelector(selector) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        if (hreflang) el.hreflang = hreflang;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    setLink('canonical', currentUrl);
    const frPath = location.pathname.startsWith('/en')
      ? location.pathname.replace(/^\/en/, '') || '/'
      : location.pathname;
    const enPath = location.pathname.startsWith('/en')
      ? location.pathname
      : `/en${location.pathname === '/' ? '' : location.pathname}`;
    setLink('alternate', `${origin}${frPath}`, 'fr');
    setLink('alternate', `${origin}${enPath}`, 'en');
    setLink('alternate', `${origin}${frPath}`, 'x-default');

    // JSON-LD Structured Data
    const existingScript = document.getElementById('concam-jsonld');
    if (existingScript) existingScript.remove();

    const baseOrganization = data
      ? {
          '@context': 'https://schema.org',
          '@type': ['Organization', 'LocalBusiness'],
          name: data.settings.companyName,
          alternateName: data.settings.brandAlias,
          url: origin,
          email: data.settings.agencyEmail,
          telephone: data.settings.phones[0],
          foundingDate: String(data.settings.foundedYear),
          address: {
            '@type': 'PostalAddress',
            // Follows the CMS single source of truth instead of a hardcoded street.
            streetAddress: data.settings.address?.fr || data.settings.address?.en || '',
            addressLocality: 'Conakry',
            addressCountry: 'GN',
          },
          sameAs: [
            data.settings.socialFacebook,
            data.settings.socialTiktok,
            data.settings.socialLinkedin,
            data.mediaHub.reussiteMagazineUrl,
          ].filter(Boolean),
        }
      : null;

    // Auto BreadcrumbList Schema.org on sub-pages
    const segments = location.pathname.split('/').filter(Boolean).filter((s) => s !== 'en');
    const breadcrumbSchema =
      segments.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: lang === 'en' ? 'Home' : 'Accueil',
                item: `${origin}${lang === 'en' ? '/en' : '/'}`,
              },
              ...segments.map((seg, idx) => ({
                '@type': 'ListItem',
                position: idx + 2,
                name: seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                item: `${origin}${lang === 'en' ? '/en' : ''}/${segments.slice(0, idx + 1).join('/')}`,
              })),
            ],
          }
        : null;

    const extras = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    const payload = [baseOrganization, breadcrumbSchema, ...extras].filter(Boolean);

    if (payload.length > 0) {
      const script = document.createElement('script');
      script.id = 'concam-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(payload.length === 1 ? payload[0] : payload);
      document.head.appendChild(script);
    }
  }, [data, lang, location.pathname, routeKey, customTitle, customDescription, customKeywords, jsonLd]);

  return null;
}
