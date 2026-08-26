"use client";

import { Briefcase, Eye, CheckCircle, BarChart2, ShieldCheck } from "lucide-react";

export default function BrokerPanel({ data, isPublic = false, prcVerified = false, prcLicense = "" }) {
  const isEmpty = !data || (data.verified_closures === 0 && data.active_listings_count === 0);

  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Briefcase size={14} strokeWidth={1.5} color="var(--accent)" />
          <span style={panelLabel}>Broker</span>
          {/* RA 9646 badge — renders ONLY when staff verified the credential
              against the PRC registry, never from the mere number. */}
          {prcVerified && (
            <span style={prcBadge} title={prcLicense ? `PRC License ${prcLicense} — verified by ScoutIt` : "Verified by ScoutIt"}>
              <ShieldCheck size={11} strokeWidth={2} />
              PRC VERIFIED{prcLicense ? ` · ${prcLicense}` : ""}
            </span>
          )}
        </div>
        {!isPublic && data?.profile_views_this_month != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Eye size={12} strokeWidth={1.5} color="var(--text-secondary)" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)" }}>
              {data.profile_views_this_month} profile views this month
            </span>
          </div>
        )}
      </div>

      {isPublic ? (
        <div style={emptyState}>
          <strong style={recordState}>Building a ScoutIt record</strong>
          <p style={emptyText}>No public performance evidence is attached to this profile. Property-specific representation appears only on an accepted property roster.</p>
        </div>
      ) : isEmpty ? (
        <div style={emptyState}>
          <strong style={recordState}>Building a ScoutIt record</strong>
          <p style={emptyText}>Qualified ScoutIt activity will appear after the versioned metric projection is available.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={metricBlock}>
            <strong style={recordState}>Building a ScoutIt record</strong>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>
              Legacy five-point scores are retired. Only qualified activity from the versioned ScoutIt projection will appear here.
            </p>
          </div>

          {/* Stats Row */}
          <div style={statsRow}>
            <div style={statCard}>
              <CheckCircle size={14} strokeWidth={1.5} color="var(--accent)" style={{ marginBottom: 6 }} />
              <span style={statValue}>{data.verified_closures ?? 0}</span>
              <span style={statLabel}>Verified Closures</span>
            </div>
            <div style={statCard}>
              <BarChart2 size={14} strokeWidth={1.5} color="var(--accent)" style={{ marginBottom: 6 }} />
              <span style={statValue}>{data.active_listings_count ?? 0}</span>
              <span style={statLabel}>Active Listings</span>
            </div>
            {!isPublic && (
              <div style={statCard}>
                <Eye size={14} strokeWidth={1.5} color="var(--accent)" style={{ marginBottom: 6 }} />
                <span style={statValue}>{data.profile_views_this_month ?? 0}</span>
                <span style={statLabel}>Profile Views</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const panelStyle = {
  background: "linear-gradient(165deg, rgba(20,20,18,0.85), rgba(12,12,10,0.95))",
  border: "1px solid var(--border-solid)",
  borderRadius: 8,
  padding: 24,
  backdropFilter: "blur(12px)",
};

const panelHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 20,
};

const panelLabel = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--accent)",
};

const prcBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: "var(--success)",
  background: "color-mix(in srgb, var(--success) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
  borderRadius: 3,
  padding: "2px 7px",
};

const metricBlock = {
  background: "color-mix(in srgb, var(--accent) 3%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 8%, transparent)",
  borderRadius: 6,
  padding: 16,
};

const statsRow = {
  display: "flex",
  gap: 12,
};

const statCard = {
  flex: 1,
  background: "linear-gradient(165deg, rgba(26,25,23,0.6), rgba(17,17,16,0.8))",
  border: "1px solid var(--border-solid)",
  borderRadius: 6,
  padding: "12px 10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const statValue = {
  fontFamily: "var(--font-display)",
  fontSize: 24,
  color: "var(--on-surface)",
  lineHeight: 1.2,
};

const statLabel = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-secondary)",
  letterSpacing: "0.06em",
  marginTop: 2,
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

const recordState = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--accent)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};
