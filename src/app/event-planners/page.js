"use client";

import Header from "@/components/layout/Header";
import { useState } from "react";
import "../property/property.css";
import Link from "next/link";
import { getEventPlanners } from "@/data/mockEventPlanners";

const DUMMY_PLANNERS = getEventPlanners();

const SPECIALTIES = [
  "Wedding & Luxury Events",
  "Corporate & Brand Events",
  "Birthdays & Intimate Celebrations",
  "Boutique Socials",
  "Experiential Activations",
];

const LOCATIONS = [
  "Metro Manila",
  "Cebu & Visayas",
  "Davao & Mindanao",
  "Clark & Central Luzon",
  "Iloilo",
];

export default function EventPlannersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [openFilters, setOpenFilters] = useState({ specialties: true, locations: true });

  const toggleFilter = (section) => setOpenFilters((p) => ({ ...p, [section]: !p[section] }));
  const toggle = (val, state, setState) => {
    setState(state.includes(val) ? state.filter((x) => x !== val) : [...state, val]);
  };

  const filtered = DUMMY_PLANNERS.filter((ep) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (
        !ep.name.toLowerCase().includes(q) &&
        !ep.location.toLowerCase().includes(q) &&
        !ep.specialty.toLowerCase().includes(q) &&
        !ep.bio.toLowerCase().includes(q)
      ) return false;
    }
    if (selectedSpecialties.length > 0 && !selectedSpecialties.includes(ep.specialty)) return false;
    if (selectedLocations.length > 0 && !selectedLocations.includes(ep.location)) return false;
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
              ScoutIt Event Design Network is launching soon. Certified planners and decorators will be verified, vetted, and bookable directly through this platform.
              The profiles below are previews of how listing pages will display.
            </p>
          </div>
        </div>

        <header className="directory-header">
          <span className="vector-label">LAYER 03.4 // EVENT DESIGN</span>
          <h1 className="page-title">Design Roster</h1>
          <p className="page-subtitle">Certified planners and event creatives who specialize in styling and coordinating spaces.</p>
        </header>

        <div className="directory-container">
          {/* Sidebar */}
          <aside className="filters-sidebar">
            <div className="filter-card">
              <button className="filter-trigger" onClick={() => toggleFilter("specialties")}>
                Event Type
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
                {[
                  "Design portfolio & execution quality",
                  "Venue references & track record",
                  "Verified supplier network access",
                  "Business permits & liability insurance",
                  "Client satisfaction & testimonials",
                ].map((item) => (
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
                placeholder="SEARCH BY NAME, LOCATION, EVENT TYPE, OR STYLE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="brokers-grid">
              {filtered.map((ep) => {
                const tierClass =
                  ep.tier === 1
                    ? "tier-1-card diamond-card"
                    : ep.tier === 2
                    ? "tier-2-card platinum-card"
                    : "tier-3-card gold-card";
                const tierLabel =
                  ep.tier === 1
                    ? "DIAMOND PARTNER"
                    : ep.tier === 2
                    ? "PLATINUM PARTNER"
                    : "GOLD PARTNER";
                return (
                  <Link
                    href={`/event-planners/${ep.id}`}
                    key={ep.id}
                    className={`broker-card ${tierClass}`}
                    style={{ textDecoration: "none", position: "relative" }}
                  >
                    <div className="general-tier-badge-label">{tierLabel}</div>
                    <div className="coming-soon-card-overlay">PREVIEW CHANNEL</div>
                    <div className="broker-image-container">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ep.image} alt={ep.name} className="broker-image" />
                      <div className="image-overlay" />
                    </div>
                    <div className="broker-content">
                      <span className="broker-location">{ep.location}</span>
                      <h2 className="broker-name">{ep.name}</h2>
                      <p className="broker-title">{ep.title}</p>
                      <p className="broker-specialty">Event Type: <span>{ep.specialty}</span></p>
                      <p className="broker-specialty">Aesthetic: <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{ep.style}</span></p>
                      <p className="broker-specialty" style={{ marginBottom: "8px" }}>Venues: <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{ep.venues}</span></p>
                      <p className="broker-bio">{ep.bio}</p>
                      <div className="broker-footer">
                        <div className="broker-stats">
                          <span className="stat-value" style={{ fontSize: "12px" }}>{ep.events}</span>
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
          height: 220px;
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
        .tier-2-card { border-color: #a5c2d9 !important; }
        .tier-2-card .general-tier-badge-label { background: linear-gradient(135deg, #a5c2d9 0%, #eef3f7 100%); color: #0e0e0e; }
        .tier-2-card .broker-location { color: #a5c2d9; }
        .tier-3-card { border-color: #c8a96e !important; }
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
