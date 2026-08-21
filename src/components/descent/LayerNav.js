"use client";

import Link from "next/link";
import { useState } from "react";

import AmbientRail from "@/components/layout/ambient/AmbientRail";

// Plain-language companion for each cosmic layer name, so first-time visitors
// know what "Stratosphere" or "Metropolis" actually is. Shown as "Cosmic · Plain"
// on desktop; mobile collapses to the arrow only.
const LAYER_PLAIN = {
  // 🔴 WAS "The Board" until 2026-08-08 — see ACTION 01_NOW A7.
  // "The Board" meant RANKINGS here, while the mobile bottom nav has an item
  // labelled "Board" that opens /wishlist (your SAVES). Two unrelated things,
  // one word apart, both in the primary navigation. Obvious once you know
  // ScoutIt; invisible to a stranger, and it is one of the first things tapped.
  // Orbit is the concept that already exists AND is already indexed at
  // /layer/orbit — only the plain-language label ever said "The Board".
  Orbit: "Orbit",
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
        border: `1px solid ${hover ? "var(--accent)" : "rgba(232, 174, 60,0.4)"}`,
        background: hover ? "var(--accent)" : "rgba(232, 174, 60,0.07)",
        color: hover ? "#0e0e0e" : "#f0ede8",
        boxShadow: hover ? "0 0 22px rgba(232, 174, 60,0.4)" : "none",
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
          <span style={{ opacity: 1, fontWeight: 500 }}> · {plain}</span>
        )}
      </span>
      {dir === "next" && (
        <span style={{ color: hover ? "#0e0e0e" : "var(--accent)", fontSize: "13px", lineHeight: 1 }}>{arrow}</span>
      )}
    </Link>
  );
}

export default function LayerNav({
  prev = null,
  next = null,
  /* Location for the ambient readout, same shape the property page already
     passes to <Header ambientContext={...}>: { key, source, latitude,
     longitude, shortName }. Null falls back to the rail's own default. */
  ambientContext = null,
}) {
  const [logoHover, setLogoHover] = useState(false);

  return (
    <>
      <nav
        aria-label="Layer navigation"
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
          // Unprefixed ONLY. Paired with -webkit-backdrop-filter the pipeline
          // keeps just the prefixed one and current Chrome rejects it, so the
          // header silently loses its blur. Safari 18+ needs no prefix.
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(232, 174, 60,0.12)",
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
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "22px",
            letterSpacing: "3px",
            lineHeight: 1,
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <span style={{ color: "var(--accent)" }}>S</span>
          <span style={{ color: "#f5f3ee" }}>cout</span>
          <span
            style={{
              color: "var(--accent)",
              textShadow: logoHover ? "0 0 14px rgba(232, 174, 60,0.55)" : "none",
              transition: "text-shadow 0.3s ease",
            }}
          >
            IT
          </span>
        </Link>

        {/* AMBIENT + CONTINUE
            The logo is absolutely centred, so this side can carry the
            ambient readout without pushing it off centre.

            This is the SAME <AmbientRail> the site header and the property
            master page use — not a second weather readout. An earlier pass
            here built its own, which silently pulled from the wrong hook:
            there are two exporting `useAmbientData`, and only
            `ambient/ambientData.js` accepts a location context. The one in
            `ambient/useAmbientData.js` does not, so a bespoke readout could
            never show the weather for a given place. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "14px",
            minWidth: "40px",
          }}
        >
          <div className="layer-nav-ambient">
            <AmbientRail user={null} context={ambientContext} />
          </div>
          {next && <NavPill href={next.href} label={next.label} dir="next" />}
        </div>
      </nav>

      <style jsx global>{`
        @media (max-width: 480px) {
          .layer-nav-pill-label {
            display: none;
          }
        }

        /* The header's job on a phone is back / logo / next. Conditions are
           the first thing to go when there is no room for all three. */
        @media (max-width: 860px) {
          .layer-nav-ambient {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
