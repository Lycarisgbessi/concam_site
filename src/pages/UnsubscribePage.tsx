import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MailX } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { AnimatedPageHeader, LUXURY_HEADER_IMAGES } from '../components/AnimatedPageHeader';
import { ParallaxBackdropPlate, ParallaxHorizontalTitle, ParallaxLayer } from '../components/MotionPrimitives';
import { useSite } from '../context/SiteContext';

export function UnsubscribePage() {
  const { lang } = useSite();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/leads/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idParam || undefined,
          email: email.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setStatus('done');
      setMessage(
        json.removed > 0
          ? p(
              'Votre adresse a été retirée immédiatement de nos listes de diffusion conformément au RGPD.',
              'Your address has been immediately removed from our mailing lists in compliance with GDPR.',
            )
          : p(
              'Aucune inscription active correspondante n’a été trouvée (déjà désinscrit).',
              'No active subscription matched your request (already unsubscribed).',
            ),
      );
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <>
      <SeoHead
        customTitle={p('Désinscription — CONCAM & Réussite Magazine', 'Unsubscribe — CONCAM & Réussite Magazine')}
      />

      <AnimatedPageHeader
        compact
        slides={[{ imageUrl: LUXURY_HEADER_IMAGES.unsubscribeDesk }]}
        breadcrumbs={[{ label: p('Désinscription RGPD', 'GDPR Unsubscribe') }]}
        kicker={p('Protection des données personnelles', 'Data Privacy')}
        title={p('Désinscription de la veille économique', 'Unsubscribe from Newsletter')}
      />

      <section className="relative bg-page py-16 overflow-x-clip">
        <ParallaxBackdropPlate variant="editorial-lines" offset={76} />
        <div className="max-w-lg mx-auto px-4 relative z-10">
          <ParallaxLayer offset={34}>
            <div className="archival-plate rounded-[4px] p-6 sm:p-8 space-y-5">
          {status === 'done' ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-10 h-10 text-accent mx-auto" />
              <p className="text-sm text-ink leading-relaxed">{message}</p>
              <Link
                to={p('/', '/en')}
                className="inline-block px-5 py-2.5 text-xs font-semibold bg-[#110D0C] text-[#F6F2EA] rounded-[4px]"
              >
                {p('Retour à l’accueil CONCAM', 'Back to CONCAM Home')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUnsubscribe} className="space-y-4">
              <div className="flex items-center gap-3 text-accent">
                <MailX className="w-6 h-6 shrink-0" />
                <ParallaxHorizontalTitle direction={1} distance={18}>
                  <h2 className="font-serif text-2xl font-bold text-ink">
                    {p('Retrait immédiat en un clic', 'Instant One-Click Removal')}
                  </h2>
                </ParallaxHorizontalTitle>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {p(
                  'Confirmez votre adresse courriel pour supprimer vos données de diffusion de Réussite Magazine et des communications commerciales CONCAM.',
                  'Confirm your email address to remove your details from Réussite Magazine and CONCAM communications.',
                )}
              </p>
              {!idParam && (
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {p('Adresse courriel concernée', 'Email address')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@organisation.gn"
                    className="w-full px-3.5 py-2.5 text-sm bg-page border border-hairline rounded-[4px] text-ink focus:border-[#931916] focus:outline-none"
                  />
                </div>
              )}
              {status === 'error' && <p className="text-xs text-accent font-medium">{message}</p>}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-2.5 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] cursor-pointer transition-colors"
              >
                {status === 'submitting'
                  ? p('Traitement...', 'Processing...')
                  : p('Confirmer ma désinscription', 'Confirm Unsubscribe')}
              </button>
            </form>
          )}
            </div>
          </ParallaxLayer>
        </div>
      </section>
    </>
  );
}
