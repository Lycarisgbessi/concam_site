import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import {
  InstitutionalSeal,
  SplitTextReveal,
  isFinePointer,
  useParallaxScale,
} from './MotionPrimitives';

export interface HeaderSlide {
  mediaType?: 'image' | 'video';
  imageUrl: string;
  videoUrl?: string;
  captionFr?: string;
  captionEn?: string;
  tagFr?: string;
  tagEn?: string;
  cardTitleFr?: string;
  cardTitleEn?: string;
  cardDescFr?: string;
  cardDescEn?: string;
  href?: string;
}

interface AnimatedPageHeaderProps {
  slides: HeaderSlide[];
  kicker: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  compact?: boolean;
  showSpotlightDeck?: boolean;
  children?: React.ReactNode;
  activeSlideExternal?: number;
  onSlideChange?: (idx: number) => void;
}

export const LUXURY_HEADER_IMAGES = {
  // Backward-compatible primary keys mapped to authentic real photographs
  boardroom: '/images/real/hdr_home_advisory.jpg',
  conakry: '/images/real/hdr_home_conakry.jpg',
  atelier: '/images/real/hdr_home_offset.jpg',
  summit: '/images/real/hdr_home_summit.jpg',
  conseil: '/images/real/srv_conseil_360.jpg',
  impression: '/images/real/srv_impression_offset.jpg',
  marquage: '/images/real/srv_marquage_corporate.jpg',
  manuels: '/images/real/srv_manuels_edition.jpg',

  // Dedicated real photographic plates per page & section
  aboutKaloumHq: '/images/real/about_kaloum_hq.jpg',
  aboutKaloum: '/images/real/hdr_about_kaloum.jpg',
  aboutBoardroom: '/images/real/hdr_about_boardroom.jpg',
  aboutAtelier: '/images/real/hdr_about_atelier.jpg',

  servicesAtelier: '/images/real/hdr_services_atelier.jpg',
  servicesPress: '/images/real/hdr_services_press.jpg',
  servicesAdvisory: '/images/real/hdr_services_advisory.jpg',

  serviceDetailProofing: '/images/real/hdr_srv_detail_proofing.jpg',
  serviceDetailHandover: '/images/real/hdr_srv_detail_handover.jpg',

  presseSummit: '/images/real/hdr_presse_summit.jpg',
  presseMagazine: '/images/real/hdr_presse_magazine.jpg',
  presseNewsroom: '/images/real/hdr_presse_newsroom.jpg',
  mediaReussite: '/images/real/media_reussite.jpg',
  mediaInfopro: '/images/real/media_infopro.jpg',

  galerieShowcase: '/images/real/hdr_galerie_showcase.jpg',
  galerieBinding: '/images/real/hdr_galerie_binding.jpg',
  galerieSignage: '/images/real/hdr_galerie_signage.jpg',

  insightsDesk: '/images/real/hdr_insights_desk.jpg',
  insightsSwatches: '/images/real/hdr_insights_swatches.jpg',
  insightsStrategy: '/images/real/hdr_insights_strategy.jpg',

  contactStreet: '/images/real/hdr_contact_street.jpg',
  contactOffice: '/images/real/hdr_contact_office.jpg',
  searchArchive: '/images/real/hdr_search_archive.jpg',
  legalDocs: '/images/real/hdr_legal_docs.jpg',
  privacyShield: '/images/real/hdr_privacy_shield.jpg',
  unsubscribeDesk: '/images/real/hdr_unsubscribe_desk.jpg',
};

export function AnimatedPageHeader({
  slides,
  kicker,
  title,
  subtitle,
  breadcrumbs,
  compact = false,
  showSpotlightDeck = false,
  children,
  activeSlideExternal,
  onSlideChange,
}: AnimatedPageHeaderProps) {
  const { data, lang } = useSite();
  const [internalIndex, setInternalIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [videoFailedIdx, setVideoFailedIdx] = useState<number | null>(null);

  const activeIdx = activeSlideExternal !== undefined ? activeSlideExternal : internalIndex;
  const { enabled, multiplier } = useParallaxScale();
  const reduced = !enabled;
  const amp = multiplier;
  const pointerParallaxActive = enabled && isFinePointer();
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 320, damping: 28, mass: 0.16 });

  // Interactive 3D cursor depth across all 4 planes (crisp responsive tracking)
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const mouseX = useSpring(rawMouseX, { stiffness: 240, damping: 26, mass: 0.25 });
  const mouseY = useSpring(rawMouseY, { stiffness: 240, damping: 26, mass: 0.25 });

  const bgMouseX = useTransform(mouseX, [-0.5, 0.5], [22 * amp, -22 * amp]);
  const bgMouseY = useTransform(mouseY, [-0.5, 0.5], [16 * amp, -16 * amp]);
  const gridMouseX = useTransform(mouseX, [-0.5, 0.5], [14 * amp, -14 * amp]);
  const sealMouseX = useTransform(mouseX, [-0.5, 0.5], [-24 * amp, 24 * amp]);
  const sealMouseY = useTransform(mouseY, [-0.5, 0.5], [-18 * amp, 18 * amp]);
  const sealMouseRotateY = useTransform(mouseX, [-0.5, 0.5], [-14, 14]);
  const sealMouseRotateX = useTransform(mouseY, [-0.5, 0.5], [14, -14]);
  const deckMouseX = useTransform(mouseX, [-0.5, 0.5], [-15 * amp, 15 * amp]);
  const deckMouseRotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);
  const deckMouseRotateX = useTransform(mouseY, [-0.5, 0.5], [4.5, -4.5]);

  // Plane 1: Background Photo / MP4 Video (deepest, generous overscan, optical zoom & subtle angle rotation)
  const parallaxY = useTransform(smoothScrollY, [0, 760], [0, amp * (compact ? 155 : 225)]);
  const mediaScale = useTransform(smoothScrollY, [0, 760], [1.08, 1.08 + amp * 0.16]);
  const mediaRotate = useTransform(smoothScrollY, [0, 760], [0, amp * 1.4]);
  const backdropOpacity = useTransform(smoothScrollY, [0, 760], [1, amp > 0 ? 0.3 : 1]);

  // Plane 2: Intermediate Architectural Column Lines at Midground Velocity + Pointer X
  const gridParallaxY = useTransform(smoothScrollY, [0, 760], [0, amp * (compact ? 94 : 138)]);
  const gridParallaxX = useTransform(smoothScrollY, [0, 760], [0, -amp * 28]);

  // Plane 3: Official CONCAM Seal Emblem (counter-drift + scroll rotation + zoom + 3D tilt)
  const sealParallaxY = useTransform(smoothScrollY, [0, 700], [0, -amp * (compact ? 64 : 98)]);
  const sealRotate = useTransform(smoothScrollY, [0, 700], [0, amp * 82]);
  const sealScale = useTransform(smoothScrollY, [0, 700], [1, 1 + amp * 0.08]);

  // Plane 4: Foreground Content & Spotlight Deck (receding curtain counter-parallax & scale)
  const contentParallaxY = useTransform(smoothScrollY, [0, 680], [0, -amp * (compact ? 52 : 76)]);
  const contentScale = useTransform(smoothScrollY, [0, 680], [1, amp > 0 ? 0.94 : 1]);
  const contentOpacity = useTransform(smoothScrollY, [0, 680], [1, amp > 0 ? 0.55 : 1]);
  const titleDriftX = useTransform(smoothScrollY, [0, 680], [0, -amp * 24]);
  const deckExtraY = useTransform(smoothScrollY, [0, 680], [0, -amp * 42]);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!pointerParallaxActive || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawMouseX.set(nx);
    rawMouseY.set(ny);
  };

  const handlePointerLeave = () => {
    setPaused(false);
    rawMouseX.set(0);
    rawMouseY.set(0);
  };

  const stepSlide = (delta: 1 | -1) => {
    if (slides.length <= 1) return;
    setDirection(delta);
    const next = (activeIdx + delta + slides.length) % slides.length;
    if (onSlideChange) onSlideChange(next);
    else setInternalIndex(next);
  };

  const setSlide = (idx: number) => {
    setDirection(idx >= activeIdx ? 1 : -1);
    if (onSlideChange) onSlideChange(idx);
    else setInternalIndex(idx);
  };

  useEffect(() => {
    if (reduced || paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      const next = (activeIdx + 1) % slides.length;
      if (onSlideChange) onSlideChange(next);
      else setInternalIndex(next);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeIdx, slides.length, reduced, paused, onSlideChange]);

  const currentSlide = slides[activeIdx] || slides[0];
  const hasDeckCard = Boolean(
    showSpotlightDeck && (currentSlide?.cardTitleFr || currentSlide?.captionFr),
  );

  return (
    <section
      ref={sectionRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={pointerParallaxActive ? { perspective: 1400 } : undefined}
      className={`relative bg-[#110D0C] text-[#F6F2EA] overflow-hidden -mt-16 pt-16 border-b border-white/15 ${
        compact ? 'min-h-[450px] lg:min-h-[520px]' : 'min-h-[680px] lg:min-h-[88vh]'
      } flex flex-col justify-end`}
    >
      {/* Plane 1: Multi-layer Animated Background (Photo Ken Burns / Video MP4) with Deep Overscan & 3D Depth */}
      <motion.div
        style={{
          y: parallaxY,
          x: pointerParallaxActive ? bgMouseX : 0,
          scale: mediaScale,
          rotate: mediaRotate,
          opacity: backdropOpacity,
        }}
        className="absolute -inset-x-12 -top-48 -bottom-48 pointer-events-none will-change-transform"
        aria-hidden="true"
      >
        <motion.div
          style={pointerParallaxActive ? { y: bgMouseY } : undefined}
          className="absolute inset-0 will-change-transform"
        >
        <AnimatePresence mode="sync" custom={direction}>
          <motion.div
            key={`${currentSlide?.videoUrl || currentSlide?.imageUrl || 'bg'}-${activeIdx}`}
            custom={direction}
            initial={
              reduced
                ? { opacity: 1 }
                : { opacity: 0, x: direction > 0 ? '4%' : '-4%', scale: 1.07 }
            }
            animate={{ opacity: 1, x: '0%', scale: 1 }}
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, x: direction > 0 ? '-4%' : '4%', scale: 1.02 }
            }
            transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {currentSlide?.mediaType === 'video' &&
            currentSlide?.videoUrl &&
            !reduced &&
            videoFailedIdx !== activeIdx ? (
              <video
                key={currentSlide.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={currentSlide.imageUrl}
                onError={() => setVideoFailedIdx(activeIdx)}
                className="w-full h-full object-cover"
              >
                <source src={currentSlide.videoUrl} />
              </video>
            ) : (
              <img
                src={currentSlide?.imageUrl}
                alt=""
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${
                  activeIdx % 2 === 0 ? 'animate-kenburns-forward' : 'animate-kenburns-reverse'
                }`}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dignified Sovereign Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C] via-[#110D0C]/72 to-[#110D0C]/48" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#110D0C]/92 via-[#110D0C]/58 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Plane 2: Intermediate Architectural Column Lines at Midground Velocity + Scroll X + Pointer X */}
      <motion.div
        style={{
          y: gridParallaxY,
          x: pointerParallaxActive ? gridMouseX : gridParallaxX,
        }}
        className="editorial-hairline-grid absolute -inset-x-10 -top-40 -bottom-40 opacity-80 pointer-events-none will-change-transform"
        aria-hidden="true"
      />

      {/* Plane 3: Official Rotating Seal Emblem with Scroll Counter-Drift, Rotation, Scale & 3D Cursor Tilt */}
      <motion.div
        style={{
          y: sealParallaxY,
          x: pointerParallaxActive ? sealMouseX : 0,
          rotate: sealRotate,
          scale: sealScale,
          rotateX: pointerParallaxActive ? sealMouseRotateX : 0,
          rotateY: pointerParallaxActive ? sealMouseRotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        className="hidden md:block absolute top-24 right-8 lg:right-14 z-10 opacity-90 pointer-events-none will-change-transform"
        aria-hidden="true"
      >
        <motion.div style={pointerParallaxActive ? { y: sealMouseY } : undefined}>
          <InstitutionalSeal size={compact ? 96 : 128} tone="light" />
        </motion.div>
      </motion.div>

      {/* Plane 4: Foreground Content Layer with Counter-Parallax & Receding Scale */}
      <motion.div
        style={{
          y: contentParallaxY,
          scale: contentScale,
          opacity: contentOpacity,
        }}
        className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-16 pb-10 lg:pb-14 space-y-6 will-change-transform"
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <motion.nav
            initial={reduced ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            aria-label={lang === 'en' ? 'Breadcrumb' : "Fil d'Ariane"}
            className="flex items-center gap-2 text-xs text-white/75"
          >
            <Link to={lang === 'en' ? '/en' : '/'} className="hover:text-white transition-colors">
              {lang === 'en' ? 'Home' : 'Accueil'}
            </Link>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3.5 h-3.5 text-[#E40014] shrink-0" aria-hidden="true" />
                {b.to ? (
                  <Link to={b.to} className="hover:text-white transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-white font-medium">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </motion.nav>
        )}

        <div className={`grid grid-cols-1 ${hasDeckCard ? 'lg:grid-cols-12 gap-8 lg:gap-10 items-end' : ''}`}>
          <motion.div
            style={amp > 0 ? { x: titleDriftX } : undefined}
            className={`${hasDeckCard ? 'lg:col-span-7' : 'max-w-3xl'} space-y-5 will-change-transform`}
          >
            <motion.div
              initial={reduced ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <span className="h-[2px] w-10 bg-[#E40014]" aria-hidden="true" />
              <p className="text-xs font-sans font-semibold tracking-[0.2em] uppercase text-white">
                {kicker}
              </p>
            </motion.div>

            <SplitTextReveal
              as="h1"
              text={title}
              immediate
              delay={0.08}
              className={`font-serif font-bold text-[#F6F2EA] tracking-tight leading-[1.04] ${
                compact ? 'text-3xl sm:text-5xl' : 'text-[clamp(2.45rem,4.7vw,4.35rem)]'
              }`}
            />

            {subtitle && (
              <motion.p
                initial={reduced ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-base sm:text-lg text-[#E0D8CC] leading-relaxed max-w-2xl"
              >
                {subtitle}
              </motion.p>
            )}

            {children && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            )}
          </motion.div>

          {/* Sovereign Editorial Spotlight Deck inside the Hero Header */}
          {hasDeckCard && (
            <motion.div
              style={{
                y: deckExtraY,
                x: pointerParallaxActive ? deckMouseX : 0,
                rotateX: pointerParallaxActive ? deckMouseRotateX : 0,
                rotateY: pointerParallaxActive ? deckMouseRotateY : 0,
                transformStyle: 'preserve-3d',
              }}
              className="lg:col-span-5 will-change-transform"
            >
              <div className="sovereign-plate rounded-[4px] p-5 sm:p-6 overflow-hidden relative">
                <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-white/15">
                  <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-white">
                    {lang === 'en' ? currentSlide.tagEn || 'CONCAM Spotlight' : currentSlide.tagFr || 'Pôle · CONCAM'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-serif font-semibold tabular-nums text-[#E40014] mr-1">
                      0{activeIdx + 1} / 0{slides.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => stepSlide(-1)}
                      aria-label={lang === 'en' ? 'Previous slide' : 'Diapositive précédente'}
                      className="p-1.5 rounded-[4px] bg-[#1F1817] hover:bg-[#931916] border border-white/20 text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => stepSlide(1)}
                      aria-label={lang === 'en' ? 'Next slide' : 'Diapositive suivante'}
                      className="p-1.5 rounded-[4px] bg-[#1F1817] hover:bg-[#931916] border border-white/20 text-white transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden min-h-[140px]">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={`deck-${activeIdx}`}
                      custom={direction}
                      initial={
                        reduced
                          ? { opacity: 1 }
                          : { opacity: 0, x: direction > 0 ? 48 : -48 }
                      }
                      animate={{ opacity: 1, x: 0 }}
                      exit={
                        reduced
                          ? { opacity: 0 }
                          : { opacity: 0, x: direction > 0 ? -48 : 48 }
                      }
                      transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                      className="flex gap-4 items-center"
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[4px] overflow-hidden shrink-0 border border-white/20 bg-[#140F0F]">
                        <img
                          src={currentSlide.imageUrl}
                          alt={lang === 'en' ? currentSlide.cardTitleEn || '' : currentSlide.cardTitleFr || ''}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-2 min-w-0 flex-1">
                        <h2 className="font-serif text-xl sm:text-2xl font-bold text-white leading-snug">
                          {lang === 'en'
                            ? currentSlide.cardTitleEn || currentSlide.captionEn
                            : currentSlide.cardTitleFr || currentSlide.captionFr}
                        </h2>
                        <p className="text-xs sm:text-sm text-white/75 line-clamp-2 leading-relaxed">
                          {lang === 'en'
                            ? currentSlide.cardDescEn || currentSlide.captionEn
                            : currentSlide.cardDescFr || currentSlide.captionFr}
                        </p>
                        {currentSlide.href && (
                          <Link
                            to={currentSlide.href}
                            className="editorial-link inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-[#E40014] pt-1"
                          >
                            <span>{lang === 'en' ? 'Explore pillar' : 'Découvrir ce pôle'}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#E40014]" />
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Auto-Progress Official Slide Controls + Crimson Shimmer Line */}
        {slides.length > 1 && (
          <div className="relative pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
            <div className="pointer-events-none absolute top-0 left-0 h-[1px] w-28 bg-gradient-to-r from-transparent via-[#E40014] to-transparent animate-hairline-beam" />
            <div className="flex items-center gap-3">
              {!hasDeckCard && (
                <div className="flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={() => stepSlide(-1)}
                    aria-label={lang === 'en' ? 'Previous' : 'Précédent'}
                    className="p-1.5 rounded-[4px] bg-[#1A1413] hover:bg-[#931916] border border-white/20 text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSlide(1)}
                    aria-label={lang === 'en' ? 'Next' : 'Suivant'}
                    className="p-1.5 rounded-[4px] bg-[#1A1413] hover:bg-[#931916] border border-white/20 text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className="group py-2 cursor-pointer"
                  >
                    <span className="block w-10 sm:w-12 h-[2px] bg-white/20 overflow-hidden relative">
                      {activeIdx === idx && (
                        <motion.span
                          key={`hdr-bar-${idx}-${paused ? 'p' : 'r'}`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: paused || reduced ? 0 : 5, ease: 'linear' }}
                          style={{ transformOrigin: '0% 50%' }}
                          className="absolute inset-0 bg-[#E40014]"
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {(currentSlide?.captionFr || currentSlide?.captionEn) && (
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeIdx}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.35 }}
                  className="text-xs text-white/80 tabular-nums font-medium tracking-wide"
                >
                  <span className="text-[#E40014] font-serif font-semibold mr-2">
                    0{activeIdx + 1} / 0{slides.length}
                  </span>
                  — {lang === 'en' ? currentSlide.captionEn : currentSlide.captionFr}
                </motion.p>
              </AnimatePresence>
            )}
          </div>
        )}
      </motion.div>
    </section>
  );
}
