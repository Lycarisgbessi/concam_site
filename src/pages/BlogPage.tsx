import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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
  ParallaxLayer,
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

export function BlogPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { data, lang, openQuoteModal } = useSite();
  const [postIdx, setPostIdx] = useState(0);
  const [postDir, setPostDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);
  const postsCount = data?.blogPosts.length || 0;

  // Rotation disciplinée : 6 s, desktop uniquement, pause au survol / hors écran / au toucher.
  const carouselRef = useAutoRotate<HTMLDivElement>(
    () => {
      setPostDir(1);
      setPostIdx((prev) => (prev + 1) % postsCount);
    },
    { intervalMs: 6000, desktopOnly: true, enabled: !slug && !paused && postsCount > 1 },
  );

  if (!data) return null;

  if (slug) {
    const post = data.blogPosts.find((b) => b.slug === slug);
    if (!post) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-32 text-center space-y-4 text-ink">
          <h1 className="font-serif text-3xl font-bold">{p('Article introuvable', 'Article not found')}</h1>
          <Link to={p('/actualites-conseils', '/en/insights')} className="text-accent underline">
            {p('Retour aux articles', 'Back to insights')}
          </Link>
        </div>
      );
    }

    const title = lang === 'en' ? post.titleEn : post.titleFr;
    const content = lang === 'en' ? post.contentEn : post.contentFr;
    const relatedSrv = data.services.find((s) => s.slug === post.relatedServiceSlug);

    return (
      <>
        <SeoHead
          customTitle={`${title} — CONCAM`}
          customDescription={lang === 'en' ? post.excerptEn : post.excerptFr}
          customKeywords={post.targetKeyword}
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            datePublished: post.publishedAt,
            author: { '@type': 'Organization', name: data.settings.companyName },
          }}
        />

        <AnimatedPageHeader
          compact
          slides={[
            { imageUrl: post.imageUrl },
            { imageUrl: LUXURY_HEADER_IMAGES.insightsSwatches },
          ]}
          breadcrumbs={[
            { label: p('Actualités & conseils', 'Insights'), to: p('/actualites-conseils', '/en/insights') },
            { label: title },
          ]}
          kicker={`${lang === 'en' ? post.categoryEn : post.categoryFr} · ${post.publishedAt} · ${post.readMinutes} min`}
          title={title}
        />

        <ParallaxCurtainSection zIndex={20} topAccent>
          <article className="relative py-16 lg:py-24 bg-page text-ink overflow-x-clip">
            <ParallaxBackdropPlate variant="editorial-lines" offset={106} />
          <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-10 relative z-10">
            <Link
              to={p('/actualites-conseils', '/en/insights')}
              className="editorial-link inline-flex items-center gap-1.5 text-xs font-semibold text-accent"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{p('Tous les articles', 'All insights')}</span>
            </Link>

            <div className="editorial-dropcap space-y-6 text-[17px] text-ink/90 leading-[1.82] whitespace-pre-line">
              {content}
            </div>

            {relatedSrv && (
              <ParallaxLayer offset={32}>
                <RevealBlock preset="zoom-soft">
                  <div className="sovereign-plate text-white rounded-[4px] p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#E40014]">
                        {p('Service associé', 'Related Service')}
                      </p>
                      <p className="font-serif text-xl font-bold text-white mt-1">
                        {lang === 'en' ? relatedSrv.titleEn : relatedSrv.titleFr}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={lang === 'en' ? `/en/services/${relatedSrv.slug}` : `/services/${relatedSrv.slug}`}
                        className="text-xs font-semibold text-white hover:text-[#E40014] hover:underline"
                      >
                        {p('Voir l’offre', 'View Service')}
                      </Link>
                      <MagneticWrapper strength={0.2}>
                        <button
                          type="button"
                          onClick={() => openQuoteModal({ serviceSlug: relatedSrv.slug })}
                          className="magnetic-sheen px-4 py-2.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] cursor-pointer transition-colors"
                        >
                          {p('Demander un devis', 'Request Quote')}
                        </button>
                      </MagneticWrapper>
                    </div>
                  </div>
                </RevealBlock>
              </ParallaxLayer>
            )}
          </div>
          </article>
        </ParallaxCurtainSection>
      </>
    );
  }

  const defaultSlides = [
    {
      imageUrl: LUXURY_HEADER_IMAGES.insightsDesk,
      captionFr: 'Cahiers pratiques & guides éditoriaux pour directions communication',
      captionEn: 'Practical briefs & editorial guides for communication leaders',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.insightsSwatches,
      captionFr: 'Bonnes pratiques d’impression offset, reliure et manuels techniques',
      captionEn: 'Offset printing, bookbinding and technical manual best practices',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.insightsStrategy,
      captionFr: 'Stratégie de marque et communication institutionnelle en Guinée',
      captionEn: 'Brand strategy and institutional communication in Guinea',
    },
  ];
  const headerSlides =
    data.pageContent.pageHeaders?.insights && data.pageContent.pageHeaders.insights.length > 0
      ? data.pageContent.pageHeaders.insights
      : defaultSlides;

  const [leadPost, ...otherPosts] = data.blogPosts;

  return (
    <>
      <SeoHead routeKey="actualites-conseils" />

      <AnimatedPageHeader
        compact
        slides={headerSlides}
        breadcrumbs={[{ label: p('Actualités & conseils', 'Insights & Advice') }]}
        kicker={p('Ressources éditoriales · Cahiers pratiques', 'Editorial Resources')}
        title={p('Actualités et conseils', 'Insights & Advisory')}
        subtitle={p(
          'Guides pratiques pour les directions communication, études de cas en Guinée et relais de Réussite Magazine.',
          'Practical guides for communication leaders, Guinean case studies and Réussite Magazine highlights.',
        )}
      />

      <ParallaxCurtainSection zIndex={20} topAccent>
        <section className="relative py-20 bg-page text-ink overflow-x-clip">
          <ParallaxBackdropPlate variant="light-grid" offset={112} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16 relative z-10">
            {/* Auto-Advancing Broadsheet Carousel with 3D Scroll Depth */}
            {data.blogPosts[postIdx] && (
              <ParallaxScroll3DPlate direction={1} tiltX={7} tiltY={5} liftY={42}>
              <div
                ref={carouselRef}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                className="space-y-4 pb-12"
              >
              <div className="flex items-center justify-between gap-4">
                <ParallaxHorizontalTitle direction={-1} distance={20}>
                  <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                    {p('Sélection éditoriale dynamique', 'Featured Insights Carousel')}
                  </p>
                </ParallaxHorizontalTitle>
                {data.blogPosts.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-serif font-semibold tabular-nums text-muted mr-1">
                      0{postIdx + 1} / 0{data.blogPosts.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPostDir(-1);
                        setPostIdx((i) => (i - 1 + data.blogPosts.length) % data.blogPosts.length);
                      }}
                      aria-label={p('Article précédent', 'Previous post')}
                      className="bg-surface border border-hairline p-2 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPostDir(1);
                        setPostIdx((i) => (i + 1) % data.blogPosts.length);
                      }}
                      aria-label={p('Article suivant', 'Next post')}
                      className="bg-surface border border-hairline p-2 rounded-[4px] text-ink hover:border-[#931916] hover:text-accent transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="archival-plate rounded-[4px] overflow-hidden relative">
                <AnimatePresence mode="wait" custom={postDir}>
                  <motion.div
                    key={data.blogPosts[postIdx].id}
                    custom={postDir}
                    initial={{ opacity: 0, x: postDir > 0 ? 48 : -48 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: postDir > 0 ? -48 : 48 }}
                    transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 lg:grid-cols-12 items-stretch"
                  >
                    <div className="lg:col-span-6 aspect-[16/10] lg:aspect-auto lg:min-h-[320px] bg-limestone overflow-hidden">
                      <ParallaxImageFrame shiftPct={6.5}>
                        <img
                          src={data.blogPosts[postIdx].imageUrl}
                          alt={lang === 'en' ? data.blogPosts[postIdx].titleEn : data.blogPosts[postIdx].titleFr}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                         loading="lazy" decoding="async" />
                      </ParallaxImageFrame>
                    </div>
                    <div className="lg:col-span-6 p-7 sm:p-10 flex flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted tabular-nums">
                          <span className="font-semibold text-accent uppercase tracking-wider">
                            {lang === 'en' ? data.blogPosts[postIdx].categoryEn : data.blogPosts[postIdx].categoryFr}
                          </span>
                          <span>·</span>
                          <span>{data.blogPosts[postIdx].publishedAt}</span>
                          <span>·</span>
                          <span>{data.blogPosts[postIdx].readMinutes} min</span>
                        </div>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight">
                          {lang === 'en' ? data.blogPosts[postIdx].titleEn : data.blogPosts[postIdx].titleFr}
                        </h2>
                        <p className="text-sm sm:text-base text-muted leading-relaxed">
                          {lang === 'en' ? data.blogPosts[postIdx].excerptEn : data.blogPosts[postIdx].excerptFr}
                        </p>
                      </div>
                      <Link
                        to={
                          lang === 'en'
                            ? `/en/insights/${data.blogPosts[postIdx].slug}`
                            : `/actualites-conseils/${data.blogPosts[postIdx].slug}`
                        }
                        className="editorial-link group inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-ink w-fit"
                      >
                        <span>{p('Lire le dossier complet', 'Read Full Article')}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="h-[2px] w-full bg-limestone relative overflow-hidden">
                  <motion.div
                    key={`blog-prog-${postIdx}-${paused ? 'p' : 'r'}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: paused ? 0 : 5.2, ease: 'linear' }}
                    style={{ transformOrigin: '0% 50%' }}
                    className="absolute inset-0 bg-[#931916]"
                  />
                </div>
              </div>
            </div>
            </ParallaxScroll3DPlate>
          )}

          <EngravedRuleReveal tone="light" align="center" />

          {/* Lead Featured Magazine Article */}
          {leadPost && (
            <ParallaxOppositeSplit
              amplitude={68}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pb-6"
              leftClassName="lg:col-span-7"
              rightClassName="lg:col-span-5"
              left={
                <ParallaxScroll3DPlate direction={-1} tiltX={8} tiltY={6} liftY={44}>
                  <TiltCard3D intensity={4.5}>
                    <Link
                      to={lang === 'en' ? `/en/insights/${leadPost.slug}` : `/actualites-conseils/${leadPost.slug}`}
                      className="group block aspect-[16/10] rounded-[4px] overflow-hidden border border-hairline bg-limestone shadow-md"
                    >
                      <ParallaxImageFrame shiftPct={8}>
                        <ClipCurtainReveal direction="left" className="w-full h-full">
                          <img
                            src={leadPost.imageUrl}
                            alt={lang === 'en' ? leadPost.titleEn : leadPost.titleFr}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                           loading="lazy" decoding="async" />
                        </ClipCurtainReveal>
                      </ParallaxImageFrame>
                    </Link>
                  </TiltCard3D>
                </ParallaxScroll3DPlate>
              }
              right={
                <RevealBlock preset="slide-right" delay={0.08} className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-muted tabular-nums">
                    <span className="font-semibold text-accent uppercase tracking-wider">
                      {lang === 'en' ? leadPost.categoryEn : leadPost.categoryFr}
                    </span>
                    <span>·</span>
                    <span>{leadPost.publishedAt}</span>
                    <span>·</span>
                    <span>{leadPost.readMinutes} min</span>
                  </div>
                  <ParallaxHorizontalTitle direction={1} distance={24}>
                    <SplitTextReveal
                      as="h2"
                      text={lang === 'en' ? leadPost.titleEn : leadPost.titleFr}
                      className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight"
                    />
                  </ParallaxHorizontalTitle>
                  <p className="text-base text-muted leading-relaxed">
                    {lang === 'en' ? leadPost.excerptEn : leadPost.excerptFr}
                  </p>
                  <Link
                    to={lang === 'en' ? `/en/insights/${leadPost.slug}` : `/actualites-conseils/${leadPost.slug}`}
                    className="editorial-link group inline-flex items-center gap-2 text-sm font-semibold text-accent pt-2"
                  >
                    <span>{p('Lire le dossier complet', 'Read Full Article')}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </RevealBlock>
              }
            />
          )}
        </div>
        </section>
      </ParallaxCurtainSection>

      <ParallaxHorizontalBand
        tone="dark"
        travel={165}
        primaryItems={[
          p('CAHIERS PRATIQUES & GUIDES', 'EDITORIAL BRIEFS & GUIDES'),
          p('STRATÉGIE · PRÉPRESSE · MARQUE', 'STRATEGY · PRE-PRESS · BRAND'),
          p('EXPERTISE CONCAM CONAKRY', 'CONCAM EXPERTISE CONAKRY'),
        ]}
      />

      {/* Sticky Curatorial Index + Staggered Editorial Archive */}
      <section
        style={{ zIndex: 25 }}
        className="relative py-20 lg:py-24 bg-limestone text-ink border-t-2 border-[#931916] overflow-x-clip shadow-[0_-24px_64px_-14px_rgba(17,13,12,0.42)]"
      >
        <ParallaxBackdropPlate variant="editorial-lines" offset={110} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <ParallaxStickySplit
            stickySide="left"
            amplitude={40}
            stickyClassName="lg:col-span-4"
            scrollingClassName="lg:col-span-8"
            stickyContent={
              <div className="archival-plate rounded-[4px] p-7 space-y-5">
                <ParallaxHorizontalTitle direction={-1} distance={18}>
                  <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                    {p('Bibliothèque conseil', 'Advisory Library')}
                  </p>
                </ParallaxHorizontalTitle>
                <ParallaxHorizontalTitle direction={1} distance={22}>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight">
                    {p(
                      'Cahiers techniques & retours d’expérience en Guinée',
                      'Technical Briefs & Field Insights in Guinea',
                    )}
                  </h2>
                </ParallaxHorizontalTitle>
                <p className="text-sm text-muted leading-relaxed">
                  {p(
                    'Des guides concrets rédigés par nos directeurs de clientèle, maquettistes et chefs d’atelier à Kaloum.',
                    'Actionable briefs authored by our account directors, print masters and strategists in Kaloum.',
                  )}
                </p>
                <div className="pt-2 flex justify-end border-t border-hairline">
                  <ParallaxSealDrift size={64} tone="ink" offset={22} rotateDeg={38} />
                </div>
              </div>
            }
            scrollingContent={
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {otherPosts.map((post, i) => (
                  <ParallaxColumnStagger key={post.id} index={i} columns={2} amplitude={46}>
                    <RevealBlock preset={i % 2 === 0 ? 'slide-left' : 'slide-right'} delay={i * 0.06} className="h-full">
                      <TiltCard3D intensity={4.5}>
                        <Link
                          to={lang === 'en' ? `/en/insights/${post.slug}` : `/actualites-conseils/${post.slug}`}
                          className="archival-plate group hover:border-[#931916] rounded-[4px] overflow-hidden flex flex-col h-full transition-colors"
                        >
                          <div className="aspect-[16/10] bg-limestone overflow-hidden">
                            <ParallaxImageFrame shiftPct={7}>
                              <img
                                src={post.imageUrl}
                                alt={lang === 'en' ? post.titleEn : post.titleFr}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                               loading="lazy" decoding="async" />
                            </ParallaxImageFrame>
                          </div>
                          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2 text-xs text-muted tabular-nums">
                                <span className="font-semibold text-accent">
                                  {lang === 'en' ? post.categoryEn : post.categoryFr}
                                </span>
                                <span>·</span>
                                <span>{post.publishedAt}</span>
                              </div>
                              <h3 className="font-serif text-2xl font-bold text-ink group-hover:text-accent transition-colors leading-snug">
                                {lang === 'en' ? post.titleEn : post.titleFr}
                              </h3>
                              <p className="text-sm text-muted line-clamp-3 leading-relaxed">
                                {lang === 'en' ? post.excerptEn : post.excerptFr}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                              <span>{p('Lire l’article', 'Read article')}</span>
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                            </span>
                          </div>
                        </Link>
                      </TiltCard3D>
                    </RevealBlock>
                  </ParallaxColumnStagger>
                ))}
              </div>
            }
          />
        </div>
      </section>
    </>
  );
}
