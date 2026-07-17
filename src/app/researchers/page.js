"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import Link from "next/link";
import "../property/property.css";
import FoundingProgramPanel from "@/components/ecosystem/FoundingProgramPanel";
import { loadPublicProviders } from "@/lib/profileClient";

const FOCUS_AREAS = ["Residential Due Diligence", "Commercial Investment Analysis", "Short-Term Rental & Hospitality", "Land Acquisition", "Industrial & Logistics"];
const MARKETS = ["Metro Manila", "Cebu & Visayas", "Davao & Mindanao", "Clark & Central Luzon", "Iloilo & Western Visayas"];

export default function ResearchersPage() {
  // Real roster: public researcher profiles from Supabase (RLS only exposes
  // is_profile_public rows to the anon client). This page previously
  // hardcoded an empty array and never fetched anything.
  const [researchers, setResearchers] = useState(null); // null = loading
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFocus, setSelectedFocus] = useState([]);
  const [selectedMarkets, setSelectedMarkets] = useState([]);
  const [openFilters, setOpenFilters] = useState({ focus: true, markets: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await loadPublicProviders("researcher");
      if (cancelled) return;
      if (error) {
        console.error("Failed to load researchers", error);
        setResearchers([]);
        return;
      }
      setResearchers(data.map((p) => ({
        name: p.display_name || "Unnamed Analyst",
        location: p.location || "",
        focus: p.service || "",
        headline: p.headline || "",
        bio: p.bio || "",
        image: p.avatar_url || "",
        isExample: !!p.is_example_account,
        available: p.provider_availability !== false,
      })));
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleFilter = (section) => setOpenFilters((p) => ({ ...p, [section]: !p[section] }));
  const toggle = (val, state, setState) => {
    setState(state.includes(val) ? state.filter((x) => x !== val) : [...state, val]);
  };

  const filtered = (researchers || []).filter((r) => {
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

            {researchers === null && (
              <div className="roster-state" role="status" aria-live="polite">
                <span className="roster-state-label">Scanning the roster…</span>
              </div>
            )}
            {researchers !== null && filtered.length === 0 && (
              <div className="roster-state">
                <span className="roster-state-label">
                  {researchers.length === 0
                    ? "No analysts on the public roster yet"
                    : "No analysts match your filters"}
                </span>
                <span className="roster-state-sub">
                  {researchers.length === 0
                    ? "Founding Analyst slots are open below."
                    : "Clear a filter or broaden your search."}
                </span>
              </div>
            )}
            {filtered.length > 0 && (
              <div className="brokers-grid" style={{ marginBottom: 32 }}>
                {filtered.map((r) => (
                  <Link key={r.name} href={`/profile/${encodeURIComponent(r.name)}`} className="broker-card" style={{ textDecoration: "none" }}>
                    {r.isExample && <div className="example-badge-overlay">Example Profile</div>}
                    <div className="broker-image-container">
                      {r.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={r.image} alt={r.name} className="broker-image" loading="lazy" />
                      ) : (
                        <div className="broker-image broker-image-fallback" aria-hidden="true">🔍</div>
                      )}
                      <div className="image-overlay"></div>
                    </div>
                    <div className="broker-content">
                      <div className="broker-location">{r.location}</div>
                      <h2 className="broker-name">{r.name}</h2>
                      <p className="broker-title">{r.headline || "Site Researcher"}</p>
                      {r.focus && <p className="broker-specialty">Focus: <span>{r.focus}</span></p>}
                      {r.bio && <p className="broker-bio">{r.bio}</p>}
                      <div className="broker-footer">
                        <span className={`availability-chip ${r.available ? "is-available" : ""}`}>
                          <span className="availability-dot" aria-hidden="true"></span>
                          {r.available ? "Available for briefs" : "Currently unavailable"}
                        </span>
                        <span className="btn-contact">View Profile</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <FoundingProgramPanel
              icon="🔍"
              serviceName="Site research"
              foundingTitle="Become a Founding Analyst"
              supplyBlurb="Site research launches with the platform. Join now as a Founding Analyst — start earning from bounties, build your credibility, and be first in line when commissions open."
              perks={[
                "Start earning Connects from bounties now",
                "Claim your verified ScoutIt ID card",
                "Lock in founding-member pricing",
                "Become the area's data authority from day one",
              ]}
              ctaLabel="Claim Founding Analyst"
            />
          </section>
        </div>
      </main>
      <Footer />

      <style>{`
        /* Roster chrome — mono label spec from DESIGN.md (10px / .18em / uppercase) */
        .example-badge-overlay { position: absolute; top: 12px; left: 12px; font-size: 10px; font-weight: 500; letter-spacing: .18em; text-transform: uppercase; color: var(--text-primary); background: rgba(14,14,14,.82); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: 1px dashed rgba(240,237,232,.45); padding: 5px 11px; border-radius: var(--radius-sm); z-index: 10; font-family: var(--font-mono),monospace; }
        .availability-chip { display: inline-flex; align-items: center; gap: 7px; font-family: var(--font-mono),monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted); }
        .availability-chip .availability-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border-mid); flex-shrink: 0; }
        .availability-chip.is-available { color: var(--green); }
        .availability-chip.is-available .availability-dot { background: var(--green); box-shadow: 0 0 8px rgba(76,175,125,.55); }
        .roster-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 24px; margin-bottom: 32px; border: 1px dashed var(--border-mid); border-radius: var(--radius-lg); background: linear-gradient(165deg, #161616, #111110); text-align: center; }
        .roster-state-label { font-family: var(--font-mono),monospace; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--text-secondary); }
        .roster-state-sub { font-size: 13px; color: var(--text-muted); }
        .broker-image-fallback { display: flex; align-items: center; justify-content: center; background: var(--surface2); font-size: 40px; color: var(--accent); }
        .broker-card:focus-visible { outline: 1.5px solid var(--accent); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .broker-card, .broker-card:hover, .broker-image, .broker-card:hover .broker-image { transition: none; transform: none; }
        }
        .coming-soon-banner { background: linear-gradient(135deg,rgba(232, 174, 60,.08) 0%,rgba(232, 174, 60,.03) 100%); border: .5px solid var(--accent-border); border-radius: 6px; padding: 16px 22px; margin-bottom: 32px; }
        .coming-soon-inner { display: flex; align-items: flex-start; gap: 14px; }
        .coming-soon-badge { background: var(--accent); color: #0e0e0e; font-size: 10px; font-weight: 700; letter-spacing: .12em; padding: 4px 10px; border-radius: 3px; white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
        .coming-soon-text { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
        .coming-soon-card-overlay { position: absolute; top: 12px; left: 12px; font-size: 10px; font-weight: 700; letter-spacing: .1em; color: var(--text-muted); background: rgba(14,14,14,.8); border: .5px solid var(--border-mid); padding: 3px 8px; border-radius: 2px; z-index: 10; font-family: var(--font-mono),monospace; }
        .brokers-main { padding: 40px 45px; max-width: 1400px; margin: 0 auto; }
        .page-title { font-family: var(--font-display); font-size: 38px; letter-spacing: .02em; color: #fff; margin: 8px 0; }
        .brokers-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 24px; }
        @media (max-width:1024px) { .brokers-grid { grid-template-columns: 1fr; } }
        
        .broker-card { background: linear-gradient(165deg, #1a1917, #111110); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column; transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition); position: relative; }
        .broker-card:hover { border-color: var(--accent-border); box-shadow: 0 14px 32px rgba(0,0,0,.45), 0 0 40px rgba(232,174,60,.06); transform: translateY(-4px); }
        .broker-image-container { position: relative; height: 240px; overflow: hidden; }
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
        .general-tier-badge-label { position: absolute; top: 12px; right: 12px; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 3px 8px; border-radius: 2px; font-family: var(--font-mono),monospace; z-index: 10; }
        .tier-1-card { border-color: transparent !important; box-shadow: 0 8px 32px rgba(0,242,254,.08); }
        .tier-1-card::before { content: ""; position: absolute; inset: -1px; z-index: -1; border-radius: 6px; background: linear-gradient(90deg,#00f2fe,#4facfe,#b19ffb,#00f2fe); background-size: 300% 300%; animation: diamondGlow 6s linear infinite; }
        .tier-1-card .general-tier-badge-label { background: linear-gradient(135deg,#00f2fe 0%,#b19ffb 100%); color: #0e0e0e; box-shadow: 0 0 8px rgba(0,242,254,.3); }
        .tier-1-card .broker-location { color: #00f2fe; }
        .tier-2-card { border-color: #a5c2d9 !important; }
        .tier-2-card .general-tier-badge-label { background: linear-gradient(135deg,#a5c2d9 0%,#eef3f7 100%); color: #0e0e0e; }
        .tier-2-card .broker-location { color: #a5c2d9; }
        .tier-3-card { border-color: #E8AE3C !important; }
        .tier-3-card .general-tier-badge-label { background: linear-gradient(135deg,#E8AE3C 0%,#f7ebd3 100%); color: #0e0e0e; }
        .tier-3-card .broker-location { color: #E8AE3C; }
        @keyframes diamondGlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      
        @media (max-width: 640px) {
          /* Compact directory card on phones — no more one-card-per-screen */
          .broker-image-container { height: 150px; }
          .broker-content { padding: 16px; }
          .broker-name { font-size: 18px; }
          .broker-bio {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 12px;
          }
          .brokers-grid { gap: 14px; }
        }
      `}</style>
    </div>
  );
}
