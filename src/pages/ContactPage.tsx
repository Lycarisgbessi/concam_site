import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import {
  MagneticWrapper,
  ParallaxBackdropPlate,
  ParallaxHorizontalBand,
  ParallaxHorizontalTitle,
  ParallaxScroll3DPlate,
  ParallaxSealDrift,
  ParallaxStickySplit,
  RevealBlock,
  TiltCard3D,
} from '../components/MotionPrimitives';
import { AnimatedPageHeader, LUXURY_HEADER_IMAGES } from '../components/AnimatedPageHeader';

export function ContactPage() {
  const { data, lang, trackEvent } = useSite();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  // Empty default: the <select> below falls back to the first published service,
  // so renaming or reordering services in the CMS never leaves a stale slug.
  const [serviceSlug, setServiceSlug] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  if (!data) return null;
  const { settings, services } = data;
  const effectiveServiceSlug = serviceSlug || services[0]?.slug || '';

  const emailInvalid = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const waHref = `https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
    lang === 'en' ? settings.whatsappDefaultMsgEn : settings.whatsappDefaultMsgFr,
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInvalid) {
      setStatus('error');
      setErrMsg(p('Veuillez saisir une adresse courriel valide.', 'Please enter a valid email address.'));
      return;
    }
    if (!consent) {
      setStatus('error');
      setErrMsg(p('Veuillez confirmer votre consentement RGPD.', 'Privacy consent is required.'));
      return;
    }
    setStatus('submitting');
    setErrMsg('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          organization,
          email,
          phone,
          serviceSlug: effectiveServiceSlug,
          message,
          source: 'contact_form',
          consentRgpd: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setStatus('success');
      setName('');
      setOrganization('');
      setEmail('');
      setPhone('');
      setMessage('');
      setConsent(false);
    } catch (err) {
      setStatus('error');
      setErrMsg(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${settings.mapLng - 0.015}%2C${
    settings.mapLat - 0.01
  }%2C${settings.mapLng + 0.015}%2C${settings.mapLat + 0.01}&layer=mapnik&marker=${settings.mapLat}%2C${settings.mapLng}`;

  const defaultSlides = [
    {
      imageUrl: LUXURY_HEADER_IMAGES.contactStreet,
      captionFr: 'Quartier Manquepas · Commune de Kaloum, Conakry',
      captionEn: 'Manquepas District · Kaloum Municipality, Conakry',
    },
    {
      imageUrl: LUXURY_HEADER_IMAGES.contactOffice,
      captionFr: 'Accueil sur rendez-vous et réponse garantie sous 24 heures ouvrées',
      captionEn: 'Consultations by appointment and 24-hour response pledge',
    },
  ];
  const headerSlides =
    data.pageContent.pageHeaders?.contact && data.pageContent.pageHeaders.contact.length > 0
      ? data.pageContent.pageHeaders.contact
      : defaultSlides;

  return (
    <>
      <SeoHead routeKey="contact" />

      <AnimatedPageHeader
        compact
        slides={headerSlides}
        breadcrumbs={[{ label: 'Contact' }]}
        kicker={p('Siège social · Conakry', 'Headquarters · Conakry')}
        title={p('Parlons de votre projet', 'Let’s Discuss Your Project')}
        subtitle={p(
          'Toutes nos coordonnées sont gérées en temps réel depuis notre administration. Réponse garantie sous 24 heures ouvrées.',
          'Reach our Kaloum office directly by phone, email or WhatsApp. Response guaranteed within 24 business hours.',
        )}
      />

      <section
        style={{ zIndex: 20 }}
        className="relative py-20 lg:py-24 bg-page text-ink overflow-x-clip border-t-2 border-[#931916] shadow-[0_-28px_72px_-12px_rgba(17,13,12,0.45)]"
      >
        <ParallaxBackdropPlate variant="light-grid" offset={112} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <ParallaxStickySplit
            stickySide="left"
            amplitude={42}
            stickyClassName="lg:col-span-5"
            scrollingClassName="lg:col-span-7"
            stickyContent={
              <RevealBlock preset="slide-left" className="space-y-6">
                <TiltCard3D intensity={4}>
                  <div className="archival-plate rounded-[4px] p-7 space-y-5 text-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-hairline pb-4">
                      <ParallaxHorizontalTitle direction={-1} distance={18}>
                        <p className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
                          {p('Coordonnées directes', 'Direct Coordinates')}
                        </p>
                      </ParallaxHorizontalTitle>
                      <ParallaxSealDrift size={56} tone="ink" offset={18} rotateDeg={36} />
                    </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-ink">{p('Adresse', 'Address')}</p>
                      <p className="text-muted">{lang === 'en' ? settings.address.en : settings.address.fr}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-ink">{p('Téléphones', 'Phones')}</p>
                      <div className="space-y-1 tabular-nums text-xs sm:text-sm">
                        {settings.phones.map((ph) => (
                          <a key={ph} href={`tel:${ph.replace(/\s+/g, '')}`} className="block text-ink hover:text-accent transition-colors">
                            {ph}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-ink">{p('Courriels', 'Emails')}</p>
                      <a href={`mailto:${settings.agencyEmail}`} className="block text-accent font-medium hover:underline">
                        {settings.agencyEmail}
                      </a>
                      <a href={`mailto:${settings.magazineEmail}`} className="block text-xs text-muted hover:underline">
                        {settings.magazineEmail} ({p('Magazine', 'Magazine')})
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-ink">{p('Horaires d’ouverture', 'Opening Hours')}</p>
                      <p className="text-muted">{lang === 'en' ? settings.hoursEn : settings.hoursFr}</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <MagneticWrapper strength={0.18}>
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('whatsapp_click', 'contact_page')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#25D366] hover:brightness-95 text-[#110D0C] rounded-[4px] transition-[filter]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{p('Écrire sur WhatsApp', 'Message on WhatsApp')}</span>
                      </a>
                    </MagneticWrapper>

                    {(settings.socialFacebook || settings.socialLinkedin || settings.socialTiktok) && (
                      <div className="pt-3 border-t border-hairline flex flex-wrap items-center gap-4 text-xs text-muted">
                        <span className="font-semibold text-ink">{p('Réseaux officiels :', 'Official Channels:')}</span>
                        {settings.socialFacebook && (
                          <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                            Facebook
                          </a>
                        )}
                        {settings.socialLinkedin && (
                          <a href={settings.socialLinkedin} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                            LinkedIn
                          </a>
                        )}
                        {settings.socialTiktok && (
                          <a href={settings.socialTiktok} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                            TikTok
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TiltCard3D>

              <div className="archival-plate rounded-[4px] overflow-hidden h-72">
                <iframe
                  title="Localisation Agence CONCAM Manquepas Kaloum Conakry"
                  src={mapSrc}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </RevealBlock>
            }
            scrollingContent={
              <ParallaxScroll3DPlate direction={1} tiltX={6} tiltY={4} liftY={40}>
                <RevealBlock preset="slide-right" delay={0.08} className="archival-plate rounded-[4px] p-7 sm:p-10 h-fit">
                  <ParallaxHorizontalTitle direction={1} distance={24}>
                    <h2 className="font-serif text-3xl font-bold text-ink mb-2">
                      {p('Formulaire de contact & demande de devis', 'Contact & Quote Inquiry')}
                    </h2>
                  </ParallaxHorizontalTitle>
                  <p className="text-xs font-medium text-accent mb-6">
                    {p('Tous les champs marqués * sont obligatoires.', 'Fields marked * are required.')}
                  </p>

            {status === 'success' ? (
              <div className="bg-limestone border border-hairline rounded-[4px] p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-accent mx-auto" />
                <h3 className="font-serif text-xl font-bold text-ink">
                  {p('Message envoyé avec succès', 'Message Sent Successfully')}
                </h3>
                <p className="text-sm text-muted">
                  {p(
                    'Merci pour votre confiance. Un conseiller CONCAM vous répondra sous 24 heures ouvrées.',
                    'Thank you for reaching out. A CONCAM advisor will respond within 24 business hours.',
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-2 px-4 py-2 text-xs font-semibold border border-hairline bg-surface text-ink rounded-[4px] cursor-pointer"
                >
                  {p('Envoyer un autre message', 'Send another message')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {p('Nom complet *', 'Full name *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink rounded-[4px] focus:border-[#931916] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {p('Organisation / Entreprise', 'Organization / Company')}
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink rounded-[4px] focus:border-[#931916] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {p('Courriel professionnel *', 'Work email *')}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-sm bg-page border text-ink rounded-[4px] focus:outline-none ${
                        emailInvalid ? 'border-[#A30013]' : 'border-hairline focus:border-[#931916]'
                      }`}
                    />
                    {emailInvalid && (
                      <p className="text-[11px] text-accent font-medium mt-1">
                        {p('Format de courriel invalide.', 'Invalid email format.')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {p('Téléphone / WhatsApp', 'Phone / WhatsApp')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+224 ..."
                      className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {p('Service concerné', 'Service')}
                  </label>
                  <select
                    value={effectiveServiceSlug}
                    onChange={(e) => setServiceSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink rounded-[4px] focus:border-[#931916] focus:outline-none"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {lang === 'en' ? s.titleEn : s.titleFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {p('Votre message *', 'Your message *')}
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={p(
                      'Précisez votre besoin, vos volumes ou échéances...',
                      'Tell us about your project scope, quantities or deadline...',
                    )}
                    className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 accent-[#931916]"
                  />
                  <span>
                    {p(
                      'J’accepte que CONCAM utilise ces coordonnées pour traiter ma demande, conformément à la ',
                      'I consent to CONCAM using these details to process my request under our ',
                    )}
                    <Link to={p('/confidentialite', '/en/privacy')} className="underline text-accent font-medium">
                      {p('politique de confidentialité', 'privacy policy')}
                    </Link>
                    .
                  </span>
                </label>

                {status === 'error' && <p className="text-xs text-accent font-semibold">{errMsg}</p>}

                <MagneticWrapper strength={0.2}>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="magnetic-sheen px-6 py-3 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] transition-colors cursor-pointer"
                  >
                    {status === 'submitting' ? p('Envoi en cours...', 'Sending...') : p('Envoyer le message', 'Send Message')}
                  </button>
                </MagneticWrapper>
              </form>
            )}
          </RevealBlock>
              </ParallaxScroll3DPlate>
            }
          />
        </div>
      </section>

      <ParallaxHorizontalBand
        tone="dark"
        travel={135}
        primaryItems={[
          p('MANQUEPAS · COMMUNE DE KALOUM', 'MANQUEPAS · KALOUM MUNICIPALITY'),
          p('CONAKRY · RÉPUBLIQUE DE GUINÉE', 'CONAKRY · REPUBLIC OF GUINEA'),
          p('RÉPONSE SOUS 24H OUVRÉES', '24H BUSINESS RESPONSE'),
        ]}
      />
    </>
  );
}
