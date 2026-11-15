import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldCheck, Award, Building2, ArrowRight, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
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
  ParallaxOppositeSplit,
  ParallaxScroll3DPlate,
  ParallaxSealDrift,
  ParallaxStickySplit,
  RevealBlock,
  SplitTextReveal,
  TiltCard3D,
} from '../components/MotionPrimitives';
import { AnimatedPageHeader, LUXURY_HEADER_IMAGES } from '../components/AnimatedPageHeader';
import { useAutoRotate } from '../hooks/useAutoRotate';

const ROMAN = ['I', 'II', 'III', 'IV'];

export function AboutPage() {
  const { data, lang, openQuoteModal } = useSite();
  const [activeMilestone, setActiveMilestone] = useState(0);
  const [milestonePaused, setMilestonePaused] = useState(false);
  const [milestoneDir, setMilestoneDir] = useState<1 | -1>(1);
  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  const timelineLen = data?.pageContent.aboutTimeline.length || 0;
  // Rotation disciplinée : 6 s, desktop uniquement, pause au survol / hors écran / au toucher.
  const timelineRef = useAutoRotate<HTMLElement>(
    () => {
      setMilestoneDir(1);
      setActiveMilestone((prev) => (prev + 1) % timelineLen);
    },
    { intervalMs: 6000, desktopOnly: true, enabled: !milestonePaused && timelineLen > 1 },
  );

  if (!data) return null;
  const { settings, pageContent } = data;

  const defaultSlides = [
    {
      imageUrl: LUXURY_HEADER_IMAGES.aboutKaloum,
      captionFr: 'Kaloum, Conakry · Siège historique de l’agence CONCAM',
      captionEn: 'Kaloum, Conakry · Historic headquarters of CONCAM Agency',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.aboutBoardroom,
      captionFr: 'Direction conseil, relations institutionnelles et pilotage 360°',
      captionEn: 'Advisory boardroom, institutional relations and 360° leadership',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.aboutAtelier,
      captionFr: 'Atelier d’édition et contrôle qualité prépresse depuis 2010',
      captionEn: 'Publishing atelier and pre-press quality control since 2010',
    },
  ];
  const headerSlides =
    pageContent.pageHeaders?.about && pageContent.pageHeaders.about.length > 0
      ? pageContent.pageHeaders.about
      : defaultSlides;

  return (
    <>
      {/* No explicit BreadcrumbList here: SeoHead already generates one
          automatically for every sub-page — a second copy would be duplicated. */}
      <SeoHead routeKey="about" />

      <AnimatedPageHeader
        compact
        slides={headerSlides}
        breadcrumbs={[{ label: p('À propos', 'About') }]}
        kicker={p('Agence CONCAM · Com’Com depuis 2010', 'CONCAM Agency · Com’Com since 2010')}
        title={p(
          'Une maison de communication et d’édition ancrée à Kaloum.',
          'A communication and publishing house anchored in Kaloum.',
        )}
        subtitle={lang === 'en' ? pageContent.aboutIntroEn : pageContent.aboutIntroFr}
      />

      {/* Archival Ivory Narrative & Architectural Plate with Curtain Overlap */}
      <ParallaxCurtainSection zIndex={20} topAccent>
        <section className="bg-page text-ink py-20 lg:py-28 border-b border-hairline relative overflow-x-clip">
          <ParallaxBackdropPlate variant="light-grid" offset={115} />
          <ParallaxOppositeSplit
            amplitude={72}
          className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10"
          leftClassName="lg:col-span-6"
          rightClassName="lg:col-span-6"
          left={
            <RevealBlock preset="slide-left" className="space-y-6">
              <ParallaxHorizontalTitle direction={-1} distance={20}>
                <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                  {p('Notre vocation', 'Our Mission')}
                </p>
              </ParallaxHorizontalTitle>
              <ParallaxHorizontalTitle direction={1} distance={24}>
                <SplitTextReveal
                  as="h2"
                  text={p(
                    'Allier conseil stratégique, édition de référence et production imprimée.',
                    'Uniting strategic advisory, flagship publishing and commercial print production.',
                  )}
                  className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight"
                />
              </ParallaxHorizontalTitle>
              <p className="text-base text-muted leading-relaxed">
                {lang === 'en' ? pageContent.aboutIntroEn : pageContent.aboutIntroFr}
              </p>
              <blockquote className="text-lg sm:text-xl text-ink leading-relaxed border-y border-hairline py-5 italic font-serif">
                {lang === 'en' ? pageContent.aboutMissionEn : pageContent.aboutMissionFr}
              </blockquote>
            </RevealBlock>
          }
          right={
            <ParallaxScroll3DPlate direction={-1} tiltX={8} tiltY={6} liftY={46}>
              <TiltCard3D intensity={5}>
                <div className="relative aspect-[4/3] rounded-[4px] overflow-hidden border border-hairline bg-limestone shadow-xl">
                  <ParallaxImageFrame shiftPct={8}>
                    <ClipCurtainReveal direction="right" className="w-full h-full">
                      <img
                        src={LUXURY_HEADER_IMAGES.aboutKaloumHq}
                        alt={p('Quartier des affaires et siège CONCAM à Kaloum, Conakry', 'Business district and CONCAM headquarters in Kaloum, Conakry')}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                       loading="lazy" decoding="async" />
                    </ClipCurtainReveal>
                  </ParallaxImageFrame>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#110D0C]/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-xs font-medium text-white">
                    <span>Manquepas · Kaloum · Conakry — République de Guinée</span>
                  </div>
                </div>
              </TiltCard3D>
            </ParallaxScroll3DPlate>
          }
        />
        </section>
      </ParallaxCurtainSection>

      <ParallaxHorizontalBand
        tone="dark"
        travel={150}
        primaryItems={[
          'MANQUEPAS · KALOUM · CONAKRY',
          p('FONDÉE EN 2010', 'ESTABLISHED 2010'),
          'CONCAM SARL UNIPERSONNELLE',
        ]}
        secondaryItems={[
          p('PRÉPRESSE & ÉDITION', 'PRE-PRESS & PUBLISHING'),
          p('CONSEIL INSTITUTIONNEL', 'INSTITUTIONAL ADVISORY'),
          'RÉUSSITE MAGAZINE',
        ]}
      />

      {/* Interactive Auto-Advancing Timeline Carousel on Warm Limestone */}
      <ParallaxCurtainSection zIndex={25} topAccent>
        <section
          ref={timelineRef}
          className="relative py-20 lg:py-24 bg-limestone text-ink border-b border-hairline overflow-x-clip"
          onMouseEnter={() => setMilestonePaused(true)}
          onMouseLeave={() => setMilestonePaused(false)}
        >
          <ParallaxBackdropPlate variant="editorial-lines" offset={110} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <ParallaxHorizontalTitle direction={-1} distance={20}>
                <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                  {p('Chronologie de l’agence', 'Agency Chronology')}
                </p>
              </ParallaxHorizontalTitle>
              <ParallaxHorizontalTitle direction={1} distance={24}>
                <SplitTextReveal
                  as="h2"
                  text={p('Repères historiques', 'Our Milestones')}
                  className="font-serif text-3xl sm:text-4xl font-bold text-ink"
                />
              </ParallaxHorizontalTitle>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-serif font-semibold tabular-nums text-muted mr-1">
                0{activeMilestone + 1} / 0{pageContent.aboutTimeline.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMilestoneDir(-1);
                  setActiveMilestone((i) => (i - 1 + pageContent.aboutTimeline.length) % pageContent.aboutTimeline.length);
                }}
                aria-label={p('Année précédente', 'Previous milestone')}
                className="bg-surface border border-hairline p-2 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMilestoneDir(1);
                  setActiveMilestone((i) => (i + 1) % pageContent.aboutTimeline.length);
                }}
                aria-label={p('Année suivante', 'Next milestone')}
                className="bg-surface border border-hairline p-2 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {pageContent.aboutTimeline[activeMilestone] && (
            <ParallaxScroll3DPlate direction={1} tiltX={6} tiltY={5} liftY={40}>
              <div className="archival-plate rounded-[4px] overflow-hidden relative">
                <AnimatePresence mode="wait" custom={milestoneDir}>
                  <motion.div
                    key={pageContent.aboutTimeline[activeMilestone].year}
                    custom={milestoneDir}
                    initial={{ opacity: 0, x: milestoneDir > 0 ? 48 : -48 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: milestoneDir > 0 ? -48 : 48 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="p-7 sm:p-9 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
                  >
                    <div className="lg:col-span-3">
                      <p className="font-serif text-5xl sm:text-6xl font-bold text-accent tabular-nums">
                        {pageContent.aboutTimeline[activeMilestone].year}
                      </p>
                    </div>
                    <div className="lg:col-span-9 space-y-2">
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                        {lang === 'en'
                          ? pageContent.aboutTimeline[activeMilestone].titleEn
                          : pageContent.aboutTimeline[activeMilestone].titleFr}
                      </h3>
                      <p className="text-base text-muted leading-relaxed">
                        {lang === 'en'
                          ? pageContent.aboutTimeline[activeMilestone].descEn
                          : pageContent.aboutTimeline[activeMilestone].descFr}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="h-[2px] w-full bg-limestone relative overflow-hidden">
                  <motion.div
                    key={`ab-prog-${activeMilestone}-${milestonePaused ? 'p' : 'r'}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: milestonePaused ? 0 : 4.5, ease: 'linear' }}
                    style={{ transformOrigin: '0% 50%' }}
                    className="absolute inset-0 bg-[#931916]"
                  />
                </div>
              </div>
            </ParallaxScroll3DPlate>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pageContent.aboutTimeline.map((step, i) => {
              const selected = activeMilestone === i;
              return (
                <ParallaxColumnStagger key={step.year} index={i} columns={4} amplitude={30}>
                  <RevealBlock preset={i % 2 === 0 ? 'slide-left' : 'slide-right'} delay={i * 0.06} className="h-full">
                    <TiltCard3D intensity={4}>
                      <button
                        type="button"
                        onClick={() => {
                          setMilestoneDir(i >= activeMilestone ? 1 : -1);
                          setActiveMilestone(i);
                        }}
                        className={`w-full text-left rounded-[4px] p-6 h-full space-y-3 cursor-pointer transition-colors ${
                          selected
                            ? 'bg-[#931916] text-white border border-[#931916] shadow-lg'
                            : 'archival-plate text-ink hover:border-[#931916]'
                        }`}
                      >
                        <p className={`font-serif text-3xl font-bold tabular-nums ${selected ? 'text-white' : 'text-accent'}`}>
                          {step.year}
                        </p>
                        <h3 className={`font-serif text-lg font-bold ${selected ? 'text-white' : 'text-ink'}`}>
                          {lang === 'en' ? step.titleEn : step.titleFr}
                        </h3>
                        <p className={`text-sm leading-relaxed ${selected ? 'text-[#F6F2EA]/90' : 'text-muted'}`}>
                          {lang === 'en' ? step.descEn : step.descFr}
                        </p>
                      </button>
                    </TiltCard3D>
                  </RevealBlock>
                </ParallaxColumnStagger>
              );
            })}
          </div>
        </div>
        </section>
      </ParallaxCurtainSection>

      {/* Sticky Leadership Anchor + Parallax Team Poles on Archival Ivory */}
      <section
        style={{ zIndex: 30 }}
        className="relative py-20 lg:py-28 bg-page text-ink border-b border-hairline overflow-x-clip shadow-[0_-24px_64px_-14px_rgba(17,13,12,0.4)]"
      >
        <ParallaxBackdropPlate variant="light-grid" offset={112} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <ParallaxStickySplit
            stickySide="left"
            amplitude={42}
            stickyClassName="lg:col-span-5"
            scrollingClassName="lg:col-span-7"
            stickyContent={
              <div className="space-y-5">
                <ParallaxHorizontalTitle direction={-1} distance={20}>
                  <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                    {p('Gouvernance & métiers', 'Governance & Craft')}
                  </p>
                </ParallaxHorizontalTitle>
                <SplitTextReveal
                  as="h2"
                  text={p('Pôles de direction & équipes', 'Leadership & Specialist Teams')}
                  className="font-serif text-3xl sm:text-4xl font-bold text-ink"
                />
                <p className="text-sm sm:text-base text-muted leading-relaxed">
                  {lang === 'en' ? pageContent.aboutQualityEn : pageContent.aboutQualityFr}
                </p>
                <EngravedRuleReveal tone="light" align="left" />
                <div className="pt-2 flex items-center gap-5">
                  <ParallaxSealDrift size={84} tone="ink" offset={24} rotateDeg={42} />
                  <p className="text-xs text-muted leading-relaxed max-w-xs">
                    {p(
                      'Des équipes dédiées du conseil stratégique jusqu’au contrôle qualité prépresse.',
                      'Dedicated specialists from strategic advisory through pre-press quality control.',
                    )}
                  </p>
                </div>
              </div>
            }
            scrollingContent={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {pageContent.aboutTeam.map((member, idx) => (
                  <ParallaxColumnStagger key={member.name} index={idx} columns={2} amplitude={44}>
                    <RevealBlock preset="fade-up" delay={idx * 0.06} className="h-full">
                      <TiltCard3D intensity={4.5}>
                        <div className="archival-plate hover:border-[#931916] rounded-[4px] p-6 h-full space-y-3.5 transition-colors">
                          <div className="w-10 h-10 rounded-[4px] bg-[#110D0C] border border-[#931916] text-white flex items-center justify-center font-serif font-bold text-lg">
                            {ROMAN[idx] || idx + 1}
                          </div>
                          <h3 className="font-serif text-xl font-bold text-ink">{member.name}</h3>
                          <p className="text-xs font-semibold text-accent">
                            {lang === 'en' ? member.roleEn : member.roleFr}
                          </p>
                          <p className="text-sm text-muted leading-relaxed">
                            {lang === 'en' ? member.bioEn : member.bioFr}
                          </p>
                        </div>
                      </TiltCard3D>
                    </RevealBlock>
                  </ParallaxColumnStagger>
                ))}
              </div>
            }
          />
        </div>
      </section>

      {/* Official Identity Ledger & Partner Proof on Sovereign Dark with Curtain Overlap */}
      <ParallaxCurtainSection zIndex={35} topAccent>
        <section className="relative py-20 bg-[#110D0C] text-[#F6F2EA] overflow-x-clip">
          <ParallaxBackdropPlate variant="dark-grid" offset={115} />
          <ParallaxOppositeSplit
            amplitude={60}
          className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10"
          leftClassName="lg:col-span-7"
          rightClassName="lg:col-span-5"
          left={
            <RevealBlock preset="slide-left" className="sovereign-plate rounded-[4px] p-7 sm:p-9 h-full">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-[#E40014]" />
                  <h2 className="font-serif text-2xl font-bold text-white">
                    {p('Fiche d’identité officielle', 'Official Corporate Registry')}
                  </h2>
                </div>
                <ParallaxSealDrift size={64} tone="light" offset={26} rotateDeg={46} className="hidden sm:inline-flex" />
              </div>
              <dl className="divide-y divide-white/15 text-sm">
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <dt className="font-medium text-white/65">{p('Dénomination', 'Legal Name')}</dt>
                  <dd className="sm:col-span-2 font-semibold text-white">{settings.companyName}</dd>
                </div>
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <dt className="font-medium text-white/65">{p('Forme juridique', 'Legal Form')}</dt>
                  <dd className="sm:col-span-2 text-white/85">{settings.legalForm}</dd>
                </div>
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <dt className="font-medium text-white/65">RCCM</dt>
                  <dd className="sm:col-span-2 tabular-nums text-xs sm:text-sm text-[#E40014] font-semibold">{settings.rccm}</dd>
                </div>
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <dt className="font-medium text-white/65">{p('Identifiants fiscaux', 'Tax IDs')}</dt>
                  <dd className="sm:col-span-2 tabular-nums text-white">
                    NCC {settings.ncc} / NIF {settings.nif}
                  </dd>
                </div>
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <dt className="font-medium text-white/65">{p('Catégorie fiscale', 'Tax Category')}</dt>
                  <dd className="sm:col-span-2 text-white/85">{settings.taxCategory}</dd>
                </div>
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <dt className="font-medium text-white/65">{p('Siège social', 'Headquarters')}</dt>
                  <dd className="sm:col-span-2 text-white/85">{lang === 'en' ? settings.address.en : settings.address.fr}</dd>
                </div>
              </dl>
            </RevealBlock>
          }
          right={
            <RevealBlock preset="slide-right" delay={0.08} className="space-y-6">
              <div className="sovereign-plate rounded-[4px] p-7 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-[#E40014]" />
                  <h2 className="font-serif text-xl font-bold text-white">
                    {p('Références & partenaires', 'Institutional Partners')}
                  </h2>
                </div>
                <p className="text-sm text-white/75">
                  {p(
                    'Acteurs bancaires, assurances, programmes nationaux et entreprises qui collaborent avec l’agence et Réussite Magazine :',
                    'Banks, insurers, public programs and corporates partnering with the agency and Réussite Magazine:',
                  )}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {settings.partners.map((partner) => (
                    <div
                      key={partner}
                      className="sovereign-plate-subtle hover:border-[#931916] px-3 py-2.5 rounded-[4px] text-xs font-semibold text-white text-center transition-colors"
                    >
                      {partner}
                    </div>
                  ))}
                </div>
              </div>

              <div className="sovereign-plate rounded-[4px] p-7 space-y-4 border-[#931916]/60">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck className="w-5 h-5 text-[#E40014]" />
                  <span className="text-sm font-semibold">{p('Engagement qualité', 'Quality Pledge')}</span>
                </div>
                <p className="text-sm text-white/75 leading-relaxed">
                  {p(
                    'Épreuves contractuelles avant tirage, respect strict de votre charte et interlocuteur unique jusqu’à la livraison.',
                    'Verified pre-press proofs, strict brand adherence and a dedicated account lead through delivery.',
                  )}
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <MagneticWrapper strength={0.2}>
                    <button
                      type="button"
                      onClick={() => openQuoteModal()}
                      className="magnetic-sheen inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] transition-colors cursor-pointer"
                    >
                      <span>{p('Demander un devis', 'Request a Quote')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </MagneticWrapper>
                  <Link
                    to={p('/galerie', '/en/gallery')}
                    className="sovereign-plate-subtle px-4 py-2.5 text-xs font-medium text-white rounded-[4px] hover:border-[#931916] transition-colors"
                  >
                    {p('Voir nos réalisations', 'View Portfolio')}
                  </Link>
                  <a
                    href={`/api/public/brochure.pdf?lang=${lang}`}
                    download
                    className="sovereign-plate-subtle inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white rounded-[4px] hover:border-[#931916] transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-[#E40014]" aria-hidden="true" />
                    <span>{p('Télécharger la plaquette PDF', 'Download PDF Brochure')}</span>
                  </a>
                </div>
              </div>
            </RevealBlock>
          }
        />
        </section>
      </ParallaxCurtainSection>
    </>
  );
}
