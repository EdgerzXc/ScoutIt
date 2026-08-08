"use client";

import { getFreshness, freshnessAgeLabel } from "@/lib/freshness";

// ─────────────────────────────────────────────────────────────────────────
// FRESHNESS BADGE  (NEW_IDEAS.md §21)
//
// Two audiences, two behaviours:
//
//   variant="owner"   always renders. The owner needs to see amber and red
//                     on their own listings — that's the whole nudge.
//
//   variant="public"  renders ONLY for the outdated tier, as a buyer notice.
//                     Stamping "⚠️ Re-Verification Due" on a public card
//                     would punish owners for ScoutIt's own cadence and make
//                     the directory look abandoned. But past six months,
//                     silence becomes a representation that the data still
//                     holds — so the buyer gets told.
//
// Mobile first: single line, wraps rather than truncates, no hover needed.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "var(--font-mono, 'Courier New', monospace)";

export default function FreshnessBadge({
  lastVerifiedDate,
  variant = "owner",
  showAge = true,
  compact = false,
}) {
  const freshness = getFreshness(lastVerifiedDate);

  // Public surfaces stay quiet until the data is genuinely old enough that
  // not saying anything would mislead.
  if (variant === "public" && freshness.id !== "outdated") return null;

  if (variant === "public") {
    return (
      <div
        role="note"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "9px",
          padding: "11px 13px",
          background: freshness.bg,
          border: `0.5px solid ${freshness.accent}`,
          borderLeft: `2px solid ${freshness.color}`,
          borderRadius: "3px",
          margin: "16px 0",
        }}
      >
        <span aria-hidden="true" style={{ flexShrink: 0, fontSize: "13px", lineHeight: 1.4 }}>
          {freshness.badge}
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "12.5px",
            lineHeight: 1.6,
            color: "#d8d5d0",
          }}
        >
          {freshness.publicNotice}
        </span>
      </div>
    );
  }

  return (
    <span
      title={freshnessAgeLabel(lastVerifiedDate)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: compact ? "3px 7px" : "4px 9px",
        background: freshness.bg,
        border: `0.5px solid ${freshness.accent}`,
        borderRadius: "2px",
        color: freshness.color,
        fontFamily: MONO,
        fontSize: compact ? "8px" : "8.5px",
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        maxWidth: "100%",
      }}
    >
      <span aria-hidden="true">{freshness.badge}</span>
      {freshness.label}
      {showAge && !compact && freshness.days !== null && (
        <span style={{ opacity: 0.65 }}>· {freshness.days}d</span>
      )}
    </span>
  );
}
