"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState } from "react";
import "../property/property.css";

import { getMovers } from "@/data/mockMovers";

const DUMMY_MOVERS = getMovers();

const SPECIALTIES = ["Heavy Lifting & Commercial", "Rapid Condo Transfers", "White-Glove & Fragile", "Packing & Assembly"];
const FLEET_TYPES = ["Van", "Closed Van", "4-Wheeler", "6-Wheeler", "10-Wheeler", "Climate-Controlled Van"];

export default function MoversPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedFleets, setSelectedFleets] = useState([]);
  const [openFilters, setOpenFilters] = useState({ specialties: true, fleets: true });

  const toggleFilter = (section) => setOpenFilters((p) => ({ ...p, [section]: !p[section] }));

  const toggle = (val, state, setState) => {
    setState(state.includes(val) ? state.filter((x) => x !== val) : [...state, val]);
  };

  const filtered = DUMMY_MOVERS.filter((m) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.location.toLowerCase().includes(q) &&
        !m.specialty.toLowerCase().includes(q) &&
        !m.bio.toLowerCase().includes(q)
      ) return false;
    }
    if (selectedSpecialties.length > 0 && !selectedSpecialties.includes(m.specialty)) return false;
    
    // Check if the mover has at least one of the selected fleet types
    if (selectedFleets.length > 0) {
      const hasFleet = selectedFleets.some(fleet => m.fleet_type.includes(fleet));
      if (!hasFleet) return false;
    }
    
    return true;
  });

  return (
    <div className="directory-layout">
      <Header />
      <main className="brokers-main">

        <header className="directory-header">
          <span className="vector-label">LAYER 04 // POST-MOVE LOGISTICS</span>
          <h1 className="page-title">Logistics Guilds</h1>
          <p className="page-subtitle">Verified movers, packers, and logistics teams to handle your relocation.</p>
        </header>

        <div className="directory-container">
          {/* Sidebar */}
          <aside className="filters-sidebar">
            <div className="filter-card">
              <button className="filter-trigger" onClick={() => toggleFilter("specialties")}>
                Service Specialty
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
              <button className="filter-trigger" onClick={() => toggleFilter("fleets")}>
                Fleet Availability
                <span className={`filter-chevron ${openFilters.fleets ? "open" : ""}`}>▼</span>
              </button>
              {openFilters.fleets && (
                <div className="filter-options">
                  {FLEET_TYPES.map((f) => (
                    <label key={f} className="filter-checkbox-label">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={selectedFleets.includes(f)}
                        onChange={() => toggle(f, selectedFleets, setSelectedFleets)}
                      />
                      {f}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="intel-widget">
              <div className="intel-widget-header">Guild Verification</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                {["DTI/SEC Registered", "Commercial Insurance Verified", "Driver Background Checks", "Fleet Condition Assessed", "Damage Protection Policy"].map((item) => (
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
                placeholder="SEARCH BY GUILD NAME, LOCATION, OR SPECIALTY..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="brokers-grid">
              {filtered.map((m) => {
                const tierClass = m.tier === 1 ? "tier-1-card diamond-card" : m.tier === 2 ? "tier-2-card platinum-card" : "tier-3-card gold-card";
                const tierLabel = m.tier === 1 ? "DIAMOND LOGISTICS" : m.tier === 2 ? "PLATINUM MOVER" : "VERIFIED GUILD";
                return (
                  <div key={m.id}
                      className={`broker-card ${tierClass}`}
                      style={{ position: "relative" }}
                    >
                    <div className="general-tier-badge-label">{tierLabel}</div>
                    <div className="broker-image-container">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.image} alt={m.name} className="broker-image" />
                      <div className="image-overlay" />
                    </div>
                    <div className="broker-content">
                      <span className="broker-location">{m.location}</span>
                      <h2 className="broker-name">{m.name}</h2>
                      <p className="broker-title">Starting at: {m.base_rate}</p>
                      <p className="broker-specialty">Specialty: <span>{m.specialty}</span></p>
                      <p className="broker-specialty" style={{ marginBottom: "8px" }}>Fleet: <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{m.fleet_type.join(", ")}</span></p>
                      <p className="broker-bio">{m.bio}</p>
                      <div className="broker-footer">
                        <div className="broker-stats">
                          <span className="stat-value" style={{ fontSize: "12px" }}>{m.moves_completed} Moves</span>
                        </div>
                        <button className="btn-contact" onClick={() => alert("Booking request sent to " + m.name)}>Request Move →</button>
                      </div>
                    </div>
                    </div>
                );
              })}
            </div>
          </section>
        </div>
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
        .tier-3-card { border-color: #ffb800 !important; box-shadow: 0 4px 16px rgba(255,184,0,0.04); }
        .tier-3-card .general-tier-badge-label { background: linear-gradient(135deg, #ffb800 0%, #f7ebd3 100%); color: #0e0e0e; }
        .tier-3-card .broker-location { color: #ffb800; }
        @keyframes diamondGlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
