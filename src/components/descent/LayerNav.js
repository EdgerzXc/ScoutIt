"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Emphasised destination pill (inline styles — styled-jsx is dropped in this
 * Next build, so all styling here must be inline or injected globally).
 */
function NavPill({ href, label, dir }) {
  const [hover, setHover] = useState(false);
  const arrow = dir === "prev" ? "←" : "→";

  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        textDecoration: "none",
        padding: "9px 16px",
        borderRadius: "999px",
        border: `1px solid ${hover ? "var(--accent)" : "rgba(255,184,0,0.4)"}`,
        background: hover ? "var(--accent)" : "rgba(255,184,0,0.07)",
        color: hover ? "#0e0e0e" : "#f0ede8",
        boxShadow: hover ? "0 0 22px rgba(255,184,0,0.4)" : "none",
        transform: hover ? "translateY(-1px)" : "none",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      {dir === "prev" && (
        <span style={{ color: hover ? "#0e0e0e" : "var(--accent)", fontSize: "13px", lineHeight: 1 }}>{arrow}</span>
      )}
      {label}
      {dir === "next" && (
        <span style={{ color: hover ? "#0e0e0e" : "var(--accent)", fontSize: "13px", lineHeight: 1 }}>{arrow}</span>
      )}
    </Link>
  );
}

/**
 * LayerNav — shared top navigation for all descent layer pages.
 *
 * Props:
 *   prev  { href, label } | null  — back destination
 *   next  { href, label } | null  — continue destination
 */
export default function LayerNav({ prev = null, next = null }) {
  const [logoHover, setLogoHover] = useState(false);

  return (
    <nav
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
      <div style={{ minWidth: "150px", display: "flex", alignItems: "center" }}>
        {prev && <NavPill href={prev.href} label={prev.label} dir="prev" />}
      </div>

      {/* LOGO — official ScoutIT wordmark */}
      <Link
        href="/"
        aria-label="ScoutIT — home"
        onMouseEnter={() => setLogoHover(true)}
        onMouseLeave={() => setLogoHover(false)}
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 400,
          fontSize: "26px",
          letterSpacing: "3px",
          lineHeight: 1,
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#f5f3ee" }}>Scout</span>
        <span
          style={{
            color: "var(--accent)",
            textShadow: logoHover ? "0 0 14px rgba(255,184,0,0.55)" : "none",
            transition: "text-shadow 0.3s ease",
          }}
        >
          IT
        </span>
      </Link>

      {/* CONTINUE */}
      <div style={{ minWidth: "150px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {next && <NavPill href={next.href} label={next.label} dir="next" />}
      </div>
    </nav>
  );
}
