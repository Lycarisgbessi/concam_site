import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Phone,
  MessageCircle,
  Newspaper,
  Check,
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import {
  AnimatedCounter,
  ClipCurtainReveal,
  EngravedRuleReveal,
  MagneticWrapper,
  ParallaxBackdropPlate,
  ParallaxColumnStagger,
  ParallaxCurtainSection,
  ParallaxHorizontalBand,
  ParallaxHorizontalTitle,
  ParallaxImageFrame,
  ParallaxLayer,
  ParallaxScroll3DPlate,
  ParallaxSealDrift,
  ParallaxStackDeck,
  ParallaxStickySplit,
  RevealBlock,
  SplitTextReveal,
  TiltCard3D,
} from '../components/MotionPrimitives';
import { AnimatedPageHeader, LUXURY_HEADER_IMAGES } from '../components/AnimatedPageHeader';
import type { MediaHeadline, ServiceItem } from '../types/concam';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

function ServiceOfferingTicker({ service, lang }: { service: ServiceItem; lang: 'fr' | 'en' }) {
  const [idx, setIdx] = useState(0);
  const offerings = service.offerings || [];

  useEffect(() => {
    if (offerings.length <= 1) return;
    const id = window.setInterval(() => {
      setIdx((prev) => (prev + 1) % offerings.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, [offerings.length]);

  if (offerings.length === 0) return null;
  const active = offerings[idx] || offerings[0];

  return (
    <div className="archival-plate-warm rounded-[4px] px-4 py-3.5 overflow-hidden">
      <div className="flex items-center justify-between text-[11px] font-sans font-semibold uppercase tracking-[0.14em] text-accent mb-1.5">
        <span>{lang === 'en' ? 'Active Deliverable' : 'Prestation dédiée'}</span>
        <span className="tabular-nums font-serif text-xs">
          0{idx + 1} / 0{offerings.length}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${service.id}-off-${idx}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-0.5"
        >
          <p className="text-sm font-semibold text-ink">
            {lang === 'en' ? active.titleEn : active.titleFr}
          </p>
          <p className="text-xs text-muted line-clamp-1">
            {lang === 'en' ? active.descEn : active.descFr}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function HomePage() {
  const { data, lang, openQuoteModal, setChatOpen, trackEvent } = useSite();
  const [headlines, setHeadlines] = useState<MediaHeadline[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  // Auto-advancing Service Spotlight Carousel state
  const [srvSlideIdx, setSrvSlideIdx] = useState(0);
  const [srvPaused, setSrvPaused] = useState(false);
  const [srvDir, setSrvDir] = useState<1 | -1>(1);

  // Auto-advancing Portfolio Case-Study Carousel state
  const [galSlideIdx, setGalSlideIdx] = useState(0);
  const [galPaused, setGalPaused] = useState(false);
  const [galDir, setGalDir] = useState<1 | -1>(1);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  useEffect(() => {
    fetch('/api/public/media-feed')
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.items)) setHeadlines(json.items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (carouselPaused || headlines.length <= 1) return;
    const id = window.setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % headlines.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, [carouselPaused, headlines.length]);

  const servicesCount = data?.services.length || 0;
  useEffect(() => {
    if (srvPaused || servicesCount <= 1) return;
    const id = window.setInterval(() => {
      setSrvDir(1);
      setSrvSlideIdx((prev) => (prev + 1) % servicesCount);
    }, 4600);
    return () => window.clearInterval(id);
  }, [srvPaused, servicesCount]);

  const featuredGalleryCount = data?.galleryItems.filter((g) => g.featured).slice(0, 5).length || 0;
  useEffect(() => {
    if (galPaused || featuredGalleryCount <= 1) return;
    const id = window.setInterval(() => {
      setGalDir(1);
      setGalSlideIdx((prev) => (prev + 1) % featuredGalleryCount);
    }, 5000);
    return () => window.clearInterval(id);
  }, [galPaused, featuredGalleryCount]);

  if (!data) {
    return (
      <div className="min-h-[85vh] bg-[#110D0C] -mt-16 pt-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-4 w-48 bg-white/10 rounded-[4px]" />
          <div className="h-14 w-full max-w-2xl bg-white/10 rounded-[4px]" />
          <div className="h-6 w-full max-w-xl bg-white/5 rounded-[4px]" />
        </div>
      </div>
    );
  }

  const { settings, mediaHub, services, galleryItems, pageContent } = data;
  const featuredGallery = galleryItems.filter((g) => g.featured).slice(0, 5);
  const blocks = [...(pageContent.homeBlocks || [])]
    .filter((b) => b.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const waHref = `https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
    lang === 'en' ? settings.whatsappDefaultMsgEn : settings.whatsappDefaultMsgFr,
  )}`;

  const defaultHeroSlides = [
    {
      mediaType: 'image' as const,
      imageUrl: pageContent.heroImageUrl || LUXURY_HEADER_IMAGES.boardroom,
      captionFr: 'Kaloum, Conakry · Conseil stratégique 360° & direction artistique',
      captionEn: 'Kaloum, Conakry · 360° Strategic Advisory & Art Direction',
      tagFr: 'Pôle I · Conseil 360°',
      tagEn: 'Pillar I · 360° Advisory',
      cardTitleFr: services[0]?.titleFr || 'Conseil en communication 360°',
      cardTitleEn: services[0]?.titleEn || '360° Communication Advisory',
      cardDescFr: services[0]?.taglineFr || 'Stratégie de marque, campagnes multicanales et relations publiques.',
      cardDescEn: services[0]?.taglineEn || 'Brand strategy, multi-channel campaigns & PR.',
      href: services[0] ? p(`/services/${services[0].slug}`, `/en/services/${services[0].slug}`) : p('/services', '/en/services'),
    },
    {
      mediaType: 'image' as const,
      imageUrl: LUXURY_HEADER_IMAGES.conakry,
      captionFr: 'Ancrage institutionnel en République de Guinée depuis 2010',
      captionEn: 'Institutional anchorage in the Republic of Guinea since 2010',
      tagFr: 'Pôle II · Édition & Manuels',
      tagEn: 'Pillar II · Manuals & Guides',
      cardTitleFr: services[1]?.titleFr || 'Manuels de procédures & supports',
      cardTitleEn: services[1]?.titleEn || 'Procedure Manuals & Guides',
      cardDescFr: services[1]?.taglineFr || 'Ingénierie documentaire pour banques, ministères et grands groupes.',
      cardDescEn: services[1]?.taglineEn || 'Editorial documentation for banks, ministries & enterprises.',
      href: services[1] ? p(`/services/${services[1].slug}`, `/en/services/${services[1].slug}`) : p('/services', '/en/services'),
    },
    {
      mediaType: 'image' as const,
      imageUrl: LUXURY_HEADER_IMAGES.atelier,
      captionFr: 'Atelier d’édition et impression offset haute précision à Conakry',
      captionEn: 'Publishing studio and high-precision offset printing in Conakry',
      tagFr: 'Pôle III · Atelier Offset',
      tagEn: 'Pillar III · Offset Press',
      cardTitleFr: services[2]?.titleFr || 'Impression grand format & offset',
      cardTitleEn: services[2]?.titleEn || 'Offset & Wide-Format Print',
      cardDescFr: services[2]?.taglineFr || 'Tirages rapides, finitions luxe, catalogues et PLV durable.',
      cardDescEn: services[2]?.taglineEn || 'Rapid print runs, luxury finishes, catalogs and display.',
      href: services[2] ? p(`/services/${services[2].slug}`, `/en/services/${services[2].slug}`) : p('/services', '/en/services'),
    },
    {
      mediaType: 'image' as const,
      imageUrl: LUXURY_HEADER_IMAGES.summit,
      captionFr: 'Objets de direction, presse économique & Réussite Magazine',
      captionEn: 'Executive branding, business press & Réussite Magazine',
      tagFr: 'Pôle IV · Marquage & Média',
      tagEn: 'Pillar IV · Branding & Press',
      cardTitleFr: services[3]?.titleFr || 'Marquage & gadgets institutionnels',
      cardTitleEn: services[3]?.titleEn || 'Corporate Branding & Gifts',
      cardDescFr: services[3]?.taglineFr || 'Coffrets dirigeants, textile brodé et signalétique sur mesure.',
      cardDescEn: services[3]?.taglineEn || 'Executive gift boxes, embroidered apparel and custom signage.',
      href: services[3] ? p(`/services/${services[3].slug}`, `/en/services/${services[3].slug}`) : p('/presse-edition', '/en/press-publishing'),
    },
  ];
  const cmsHomeSlides = pageContent.pageHeaders?.home;
  const heroSlides = cmsHomeSlides && cmsHomeSlides.length > 0 ? cmsHomeSlides : defaultHeroSlides;

  const signatureDisciplines = [
    p('Conseil Stratégique 360°', '360° Brand Advisory'),
    p('Édition & Manuels Techniques', 'Technical Manuals'),
    p('Impression Offset & Grand Format', 'Offset & Wide Print'),
    p('Marquage Direction & Coffrets', 'Executive Branding'),
    'Réussite Magazine',
    p('Relations Institutionnelles', 'Institutional PR'),
  ];

  const activeSrv = services[srvSlideIdx] || services[0];
  const activeGal = featuredGallery[galSlideIdx] || featuredGallery[0];

  const renderBlock = (key: string, animation: typeof blocks[number]['animation']) => {
    switch (key) {
      case 'hero':
        return (
          <AnimatedPageHeader
            key="hero"
            showSpotlightDeck
            slides={heroSlides}
            kicker={lang === 'en' ? pageContent.heroKickerEn : pageContent.heroKickerFr}
            title={lang === 'en' ? pageContent.heroTitleEn : pageContent.heroTitleFr}
            subtitle={lang === 'en' ? pageContent.heroSubtitleEn : pageContent.heroSubtitleFr}
          >
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <MagneticWrapper strength={0.2}>
                <button
                  type="button"
                  onClick={() => openQuoteModal()}
                  className="magnetic-sheen group inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] transition-colors duration-300 shadow-[0_16px_38px_-12px_rgba(147,25,22,0.75)] cursor-pointer whitespace-nowrap"
                >
                  <span>{p('Demander un devis', 'Request a Quote')}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </button>
              </MagneticWrapper>

              <MagneticWrapper strength={0.18}>
                <button
                  type="button"
                  onClick={() => {
                    setChatOpen(true);
                    trackEvent('chatbot_open', 'hero_cta');
                  }}
                  className="sovereign-plate-subtle group inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold hover:border-[#931916] text-white rounded-[4px] transition-colors duration-300 cursor-pointer whitespace-nowrap"
                >
                  <MessageSquareText className="w-4 h-4 text-[#E40014] transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <span>{p('Discuter avec notre conseiller IA', 'Chat with our AI Advisor')}</span>
                </button>
              </MagneticWrapper>
            </div>
          </AnimatedPageHeader>
        );

      case 'partners': {
        const partnerStream = [...settings.partners, ...settings.partners, ...settings.partners, ...settings.partners];
        const disciplineStream = [
          ...signatureDisciplines,
          ...signatureDisciplines,
          ...signatureDisciplines,
          ...signatureDisciplines,
        ];
        return (
          <ParallaxCurtainSection key="partners" zIndex={20} topAccent>
            <section className="bg-[#1A1312] text-white border-b border-white/15 py-7 overflow-hidden relative">
              <ParallaxBackdropPlate variant="crimson-bands" offset={64} />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-5 flex items-center justify-between gap-4 relative z-10">
              <p className="text-xs font-sans font-semibold uppercase tracking-[0.16em] text-white/90">
                {p(
                  'Ils nous accordent leur confiance — institutions et entreprises en Guinée',
                  'Trusted by leading institutions and enterprises across Guinea',
                )}
              </p>
              <Link
                to={p('/a-propos', '/en/about')}
                className="editorial-link text-xs font-semibold text-white hover:text-[#E40014] whitespace-nowrap shrink-0"
              >
                {p('Voir nos références', 'View references')}
              </Link>
            </div>

            {/* Track 1: Strictly Single-Line Horizontal Marquee (Left -> Right) */}
            <div className="relative overflow-hidden py-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#1A1312] to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#1A1312] to-transparent z-10" />
              <div className="animate-concam-marquee gap-10 px-6">
                {partnerStream.map((partner, i) => (
                  <span key={`p-${i}`} className="inline-flex items-center gap-10 shrink-0 whitespace-nowrap">
                    <span className="font-serif text-xl sm:text-2xl font-semibold tracking-wide text-white hover:text-[#E40014] transition-colors">
                      {partner}
                    </span>
                    <span className="text-[#E40014] text-xs select-none" aria-hidden="true">
                      ◆
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Track 2: Strictly Single-Line Horizontal Marquee (Right -> Left) */}
            <div className="relative overflow-hidden pt-3 mt-2 border-t border-white/15">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#1A1312] to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#1A1312] to-transparent z-10" />
              <div className="animate-concam-marquee-reverse gap-8 px-6">
                {disciplineStream.map((disc, i) => (
                  <span key={`d-${i}`} className="inline-flex items-center gap-8 shrink-0 whitespace-nowrap">
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
                      {disc}
                    </span>
                    <span className="text-[#E40014] text-xs select-none" aria-hidden="true">
                      ·
                    </span>
                  </span>
                ))}
              </div>
            </div>
            </section>
          </ParallaxCurtainSection>
        );
      }

      case 'services':
        return (
          <section
            key="services"
            style={{ zIndex: 25 }}
            className="relative py-24 lg:py-28 bg-page text-ink overflow-x-clip border-t-2 border-[#931916] shadow-[0_-28px_72px_-12px_rgba(17,13,12,0.42)]"
          >
            <ParallaxBackdropPlate variant="light-grid" offset={115} />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
                <div className="max-w-2xl space-y-3">
                  <ParallaxHorizontalTitle direction={-1} distance={24}>
                    <RevealBlock preset="slide-left">
                      <p className="text-xs font-sans font-semibold tracking-[0.2em] uppercase text-accent">
                        {p('Expertise intégrée 360°', 'Integrated 360° Capabilities')}
                      </p>
                    </RevealBlock>
                  </ParallaxHorizontalTitle>
                  <ParallaxHorizontalTitle direction={1} distance={28}>
                    <SplitTextReveal
                      as="h2"
                      text={p(
                        'Quatre pôles métiers pour vos projets institutionnels',
                        'Four core pillars for institutional & corporate impact',
                      )}
                      className="font-serif text-3xl sm:text-5xl font-bold text-ink tracking-tight leading-[1.06]"
                    />
                  </ParallaxHorizontalTitle>
                </div>
                <MagneticWrapper strength={0.18}>
                  <Link
                    to={p('/services', '/en/services')}
                    className="group editorial-link inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-ink whitespace-nowrap shrink-0 pb-1"
                  >
                    <span>{p('Explorer tous les services', 'Explore all services')}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </MagneticWrapper>
              </div>

              <EngravedRuleReveal tone="light" align="left" className="mb-14" />

              {/* Auto-Advancing Expertise Cinema Carousel with 3D Scroll Depth */}
              {activeSrv && (
                <ParallaxScroll3DPlate direction={1} tiltX={7} tiltY={5} liftY={44} className="mb-20">
                  <div
                    onMouseEnter={() => setSrvPaused(true)}
                    onMouseLeave={() => setSrvPaused(false)}
                  >
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {services.map((s, idx) => {
                        const active = srvSlideIdx === idx;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSrvDir(idx >= srvSlideIdx ? 1 : -1);
                              setSrvSlideIdx(idx);
                            }}
                            className={`relative px-4 py-2 text-xs font-semibold rounded-[4px] border transition-colors cursor-pointer whitespace-nowrap ${
                              active
                                ? 'text-white border-[#931916]'
                                : 'bg-surface border-hairline text-muted hover:text-ink hover:border-[#931916]/50'
                            }`}
                          >
                            {active && (
                              <motion.span
                                layoutId="home-srv-tab"
                                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                                className="absolute inset-0 bg-[#931916] rounded-[3px]"
                              />
                            )}
                            <span className="relative z-10 font-serif italic mr-1.5 opacity-85">
                              {ROMAN[idx] || idx + 1}.
                            </span>
                            <span className="relative z-10">{lang === 'en' ? s.titleEn : s.titleFr}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-semibold tabular-nums text-muted mr-1">
                        0{srvSlideIdx + 1} / 0{services.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSrvDir(-1);
                          setSrvSlideIdx((i) => (i - 1 + services.length) % services.length);
                        }}
                        aria-label={p('Pôle précédent', 'Previous pillar')}
                        className="bg-surface border border-hairline p-2.5 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSrvDir(1);
                          setSrvSlideIdx((i) => (i + 1) % services.length);
                        }}
                        aria-label={p('Pôle suivant', 'Next pillar')}
                        className="bg-surface border border-hairline p-2.5 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sliding Cinema Stage */}
                  <div className="archival-plate rounded-[4px] overflow-hidden relative">
                    <AnimatePresence mode="wait" custom={srvDir}>
                      <motion.div
                        key={activeSrv.id}
                        custom={srvDir}
                        initial={{ opacity: 0, x: srvDir > 0 ? 54 : -54 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: srvDir > 0 ? -54 : 54 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="grid grid-cols-1 lg:grid-cols-12 items-stretch"
                      >
                        <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto lg:min-h-[340px] bg-limestone overflow-hidden">
                          <ParallaxImageFrame shiftPct={6.5}>
                            <motion.img
                              key={activeSrv.imageUrl}
                              initial={{ scale: 1.09 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                              src={activeSrv.imageUrl}
                              alt={lang === 'en' ? activeSrv.titleEn : activeSrv.titleFr}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </ParallaxImageFrame>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/75 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-4 left-4 bg-[#110D0C]/90 border border-white/25 px-3 py-1 rounded-[4px] text-xs font-serif tracking-wider text-white">
                            {p('Pôle', 'Pillar')} {ROMAN[srvSlideIdx] || srvSlideIdx + 1} · CONCAM
                          </div>
                        </div>

                        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between gap-6">
                          <div className="space-y-4">
                            <p className="text-xs font-sans font-semibold uppercase tracking-[0.16em] text-accent">
                              {lang === 'en' ? activeSrv.taglineEn : activeSrv.taglineFr}
                            </p>
                            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-snug">
                              {lang === 'en' ? activeSrv.titleEn : activeSrv.titleFr}
                            </h3>
                            <p className="text-sm sm:text-base text-muted leading-relaxed">
                              {lang === 'en' ? activeSrv.summaryEn : activeSrv.summaryFr}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              {(activeSrv.offerings || []).slice(0, 2).map((off, oi) => (
                                <div key={oi} className="archival-plate-warm rounded-[4px] p-3.5 space-y-1">
                                  <p className="text-xs font-semibold text-ink">
                                    {lang === 'en' ? off.titleEn : off.titleFr}
                                  </p>
                                  <p className="text-xs text-muted line-clamp-2">
                                    {lang === 'en' ? off.descEn : off.descFr}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-hairline">
                            <Link
                              to={lang === 'en' ? `/en/services/${activeSrv.slug}` : `/services/${activeSrv.slug}`}
                              className="magnetic-sheen inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] transition-colors whitespace-nowrap"
                            >
                              <span>{p('Explorer ce pôle', 'Explore this Pillar')}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => openQuoteModal({ serviceSlug: activeSrv.slug })}
                              className="bg-limestone hover:bg-hairline px-4 py-2.5 text-xs font-semibold text-ink border border-hairline rounded-[4px] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {p('Chiffrer ce projet', 'Quote This Project')}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Auto-progress bar */}
                    <div className="h-[2px] w-full bg-limestone relative overflow-hidden">
                      <motion.div
                        key={`srv-prog-${srvSlideIdx}-${srvPaused ? 'p' : 'r'}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: srvPaused ? 0 : 4.6, ease: 'linear' }}
                        style={{ transformOrigin: '0% 50%' }}
                        className="absolute inset-0 bg-[#931916]"
                      />
                    </div>
                  </div>
                </div>
                </ParallaxScroll3DPlate>
              )}

              {/* Sticky Layered Stacking Card Deck for the 4 CONCAM Service Pillars */}
              <ParallaxStackDeck
                items={services}
                renderItem={(index) => {
                  const srv = services[index];
                  const isEven = index % 2 === 0;
                  const benefits = (lang === 'en' ? srv.benefitsEn : srv.benefitsFr).slice(0, 3);
                  return (
                    <article
                      key={srv.id}
                      className="archival-plate bg-surface rounded-[4px] p-6 sm:p-8 lg:p-10 border border-hairline hover:border-[#931916] transition-colors"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-center">
                        <div className={`lg:col-span-5 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                          <TiltCard3D intensity={5}>
                            <Link
                              to={lang === 'en' ? `/en/services/${srv.slug}` : `/services/${srv.slug}`}
                              className="group block relative aspect-[16/10] lg:aspect-[4/3] rounded-[4px] overflow-hidden border border-hairline hover:border-[#931916] bg-limestone shadow-[0_18px_38px_-18px_rgba(24,20,19,0.3)] transition-colors"
                            >
                              <ParallaxImageFrame shiftPct={8}>
                                <img
                                  src={srv.imageUrl}
                                  alt={lang === 'en' ? srv.titleEn : srv.titleFr}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                                 loading="lazy" decoding="async" />
                              </ParallaxImageFrame>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/80 via-transparent to-transparent pointer-events-none" />
                              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                                <span className="bg-[#110D0C]/90 border border-white/25 px-3 py-1 rounded-[4px] font-serif text-xs tracking-widest uppercase text-white">
                                  {p('Pôle', 'Pillar')} {ROMAN[index] || index + 1}
                                </span>
                                <span className="bg-[#931916] inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[4px] group-hover:bg-[#A30013] transition-colors">
                                  <span>{p('Explorer', 'Explore')}</span>
                                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </span>
                              </div>
                            </Link>
                          </TiltCard3D>
                        </div>

                        <div className={`lg:col-span-7 space-y-4 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                          <ParallaxHorizontalTitle direction={isEven ? 1 : -1} distance={18}>
                            <div className="flex items-center gap-3 text-xs font-sans font-semibold uppercase tracking-[0.14em] text-accent">
                              <span className="w-8 h-8 rounded-[4px] bg-[#110D0C] border border-[#931916] flex items-center justify-center font-serif font-bold text-white shrink-0">
                                {ROMAN[index] || index + 1}
                              </span>
                              <span className="h-[1px] w-8 bg-[#931916]" aria-hidden="true" />
                              <span className="truncate">{lang === 'en' ? srv.taglineEn : srv.taglineFr}</span>
                            </div>
                          </ParallaxHorizontalTitle>

                          <ParallaxHorizontalTitle direction={isEven ? -1 : 1} distance={22}>
                            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-ink tracking-tight leading-tight">
                              {lang === 'en' ? srv.titleEn : srv.titleFr}
                            </h3>
                          </ParallaxHorizontalTitle>

                          <p className="text-sm sm:text-base text-muted leading-relaxed line-clamp-2">
                            {lang === 'en' ? srv.summaryEn : srv.summaryFr}
                          </p>

                          <ServiceOfferingTicker service={srv} lang={lang} />

                          <ul className="divide-y divide-hairline border-y border-hairline">
                            {benefits.map((b, i) => (
                              <li key={i} className="py-2 flex items-start gap-2.5 text-xs sm:text-sm text-ink">
                                <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="pt-1 flex flex-wrap items-center gap-4">
                            <Link
                              to={lang === 'en' ? `/en/services/${srv.slug}` : `/services/${srv.slug}`}
                              className="group editorial-link inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-ink py-1"
                            >
                              <span>{p('Découvrir l’offre complète', 'View Full Service')}</span>
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>

                            <MagneticWrapper strength={0.2}>
                              <button
                                type="button"
                                onClick={() => openQuoteModal({ serviceSlug: srv.slug })}
                                className="bg-page border border-hairline hover:border-[#931916] hover:bg-[#931916] hover:text-white px-4 py-2 text-xs font-semibold text-ink rounded-[4px] transition-colors cursor-pointer"
                              >
                                {p('Devis rapide', 'Quick Quote')}
                              </button>
                            </MagneticWrapper>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }}
              />
            </div>
          </section>
        );

      case 'stats':
        return (
          <div key="stats" style={{ zIndex: 30 }} className="relative shadow-[0_-28px_72px_-12px_rgba(17,13,12,0.55)]">
            <ParallaxHorizontalBand
              tone="dark"
              travel={175}
              primaryItems={[
                'AGENCE CONCAM',
                p('CONAKRY · DEPUIS 2010', 'CONAKRY · SINCE 2010'),
                p('CONSEIL 360° & ÉDITION', '360° ADVISORY & PRINT'),
                'RÉUSSITE MAGAZINE',
              ]}
              secondaryItems={[
                p('STRATÉGIE INSTITUTIONNELLE', 'INSTITUTIONAL STRATEGY'),
                p('IMPRESSION OFFSET & GRAND FORMAT', 'OFFSET & WIDE-FORMAT PRESS'),
                p('MANUELS DE PROCÉDURES', 'PROCEDURE MANUALS'),
                p('MARQUAGE DE DIRECTION', 'EXECUTIVE BRANDING'),
              ]}
            />
            <section className="relative bg-[#110D0C] text-white py-20 lg:py-28 border-b border-white/15 overflow-x-clip">
              <ParallaxBackdropPlate variant="dark-grid" offset={118} />
              <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <ParallaxStickySplit
                  stickySide="left"
                  amplitude={46}
                  stickyClassName="lg:col-span-6"
                  scrollingClassName="lg:col-span-6"
                  stickyContent={
                    <div className="space-y-6">
                      <ParallaxHorizontalTitle direction={-1} distance={20}>
                        <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-[#E40014]">
                          {p('Maison fondée en 2010 · République de Guinée', 'Established 2010 · Republic of Guinea')}
                        </p>
                      </ParallaxHorizontalTitle>
                      <SplitTextReveal
                        as="blockquote"
                        text={p(
                          '« L’exigence éditoriale et la rigueur industrielle au service des institutions, des banques et des bâtisseurs en Guinée. »',
                          '“Editorial distinction and industrial precision serving Guinea’s institutions, banks, and industry leaders.”',
                        )}
                        className="font-serif italic text-2xl sm:text-4xl text-white leading-snug"
                      />
                      <EngravedRuleReveal tone="dark" align="left" />
                      <div className="flex items-center gap-6 pt-2">
                        <ParallaxSealDrift size={124} tone="light" offset={48} rotateDeg={58} />
                        <p className="text-xs text-white/75 leading-relaxed max-w-xs">
                          {p(
                            'Un pôle intégré à Kaloum réunissant direction artistique, impression offset et presse économique.',
                            'An integrated Kaloum studio uniting art direction, offset printing and business press.',
                          )}
                        </p>
                      </div>
                    </div>
                  }
                  scrollingContent={
                    <div className="space-y-6">
                      <ParallaxLayer offset={26} scaleRange={[0.96, 1, 1.03]}>
                        <RevealBlock preset="slide-right" className="h-full">
                          <TiltCard3D intensity={5}>
                            <div className="sovereign-plate rounded-[4px] p-7 sm:p-9 space-y-3">
                              <p className="font-serif text-5xl sm:text-6xl font-bold text-[#E40014] tabular-nums">
                                <AnimatedCounter target={settings.stats.yearsExperience} suffix="+" />
                              </p>
                              <p className="text-base font-medium text-white">
                                {p('Années d’expérience à Conakry (depuis 2010)', 'Years of expertise in Conakry (since 2010)')}
                              </p>
                              <p className="text-xs text-white/65 leading-relaxed">
                                {p(
                                  'Ancrage continu au cœur de Kaloum auprès des décideurs guinéens.',
                                  'Continuous anchorage in Kaloum serving Guinean decision-makers.',
                                )}
                              </p>
                            </div>
                          </TiltCard3D>
                        </RevealBlock>
                      </ParallaxLayer>

                      <ParallaxLayer offset={38} scaleRange={[0.96, 1, 1.03]}>
                        <RevealBlock preset="slide-left" delay={0.08} className="h-full">
                          <TiltCard3D intensity={5}>
                            <div className="sovereign-plate rounded-[4px] p-7 sm:p-9 space-y-3">
                              <p className="font-serif text-5xl sm:text-6xl font-bold text-white tabular-nums">
                                <AnimatedCounter target={settings.stats.projectsCompleted} suffix="+" />
                              </p>
                              <p className="text-base font-medium text-white">
                                {p('Campagnes, éditions et tirages livrés', 'Campaigns, publications and print runs delivered')}
                              </p>
                              <p className="text-xs text-white/65 leading-relaxed">
                                {p(
                                  'Contrôle chromatique prépresse et respect rigoureux des délais contractuels.',
                                  'Pre-press color calibration and strict adherence to delivery deadlines.',
                                )}
                              </p>
                            </div>
                          </TiltCard3D>
                        </RevealBlock>
                      </ParallaxLayer>

                      <ParallaxLayer offset={50} scaleRange={[0.96, 1, 1.03]}>
                        <RevealBlock preset="slide-right" delay={0.14} className="h-full">
                          <TiltCard3D intensity={5}>
                            <div className="sovereign-plate rounded-[4px] p-7 sm:p-9 space-y-3">
                              <p className="font-serif text-5xl sm:text-6xl font-bold text-[#E40014] tabular-nums">
                                <AnimatedCounter target={settings.stats.clientsSupported} suffix="+" />
                              </p>
                              <p className="text-base font-medium text-white">
                                {p('Entreprises, banques et institutions accompagnées', 'Corporates, banks and institutions advised')}
                              </p>
                              <p className="text-xs text-white/65 leading-relaxed">
                                {p(
                                  'Banques de premier rang, ministères, assurances et groupes industriels.',
                                  'Leading commercial banks, ministries, insurers and industrial groups.',
                                )}
                              </p>
                            </div>
                          </TiltCard3D>
                        </RevealBlock>
                      </ParallaxLayer>
                    </div>
                  }
                />
              </div>
            </section>
          </div>
        );

      case 'media_hub': {
        if (!mediaHub.reussiteMagazineEnabled && !mediaHub.mediaInfoProEnabled) return null;
        const tickerHeadlines =
          headlines.length > 0 ? [...headlines, ...headlines, ...headlines] : [];
        return (
          <ParallaxCurtainSection key="media_hub" zIndex={35} topAccent>
            <section className="relative pt-20 lg:pt-28 bg-limestone text-ink border-b border-hairline overflow-x-clip">
              <ParallaxBackdropPlate variant="editorial-lines" offset={108} />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2.5">
                  <ParallaxHorizontalTitle direction={-1} distance={22}>
                    <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                      {p('Écosystème éditorial du groupe', 'Group Media Ecosystem')}
                    </p>
                  </ParallaxHorizontalTitle>
                  <ParallaxHorizontalTitle direction={1} distance={26}>
                    <SplitTextReveal
                      as="h2"
                      text={p('À la une de nos médias', 'Featured Across Our Media')}
                      className="font-serif text-3xl sm:text-5xl font-bold text-ink tracking-tight"
                    />
                  </ParallaxHorizontalTitle>
                </div>

                <div className="flex items-center gap-4">
                  {mediaHub.headlinesFeedEnabled && headlines.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-semibold tabular-nums text-muted mr-1">
                        0{carouselIdx + 1} / 0{headlines.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCarouselIdx((i) => (i - 1 + headlines.length) % headlines.length)}
                        aria-label={p('Dépêche précédente', 'Previous headline')}
                        className="bg-surface border border-hairline p-2.5 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCarouselIdx((i) => (i + 1) % headlines.length)}
                        aria-label={p('Dépêche suivante', 'Next headline')}
                        className="bg-surface border border-hairline p-2.5 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <Link
                    to={p('/presse-edition', '/en/press-publishing')}
                    className="editorial-link text-sm font-semibold text-accent hover:text-ink whitespace-nowrap"
                  >
                    {p('Pôle Presse & Édition', 'Press & Publishing')}
                  </Link>
                </div>
              </div>

              {/* Sliding Broadsheet Editorial Carousel with 3D Scroll Depth */}
              {mediaHub.headlinesFeedEnabled && headlines.length > 0 && (
                <ParallaxScroll3DPlate direction={-1} tiltX={6} tiltY={5} liftY={40}>
                  <div
                    className="relative overflow-hidden rounded-[4px]"
                    onMouseEnter={() => setCarouselPaused(true)}
                    onMouseLeave={() => setCarouselPaused(false)}
                  >
                  <motion.div
                    animate={{ x: `-${carouselIdx * 100}%` }}
                    transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
                    className="flex"
                  >
                    {headlines.map((h, i) => (
                      <div key={h.id} className="w-full shrink-0">
                        <div className="archival-plate rounded-[4px] p-7 sm:p-11 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                          <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center gap-3 text-xs tabular-nums text-muted">
                              <span className="font-bold uppercase tracking-wider text-accent">
                                {h.sourceName}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{h.date}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-serif font-semibold">0{i + 1}</span>
                            </div>
                            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-snug">
                              {lang === 'en' ? h.titleEn : h.titleFr}
                            </h3>
                            <p className="text-sm text-muted">
                              {p(
                                `Dossier publié sur ${h.sourceName} · Écosystème éditorial du groupe CONCAM`,
                                `Featured on ${h.sourceName} · CONCAM Group Editorial Network`,
                              )}
                            </p>
                          </div>
                          <div className="lg:col-span-4 flex lg:justify-end">
                            <MagneticWrapper strength={0.2}>
                              <a
                                href={h.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackEvent('media_outbound', h.sourceName)}
                                className="magnetic-sheen group inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] transition-colors whitespace-nowrap"
                              >
                                <span>{p('Lire l’article complet', 'Read Full Dispatch')}</span>
                                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </a>
                            </MagneticWrapper>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>

                  {headlines.length > 1 && (
                    <div className="flex items-center gap-2.5 mt-4">
                      {headlines.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCarouselIdx(idx)}
                          aria-label={`Headline ${idx + 1}`}
                          className="py-1.5 cursor-pointer"
                        >
                          <span className="block w-10 h-[2px] bg-hairline overflow-hidden relative">
                            {carouselIdx === idx && (
                              <motion.span
                                key={`bar-${idx}-${carouselPaused ? 'p' : 'r'}`}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: carouselPaused ? 0 : 4.8, ease: 'linear' }}
                                style={{ transformOrigin: '0% 50%' }}
                                className="absolute inset-0 bg-[#931916]"
                              />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  </div>
                </ParallaxScroll3DPlate>
              )}

              {/* Split 3D Archival Media Gateways */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {mediaHub.reussiteMagazineEnabled && (
                  <ParallaxColumnStagger index={0} columns={2} amplitude={44}>
                    <RevealBlock preset="slide-left" className="h-full">
                      <TiltCard3D intensity={4}>
                        <a
                          href={mediaHub.reussiteMagazineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackEvent('media_outbound', 'reussitemagazine.info')}
                          className="archival-plate group hover:border-[#931916] rounded-[4px] overflow-hidden flex flex-col justify-between h-full transition-colors"
                        >
                          <div className="relative aspect-[16/9] bg-[#110D0C] overflow-hidden border-b border-hairline">
                            <ParallaxImageFrame shiftPct={8}>
                              <img
                                src={LUXURY_HEADER_IMAGES.mediaReussite}
                                alt={p('Réussite Magazine — Presse économique en Guinée', 'Réussite Magazine — Business Press in Guinea')}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                               loading="lazy" decoding="async" />
                            </ParallaxImageFrame>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/70 via-transparent to-transparent pointer-events-none" />
                          </div>
                          <div className="p-7 flex items-start justify-between gap-5 flex-1">
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2.5 text-accent">
                                <Newspaper className="w-5 h-5" aria-hidden="true" />
                                <span className="font-serif text-2xl font-bold text-ink group-hover:text-accent transition-colors">
                                  Réussite Magazine
                                </span>
                              </div>
                              <p className="text-sm text-muted leading-relaxed">
                                {lang === 'en' ? mediaHub.reussiteMagazineDescEn : mediaHub.reussiteMagazineDescFr}
                              </p>
                              <p className="text-xs font-medium text-accent pt-1">{mediaHub.reussiteMagazineUrl}</p>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-accent shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                          </div>
                        </a>
                      </TiltCard3D>
                    </RevealBlock>
                  </ParallaxColumnStagger>
                )}

                {mediaHub.mediaInfoProEnabled && (
                  <ParallaxColumnStagger index={1} columns={2} amplitude={44}>
                    <RevealBlock preset="slide-right" delay={0.08} className="h-full">
                      <TiltCard3D intensity={4}>
                        <a
                          href={mediaHub.mediaInfoProUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackEvent('media_outbound', 'mediainfopro.net')}
                          className="archival-plate group hover:border-[#931916] rounded-[4px] overflow-hidden flex flex-col justify-between h-full transition-colors"
                        >
                          <div className="relative aspect-[16/9] bg-[#110D0C] overflow-hidden border-b border-hairline">
                            <ParallaxImageFrame shiftPct={8}>
                              <img
                                src={LUXURY_HEADER_IMAGES.mediaInfopro}
                                alt={p('MediaInfoPro — Fil d’information économique et presse', 'MediaInfoPro — Business Press & News Wire')}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                               loading="lazy" decoding="async" />
                            </ParallaxImageFrame>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/70 via-transparent to-transparent pointer-events-none" />
                          </div>
                          <div className="p-7 flex items-start justify-between gap-5 flex-1">
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2.5 text-accent">
                                <Newspaper className="w-5 h-5" aria-hidden="true" />
                                <span className="font-serif text-2xl font-bold text-ink group-hover:text-accent transition-colors">
                                  MediaInfoPro
                                </span>
                              </div>
                              <p className="text-sm text-muted leading-relaxed">
                                {lang === 'en' ? mediaHub.mediaInfoProDescEn : mediaHub.mediaInfoProDescFr}
                              </p>
                              <p className="text-xs font-medium text-accent pt-1">{mediaHub.mediaInfoProUrl}</p>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-accent shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                          </div>
                        </a>
                      </TiltCard3D>
                    </RevealBlock>
                  </ParallaxColumnStagger>
                )}
              </div>
            </div>

            {/* Strictly Single-Line Sovereign Dark News Wire Ticker */}
            {tickerHeadlines.length > 0 && (
              <div className="mt-14 py-4 bg-[#110D0C] text-white border-t border-white/15 overflow-hidden relative">
                <div className="animate-concam-marquee-reverse gap-10 px-6">
                  {tickerHeadlines.map((item, idx) => (
                    <a
                      key={`tk-${item.id}-${idx}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-4 text-xs text-white/80 hover:text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <span className="font-semibold uppercase tracking-wider text-[#E40014]">
                        {item.sourceName}
                      </span>
                      <span>{lang === 'en' ? item.titleEn : item.titleFr}</span>
                      <span className="text-[#E40014]" aria-hidden="true">
                        ◆
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            </section>
          </ParallaxCurtainSection>
        );
      }

      case 'gallery':
        return (
          <div key="gallery" style={{ zIndex: 40 }} className="relative shadow-[0_-28px_72px_-12px_rgba(17,13,12,0.45)] border-t-2 border-[#931916]">
            <ParallaxHorizontalBand
              tone="light"
              travel={175}
              primaryItems={[
                p('RÉALISATIONS & PLANCHES', 'SELECTED CASE STUDIES'),
                p('BANQUES · MINISTÈRES · INDUSTRIE', 'BANKS · MINISTRIES · INDUSTRY'),
                p('QUALITÉ PRÉPRESSE CONAKRY', 'PRE-PRESS PRECISION CONAKRY'),
              ]}
            />
            <section className="py-24 lg:py-28 bg-page text-ink relative overflow-x-clip">
              <ParallaxBackdropPlate variant="light-grid" offset={115} />
              <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-14">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8">
                  <div className="space-y-2.5">
                    <ParallaxHorizontalTitle direction={-1} distance={22}>
                      <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                        {p('Preuves par l’exemple', 'Selected Portfolio')}
                      </p>
                    </ParallaxHorizontalTitle>
                    <ParallaxHorizontalTitle direction={1} distance={28}>
                      <SplitTextReveal
                        as="h2"
                        text={p('Réalisations récentes', 'Featured Case Studies')}
                        className="font-serif text-3xl sm:text-5xl font-bold text-ink tracking-tight"
                      />
                    </ParallaxHorizontalTitle>
                  </div>
                  <MagneticWrapper strength={0.18}>
                    <Link
                      to={p('/galerie', '/en/gallery')}
                      className="group editorial-link inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-ink whitespace-nowrap"
                    >
                      <span>{p('Voir toute la galerie', 'View Full Portfolio')}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </MagneticWrapper>
                </div>

                <EngravedRuleReveal tone="light" align="left" />

                {/* Interactive Auto-Sliding Case Study Carousel with 3D Scroll Depth */}
                {activeGal && (
                  <ParallaxScroll3DPlate direction={1} tiltX={7} tiltY={5} liftY={44}>
                    <div
                      onMouseEnter={() => setGalPaused(true)}
                      onMouseLeave={() => setGalPaused(false)}
                    >
                    <div className="archival-plate rounded-[4px] overflow-hidden relative">
                      <AnimatePresence mode="wait" custom={galDir}>
                        <motion.div
                          key={activeGal.id}
                          custom={galDir}
                          initial={{ opacity: 0, x: galDir > 0 ? 50 : -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: galDir > 0 ? -50 : 50 }}
                          transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                          className="grid grid-cols-1 lg:grid-cols-12 items-stretch"
                        >
                          <div className="lg:col-span-6 p-7 sm:p-10 flex flex-col justify-between gap-6 order-2 lg:order-1">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-accent tabular-nums">
                                  {activeGal.clientOrSector} · {activeGal.year}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGalDir(-1);
                                      setGalSlideIdx((i) => (i - 1 + featuredGallery.length) % featuredGallery.length);
                                    }}
                                    aria-label={p('Projet précédent', 'Previous case study')}
                                    className="bg-page border border-hairline p-2 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGalDir(1);
                                      setGalSlideIdx((i) => (i + 1) % featuredGallery.length);
                                    }}
                                    aria-label={p('Projet suivant', 'Next case study')}
                                    className="bg-page border border-hairline p-2 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-snug">
                                {lang === 'en' ? activeGal.titleEn : activeGal.titleFr}
                              </h3>
                              <p className="text-sm text-muted leading-relaxed">
                                <strong className="text-ink">{p('Enjeu :', 'Challenge:')} </strong>
                                {lang === 'en' ? activeGal.needEn : activeGal.needFr}
                              </p>
                              <p className="text-sm text-muted leading-relaxed">
                                <strong className="text-accent">{p('Déploiement :', 'Solution:')} </strong>
                                {lang === 'en' ? activeGal.solutionEn : activeGal.solutionFr}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-hairline">
                              <Link
                                to={`${p('/galerie', '/en/gallery')}?item=${activeGal.id}`}
                                className="editorial-link inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-ink"
                              >
                                <span>{p('Ouvrir la fiche projet', 'Inspect Case Study')}</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                              <span className="text-xs font-serif font-semibold tabular-nums text-muted">
                                Planche 0{galSlideIdx + 1} / 0{featuredGallery.length}
                              </span>
                            </div>
                          </div>

                          <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto lg:min-h-[320px] bg-limestone overflow-hidden order-1 lg:order-2">
                            <ParallaxImageFrame shiftPct={6.5}>
                              <motion.img
                                key={activeGal.images[0]}
                                initial={{ scale: 1.08 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                                src={activeGal.images[0]}
                                alt={lang === 'en' ? activeGal.titleEn : activeGal.titleFr}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </ParallaxImageFrame>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      <div className="h-[2px] w-full bg-limestone relative overflow-hidden">
                        <motion.div
                          key={`gal-prog-${galSlideIdx}-${galPaused ? 'p' : 'r'}`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: galPaused ? 0 : 5, ease: 'linear' }}
                          style={{ transformOrigin: '0% 50%' }}
                          className="absolute inset-0 bg-[#931916]"
                        />
                      </div>
                    </div>
                    </div>
                  </ParallaxScroll3DPlate>
                )}

                {/* Sticky Curatorial Anchor + Parallax Bento Showcase */}
                <ParallaxStickySplit
                  stickySide="left"
                  amplitude={42}
                  stickyClassName="lg:col-span-4"
                  scrollingClassName="lg:col-span-8"
                  stickyContent={
                    <div className="archival-plate rounded-[4px] p-7 space-y-5">
                      <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                        {p('Archives de production', 'Production Archive')}
                      </p>
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight">
                        {p(
                          'Chaque planche illustre un déploiement sur mesure à Conakry.',
                          'Each plate highlights a tailored deployment delivered in Conakry.',
                        )}
                      </h3>
                      <p className="text-sm text-muted leading-relaxed">
                        {p(
                          'De la conception éditoriale de manuels techniques au marquage événementiel et à l’impression grand format, parcourez nos dossiers sélectionnés.',
                          'From technical manual publishing to executive branding and large-format printing, inspect our selected case studies.',
                        )}
                      </p>
                      <div className="pt-2 flex items-center justify-between gap-4 border-t border-hairline">
                        <Link
                          to={p('/galerie', '/en/gallery')}
                          className="editorial-link text-xs font-semibold text-accent hover:text-ink"
                        >
                          {p('Ouvrir toute la galerie', 'Explore Full Gallery')}
                        </Link>
                        <ParallaxSealDrift size={64} tone="ink" offset={22} rotateDeg={38} />
                      </div>
                    </div>
                  }
                  scrollingContent={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {featuredGallery.map((item, idx) => {
                        const isLead = idx === 0;
                        return (
                          <ParallaxColumnStagger
                            key={item.id}
                            index={idx}
                            columns={2}
                            amplitude={46}
                            className={isLead ? 'md:col-span-2' : ''}
                          >
                            <RevealBlock
                              preset={idx % 2 === 0 ? 'slide-left' : 'slide-right'}
                              delay={idx * 0.06}
                              className="h-full"
                            >
                              <TiltCard3D intensity={4.5}>
                                <Link
                                  to={`${p('/galerie', '/en/gallery')}?item=${item.id}`}
                                  className={`group relative block border border-hairline hover:border-[#931916] rounded-[4px] overflow-hidden bg-[#181413] h-full transition-colors ${
                                    isLead ? 'min-h-[360px] lg:min-h-[430px]' : 'min-h-[260px]'
                                  }`}
                                >
                                  <ParallaxImageFrame shiftPct={7.5}>
                                    <ClipCurtainReveal direction="up" delay={idx * 0.05} className="w-full h-full">
                                      <img
                                        src={item.images[0]}
                                        alt={lang === 'en' ? item.titleEn : item.titleFr}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                                       loading="lazy" decoding="async" />
                                    </ClipCurtainReveal>
                                  </ParallaxImageFrame>
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/92 via-[#110D0C]/35 to-transparent pointer-events-none" />
                                  <div className="absolute bottom-0 inset-x-0 p-6 sm:p-7 space-y-2 text-white">
                                    <div className="flex items-center gap-2.5 text-xs tabular-nums text-white/85 font-medium">
                                      <span className="text-[#E40014] font-semibold">Planche 0{idx + 1}</span>
                                      <span aria-hidden="true">·</span>
                                      <span>{item.clientOrSector}</span>
                                      <span aria-hidden="true">·</span>
                                      <span>{item.year}</span>
                                    </div>
                                    <h3
                                      className={`font-serif font-bold text-white group-hover:text-[#E40014] transition-colors leading-snug ${
                                        isLead ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                                      }`}
                                    >
                                      {lang === 'en' ? item.titleEn : item.titleFr}
                                    </h3>
                                    {isLead && (
                                      <p className="text-sm text-[#D6CEC2] line-clamp-2 max-w-xl">
                                        {lang === 'en' ? item.solutionEn : item.solutionFr}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              </TiltCard3D>
                            </RevealBlock>
                          </ParallaxColumnStagger>
                        );
                      })}
                    </div>
                  }
                />
              </div>
            </section>
          </div>
        );

      case 'contact_banner':
        return (
          <ParallaxCurtainSection key="contact_banner" zIndex={45} topAccent>
            <section className="bg-[#181312] text-white border-t border-white/15 py-20 lg:py-24 relative overflow-x-clip">
              <ParallaxBackdropPlate variant="crimson-bands" offset={115} />
              <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <ParallaxScroll3DPlate direction={-1} tiltX={6} tiltY={4} liftY={42}>
                  <RevealBlock preset="zoom-soft">
                  <div className="sovereign-plate rounded-[4px] p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
                    <div className="lg:col-span-7 space-y-4 relative z-10">
                      <ParallaxHorizontalTitle direction={-1} distance={20}>
                        <p className="text-xs font-sans font-semibold uppercase tracking-[0.18em] text-[#E40014]">
                          {p('Atelier Kaloum · Engagement 24h', 'Kaloum Studio · 24h Response')}
                        </p>
                      </ParallaxHorizontalTitle>
                      <ParallaxHorizontalTitle direction={1} distance={26}>
                        <SplitTextReveal
                          as="h2"
                          text={p(
                            'Prêt à lancer votre prochain projet à Conakry ?',
                            'Ready to launch your next project in Conakry?',
                          )}
                          className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight"
                        />
                      </ParallaxHorizontalTitle>
                      <p className="text-sm sm:text-base text-white/75 max-w-xl leading-relaxed">
                        {p(
                          'Recevez une proposition graduée sous 24 heures ouvrées ou échangez directement avec notre direction à Manquepas.',
                          'Receive a tiered proposal within 24 business hours or speak directly with our Manquepas leadership team.',
                        )}
                      </p>
                    </div>

                    <div className="lg:col-span-5 flex flex-wrap lg:justify-end items-center gap-3 relative z-10">
                      <MagneticWrapper strength={0.2}>
                        <button
                          type="button"
                          onClick={() => openQuoteModal()}
                          className="magnetic-sheen px-6 py-3.5 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] transition-colors cursor-pointer whitespace-nowrap shadow-[0_12px_28px_-10px_rgba(147,25,22,0.75)]"
                        >
                          {p('Formulaire express', 'Express Quote')}
                        </button>
                      </MagneticWrapper>

                      <MagneticWrapper strength={0.16}>
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackEvent('whatsapp_click', 'home_banner')}
                          className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold bg-[#25D366] hover:brightness-95 text-[#110D0C] rounded-[4px] transition-[filter] whitespace-nowrap"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </a>
                      </MagneticWrapper>

                      <a
                        href={`tel:${settings.phones[0]?.replace(/\s+/g, '')}`}
                        className="sovereign-plate-subtle inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium hover:border-[#931916] text-white rounded-[4px] tabular-nums transition-colors whitespace-nowrap"
                      >
                        <Phone className="w-4 h-4 text-[#E40014]" />
                        <span>{settings.phones[0]}</span>
                      </a>
                    </div>
                  </div>
                </RevealBlock>
                </ParallaxScroll3DPlate>
              </div>
            </section>
          </ParallaxCurtainSection>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SeoHead routeKey="home" />
      {blocks.map((blk) => {
        // The hero header carries its own entrance choreography; every other
        // block honours the per-block animation preset configured in the CMS
        // (fade-up / slide-left / slide-right / zoom-soft / none).
        if (blk.key === 'hero' || blk.animation === 'none') {
          return <div key={blk.key}>{renderBlock(blk.key, blk.animation)}</div>;
        }
        return (
          <RevealBlock key={blk.key} preset={blk.animation}>
            {renderBlock(blk.key, blk.animation)}
          </RevealBlock>
        );
      })}
    </>
  );
}
