"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, ShieldCheck, Sparkles, Building2 } from "lucide-react";

/**
 * FulfilmentTerminal — The turn where curiosity closes.
 * Renders at the end of an investigation in Stratosphere so the reader concludes with a verdict
 * and returns directly to Chapter 10 "Your Move" on their property.
 */
export default function FulfilmentTerminal({
  signal,
  fromProperty,
  originPropertyTitle,
  affectedSpaces = [],
  defaultResolutionKey = "resolved",
}) {
  const router = useRouter();
  const [selectedResolution, setSelectedResolution] = useState(defaultResolutionKey);

  const matchedSpace = affectedSpaces.find(
    (sp) => (sp.propertySlug || sp.slug).toLowerCase() === (fromProperty || "").toLowerCase()
  );

  const targetSlug = fromProperty || matchedSpace?.slug || affectedSpaces[0]?.slug || "the-estate-makati";
  const targetTitle = originPropertyTitle || matchedSpace?.title || affectedSpaces[0]?.title || "the property";

  const resolutions = signal.resolutions || {
    resolved: {
      id: "resolved",
      name: "Resolved",
      color: "#10b981",
      glyph: "●",
      headline: "Impact Confirmed & Understood",
      summary: "The findings apply directly to this building. Return to Your Move with this context attached to your inquiry.",
      inquiryTopic: `${signal.title} · Compliance & Impact Overview`,
    },
    escalated: {
      id: "escalated",
      name: "Escalated",
      color: "#f59e0b",
      glyph: "◆",
      headline: "High Urgency & Market Stakes",
      summary: "The investigation revealed critical factors affecting floorplate demand and yield. Connect immediately with an advisor.",
      inquiryTopic: `Urgent Due Diligence on ${signal.title}`,
    },
    ruledout: {
      id: "ruledout",
      name: "Ruled Out",
      color: "#3b82f6",
      glyph: "○",
      headline: "Risk Cleared / Does Not Apply",
      summary: "This parcel or tower is exempt or already compliant. Proceed confidently back to Chapter 10 Your Move.",
      inquiryTopic: `Confirmation of Exemption from ${signal.title}`,
    },
  };

  const activeRes = resolutions[selectedResolution] || resolutions.resolved;

  const returnUrl = `/property/${encodeURIComponent(targetSlug)}?chapter=yourmove&signal=${encodeURIComponent(signal.slug)}&finding=${encodeURIComponent(selectedResolution)}#yourmove`;

  return (
    <div
      style={{
        marginTop: "32px",
        borderRadius: "10px",
        border: "1px solid rgba(232, 174, 60, 0.35)",
        background: "linear-gradient(180deg, #18121d 0%, #100d14 100%)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(232, 174, 60, 0.1)",
        padding: "24px 28px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient Radial Accent */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${activeRes.color}22 0%, transparent 70%)`,
          pointerEvents: "none",
          transition: "background 0.3s ease",
        }}
      />

      {/* Eyebrow & Terminal State Label */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#E8AE3C",
            }}
          >
            Fulfilment Terminal · The Curiosity Closes
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(240, 237, 232, 0.6)" }}>
          <ShieldCheck size={12} style={{ color: "#E8AE3C" }} />
          <span>Investigation Complete</span>
        </div>
      </div>

      {/* Main Conclusion Title */}
      <h3
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(20px, 3vw, 26px)",
          fontWeight: 400,
          color: "#f7f5f0",
          lineHeight: 1.25,
          margin: "0 0 14px 0",
          letterSpacing: "-0.01em",
        }}
      >
        Select your conclusion for <span style={{ color: "#F7C64E" }}>{targetTitle}</span>
      </h3>

      <p
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "14px",
          color: "rgba(240, 237, 232, 0.8)",
          lineHeight: 1.6,
          margin: "0 0 20px 0",
          maxWidth: "680px",
        }}
      >
        An investigation must terminate with an explicit verdict. Choose what you have verified to carry the evidence back to Chapter 10 &ldquo;Your Move&rdquo;.
      </p>

      {/* 3 Interactive Outcome Selectors */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
          marginBottom: "24px",
        }}
      >
        {Object.entries(resolutions).map(([key, item]) => {
          const isSelected = selectedResolution === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedResolution(key)}
              style={{
                background: isSelected ? "rgba(30, 24, 38, 0.9)" : "rgba(20, 18, 22, 0.6)",
                border: isSelected ? `1.5px solid ${item.color}` : "1px solid rgba(240, 237, 232, 0.08)",
                boxShadow: isSelected ? `0 0 16px ${item.color}33` : "none",
                borderRadius: "6px",
                padding: "14px 16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              className="tactile"
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: item.color,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span style={{ fontSize: "11px" }}>{item.glyph}</span> {item.name}
                </span>
                {isSelected && <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: item.color }}>● ACTIVE</span>}
              </div>
              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "14px",
                  color: isSelected ? "#ffffff" : "rgba(240, 237, 232, 0.9)",
                  lineHeight: 1.3,
                }}
              >
                {item.headline}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Verdict Explanation */}
      <div
        style={{
          background: "rgba(10, 8, 12, 0.6)",
          border: `1px solid ${activeRes.color}33`,
          borderRadius: "6px",
          padding: "16px 18px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ color: activeRes.color, fontSize: "14px" }}>{activeRes.glyph}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: activeRes.color,
            }}
          >
            Finding: {activeRes.headline}
          </span>
        </div>
        <p
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "13.5px",
            color: "rgba(240, 237, 232, 0.85)",
            lineHeight: 1.55,
            margin: "0",
          }}
        >
          {activeRes.summary}
        </p>
      </div>

      {/* Action Footers: Return to Metropolis / Your Move */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          borderTop: "1px solid rgba(240, 237, 232, 0.08)",
          paddingTop: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 size={15} style={{ color: "#E8AE3C" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "rgba(240, 237, 232, 0.7)",
            }}
          >
            Returning to <strong>{targetTitle}</strong> (Ch. 10 Your Move)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <Link
            href={returnUrl}
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#E8AE3C",
              color: "#0e0e0e",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "12px 22px",
              borderRadius: "4px",
              boxShadow: "0 4px 18px rgba(232, 174, 60, 0.35)",
              transition: "all 0.15s ease",
            }}
            className="tactile"
          >
            <Sparkles size={14} />
            <span>Return to Your Move with Finding Attached</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
