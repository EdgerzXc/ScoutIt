"use client";

import Link from "next/link";
import { BookOpen, CheckCircle, Award, Zap } from "lucide-react";

export default function ResearcherPanel({ data, isAnonymous = false }) {
  const isEmpty =
    !data ||
    (data.intel_submissions === 0 && data.credibility_score === 0);

  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={14} strokeWidth={1.5} color="#ffb800" />
          <span style={panelLabel}>Researcher</span>
        </div>
        {isAnonymous && (
          <span style={anonBadge}>Anonymous Byline Active</span>
        )}
      </div>

      {isEmpty ? (
        <div style={emptyState}>
          <p style={emptyText}>
            Submit your first Intel article to start building credibility.
          </p>
          <Link href="/intel" style={emptyCta}>Write Intel</Link>
        </div>
      ) : (
        <div style={statsRow}>
          <div style={statCard}>
            <BookOpen size={14} strokeWidth={1.5} color="#ffb800" style={{ marginBottom: 6 }} />
            <span style={statValue}>{data.intel_submissions ?? 0}</span>
            <span style={statLabel}>Submissions</span>
          </div>
          <div style={statCard}>
            <CheckCircle size={14} strokeWidth={1.5} color="#ffb800" style={{ marginBottom: 6 }} />
            <span style={statValue}>{data.accepted_submissions ?? 0}</span>
            <span style={statLabel}>Accepted</span>
          </div>
          <div style={statCard}>
            <Award size={14} strokeWidth={1.5} color="#ffb800" style={{ marginBottom: 6 }} />
            <span style={statValue}>{Number(data.credibility_score ?? 0).toFixed(1)}</span>
            <span style={statLabel}>Credibility</span>
          </div>
          <div style={statCard}>
            <Zap size={14} strokeWidth={1.5} color="#ffb800" style={{ marginBottom: 6 }} />
            <span style={statValue}>{data.connects_earned_from_research ?? 0}</span>
            <span style={statLabel}>Connects Earned</span>
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
  color: "#ffb800",
};

const anonBadge = {
  fontFamily: "var(--font-body)",
  fontSize: 10,
  color: "var(--text-secondary)",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "2px 8px",
  borderRadius: 20,
  letterSpacing: "0.04em",
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 10,
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
  color: "#ffb800",
  letterSpacing: "0.06em",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};
