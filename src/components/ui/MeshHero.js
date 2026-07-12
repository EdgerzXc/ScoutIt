import React from 'react';

/**
 * MeshHero
 * Wraps content in the dynamic radial mesh gradient background used for
 * cinematic headers.
 */
export default function MeshHero({
  children,
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
        {children}
      </div>
    </div>
  );
}
