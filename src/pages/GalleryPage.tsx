import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ArrowUpRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import {
  ClipCurtainReveal,
  EngravedRuleReveal,
  MagneticWrapper,
  ParallaxBackdropPlate,
  ParallaxColumnStagger,
  ParallaxCurtainSection,
  ParallaxHorizontalBand,
  ParallaxHorizontalTitle,
  ParallaxImageFrame,
  ParallaxScroll3DPlate,
  TiltCard3D,
} from '../components/MotionPrimitives';
import { AnimatedPageHeader, LUXURY_HEADER_IMAGES } from '../components/AnimatedPageHeader';

export function GalleryPage() {
  const { data, lang, openQuoteModal } = useSite();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [reelIdx, setReelIdx] = useState(0);
  const [reelDir, setReelDir] = useState<1 | -1>(1);
  const [reelPaused, setReelPaused] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [lightboxImgIdx, setLightboxImgIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  const items = data?.galleryItems || [];
  const categories = data?.galleryCategories || [];

  const filtered = selectedCat === 'all' ? items : items.filter((it) => it.categorySlug === selectedCat);
  const featuredList = items.filter((it) => it.featured);
  const reelSource = featuredList.length > 0 ? featuredList : items;

  useEffect(() => {
    if (reelPaused || reelSource.length <= 1) return;
    const id = window.setInterval(() => {
      setReelDir(1);
      setReelIdx((prev) => (prev + 1) % reelSource.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, [reelPaused, reelSource.length]);

  useEffect(() => {
    const targetId = searchParams.get('item');
    if (targetId && filtered.length > 0) {
      const idx = filtered.findIndex((i) => i.id === targetId);
      if (idx >= 0) {
        setLightboxIdx(idx);
        setLightboxImgIdx(0);
      }
    }
  }, [searchParams, filtered]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIdx(null);
        setZoomed(false);
        setSearchParams({});
      } else if (e.key === 'ArrowRight') {
        setLightboxIdx((i) => (i === null ? null : (i + 1) % filtered.length));
        setLightboxImgIdx(0);
        setZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
        setLightboxImgIdx(0);
        setZoomed(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, filtered.length, setSearchParams]);

  if (!data) return null;

  const activeItem = lightboxIdx !== null ? filtered[lightboxIdx] : null;

  const defaultSlides = [
    {
      imageUrl: LUXURY_HEADER_IMAGES.galerieShowcase,
      captionFr: 'Marquage premium, objets direction & identité de marque',
      captionEn: 'Executive branding, corporate gifts & brand architecture',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.galerieBinding,
      captionFr: 'Édition technique, manuels de procédures et rapports annuels',
      captionEn: 'Technical publishing, procedure manuals and annual reports',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.galerieSignage,
      captionFr: 'Tirages offset & signalétique institutionnelle en Guinée',
      captionEn: 'Offset printing & institutional signage in Guinea',
    },
  ];
  const headerSlides =
    data.pageContent.pageHeaders?.galerie && data.pageContent.pageHeaders.galerie.length > 0
      ? data.pageContent.pageHeaders.galerie
      : defaultSlides;

  return (
    <>
      <SeoHead routeKey="galerie" />

      <AnimatedPageHeader
        compact
        slides={headerSlides}
        breadcrumbs={[{ label: p('Galerie de réalisations', 'Portfolio Gallery') }]}
        kicker={p('Portfolio institutionnel & marques', 'Institutional & Brand Portfolio')}
        title={p('Galerie de réalisations', 'Selected Projects & Case Studies')}
        subtitle={p(
          'Filtrez nos réalisations par discipline et ouvrez chaque dossier pour consulter le besoin, la solution et les planches.',
          'Filter projects by discipline and open any case study to inspect brief, solution and visuals.',
        )}
      />

      <ParallaxCurtainSection zIndex={20} topAccent>
        <section className="relative py-20 bg-page text-ink overflow-x-clip">
          <ParallaxBackdropPlate variant="light-grid" offset={115} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 relative z-10">
            {/* Auto-Advancing Portfolio Reel Carousel with 3D Scroll Depth */}
            {reelSource[reelIdx] && (
              <ParallaxScroll3DPlate direction={1} tiltX={7} tiltY={5} liftY={44}>
              <div
                onMouseEnter={() => setReelPaused(true)}
                onMouseLeave={() => setReelPaused(false)}
                className="space-y-4"
              >
              <div className="flex items-center justify-between gap-4">
                <ParallaxHorizontalTitle direction={-1} distance={20}>
                  <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-[#931916]">
                    {p('Défilement des projets phares', 'Featured Projects Reel')}
                  </p>
                </ParallaxHorizontalTitle>
                {reelSource.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-serif font-semibold tabular-nums text-muted mr-1">
                      0{reelIdx + 1} / 0{reelSource.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReelDir(-1);
                        setReelIdx((i) => (i - 1 + reelSource.length) % reelSource.length);
                      }}
                      aria-label={p('Projet précédent', 'Previous project')}
                      className="bg-surface border border-hairline p-2 rounded-[4px] text-ink hover:border-[#931916] hover:text-[#931916] transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReelDir(1);
                        setReelIdx((i) => (i + 1) % reelSource.length);
                      }}
                      aria-label={p('Projet suivant', 'Next project')}
                      className="bg-surface border border-hairline p-2 rounded-[4px] text-ink hover:border-[#931916] hover:text-[#931916] transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="archival-plate rounded-[4px] overflow-hidden relative">
                <AnimatePresence mode="wait" custom={reelDir}>
                  <motion.div
                    key={reelSource[reelIdx].id}
                    custom={reelDir}
                    initial={{ opacity: 0, x: reelDir > 0 ? 48 : -48 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: reelDir > 0 ? -48 : 48 }}
                    transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 lg:grid-cols-12 items-stretch"
                  >
                    <div className="lg:col-span-6 aspect-[16/10] lg:aspect-auto lg:min-h-[300px] bg-limestone overflow-hidden">
                      <ParallaxImageFrame shiftPct={6.5}>
                        <img
                          src={reelSource[reelIdx].images[0]}
                          alt={lang === 'en' ? reelSource[reelIdx].titleEn : reelSource[reelIdx].titleFr}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </ParallaxImageFrame>
                    </div>
                    <div className="lg:col-span-6 p-7 sm:p-9 flex flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider tabular-nums text-[#931916]">
                          <span>Planche 0{reelIdx + 1}</span>
                          <span>·</span>
                          <span>{reelSource[reelIdx].clientOrSector}</span>
                          <span>·</span>
                          <span>{reelSource[reelIdx].year}</span>
                        </div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-snug">
                          {lang === 'en' ? reelSource[reelIdx].titleEn : reelSource[reelIdx].titleFr}
                        </h2>
                        <p className="text-sm text-muted leading-relaxed">
                          {lang === 'en' ? reelSource[reelIdx].solutionEn : reelSource[reelIdx].solutionFr}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const foundIdx = filtered.findIndex((f) => f.id === reelSource[reelIdx].id);
                          setLightboxIdx(foundIdx >= 0 ? foundIdx : 0);
                          setLightboxImgIdx(0);
                          setZoomed(false);
                        }}
                        className="magnetic-sheen inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] transition-colors cursor-pointer w-fit"
                      >
                        <span>{p('Inspecter le dossier', 'Inspect Project')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="h-[2px] w-full bg-limestone relative overflow-hidden">
                  <motion.div
                    key={`galreel-prog-${reelIdx}-${reelPaused ? 'p' : 'r'}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: reelPaused ? 0 : 4.8, ease: 'linear' }}
                    style={{ transformOrigin: '0% 50%' }}
                    className="absolute inset-0 bg-[#931916]"
                  />
                </div>
              </div>
              </div>
            </ParallaxScroll3DPlate>
          )}

          <EngravedRuleReveal tone="light" align="left" />

          <ParallaxHorizontalBand
            tone="dark"
            travel={150}
            className="-mx-4 sm:-mx-6 rounded-[4px]"
            primaryItems={[
              p('PLANCHES & RÉALISATIONS', 'PORTFOLIO ARCHIVE'),
              p('IMPRESSION · MARQUAGE · ÉDITION', 'PRINT · BRANDING · PUBLISHING'),
              p('CONAKRY · GUINÉE', 'CONAKRY · GUINEA'),
            ]}
          />

          {/* Interactive Spring Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-limestone border border-hairline rounded-[4px] w-fit">
            {[
              { slug: 'all', label: p('Toutes les réalisations', 'All Projects') },
              ...categories.map((cat) => ({
                slug: cat.slug,
                label: lang === 'en' ? cat.nameEn : cat.nameFr,
              })),
            ].map((tab) => {
              const active = selectedCat === tab.slug;
              return (
                <button
                  key={tab.slug}
                  type="button"
                  onClick={() => setSelectedCat(tab.slug)}
                  className={`relative px-4 py-2 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
                    active ? 'text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="gallery-cat-pill"
                      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                      className="absolute inset-0 bg-[#931916] rounded-[3px] z-0"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3D Animated Archival Showcase Grid */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            <AnimatePresence>
              {filtered.map((item, idx) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ParallaxColumnStagger key={item.id} index={idx} columns={3} amplitude={48}>
                      <TiltCard3D intensity={5}>
                        <article
                          className="archival-plate hover:border-[#931916] rounded-[4px] overflow-hidden flex flex-col cursor-pointer h-full transition-colors group"
                          onClick={() => {
                            setLightboxIdx(idx);
                            setLightboxImgIdx(0);
                            setZoomed(false);
                          }}
                        >
                          <div className="relative aspect-[4/3] bg-limestone overflow-hidden">
                            <ParallaxImageFrame shiftPct={7}>
                              <ClipCurtainReveal direction="up" delay={idx * 0.04} className="w-full h-full">
                                <img
                                  src={item.images[0]}
                                  alt={lang === 'en' ? item.titleEn : item.titleFr}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                                />
                              </ClipCurtainReveal>
                            </ParallaxImageFrame>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-4 pointer-events-none">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#931916] text-white px-3 py-1.5 rounded-[4px]">
                                <span>{p('Inspecter', 'Inspect')}</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                          <div className="p-6 space-y-2.5 flex-1 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-muted">
                                <span className="font-semibold text-[#931916]">
                                  {cat ? (lang === 'en' ? cat.nameEn : cat.nameFr) : ''}
                                </span>
                                <span>·</span>
                                <span className="tabular-nums font-medium">{item.year}</span>
                              </div>
                              <h2 className="font-serif text-xl font-bold text-ink group-hover:text-[#931916] transition-colors leading-snug">
                                {lang === 'en' ? item.titleEn : item.titleFr}
                              </h2>
                              <p className="text-xs font-medium text-muted">{item.clientOrSector}</p>
                              <p className="text-sm text-muted line-clamp-2 leading-relaxed">
                                {lang === 'en' ? item.solutionEn : item.solutionFr}
                              </p>
                            </div>
                            <span className="pt-2 text-xs font-semibold text-[#931916] editorial-link w-fit">
                              {p('Ouvrir la fiche détaillée →', 'Inspect Case Study →')}
                            </span>
                          </div>
                        </article>
                      </TiltCard3D>
                    </ParallaxColumnStagger>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
        </section>
      </ParallaxCurtainSection>

      {/* Fullscreen Archival Lightbox on Deep Neutral Backdrop */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-[#110D0C]/96 backdrop-blur-md text-[#F6F2EA] flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-4 sm:px-6 py-3.5 border-b border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-white/75">
                <span className="font-serif font-semibold tabular-nums text-[#E40014]">
                  Planche {(lightboxIdx ?? 0) + 1} / {filtered.length}
                </span>
                <span>·</span>
                <span className="font-semibold text-white truncate max-w-[48vw]">
                  {lang === 'en' ? activeItem.titleEn : activeItem.titleFr}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomed((z) => !z)}
                  aria-label={p('Zoomer', 'Toggle zoom')}
                  className="p-2 text-white/80 hover:text-white rounded-[4px] border border-white/25 hover:border-[#931916] cursor-pointer"
                >
                  {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLightboxIdx(null);
                    setZoomed(false);
                    setSearchParams({});
                  }}
                  aria-label={p('Fermer', 'Close')}
                  className="p-2 text-white/80 hover:text-white rounded-[4px] border border-white/25 hover:border-[#931916] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto w-full">
              <div className="lg:col-span-7 relative flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setLightboxIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
                    setLightboxImgIdx(0);
                    setZoomed(false);
                  }}
                  aria-label={p('Réalisation précédente', 'Previous project')}
                  className="absolute left-2 z-10 p-2.5 bg-[#110D0C]/85 hover:bg-[#931916] text-white rounded-[4px] border border-white/25 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="w-full overflow-hidden rounded-[4px] border border-white/20 bg-black">
                  <img
                    src={activeItem.images[lightboxImgIdx] || activeItem.images[0]}
                    alt={lang === 'en' ? activeItem.titleEn : activeItem.titleFr}
                    referrerPolicy="no-referrer"
                    className={`w-full max-h-[65vh] object-contain transition-transform duration-300 ${
                      zoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                    onClick={() => setZoomed((z) => !z)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLightboxIdx((i) => (i === null ? null : (i + 1) % filtered.length));
                    setLightboxImgIdx(0);
                    setZoomed(false);
                  }}
                  aria-label={p('Réalisation suivante', 'Next project')}
                  className="absolute right-2 z-10 p-2.5 bg-[#110D0C]/85 hover:bg-[#931916] text-white rounded-[4px] border border-white/25 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="lg:col-span-5 space-y-5">
                <div className="text-xs text-[#E40014] font-semibold uppercase tracking-wider tabular-nums">
                  {activeItem.clientOrSector} · {activeItem.year}
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  {lang === 'en' ? activeItem.titleEn : activeItem.titleFr}
                </h2>

                <div className="space-y-4 text-sm text-white/75">
                  <div>
                    <p className="text-xs font-semibold text-white mb-1">{p('Besoin initial', 'Client Brief')}</p>
                    <p className="leading-relaxed">{lang === 'en' ? activeItem.needEn : activeItem.needFr}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white mb-1">{p('Solution déployée', 'Delivered Solution')}</p>
                    <p className="leading-relaxed">{lang === 'en' ? activeItem.solutionEn : activeItem.solutionFr}</p>
                  </div>
                </div>

                {activeItem.images.length > 1 && (
                  <div className="flex items-center gap-2 pt-2">
                    {activeItem.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxImgIdx(idx)}
                        className={`w-16 h-12 rounded-[4px] overflow-hidden border cursor-pointer ${
                          lightboxImgIdx === idx ? 'border-[#E40014]' : 'border-white/20 opacity-60'
                        }`}
                      >
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-3">
                  <MagneticWrapper strength={0.2}>
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIdx(null);
                        openQuoteModal({
                          notes: `Projet similaire à : ${activeItem.titleFr}`,
                        });
                      }}
                      className="magnetic-sheen px-5 py-3 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] cursor-pointer transition-colors"
                    >
                      {p('Demander un devis pour un projet similaire', 'Request a Quote for a Similar Project')}
                    </button>
                  </MagneticWrapper>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
