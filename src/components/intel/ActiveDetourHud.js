"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Radio, Compass, RotateCcw } from "lucide-react";

/**
 * ActiveDetourHud — Pinned top banner when Stratosphere is entered from a property.
 * Anchors the user with their origin context so Layer 02 feels like an intentional detour.
 */
export default function ActiveDetourHud({
  fromProperty,
  propertyTitle,
  door,
  relationReason,
}) {
  if (!fromProperty) return null;

  const returnHref = `/property/${encodeURIComponent(fromProperty)}${door ? `?chapter=${encodeURIComponent(door)}` : ""}`;
  const displayTitle = propertyTitle || fromProperty.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      style={{
        position: "sticky",
        top: "0",
        zIndex: 40,
        width: "100%",
        background: "rgba(18, 14, 24, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(232, 174, 60, 0.25)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        animation: "riseIn 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Left: Origin Details */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              background: "rgba(232, 174, 60, 0.15)",
              border: "1px solid rgba(232, 174, 60, 0.3)",
              color: "#F7C64E",
              flexShrink: 0,
            }}
          >
            <Radio size={14} className="animate-pulse" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#E8AE3C",
              }}
            >
              <span>Layer 02 Detour Active</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: "rgba(240, 237, 232, 0.7)" }}>Resolution Mode</span>
            </div>

            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13.5px",
                color: "#f7f5f0",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <Building2 size={13} style={{ color: "#F7C64E", flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>{displayTitle}</span>
              {relationReason && (
                <span style={{ color: "rgba(240, 237, 232, 0.5)", fontSize: "12px" }}>
                  ({relationReason})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Return Link Action */}
        <Link
          href={returnHref}
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(240, 237, 232, 0.08)",
            border: "1px solid rgba(240, 237, 232, 0.15)",
            color: "#f7f5f0",
            fontFamily: "var(--font-mono)",
            fontSize: "10.5px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "6px 12px",
            borderRadius: "4px",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
          className="tactile"
        >
          <RotateCcw size={12} style={{ color: "#E8AE3C" }} />
          <span>Return to Listing</span>
        </Link>
      </div>
    </div>
  );
}
