"use client";

import Link from "next/link";
import { ShieldCheck, ArrowUpRight, Sparkles, CheckCircle2, AlertTriangle, Radio } from "lucide-react";
import { getSignalBySlug, getSignalResolution } from "@/lib/signalsData";

/**
 * AttachedFindingCard — Displayed in Chapter 10 "Your Move" when returning from a Stratosphere investigation.
 * Arms the buyer/operator with verified intelligence attached to their inquiry.
 */
export default function AttachedFindingCard({
  signalSlug,
  findingKey = "resolved",
  propertySlug,
  onClear,
}) {
  if (!signalSlug) return null;

  const signal = getSignalBySlug(signalSlug);
  if (!signal) return null;

  const resolution = getSignalResolution(signalSlug, findingKey);
  if (!resolution) return null;

  const isResolved = findingKey === "resolved";
  const isEscalated = findingKey === "escalated";
  const isRuledOut = findingKey === "ruledout";

  const color = resolution.color || "var(--green)";

  const dossierHref = `/layer/stratosphere?fromProperty=${encodeURIComponent(propertySlug || "")}&signal=${encodeURIComponent(signal.slug)}`;

  return (
    <div
      style={{
        margin: "0 0 32px 0",
        borderRadius: "8px",
        padding: "1px",
        background: `linear-gradient(135deg, color-mix(in srgb, ${color} 40%, transparent) 0%, rgba(var(--accent-rgb), 0.3) 50%, var(--border-subtle) 100%)`,
        boxShadow: `0 8px 30px rgba(var(--bg-rgb), 0.4), 0 0 20px color-mix(in srgb, ${color} 10%, transparent)`,
        animation: "riseIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1)",
      }}
    >
      <div
        style={{
          background: "var(--surface-alt)",
          borderRadius: "7px",
          padding: "22px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: color,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Radio size={11} className="animate-pulse" style={{ color: color }} />
              Attached Spatial Finding · Layer 02 Resolved
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: "3px",
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
                color: color,
                border: `1px solid color-mix(in srgb, ${color} 27%, transparent)`,
              }}
            >
              {resolution.glyph} {resolution.name.toUpperCase()}
            </span>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Headline */}
        <h3
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(18px, 2.4vw, 22px)",
            fontWeight: 400,
            color: "var(--text-primary)",
            lineHeight: 1.3,
            margin: "0 0 8px 0",
          }}
        >
          {signal.title}: <span style={{ color: "var(--accent-bright)" }}>{resolution.headline}</span>
        </h3>

        {/* Summary */}
        <p
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "14px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: "0 0 16px 0",
            maxWidth: "680px",
          }}
        >
          {resolution.summary}
        </p>

        {/* Bottom Bar with Memo Notice and Dossier Link */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            borderTop: "1px solid var(--border)",
            paddingTop: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={13} style={{ color: "var(--accent)" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--accent)",
              }}
            >
              Inquiry is pre-armed with topic: &ldquo;{resolution.inquiryTopic}&rdquo;
            </span>
          </div>

          <Link
            href={dossierHref}
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              transition: "color 0.15s ease",
            }}
            className="hover:text-gold"
          >
            <span>Review Full Dossier</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
