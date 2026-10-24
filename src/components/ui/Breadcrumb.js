import React from "react";
import Link from "next/link";

/**
 * Canonical Breadcrumb Primitive (A-224 / Design Unification)
 *
 * Implements accessible, semantic breadcrumb navigation following ScoutIt
 * Dark Luxury design DNA (obsidian glass, amber gold accents, mono uppercase tracking).
 *
 * Usage:
 * <Breadcrumb
 *   items={[
 *     { label: "Layer 04 · Crust", href: "/layer/crust" },
 *     { label: "Advisors", href: "/brokers" },
 *     { label: "Private Dossier", isCurrent: true }
 *   ]}
 * />
 */
export default function Breadcrumb({
  items = [],
  backHref,
  backLabel,
  ariaLabel = "Breadcrumb",
  className = "",
  separator = <span className="text-text-muted/50 select-none text-[12px]" aria-hidden="true">/</span>,
  style = {}
}) {
  // Convenience mode: simple back link breadcrumb
  if (backHref && backLabel && items.length === 0) {
    return (
      <nav aria-label={ariaLabel} className={`inline-flex items-center ${className}`} style={style}>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.08em] text-accent hover:text-accent-bright transition-colors focus-visible:outline-none focus-visible:underline"
        >
          <span aria-hidden="true">←</span>
          <span>{backLabel}</span>
        </Link>
      </nav>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <nav aria-label={ariaLabel} className={`breadcrumb-nav ${className}`} style={style}>
      <ol className="flex items-center flex-wrap gap-2 text-[12px] font-mono uppercase tracking-[0.08em] list-none p-0 m-0">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1 || item.isCurrent;
          return (
            <li key={idx} className="inline-flex items-center gap-2">
              {idx > 0 && separator}
              {isLast || !item.href ? (
                <span
                  className="text-text-primary font-medium"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-accent hover:text-accent-bright transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
