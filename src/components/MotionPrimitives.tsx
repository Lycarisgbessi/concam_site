import React, { useEffect, useId, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import type { AnimationPreset, ParallaxIntensity } from '../types/concam';
import { useSite } from '../context/SiteContext';

export function prefersReducedOrDataSaver(): boolean {
  if (typeof window === 'undefined') return true;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  return Boolean(conn?.saveData) || reducedMotion;
}

export function isFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(pointer: fine)')?.matches ?? false;
}

const PARALLAX_INTENSITY_FACTOR: Record<ParallaxIntensity, number> = {
  subtle: 0.7,
  cinematic: 1.4,
  intense: 2.1,
  ultra: 2.9,
};

export function useParallaxScale(): {
  enabled: boolean;
  multiplier: number;
  intensity: ParallaxIntensity;
  isMobile: boolean;
} {
  const { data } = useSite();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const intensity: ParallaxIntensity = data?.settings.parallaxIntensity || 'ultra';
  const enabled = !prefersReducedOrDataSaver() && data?.settings.animationsEnabled !== false;
  const cmsFactor = PARALLAX_INTENSITY_FACTOR[intensity] ?? 2.9;
  const viewportFactor = isMobile ? 0.78 : 1.0;

  return {
    enabled,
    multiplier: enabled ? cmsFactor * viewportFactor : 0,
    intensity,
    isMobile,
  };
}

/**
 * Engraved concentric rotating official CONCAM seal ("AGENCE CONCAM · CONAKRY · DEPUIS 2010").
 */
interface InstitutionalSealProps {
  size?: number;
  tone?: 'light' | 'ink';
  className?: string;
}

export function InstitutionalSeal({ size = 128, tone = 'light', className = '' }: InstitutionalSealProps) {
  const { data } = useSite();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const disabled = prefersReducedOrDataSaver() || data?.settings.animationsEnabled === false;

  const strokeMain = tone === 'light' ? 'rgba(255, 255, 255, 0.72)' : '#181413';
  const strokeSoft = tone === 'light' ? 'rgba(255, 255, 255, 0.28)' : 'rgba(24, 20, 19, 0.24)';
  const textColor = tone === 'light' ? '#FFFFFF' : '#181413';
  const crestBg = '#931916';

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        className={`absolute inset-0 ${disabled ? '' : 'animate-seal-spin'}`}
      >
        <defs>
          <path
            id={`seal-path-${uid}`}
            d="M 80, 80 m -58, 0 a 58,58 0 1,1 116,0 a 58,58 0 1,1 -116,0"
          />
        </defs>
        <circle cx="80" cy="80" r="76" fill="none" stroke={strokeSoft} strokeWidth="1" />
        <circle cx="80" cy="80" r="71" fill="none" stroke={strokeMain} strokeWidth="0.75" strokeDasharray="3 4" />
        <text
          fill={textColor}
          fontSize="8.6"
          fontWeight="600"
          letterSpacing="3.4px"
          className="font-sans uppercase"
        >
          <textPath href={`#seal-path-${uid}`} startOffset="0%">
            AGENCE CONCAM • CONAKRY • DEPUIS 2010 •
          </textPath>
        </text>
      </svg>

      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        className={`absolute inset-0 ${disabled ? '' : 'animate-seal-spin-reverse'}`}
      >
        <circle cx="80" cy="80" r="44" fill="none" stroke={strokeSoft} strokeWidth="0.9" />
        <circle cx="80" cy="80" r="39" fill="none" stroke={strokeMain} strokeWidth="0.6" strokeDasharray="1.5 3.5" />
      </svg>

      <div
        style={{ backgroundColor: crestBg }}
        className="relative z-10 w-[44%] h-[44%] rounded-full border border-white/55 flex flex-col items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
      >
        <span className="font-serif font-bold text-[10px] sm:text-xs tracking-[0.2em] text-white leading-none">
          CONCAM
        </span>
        <span className="mt-1 h-[1px] w-4 bg-white/80" />
      </div>
    </div>
  );
}

/**
 * Architectural horizontal crimson/ink rule drawing smoothly outward on scroll.
 */
interface EngravedRuleRevealProps {
  tone?: 'light' | 'dark';
  align?: 'center' | 'left';
  className?: string;
}

export function EngravedRuleReveal({ tone = 'light', align = 'center', className = '' }: EngravedRuleRevealProps) {
  const { data } = useSite();
  const disabled = prefersReducedOrDataSaver() || data?.settings.animationsEnabled === false;
  const lineBg = tone === 'dark' ? 'bg-white/20' : 'bg-hairline';
  const diamondColor = tone === 'dark' ? 'bg-[#E40014]' : 'bg-[#931916]';

  if (disabled) {
    return (
      <div className={`relative flex items-center ${className}`} aria-hidden="true">
        <div className={`h-[1px] w-full ${lineBg}`} />
        <span
          className={`w-1.5 h-1.5 rotate-45 ${diamondColor} shrink-0 ${
            align === 'center' ? 'absolute left-1/2 -translate-x-1/2' : 'ml-2'
          }`}
        />
      </div>
    );
  }

  return (
    <div className={`relative flex items-center overflow-hidden ${className}`} aria-hidden="true">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: align === 'center' ? '50% 50%' : '0% 50%' }}
        className={`h-[1px] w-full ${lineBg}`}
      />
      <motion.span
        initial={{ scale: 0, rotate: 0 }}
        whileInView={{ scale: 1, rotate: 45 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.45, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`w-1.5 h-1.5 ${diamondColor} shrink-0 ${
          align === 'center' ? 'absolute left-1/2 -translate-x-1/2' : 'ml-2'
        }`}
      />
    </div>
  );
}

function ScrollProgressBarActive() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 28, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#931916] via-[#E40014] to-[#931916] z-50 pointer-events-none"
      aria-hidden="true"
    />
  );
}

export function ScrollProgressBar() {
  const { data } = useSite();
  const disabled = prefersReducedOrDataSaver() || data?.settings.animationsEnabled === false;
  if (disabled) return null;
  return <ScrollProgressBarActive />;
}

/**
 * Solemn split-door ceremonial preloader parting from the center around the engraved CONCAM seal.
 */
export function Preloader() {
  const { data } = useSite();
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (prefersReducedOrDataSaver()) return false;
    if (sessionStorage.getItem('concam_preloader_done')) return false;
    return true;
  });

  useEffect(() => {
    if (!visible) return;
    if (data && !data.settings.preloaderEnabled) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('concam_preloader_done', '1');
    }, 1250);
    return () => window.clearTimeout(timer);
  }, [visible, data]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Left Sovereign Gate */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: '-100%' }}
        transition={{ delay: 0.72, duration: 0.52, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-y-0 left-0 w-1/2 bg-[#110D0C] border-r border-white/15"
      />
      {/* Right Sovereign Gate */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: '100%' }}
        transition={{ delay: 0.72, duration: 0.52, ease: [0.76, 0, 0.24, 1] }}
        className="absolute inset-y-0 right-0 w-1/2 bg-[#110D0C] border-l border-white/15"
      />

      {/* Centered Rotating Engraved Institutional Seal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.88, 1, 1, 1.06] }}
        transition={{ duration: 0.88, times: [0, 0.25, 0.72, 1], ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4"
      >
        <InstitutionalSeal size={132} tone="light" />
        <p className="font-serif text-lg sm:text-xl font-semibold tracking-[0.22em] uppercase text-white">
          Agence CONCAM
        </p>
        <p className="text-[11px] font-sans uppercase tracking-[0.26em] text-[#E40014] font-semibold">
          République de Guinée · Depuis 2010
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Word-by-word masked typographic reveal.
 */
interface SplitTextRevealProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'blockquote' | 'span';
  delay?: number;
  immediate?: boolean;
}

export function SplitTextReveal({
  text,
  className = '',
  as: Tag = 'h2',
  delay = 0,
  immediate = false,
}: SplitTextRevealProps) {
  const { data } = useSite();
  const disabled = prefersReducedOrDataSaver() || data?.settings.animationsEnabled === false;
  const words = text.split(' ');

  if (disabled) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, idx) => (
        <span key={`${word}-${idx}`} className="inline-block overflow-hidden align-bottom mr-[0.26em] pb-[0.04em]">
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '108%', opacity: 0 }}
            {...(immediate
              ? { animate: { y: '0%', opacity: 1 } }
              : {
                  whileInView: { y: '0%', opacity: 1 },
                  viewport: { once: true, amount: 0.18 },
                })}
            transition={{
              duration: 0.56,
              delay: delay + Math.min(idx * 0.032, 0.42),
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Cinematic clip-path curtain reveal for photography with smooth optical zoom settle.
 */
interface ClipCurtainRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function ClipCurtainReveal({
  children,
  direction = 'up',
  delay = 0,
  className = '',
}: ClipCurtainRevealProps) {
  const { data } = useSite();
  const disabled = prefersReducedOrDataSaver() || data?.settings.animationsEnabled === false;

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const initialClip =
    direction === 'left'
      ? 'inset(0% 100% 0% 0%)'
      : direction === 'right'
      ? 'inset(0% 0% 0% 100%)'
      : 'inset(100% 0% 0% 0%)';

  return (
    <motion.div
      initial={{ clipPath: initialClip, opacity: 0.4 }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`overflow-hidden ${className}`}
    >
      <motion.div
        initial={{ scale: 1.11 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.14 }}
        transition={{ duration: 1.08, delay, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * Interactive 3D perspective architectural plate with subtle crimson cursor gleam.
 */
interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function TiltCard3D({ children, className = '', intensity = 5 }: TiltCard3DProps) {
  const { data } = useSite();
  const disabled = prefersReducedOrDataSaver() || data?.settings.animationsEnabled === false || !isFinePointer();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glowOpacity = useMotionValue(0);

  const rotateX = useSpring(rawRotateX, { stiffness: 220, damping: 24 });
  const rotateY = useSpring(rawRotateY, { stiffness: 220, damping: 24 });
  const sheenBg = useMotionTemplate`radial-gradient(400px circle at ${glowX}% ${glowY}%, rgba(147, 25, 22, 0.14), rgba(255, 255, 255, 0.05) 42%, transparent 72%)`;

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rawRotateX.set((0.5 - py) * intensity * 2);
    rawRotateY.set((px - 0.5) * intensity * 2);
    glowX.set(px * 100);
    glowY.set(py * 100);
    glowOpacity.set(1);
  };

  const handleLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    glowOpacity.set(0);
  };

  return (
    <div style={{ perspective: 1100 }} className="h-full">
      <motion.div
        ref={cardRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={`relative h-full will-change-transform ${className}`}
      >
        <motion.div
          aria-hidden="true"
          style={{ background: sheenBg, opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 transition-opacity duration-300"
        />
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Magnetic attraction container around buttons and key interactive triggers.
 */
interface MagneticWrapperProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticWrapper({ children, className = '', strength = 0.22 }: MagneticWrapperProps) {
  const { data } = useSite();
  const disabled = prefersReducedOrDataSaver() || data?.settings.animationsEnabled === false || !isFinePointer();
  const ref = useRef<HTMLDivElement | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 260, damping: 18, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 260, damping: 18, mass: 0.4 });

  if (disabled) {
    return <div className={`inline-block ${className}`}>{children}</div>;
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    rawX.set(dx * strength);
    rawY.set(dy * strength);
  };

  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ x, y }}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

const PARALLAX_SPRING = { stiffness: 320, damping: 28, mass: 0.16 };

function ParallaxLayerActive({
  children,
  offset,
  xOffset,
  scaleRange,
  rotateRange,
  rotateXRange,
  rotateYRange,
  className = '',
}: {
  children: React.ReactNode;
  offset: number;
  xOffset?: number;
  scaleRange?: [number, number, number];
  rotateRange?: [number, number];
  rotateXRange?: [number, number, number];
  rotateYRange?: [number, number, number];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const y = useTransform(smoothProgress, [0, 1], [offset, -offset]);
  const x = useTransform(smoothProgress, [0, 1], [xOffset || 0, -(xOffset || 0)]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], scaleRange || [1, 1, 1]);
  const rotate = useTransform(smoothProgress, [0, 1], rotateRange || [0, 0]);
  const rotateX = useTransform(smoothProgress, [0, 0.5, 1], rotateXRange || [0, 0, 0]);
  const rotateY = useTransform(smoothProgress, [0, 0.5, 1], rotateYRange || [0, 0, 0]);
  const has3D = Boolean(rotateXRange || rotateYRange);

  return (
    <div ref={ref} style={has3D ? { perspective: 1200 } : undefined} className={className}>
      <motion.div
        style={{
          y,
          ...(xOffset ? { x } : {}),
          ...(scaleRange ? { scale } : {}),
          ...(rotateRange ? { rotate } : {}),
          ...(rotateXRange ? { rotateX } : {}),
          ...(rotateYRange ? { rotateY } : {}),
          ...(has3D ? { transformStyle: 'preserve-3d' as const } : {}),
        }}
        className="will-change-transform h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Multi-axis vertical/horizontal/zoom/3D parallax container with quasi-instantaneous GPU spring.
 */
export function ParallaxLayer({
  children,
  offset = 76,
  xOffset,
  scaleRange,
  rotateRange,
  rotateXRange,
  rotateYRange,
  className = '',
}: {
  children: React.ReactNode;
  offset?: number;
  xOffset?: number;
  scaleRange?: [number, number, number];
  rotateRange?: [number, number];
  rotateXRange?: [number, number, number];
  rotateYRange?: [number, number, number];
  className?: string;
}) {
  const { enabled, multiplier } = useParallaxScale();

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <ParallaxLayerActive
      offset={offset * multiplier}
      xOffset={xOffset ? xOffset * multiplier : undefined}
      scaleRange={scaleRange}
      rotateRange={rotateRange}
      rotateXRange={rotateXRange}
      rotateYRange={rotateYRange}
      className={className}
    >
      {children}
    </ParallaxLayerActive>
  );
}

function ParallaxOppositeSplitActive({
  left,
  right,
  amplitude,
  className = '',
  leftClassName = '',
  rightClassName = '',
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  amplitude: number;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const leftY = useTransform(smoothProgress, [0, 0.5, 1], [amplitude, 0, -amplitude]);
  const rightY = useTransform(smoothProgress, [0, 0.5, 1], [-amplitude * 1.18, 0, amplitude * 1.18]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: leftY }} className={`will-change-transform ${leftClassName}`}>
        {left}
      </motion.div>
      <motion.div style={{ y: rightY }} className={`will-change-transform ${rightClassName}`}>
        {right}
      </motion.div>
    </div>
  );
}

/**
 * Two-column split whose columns glide strongly in opposite vertical directions around viewport center.
 */
export function ParallaxOppositeSplit({
  left,
  right,
  amplitude = 76,
  className = '',
  leftClassName = '',
  rightClassName = '',
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  amplitude?: number;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}) {
  const { enabled, multiplier, isMobile } = useParallaxScale();

  if (!enabled) {
    return (
      <div className={className}>
        <div className={leftClassName}>{left}</div>
        <div className={rightClassName}>{right}</div>
      </div>
    );
  }

  const effectiveAmp = isMobile ? amplitude * 0.52 * multiplier : amplitude * multiplier;

  return (
    <ParallaxOppositeSplitActive
      left={left}
      right={right}
      amplitude={effectiveAmp}
      className={className}
      leftClassName={leftClassName}
      rightClassName={rightClassName}
    />
  );
}

function getColumnVelocityFactor(colIdx: number, columns: number): number {
  if (columns === 2) {
    return colIdx % 2 === 0 ? 1.08 : -1.08;
  }
  if (columns === 4) {
    const map = [1.08, -0.92, 1.38, -1.08];
    return map[colIdx % 4];
  }
  const map3 = [1.08, -0.92, 1.38];
  return map3[colIdx % 3];
}

function ParallaxColumnStaggerActive({
  children,
  offset,
  tiltSign,
  className = '',
}: {
  children: React.ReactNode;
  offset: number;
  tiltSign: 1 | -1;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const y = useTransform(smoothProgress, [0, 0.5, 1], [offset, 0, -offset]);
  const rotateX = useTransform(smoothProgress, [0, 0.42, 0.58, 1], [5, 0, 0, -5]);
  const rotateY = useTransform(smoothProgress, [0, 0.42, 0.58, 1], [tiltSign * 4, 0, 0, -tiltSign * 4]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.95, 1.02, 0.95]);

  return (
    <div ref={ref} style={{ perspective: 1100 }} className={`h-full ${className}`}>
      <motion.div
        style={{ y, rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}
        className="will-change-transform h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Multi-column grid card stagger applying strong differential scroll speeds + subtle 3D scroll perspective per column.
 */
export function ParallaxColumnStagger({
  children,
  index,
  columns = 3,
  amplitude = 56,
  className = '',
}: {
  children: React.ReactNode;
  index: number;
  columns?: 2 | 3 | 4;
  amplitude?: number;
  className?: string;
}) {
  const { enabled, multiplier } = useParallaxScale();
  const factor = getColumnVelocityFactor(index, columns);

  if (!enabled) {
    return <div className={`h-full ${className}`}>{children}</div>;
  }

  return (
    <ParallaxColumnStaggerActive
      offset={amplitude * factor * multiplier}
      tiltSign={index % 2 === 0 ? 1 : -1}
      className={className}
    >
      {children}
    </ParallaxColumnStaggerActive>
  );
}

type BackdropVariant = 'dark-grid' | 'light-grid' | 'crimson-bands' | 'editorial-lines';

function BackdropPatternContent({ variant }: { variant: BackdropVariant }) {
  if (variant === 'dark-grid') {
    return (
      <>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255, 255, 255, 0.085) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.055) 1px, transparent 1px)',
            backgroundSize: '25% 170px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 18% 30%, rgba(147, 25, 22, 0.28) 0%, transparent 50%), radial-gradient(circle at 84% 72%, rgba(255, 255, 255, 0.07) 0%, transparent 48%)',
          }}
        />
      </>
    );
  }
  if (variant === 'crimson-bands') {
    return (
      <>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-32deg, rgba(255, 255, 255, 0.075) 0px, rgba(255, 255, 255, 0.075) 1px, transparent 1px, transparent 54px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(147, 25, 22, 0.25) 0%, transparent 62%)',
          }}
        />
      </>
    );
  }
  if (variant === 'editorial-lines') {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(147, 25, 22, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(24, 20, 19, 0.06) 1px, transparent 1px)',
          backgroundSize: '33.333% 155px',
        }}
      />
    );
  }
  // light-grid
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(24, 20, 19, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(147, 25, 22, 0.06) 1px, transparent 1px)',
          backgroundSize: '25% 210px',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 88% 18%, rgba(24, 20, 19, 0.05) 0%, transparent 45%), radial-gradient(circle at 12% 82%, rgba(147, 25, 22, 0.085) 0%, transparent 45%)',
        }}
      />
    </>
  );
}

function ParallaxBackdropPlateActive({
  variant,
  offset,
  className = '',
}: {
  variant: BackdropVariant;
  offset: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const y = useTransform(smoothProgress, [0, 1], [-offset, offset]);
  const xDrift = variant === 'crimson-bands' || variant === 'editorial-lines' ? offset * 0.42 : offset * 0.16;
  const x = useTransform(smoothProgress, [0, 1], [-xDrift, xDrift]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [1.06, 1.14, 1.06]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden z-0 ${className}`}
    >
      <motion.div
        style={{ y, x, scale }}
        className="absolute -inset-y-44 -inset-x-14 will-change-transform"
      >
        <BackdropPatternContent variant={variant} />
      </motion.div>
    </div>
  );
}

/**
 * Architectural background grid / crimson-lines plate moving in deep multi-axis counter-parallax.
 */
export function ParallaxBackdropPlate({
  variant = 'light-grid',
  offset = 128,
  className = '',
}: {
  variant?: BackdropVariant;
  offset?: number;
  className?: string;
}) {
  const { enabled, multiplier } = useParallaxScale();

  if (!enabled) {
    return (
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden z-0 ${className}`}>
        <BackdropPatternContent variant={variant} />
      </div>
    );
  }

  return (
    <ParallaxBackdropPlateActive
      variant={variant}
      offset={offset * multiplier}
      className={className}
    />
  );
}

function ParallaxSealDriftActive({
  size,
  tone,
  offset,
  rotateDeg,
  className = '',
}: {
  size: number;
  tone: 'light' | 'ink';
  offset: number;
  rotateDeg: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const y = useTransform(smoothProgress, [0, 1], [offset, -offset]);
  const rotate = useTransform(smoothProgress, [0, 1], [-rotateDeg, rotateDeg]);
  const rotateY = useTransform(smoothProgress, [0, 0.5, 1], [-18, 0, 18]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.9, 1.1, 0.9]);

  return (
    <div ref={ref} style={{ perspective: 900 }} className={`inline-block ${className}`}>
      <motion.div style={{ y, rotate, rotateY, scale, transformStyle: 'preserve-3d' }} className="will-change-transform">
        <InstitutionalSeal size={size} tone={tone} />
      </motion.div>
    </div>
  );
}

/**
 * Official CONCAM seal drifting vertically, tilting in 3D, zooming and rotating on scroll.
 */
export function ParallaxSealDrift({
  size = 128,
  tone = 'light',
  offset = 84,
  rotateDeg = 76,
  className = '',
}: {
  size?: number;
  tone?: 'light' | 'ink';
  offset?: number;
  rotateDeg?: number;
  className?: string;
}) {
  const { enabled, multiplier } = useParallaxScale();

  if (!enabled) {
    return (
      <div className={`inline-block ${className}`}>
        <InstitutionalSeal size={size} tone={tone} />
      </div>
    );
  }

  return (
    <ParallaxSealDriftActive
      size={size}
      tone={tone}
      offset={offset * multiplier}
      rotateDeg={rotateDeg * multiplier}
      className={className}
    />
  );
}

function ParallaxImageFrameActive({
  children,
  shiftPct,
  scaleRange,
  className = '',
}: {
  children: React.ReactNode;
  shiftPct: number;
  scaleRange: [number, number, number];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const y = useTransform(smoothProgress, [0, 1], [`-${shiftPct}%`, `${shiftPct}%`]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], scaleRange);

  return (
    <div ref={ref} className={`relative w-full h-full overflow-hidden ${className}`}>
      <motion.div style={{ y, scale }} className="w-full h-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Deep internal photography parallax window with high overscan zoom so edges remain strictly covered.
 */
export function ParallaxImageFrame({
  children,
  shiftPct = 9,
  className = '',
}: {
  children: React.ReactNode;
  shiftPct?: number;
  className?: string;
}) {
  const { enabled, multiplier } = useParallaxScale();

  if (!enabled) {
    return <div className={`relative w-full h-full overflow-hidden ${className}`}>{children}</div>;
  }

  const effectiveShift = Math.min(shiftPct * multiplier, 13.5);
  const minScale = 1 + effectiveShift / 34 + 0.06;
  const peakScale = minScale + 0.08;

  return (
    <ParallaxImageFrameActive
      shiftPct={effectiveShift}
      scaleRange={[minScale, peakScale, minScale]}
      className={className}
    >
      {children}
    </ParallaxImageFrameActive>
  );
}

function ParallaxHorizontalTitleActive({
  children,
  drift,
  className = '',
}: {
  children: React.ReactNode;
  drift: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const x = useTransform(smoothProgress, [0, 0.42, 0.58, 1], [-drift, 0, 0, drift]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ x }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Scroll-driven horizontal glide for section headings, kickers and Roman indices.
 */
export function ParallaxHorizontalTitle({
  children,
  direction = 1,
  distance = 36,
  className = '',
}: {
  children: React.ReactNode;
  direction?: 1 | -1;
  distance?: number;
  className?: string;
}) {
  const { enabled, multiplier, isMobile } = useParallaxScale();

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  const safeDistance = isMobile ? Math.min(distance * 0.55 * multiplier, 42) : distance * multiplier;

  return (
    <ParallaxHorizontalTitleActive drift={safeDistance * direction} className={className}>
      {children}
    </ParallaxHorizontalTitleActive>
  );
}

function ParallaxHorizontalBandActive({
  primaryItems,
  secondaryItems,
  tone,
  travel,
  className = '',
}: {
  primaryItems: string[];
  secondaryItems?: string[];
  tone: 'dark' | 'light';
  travel: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const xPrimary = useTransform(smoothProgress, [0, 1], [-travel, travel]);
  const xSecondary = useTransform(smoothProgress, [0, 1], [travel * 0.85, -travel * 0.85]);

  const bgClass =
    tone === 'dark'
      ? 'bg-[#110D0C] text-white border-y border-white/15'
      : 'bg-limestone text-ink border-y border-hairline';
  const diamondClass = tone === 'dark' ? 'text-[#E40014]' : 'text-[#931916]';
  const secondaryTextClass = tone === 'dark' ? 'text-white/75' : 'text-muted';

  const repeatedPrimary = [...primaryItems, ...primaryItems, ...primaryItems, ...primaryItems];
  const repeatedSecondary = secondaryItems
    ? [...secondaryItems, ...secondaryItems, ...secondaryItems, ...secondaryItems]
    : [];

  return (
    <div ref={ref} className={`relative overflow-x-clip py-5 sm:py-6 select-none ${bgClass} ${className}`}>
      <div className="flex justify-center overflow-hidden">
        <motion.div
          style={{ x: xPrimary }}
          className="flex items-center gap-8 sm:gap-12 whitespace-nowrap shrink-0 will-change-transform"
        >
          {repeatedPrimary.map((item, idx) => (
            <span key={`hb1-${idx}`} className="inline-flex items-center gap-8 sm:gap-12 shrink-0">
              <span className="font-serif text-2xl sm:text-4xl font-bold tracking-tight">
                {item}
              </span>
              <span className={`text-sm ${diamondClass}`} aria-hidden="true">
                ◆
              </span>
            </span>
          ))}
        </motion.div>
      </div>

      {repeatedSecondary.length > 0 && (
        <div className={`flex justify-center overflow-hidden pt-3 mt-3 border-t ${tone === 'dark' ? 'border-white/15' : 'border-hairline'}`}>
          <motion.div
            style={{ x: xSecondary }}
            className="flex items-center gap-7 sm:gap-10 whitespace-nowrap shrink-0 will-change-transform"
          >
            {repeatedSecondary.map((item, idx) => (
              <span key={`hb2-${idx}`} className="inline-flex items-center gap-7 sm:gap-10 shrink-0">
                <span className={`font-sans text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] ${secondaryTextClass}`}>
                  {item}
                </span>
                <span className={`text-xs ${diamondClass}`} aria-hidden="true">
                  ·
                </span>
              </span>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}

/**
 * Dual-track high-contrast architectural typographic ribbon gliding horizontally in opposite directions on scroll.
 */
export function ParallaxHorizontalBand({
  primaryItems,
  secondaryItems,
  tone = 'dark',
  travel = 190,
  className = '',
}: {
  primaryItems: string[];
  secondaryItems?: string[];
  tone?: 'dark' | 'light';
  travel?: number;
  className?: string;
}) {
  const { enabled, multiplier } = useParallaxScale();

  if (!enabled) {
    const bgClass =
      tone === 'dark'
        ? 'bg-[#110D0C] text-white border-y border-white/15'
        : 'bg-limestone text-ink border-y border-hairline';
    const diamondClass = tone === 'dark' ? 'text-[#E40014]' : 'text-[#931916]';
    return (
      <div className={`relative overflow-x-clip py-5 px-4 ${bgClass} ${className}`}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-6">
          {primaryItems.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-6">
              <span className="font-serif text-xl sm:text-2xl font-bold">{item}</span>
              {idx < primaryItems.length - 1 && (
                <span className={`text-xs ${diamondClass}`} aria-hidden="true">
                  ◆
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ParallaxHorizontalBandActive
      primaryItems={primaryItems}
      secondaryItems={secondaryItems}
      tone={tone}
      travel={travel * multiplier}
      className={className}
    />
  );
}

function ParallaxCurtainSectionActive({
  children,
  zIndex,
  topAccent,
  className = '',
}: {
  children: React.ReactNode;
  zIndex: number;
  topAccent: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const scale = useTransform(smoothProgress, [0, 0.85, 1], [0.975, 1, 1]);

  return (
    <div
      ref={ref}
      style={{ zIndex }}
      className={`relative shadow-[0_-28px_72px_-12px_rgba(17,13,12,0.52)] ${
        topAccent ? 'border-t-2 border-[#931916]' : ''
      } ${className}`}
    >
      <motion.div style={{ scale, transformOrigin: '50% 0%' }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Theatrical curtain-overlap wrapper: glides upward over receding previous sections with elevated Z-index and shadow.
 */
export function ParallaxCurtainSection({
  children,
  zIndex = 20,
  topAccent = true,
  className = '',
}: {
  children: React.ReactNode;
  zIndex?: number;
  topAccent?: boolean;
  className?: string;
}) {
  const { enabled } = useParallaxScale();

  if (!enabled) {
    return (
      <div style={{ zIndex }} className={`relative ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <ParallaxCurtainSectionActive zIndex={zIndex} topAccent={topAccent} className={className}>
      {children}
    </ParallaxCurtainSectionActive>
  );
}

function ParallaxScroll3DPlateActive({
  children,
  tiltX,
  tiltY,
  liftY,
  className = '',
}: {
  children: React.ReactNode;
  tiltX: number;
  tiltY: number;
  liftY: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const y = useTransform(smoothProgress, [0, 0.5, 1], [liftY, 0, -liftY]);
  const rotateX = useTransform(smoothProgress, [0, 0.4, 0.6, 1], [tiltX, 0, 0, -tiltX]);
  const rotateY = useTransform(smoothProgress, [0, 0.4, 0.6, 1], [tiltY, 0, 0, -tiltY]);
  const scale = useTransform(smoothProgress, [0, 0.45, 0.55, 1], [0.92, 1.03, 1.03, 0.93]);

  return (
    <div ref={ref} style={{ perspective: 1200 }} className={className}>
      <motion.div
        style={{ y, rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}
        className="will-change-transform h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * 3D perspective & spatial scroll rotation container for showcase visuals and primary archival plates.
 */
export function ParallaxScroll3DPlate({
  children,
  direction = 1,
  tiltX = 9,
  tiltY = 7,
  liftY = 48,
  className = '',
}: {
  children: React.ReactNode;
  direction?: 1 | -1;
  tiltX?: number;
  tiltY?: number;
  liftY?: number;
  className?: string;
}) {
  const { enabled, multiplier, isMobile } = useParallaxScale();

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  const clampedRot = Math.min(multiplier, 2.2) / 2.2;
  const rx = tiltX * clampedRot * (isMobile ? 0.6 : 1);
  const ry = tiltY * direction * clampedRot * (isMobile ? 0.5 : 1);

  return (
    <ParallaxScroll3DPlateActive
      tiltX={rx}
      tiltY={ry}
      liftY={liftY * multiplier}
      className={className}
    >
      {children}
    </ParallaxScroll3DPlateActive>
  );
}

function ParallaxStackCardItem({
  children,
  index,
  total,
}: {
  children: React.ReactNode;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 25%', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const targetMinScale = 1 - Math.max(0, total - 1 - index) * 0.032;
  const scale = useTransform(smoothProgress, [0, 1], [1, targetMinScale]);
  const rotateX = useTransform(smoothProgress, [0, 1], [0, -2.2]);

  return (
    <div
      ref={ref}
      style={{
        top: `calc(5.25rem + ${index * 18}px)`,
        zIndex: 10 + index,
        perspective: 1400,
      }}
      className="sticky will-change-transform"
    >
      <motion.div
        style={{ scale, rotateX, transformOrigin: '50% 0%', transformStyle: 'preserve-3d' }}
        className="shadow-[0_-18px_52px_-16px_rgba(17,13,12,0.34)] rounded-[4px]"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Sticky Layered Stacking Card Deck: locks each pillar card below the top nav while the next card glides up over it.
 * Note: Parent section MUST use overflow-x-clip (never overflow-hidden).
 */
export function ParallaxStackDeck({
  items,
  renderItem,
  className = '',
}: {
  items: unknown[];
  renderItem: (index: number) => React.ReactNode;
  className?: string;
}) {
  const { enabled } = useParallaxScale();

  if (!enabled) {
    return (
      <div className={`space-y-14 ${className}`}>
        {items.map((_, idx) => (
          <div key={idx}>{renderItem(idx)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-10 lg:space-y-14 pb-6 ${className}`}>
      {items.map((_, idx) => (
        <ParallaxStackCardItem key={idx} index={idx} total={items.length}>
          {renderItem(idx)}
        </ParallaxStackCardItem>
      ))}
    </div>
  );
}

function ParallaxStickySplitActive({
  stickyContent,
  scrollingContent,
  stickySide,
  amplitude,
  className = '',
  stickyClassName = '',
  scrollingClassName = '',
}: {
  stickyContent: React.ReactNode;
  scrollingContent: React.ReactNode;
  stickySide: 'left' | 'right';
  amplitude: number;
  className?: string;
  stickyClassName?: string;
  scrollingClassName?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const smoothProgress = useSpring(scrollYProgress, PARALLAX_SPRING);
  const progressScale = useTransform(smoothProgress, [0, 1], [0.08, 1]);
  const stackY = useTransform(smoothProgress, [0, 1], [amplitude, -amplitude]);

  const stickyOrder = stickySide === 'right' ? 'lg:order-2' : 'lg:order-1';
  const scrollOrder = stickySide === 'right' ? 'lg:order-1' : 'lg:order-2';

  return (
    <div ref={ref} className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start ${className}`}>
      <div className={`lg:sticky lg:top-24 self-start z-10 space-y-5 ${stickyOrder} ${stickyClassName}`}>
        {stickyContent}
        <div className="hidden lg:block pt-2" aria-hidden="true">
          <div className="h-[2px] w-28 bg-hairline/40 overflow-hidden relative">
            <motion.div
              style={{ scaleX: progressScale, transformOrigin: '0% 50%' }}
              className="absolute inset-0 bg-[#E40014]"
            />
          </div>
        </div>
      </div>
      <motion.div
        style={{ y: stackY }}
        className={`relative z-20 will-change-transform ${scrollOrder} ${scrollingClassName}`}
      >
        {scrollingContent}
      </motion.div>
    </div>
  );
}

/**
 * Sticky editorial showcase: pins the editorial anchor column while layered visual stacks glide beside it.
 * Note: Parent section must use overflow-x-clip (never overflow-hidden) so sticky stays active.
 */
export function ParallaxStickySplit({
  stickyContent,
  scrollingContent,
  stickySide = 'left',
  amplitude = 52,
  className = '',
  stickyClassName = '',
  scrollingClassName = '',
}: {
  stickyContent: React.ReactNode;
  scrollingContent: React.ReactNode;
  stickySide?: 'left' | 'right';
  amplitude?: number;
  className?: string;
  stickyClassName?: string;
  scrollingClassName?: string;
}) {
  const { enabled, multiplier, isMobile } = useParallaxScale();

  if (!enabled) {
    const stickyOrder = stickySide === 'right' ? 'lg:order-2' : 'lg:order-1';
    const scrollOrder = stickySide === 'right' ? 'lg:order-1' : 'lg:order-2';
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start ${className}`}>
        <div className={`${stickyOrder} ${stickyClassName}`}>{stickyContent}</div>
        <div className={`${scrollOrder} ${scrollingClassName}`}>{scrollingContent}</div>
      </div>
    );
  }

  return (
    <ParallaxStickySplitActive
      stickyContent={stickyContent}
      scrollingContent={scrollingContent}
      stickySide={stickySide}
      amplitude={isMobile ? amplitude * 0.45 * multiplier : amplitude * multiplier}
      className={className}
      stickyClassName={stickyClassName}
      scrollingClassName={scrollingClassName}
    />
  );
}

interface RevealBlockProps {
  children: React.ReactNode;
  preset?: AnimationPreset;
  delay?: number;
  className?: string;
}

export function RevealBlock({ children, preset = 'fade-up', delay = 0, className = '' }: RevealBlockProps) {
  const { data } = useSite();
  const disabled = prefersReducedOrDataSaver() || preset === 'none' || data?.settings.animationsEnabled === false;

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const initialMap: Record<Exclude<AnimationPreset, 'none'>, { opacity: number; y?: number; x?: number; scale?: number }> = {
    'fade-up': { opacity: 0, y: 26 },
    'slide-left': { opacity: 0, x: -38 },
    'slide-right': { opacity: 0, x: 38 },
    'zoom-soft': { opacity: 0, scale: 0.95 },
  };

  return (
    <motion.div
      initial={initialMap[preset]}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.62, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [val, setVal] = useState(0);
  const disabled = prefersReducedOrDataSaver();

  useEffect(() => {
    if (disabled) {
      setVal(target);
      return;
    }
    if (!isInView) return;
    let start: number | null = null;
    const duration = 1100;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target, disabled]);

  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}
