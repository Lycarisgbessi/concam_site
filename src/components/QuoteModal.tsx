import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

export function QuoteModal() {
  const { data, lang, quoteModalOpen, quotePrefill, closeQuoteModal } = useSite();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceSlug, setServiceSlug] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (quoteModalOpen) {
      setServiceSlug(quotePrefill.serviceSlug || data?.services[0]?.slug || 'conseil-communication');
      setMessage(quotePrefill.notes || '');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [quoteModalOpen, quotePrefill, data]);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setStatus('error');
      setErrorMsg(p('Veuillez confirmer votre consentement RGPD.', 'Please accept the privacy consent checkbox.'));
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          organization,
          email,
          phone,
          serviceSlug,
          message,
          source: 'quote_form',
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
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l’envoi');
    }
  };

  return (
    <AnimatePresence>
      {quoteModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#110D0C]/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface text-ink border border-hairline rounded-[4px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_32px_90px_-20px_rgba(0,0,0,0.65)]"
          >
            <div className="bg-[#110D0C] text-white flex items-center justify-between px-6 py-4 border-b border-[#931916]">
              <div>
                <h2 id="quote-modal-title" className="font-serif text-2xl font-bold text-white">
                  {p('Demander un devis gradué', 'Request a Tiered Quote')}
                </h2>
                <p className="text-xs text-white/75 mt-0.5">
                  {p('Réponse officielle sous 24 heures ouvrées', 'Official proposal within 24 business hours')}
                </p>
              </div>
              <button
                type="button"
                onClick={closeQuoteModal}
                aria-label={p('Fermer', 'Close')}
                className="p-2 text-[#D6CEC2] hover:text-white rounded-[4px] hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-page">
              {status === 'success' ? (
                <div className="py-6 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#931916] mx-auto" />
                  <h3 className="font-serif text-xl font-bold text-ink">
                    {p('Demande enregistrée', 'Request Received')}
                  </h3>
                  <p className="text-sm text-muted">
                    {p(
                      'Un conseiller CONCAM analyse votre projet et vous transmettra une proposition graduée sous 24 heures ouvrées.',
                      'A CONCAM advisor is reviewing your brief and will send a tiered proposal within 24 business hours.',
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={closeQuoteModal}
                    className="mt-2 px-5 py-2.5 text-sm font-semibold bg-[#931916] text-white rounded-[4px] hover:bg-[#A30013] transition-colors cursor-pointer"
                  >
                    {p('Fermer la fenêtre', 'Close Window')}
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
                        className="w-full px-3 py-2.5 text-sm bg-surface border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        {p('Organisation / Institution', 'Organization')}
                      </label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-surface border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
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
                        className="w-full px-3 py-2.5 text-sm bg-surface border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
                      />
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
                        className="w-full px-3 py-2.5 text-sm bg-surface border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {p('Service concerné', 'Service')}
                    </label>
                    <select
                      value={serviceSlug}
                      onChange={(e) => setServiceSlug(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-hairline text-ink rounded-[4px] focus:border-[#931916] focus:outline-none"
                    >
                      {data?.services.map((s) => (
                        <option key={s.id} value={s.slug}>
                          {lang === 'en' ? s.titleEn : s.titleFr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {p('Précisions (volumes, délais, supports souhaités)', 'Project details (volume, timeline, format)')}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-surface border border-hairline text-ink placeholder:text-faint rounded-[4px] focus:border-[#931916] focus:outline-none"
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
                        'J’accepte que CONCAM traite ces données uniquement pour préparer ma proposition commerciale, conformément à la ',
                        'I agree that CONCAM processes this data solely to prepare my quote, per our ',
                      )}
                      <Link
                        to={p('/confidentialite', '/en/privacy')}
                        onClick={closeQuoteModal}
                        className="underline text-[#931916] font-medium"
                      >
                        {p('politique de confidentialité', 'privacy policy')}
                      </Link>
                      .
                    </span>
                  </label>

                  {status === 'error' && <p className="text-xs text-[#931916] font-semibold">{errorMsg}</p>}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeQuoteModal}
                      className="px-4 py-2 text-sm font-medium text-muted hover:text-ink cursor-pointer"
                    >
                      {p('Annuler', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="magnetic-sheen px-5 py-2.5 text-sm font-semibold text-white bg-[#931916] hover:bg-[#A30013] rounded-[4px] transition-colors cursor-pointer"
                    >
                      {status === 'submitting' ? p('Envoi...', 'Sending...') : p('Envoyer la demande', 'Submit Request')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
