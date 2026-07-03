"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getBrokers } from "@/data/mockBrokers";
import ReactionButtons from "@/components/ui/ReactionButtons";
import "../property/property.css";

// ── Tier label → number map (mirrors airtable.js) ──────────────
const TIER_MAP = { Universe: 1, Cluster: 2, Solar: 3, Starry: 4, Bronze: 5 };

const TIERS = [
  { value: 1, label: "Universe Partner" },
  { value: 2, label: "Cluster Partner" },
  { value: 3, label: "Solar Partner" },
  { value: 4, label: "Starry Partner" },
];

function normalizeTier(broker) {
  // Airtable data uses subscriptionTier (number) directly
  // Mock data also uses subscriptionTier (number)
  // Guard: if somehow only label is present, convert
  if (typeof broker.subscriptionTier === "number") return broker.subscriptionTier;
  return TIER_MAP[broker.subscriptionLabel] ?? 5;
}

function getClosureCount(closuresStr) {
  if (!closuresStr) return 0;
  const match = String(closuresStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export default function BrokersPage() {
  const [brokers, setBrokers]     = useState(() => getBrokers());
  const [loading, setLoading]     = useState(false);
  const [source, setSource]       = useState("mock_local");
  const [searchTerm, setSearchTerm] = useState("");

  // Filters State
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [minClosures, setMinClosures] = useState(0); // 0 means show all
  const [openFilters, setOpenFilters] = useState({
    tiers: true,
    closures: true,
    locations: true,
  });

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/cms");
        if (!res.ok) return;
        const data = await res.json();
        if (data.brokers && data.brokers.length > 0) {
          setBrokers(data.brokers);
          setSource(data.source);
        }
      } catch { /* stay on mock data */ }
    }
    load();
  }, []);

  const toggleFilterSection = (section) => {
    setOpenFilters((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (val, state, setState) => {
    if (state.includes(val)) {
      setState(state.filter((item) => item !== val));
    } else {
      setState([...state, val]);
    }
  };

  // Compile active locations list dynamically
  const locationsList = Array.from(
    new Set(brokers.map((b) => b.location).filter(Boolean))
  ).sort();

  // Calculate agent counts per location for the hotmap
  const locationCounts = {};
  locationsList.forEach((loc) => {
    locationCounts[loc] = brokers.filter((b) => b.location === loc).length;
  });

  const handleHotmapClick = (loc) => {
    handleCheckboxChange(loc, selectedLocations, setSelectedLocations);
  };

  // Filter brokers dynamically
  const filteredBrokers = brokers.filter((broker) => {
    // 1. Search Query filter
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      const matchName = (broker.name || "").toLowerCase().includes(q);
      const matchLocation = (broker.location || "").toLowerCase().includes(q);
      const matchTitle = (broker.title || "").toLowerCase().includes(q);
      const matchSpecialty = (broker.specialty || "").toLowerCase().includes(q);
      const matchBio = (broker.bio || "").toLowerCase().includes(q);
      const matchNiche = (broker.niche || []).some((n) => n.toLowerCase().includes(q));
      if (!matchName && !matchLocation && !matchTitle && !matchSpecialty && !matchBio && !matchNiche) {
        return false;
      }
    }

    // 2. Tier filter
    const tier = normalizeTier(broker);
    if (selectedTiers.length > 0 && !selectedTiers.includes(tier)) {
      return false;
    }

    // 3. Location filter
    if (selectedLocations.length > 0 && !selectedLocations.includes(broker.location)) {
      return false;
    }

    // 4. Closures filter
    if (minClosures > 0) {
      const count = getClosureCount(broker.closures);
      if (count < minClosures) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="directory-layout">
      <Header />
      <main className="brokers-main">
        <header className="directory-header">
          <span className="vector-label">LAYER 04.1 // VERIFIED ADVISORS</span>
          <h1 className="page-title">Intelligence Roster</h1>
          <p className="page-subtitle">Directory of elite Space Intelligence advisors across prime corridors.</p>
        </header>

        <div className="directory-container">
            {/* Sidebar Filters */}
            <aside className="filters-sidebar">
              {/* Filter Section: Tiers */}
              <div className="filter-card">
                <button className="filter-trigger" onClick={() => toggleFilterSection("tiers")}>
                  Partnership Tiers
                  <span className={`filter-chevron ${openFilters.tiers ? "open" : ""}`}>▼</span>
                </button>
                {openFilters.tiers && (
                  <div className="filter-options">
                    {TIERS.map((tier) => (
                      <label key={tier.value} className="filter-checkbox-label">
                        <input
                          type="checkbox"
                          className="filter-checkbox"
                          checked={selectedTiers.includes(tier.value)}
                          onChange={() => handleCheckboxChange(tier.value, selectedTiers, setSelectedTiers)}
                        />
                        {tier.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Section: Closures */}
              <div className="filter-card">
                <button className="filter-trigger" onClick={() => toggleFilterSection("closures")}>
                  Closures Activity
                  <span className={`filter-chevron ${openFilters.closures ? "open" : ""}`}>▼</span>
                </button>
                {openFilters.closures && (
                  <div className="filter-options">
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="minClosures"
                        className="filter-radio"
                        checked={minClosures === 0}
                        onChange={() => setMinClosures(0)}
                      />
                      Show All
                    </label>
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="minClosures"
                        className="filter-radio"
                        checked={minClosures === 1}
                        onChange={() => setMinClosures(1)}
                      />
                      1+ Closures
                    </label>
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="minClosures"
                        className="filter-radio"
                        checked={minClosures === 2}
                        onChange={() => setMinClosures(2)}
                      />
                      2+ Closures
                    </label>
                    <label className="filter-radio-label">
                      <input
                        type="radio"
                        name="minClosures"
                        className="filter-radio"
                        checked={minClosures === 3}
                        onChange={() => setMinClosures(3)}
                      />
                      3+ Closures
                    </label>
                  </div>
                )}
              </div>

              {/* Filter Section: Locations */}
              <div className="filter-card">
                <button className="filter-trigger" onClick={() => toggleFilterSection("locations")}>
                  Locations Focus
                  <span className={`filter-chevron ${openFilters.locations ? "open" : ""}`}>▼</span>
                </button>
                {openFilters.locations && (
                  <div className="filter-options">
                    {locationsList.map((loc) => (
                      <label key={loc} className="filter-checkbox-label">
                        <input
                          type="checkbox"
                          className="filter-checkbox"
                          checked={selectedLocations.includes(loc)}
                          onChange={() => handleCheckboxChange(loc, selectedLocations, setSelectedLocations)}
                        />
                        {loc}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Sidebar Widget: Location Hotmap */}
              <div className="intel-widget">
                <div className="intel-widget-header">Location Hotmap</div>
                <div className="hotmap-container">
                  {locationsList.map((loc) => {
                    const count = locationCounts[loc] || 0;
                    const total = brokers.length || 1;
                    const percent = Math.round((count / total) * 100);
                    const isSelected = selectedLocations.includes(loc);

                    return (
                      <div
                        key={loc}
                        className={`hotmap-row ${isSelected ? "active" : ""}`}
                        onClick={() => handleHotmapClick(loc)}
                      >
                        <div className="hotmap-label-row">
                          <span className="hotmap-dot"></span>
                          <span className="hotmap-name">{loc}</span>
                          <span className="hotmap-stat">{count} AGENT{count !== 1 ? 'S' : ''} ({percent}%)</span>
                        </div>
                        <div className="hotmap-bar-outer">
                          <div className="hotmap-bar-inner" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Right Section: Search & Cards Grid */}
            <section style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div className="search-wrapper">
                <input
                  type="text"
                  className="global-search-input"
                  placeholder="FILTER AGENT DIRECTORY BY GEOGRAPHICAL LOCATION OR SPECIFIC ASSET CODE..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="brokers-grid">
                {filteredBrokers.map((broker) => {
                  const tier = normalizeTier(broker);
                  let tierClass = "";
                  let tierBadgeText = "";
                  switch (tier) {
                    case 1: tierClass = "tier-1-card universe-card";  tierBadgeText = "UNIVERSE PARTNER";  break;
                    case 2: tierClass = "tier-2-card cluster-card"; tierBadgeText = "CLUSTER PARTNER"; break;
                    case 3: tierClass = "tier-3-card solar-card";     tierBadgeText = "SOLAR PARTNER";     break;
                    case 4: tierClass = "tier-4-card starry-card";   tierBadgeText = "STARRY PARTNER";   break;
                    case 5: tierClass = "tier-4-card starry-card";   tierBadgeText = "STARRY PARTNER";   break; // Fallback
                    default: break;
                  }

                  return (
                    <Link
                      href={`/brokers/${broker.id}`}
                      key={broker.id}
                      className={`broker-card ${tierClass}`}
                      style={{ textDecoration: "none", position: "relative" }}
                    >
                      {tierBadgeText && (
                        <div className="general-tier-badge-label">{tierBadgeText}</div>
                      )}
                      <div className="broker-image-container">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={broker.image} alt={broker.name} className="broker-image" />
                        <div className="image-overlay" />
                      </div>
                      <div className="broker-content">
                        <span className="broker-location">{broker.location}</span>
                        <h2 className="broker-name">{broker.name}</h2>
                        <p className="broker-title">{broker.title}</p>
                        <p className="broker-specialty">Specialty: <span>{broker.specialty}</span></p>
                        
                        {broker.niche && broker.niche.length > 0 && (
                          <div className="broker-skills-wrap">
                            {broker.niche.map((skill, i) => (
                              <span key={i} className="broker-skill-pill">{skill}</span>
                            ))}
                          </div>
                        )}
                        
                        <p className="broker-bio">{broker.bio}</p>
                        <div className="broker-reactions-wrap" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <ReactionButtons
                            propertyId={broker.id}
                            propertyTitle={broker.name}
                            category="Advisor"
                            city={broker.location}
                            small={true}
                            isBroker={true}
                          />
                        </div>
                        <div className="broker-footer">
                          <div className="broker-stats">
                            <span className="stat-value" style={{ fontSize: "12px" }}>{broker.closures}</span>
                          </div>
                          {broker.scoutRating != null && (
                            <div className="scout-rating-badge">
                              <span className="scout-rating-label">Scout Rating</span>
                              <span className="scout-rating-value" style={{ color: broker.scoutRating >= 85 ? "#4caf7d" : "#E8AE3C" }}>
                                {broker.scoutRating}/100
                              </span>
                            </div>
                          )}
                          <span className="btn-contact">Focus →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {filteredBrokers.length === 0 && (
                  <div className="directory-empty">
                    <h3>No matching intelligence advisors found</h3>
                    <p>Try clearing some filters or refining your search parameters.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

        {/* Dev source indicator — remove before final prod */}
        {source && process.env.NODE_ENV === "development" && (
          <div style={{ textAlign: "center", padding: "16px", fontSize: "11px", color: "#444", fontFamily: "monospace" }}>
            data source: {source}
          </div>
        )}
      </main>
      <Footer />

      <style>{`
        .brokers-main {
          padding: 40px 45px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 38px;
          letter-spacing: 0.02em;
          color: #fff;
          margin: 8px 0;
        }

        .brokers-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .brokers-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .brokers-grid { gap: 16px; }
          .brokers-main, .brokers-layout { padding: 20px 16px; }
          .broker-card:hover { transform: none; }
          .broker-card:active { border-color: var(--accent-border); }
        }

        @media (max-width: 640px) {
          .brokers-main, .brokers-layout { padding: 16px 14px; }
          .brokers-grid { gap: 14px; }
          .hotmap-row { min-height: 44px; display: flex; flex-direction: column; justify-content: center; }
        }

        @media (max-width: 480px) {
          .brokers-grid { gap: 12px; }
        }

        /* Location Hotmap Styles */
        .hotmap-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hotmap-row {
          cursor: pointer;
          transition: transform var(--transition-fast, 0.2s) ease;
        }

        .hotmap-row:hover {
          transform: translateX(4px);
        }

        .hotmap-label-row {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
          font-family: var(--font-mono), monospace;
          font-size: 11px;
        }

        .hotmap-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted, rgba(240, 237, 232, 0.38));
          margin-right: 8px;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }

        .hotmap-row.active .hotmap-dot {
          background: var(--accent, #E8AE3C);
          box-shadow: 0 0 8px var(--accent, #E8AE3C);
        }

        .hotmap-name {
          color: var(--text-secondary, rgba(240, 237, 232, 0.62));
          flex-grow: 1;
          transition: color 0.3s ease;
        }

        .hotmap-row.active .hotmap-name {
          color: #fff;
          font-weight: 600;
        }

        .hotmap-stat {
          color: var(--text-muted, rgba(240, 237, 232, 0.38));
          font-size: 9px;
          letter-spacing: 0.05em;
        }

        .hotmap-row.active .hotmap-stat {
          color: var(--accent, #E8AE3C);
        }

        .hotmap-bar-outer {
          height: 3px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .hotmap-bar-inner {
          height: 100%;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
        }

        .hotmap-row.active .hotmap-bar-inner {
          background: var(--accent, #E8AE3C);
          box-shadow: 0 0 4px rgba(232, 174, 60, 0.5);
        }

        .hotmap-row:hover .hotmap-bar-inner {
          background: rgba(255, 255, 255, 0.3);
        }

        .hotmap-row.active:hover .hotmap-bar-inner {
          background: #e5c388;
        }

        /* Radio buttons and inputs */
        .filter-radio-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text-secondary, rgba(240, 237, 232, 0.62));
          cursor: pointer;
          transition: color var(--transition-fast, 0.2s);
        }

        .filter-radio-label:hover {
          color: var(--accent, #E8AE3C);
        }

        .filter-radio {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid var(--border-solid, #262626);
          border-radius: 50%;
          background: #0e0e0e;
          cursor: pointer;
          position: relative;
          transition: border-color var(--transition-fast, 0.2s), background var(--transition-fast, 0.2s);
        }

        .filter-radio:checked {
          background: var(--accent, #E8AE3C);
          border-color: var(--accent, #E8AE3C);
        }

        .filter-radio:checked::after {
          content: '';
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0e0e0e;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .broker-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.38s ease, box-shadow 0.38s ease, border-color 0.38s ease;
        }

        .broker-card:hover {
          border-color: var(--accent-border);
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .broker-image-container {
          position: relative;
          height: 280px;
          overflow: hidden;
        }

        .broker-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(80%) contrast(1.1);
          transition: transform 0.6s ease, filter 0.6s ease;
        }

        .broker-card:hover .broker-image {
          transform: scale(1.05);
          filter: grayscale(0%) contrast(1.1);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--surface) 0%, transparent 60%);
        }

        .broker-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .broker-location {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .broker-name {
          font-family: var(--font-display);
          font-size: 22px;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .broker-title {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .broker-specialty {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .broker-specialty span { color: var(--text-primary); }

        .broker-bio {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 16px;
          flex: 1;
        }

        .broker-skills-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }

        .broker-skill-pill {
          background: rgba(232, 174, 60, 0.08);
          border: 1px solid rgba(232, 174, 60, 0.2);
          color: var(--accent);
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: var(--font-mono), monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .broker-reactions-wrap {
          margin-top: auto;
          margin-bottom: 24px;
        }

        .broker-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid var(--border-solid);
          padding-top: 16px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .scout-rating-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .scout-rating-label {
          font-family: var(--font-mono);
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 2px;
        }

        .scout-rating-value {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 700;
        }

        .broker-stats { display: flex; flex-direction: column; }

        .stat-value {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--text-primary);
        }

        .btn-contact {
          background: transparent;
          border: 1px solid var(--accent);
          padding: 8px 16px;
          border-radius: 4px;
          color: var(--accent);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-contact:hover {
          background: var(--accent);
          color: #000;
        }

        .general-tier-badge-label {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 4px 10px;
          border-radius: 4px;
          font-family: var(--font-mono), monospace;
          z-index: 10;
          text-transform: uppercase;
        }

        /* Universe Partner (Tier 1) - Cosmic/Galaxy Aesthetic */
        .tier-1-card { border-color: transparent !important; box-shadow: 0 8px 32px rgba(177, 159, 251, 0.1); position: relative; }
        .tier-1-card::before { content: ""; position: absolute; inset: -1px; z-index: -1; border-radius: 6px; background: linear-gradient(90deg, #b19ffb, #7d5fff, #00f2fe, #b19ffb); background-size: 300% 300%; animation: diamondGlow 6s linear infinite; }
        .tier-1-card .general-tier-badge-label { background: linear-gradient(135deg, #7d5fff 0%, #b19ffb 100%); color: #fff; box-shadow: 0 0 12px rgba(177,159,251,0.4); border: 1px solid rgba(255,255,255,0.2); }
        .tier-1-card .broker-location { color: #b19ffb; }
        .tier-1-card .broker-name { text-shadow: 0 0 10px rgba(177,159,251,0.2); }

        /* Cluster Partner (Tier 2) - Frost/Starlight Aesthetic */
        .tier-2-card { border-color: rgba(165,194,217, 0.4) !important; box-shadow: 0 4px 16px rgba(165,194,217,0.04); }
        .tier-2-card .general-tier-badge-label { background: linear-gradient(135deg, rgba(165,194,217,0.1) 0%, rgba(238,243,247,0.2) 100%); color: #eef3f7; border: 1px solid rgba(165,194,217,0.5); backdrop-filter: blur(4px); }
        .tier-2-card .broker-location { color: #a5c2d9; }

        /* Solar Partner (Tier 3) - Gold/Sun Aesthetic */
        .tier-3-card { border-color: rgba(232, 174, 60, 0.4) !important; box-shadow: 0 4px 16px rgba(232, 174, 60,0.04); }
        .tier-3-card .general-tier-badge-label { background: linear-gradient(135deg, rgba(232,174,60,0.15) 0%, rgba(232,174,60,0.05) 100%); color: #E8AE3C; border: 1px solid rgba(232, 174, 60, 0.5); backdrop-filter: blur(4px); }
        .tier-3-card .broker-location { color: #E8AE3C; }

        /* Starry Partner (Tier 4) - Subdued Constellation Aesthetic */
        .tier-4-card { border-color: rgba(200,200,200, 0.2) !important; }
        .tier-4-card .general-tier-badge-label { background: rgba(255,255,255,0.05); color: #c8c8c8; border: 1px solid rgba(200,200,200,0.3); }
        .tier-4-card .broker-location { color: #a0a0a0; }

        @keyframes diamondGlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
