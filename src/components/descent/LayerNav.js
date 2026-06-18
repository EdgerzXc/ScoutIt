"use client";

import Link from "next/link";

/**
 * LayerNav — shared top navigation for all descent layer pages
 *
 * Props:
 *   prev  { href, label } | null  — back destination
 *   next  { href, label } | null  — continue destination
 */
export default function LayerNav({ prev = null, next = null }) {
  return (
    <nav
      className="layer-nav"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(10,10,10,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,184,0,0.12)",
      }}
    >
      {/* BACK */}
      <div style={{ minWidth: "120px" }}>
        {prev && (
          <Link
            href={prev.href}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
          >
            ← {prev.label}
          </Link>
        )}
      </div>

      {/* LOGO — center */}
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 400,
          color: "var(--accent)",
          textDecoration: "none",
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}
      >
        ScoutIt
      </Link>

      {/* CONTINUE */}
      <div style={{ minWidth: "120px", display: "flex", justifyContent: "flex-end" }}>
        {next && (
          <Link
            href={next.href}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
          >
            {next.label} →
          </Link>
        )}
      </div>
    </nav>
  );
}
