import React from 'react';

interface ConcamLogoProps {
  variant?: 'horizontal' | 'vertical' | 'monochrome';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function ConcamLogo({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
}: ConcamLogoProps) {
  const padClass = size === 'sm' ? 'px-2.5 py-1' : size === 'lg' ? 'px-5 py-2.5' : 'px-3.5 py-1.5';
  const textClass =
    size === 'sm' ? 'text-sm tracking-[0.18em]' : size === 'lg' ? 'text-xl tracking-[0.22em]' : 'text-base tracking-[0.2em]';

  if (variant === 'monochrome') {
    return (
      <span
        className={`inline-flex items-center justify-center font-serif font-bold uppercase whitespace-nowrap shrink-0 border ${padClass} ${textClass} rounded-[6px] ${
          theme === 'dark'
            ? 'border-white/40 text-white bg-transparent'
            : 'border-[#0F0C0C] text-ink bg-transparent'
        }`}
      >
        CONCAM
      </span>
    );
  }

  if (variant === 'vertical') {
    return (
      <span className="inline-flex flex-col items-center gap-1.5 shrink-0">
        <span
          className={`inline-flex items-center justify-center bg-[#931916] text-white font-serif font-bold uppercase whitespace-nowrap rounded-[6px] ${padClass} ${textClass}`}
        >
          CONCAM
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center bg-[#931916] text-white font-serif font-bold uppercase whitespace-nowrap shrink-0 rounded-[6px] ${padClass} ${textClass}`}
    >
      CONCAM
    </span>
  );
}
