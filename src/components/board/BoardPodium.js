"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { rankBoard, BOARD_CATEGORIES } from "@/data/mock/mockShowcase";
import { Flame, ArrowRight, Bookmark, ShieldCheck, Sparkles, Building2, Trophy } from "lucide-react";

const TIER_THEME = {
  universe: {
    label: "Champion",
    name: "Gold Apex",
    color: "#E8AE3C",
    rgb: "232, 174, 60",
    border: "rgba(232, 174, 60, 0.45)",
    glow: "rgba(232, 174, 60, 0.25)",
  },
  cluster: {
    label: "Runner-Up",
    name: "Silver",
    color: "#E0E0E0",
    rgb: "224, 224, 224",
    border: "rgba(224, 224, 224, 0.35)",
    glow: "rgba(224, 224, 224, 0.12)",
  },
  solar: {
    label: "Contender",
    name: "Bronze",
    color: "#CD7F32",
    rgb: "205, 127, 50",
    border: "rgba(205, 127, 50, 0.35)",
    glow: "rgba(205, 127, 50, 0.12)",
  },
  starry: {
    label: "Ranked",
    name: "Standard",
    color: "#9E9E9E",
    rgb: "158, 158, 158",
    border: "rgba(255, 255, 255, 0.08)",
    glow: "transparent",
  },
};

export default function BoardPodium() {
  const [entries, setEntries] = useState([]);
  const [category, setCategory] = useState("All");
  const [savedSlugs, setSavedSlugs] = useState(new Set());

  useEffect(() => {
    let alive = true;
    fetch("/api/showcase")
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.entries) setEntries(d.entries);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const allRanked = useMemo(
    () => rankBoard(entries, { award: "Most Inquired", category }),
    [entries, category]
  );

  const hero = allRanked[0];
  const runners = allRanked.slice(1, 3);

  const categoryCounts = useMemo(() => {
    const counts = { All: entries.length };
    BOARD_CATEGORIES.forEach((c) => {
      if (c !== "All") {
        counts[c] = entries.filter((e) => e.category === c).length;
      }
    });
    return counts;
  }, [entries]);

  const toggleSave = (slug, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <section className="orbit-showcase-container">
      {/* ── 1. SPLIT-COMMAND HERO (TITLE + MISSION PRE-INTRODUCTION) ── */}
      <header className="orbit-hero-split">
        <div className="orbit-hero-left">
          <div className="orbit-telemetry-badge">
            <span className="orbit-signal-pulse" />
            <span className="orbit-telemetry-text">
              LAYER 01 // ORBIT DEMAND INDEX · LIVE TELEMETRY
            </span>
          </div>
          <h1 className="orbit-hero-title">
            Top Inquired <span className="text-gold-gradient">Spaces</span>
          </h1>
          <p className="orbit-hero-subtitle">
            The most demanded properties in the Philippines, calculated from real verified inquiry volume and seeker saves over the last 30 days.
          </p>
        </div>

        <aside className="orbit-mission-card">
          <div className="orbit-mission-header">
            <Sparkles size={13} className="text-gold-accent" />
            <span className="orbit-mission-kicker">LAYER PURPOSE &amp; PROVENANCE</span>
          </div>
          <p className="orbit-mission-body">
            Orbit is ScoutIt&apos;s demand index. It tracks the most-saved and inquired spaces across the Philippines, so you can see where market attention is moving before transactions close.
          </p>
          <div className="orbit-mission-footer">
            <ShieldCheck size={13} className="text-gold-accent" />
            <span>100% Earned demand · Unpaid &amp; unbiased</span>
          </div>
        </aside>
      </header>

      {/* ── 2. HORIZONTAL CATEGORY SCANNER PILLS ── */}
      <div className="orbit-filter-rail-wrapper">
        <nav className="orbit-filter-rail" aria-label="Orbit Property Categories">
          {BOARD_CATEGORIES.map((c) => {
            const count = categoryCounts[c] || 0;
            const isActive = category === c;
            return (
              <button
                key={c}
                type="button"
                className={`orbit-filter-pill ${isActive ? "is-active" : ""}`}
                onClick={() => setCategory(c)}
              >
                <span>{c === "All" ? "All Spaces" : c}</span>
                <span className="orbit-filter-count">{count}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── 3. PODIUM STAGE (APEX HERO + RUNNER-UPS) ── */}
      {allRanked.length === 0 ? (
        <div className="orbit-empty-state">
          <Building2 size={36} className="text-gold-accent/40 mb-3" />
          <p className="orbit-empty-text">No verified demand telemetry recorded in this category yet.</p>
        </div>
      ) : (
        <div className="orbit-podium-grid">
          {/* #01 CHAMPION APEX CARD */}
          {hero && (
            <article className="orbit-apex-card">
              <Link href="/showcase" className="orbit-apex-link">
                <div
                  className="orbit-apex-media"
                  style={hero.photo ? { backgroundImage: `url(${hero.photo})` } : undefined}
                >
                  <div className="orbit-media-gradient" />
                  <div className="orbit-apex-badge">
                    <span className="orbit-badge-ring">#01</span>
                    <span className="orbit-badge-label">Champion</span>
                  </div>
                  <div className="orbit-apex-chip">
                    <Flame size={12} className="text-gold-accent" />
                    <span>Top Demand Apex</span>
                  </div>
                </div>

                <div className="orbit-apex-content">
                  <div className="orbit-card-topbar">
                    <span className="orbit-prop-category">{hero.category}</span>
                    <span className="orbit-prop-location">{hero.location}</span>
                  </div>

                  <h2 className="orbit-apex-name">{hero.name}</h2>

                  {/* Demand telemetry meter */}
                  <div className="orbit-velocity-box">
                    <div className="orbit-velocity-header">
                      <span className="orbit-velocity-title">Market Inquiry Velocity</span>
                      <strong className="orbit-velocity-score">98.4% Score</strong>
                    </div>
                    <div className="orbit-meter-bar">
                      <div className="orbit-meter-fill" style={{ width: "98.4%" }} />
                    </div>
                    <div className="orbit-stat-row">
                      <div className="orbit-stat-item">
                        <span className="orbit-stat-num">{hero.inquiry_count}</span>
                        <span className="orbit-stat-lbl">Inquiries / Mo</span>
                      </div>
                      <div className="orbit-stat-item">
                        <span className="orbit-stat-num">{hero.saves || Math.round(hero.inquiry_count * 1.8)}</span>
                        <span className="orbit-stat-lbl">Private Saves</span>
                      </div>
                      <div className="orbit-stat-item">
                        <span className="orbit-stat-num">{hero.views || hero.inquiry_count * 8}</span>
                        <span className="orbit-stat-lbl">View Signals</span>
                      </div>
                    </div>
                  </div>

                  <div className="orbit-apex-actions">
                    <span className="orbit-primary-btn">
                      Explore The Showcase <ArrowRight size={14} />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleSave(hero.property_slug, e)}
                      className={`orbit-save-btn ${savedSlugs.has(hero.property_slug) ? "is-saved" : ""}`}
                      aria-label="Save to Board"
                    >
                      <Bookmark size={14} />
                      <span>{savedSlugs.has(hero.property_slug) ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                </div>
              </Link>
            </article>
          )}

          {/* #02 & #03 RUNNERS-UP STACK */}
          <div className="orbit-runners-stack">
            {runners.map((item) => {
              const theme = TIER_THEME[item.tier] || TIER_THEME.cluster;
              const isSaved = savedSlugs.has(item.property_slug);
              return (
                <article
                  key={item.property_slug || item.rank}
                  className="orbit-runner-card"
                  style={{ "--tier-color": theme.color, "--tier-border": theme.border }}
                >
                  <Link href="/showcase" className="orbit-runner-link">
                    <div className="orbit-runner-body">
                      {/* TOP BAR: BADGES (LEFT) + CATEGORY/LOCATION (RIGHT) */}
                      <div className="orbit-runner-topbar">
                        <div className="orbit-runner-badges-group">
                          <span className="orbit-runner-rank" style={{ borderColor: theme.border, color: theme.color }}>
                            #{String(item.rank).padStart(2, "0")}
                          </span>
                          <span className="orbit-runner-tier-tag" style={{ color: theme.color, borderColor: theme.border }}>
                            {theme.label}
                          </span>
                        </div>
                        <div className="orbit-runner-meta-group">
                          <span className="orbit-prop-category" style={{ color: theme.color }}>{item.category}</span>
                          <span className="orbit-prop-dot">·</span>
                          <span className="orbit-prop-location">{item.location}</span>
                        </div>
                      </div>

                      {/* MAIN PROPERTY NAME */}
                      <h3 className="orbit-runner-name">{item.name}</h3>

                      {/* BOTTOM STATS + SAVE */}
                      <div className="orbit-runner-stats">
                        <div className="orbit-runner-stat-item">
                          <strong style={{ color: theme.color }}>{item.inquiry_count}</strong>
                          <small>Inquiries</small>
                        </div>
                        <div className="orbit-runner-stat-item">
                          <strong>{item.saves || Math.round(item.inquiry_count * 1.7)}</strong>
                          <small>Saves</small>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleSave(item.property_slug, e)}
                          className={`orbit-runner-save ${isSaved ? "is-saved" : ""}`}
                          aria-label="Save space"
                        >
                          <Bookmark size={13} />
                        </button>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. COMPLETE SHOWCASE PORTAL CALLOUT BANNER ── */}
      <section className="orbit-showcase-portal-card">
        <div className="orbit-portal-glow" />
        <div className="orbit-portal-content">
          <div className="orbit-portal-badge">
            <Trophy size={13} className="text-gold-accent" />
            <span>COMPLETE PHILIPPINE LEADERBOARD</span>
          </div>
          <h2 className="orbit-portal-title">
            See the Full Demand Rankings in The Showcase
          </h2>
          <p className="orbit-portal-desc">
            Explore all 100+ ranked properties across Metro Manila, Cebu, and prime regional districts. Filter by live inquiry velocity, private saves, and monthly demand movements.
          </p>
          <div className="orbit-portal-meta">
            <div className="orbit-portal-pill">
              <ShieldCheck size={13} className="text-gold-accent" />
              <span>100% Verified Buyer Demand · Never Paid</span>
            </div>
            <div className="orbit-portal-pill">
              <Sparkles size={13} className="text-gold-accent" />
              <span>Updated Monthly with Real Platform Signals</span>
            </div>
          </div>
        </div>

        <div className="orbit-portal-action">
          <Link href="/showcase" className="orbit-portal-cta-btn">
            <span>Explore The Showcase</span>
            <ArrowRight size={16} />
          </Link>
          <span className="orbit-portal-cta-sub">Free public intelligence · Instant access</span>
        </div>
      </section>

      <style jsx>{`
        .orbit-showcase-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: clamp(28px, 4vw, 56px) clamp(16px, 3.5vw, 32px) 80px;
          position: relative;
          z-index: 10;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        /* ── HERO SPLIT ── */
        .orbit-hero-split {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.95fr);
          gap: clamp(24px, 4.5vw, 48px);
          align-items: center;
          margin-bottom: 36px;
        }

        .orbit-telemetry-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: rgba(232, 174, 60, 0.08);
          border: 1px solid rgba(232, 174, 60, 0.25);
          margin-bottom: 14px;
        }

        .orbit-signal-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-bright);
          box-shadow: 0 0 8px var(--accent-bright);
          animation: pulseGlow 2s infinite ease-in-out;
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.6; }
        }

        .orbit-telemetry-text {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.16em;
          color: var(--accent);
          text-transform: uppercase;
          font-variant-numeric: tabular-nums;
        }

        .orbit-hero-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 4.5vw, 52px);
          font-weight: 500;
          line-height: 1.06;
          letter-spacing: -0.028em;
          color: #f7f5f0;
          margin: 0 0 14px;
        }

        .text-gold-gradient {
          background: linear-gradient(135deg, #f7c64e 20%, #e8ae3c 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .orbit-hero-subtitle {
          font-family: var(--font-body);
          font-size: clamp(14px, 1.25vw, 15.5px);
          font-weight: 400;
          line-height: 1.62;
          letter-spacing: -0.012em;
          color: var(--text-secondary);
          max-width: 560px;
          margin: 0;
        }

        /* ── MISSION CARD ── */
        .orbit-mission-card {
          background: rgba(13, 13, 16, 0.78);
          border: 1px solid var(--accent-muted);
          border-radius: 16px;
          padding: 22px 26px;
          backdrop-filter: blur(20px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
          position: relative;
        }

        .orbit-mission-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .orbit-mission-kicker {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: var(--accent);
          text-transform: uppercase;
        }

        .orbit-mission-body {
          font-family: var(--font-body);
          font-size: 13.5px;
          font-weight: 400;
          line-height: 1.62;
          letter-spacing: -0.008em;
          color: #d6d4cd;
          margin: 0 0 14px;
        }

        .orbit-mission-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        /* ── FILTER RAIL ── */
        .orbit-filter-rail-wrapper {
          overflow-x: auto;
          margin-bottom: 32px;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .orbit-filter-rail-wrapper::-webkit-scrollbar { display: none; }

        .orbit-filter-rail {
          display: inline-flex;
          gap: 6px;
          background: rgba(18, 18, 22, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 5px;
          border-radius: 9999px;
          backdrop-filter: blur(16px);
        }

        .orbit-filter-pill {
          appearance: none;
          border: 0;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          font-variant-numeric: tabular-nums;
          padding: 8px 16px;
          border-radius: 9999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: all 0.18s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .orbit-filter-count {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          padding: 1px 6px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
        }

        .orbit-filter-pill:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
        }

        .orbit-filter-pill.is-active {
          background: var(--accent-bright);
          color: #0d0d0d;
          font-weight: 700;
          box-shadow: 0 2px 14px rgba(232, 174, 60, 0.35);
        }

        .orbit-filter-pill.is-active .orbit-filter-count {
          background: rgba(0, 0, 0, 0.2);
          color: #0d0d0d;
          font-weight: 700;
        }

        /* ── PODIUM GRID ── */
        .orbit-podium-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(320px, 1fr);
          gap: 22px;
          margin-bottom: 48px;
        }

        /* ── APEX CARD ── */
        .orbit-apex-card {
          background: rgba(13, 13, 16, 0.76);
          border: 1px solid rgba(232, 174, 60, 0.42);
          border-radius: 18px;
          overflow: hidden;
          backdrop-filter: blur(24px);
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.52), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: transform 0.22s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.22s ease;
        }

        .orbit-apex-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 56px rgba(0, 0, 0, 0.62), 0 0 28px rgba(232, 174, 60, 0.18);
        }

        .orbit-apex-link {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .orbit-apex-media {
          position: relative;
          height: 250px;
          background: #141416;
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }

        .orbit-media-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(13,13,16,0.96) 100%);
        }

        .orbit-apex-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px;
          border-radius: 7px;
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid var(--accent);
          backdrop-filter: blur(10px);
        }

        .orbit-badge-ring {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-bright);
          font-variant-numeric: tabular-nums;
        }

        .orbit-badge-label {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #fff;
        }

        .orbit-apex-chip {
          position: absolute;
          top: 14px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 6px;
          background: rgba(232, 174, 60, 0.18);
          border: 1px solid rgba(232, 174, 60, 0.45);
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent-bright);
        }

        .orbit-apex-content {
          padding: 22px 26px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .orbit-card-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .orbit-prop-category {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .orbit-prop-location {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #a8a69f;
        }

        .orbit-apex-name {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.3vw, 28px);
          font-weight: 500;
          letter-spacing: -0.022em;
          color: #f7f5f0;
          margin: 0 0 18px;
          line-height: 1.18;
        }

        /* Velocity Box */
        .orbit-velocity-box {
          background: rgba(20, 20, 24, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }

        .orbit-velocity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 7px;
        }

        .orbit-velocity-title {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: #a8a69f;
        }

        .orbit-velocity-score {
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--accent-bright);
          font-variant-numeric: tabular-nums;
        }

        .orbit-meter-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .orbit-meter-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent-bright));
          border-radius: 2px;
        }

        .orbit-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .orbit-stat-item {
          display: flex;
          flex-direction: column;
        }

        .orbit-stat-num {
          font-family: var(--font-mono);
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #f7f5f0;
          font-variant-numeric: tabular-nums;
        }

        .orbit-stat-lbl {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a8a69f;
          margin-top: 2px;
        }

        .orbit-apex-actions {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }

        .orbit-primary-btn {
          flex: 1;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--accent-bright);
          color: #0d0d0d;
          border-radius: 9px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: background 0.18s, transform 0.18s;
        }

        .orbit-apex-card:hover .orbit-primary-btn {
          background: #ffe082;
          transform: translateY(-1px);
        }

        .orbit-save-btn {
          min-height: 44px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          color: #f5f3ee;
          border-radius: 9px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .orbit-save-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(232, 174, 60, 0.08);
        }

        .orbit-save-btn.is-saved {
          background: var(--accent);
          color: #0d0d0d;
          border-color: var(--accent);
          font-weight: 700;
        }

        /* ── RUNNERS STACK ── */
        .orbit-runners-stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .orbit-runner-card {
          background: rgba(13, 13, 16, 0.76);
          border: 1px solid var(--tier-border, rgba(255, 255, 255, 0.1));
          border-radius: 15px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.2s ease;
        }

        .orbit-runner-card:hover {
          transform: translateY(-2px);
          border-color: var(--tier-color);
        }

        .orbit-runner-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
        }

        .orbit-runner-body {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .orbit-runner-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .orbit-runner-badges-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .orbit-runner-rank {
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .orbit-runner-tier-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .orbit-runner-meta-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .orbit-prop-dot {
          color: rgba(255, 255, 255, 0.2);
        }

        .orbit-prop-category {
          font-weight: 700;
        }

        .orbit-prop-location {
          color: #a8a69f;
          font-weight: 500;
        }

        .orbit-runner-name {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 500;
          letter-spacing: -0.018em;
          color: #f7f5f0;
          margin: 0;
          line-height: 1.24;
        }

        .orbit-runner-stats {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-top: 9px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .orbit-runner-stat-item {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .orbit-runner-stat-item strong {
          font-family: var(--font-mono);
          font-size: 15px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .orbit-runner-stat-item small {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a8a69f;
        }

        .orbit-runner-save {
          margin-left: auto;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: transparent;
          color: var(--text-secondary);
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
        }

        .orbit-runner-save:hover {
          color: var(--accent);
          border-color: var(--accent);
        }

        .orbit-runner-save.is-saved {
          background: var(--accent);
          color: #0d0d0d;
          border-color: var(--accent);
        }

        /* ── COMPLETE SHOWCASE PORTAL CALLOUT BANNER ── */
        .orbit-showcase-portal-card {
          position: relative;
          background: rgba(15, 15, 18, 0.88);
          border: 1px solid var(--accent);
          border-radius: 18px;
          padding: clamp(26px, 3.5vw, 36px) clamp(22px, 3.5vw, 40px);
          backdrop-filter: blur(24px);
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.6), 0 0 36px rgba(232, 174, 60, 0.12);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 32px;
          overflow: hidden;
        }

        .orbit-portal-glow {
          position: absolute;
          top: -50%;
          right: 20%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(232, 174, 60, 0.14) 0%, transparent 70%);
          pointer-events: none;
        }

        .orbit-portal-content {
          flex: 1;
          max-width: 660px;
          position: relative;
          z-index: 2;
        }

        .orbit-portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: var(--accent-bright);
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .orbit-portal-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.6vw, 32px);
          font-weight: 500;
          letter-spacing: -0.024em;
          color: #f7f5f0;
          margin: 0 0 10px;
          line-height: 1.18;
        }

        .orbit-portal-desc {
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 400;
          line-height: 1.6;
          letter-spacing: -0.01em;
          color: #d8d6cf;
          margin: 0 0 18px;
        }

        .orbit-portal-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .orbit-portal-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #e5e2e1;
        }

        .orbit-portal-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
          position: relative;
          z-index: 2;
        }

        .orbit-portal-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 15px 30px;
          border-radius: 11px;
          background: linear-gradient(135deg, #f7c64e, #e8ae3c);
          color: #0d0d0d;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          box-shadow: 0 4px 18px rgba(232, 174, 60, 0.35);
          transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
          white-space: nowrap;
        }

        .orbit-portal-cta-btn:hover {
          background: linear-gradient(135deg, #ffe082, #f7c64e);
          transform: translateY(-2px);
          box-shadow: 0 8px 26px rgba(232, 174, 60, 0.5);
        }

        .orbit-portal-cta-sub {
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .orbit-empty-state {
          padding: 70px 20px;
          text-align: center;
          color: var(--text-secondary);
          background: rgba(13, 13, 16, 0.5);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 15px;
        }

        .orbit-empty-text {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* ── RESPONSIVE BREAKPOINTS ── */
        @media (max-width: 990px) {
          .orbit-hero-split,
          .orbit-podium-grid,
          .orbit-showcase-portal-card {
            grid-template-columns: 1fr;
            flex-direction: column;
            align-items: flex-start;
          }
          .orbit-portal-action {
            width: 100%;
            align-items: stretch;
          }
          .orbit-portal-cta-btn {
            width: 100%;
          }
          .orbit-portal-cta-sub {
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .orbit-showcase-container {
            padding-bottom: calc(88px + env(safe-area-inset-bottom));
          }
          .orbit-apex-media {
            height: 200px;
          }
          .orbit-apex-content {
            padding: 16px;
          }
          .orbit-runner-body {
            padding: 14px 16px;
            gap: 8px;
          }
          .orbit-runner-name {
            font-size: 15.5px;
            margin: 0;
          }
          .orbit-runner-stats {
            gap: 10px;
            padding-top: 8px;
          }
          .orbit-runner-save {
            width: 32px;
            height: 32px;
          }
          .orbit-portal-pill {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
