import { useEffect, useRef } from 'react';

/**
 * Rotation automatique disciplinée pour les carrousels.
 *
 * Règles appliquées (audit chorégraphie 2026-11) :
 * - rythme unique et posé (défaut 6 s) ;
 * - PAUSE hors écran (IntersectionObserver) et onglet caché ;
 * - PAUSE au premier toucher — le visiteur reprend la main — reprise après 12 s
 *   d'inactivité tactile ;
 * - aucune rotation si prefers-reduced-motion ;
 * - option desktopOnly : pas de rotation automatique sur mobile (< 768 px),
 *   où chaque pixel d'attention compte et où les flèches suffisent.
 *
 * Retourne une ref à poser sur le conteneur du carrousel (observer hors-écran).
 */
export function useAutoRotate<T extends HTMLElement = HTMLElement>(
  step: () => void,
  options: { intervalMs?: number; desktopOnly?: boolean; enabled?: boolean } = {},
) {
  const { intervalMs = 6000, desktopOnly = false, enabled = true } = options;
  const ref = useRef<T | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    if (desktopOnly && window.matchMedia?.('(max-width: 767px)').matches) return;

    const el = ref.current;
    let visible = true;
    let pausedByTouch = false;
    let resumeTimer: number | undefined;
    let interval: number | undefined;

    const tick = () => {
      if (document.hidden || !visible || pausedByTouch) return;
      stepRef.current();
    };

    let io: IntersectionObserver | undefined;
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.2 },
      );
      io.observe(el);
    }

    // Le premier toucher anywhere suspend la rotation : l'utilisateur contrôle.
    const onTouchStart = () => {
      pausedByTouch = true;
      if (resumeTimer !== undefined) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        pausedByTouch = false;
      }, 12000);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });

    interval = window.setInterval(tick, intervalMs);

    return () => {
      if (interval !== undefined) window.clearInterval(interval);
      if (resumeTimer !== undefined) window.clearTimeout(resumeTimer);
      io?.disconnect();
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, [intervalMs, desktopOnly, enabled]);

  return ref;
}
