import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, X, FileDown, CheckCircle2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

type PopupType = 'popup_quote' | 'popup_brochure' | 'popup_newsletter' | null;

const FATIGUE_KEY = 'concam_popup_dismissed_until';
const SESSION_SHOWN_KEY = 'concam_popup_shown_session';

export function WhatsAppAndPopups() {
  const { data, lang, openQuoteModal, trackEvent, cookieConsent, setCookieConsent } = useSite();
  const location = useLocation();
  const [compactWa, setCompactWa] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupType>(null);

  const [pName, setPName] = useState('');
  const [pOrg, setPOrg] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pConsent, setPConsent] = useState(false);
  const [pStatus, setPStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [pError, setPError] = useState('');
  // Double opt-in confirmation link returned by the server for newsletter
  // subscriptions — surfaced in the success panel so the loop is completed
  // even before an SMTP transport is configured.
  const [confirmUrl, setConfirmUrl] = useState<string | null>(null);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 420) setCompactWa(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = window.setTimeout(() => setCompactWa(true), 12000);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    const dismissedUntil = Number(localStorage.getItem(FATIGUE_KEY) || '0');
    if (Date.now() < dismissedUntil) return;
    if (sessionStorage.getItem(SESSION_SHOWN_KEY)) return;

    const triggerPopup = (type: Exclude<PopupType, null>) => {
      if (sessionStorage.getItem(SESSION_SHOWN_KEY)) return;
      sessionStorage.setItem(SESSION_SHOWN_KEY, type);
      setActivePopup(type);
      setPStatus('idle');
      setPError('');
    };

    const isServicePage = location.pathname.includes('/services/');
    const visitCount = Number(localStorage.getItem('concam_visit_count') || '1');

    let minDwellMet = false;
    const dwellTimer = window.setTimeout(() => {
      minDwellMet = true;
      if (visitCount >= 2 && !isServicePage) {
        triggerPopup('popup_newsletter');
      }
    }, 15000);

    const quoteTimer = window.setTimeout(() => {
      triggerPopup('popup_quote');
    }, 60000);

    const onScrollPopup = () => {
      if (!minDwellMet || !isServicePage) return;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0 && window.scrollY / docHeight >= 0.55) {
        triggerPopup('popup_brochure');
      }
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (minDwellMet && e.clientY <= 4) {
        triggerPopup('popup_quote');
      }
    };

    window.addEventListener('scroll', onScrollPopup, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.clearTimeout(dwellTimer);
      window.clearTimeout(quoteTimer);
      window.removeEventListener('scroll', onScrollPopup);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [location.pathname]);

  const dismissPopup = () => {
    localStorage.setItem(FATIGUE_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setActivePopup(null);
  };

  if (location.pathname.startsWith('/admin')) return null;

  const currentService = data?.services.find((s) => location.pathname.includes(`/services/${s.slug}`));
  const waNumber = (data?.settings.whatsappNumber || '+224622857035').replace(/[^\d]/g, '');
  const waText = currentService
    ? lang === 'en'
      ? currentService.whatsappMessageEn
      : currentService.whatsappMessageFr
    : lang === 'en'
    ? data?.settings.whatsappDefaultMsgEn || 'Hello CONCAM Agency'
    : data?.settings.whatsappDefaultMsgFr || 'Bonjour Agence CONCAM';
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;

  const handlePopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pConsent) {
      setPStatus('error');
      setPError(p('Consentement RGPD requis.', 'Privacy consent is required.'));
      return;
    }
    setPStatus('submitting');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activePopup === 'popup_newsletter' ? 'Abonné Veille' : pName,
          organization: pOrg,
          email: pEmail,
          serviceSlug: currentService?.slug || '',
          message:
            activePopup === 'popup_brochure'
              ? 'Téléchargement plaquette institutionnelle CONCAM'
              : 'Inscription veille économique Réussite Magazine',
          source: activePopup || 'popup_brochure',
          consentRgpd: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setPStatus('success');
      setConfirmUrl(typeof json.confirmUrl === 'string' ? json.confirmUrl : null);
      localStorage.setItem(FATIGUE_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } catch (err) {
      setPStatus('error');
      setPError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <>
      {/* Floating WhatsApp Button — Bottom LEFT (strictly opposite Chatbot on Bottom RIGHT) */}
      <motion.a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => trackEvent('whatsapp_click', currentService?.slug || location.pathname)}
        aria-label={p('Contacter CONCAM sur WhatsApp', 'Contact CONCAM on WhatsApp')}
        className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5b] text-[#110D0C] font-semibold text-sm rounded-[4px] shadow-[0_12px_28px_-8px_rgba(37,211,102,0.45)] transition-colors duration-200 px-3.5 py-2.5 focus-visible:outline-2 focus-visible:outline-[#110D0C]"
      >
        <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
        {!compactWa && <span className="whitespace-nowrap hidden sm:inline">WhatsApp</span>}
      </motion.a>

      {/* RGPD Cookie Consent Banner */}
      <AnimatePresence>
        {cookieConsent === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-[#110D0C] border border-white/20 text-white rounded-[4px] p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <p className="text-xs text-white/80 leading-relaxed">
              {p(
                'CONCAM utilise des témoins essentiels au fonctionnement du site et, avec votre accord, des mesures anonymisées de performance et de conversion.',
                'CONCAM uses essential cookies and, with your consent, anonymized performance and conversion analytics.',
              )}{' '}
              <Link to={p('/confidentialite', '/en/privacy')} className="underline text-white hover:text-[#E40014]">
                {p('En savoir plus', 'Learn more')}
              </Link>
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCookieConsent('essential')}
                className="px-3 py-1.5 text-xs border border-white/25 rounded-[4px] text-white/80 hover:text-white cursor-pointer whitespace-nowrap"
              >
                {p('Essentiels uniquement', 'Essential only')}
              </button>
              <button
                type="button"
                onClick={() => setCookieConsent('accepted')}
                className="px-3 py-1.5 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] cursor-pointer whitespace-nowrap"
              >
                {p('Accepter', 'Accept')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sovereign Institutional Lead Capture Pop-ups */}
      <AnimatePresence>
        {activePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#110D0C]/75 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface text-ink border border-hairline rounded-[4px] w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-[#110D0C] border-b border-[#931916] px-5 py-4 flex items-center justify-between text-white">
                <h3 className="font-serif text-xl font-bold text-[#F6F2EA]">
                  {activePopup === 'popup_quote' && p('Recevez une proposition sous 24h ouvrées', 'Receive a Proposal Within 24h')}
                  {activePopup === 'popup_brochure' && p('Télécharger la plaquette CONCAM', 'Download CONCAM Brochure')}
                  {activePopup === 'popup_newsletter' && p('Veille économique Réussite Magazine', 'Réussite Magazine Briefing')}
                </h3>
                <button
                  type="button"
                  onClick={dismissPopup}
                  aria-label={p('Fermer', 'Close')}
                  className="p-1 text-[#D6CEC2] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 bg-page">
                {activePopup === 'popup_quote' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted leading-relaxed">
                      {p(
                        'Vous comparez des prestataires à Conakry ? Obtenez un devis gradué (options papier, volume, délais) adapté à votre budget.',
                        'Comparing agencies in Conakry? Receive a tiered quote tailored to your timeline and budget.',
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        dismissPopup();
                        openQuoteModal({ serviceSlug: currentService?.slug });
                      }}
                      className="magnetic-sheen w-full py-2.5 px-4 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] cursor-pointer transition-colors"
                    >
                      {p('Ouvrir le formulaire pré-rempli', 'Open Pre-filled Quote Form')}
                    </button>
                  </div>
                ) : pStatus === 'success' ? (
                  <div className="py-4 text-center space-y-3">
                    <CheckCircle2 className="w-9 h-9 text-[#931916] mx-auto" />
                    <p className="text-sm text-ink font-medium">
                      {activePopup === 'popup_brochure'
                        ? p('Merci ! Votre plaquette institutionnelle est prête.', 'Thank you! Your agency profile is ready.')
                        : p('Merci ! Dernière étape pour activer votre veille.', 'Thank you! One last step to activate your briefing.')}
                    </p>
                    {activePopup === 'popup_newsletter' &&
                      (confirmUrl ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted leading-relaxed">
                            {p(
                              'Conformément au double opt-in, confirmez votre inscription d’un clic :',
                              'As a double opt-in safeguard, confirm your subscription with one click:',
                            )}
                          </p>
                          <a
                            href={confirmUrl}
                            onClick={() => {
                              trackEvent('newsletter_confirm_click', 'popup_newsletter');
                              dismissPopup();
                            }}
                            className="magnetic-sheen inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px]"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {p('Confirmer mon abonnement', 'Confirm my subscription')}
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-muted leading-relaxed">
                          {p(
                            'Votre inscription est enregistrée et sera activée après confirmation.',
                            'Your subscription is recorded and will be activated after confirmation.',
                          )}
                        </p>
                      ))}
                    {activePopup === 'popup_brochure' && (
                      <a
                        href={`/api/public/brochure.pdf?lang=${lang}`}
                        download
                        onClick={() => {
                          trackEvent('brochure_download', `popup_${lang}`);
                          dismissPopup();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#931916] text-white rounded-[4px]"
                      >
                        <FileDown className="w-4 h-4" />
                        {p('Télécharger la plaquette PDF', 'Download Official PDF Brochure')}
                      </a>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handlePopupSubmit} className="space-y-3">
                    <p className="text-xs text-muted leading-relaxed">
                      {activePopup === 'popup_brochure'
                        ? p(
                            'Recevez la présentation complète de nos références institutionnelles et capacités d’impression.',
                            'Receive our institutional profile, partner references and print capabilities.',
                          )
                        : p(
                            'Chaque mois, les grandes enquêtes entrepreneuriales et analyses de Réussite Magazine.',
                            'Monthly executive insights and economic briefings from Réussite Magazine.',
                          )}
                    </p>

                    {activePopup === 'popup_brochure' && (
                      <>
                        <input
                          type="text"
                          required
                          value={pName}
                          onChange={(e) => setPName(e.target.value)}
                          placeholder={p('Nom complet *', 'Full name *')}
                          className="w-full px-3 py-2.5 text-sm bg-surface border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={pOrg}
                          onChange={(e) => setPOrg(e.target.value)}
                          placeholder={p('Organisation', 'Organization')}
                          className="w-full px-3 py-2.5 text-sm bg-surface border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
                        />
                      </>
                    )}

                    <input
                      type="email"
                      required
                      value={pEmail}
                      onChange={(e) => setPEmail(e.target.value)}
                      placeholder={p('Courriel professionnel *', 'Work email *')}
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
                    />

                    <label className="flex items-start gap-2 text-xs text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pConsent}
                        onChange={(e) => setPConsent(e.target.checked)}
                        className="mt-0.5 accent-[#931916]"
                      />
                      <span>
                        {p(
                          'J’accepte de recevoir ce document / cette veille (désinscription immédiate possible).',
                          'I agree to receive this resource / newsletter (instant unsubscribe anytime).',
                        )}
                      </span>
                    </label>

                    {pStatus === 'error' && <p className="text-xs text-[#931916] font-medium">{pError}</p>}

                    <button
                      type="submit"
                      disabled={pStatus === 'submitting'}
                      className="magnetic-sheen w-full py-2.5 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] cursor-pointer transition-colors"
                    >
                      {pStatus === 'submitting'
                        ? p('Traitement...', 'Submitting...')
                        : activePopup === 'popup_brochure'
                        ? p('Télécharger la plaquette', 'Get Brochure')
                        : p('Valider l’inscription', 'Subscribe')}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
