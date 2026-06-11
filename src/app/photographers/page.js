"use client";

import Header from "@/components/layout/Header";
import { useState } from "react";
import "../property/property.css";
import { RestrictedAccessBanner, RestrictedCardWrapper } from "@/components/ui/EarlyAccessGate";

import { getPhotographers } from "@/data/mockPhotographers";

const DUMMY_PHOTOGRAPHERS = getPhotographers();

const SPECIALTIES = ["Interior Architecture", "Drone Aerial + Lifestyle", "Commercial & F&B", "Minimalist Residential", "Luxury & High-End"];
const LOCATIONS = ["BGC, Taguig", "Makati, Metro Manila", "Cebu City", "Quezon City", "Alabang"];

export default function PhotographersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [openFilters, setOpenFilters] = useState({ specialties: true, locations: true });

  const toggleFilter = (section) => setOpenFilters((p) => ({ ...p, [section]: !p[section] }));

  const toggle = (val, state, setState) => {
    setState(state.includes(val) ? state.filter((x) => x !== val) : [...state, val]);
  };

  const filtered = DUMMY_PHOTOGRAPHERS.filter((p) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.location.toLowerCase().includes(q) &&
        !p.specialty.toLowerCase().includes(q) &&
        !p.bio.toLowerCase().includes(q)
      ) return false;
    }
    if (selectedSpecialties.length > 0 && !selectedSpecialties.includes(p.specialty)) return false;
    if (selectedLocations.length > 0 && !selectedLocations.includes(p.location)) return false;
    return true;
  });

  return (
    <div className="directory-layout">
      <Header />
      <main className="brokers-main">

        {/* Restricted Access Banner */}
        <RestrictedAccessBanner
          rosterLabel="The ScoutIt Photography Network"
          openDate="Q4 2026"
        />

        <header className="directory-header">
          <span className="vector-label">LAYER 03.2 // SPACE PHOTOGRAPHY</span>
          <h1 className="page-title">Lens Roster</h1>
          <p className="page-subtitle">Verified photographers who specialize in capturing spaces that command attention.</p>
        </header>

        <div className="directory-container">
          {/* Sidebar */}
          <aside className="filters-sidebar">
            <div className="filter-card">
              <button className="filter-trigger" onClick={() => toggleFilter("specialties")}>
                Specialty
                <span className={`filter-chevron ${openFilters.specialties ? "open" : ""}`}>▼</span>
              </button>
              {openFilters.specialties && (
                <div className="filter-options">
                  {SPECIALTIES.map((s) => (
                    <label key={s} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={selectedSpecialties.includes(s)}
                        onChange={() => toggle(s, selectedSpecialties, setSelectedSpecialties)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="filter-card">
              <button className="filter-trigger" onClick={() => toggleFilter("locations")}>
                Location
                <span className={`filter-chevron ${openFilters.locations ? "open" : ""}`}>▼</span>
              </button>
              {openFilters.locations && (
                <div className="filter-options">
                  {LOCATIONS.map((loc) => (
                    <label key={loc} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={selectedLocations.includes(loc)}
                        onChange={() => toggle(loc, selectedLocations, setSelectedLocations)}
                      />
                      {loc}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="intel-widget">
              <div className="intel-widget-header">What We Verify</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                {["Portfolio quality review", "Equipment list confirmation", "Turnaround time tested", "CAA drone license (if applicable)", "Client reference check"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--green)", fontSize: "10px" }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Cards */}
          <section style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div className="search-wrapper">
              <input
                type="text"
                className="global-search-input"
                placeholder="SEARCH BY NAME, LOCATION, SPECIALTY, OR STYLE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="brokers-grid">
              {filtered.map((ph) => {
                const tierClass = ph.tier === 1 ? "tier-1-card diamond-card" : ph.tier === 2 ? "tier-2-card platinum-card" : "tier-3-card gold-card";
                const tierLabel = ph.tier === 1 ? "DIAMOND PARTNER" : ph.tier === 2 ? "PLATINUM PARTNER" : "GOLD PARTNER";
                return (
                  <RestrictedCardWrapper key={ph.id} rosterType="Photography Network">
                    <div
                      className={`broker-card ${tierClass}`}
                      style={{ position: "relative" }}
                    >
                    <div className="general-tier-badge-label">{tierLabel}</div>
                    <div className="broker-image-container">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.image} alt={ph.name} className="broker-image" />
                      <div className="image-overlay" />
                    </div>
                    <div className="broker-content">
                      <span className="broker-location">{ph.location}</span>
                      <h2 className="broker-name">{ph.name}</h2>
                      <p className="broker-title">{ph.title}</p>
                      <p className="broker-specialty">Specialty: <span>{ph.specialty}</span></p>
                      <p className="broker-specialty" style={{ marginBottom: "8px" }}>Equipment: <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{ph.equipment}</span></p>
                      <p className="broker-bio">{ph.bio}</p>
                      <div className="broker-footer">
                        <div className="broker-stats">
                          <span className="stat-value" style={{ fontSize: "12px" }}>{ph.sessions}</span>
                        </div>
                        <span className="btn-contact">Focus →</span>
                      </div>
                    </div>
                    </div>
                  </RestrictedCardWrapper>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <style>{`
        .coming-soon-banner {
          background: linear-gradient(135deg, rgba(200,169,110,0.08) 0%, rgba(200,169,110,0.03) 100%);
          border: 0.5px solid var(--accent-border);
          border-radius: 6px;
          padding: 16px 22px;
          margin-bottom: 32px;
        }
        .coming-soon-inner { display: flex; align-items: flex-start; gap: 14px; }
        .coming-soon-badge {
          background: var(--accent);
          color: #0e0e0e;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          padding: 4px 10px;
          border-radius: 3px;
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .coming-soon-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .coming-soon-card-overlay {
          position: absolute;
          top: 12px;
          left: 12px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          background: rgba(14,14,14,0.8);
          border: 0.5px solid var(--border-mid);
          padding: 3px 8px;
          border-radius: 2px;
          z-index: 10;
          font-family: var(--font-mono), monospace;
        }
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
        .broker-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.38s ease, box-shadow 0.38s ease, border-color 0.38s ease;
          position: relative;
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
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 16px;
          flex: 1;
        }
        .broker-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid var(--border-solid);
          padding-top: 16px;
        }
        .broker-stats { display: flex; flex-direction: column; gap: 2px; }
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
          padding: 3px 8px;
          border-radius: 2px;
          font-family: var(--font-mono), monospace;
          z-index: 10;
        }
        .tier-1-card { border-color: transparent !important; box-shadow: 0 8px 32px rgba(0,242,254,0.08); }
        .tier-1-card::before { content: ""; position: absolute; inset: -1px; z-index: -1; border-radius: 6px; background: linear-gradient(90deg, #00f2fe, #4facfe, #b19ffb, #00f2fe); background-size: 300% 300%; animation: diamondGlow 6s linear infinite; }
        .tier-1-card .general-tier-badge-label { background: linear-gradient(135deg, #00f2fe 0%, #b19ffb 100%); color: #0e0e0e; box-shadow: 0 0 8px rgba(0,242,254,0.3); }
        .tier-1-card .broker-location { color: #00f2fe; }
        .tier-2-card { border-color: #a5c2d9 !important; box-shadow: 0 4px 16px rgba(165,194,217,0.04); }
        .tier-2-card .general-tier-badge-label { background: linear-gradient(135deg, #a5c2d9 0%, #eef3f7 100%); color: #0e0e0e; }
        .tier-2-card .broker-location { color: #a5c2d9; }
        .tier-3-card { border-color: #c8a96e !important; box-shadow: 0 4px 16px rgba(200,169,110,0.04); }
        .tier-3-card .general-tier-badge-label { background: linear-gradient(135deg, #c8a96e 0%, #f7ebd3 100%); color: #0e0e0e; }
        .tier-3-card .broker-location { color: #c8a96e; }
        @keyframes diamondGlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
