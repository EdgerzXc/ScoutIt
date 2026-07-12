import React from 'react';

/**
 * GlassPanel
 * Reusable primitive for the "Impeccable" glassmorphism containers.
 * Applies the core `.glass-panel` class alongside optional custom styling.
 */
export default function GlassPanel({ 
  children, 
  className = '', 
  glowColor = null,
  onClick,
  ...props 
}) {
  const customStyle = glowColor ? { boxShadow: `0 8px 32px 0 ${glowColor}` } : {};

  return (
    <div 
      className={`glass-panel ${className}`} 
      style={{ ...customStyle, ...(props.style || {}) }}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
