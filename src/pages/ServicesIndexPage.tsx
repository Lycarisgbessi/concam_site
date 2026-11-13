import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Newspaper, FileDown } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import {
  EngravedRuleReveal,
  MagneticWrapper,
  ParallaxBackdropPlate,
  ParallaxCurtainSection,
  ParallaxHorizontalBand,
  ParallaxHorizontalTitle,
  ParallaxImageFrame,
  ParallaxScroll3DPlate,
  ParallaxStackDeck,
  RevealBlock,
  TiltCard3D,
} from '../components/MotionPrimitives';
import { AnimatedPageHeader, LUXURY_HEADER_IMAGES } from '../components/AnimatedPageHeader';

const ROMAN = ['I', 'II', 'III', 'IV'];

export function ServicesIndexPage() {
  const { data, lang, openQuoteModal } = useSite();
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);
  const servicesCount = data?.services.length || 0;

  useEffect(() => {
    if (paused || servicesCount <= 1) return;
    const id = window.setInterval(() => {
      setSlideDir(1);
      setSlideIdx((prev) => (prev + 1) % servicesCount);
    }, 4500);
    return () => window.clearInterval(id);
  }, [paused, servicesCount]);

  if (!data) return null;

  const defaultSlides = [
    {
      imageUrl: LUXURY_HEADER_IMAGES.servicesAtelier,
      captionFr: 'Studio de conception éditoriale et préparation de supports institutionnels',
      captionEn: 'Editorial design studio and institutional publishing preparation',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.servicesPress,
      captionFr: 'Impression numérique & offset grand volume à Conakry',
      captionEn: 'Commercial digital & offset printing press in Conakry',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.servicesAdvisory,
      captionFr: 'Conseil 360° en image, campagne et relations publiques',
      captionEn: '360° brand strategy, campaign execution and public relations',
    },
  ];
  const headerSlides =
    data.pageContent.pageHeaders?.services && data.pageContent.pageHeaders.services.length > 0
      ? data.pageContent.pageHeaders.services
      : defaultSlides;

  const activeSrv = data.services[slideIdx] || data.services[0];

  return (
    <>
      <SeoHead routeKey="services" />

      <AnimatedPageHeader
        compact
        slides={headerSlides}
        breadcrumbs={[{ label: 'Services' }]}
        kicker={p('Catalogue de services · CONCAM Conakry', 'Service Catalog · CONCAM Conakry')}
        title={p(
          'Quatre pôles d’exécution complémentaires sous un même toit.',
          'Four complementary execution pillars under one roof.',
        )}
        subtitle={p(
          'Chaque service dispose d’une page détaillée présentant les déclinaisons, notre processus en étapes et un formulaire de devis pré-rempli.',
          'Each service includes a dedicated breakdown of offerings, our step-by-step workflow and a pre-filled quote request.',
        )}
      >
        <div className="pt-2">
          <a
            href={`/api/public/brochure.pdf?lang=${lang}`}
            download
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-white/25 bg-[#1A1413] hover:bg-[#931916] hover:border-[#931916] text-white rounded-[4px] transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-[#E40014]" aria-hidden="true" />
            <span>{p('Télécharger le catalogue PDF officiel', 'Download Official PDF Catalogue')}</span>
          </a>
        </div>
      </AnimatedPageHeader>

      <ParallaxCurtainSection zIndex={20} topAccent>
        <ParallaxHorizontalBand
          tone="light"
          travel={175}
          primaryItems={[
            p('CONSEIL 360°', '360° ADVISORY'),
            p('MANUELS & ÉDITION', 'MANUALS & PUBLISHING'),
            p('IMPRESSION OFFSET', 'OFFSET PRINTING'),
            p('MARQUAGE PREMIUM', 'EXECUTIVE BRANDING'),
          ]}
        />
      </ParallaxCurtainSection>

      <section
        style={{ zIndex: 25 }}
        className="py-20 lg:py-24 bg-[#F7F4EF] text-[#181413] relative overflow-x-clip border-t border-[#DDD5C9] shadow-[0_-24px_64px_-14px_rgba(17,13,12,0.38)]"
      >
        <ParallaxBackdropPlate variant="light-grid" offset={115} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-20 relative z-10">
          {/* Interactive Auto-Advancing Services Carousel Deck with 3D Scroll Depth */}
          {activeSrv && (
            <ParallaxScroll3DPlate direction={1} tiltX={7} tiltY={5} liftY={44}>
              <div
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                className="space-y-4"
              >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {data.services.map((s, idx) => {
                    const active = slideIdx === idx;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSlideDir(idx >= slideIdx ? 1 : -1);
                          setSlideIdx(idx);
                        }}
                        className={`relative px-4 py-2 text-xs font-semibold rounded-[4px] border transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'text-white border-[#931916]'
                            : 'bg-white border-[#DDD5C9] text-[#574E4A] hover:text-[#181413] hover:border-[#931916]/50'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="srv-index-carousel-tab"
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
                  <button
                    type="button"
                    onClick={() => {
                      setSlideDir(-1);
                      setSlideIdx((i) => (i - 1 + data.services.length) % data.services.length);
                    }}
                    aria-label={p('Pôle précédent', 'Previous service')}
                    className="bg-white border border-[#DDD5C9] p-2 rounded-[4px] text-[#181413] hover:border-[#931916] hover:text-[#931916] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSlideDir(1);
                      setSlideIdx((i) => (i + 1) % data.services.length);
                    }}
                    aria-label={p('Pôle suivant', 'Next service')}
                    className="bg-white border border-[#DDD5C9] p-2 rounded-[4px] text-[#181413] hover:border-[#931916] hover:text-[#931916] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="archival-plate rounded-[4px] overflow-hidden relative">
                <AnimatePresence mode="wait" custom={slideDir}>
                  <motion.div
                    key={activeSrv.id}
                    custom={slideDir}
                    initial={{ opacity: 0, x: slideDir > 0 ? 48 : -48 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir > 0 ? -48 : 48 }}
                    transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 lg:grid-cols-12 items-stretch"
                  >
                    <div className="lg:col-span-5 aspect-[16/10] lg:aspect-auto lg:min-h-[300px] bg-[#EFEAE1] overflow-hidden">
                      <ParallaxImageFrame shiftPct={6.5}>
                        <img
                          src={activeSrv.imageUrl}
                          alt={lang === 'en' ? activeSrv.titleEn : activeSrv.titleFr}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </ParallaxImageFrame>
                    </div>
                    <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <p className="text-xs font-sans font-semibold uppercase tracking-[0.16em] text-[#931916]">
                          {p('Pôle', 'Pillar')} {ROMAN[slideIdx] || slideIdx + 1} · {lang === 'en' ? activeSrv.taglineEn : activeSrv.taglineFr}
                        </p>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#181413]">
                          {lang === 'en' ? activeSrv.titleEn : activeSrv.titleFr}
                        </h2>
                        <p className="text-sm sm:text-base text-[#574E4A] leading-relaxed">
                          {lang === 'en' ? activeSrv.summaryEn : activeSrv.summaryFr}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <Link
                          to={lang === 'en' ? `/en/services/${activeSrv.slug}` : `/services/${activeSrv.slug}`}
                          className="magnetic-sheen inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] transition-colors"
                        >
                          <span>{p('Voir la fiche complète', 'View Full Service')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openQuoteModal({ serviceSlug: activeSrv.slug })}
                          className="bg-[#EFEAE1] hover:bg-[#DDD5C9] px-4 py-2.5 text-xs font-semibold text-[#181413] border border-[#DDD5C9] rounded-[4px] transition-colors cursor-pointer"
                        >
                          {p('Demander un devis', 'Request Quote')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="h-[2px] w-full bg-[#EFEAE1] relative overflow-hidden">
                  <motion.div
                    key={`srvidx-prog-${slideIdx}-${paused ? 'p' : 'r'}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: paused ? 0 : 4.5, ease: 'linear' }}
                    style={{ transformOrigin: '0% 50%' }}
                    className="absolute inset-0 bg-[#931916]"
                  />
                </div>
              </div>
            </div>
            </ParallaxScroll3DPlate>
          )}

          <EngravedRuleReveal tone="light" align="center" />

          {/* Sticky Layered Stacking Card Deck for the 4 CONCAM Service Pillars */}
          <ParallaxStackDeck
            items={data.services}
            renderItem={(idx) => {
              const srv = data.services[idx];
              const isEven = idx % 2 === 0;
              const benefits = (lang === 'en' ? srv.benefitsEn : srv.benefitsFr).slice(0, 3);
              return (
                <article
                  key={srv.id}
                  className="archival-plate bg-white rounded-[4px] p-6 sm:p-8 lg:p-10 border border-[#DDD5C9] hover:border-[#931916] transition-colors"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                    <div className={`lg:col-span-5 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                      <TiltCard3D intensity={5}>
                        <Link
                          to={lang === 'en' ? `/en/services/${srv.slug}` : `/services/${srv.slug}`}
                          className="group block relative aspect-[16/10] lg:aspect-[4/3] rounded-[4px] overflow-hidden border border-[#DDD5C9] hover:border-[#931916] bg-[#EFEAE1] shadow-[0_18px_38px_-18px_rgba(24,20,19,0.28)] transition-colors"
                        >
                          <ParallaxImageFrame shiftPct={8}>
                            <img
                              src={srv.imageUrl}
                              alt={lang === 'en' ? srv.titleEn : srv.titleFr}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                            />
                          </ParallaxImageFrame>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[#F6F2EA]">
                            <span className="bg-[#110D0C]/90 border border-white/25 px-3 py-1 rounded-[4px] font-serif text-xs uppercase tracking-widest text-white">
                              {p('Pôle', 'Pillar')} {ROMAN[idx] || idx + 1}
                            </span>
                            <span className="bg-[#931916] inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-[4px] group-hover:bg-[#A30013] transition-colors">
                              <span>{p('Détails', 'Inspect')}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </Link>
                      </TiltCard3D>
                    </div>

                    <div className={`lg:col-span-7 space-y-4 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                      <ParallaxHorizontalTitle direction={isEven ? 1 : -1} distance={18}>
                        <div className="flex items-center gap-3 text-xs font-sans font-semibold text-[#931916]">
                          <span className="font-serif text-base">{ROMAN[idx] || idx + 1}.</span>
                          <span className="h-[1px] w-8 bg-[#931916]" aria-hidden="true" />
                          <span className="uppercase tracking-[0.14em] truncate">{lang === 'en' ? srv.taglineEn : srv.taglineFr}</span>
                        </div>
                      </ParallaxHorizontalTitle>

                      <ParallaxHorizontalTitle direction={isEven ? -1 : 1} distance={22}>
                        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#181413] leading-tight">
                          {lang === 'en' ? srv.titleEn : srv.titleFr}
                        </h2>
                      </ParallaxHorizontalTitle>

                      <p className="text-sm sm:text-base text-[#574E4A] leading-relaxed line-clamp-2">
                        {lang === 'en' ? srv.summaryEn : srv.summaryFr}
                      </p>

                      <ul className="divide-y divide-[#DDD5C9] border-y border-[#DDD5C9]">
                        {benefits.map((b, bIdx) => (
                          <li key={bIdx} className="py-2 flex items-start gap-2.5 text-xs sm:text-sm text-[#181413]">
                            <Check className="w-4 h-4 text-[#931916] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2 flex flex-wrap items-center gap-4">
                        <Link
                          to={lang === 'en' ? `/en/services/${srv.slug}` : `/services/${srv.slug}`}
                          className="group editorial-link inline-flex items-center gap-2 text-sm font-semibold text-[#931916] hover:text-[#181413] py-1"
                        >
                          <span>{p('Voir la fiche complète', 'View Full Service')}</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <MagneticWrapper strength={0.2}>
                          <button
                            type="button"
                            onClick={() => openQuoteModal({ serviceSlug: srv.slug })}
                            className="magnetic-sheen px-5 py-2.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {p('Demander un devis', 'Request Quote')}
                          </button>
                        </MagneticWrapper>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }}
          />

          {/* 5th Non-Billable Branch: Presse et édition on Sovereign Plate with 3D Scroll Depth */}
          <ParallaxScroll3DPlate direction={-1} tiltX={7} tiltY={5} liftY={42}>
            <RevealBlock preset="zoom-soft">
              <TiltCard3D intensity={3.5}>
                <div className="sovereign-plate text-[#F6F2EA] rounded-[4px] p-8 sm:p-11 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2.5 max-w-2xl">
                    <div className="flex items-center gap-2 text-[#E40014]">
                      <Newspaper className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                        {p('Branche média du groupe (non facturable)', 'Group Media Division (Non-billable)')}
                      </span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      {p(
                        'Presse et édition : Réussite Magazine & pôle d’information',
                        'Press & Publishing: Réussite Magazine & Media Portal',
                      )}
                    </h2>
                    <p className="text-sm text-white/75 leading-relaxed">
                      {p(
                        'Découvrez l’activité éditoriale du groupe CONCAM lancée à Conakry en 2016 avec Réussite Magazine.',
                        'Discover CONCAM Group’s editorial publishing division launched in Conakry in 2016 with Réussite Magazine.',
                      )}
                    </p>
                  </div>
                  <MagneticWrapper strength={0.2}>
                    <Link
                      to={p('/presse-edition', '/en/press-publishing')}
                      className="magnetic-sheen group inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>{p('Découvrir Presse & Édition', 'Explore Press & Publishing')}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </MagneticWrapper>
                </div>
              </TiltCard3D>
            </RevealBlock>
          </ParallaxScroll3DPlate>
        </div>
      </section>
    </>
  );
}
