import React from 'react';

/**
 * HoverCard
 * A reusable wrapper for the Impeccable physical physical-feedback cards.
 * Applies `.hov-card` class which provides the 3D lift and scale effects.
 */
export default function HoverCard({
  children,
  className = '',
  isSelected = false,
  isCta = false,
  index = 0,
  onClick,
  ...props
}) {
  const ctaClass = isCta ? 'cta-pulse' : '';
  const selectedClass = isSelected ? 'border-gold-accent' : 'border-surface-variant';
  
  return (
    <div
      className={`hov-card card-atmosphere stagger-enter transition-all relative overflow-hidden group border ${selectedClass} ${ctaClass} ${className}`}
      style={{ '--i': index, ...(props.style || {}) }}
      onClick={onClick}
      {...props}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-gold-accent transition-colors"></div>
      {children}
    </div>
  );
}
