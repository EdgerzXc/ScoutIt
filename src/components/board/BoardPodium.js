"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { rankBoard, BOARD_CATEGORIES } from "@/data/mock/mockShowcase";
import { ArrowRight, Bookmark, ShieldCheck, Sparkles, Building2, Trophy } from "lucide-react";

const TIER_THEME = {
  universe: {
    label: "Champion",
    color: "var(--accent)",
    border: "rgba(var(--accent-rgb), 0.4)",
  },
  cluster: {
    label: "Runner-Up",
    color: "var(--text-primary)",
    border: "var(--border-mid)",
  },
  solar: {
    label: "Contender",
    color: "var(--accent)",
    border: "rgba(var(--accent-rgb), 0.28)",
  },
  starry: {
    label: "Ranked",
    color: "var(--text-secondary)",
    border: "var(--border)",
  },
};

export default function BoardPodium() {
  const [entries, setEntries] = useState([]);
  const [category, setCategory] = useState("All");
  const [savedSlugs, setSavedSlugs] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/showcase")
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.entries) setEntries(d.entries);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
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
    <section className="orbit-showcase-container" aria-label="Orbit Demand Rankings" aria-busy={loading}>
      {/* ── 1. SPLIT-COMMAND HERO (TITLE + MISSION PROVENANCE) ── */}
      <header className="orbit-hero-split">
        <div className="orbit-hero-left">
          <div className="orbit-telemetry-badge">
            <span className="orbit-signal-dot" aria-hidden="true" />
            <span className="orbit-telemetry-text">
              LAYER 01 // ORBIT · SAMPLE DEMAND INDEX
            </span>
          </div>
          <h1 className="orbit-hero-title">
            Top-Ranked <span className="orbit-gold-accent">Spaces</span>
          </h1>
          <p className="orbit-hero-subtitle">
            Illustrative rankings across residential, commercial, and hospitality spaces, demonstrating ScoutIt&apos;s spatial demand and inquiry framework in preview.
          </p>
        </div>

        <aside className="orbit-mission-card">
          <div className="orbit-mission-header">
            <Sparkles size={13} className="orbit-icon-gold" aria-hidden="true" />
            <span className="orbit-mission-kicker">LAYER PURPOSE &amp; PROVENANCE</span>
          </div>
          <p className="orbit-mission-body">
            Orbit is ScoutIt&apos;s demand index preview. It models how space engagement, seeker interest, and curated inquiry momentum are ranked across Philippine properties.
          </p>
          <div className="orbit-mission-footer">
            <ShieldCheck size={13} className="orbit-icon-gold" aria-hidden="true" />
            <span>Sample demand framework · Independent &amp; unpaid</span>
          </div>
        </aside>
      </header>

      {/* ── 2. HORIZONTAL CATEGORY SCANNER PILLS ── */}
      <div className="orbit-filter-rail-wrapper">
        <nav className="orbit-filter-rail" aria-label="Orbit Space Categories">
          {BOARD_CATEGORIES.map((c) => {
            const count = categoryCounts[c] || 0;
            const isActive = category === c;
            return (
              <button
                key={c}
                type="button"
                className={`orbit-filter-pill ${isActive ? "is-active" : ""}`}
                onClick={() => setCategory(c)}
                aria-pressed={isActive}
              >
                <span>{c === "All" ? "All Spaces" : c}</span>
                <span className="orbit-filter-count">{count}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── 3. PODIUM STAGE (APEX HERO + RUNNER-UPS) ── */}
      {loading ? (
        <div className="orbit-loading-state" role="status" aria-live="polite">
          <span>Reading the current sample index…</span>
          <div className="orbit-loading-lines" aria-hidden="true"><i /><i /><i /></div>
        </div>
      ) : allRanked.length === 0 ? (
        <div className="orbit-empty-state">
          <Building2 size={32} className="orbit-empty-icon" aria-hidden="true" />
          <p className="orbit-empty-text">No spaces recorded in this category yet.</p>
        </div>
      ) : (
        <div className="orbit-podium-grid">
          {/* #01 CHAMPION APEX CARD */}
          {hero && (
            <article className="orbit-apex-card">
              <div className="orbit-apex-link">
                <div
                  className="orbit-apex-media"
                  style={hero.photo ? { backgroundImage: `url(${hero.photo})` } : undefined}
                >
                  <div className="orbit-media-gradient" />
                  <div className="orbit-apex-badge">
                    <span className="orbit-badge-ring">#01</span>
                    <span className="orbit-badge-label">Champion Apex</span>
                  </div>
                  <div className="orbit-apex-chip">
                    <span>Sample Model Data</span>
                  </div>
                </div>

                <div className="orbit-apex-content">
                  <div className="orbit-card-topbar">
                    <span className="orbit-prop-category">{hero.category}</span>
                    <span className="orbit-prop-location">{hero.location}</span>
                  </div>

                  <h2 className="orbit-apex-name">{hero.name}</h2>

                  {/* Demand metrics panel */}
                  <div className="orbit-velocity-box">
                    <div className="orbit-velocity-header">
                      <span className="orbit-velocity-title">Demand Momentum Signals</span>
                      <span className="orbit-velocity-provenance">Curated Demand Model</span>
                    </div>
                    <div className="orbit-stat-row">
                      <div className="orbit-stat-item">
                        <span className="orbit-stat-num">{hero.inquiry_count}</span>
                        <span className="orbit-stat-lbl">Inquiries / Mo</span>
                        <span className="orbit-stat-sub">(sample model)</span>
                      </div>
                      <div className="orbit-stat-item">
                        <span className="orbit-stat-num">{hero.saves || Math.round(hero.inquiry_count * 1.8)}</span>
                        <span className="orbit-stat-lbl">Private Saves</span>
                        <span className="orbit-stat-sub">(sample model)</span>
                      </div>
                      <div className="orbit-stat-item">
                        <span className="orbit-stat-num">{hero.views || hero.inquiry_count * 8}</span>
                        <span className="orbit-stat-lbl">Spatial Views</span>
                        <span className="orbit-stat-sub">(sample model)</span>
                      </div>
                    </div>
                  </div>

                  <div className="orbit-apex-actions">
                    <Link href="/showcase" className="orbit-primary-btn" aria-label={`View Champion space: ${hero.name}`}>
                      Explore The Showcase <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => toggleSave(hero.property_slug, e)}
                      className={`orbit-save-btn ${savedSlugs.has(hero.property_slug) ? "is-saved" : ""}`}
                      aria-label={savedSlugs.has(hero.property_slug) ? `Remove ${hero.name} from saved` : `Save ${hero.name} to Board`}
                      aria-pressed={savedSlugs.has(hero.property_slug)}
                    >
                      <Bookmark size={14} aria-hidden="true" />
                      <span>{savedSlugs.has(hero.property_slug) ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                </div>
              </div>
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
                  <div className="orbit-runner-link">
                    <div className="orbit-runner-body">
                      {/* TOP BAR: BADGES + CATEGORY/LOCATION */}
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
                      <h3 className="orbit-runner-name"><Link href="/showcase" aria-label={`View runner-up space: ${item.name}`}>{item.name}</Link></h3>

                      {/* BOTTOM STATS + SAVE */}
                      <div className="orbit-runner-stats">
                        <div className="orbit-runner-stat-item">
                          <strong style={{ color: theme.color }}>{item.inquiry_count}</strong>
                          <small>Inquiries (sample)</small>
                        </div>
                        <div className="orbit-runner-stat-item">
                          <strong>{item.saves || Math.round(item.inquiry_count * 1.7)}</strong>
                          <small>Saves (sample)</small>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleSave(item.property_slug, e)}
                          className={`orbit-runner-save ${isSaved ? "is-saved" : ""}`}
                          aria-label={isSaved ? `Remove ${item.name} from saved` : `Save ${item.name} to Board`}
                          aria-pressed={isSaved}
                        >
                          <Bookmark size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. COMPLETE SHOWCASE PORTAL CALLOUT BANNER ── */}
      <section className="orbit-showcase-portal-card" aria-label="Explore The Showcase">
        <div className="orbit-portal-content">
          <div className="orbit-portal-badge">
            <Trophy size={13} className="orbit-icon-gold" aria-hidden="true" />
            <span>PHILIPPINE SPACE LEADERBOARD</span>
          </div>
          <h2 className="orbit-portal-title">
            Explore Full Space Rankings in The Showcase
          </h2>
          <p className="orbit-portal-desc">
            Review category rankings across Metro Manila, Cebu, and prime regional districts, with demand tiers and architectural merits.
          </p>
          <div className="orbit-portal-meta">
            <div className="orbit-portal-pill">
              <ShieldCheck size={13} className="orbit-icon-gold" aria-hidden="true" />
              <span>Independent Spatial Curation · Unpaid</span>
            </div>
            <div className="orbit-portal-pill">
              <Sparkles size={13} className="orbit-icon-gold" aria-hidden="true" />
              <span>Sample Demand Framework · Demonstration</span>
            </div>
          </div>
        </div>

        <div className="orbit-portal-action">
          <Link href="/showcase" className="orbit-portal-cta-btn">
            <span>Explore The Showcase</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <span className="orbit-portal-cta-sub">Curated public intelligence preview · Instant access</span>
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
          background: rgba(var(--accent-rgb), 0.08);
          border: 1px solid rgba(var(--accent-rgb), 0.22);
          margin-bottom: 14px;
        }

        .orbit-signal-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.4);
        }

        .orbit-telemetry-text {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--accent);
          text-transform: uppercase;
          font-variant-numeric: tabular-nums;
        }

        .orbit-hero-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 4.5vw, 50px);
          font-weight: 400;
          line-height: 1.08;
          letter-spacing: -0.025em;
          color: var(--text-primary);
          margin: 0 0 14px;
        }

        .orbit-gold-accent {
          color: var(--accent);
        }

        .orbit-hero-subtitle {
          font-family: var(--font-body);
          font-size: clamp(14px, 1.2vw, 15px);
          font-weight: 400;
          line-height: 1.65;
          letter-spacing: -0.01em;
          color: var(--text-secondary);
          max-width: 560px;
          margin: 0;
        }

        /* ── MISSION CARD ── */
        .orbit-mission-card {
          background: rgba(var(--surface-rgb), 0.82);
          border: 1px solid var(--accent-muted);
          border-radius: 14px;
          padding: 22px 24px;
          backdrop-filter: blur(20px);
          box-shadow: 0 12px 32px rgba(var(--bg-rgb), 0.4);
          position: relative;
        }

        .orbit-mission-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .orbit-icon-gold {
          color: var(--accent);
        }

        .orbit-mission-kicker {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--accent);
          text-transform: uppercase;
        }

        .orbit-mission-body {
          font-family: var(--font-body);
          font-size: 13.5px;
          font-weight: 400;
          line-height: 1.62;
          letter-spacing: -0.008em;
          color: var(--text-secondary);
          margin: 0 0 14px;
        }

        .orbit-mission-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(var(--text-primary-rgb), 0.08);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
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
          background: rgba(var(--surface-rgb), 0.75);
          border: 1px solid rgba(var(--text-primary-rgb), 0.08);
          padding: 5px;
          border-radius: 9999px;
          backdrop-filter: blur(16px);
        }

        .orbit-filter-pill {
          appearance: none;
          min-height: 44px;
          border: 0;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-variant-numeric: tabular-nums;
          padding: 8px 16px;
          border-radius: 9999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: color var(--transition-slow), background var(--transition-slow), border-color var(--transition-slow), transform var(--transition-slow);
        }

        .orbit-filter-count {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          padding: 1px 6px;
          border-radius: 10px;
          background: rgba(var(--text-primary-rgb), 0.06);
          color: var(--text-muted);
        }

        .orbit-filter-pill:hover {
          color: var(--text-primary);
          background: rgba(var(--text-primary-rgb), 0.06);
        }

        .orbit-filter-pill.is-active {
          background: var(--accent);
          color: var(--on-accent);
          font-weight: 700;
          box-shadow: 0 2px 10px rgba(var(--accent-rgb), 0.25);
        }

        .orbit-filter-pill.is-active .orbit-filter-count {
          background: rgba(var(--bg-rgb), 0.2);
          color: var(--on-accent);
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
          background: rgba(var(--surface-rgb), 0.8);
          border: 1px solid rgba(var(--accent-rgb), 0.35);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(24px);
          box-shadow: 0 16px 40px rgba(var(--bg-rgb), 0.45);
          transition: transform var(--transition-slow), border-color var(--transition-slow);
        }

        .orbit-apex-card:hover {
          transform: translateY(-2px);
          border-color: rgba(var(--accent-rgb), 0.55);
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
          height: 240px;
          background: var(--surface);
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }

        .orbit-media-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(var(--bg-rgb),0.1) 0%, rgba(var(--bg-rgb),0.95) 100%);
        }

        .orbit-apex-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(var(--bg-rgb), 0.85);
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
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-primary);
        }

        .orbit-apex-chip {
          position: absolute;
          top: 14px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: 5px;
          background: rgba(var(--bg-rgb), 0.75);
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .orbit-apex-content {
          padding: 22px 24px;
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
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .orbit-prop-location {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .orbit-apex-name {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.2vw, 26px);
          font-weight: 400;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin: 0 0 16px;
          line-height: 1.2;
        }

        /* Velocity Box */
        .orbit-velocity-box {
          background: rgba(var(--surface-rgb), 0.7);
          border: 1px solid rgba(var(--text-primary-rgb), 0.06);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }

        .orbit-velocity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .orbit-velocity-title {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .orbit-velocity-provenance {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--accent);
          text-transform: uppercase;
        }

        .orbit-stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
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
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
        }

        .orbit-stat-lbl {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .orbit-stat-sub {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-top: 1px;
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
          background: var(--accent);
          color: var(--on-accent);
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          transition: background var(--transition-slow);
        }

        .orbit-apex-card:hover .orbit-primary-btn {
          background: var(--accent-bright);
        }

        .orbit-save-btn {
          min-height: 44px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(var(--text-primary-rgb), 0.12);
          background: rgba(var(--text-primary-rgb), 0.04);
          color: var(--text-primary);
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color var(--transition-slow), background var(--transition-slow), border-color var(--transition-slow), transform var(--transition-slow);
        }

        .orbit-save-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(var(--accent-rgb), 0.06);
        }

        .orbit-save-btn.is-saved {
          background: var(--accent);
          color: var(--on-accent);
          border-color: var(--accent);
          font-weight: 700;
        }

        /* ── RUNNERS STACK ── */
        .orbit-runners-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .orbit-runner-card {
          background: rgba(var(--surface-rgb), 0.8);
          border: 1px solid var(--tier-border, rgba(var(--text-primary-rgb), 0.1));
          border-radius: 14px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          transition: transform var(--transition-slow), border-color var(--transition-slow);
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
          padding: 16px 18px;
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
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(var(--bg-rgb), 0.7);
          border: 1px solid;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .orbit-runner-tier-tag {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: rgba(var(--bg-rgb), 0.7);
          border: 1px solid;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .orbit-runner-meta-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .orbit-prop-dot {
          color: var(--text-muted);
        }

        .orbit-runner-name {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 400;
          letter-spacing: -0.015em;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.25;
        }

        .orbit-runner-name a {
          color: inherit;
          text-decoration: none;
        }

        .orbit-runner-stats {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-top: 8px;
          border-top: 1px solid rgba(var(--text-primary-rgb), 0.06);
        }

        .orbit-runner-stat-item {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .orbit-runner-stat-item strong {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .orbit-runner-stat-item small {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .orbit-runner-save {
          margin-left: auto;
          min-width: 44px;
          min-height: 44px;
          border: 1px solid rgba(var(--text-primary-rgb), 0.12);
          background: transparent;
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color var(--transition-slow), background var(--transition-slow), border-color var(--transition-slow), transform var(--transition-slow);
        }

        .orbit-runner-save:hover {
          color: var(--accent);
          border-color: var(--accent);
        }

        .orbit-runner-save.is-saved {
          background: var(--accent);
          color: var(--on-accent);
          border-color: var(--accent);
        }

        /* ── COMPLETE SHOWCASE PORTAL CALLOUT BANNER ── */
        .orbit-showcase-portal-card {
          position: relative;
          background: rgba(var(--surface-rgb), 0.85);
          border: 1px solid rgba(var(--accent-rgb), 0.28);
          border-radius: 16px;
          padding: clamp(24px, 3vw, 32px) clamp(20px, 3vw, 36px);
          backdrop-filter: blur(24px);
          box-shadow: 0 14px 36px rgba(var(--bg-rgb), 0.45);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 28px;
          overflow: hidden;
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
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--accent);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .orbit-portal-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 2.4vw, 28px);
          font-weight: 400;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin: 0 0 8px;
          line-height: 1.2;
        }

        .orbit-portal-desc {
          font-family: var(--font-body);
          font-size: 13.5px;
          font-weight: 400;
          line-height: 1.6;
          letter-spacing: -0.008em;
          color: var(--text-secondary);
          margin: 0 0 16px;
        }

        .orbit-portal-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .orbit-portal-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: rgba(var(--text-primary-rgb), 0.04);
          border: 1px solid rgba(var(--text-primary-rgb), 0.08);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .orbit-portal-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          position: relative;
          z-index: 2;
        }

        .orbit-portal-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 26px;
          border-radius: 9px;
          background: var(--accent);
          color: var(--on-accent);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(var(--accent-rgb), 0.22);
          transition: background var(--transition-slow), transform var(--transition-slow);
          white-space: nowrap;
        }

        .orbit-portal-cta-btn:hover {
          background: var(--accent-bright);
          transform: translateY(-1px);
        }

        .orbit-portal-cta-sub {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .orbit-loading-state {
          min-height: 180px;
          padding: 34px clamp(20px, 4vw, 42px);
          border: 1px solid var(--border);
          border-radius: 16px;
          display: grid;
          align-content: center;
          gap: 18px;
          background: rgba(var(--surface-rgb), 0.72);
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          backdrop-filter: blur(18px);
        }

        .orbit-loading-lines {
          display: grid;
          gap: 9px;
        }

        .orbit-loading-lines i {
          height: 10px;
          border-radius: var(--radius-pill);
          background: linear-gradient(90deg, rgba(var(--accent-rgb), 0.06), rgba(var(--accent-rgb), 0.22), rgba(var(--accent-rgb), 0.06));
          background-size: 220% 100%;
          animation: orbitRead 1.8s linear infinite;
        }

        .orbit-loading-lines i:nth-child(2) { width: 76%; }
        .orbit-loading-lines i:nth-child(3) { width: 48%; }

        @keyframes orbitRead {
          to { background-position: -220% 0; }
        }

        .orbit-empty-state {
          padding: 60px 20px;
          text-align: center;
          color: var(--text-secondary);
          background: rgba(var(--surface-rgb), 0.5);
          border: 1px dashed rgba(var(--text-primary-rgb), 0.1);
          border-radius: 14px;
        }

        .orbit-empty-icon {
          color: var(--accent-muted);
          margin: 0 auto 12px;
        }

        .orbit-empty-text {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        .orbit-filter-pill:focus-visible,
        .orbit-primary-btn:focus-visible,
        .orbit-save-btn:focus-visible,
        .orbit-runner-name a:focus-visible,
        .orbit-runner-save:focus-visible,
        .orbit-portal-cta-btn:focus-visible {
          outline: 2px solid var(--accent-bright);
          outline-offset: 3px;
        }

        /* ── REDUCED MOTION ── */
        @media (prefers-reduced-motion: reduce) {
          .orbit-apex-card,
          .orbit-runner-card,
          .orbit-portal-cta-btn,
          .orbit-filter-pill,
          .orbit-save-btn,
          .orbit-runner-save,
          .orbit-loading-lines i {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
          .orbit-apex-card:hover,
          .orbit-runner-card:hover,
          .orbit-portal-cta-btn:hover {
            transform: none !important;
          }
        }

        @media (prefers-reduced-transparency: reduce) {
          .orbit-mission-card,
          .orbit-filter-rail,
          .orbit-apex-card,
          .orbit-runner-card,
          .orbit-showcase-portal-card,
          .orbit-loading-state {
            backdrop-filter: none;
            background: var(--surface);
          }
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
            padding-top: 34px;
          }
          .orbit-hero-split {
            gap: 22px;
            margin-bottom: 26px;
          }
          .orbit-mission-card {
            padding: 18px;
            border-radius: 16px;
          }
          .orbit-telemetry-badge {
            max-width: 100%;
          }
          .orbit-showcase-container {
            padding-bottom: calc(88px + env(safe-area-inset-bottom));
          }
          .orbit-apex-media {
            height: 190px;
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
            width: 44px;
            height: 44px;
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
