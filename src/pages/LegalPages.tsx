import React from 'react';
import { useSite } from '../context/SiteContext';
import { SeoHead } from '../components/SeoHead';
import {
  ParallaxBackdropPlate,
  ParallaxHorizontalTitle,
  ParallaxLayer,
  ParallaxSealDrift,
  RevealBlock,
  TiltCard3D,
} from '../components/MotionPrimitives';
import { AnimatedPageHeader, LUXURY_HEADER_IMAGES } from '../components/AnimatedPageHeader';

export function LegalNoticePage() {
  const { data, lang } = useSite();
  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);
  if (!data) return null;
  const { settings } = data;

  return (
    <>
      <SeoHead customTitle={p('Mentions légales — CONCAM', 'Legal Notice — CONCAM')} />

      <AnimatedPageHeader
        compact
        slides={[
          { imageUrl: LUXURY_HEADER_IMAGES.legalDocs },
          { imageUrl: LUXURY_HEADER_IMAGES.privacyShield },
        ]}
        breadcrumbs={[{ label: p('Mentions légales', 'Legal Notice') }]}
        kicker={p('Informations réglementaires · Conakry', 'Regulatory Disclosures · Conakry')}
        title={p('Mentions légales', 'Legal Notice')}
      />

      <section className="relative py-16 lg:py-20 bg-page text-ink overflow-x-clip">
        <ParallaxBackdropPlate variant="editorial-lines" offset={78} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 text-sm text-muted leading-relaxed relative z-10">
          <ParallaxLayer offset={34}>
            <RevealBlock preset="fade-up">
              <TiltCard3D intensity={3.5}>
                <div className="archival-plate space-y-3 p-7 rounded-[4px] relative">
                  <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3 mb-2">
                    <ParallaxHorizontalTitle direction={1} distance={20}>
                      <span className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-[#931916]">
                        {p('Fiche légale officielle', 'Official Legal Registry')}
                      </span>
                    </ParallaxHorizontalTitle>
                    <ParallaxSealDrift size={52} tone="ink" offset={16} rotateDeg={34} />
                  </div>
                  <p>
                    <strong className="text-ink">{p('Éditeur du site :', 'Publisher:')}</strong> {settings.companyName} ({settings.brandAlias})
                  </p>
                  <p>
                    <strong className="text-ink">{p('Forme juridique :', 'Legal Form:')}</strong> {settings.legalForm}
                  </p>
                  <p>
                    <strong className="text-ink">RCCM :</strong>{' '}
                    <span className="font-semibold text-[#931916] tabular-nums">{settings.rccm}</span>
                  </p>
                  <p>
                    <strong className="text-ink">{p('Identifiants fiscaux :', 'Tax Registration:')}</strong>{' '}
                    <span className="tabular-nums font-medium text-ink">NCC {settings.ncc} · NIF {settings.nif}</span> ({settings.taxCategory})
                  </p>
                  <p>
                    <strong className="text-ink">{p('Siège social :', 'Headquarters:')}</strong>{' '}
                    {lang === 'en' ? settings.address.en : settings.address.fr}
                  </p>
                  <p>
                    <strong className="text-ink">{p('Contact :', 'Contact:')}</strong> {settings.agencyEmail} · {settings.phones.join(' / ')}
                  </p>
                </div>
              </TiltCard3D>
            </RevealBlock>
          </ParallaxLayer>
          <p>
            {p(
              'L’ensemble des contenus éditoriaux, photographies, marques, logotypes CONCAM et Réussite Magazine présents sur ce site sont protégés au titre de la propriété intellectuelle.',
              'All editorial content, photography, trademarks, CONCAM and Réussite Magazine brand marks on this site are protected under intellectual property law.',
            )}
          </p>
        </div>
      </section>
    </>
  );
}

export function PrivacyPolicyPage() {
  const { data, lang } = useSite();
  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);
  if (!data) return null;
  const { settings } = data;

  return (
    <>
      <SeoHead customTitle={p('Politique de confidentialité & RGPD — CONCAM', 'Privacy Policy & GDPR — CONCAM')} />

      <AnimatedPageHeader
        compact
        slides={[
          { imageUrl: LUXURY_HEADER_IMAGES.privacyShield },
          { imageUrl: LUXURY_HEADER_IMAGES.legalDocs },
        ]}
        breadcrumbs={[{ label: p('Confidentialité & RGPD', 'Privacy & GDPR') }]}
        kicker={p('Gouvernance des données · RGPD', 'Data Governance · GDPR')}
        title={p('Politique de protection des données personnelles', 'Personal Data & Privacy Policy')}
      />

      <section className="relative py-16 lg:py-20 bg-page text-ink overflow-x-clip">
        <ParallaxBackdropPlate variant="editorial-lines" offset={78} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 text-sm text-muted leading-relaxed relative z-10">
          <ParallaxLayer offset={32}>
            <div className="archival-plate rounded-[4px] p-7 sm:p-9 space-y-6">
              <p>
                {p(
                  `${settings.companyName} s’engage à protéger les données personnelles collectées sur son site institutionnel conformément à la législation guinéenne en vigueur et aux principes du Règlement général sur la protection des données (RGPD).`,
                  `${settings.companyName} is committed to safeguarding personal data collected via its institutional website in compliance with applicable Guinean data protection law and GDPR principles.`,
                )}
              </p>

              <h2 className="font-serif text-2xl font-bold text-ink pt-4 border-t border-hairline">
                {p('1. Finalités & minimisation', '1. Purposes & Data Minimization')}
              </h2>
              <p>
                {p(
                  'Les données transmises via les formulaires de devis, de contact, les fenêtres de téléchargement ou le Conseiller CONCAM sont exclusivement utilisées pour traiter votre demande commerciale, planifier un rappel ou vous adresser la veille économique de Réussite Magazine après double confirmation.',
                  'Data submitted via quote forms, contact inquiries, brochure prompts or the CONCAM Advisor is used solely to prepare your commercial proposal, schedule callbacks, or deliver the Réussite Magazine newsletter following double opt-in.',
                )}
              </p>

              <h2 className="font-serif text-2xl font-bold text-ink pt-4 border-t border-hairline">
                {p('2. Durée de conservation & purge', '2. Retention & Automatic Purge')}
              </h2>
              <p>
                {p(
                  'Les coordonnées de prospects sont conservées pour une durée maximale de douze (12) mois à compter du dernier échange, puis purgées automatiquement de notre base.',
                  'Prospect records are retained for a maximum of twelve (12) months from the last interaction and automatically purged thereafter.',
                )}
              </p>

              <h2 className="font-serif text-2xl font-bold text-ink pt-4 border-t border-hairline">
                {p('3. Vos droits (accès, rectification, suppression)', '3. Your Rights (Access, Rectification, Erasure)')}
              </h2>
              <p>
                {p(
                  `Vous pouvez exercer à tout moment vos droits d’accès, de rectification ou de suppression en écrivant à ${settings.agencyEmail}. Chaque lettre d’information inclut également un lien de désinscription immédiat.`,
                  `You may exercise your rights of access, rectification or deletion at any time by writing to ${settings.agencyEmail}. Every newsletter also includes an immediate one-click unsubscribe link.`,
                )}
              </p>
            </div>
          </ParallaxLayer>
        </div>
      </section>
    </>
  );
}
