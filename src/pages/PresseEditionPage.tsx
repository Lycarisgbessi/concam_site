import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Newspaper, Radio, BookOpen } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import {
  EngravedRuleReveal,
  MagneticWrapper,
  ParallaxBackdropPlate,
  ParallaxColumnStagger,
  ParallaxCurtainSection,
  ParallaxHorizontalBand,
  ParallaxHorizontalTitle,
  ParallaxImageFrame,
  ParallaxScroll3DPlate,
  ParallaxSealDrift,
  RevealBlock,
  SplitTextReveal,
  TiltCard3D,
} from '../components/MotionPrimitives';
import { AnimatedPageHeader, LUXURY_HEADER_IMAGES } from '../components/AnimatedPageHeader';
import type { MediaHeadline } from '../types/concam';

export function PresseEditionPage() {
  const { data, lang, trackEvent } = useSite();
  const [headlines, setHeadlines] = useState<MediaHeadline[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [paused, setPaused] = useState(false);
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
    if (paused || headlines.length <= 1) return;
    const id = window.setInterval(() => {
      setCarouselIdx((i) => (i + 1) % headlines.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, [paused, headlines.length]);

  if (!data) return null;
  const { mediaHub, pageContent, settings } = data;

  const defaultSlides = [
    {
      imageUrl: LUXURY_HEADER_IMAGES.presseSummit,
      captionFr: 'Couverture des sommets économiques et tribunes d’entrepreneurs en Guinée',
      captionEn: 'Coverage of economic summits and executive forums in Guinea',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.presseMagazine,
      captionFr: 'Réussite Magazine — Rédaction, maquette et édition trimestrielle depuis 2016',
      captionEn: 'Réussite Magazine — Editorial desk, layout and quarterly publishing since 2016',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.presseNewsroom,
      captionFr: 'MediaInfoPro — Fil d’information économique continue à Conakry',
      captionEn: 'MediaInfoPro — Continuous business news wire in Conakry',
    },
  ];
  const headerSlides =
    pageContent.pageHeaders?.presse && pageContent.pageHeaders.presse.length > 0
      ? pageContent.pageHeaders.presse
      : defaultSlides;

  const tickerHeadlines = headlines.length > 0 ? [...headlines, ...headlines, ...headlines] : [];

  return (
    <>
      <SeoHead routeKey="presse-edition" />

      <AnimatedPageHeader
        compact
        slides={headerSlides}
        breadcrumbs={[{ label: p('Presse & édition', 'Press & Publishing') }]}
        kicker={p('Branche média du groupe CONCAM', 'CONCAM Group Media Division')}
        title={p('Presse économique & information continue', 'Business Press & Digital Information')}
        subtitle={lang === 'en' ? pageContent.presseIntroEn : pageContent.presseIntroFr}
      />

      <ParallaxCurtainSection zIndex={20} topAccent>
        <section className="relative py-20 lg:py-24 bg-page text-ink border-b border-hairline overflow-x-clip">
          <ParallaxBackdropPlate variant="light-grid" offset={112} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mediaHub.reussiteMagazineEnabled && (
              <ParallaxColumnStagger index={0} columns={2} amplitude={48}>
                <RevealBlock preset="slide-left" className="h-full">
                  <TiltCard3D intensity={4.5}>
                    <article className="archival-plate hover:border-[#931916] rounded-[4px] overflow-hidden flex flex-col justify-between h-full transition-colors">
                      <div className="relative aspect-[16/9] bg-[#110D0C] overflow-hidden border-b border-hairline">
                        <ParallaxImageFrame shiftPct={8}>
                          <img
                            src={LUXURY_HEADER_IMAGES.mediaReussite}
                            alt={p('Réussite Magazine — Édition presse économique en Guinée', 'Réussite Magazine — Guinean business press publishing')}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                           loading="lazy" decoding="async" />
                        </ParallaxImageFrame>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/70 via-transparent to-transparent pointer-events-none" />
                      </div>
                      <div className="p-8 sm:p-9 flex flex-col justify-between space-y-6 flex-1">
                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-[4px] bg-[#931916] text-white flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <ParallaxHorizontalTitle direction={-1} distance={20}>
                            <h2 className="font-serif text-3xl font-bold text-ink">Réussite Magazine</h2>
                          </ParallaxHorizontalTitle>
                          <p className="text-sm sm:text-base text-muted leading-relaxed">
                            {lang === 'en' ? mediaHub.reussiteMagazineDescEn : mediaHub.reussiteMagazineDescFr}
                          </p>
                          <p className="text-xs font-medium text-accent pt-3 border-t border-hairline">
                            {p(
                              `Lancé en octobre 2016 à Conakry · Contact rédaction : ${settings.magazineEmail}`,
                              `Launched October 2016 in Conakry · Editorial desk: ${settings.magazineEmail}`,
                            )}
                          </p>
                        </div>
                        <MagneticWrapper strength={0.2}>
                          <a
                            href={mediaHub.reussiteMagazineUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('media_outbound', 'presse_reussite')}
                            className="magnetic-sheen group inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] w-fit transition-colors"
                          >
                            <span>{p('Accéder à reussitemagazine.info', 'Visit reussitemagazine.info')}</span>
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </a>
                        </MagneticWrapper>
                      </div>
                    </article>
                  </TiltCard3D>
                </RevealBlock>
              </ParallaxColumnStagger>
            )}

            {mediaHub.mediaInfoProEnabled && (
              <ParallaxColumnStagger index={1} columns={2} amplitude={48}>
                <RevealBlock preset="slide-right" delay={0.08} className="h-full">
                  <TiltCard3D intensity={4.5}>
                    <article className="archival-plate hover:border-[#931916] rounded-[4px] overflow-hidden flex flex-col justify-between h-full transition-colors">
                      <div className="relative aspect-[16/9] bg-[#110D0C] overflow-hidden border-b border-hairline">
                        <ParallaxImageFrame shiftPct={8}>
                          <img
                            src={LUXURY_HEADER_IMAGES.mediaInfopro}
                            alt={p('MediaInfoPro — Presse rotative et information économique', 'MediaInfoPro — Commercial press and business news wire')}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                           loading="lazy" decoding="async" />
                        </ParallaxImageFrame>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/70 via-transparent to-transparent pointer-events-none" />
                      </div>
                      <div className="p-8 sm:p-9 flex flex-col justify-between space-y-6 flex-1">
                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-[4px] bg-[#110D0C] border border-[#931916] text-white flex items-center justify-center">
                            <Radio className="w-5 h-5" />
                          </div>
                          <ParallaxHorizontalTitle direction={1} distance={20}>
                            <h2 className="font-serif text-3xl font-bold text-ink">MediaInfoPro</h2>
                          </ParallaxHorizontalTitle>
                          <p className="text-sm sm:text-base text-muted leading-relaxed">
                            {lang === 'en' ? mediaHub.mediaInfoProDescEn : mediaHub.mediaInfoProDescFr}
                          </p>
                          <p className="text-xs font-medium text-accent pt-3 border-t border-hairline">
                            {mediaHub.mediaInfoProUrl}
                          </p>
                        </div>
                        <MagneticWrapper strength={0.2}>
                          <a
                            href={mediaHub.mediaInfoProUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('media_outbound', 'presse_mediainfopro')}
                            className="magnetic-sheen group inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold bg-[#110D0C] hover:bg-[#931916] border border-[#110D0C] text-white rounded-[4px] w-fit transition-colors"
                          >
                            <span>{p('Ouvrir MediaInfoPro', 'Open MediaInfoPro')}</span>
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </a>
                        </MagneticWrapper>
                      </div>
                    </article>
                  </TiltCard3D>
                </RevealBlock>
              </ParallaxColumnStagger>
            )}
          </div>
        </div>
        </section>
      </ParallaxCurtainSection>

      <ParallaxHorizontalBand
        tone="light"
        travel={140}
        primaryItems={[
          'RÉUSSITE MAGAZINE',
          'MEDIAINFOPRO',
          p('PRESSE ÉCONOMIQUE GUINÉENNE', 'GUINEAN BUSINESS PRESS'),
        ]}
        secondaryItems={[
          p('PORTRAITS D’ENTREPRENEURS', 'EXECUTIVE PROFILES'),
          p('DÉPÊCHES CONTINUES', 'NEWS WIRE'),
          'CONAKRY · KALOUM',
        ]}
      />

      {mediaHub.headlinesFeedEnabled && headlines.length > 0 && (
        <ParallaxCurtainSection zIndex={30} topAccent>
          <section
            className="relative pt-20 bg-[#110D0C] text-[#F6F2EA] overflow-x-clip"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <ParallaxBackdropPlate variant="dark-grid" offset={115} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 pb-16 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <ParallaxHorizontalTitle direction={1} distance={24}>
                <div className="flex items-center gap-2.5 text-[#E40014]">
                  <Newspaper className="w-5 h-5" />
                  <SplitTextReveal
                    as="h2"
                    text={p('Dernières dépêches & dossiers', 'Latest Stories & Briefings')}
                    className="font-serif text-3xl font-bold text-white"
                  />
                </div>
              </ParallaxHorizontalTitle>

              <div className="flex items-center gap-4">
                <ParallaxSealDrift size={64} tone="light" offset={32} rotateDeg={52} className="hidden md:inline-flex" />
                {headlines.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-serif font-semibold tabular-nums text-[#E40014] mr-1">
                      0{carouselIdx + 1} / 0{headlines.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCarouselIdx((i) => (i - 1 + headlines.length) % headlines.length)}
                      aria-label={p('Dépêche précédente', 'Previous')}
                      className="sovereign-plate-subtle p-2.5 rounded-[4px] text-white hover:border-[#931916] cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCarouselIdx((i) => (i + 1) % headlines.length)}
                      aria-label={p('Dépêche suivante', 'Next')}
                      className="sovereign-plate-subtle p-2.5 rounded-[4px] text-white hover:border-[#931916] cursor-pointer transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <EngravedRuleReveal tone="dark" align="left" />

            <ParallaxScroll3DPlate direction={1} tiltX={7} tiltY={5} liftY={42}>
              <div className="overflow-hidden rounded-[4px]">
                <motion.div
                  animate={{ x: `-${carouselIdx * 100}%` }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className="flex"
                >
                  {headlines.map((item) => (
                    <div key={item.id} className="w-full shrink-0">
                      <div className="sovereign-plate rounded-[4px] p-7 sm:p-11 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-3 max-w-2xl">
                          <div className="text-xs text-white/70 flex items-center gap-2 tabular-nums">
                            <span className="font-semibold text-[#E40014] uppercase tracking-wider">{item.sourceName}</span>
                            <span>·</span>
                            <span>{item.date}</span>
                          </div>
                          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                            {lang === 'en' ? item.titleEn : item.titleFr}
                          </h3>
                          <p className="text-sm text-white/75 leading-relaxed">
                            {p(
                              `Publication officielle sur ${item.sourceName} — Écosystème média CONCAM`,
                              `Official publication on ${item.sourceName} — CONCAM Media Network`,
                            )}
                          </p>
                        </div>
                        <MagneticWrapper strength={0.2}>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('media_outbound', item.sourceName)}
                            className="magnetic-sheen group inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] transition-colors shrink-0"
                          >
                            <span>{p('Lire l’article complet', 'Read full story')}</span>
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </a>
                        </MagneticWrapper>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </ParallaxScroll3DPlate>
          </div>

          {tickerHeadlines.length > 0 && (
            <div className="py-4 bg-[#1A1312] border-t border-white/15 overflow-hidden relative">
              <div className="animate-concam-marquee-reverse gap-10 px-6">
                {tickerHeadlines.map((item, idx) => (
                  <a
                    key={`tkp-${item.id}-${idx}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-4 text-xs text-white/80 hover:text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    <span className="font-semibold uppercase tracking-wider text-[#E40014]">{item.sourceName}</span>
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
      )}
    </>
  );
}
