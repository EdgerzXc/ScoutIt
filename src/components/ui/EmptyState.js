import React from "react";

/**
 * Canonical EmptyState Primitive (A-224 / Design Unification)
 *
 * Implements empty, boundary, and zero-signal states following ScoutIt
 * Dark Luxury design DNA (obsidian glass, subtle golden borders, display typography).
 *
 * Usage:
 * <EmptyState
 *   icon={<Search size={24} />}
 *   eyebrow="Roster Boundary"
 *   title="No verified profiles found"
 *   description="Try broadening your search or clear selected filters."
 *   action={<button onClick={clearFilters}>Clear Filters</button>}
 * />
 */
export default function EmptyState({
  eyebrow,
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = "",
  style = {}
}) {
  return (
    <div
      role="status"
      className={`bg-surface/40 backdrop-blur-md border border-dashed border-border-solid rounded-xl p-8 md:p-12 text-center flex flex-col items-center justify-center relative overflow-hidden ${className}`}
      style={style}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-gold-accent/10 border border-gold-accent/20 flex items-center justify-center text-gold-accent mb-4 shrink-0 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]">
          {icon}
        </div>
      )}
      {eyebrow && (
        <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent-muted mb-2 block">
          {eyebrow}
        </span>
      )}
      <h3 className="font-display text-xl md:text-2xl text-text-primary mb-2 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="font-body text-sm text-text-secondary max-w-md leading-relaxed mb-6">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
