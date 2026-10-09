"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Radio, Compass, Clock } from "lucide-react";

/**
 * IntelDoorCard — The spatial door connecting Metropolis (L3) to Stratosphere (L2).
 * Embeds in Property Page chapters to let visitors know when a doubt needs depth.
 */
export default function IntelDoorCard({
  signal,
  propertySlug,
  doorChapterId = "hiddenintel",
  doorChapterNumber = "06",
  overrideQuestion,
}) {
  if (!signal) return null;

  const affectedSpace = signal.affectedSpaces?.find(
    (sp) => (sp.propertySlug || sp.slug).toLowerCase() === (propertySlug || "").toLowerCase()
  );

  const question = overrideQuestion || signal.doorQuestion || `How does the ${signal.title} affect this building?`;
  /* Points at the ARTICLE, not the layer. Investigations used to live on
     /layer/stratosphere as an 8-chapter workbench; that layer is now a
     preview and the chapters moved to /intel/[slug]. The signal slug IS the
     article slug, so the door needs no lookup table — it just goes straight
     to the story it was always opening. `fromProperty` and `door` ride
     along so the article can show the detour HUD and return the reader
     home afterwards. */
  const href = `/intel/${encodeURIComponent(signal.slug)}?fromProperty=${encodeURIComponent(propertySlug || "")}&door=${encodeURIComponent(doorChapterId)}`;

  const isSevere = signal.severity === "high";

  return (
    <div
      style={{
        margin: "28px 0",
        position: "relative",
        borderRadius: "8px",
        padding: "1px",
        background: isSevere
          ? "linear-gradient(135deg, rgba(var(--accent-rgb), 0.45) 0%, color-mix(in srgb, var(--flood-high, var(--red)) 30%, transparent) 50%, color-mix(in srgb, var(--text-primary) 5%, transparent) 100%)"
          : "linear-gradient(135deg, rgba(var(--accent-rgb), 0.35) 0%, color-mix(in srgb, var(--intel-blue, var(--sapphire)) 25%, transparent) 50%, color-mix(in srgb, var(--text-primary) 5%, transparent) 100%)",
        boxShadow: "0 8px 32px rgba(var(--bg-rgb), 0.4), 0 0 18px rgba(var(--accent-rgb), 0.08)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, var(--surface) 0%, var(--surface2) 100%)",
          borderRadius: "7px",
          padding: "22px 24px",
          backdropFilter: "blur(16px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient background glow */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: isSevere ? "radial-gradient(circle, rgba(var(--accent-rgb), 0.15) 0%, transparent 70%)" : "radial-gradient(circle, color-mix(in srgb, var(--intel-blue, var(--sapphire)) 15%, transparent) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Top Header Eyebrow & Status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--accent)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Radio size={11} className="animate-pulse" style={{ color: "var(--accent)" }} />
              Ch {doorChapterNumber} · Intel Detour · {signal.intelType || "SPATIAL SIGNAL"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: "3px",
                background: isSevere ? "color-mix(in srgb, var(--flood-high, var(--red)) 15%, transparent)" : "color-mix(in srgb, var(--green) 15%, transparent)",
                color: isSevere ? "var(--red)" : "var(--green)",
                border: isSevere ? "1px solid color-mix(in srgb, var(--flood-high, var(--red)) 30%, transparent)" : "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
              }}
            >
              {signal.statusBadge || "ACTIVE RECORD"}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-muted)",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Clock size={10} /> {signal.readTime || "2m read"}
            </span>
          </div>
        </div>

        {/* The Curiosity Question */}
        <h3
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(18px, 2.5vw, 22px)",
            fontWeight: 400,
            color: "var(--text-primary)",
            lineHeight: 1.35,
            margin: "0 0 10px 0",
            letterSpacing: "-0.01em",
          }}
        >
          &ldquo;{question}&rdquo;
        </h3>

        {/* Lede Summary */}
        <p
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "14px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: "0 0 18px 0",
            maxWidth: "640px",
          }}
        >
          {signal.summary?.whatHappened} {signal.summary?.whyItMatters}
        </p>

        {/* Affected Space Context Pill if matched */}
        {affectedSpace && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(var(--accent-rgb), 0.08)",
              border: "1px solid rgba(var(--accent-rgb), 0.25)",
              borderRadius: "4px",
              padding: "6px 12px",
              marginBottom: "18px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--accent-bright)",
            }}
          >
            <span style={{ color: "var(--accent)" }}>●</span>
            <span><strong>Target Impact:</strong> {affectedSpace.relationReason || affectedSpace.impactTag}</span>
          </div>
        )}

        {/* Action Bar / Click trigger */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            borderTop: "1px solid var(--border)",
            paddingTop: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            <ShieldCheck size={13} style={{ color: "var(--accent)" }} />
            <span>{signal.provenanceCompact || "Verified Primary Records"}</span>
          </div>

          <Link
            href={href}
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--accent)",
              color: "var(--on-accent)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "10px 18px",
              borderRadius: "4px",
              boxShadow: "0 2px 10px rgba(var(--accent-rgb), 0.25)",
              transition: "transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
            }}
            className="tactile lens-gold-btn"
          >
            <Sparkles size={13} />
            <span>Investigate Impact (Layer 02)</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
