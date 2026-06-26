"use client";

import Link from "next/link";
import { Briefcase, Star, TrendingUp, Eye, CheckCircle, BarChart2 } from "lucide-react";

function RatingBar({ label, value, max = 100 }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#E8AE3C" }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #6E531A, #E8AE3C)",
            borderRadius: 2,
            transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}

export default function BrokerPanel({ data, isPublic = false }) {
  const isEmpty =
    !data ||
    (data.verified_closures === 0 &&
      data.scout_rating === 0 &&
      data.active_listings_count === 0);

  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Briefcase size={14} strokeWidth={1.5} color="#E8AE3C" />
          <span style={panelLabel}>Broker</span>
        </div>
        {!isPublic && data?.profile_views_this_month != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Eye size={12} strokeWidth={1.5} color="var(--text-secondary)" />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-secondary)" }}>
              {data.profile_views_this_month} profile views this month
              {/* TODO FLAG 3: profile_views_this_month auto-increments via Supabase edge function */}
            </span>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div style={emptyState}>
          <p style={emptyText}>
            Your Scout Rating starts the moment you log your first verified closure.
          </p>
          <Link href="/dashboard" style={emptyCta}>Log a Closure</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Scout Rating */}
          <div style={metricBlock}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 16 }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 48, color: "#E8AE3C", lineHeight: 1 }}>
                {Number(data.scout_rating ?? 0).toFixed(1)}
              </span>
              <div style={{ display: "flex", flexDirection: "column", paddingBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  out of 5.0
                </span>
                <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={10}
                      strokeWidth={1.5}
                      fill={i <= Math.round(data.scout_rating ?? 0) ? "#E8AE3C" : "transparent"}
                      color="#E8AE3C"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <RatingBar label="Active Retentions" value={data.active_retentions_score ?? 0} />
              <RatingBar label="Continuity Score" value={data.continuity_score ?? 0} />
              <RatingBar
                label={`Stewardship Velocity +${Number(data.stewardship_velocity ?? 0).toFixed(0)} this month`}
                value={Math.min(100, (data.stewardship_velocity ?? 0) * 10)}
              />
            </div>

            <details style={{ marginTop: 12 }}>
              <summary
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: "#E8AE3C",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  userSelect: "none",
                }}
              >
                What improves your rating?
              </summary>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>
                Your Scout Rating is built from three signals: how many clients you actively retain (Active Retentions), how consistently you close within your committed timelines (Continuity Score), and how quickly you move new opportunities through your pipeline each month (Stewardship Velocity).
              </p>
            </details>
          </div>

          {/* Stats Row */}
          <div style={statsRow}>
            <div style={statCard}>
              <CheckCircle size={14} strokeWidth={1.5} color="#E8AE3C" style={{ marginBottom: 6 }} />
              <span style={statValue}>{data.verified_closures ?? 0}</span>
              <span style={statLabel}>Verified Closures</span>
            </div>
            <div style={statCard}>
              <BarChart2 size={14} strokeWidth={1.5} color="#E8AE3C" style={{ marginBottom: 6 }} />
              <span style={statValue}>{data.active_listings_count ?? 0}</span>
              <span style={statLabel}>Active Listings</span>
            </div>
            {!isPublic && (
              <div style={statCard}>
                <Eye size={14} strokeWidth={1.5} color="#E8AE3C" style={{ marginBottom: 6 }} />
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

const metricBlock = {
  background: "rgba(232, 174, 60,0.03)",
  border: "1px solid rgba(232, 174, 60,0.08)",
  borderRadius: 4,
  padding: 16,
};

const statsRow = {
  display: "flex",
  gap: 12,
};

const statCard = {
  flex: 1,
  background: "#1a1a1a",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 4,
  padding: "12px 10px",
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
  fontSize: 10,
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

const emptyCta = {
  fontFamily: "var(--font-body)",
  fontSize: 12,
  color: "#E8AE3C",
  letterSpacing: "0.06em",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};
