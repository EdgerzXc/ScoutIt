"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { useState } from "react";
import { CATEGORY_PREVIEWS } from "@/data/mockProperties";
import BackgroundMetropolis from "@/components/descent/BackgroundMetropolis";

const CATEGORIES = ["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues"];

export default function MetropolisLayer() {
  const [category, setCategory] = useState("Residential");
  const [search, setSearch] = useState("");

  const properties = (CATEGORY_PREVIEWS[category] || []).filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const browseLabel = category === "Venues" ? "Venues/Events" : category;

  return (
    <main
      className="min-h-screen bg-[#0d0d0d] text-white selection:bg-[#FFB800] selection:text-black overflow-hidden font-sans"
      style={{ paddingTop: "52px" }}
    >
      <LayerNav
        prev={{ href: "/layer/stratosphere", label: "Stratosphere" }}
        next={{ href: "/layer/crust", label: "Crust" }}
      />

      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundMetropolis />
      </div>

      <div className="metro-split">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="metro-sidebar">
          <div>
            <span className="metro-kicker">Layer 03 // Metropolis</span>
            <h2 className="metro-title">Explore by Category</h2>
            <p className="metro-sub">
              Pick a category and see what's inside — homes, offices, venues, and more.
            </p>
            <nav className="metro-nav">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`metro-cat${category === c ? " on" : ""}`}
                  onClick={() => { setCategory(c); setSearch(""); }}
                >
                  {c === "Venues" ? "Venues/Events" : c}
                </button>
              ))}
            </nav>
            <div className="layer-mission">
              <h3>Mission</h3>
              <p>The Metropolis serves as the Directory Layer. Every kind of space — home, office, venue, table — is the same product in disguise. This layer exists to let you walk the market building by building and find the exact square meters that fit you.</p>
            </div>
          </div>
          <Link
            href={`/property?type=${category}`}
            className="prominent-action-link metro-browse"
          >
            Browse {browseLabel} →
          </Link>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <div className="metro-content">
          <div className="metro-content-head">
            <h3 className="metro-content-title">
              {browseLabel} Spaces
            </h3>
            <p className="metro-content-sub">A preview of what&rsquo;s in this category</p>
          </div>

          {/* Search */}
          <input
            className="metro-search"
            placeholder="Search spaces by name, city, or style..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Property grid */}
          <div className="metro-grid">
            {properties.length === 0 ? (
              <p className="metro-empty">No spaces found.</p>
            ) : (
              properties.map(p => (
                <Link href={`/property/${p.id}`} key={p.id} className="metro-card">
                  <div
                    className="metro-photo"
                    style={{ backgroundImage: `url(${p.image})` }}
                  />
                  <div className="metro-body">
                    <div className="metro-name">{p.title}</div>
                    {p.tags.map((tag, i) => {
                      const [label, ...rest] = tag.split(":");
                      const value = rest.join(":").trim();
                      return (
                        <div className="metro-tag-row" key={i}>
                          <span className="metro-tag-label">{label.trim()}</span>
                          <span className="metro-tag-value">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </Link>
              ))
            )}
          </div>

          <p className="metro-hint">
            Explore different spaces by clicking the categories. Tap any space to view its deep briefing page.
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .metro-split {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: calc(100vh - 52px);
        }

        /* ── SIDEBAR ── */
        .metro-sidebar {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(28px,5vh,52px) 28px;
          border-right: 1px solid rgba(255,184,0,0.12);
          background: transparent;   /* Layer 01 look — let the city background read through */
          min-width: 0;              /* allow the category rail to scroll instead of blowing out the frame */
        }
        .metro-kicker {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.22em;
          color: var(--accent);
          text-transform: uppercase;
          display: block;
          margin-bottom: 10px;
        }
        .metro-title {
          font-family: var(--font-display);
          font-size: clamp(26px,3vw,36px);
          font-weight: 400;
          color: #f0ede8;
          margin-bottom: 10px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.7);
        }
        .metro-sub {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 13px;
          color: rgba(255,255,255,0.62);
          line-height: 1.6;
          margin-bottom: 24px;
          text-shadow: 0 1px 14px rgba(0,0,0,0.65);
        }
        .metro-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .metro-cat {
          text-align: left;
          font-family: var(--font-display);
          font-size: 16px;
          color: rgba(255,255,255,0.55);
          background: none;
          border: 1px solid transparent;
          padding: 11px 14px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .metro-cat:hover { color: #f0ede8; }
        .metro-cat.on {
          color: var(--accent);
          border-color: rgba(255,184,0,0.35);
          background: rgba(255,184,0,0.06);
        }
        .metro-browse {
          font-size: 11px !important;
          padding: 11px 20px !important;
          margin-top: 20px;
          display: inline-block;
          align-self: flex-start;
          max-width: 100%;
          box-sizing: border-box;
          white-space: nowrap;
        }

        /* ── CONTENT ── */
        .metro-content {
          padding: clamp(24px,4vh,44px) clamp(20px,3vw,40px);
          overflow-y: auto;
          max-height: calc(100vh - 52px);
          min-width: 0;   /* lets the card rail scroll rather than stretch the grid */
        }
        .metro-content-head { margin-bottom: 18px; }
        .metro-content-title {
          font-family: var(--font-display);
          font-size: clamp(20px,2.5vw,28px);
          font-weight: 400;
          color: #f0ede8;
          margin-bottom: 4px;
        }
        .metro-content-sub {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }

        /* Search */
        .metro-search {
          width: 100%;
          max-width: 460px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,184,0,0.18);
          color: #f0ede8;
          font-family: var(--font-body);
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 4px;
          margin-bottom: 22px;
          outline: none;
          transition: border-color 0.2s;
        }
        .metro-search::placeholder { color: rgba(255,255,255,0.28); }
        .metro-search:focus { border-color: rgba(255,184,0,0.45); }

        /* Property grid */
        .metro-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }
        .metro-card {
          background: rgba(18,18,18,0.85);
          border: 1px solid rgba(255,184,0,0.12);
          border-radius: 6px;
          overflow: hidden;
          text-decoration: none;
          display: block;
          transition: border-color 0.2s, transform 0.2s;
        }
        .metro-card:hover {
          border-color: rgba(255,184,0,0.38);
          transform: translateY(-2px);
        }
        .metro-photo {
          width: 100%;
          height: 160px;
          background-size: cover;
          background-position: center;
          background-color: #1a1a1a;
        }
        .metro-body { padding: 14px; }
        .metro-name {
          font-family: var(--font-display);
          font-size: 15px;
          color: #f0ede8;
          margin-bottom: 10px;
          line-height: 1.3;
        }
        .metro-tag-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 7px;
          padding-bottom: 7px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .metro-tag-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .metro-tag-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 2px;
        }
        .metro-tag-value {
          font-family: var(--font-body);
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 3px 8px;
          border-radius: 3px;
          display: inline-block;
        }

        .metro-empty {
          color: rgba(255,255,255,0.35);
          font-style: italic;
          grid-column: 1/-1;
          padding: 40px 0;
        }
        .metro-hint {
          font-size: 12px;
          color: rgba(255,255,255,0.28);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .metro-split { grid-template-columns: 1fr; }
          .metro-sidebar { border-right: none; border-bottom: 1px solid rgba(255,184,0,0.12); }
          .metro-content { max-height: none; }
          .metro-cat:hover { background: transparent; color: rgba(255,255,255,0.55); }
          .metro-card:hover { transform: none; }

          /* Category chips: drag left/right (mirrors Layer 01's board-nav) */
          .metro-nav {
            flex-direction: row;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 8px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x proximity;
            width: 100vw;
            margin-left: -16px;
            padding: 0 16px 6px;
          }
          .metro-nav::-webkit-scrollbar { display: none; }
          .metro-cat {
            flex: 0 0 auto;
            white-space: nowrap;
            scroll-snap-align: start;
            font-size: 15px;
            padding: 10px 16px;
            border: 1px solid rgba(255,184,0,0.2);
          }
          .metro-cat.on { border-color: rgba(255,184,0,0.5); }

          /* Property cards: swipe left/right — no long vertical drag.
             Consistent rail spec shared across all layers. */
          .metro-grid {
            display: flex !important;
            flex-direction: row;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 14px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 10px;
          }
          .metro-grid::-webkit-scrollbar { display: none; }
          .metro-card {
            flex: 0 0 80%;
            max-width: 80%;
            scroll-snap-align: start;
          }
          .metro-photo { height: 150px; }
        }

        @media (max-width: 640px) {
          .metro-sidebar { padding: 24px 16px; }
          .metro-content { padding: 20px 16px; }
          .metro-search { font-size: 16px; }
          .metro-cat { min-height: 44px; padding: 10px 14px; }
          .metro-browse { min-height: 48px; display: flex; align-items: center; justify-content: center; }
          .metro-grid { gap: 14px; }
          .metro-card { flex-basis: 82%; max-width: 82%; }
        }

        @media (max-width: 480px) {
          .metro-sidebar { padding: 20px 12px; }
          .metro-content { padding: 16px 12px; }
          .metro-title { font-size: 22px; }
        }
      `}} />
    </main>
  );
}
