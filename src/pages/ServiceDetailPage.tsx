import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ArrowRight, ArrowUpRight, CheckCircle2, ChevronDown } from 'lucide-react';
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

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, lang, trackEvent } = useSite();
  const [activeOfferingIdx, setActiveOfferingIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  if (!data) return null;
  const service = data.services.find((s) => s.slug === slug);

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center space-y-4 text-ink">
        <h1 className="font-serif text-3xl font-bold">{p('Service introuvable', 'Service not found')}</h1>
        <Link to={p('/services', '/en/services')} className="text-accent font-semibold underline">
          {p('Retour au catalogue des services', 'Back to services')}
        </Link>
      </div>
    );
  }

  // Gallery items related to this service: prioritise the gallery categories
  // naturally attached to the service's pillar, then fall back to the most
  // recent items so the section never looks empty for a new service.
  const SERVICE_GALLERY_CATEGORIES: Record<string, string[]> = {
    'conseil-communication': ['identite-visuelle', 'evenementiel'],
    'manuels-supports': ['supports-manuels'],
    'marquage-gadgets-publicitaires': ['marquage-objets'],
    'impression-numerique-offset': ['imprimerie-grands-formats'],
  };
  const preferredCategories = SERVICE_GALLERY_CATEGORIES[service.slug] || [];
  const matchingGallery = data.galleryItems.filter((g) => preferredCategories.includes(g.categorySlug));
  const relatedGallery = matchingGallery.length > 0 ? matchingGallery.slice(0, 3) : data.galleryItems.slice(0, 3);
  const title = lang === 'en' ? service.titleEn : service.titleFr;
  const tagline = lang === 'en' ? service.taglineEn : service.taglineFr;
  const summary = lang === 'en' ? service.summaryEn : service.summaryFr;
  const benefits = lang === 'en' ? service.benefitsEn : service.benefitsFr;

  const headerSlides = [
    {
      imageUrl: service.imageUrl,
      captionFr: `${service.titleFr} — Atelier CONCAM Conakry`,
      captionEn: `${service.titleEn} — CONCAM Conakry Studio`,
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.serviceDetailProofing,
      captionFr: 'Exigence éditoriale et finitions sur mesure',
      captionEn: 'Editorial precision and bespoke finishing',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.serviceDetailHandover,
      captionFr: 'Accompagnement stratégique dédié de bout en bout',
      captionEn: 'End-to-end dedicated strategic advisory',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setStatus('error');
      setErrMsg(p('Veuillez accepter le consentement RGPD.', 'Privacy consent required.'));
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          organization: org,
          email,
          phone,
          serviceSlug: service.slug,
          message,
          source: 'quote_form',
          consentRgpd: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setStatus('success');
      setName('');
      setOrg('');
      setEmail('');
      setPhone('');
      setMessage('');
      setConsent(false);
    } catch (err) {
      setStatus('error');
      setErrMsg(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <>
      <SeoHead
        customTitle={`${title} — CONCAM Conakry`}
        customDescription={tagline}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: title,
            description: summary,
            provider: { '@type': 'Organization', name: data.settings.companyName },
            areaServed: 'Conakry, République de Guinée',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: service.faqs.map((f) => ({
              '@type': 'Question',
              name: lang === 'en' ? f.questionEn : f.questionFr,
              acceptedAnswer: {
                '@type': 'Answer',
                text: lang === 'en' ? f.answerEn : f.answerFr,
              },
            })),
          },
        ]}
      />

      <AnimatedPageHeader
        compact
        slides={headerSlides}
        breadcrumbs={[
          { label: 'Services', to: p('/services', '/en/services') },
          { label: title },
        ]}
        kicker={p('Pôle d’expertise CONCAM', 'CONCAM Service Pillar')}
        title={title}
        subtitle={tagline}
      >
        <MagneticWrapper strength={0.2}>
          <a
            href="#service-quote"
            className="magnetic-sheen group inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] transition-colors whitespace-nowrap"
          >
            <span>{p('Demander un devis pour ce service', 'Request a Quote for this Service')}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </MagneticWrapper>
      </AnimatedPageHeader>

      {/* Split Editorial Scope & Benefits on Archival Ivory with Curtain Overlap */}
      <ParallaxCurtainSection zIndex={20} topAccent>
        <section className="relative py-20 lg:py-24 bg-page text-ink border-b border-hairline overflow-x-clip">
          <ParallaxBackdropPlate variant="light-grid" offset={112} />
          <ParallaxOppositeSplit
            amplitude={70}
          className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10"
          leftClassName="lg:col-span-6"
          rightClassName="lg:col-span-6"
          left={
            <RevealBlock preset="slide-left" className="space-y-6">
              <ParallaxHorizontalTitle direction={-1} distance={22}>
                <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                  {p('Notre approche métier', 'Strategic Methodology')}
                </p>
              </ParallaxHorizontalTitle>
              <p className="text-base sm:text-lg text-muted leading-relaxed">{summary}</p>
              <ul className="divide-y divide-hairline border-y border-hairline">
                {benefits.map((b, i) => (
                  <li key={i} className="py-3.5 flex items-start gap-3 text-sm text-ink">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </RevealBlock>
          }
          right={
            <ParallaxScroll3DPlate direction={-1} tiltX={8} tiltY={6} liftY={46}>
              <TiltCard3D intensity={4.5}>
                <div className="aspect-[4/3] rounded-[4px] overflow-hidden border border-hairline bg-limestone shadow-lg">
                  <ParallaxImageFrame shiftPct={8}>
                    <ClipCurtainReveal direction="right" className="w-full h-full">
                      <img
                        src={service.imageUrl}
                        alt={title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                       loading="lazy" decoding="async" />
                    </ClipCurtainReveal>
                  </ParallaxImageFrame>
                </div>
              </TiltCard3D>
            </ParallaxScroll3DPlate>
          }
        />
        </section>
      </ParallaxCurtainSection>

      {/* Interactive Motion Tabs for Offerings on Warm Limestone */}
      <ParallaxCurtainSection zIndex={25} topAccent>
        <section className="relative py-20 bg-limestone text-ink border-b border-hairline overflow-x-clip">
          <ParallaxBackdropPlate variant="editorial-lines" offset={108} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 relative z-10">
          <div className="space-y-2">
            <ParallaxHorizontalTitle direction={-1} distance={20}>
              <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                {p('Architecture de l’offre', 'Deliverables Architecture')}
              </p>
            </ParallaxHorizontalTitle>
            <ParallaxHorizontalTitle direction={1} distance={26}>
              <SplitTextReveal
                as="h2"
                text={p('Déclinaisons de l’offre', 'Service Scope & Deliverables')}
                className="font-serif text-3xl sm:text-4xl font-bold text-ink"
              />
            </ParallaxHorizontalTitle>
          </div>

          <div className="flex flex-wrap gap-2">
            {service.offerings.map((off, idx) => {
              const active = activeOfferingIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveOfferingIdx(idx)}
                  className={`relative px-4 py-2.5 text-sm font-semibold rounded-[4px] border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'text-white border-[#931916]'
                      : 'bg-surface border-hairline text-muted hover:text-ink hover:border-[#931916]/50'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="service-offering-tab"
                      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                      className="absolute inset-0 bg-[#931916] rounded-[3px] z-0"
                    />
                  )}
                  <span className="relative z-10">{lang === 'en' ? off.titleEn : off.titleFr}</span>
                </button>
              );
            })}
          </div>

          <ParallaxScroll3DPlate direction={1} tiltX={6} tiltY={4} liftY={40}>
            <AnimatePresence mode="wait">
              {service.offerings[activeOfferingIdx] && (
                <motion.div
                  key={activeOfferingIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="archival-plate rounded-[4px] p-7 sm:p-9 space-y-3"
                >
                  <p className="font-serif text-xs font-semibold text-accent uppercase tracking-wider">
                    {ROMAN[activeOfferingIdx] || activeOfferingIdx + 1} · {title}
                  </p>
                  <h3 className="font-serif text-2xl font-bold text-ink">
                    {lang === 'en'
                      ? service.offerings[activeOfferingIdx].titleEn
                      : service.offerings[activeOfferingIdx].titleFr}
                  </h3>
                  <p className="text-base text-muted leading-relaxed max-w-3xl">
                    {lang === 'en'
                      ? service.offerings[activeOfferingIdx].descEn
                      : service.offerings[activeOfferingIdx].descFr}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </ParallaxScroll3DPlate>
        </div>
        </section>
      </ParallaxCurtainSection>

      {/* Sticky Execution Protocol + Staggered Process Cards on Archival Ivory */}
      <section
        style={{ zIndex: 30 }}
        className="relative py-20 lg:py-24 bg-page text-ink border-b border-hairline overflow-x-clip shadow-[0_-24px_64px_-14px_rgba(17,13,12,0.4)]"
      >
        <ParallaxBackdropPlate variant="light-grid" offset={110} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <ParallaxStickySplit
            stickySide="left"
            amplitude={40}
            stickyClassName="lg:col-span-4"
            scrollingClassName="lg:col-span-8"
            stickyContent={
              <div className="space-y-5">
                <ParallaxHorizontalTitle direction={-1} distance={20}>
                  <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                    {p('Méthode d’exécution', 'Execution Protocol')}
                  </p>
                </ParallaxHorizontalTitle>
                <ParallaxHorizontalTitle direction={1} distance={24}>
                  <SplitTextReveal
                    as="h2"
                    text={p('Processus de réalisation en 4 étapes', 'Our 4-Step Execution Workflow')}
                    className="font-serif text-3xl sm:text-4xl font-bold text-ink"
                  />
                </ParallaxHorizontalTitle>
                <EngravedRuleReveal tone="light" align="left" />
                <p className="text-sm text-muted leading-relaxed">
                  {p(
                    'Chaque étape suit un contrôle qualité rigoureux depuis l’atelier de Kaloum jusqu’à la livraison finale.',
                    'Each phase enforces strict quality gates from our Kaloum studio through final delivery.',
                  )}
                </p>
                <div className="pt-2">
                  <ParallaxSealDrift size={84} tone="ink" offset={24} rotateDeg={42} />
                </div>
              </div>
            }
            scrollingContent={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {service.processSteps.map((st, idx) => (
                  <ParallaxColumnStagger key={st.step} index={idx} columns={2} amplitude={44}>
                    <RevealBlock preset={idx % 2 === 0 ? 'slide-left' : 'slide-right'} delay={idx * 0.07} className="h-full">
                      <TiltCard3D intensity={4.5}>
                        <div className="archival-plate hover:border-[#931916] rounded-[4px] p-6 h-full space-y-3.5 transition-colors">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-[4px] bg-[#110D0C] border border-[#931916] text-white font-serif text-sm font-bold tabular-nums">
                            {ROMAN[idx] || `0${st.step}`}
                          </span>
                          <h3 className="font-serif text-xl font-bold text-ink">
                            {lang === 'en' ? st.titleEn : st.titleFr}
                          </h3>
                          <p className="text-sm text-muted leading-relaxed">
                            {lang === 'en' ? st.descEn : st.descFr}
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

      <ParallaxHorizontalBand
        tone="dark"
        travel={145}
        primaryItems={[
          title.toUpperCase(),
          p('ATELIER KALOUM · CONAKRY', 'KALOUM STUDIO · CONAKRY'),
          p('PRÉCISION & FINITION', 'PRECISION & FINISHING'),
        ]}
        secondaryItems={[
          p('CONSEIL STRATÉGIQUE', 'STRATEGIC ADVISORY'),
          p('IMPRESSION OFFSET', 'OFFSET PRINTING'),
          p('MARQUAGE PUBLICITAIRE', 'BRANDING'),
        ]}
      />

      {/* Contextual Media Gateway + Related Gallery on Sovereign Dark with Curtain Overlap */}
      <ParallaxCurtainSection zIndex={35} topAccent>
        <section className="relative py-20 bg-[#110D0C] text-white border-b border-white/15 overflow-x-clip">
          <ParallaxBackdropPlate variant="dark-grid" offset={115} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <ParallaxHorizontalTitle direction={1} distance={26}>
              <h2 className="font-serif text-3xl font-bold text-white">
                {p('Réalisations associées', 'Related Case Studies')}
              </h2>
            </ParallaxHorizontalTitle>
            <Link to={p('/galerie', '/en/gallery')} className="editorial-link text-sm font-semibold text-white hover:text-[#E40014]">
              {p('Toute la galerie', 'Full Gallery')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedGallery.map((g, i) => (
              <ParallaxColumnStagger key={g.id} index={i} columns={3} amplitude={46}>
                <RevealBlock preset="fade-up" delay={i * 0.06} className="h-full">
                  <TiltCard3D intensity={4.5}>
                    <Link
                      to={`${p('/galerie', '/en/gallery')}?item=${g.id}`}
                      className="group block sovereign-plate rounded-[4px] overflow-hidden hover:border-[#931916] h-full transition-colors"
                    >
                      <div className="aspect-[4/3] bg-[#1A1312] overflow-hidden">
                        <ParallaxImageFrame shiftPct={7}>
                          <img
                            src={g.images[0]}
                            alt={lang === 'en' ? g.titleEn : g.titleFr}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                           loading="lazy" decoding="async" />
                        </ParallaxImageFrame>
                      </div>
                      <div className="p-5 space-y-1.5">
                        <p className="text-xs font-medium text-[#E40014]">{g.clientOrSector}</p>
                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#E40014] transition-colors">
                          {lang === 'en' ? g.titleEn : g.titleFr}
                        </h3>
                      </div>
                    </Link>
                  </TiltCard3D>
                </RevealBlock>
              </ParallaxColumnStagger>
            ))}
          </div>

          {data.mediaHub.reussiteMagazineEnabled && (
            <ParallaxScroll3DPlate direction={-1} tiltX={6} tiltY={4} liftY={38}>
              <div className="sovereign-plate rounded-[4px] p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-xl font-bold text-white">
                    {p(
                      'Voir nos portraits d’entrepreneurs et décryptages dans Réussite Magazine',
                      'Read executive interviews and business insights in Réussite Magazine',
                    )}
                  </p>
                  <p className="text-xs font-medium text-[#E40014] mt-1">{data.mediaHub.reussiteMagazineUrl}</p>
                </div>
                <a
                  href={data.mediaHub.reussiteMagazineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('media_outbound', `service_${service.slug}`)}
                  className="magnetic-sheen inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] border border-[#931916] text-white rounded-[4px] transition-colors shrink-0"
                >
                  <span>{p('Visiter le magazine', 'Visit Magazine')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </ParallaxScroll3DPlate>
          )}
        </div>
        </section>
      </ParallaxCurtainSection>

      {/* Animated FAQ + Crisp Archival Quote Form with Curtain Overlap */}
      <ParallaxCurtainSection zIndex={40} topAccent>
        <section id="service-quote" className="relative py-20 bg-page text-ink overflow-x-clip">
          <ParallaxBackdropPlate variant="editorial-lines" offset={106} />
          <ParallaxOppositeSplit
            amplitude={62}
          className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10"
          leftClassName="lg:col-span-5"
          rightClassName="lg:col-span-7"
          left={
            <RevealBlock preset="slide-left" className="space-y-5">
              <ParallaxHorizontalTitle direction={-1} distance={20}>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                  {p('Questions fréquentes', 'Frequently Asked Questions')}
                </h2>
              </ParallaxHorizontalTitle>
              <div className="space-y-3">
                {service.faqs.map((faq, idx) => {
                  const open = openFaqIdx === idx;
                  return (
                    <div key={idx} className="archival-plate rounded-[4px] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(open ? null : idx)}
                        className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 text-sm font-semibold text-ink hover:bg-limestone/50 transition-colors cursor-pointer"
                      >
                        <span>{lang === 'en' ? faq.questionEn : faq.questionFr}</span>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 text-accent transition-transform duration-300 ${
                            open ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-hairline pt-3">
                              {lang === 'en' ? faq.answerEn : faq.answerFr}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </RevealBlock>
          }
          right={
            <RevealBlock preset="slide-right" delay={0.08} className="archival-plate rounded-[4px] p-7 sm:p-9">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-1">
              {p(`Demander un devis — ${title}`, `Request a Quote — ${title}`)}
            </h2>
            <p className="text-xs font-medium text-accent mb-6">
              {p(
                'Service pré-sélectionné · Réponse graduée sous 24 heures ouvrées',
                'Pre-selected service · Tiered proposal within 24 business hours',
              )}
            </p>

            {status === 'success' ? (
              <div className="bg-limestone border border-hairline rounded-[4px] p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-accent mx-auto" />
                <h3 className="font-serif text-lg font-bold text-ink">{p('Demande envoyée', 'Request Sent')}</h3>
                <p className="text-sm text-muted">
                  {p(
                    'Votre demande de devis a bien été transmise à l’équipe CONCAM.',
                    'Your quote request has been transmitted to the CONCAM team.',
                  )}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={p('Nom complet *', 'Full name *')}
                    className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink placeholder:text-faint focus:border-[#931916] focus:outline-none rounded-[4px]"
                  />
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder={p('Organisation / Société', 'Organization / Company')}
                    className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink placeholder:text-faint focus:border-[#931916] focus:outline-none rounded-[4px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={p('Courriel professionnel *', 'Work email *')}
                    className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink placeholder:text-faint focus:border-[#931916] focus:outline-none rounded-[4px]"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={p('Téléphone / WhatsApp', 'Phone / WhatsApp')}
                    className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink placeholder:text-faint focus:border-[#931916] focus:outline-none rounded-[4px]"
                  />
                </div>
                <input
                  type="text"
                  readOnly
                  value={title}
                  aria-label={p('Service sélectionné', 'Selected service')}
                  className="w-full px-3.5 py-2.5 text-sm bg-limestone border border-[#931916]/45 text-ink font-semibold rounded-[4px]"
                />
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={p(
                    'Décrivez votre besoin (quantités, format, échéance souhaitée)...',
                    'Describe your scope (quantities, format, target deadline)...',
                  )}
                  className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink placeholder:text-faint focus:border-[#931916] focus:outline-none rounded-[4px]"
                />
                <label className="flex items-start gap-2 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 accent-[#931916]"
                  />
                  <span>
                    {p(
                      'J’accepte le traitement de mes coordonnées par CONCAM pour répondre à cette demande.',
                      'I consent to CONCAM processing my details to respond to this inquiry.',
                    )}
                  </span>
                </label>
                {status === 'error' && <p className="text-xs text-accent font-semibold">{errMsg}</p>}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="magnetic-sheen px-6 py-3 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] transition-colors cursor-pointer"
                >
                  {status === 'submitting' ? p('Envoi en cours...', 'Sending...') : p('Envoyer la demande de devis', 'Submit Quote Request')}
                </button>
              </form>
            )}
          </RevealBlock>
          }
        />
        </section>
      </ParallaxCurtainSection>
    </>
  );
}
