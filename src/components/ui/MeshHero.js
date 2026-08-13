import React from 'react';

/**
 * MeshHero
 * Wraps content in the dynamic radial mesh gradient background used for
 * cinematic headers.
 */
export default function MeshHero({
  children,
  tag,
  title,
  subtitle,
  className = '',
  ...props
}) {
  return (
    <div 
      className={`mesh-bg-hero relative w-full overflow-hidden ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>
      <div className="relative z-10 w-full h-full">
        {(tag || title || subtitle) && (
          <div className="mx-auto flex min-h-[280px] max-w-[1400px] flex-col justify-center px-6 py-16">
            {tag && <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-gold-accent">{tag}</p>}
            {title && <h1 className="font-headline-editorial text-4xl text-on-surface md:text-6xl">{title}</h1>}
            {subtitle && <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
