"use client";

import Link from "next/link";
import { useState } from "react";

// Plain-language companion for each cosmic layer name, so first-time visitors
// know what "Stratosphere" or "Metropolis" actually is. Shown as "Cosmic · Plain"
// on desktop; mobile collapses to the arrow only.
const LAYER_PLAIN = {
  Orbit: "The Board",
  Stratosphere: "Intel",
  Metropolis: "Explore",
  Crust: "Network",
  Mantle: "Discover",
  Core: "Workspace",
};

function NavPill({ href, label, dir }) {
  const [hover, setHover] = useState(false);
  const arrow = dir === "prev" ? "←" : "→";
  const plain = LAYER_PLAIN[label];

  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        textDecoration: "none",
        padding: "8px 14px",
        borderRadius: "999px",
        border: `1px solid ${hover ? "var(--accent)" : "rgba(255,184,0,0.4)"}`,
        background: hover ? "var(--accent)" : "rgba(255,184,0,0.07)",
        color: hover ? "#0e0e0e" : "#f0ede8",
        boxShadow: hover ? "0 0 22px rgba(255,184,0,0.4)" : "none",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        minHeight: "40px",
      }}
    >
      {dir === "prev" && (
        <span style={{ color: hover ? "#0e0e0e" : "var(--accent)", fontSize: "13px", lineHeight: 1 }}>{arrow}</span>
      )}
      {/* On mobile hide label text, show only arrow */}
      <span className="layer-nav-pill-label">
        {label}
        {plain && (
          <span style={{ opacity: 0.55, fontWeight: 500 }}> · {plain}</span>
        )}
      </span>
      {dir === "next" && (
        <span style={{ color: hover ? "#0e0e0e" : "var(--accent)", fontSize: "13px", lineHeight: 1 }}>{arrow}</span>
      )}
    </Link>
  );
}

export default function LayerNav({ prev = null, next = null }) {
  const [logoHover, setLogoHover] = useState(false);

  return (
    <>
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
          padding: "0 16px",
          background: "rgba(10,10,10,0.80)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,184,0,0.12)",
        }}
      >
        {/* BACK */}
        <div style={{ display: "flex", alignItems: "center", minWidth: "40px" }}>
          {prev && <NavPill href={prev.href} label={prev.label} dir="prev" />}
        </div>

        {/* LOGO */}
        <Link
          href="/"
          aria-label="ScoutIT — home"
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 400,
            fontSize: "22px",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: "40px" }}>
          {next && <NavPill href={next.href} label={next.label} dir="next" />}
        </div>
      </nav>

      <style>{`
        @media (max-width: 480px) {
          .layer-nav-pill-label {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
