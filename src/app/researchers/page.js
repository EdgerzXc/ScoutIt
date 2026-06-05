"use client";

import Header from "@/components/Header";
import { useState } from "react";
import "../property/property.css";
import Link from "next/link";
import { getResearchers } from "@/data/mockDb";

const DUMMY_RESEARCHERS = getResearchers();

const FOCUS_AREAS = ["Residential Due Diligence", "Commercial Investment Analysis", "Short-Term Rental & Hospitality", "Land Acquisition", "Industrial & Logistics"];
const MARKETS = ["Metro Manila", "Cebu & Visayas", "Davao & Mindanao", "Clark & Central Luzon", "Iloilo & Western Visayas"];

export default function ResearchersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFocus, setSelectedFocus] = useState([]);
  const [selectedMarkets, setSelectedMarkets] = useState([]);
  const [openFilters, setOpenFilters] = useState({ focus: true, markets: true });

  const toggleFilter = (section) => setOpenFilters((p) => ({ ...p, [section]: !p[section] }));
  const toggle = (val, state, setState) => {
    setState(state.includes(val) ? state.filter((x) => x !== val) : [...state, val]);
  };

  const filtered = DUMMY_RESEARCHERS.filter((r) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.location.toLowerCase().includes(q) &&
          !r.focus.toLowerCase().includes(q) && !r.bio.toLowerCase().includes(q)) return false;
    }
    if (selectedFocus.length > 0 && !selectedFocus.includes(r.focus)) return false;
    if (selectedMarkets.length > 0 && !selectedMarkets.includes(r.location)) return false;
    return true;
  });

  return (
    <div className="directory-layout">
      <Header />
      <main className="brokers-main">

        {/* Coming Soon Banner */}
        <div className="coming-soon-banner">
          <div className="coming-soon-inner">
            <span className="coming-soon-badge">COMING SOON</span>
            <p className="coming-soon-text">
              ScoutIt Site Research is launching soon. Every researcher is independently vetted — field-verified, licensed where required, and tested against real property briefs before joining the roster.
            </p>
          </div>
        </div>

        <header className="directory-header">
          <span className="vector-label">LAYER 03.3 // SITE INTELLIGENCE</span>
          <h1 className="page-title">Research Roster</h1>
          <p className="page-subtitle">On-ground specialists who deliver the complete picture before you commit to a space.</p>
        </header>

        <div className="directory-container">
          <aside className="filters-sidebar">
            <div className="filter-card">
              <button className="filter-trigger" onClick={() => toggleFilter("focus")}>
                Research Focus
                <span className={`filter-chevron ${openFilters.focus ? "open" : ""}`}>▼</span>
              </button>
              {openFilters.focus && (
                <div className="filter-options">
                  {FOCUS_AREAS.map((f) => (
                    <label key={f} className="filter-checkbox-label">
                      <input type="checkbox" className="filter-checkbox"
                        checked={selectedFocus.includes(f)}
                        onChange={() => toggle(f, selectedFocus, setSelectedFocus)} />
                      {f}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="filter-card">
              <button className="filter-trigger" onClick={() => toggleFilter("markets")}>
                Market Coverage
                <span className={`filter-chevron ${openFilters.markets ? "open" : ""}`}>▼</span>
              </button>
              {openFilters.markets && (
                <div className="filter-options">
                  {MARKETS.map((m) => (
                    <label key={m} className="filter-checkbox-label">
                      <input type="checkbox" className="filter-checkbox"
                        checked={selectedMarkets.includes(m)}
                        onChange={() => toggle(m, selectedMarkets, setSelectedMarkets)} />
                      {m}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="intel-widget">
              <div className="intel-widget-header">Every Report Includes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                {["On-site physical inspection", "Title & encumbrance check", "Neighborhood context report", "Comparable market analysis", "PDF + data export"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--green)", fontSize: "10px" }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div className="search-wrapper">
              <input type="text" className="global-search-input"
                placeholder="SEARCH BY NAME, LOCATION, RESEARCH FOCUS, OR MARKET..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="brokers-grid">
              {filtered.map((r) => {
                const tierClass = r.tier === 1 ? "tier-1-card diamond-card" : r.tier === 2 ? "tier-2-card platinum-card" : "tier-3-card gold-card";
                const tierLabel = r.tier === 1 ? "DIAMOND PARTNER" : r.tier === 2 ? "PLATINUM PARTNER" : "GOLD PARTNER";
                return (
                  <Link
                    href={`/researchers/${r.id}`}
                    key={r.id}
                    className={`broker-card ${tierClass}`}
                    style={{ textDecoration: "none", position: "relative" }}
                  >
                    <div className="general-tier-badge-label">{tierLabel}</div>
                    <div className="coming-soon-card-overlay">PREVIEW CHANNEL</div>
                    <div className="broker-image-container">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.image} alt={r.name} className="broker-image" />
                      <div className="image-overlay" />
                    </div>
                    <div className="broker-content">
                      <span className="broker-location">{r.location}</span>
                      <h2 className="broker-name">{r.name}</h2>
                      <p className="broker-title">{r.title}</p>
                      <p className="broker-specialty">Focus: <span>{r.focus}</span></p>
                      <p className="broker-specialty" style={{ marginBottom: "8px" }}>
                        Markets: <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{r.markets}</span>
                      </p>
                      <p className="broker-bio">{r.bio}</p>
                      <div style={{ marginBottom: "16px" }}>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Deliverables</p>
                        {r.deliverables.map((d) => (
                          <div key={d} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                            <span style={{ color: "var(--accent)", fontSize: "9px" }}>—</span>{d}
                          </div>
                        ))}
                      </div>
                      <div className="broker-footer">
                        <div className="broker-stats">
                          <span className="stat-value" style={{ fontSize: "12px" }}>{r.reports}</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Avg: {r.turnaround}</span>
                        </div>
                        <span className="btn-contact">Focus →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <style>{`
        .coming-soon-banner { background: linear-gradient(135deg,rgba(200,169,110,.08) 0%,rgba(200,169,110,.03) 100%); border: .5px solid var(--accent-border); border-radius: 6px; padding: 16px 22px; margin-bottom: 32px; }
        .coming-soon-inner { display: flex; align-items: flex-start; gap: 14px; }
        .coming-soon-badge { background: var(--accent); color: #0e0e0e; font-size: 9px; font-weight: 700; letter-spacing: .12em; padding: 4px 10px; border-radius: 3px; white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
        .coming-soon-text { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
        .coming-soon-card-overlay { position: absolute; top: 12px; left: 12px; font-size: 8px; font-weight: 700; letter-spacing: .1em; color: var(--text-muted); background: rgba(14,14,14,.8); border: .5px solid var(--border-mid); padding: 3px 8px; border-radius: 2px; z-index: 10; font-family: var(--font-mono),monospace; }
        .brokers-main { padding: 40px 45px; max-width: 1400px; margin: 0 auto; }
        .page-title { font-family: var(--font-display); font-size: 38px; letter-spacing: .02em; color: #fff; margin: 8px 0; }
        .brokers-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 24px; }
        @media (max-width:1024px) { .brokers-grid { grid-template-columns: 1fr; } }
        .broker-card { background: var(--surface); border: 1px solid var(--border-solid); border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column; transition: transform .38s ease,box-shadow .38s ease,border-color .38s ease; position: relative; }
        .broker-card:hover { border-color: var(--accent-border); box-shadow: var(--shadow-lg); transform: translateY(-4px); }
        .broker-image-container { position: relative; height: 220px; overflow: hidden; }
        .broker-image { width: 100%; height: 100%; object-fit: cover; filter: grayscale(80%) contrast(1.1); transition: transform .6s ease,filter .6s ease; }
        .broker-card:hover .broker-image { transform: scale(1.05); filter: grayscale(0%) contrast(1.1); }
        .image-overlay { position: absolute; inset: 0; background: linear-gradient(to top,var(--surface) 0%,transparent 60%); }
        .broker-content { padding: 24px; display: flex; flex-direction: column; flex: 1; }
        .broker-location { font-family: var(--font-mono); font-size: 10px; color: var(--accent); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 8px; }
        .broker-name { font-family: var(--font-display); font-size: 22px; color: var(--text-primary); margin-bottom: 4px; }
        .broker-title { font-size: 12px; color: var(--text-secondary); margin-bottom: 16px; text-transform: uppercase; letter-spacing: .05em; }
        .broker-specialty { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
        .broker-specialty span { color: var(--text-primary); }
        .broker-bio { font-size: 14px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 16px; flex: 1; }
        .broker-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--border-solid); padding-top: 16px; }
        .broker-stats { display: flex; flex-direction: column; gap: 2px; }
        .stat-value { font-family: var(--font-display); font-size: 24px; color: var(--text-primary); }
        .btn-contact { background: transparent; border: 1px solid var(--accent); padding: 8px 16px; border-radius: 4px; color: var(--accent); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; cursor: pointer; transition: all .2s; }
        .btn-contact:hover { background: var(--accent); color: #000; }
        .general-tier-badge-label { position: absolute; top: 12px; right: 12px; font-size: 8px; font-weight: 700; letter-spacing: 1px; padding: 3px 8px; border-radius: 2px; font-family: var(--font-mono),monospace; z-index: 10; }
        .tier-1-card { border-color: transparent !important; box-shadow: 0 8px 32px rgba(0,242,254,.08); }
        .tier-1-card::before { content: ""; position: absolute; inset: -1px; z-index: -1; border-radius: 6px; background: linear-gradient(90deg,#00f2fe,#4facfe,#b19ffb,#00f2fe); background-size: 300% 300%; animation: diamondGlow 6s linear infinite; }
        .tier-1-card .general-tier-badge-label { background: linear-gradient(135deg,#00f2fe 0%,#b19ffb 100%); color: #0e0e0e; box-shadow: 0 0 8px rgba(0,242,254,.3); }
        .tier-1-card .broker-location { color: #00f2fe; }
        .tier-2-card { border-color: #a5c2d9 !important; }
        .tier-2-card .general-tier-badge-label { background: linear-gradient(135deg,#a5c2d9 0%,#eef3f7 100%); color: #0e0e0e; }
        .tier-2-card .broker-location { color: #a5c2d9; }
        .tier-3-card { border-color: #c8a96e !important; }
        .tier-3-card .general-tier-badge-label { background: linear-gradient(135deg,#c8a96e 0%,#f7ebd3 100%); color: #0e0e0e; }
        .tier-3-card .broker-location { color: #c8a96e; }
        @keyframes diamondGlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
    </div>
  );
}
