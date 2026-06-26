"use client";

// PRIVATE ONLY — never rendered on public profile view.
// This panel is enforced at the page level, not just here.

import Link from "next/link";
import { Building2, Eye, MessageSquare, Users } from "lucide-react";

export default function OwnerPanel({ listings = [], inquiryCount = 0 }) {
  const isEmpty = listings.length === 0;

  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={14} strokeWidth={1.5} color="#E8AE3C" />
          <span style={panelLabel}>Owner</span>
        </div>
        <span style={privateBadge}>Private</span>
      </div>

      <div style={statsRow}>
        <div style={statCard}>
          <Building2 size={14} strokeWidth={1.5} color="#E8AE3C" style={{ marginBottom: 6 }} />
          <span style={statValue}>{listings.length}</span>
          <span style={statLabel}>Listed Spaces</span>
        </div>
        <div style={statCard}>
          <MessageSquare size={14} strokeWidth={1.5} color="#E8AE3C" style={{ marginBottom: 6 }} />
          <span style={statValue}>{inquiryCount}</span>
          <span style={statLabel}>Total Inquiries</span>
        </div>
        <div style={statCard}>
          <Users size={14} strokeWidth={1.5} color="rgba(232, 174, 60,0.4)" style={{ marginBottom: 6 }} />
          <span style={{ ...statValue, color: "var(--text-secondary)" }}>—</span>
          <span style={statLabel}>Broker Assoc.</span>
        </div>
      </div>

      {isEmpty ? (
        <div style={emptyState}>
          <p style={emptyText}>No active listings. Add your first property from the dashboard.</p>
          <Link href="/dashboard" style={emptyCta}>List a Property</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {listings.slice(0, 3).map((l) => (
            <div key={l.id} style={listingRow}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#e5e2e1" }}>
                  {l.title}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-secondary)" }}>
                  {l.location} · {l.type}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: l.verified ? "#4caf7d" : "var(--text-secondary)",
                    border: `1px solid ${l.verified ? "rgba(76,175,125,0.3)" : "rgba(255,255,255,0.08)"}`,
                    padding: "2px 6px",
                    borderRadius: 20,
                  }}
                >
                  {l.verified ? "Verified" : `${l.completeness_score ?? 0}%`}
                </span>
              </div>
            </div>
          ))}
          {listings.length > 3 && (
            <Link href="/dashboard" style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#E8AE3C", marginTop: 4 }}>
              +{listings.length - 3} more listings
            </Link>
          )}
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
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
  marginBottom: 16,
};

const statCard = {
  background: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 4,
  padding: "12px 8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const statValue = {
  fontFamily: "Georgia, serif",
  fontSize: 24,
  color: "#e5e2e1",
  lineHeight: 1.2,
};

const statLabel = {
  fontFamily: "var(--font-body)",
  fontSize: 9,
  color: "var(--text-secondary)",
  letterSpacing: "0.06em",
  marginTop: 2,
};

const listingRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};

const emptyState = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 12,
  padding: "8px 0",
};

const emptyText = {
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--text-secondary)",
  fontStyle: "italic",
  lineHeight: 1.6,
};

const emptyCta = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "#E8AE3C",
  letterSpacing: "0.06em",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};
