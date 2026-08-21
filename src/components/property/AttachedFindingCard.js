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

  const color = resolution.color || "#10b981";

  const dossierHref = `/layer/stratosphere?fromProperty=${encodeURIComponent(propertySlug || "")}&signal=${encodeURIComponent(signal.slug)}`;

  return (
    <div
      style={{
        margin: "0 0 32px 0",
        borderRadius: "8px",
        padding: "1px",
        background: `linear-gradient(135deg, ${color}66 0%, rgba(232, 174, 60, 0.3) 50%, rgba(255, 255, 255, 0.08) 100%)`,
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px ${color}1a`,
        animation: "riseIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #19141f 0%, #120f17 100%)",
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
                background: `${color}22`,
                color: color,
                border: `1px solid ${color}44`,
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
                  color: "rgba(240, 237, 232, 0.4)",
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
            color: "#f7f5f0",
            lineHeight: 1.3,
            margin: "0 0 8px 0",
          }}
        >
          {signal.title}: <span style={{ color: "#F7C64E" }}>{resolution.headline}</span>
        </h3>

        {/* Summary */}
        <p
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "14px",
            color: "rgba(240, 237, 232, 0.85)",
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
            borderTop: "1px solid rgba(240, 237, 232, 0.08)",
            paddingTop: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={13} style={{ color: "#E8AE3C" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "#E8AE3C",
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
              color: "rgba(240, 237, 232, 0.7)",
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
