"use client";

// PRIVATE ONLY — never rendered on public profile view.
// This panel is enforced at the page level, not just here.

import Link from "next/link";
import { Bookmark, Search, Share2 } from "lucide-react";

export default function SeekerPanel({ savedCount = 0, isAnonymous = false }) {
  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bookmark size={14} strokeWidth={1.5} color="#E8AE3C" />
          <span style={panelLabel}>Seeker</span>
        </div>
        <span style={privateBadge}>Private</span>
      </div>

      <div style={statsRow}>
        <div style={statCard}>
          <Bookmark size={14} strokeWidth={1.5} color="#E8AE3C" style={{ marginBottom: 6 }} />
          <span style={statValue}>{savedCount}</span>
          <span style={statLabel}>Saved Properties</span>
        </div>
        <div style={statCard}>
          <Search size={14} strokeWidth={1.5} color="rgba(232, 174, 60,0.4)" style={{ marginBottom: 6 }} />
          <span style={{ ...statValue, color: "var(--text-secondary)" }}>—</span>
          <span style={statLabel}>Active Searches</span>
        </div>
      </div>

      <div style={wishlistRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Share2 size={13} strokeWidth={1.5} color="var(--text-secondary)" />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)" }}>
            Wishlist Share
          </span>
        </div>
        <button
          disabled
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "rgba(232, 174, 60,0.35)",
            border: "1px solid rgba(232, 174, 60,0.15)",
            borderRadius: 20,
            padding: "4px 12px",
            cursor: "not-allowed",
            background: "none",
          }}
        >
          {/* TODO FLAG 2: Wishlist token share — generates token link with no name attached */}
          Generate Token Link — Coming Soon
        </button>
      </div>

      {isAnonymous && (
        <div style={anonNotice}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-secondary)" }}>
            Anonymous Browsing is active. Property views are not logged to your name.
          </span>
        </div>
      )}
    </section>
  );
}

const panelStyle = {
  background: "#161616",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 6,
  padding: 24,
};

const panelHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 20,
};

const panelLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#E8AE3C",
};

const privateBadge = {
  fontFamily: "var(--font-body)",
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "2px 8px",
  borderRadius: 20,
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 10,
  marginBottom: 16,
};

const statCard = {
  background: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 4,
  padding: "14px 10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const statValue = {
  fontFamily: "Georgia, serif",
  fontSize: 28,
  color: "#e5e2e1",
  lineHeight: 1.2,
};

const statLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 10,
  color: "var(--text-secondary)",
  letterSpacing: "0.06em",
  marginTop: 2,
};

const wishlistRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 0",
  borderTop: "1px solid rgba(255,255,255,0.04)",
};

const anonNotice = {
  marginTop: 12,
  padding: "8px 12px",
  background: "rgba(232, 174, 60,0.04)",
  border: "1px solid rgba(232, 174, 60,0.1)",
  borderRadius: 4,
};
