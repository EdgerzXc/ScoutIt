"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import Link from "next/link";
import "../property/property.css";
import FoundingProgramPanel from "@/components/ecosystem/FoundingProgramPanel";
import { loadPublicProviders } from "@/lib/profileClient";

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
  // Real roster: public event-planner profiles from Supabase (same pattern as
  // /photographers and /researchers — RLS only exposes is_profile_public rows).
  // This page previously hardcoded an empty array and never fetched anything.
  const [planners, setPlanners] = useState(null); // null = loading
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [openFilters, setOpenFilters] = useState({ specialties: true, locations: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await loadPublicProviders("event_planner");
      if (cancelled) return;
      if (error) {
        console.error("Failed to load event planners", error);
        setPlanners([]);
        return;
      }
      setPlanners(data.map((p) => ({
        name: p.display_name || "Unnamed Planner",
        location: p.location || "",
        specialty: p.service || "",
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

  const filtered = (planners || []).filter((ep) => {
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

            {planners === null && (
              <div className="roster-state" role="status" aria-live="polite">
                <span className="roster-state-label">Scanning the roster…</span>
              </div>
            )}
            {planners !== null && filtered.length === 0 && (
              <div className="roster-state">
                <span className="roster-state-label">
                  {planners.length === 0
                    ? "No event designers on the public roster yet"
                    : "No event designers match your filters"}
                </span>
                <span className="roster-state-sub">
                  {planners.length === 0
                    ? "Founding Designer slots are open below."
                    : "Clear a filter or broaden your search."}
                </span>
              </div>
            )}
            {filtered.length > 0 && (
              <div className="brokers-grid" style={{ marginBottom: 32 }}>
                {filtered.map((ep) => (
                  <Link key={ep.name} href={`/profile/${encodeURIComponent(ep.name)}`} className="broker-card" style={{ textDecoration: "none" }}>
                    {ep.isExample && <div className="example-badge-overlay">Example Profile</div>}
                    <div className="broker-image-container">
                      {ep.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={ep.image} alt={ep.name} className="broker-image" loading="lazy" />
                      ) : (
                        <div className="broker-image broker-image-fallback" aria-hidden="true">📐</div>
                      )}
                      <div className="image-overlay"></div>
                    </div>
                    <div className="broker-content">
                      <div className="broker-location">{ep.location}</div>
                      <h2 className="broker-name">{ep.name}</h2>
                      <p className="broker-title">{ep.headline || "Event & Space Designer"}</p>
                      {ep.specialty && <p className="broker-specialty">Specialty: <span>{ep.specialty}</span></p>}
                      {ep.bio && <p className="broker-bio">{ep.bio}</p>}
                      <div className="broker-footer">
                        <span className={`availability-chip ${ep.available ? "is-available" : ""}`}>
                          <span className="availability-dot" aria-hidden="true"></span>
                          {ep.available ? "Available for events" : "Currently unavailable"}
                        </span>
                        <span className="btn-contact">View Profile</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <FoundingProgramPanel
              icon="📐"
              serviceName="Event & space design"
              foundingTitle="Become a Founding Designer"
              supplyBlurb="Event and space design launches with the platform. Join now as a Founding Designer — build your portfolio, get matched to venues and restaurants, and be first in line at launch."
              perks={[
                "Build your design portfolio before launch",
                "Claim your verified ScoutIt ID card",
                "Lock in founding-member pricing",
                "Get matched to venues & restaurants from day one",
              ]}
              ctaLabel="Claim Founding Designer"
            />
          </section>
        </div>
      </main>
      <Footer />

      <style>{`
        .coming-soon-banner {
          background: linear-gradient(135deg, rgba(232, 174, 60,0.08) 0%, rgba(232, 174, 60,0.03) 100%);
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
        .tier-3-card { border-color: #E8AE3C !important; }
        .tier-3-card .general-tier-badge-label { background: linear-gradient(135deg, #E8AE3C 0%, #f7ebd3 100%); color: #0e0e0e; }
        .tier-3-card .broker-location { color: #E8AE3C; }
        @keyframes diamondGlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
