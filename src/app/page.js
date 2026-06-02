"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [activePropertyType, setActivePropertyType] = useState("Residential");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeDiscoverType, setActiveDiscoverType] = useState("Residential");
  
  const propertyTypes = ["Residential", "Commercial", "STR", "Restaurants"];

  const locationDictionary = [
    "BGC Core", "Makati Central", "Roxas Triangle", "Quezon City", 
    "Quezon Province", "Alabang", "Siargao"
  ];

  const discoverHubs = {
    Residential: ["BGC Alpha", "Makati Core", "Arca South", "Nuvali Estate", "Forbes Park"],
    Commercial: ["Makati CBD", "Ortigas Center", "BGC North", "Alabang CBD", "Bay Area"],
    STR: ["Siargao Cloud 9", "El Nido Lio", "Boracay Station 1", "Panglao Island", "Coron Town"],
    Restaurants: ["BGC High Street", "Salcedo Village", "Tagaytay Ridge", "Poblacion", "Tomas Morato"]
  };

  const categoryPreviews = {
    Residential: [
      {
        id: "res-1",
        title: "Aurelia Residences",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
        tags: ["Aesthetic: Modern Tropical", "Spatial Density: Low", "Location: BGC Core"],
      },
      {
        id: "res-2",
        title: "The Estate Makati",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
        tags: ["Aesthetic: Brutalist Luxury", "Spatial Density: Medium", "Location: Makati Central"],
      },
      {
        id: "res-3",
        title: "Park Central Towers",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
        tags: ["Aesthetic: Glass Minimalist", "Spatial Density: High", "Location: Roxas Triangle"],
      }
    ],
    Commercial: [
      {
        id: "com-1",
        title: "Zuellig Building",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        tags: ["Aesthetic: Sustainable Glass", "Zoning: Premium IT", "Location: Makati CBD"],
      },
      {
        id: "com-2",
        title: "Arthaland Century Pacific",
        image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=800&q=80",
        tags: ["Aesthetic: Eco-Corporate", "Zoning: Mixed-Use", "Location: BGC North"],
      }
    ],
    STR: [
      {
        id: "str-1",
        title: "Siargao Tropical Villa",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
        tags: ["Aesthetic: Island Minimalist", "Yield: High Velocity", "Location: Cloud 9"],
      },
      {
        id: "str-2",
        title: "Palawan Eco-Retreat",
        image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
        tags: ["Aesthetic: Native Modern", "Yield: Seasonal Peak", "Location: El Nido"],
      }
    ],
    Restaurants: [
      {
        id: "rest-1",
        title: "Gallery by Chele",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
        tags: ["Aesthetic: Wood & Steel", "Capacity: Intimate", "Location: BGC Central"],
      },
      {
        id: "rest-2",
        title: "Antonio's Tagaytay",
        image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
        tags: ["Aesthetic: Heritage Colonial", "Capacity: Estate", "Location: Tagaytay Ridge"],
      }
    ]
  };

  return (
    <main className="cinematic-container">
      {/* SECTION 1: THE HOOK */}
      <section className="snap-section section-hook">
        <div className="grain"></div>
        <div className="hook-content">
          <h1 className="hook-title">SCOUTIT</h1>
          <p className="hook-subtitle">The Space Intelligence Matrix of the Philippines</p>
          <div className="hook-scroll-indicator">
            <span className="scroll-text">Scroll to Initialize</span>
            <div className="scroll-line"></div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE PROPERTY LAYER */}
      <section className="snap-section section-property">
        <div className="property-split">
          {/* Left Menu Panel */}
          <div className="property-menu">
            <div className="menu-header">
              <span className="vector-label">Layer 01 // Asset Discovery</span>
              <h2>Asset Classes</h2>
              <p>Select a sector to preview intelligence parameters.</p>
            </div>
            <nav className="menu-nav">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  className={`menu-btn ${activePropertyType === type ? "active" : ""}`}
                  onClick={() => {
                    setActivePropertyType(type);
                    setSearchQuery("");
                    setShowDropdown(false);
                  }}
                >
                  {type}
                </button>
              ))}
            </nav>
            <div className="menu-footer">
              <Link href="/property/batasan-hills" className="prominent-action-link">
                INITIALIZE PROPERTY MATRIX →
              </Link>
            </div>
          </div>
          
          {/* Right Visual Canvas - Interactive Preview Panel */}
          <div className="matrix-preview-pane">
            <header className="pane-header">
              <h3>{activePropertyType} Intelligence</h3>
              <p>Live active preview stream</p>
            </header>
            
            <div className="search-container">
              <div className="search-input-wrapper">
                <input 
                  type="text" 
                  className="vector-search-input"
                  placeholder="SEARCH ARCHITECTURAL CODES (BY NAME, REGION...)" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {showDropdown && searchQuery.trim() !== "" && (
                  (() => {
                    const matchedLocations = locationDictionary.filter(loc => 
                      loc.toLowerCase().includes(searchQuery.toLowerCase().trim())
                    );
                    
                    if (matchedLocations.length === 0) return null;

                    return (
                      <div className="search-suggestions-dropdown">
                        {matchedLocations.map(loc => (
                          <div 
                            key={loc} 
                            className="dropdown-item"
                            onClick={() => {
                              setSearchQuery(loc);
                              setShowDropdown(false);
                            }}
                          >
                            {loc}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            <div className="mini-cards-grid" key={activePropertyType}>
              {(() => {
                const q = searchQuery.toLowerCase().trim();
                const filtered = categoryPreviews[activePropertyType].filter(item => {
                  if (!q) return true;
                  const titleMatch = item.title.toLowerCase().includes(q);
                  const locationTag = item.tags[2] ? item.tags[2].toLowerCase() : "";
                  const locMatch = locationTag.includes(q);
                  return titleMatch || locMatch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="empty-state-msg">
                      Zero matching assets found in active directory.
                    </div>
                  );
                }

                return filtered.map((item) => (
                  <div key={item.id} className="mini-preview-card">
                    <div className="mini-card-visual">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.title} className="mini-card-image" />
                    </div>
                    <div className="mini-card-body">
                      <h4>{item.title}</h4>
                      <div className="mini-card-tags">
                        {item.tags.map((tag, idx) => {
                          const labels = ["LAYER 01 // VISUAL DNA", "LAYER 02 // VOLUMETRIC METRIC", "ZONE MATRIX // TARGET COORDINATE"];
                          return (
                            <div key={idx} className="mini-tag-wrapper">
                              <span className="mini-tag-label">{labels[idx]}</span>
                              <span className="mini-tag">{tag}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            <div className="matrix-legend-caption">
              Telemetry Stream Note: Selecting alternative vectors (Commercial, STR, Restaurants) updates the localized zone ribbons dynamically. Initialize the core matrix below to interact with real-time sliding tracks and popup briefs.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE DISCOVER LAYER */}
      <section className="snap-section section-discover" style={{ padding: 0 }}>
        <div className="property-split">
          {/* Left Menu Panel */}
          <div className="property-menu">
            <div className="menu-header">
              <span className="vector-label">Layer 02 // Active Intel Feed</span>
              <h2>Active Intelligence Feed</h2>
              <p>Select a sector to preview live discovery streams.</p>
            </div>
            <nav className="menu-nav">
              {propertyTypes.map((type) => (
                <button
                  key={type}
                  className={`menu-btn ${activeDiscoverType === type ? "active" : ""}`}
                  onClick={() => setActiveDiscoverType(type)}
                >
                  {type}
                </button>
              ))}
            </nav>
            <div className="menu-footer">
              <Link href={`/discover?type=${activeDiscoverType.toLowerCase()}`} className="prominent-action-link">
                LAUNCH DISCOVERY MATRIX →
              </Link>
            </div>
          </div>

          {/* Right Visual Canvas */}
          <div className="matrix-preview-pane">
            <header className="pane-header">
              <h3>{activeDiscoverType} Intelligence</h3>
              <p>Active Discovery Feed Preview</p>
            </header>
            
            <div className="discover-feed-preview" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="preview-card matrix-preview" style={{ height: '120px' }}>
                <div className="preview-card-bg matrix-bg"></div>
                <div className="preview-card-content" style={{ position: 'relative', zIndex: 10 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#fff', marginBottom: '4px' }}>Spotlight Matrix</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Explore exclusive {activeDiscoverType.toLowerCase()} showcases</p>
                </div>
              </div>
              
              <div className="preview-card news-preview" style={{ height: '110px' }}>
                <div className="preview-card-bg news-bg"></div>
                <div className="preview-card-content" style={{ position: 'relative', zIndex: 10 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#fff', marginBottom: '4px' }}>Chronological News</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Regional intelligence briefs for {activeDiscoverType.toLowerCase()}</p>
                </div>
              </div>

              <Link 
                href={`/discover?type=${activeDiscoverType.toLowerCase()}&focus=location`} 
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="preview-card location-preview" style={{ height: '110px', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                     onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div className="preview-card-bg location-bg"></div>
                  <div className="preview-card-content" style={{ position: 'relative', zIndex: 10 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#fff', marginBottom: '4px' }}>Top 10 Recommended Properties by Location</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Access deep architectural matrices filtered by geographical tiering.</p>
                  </div>
                </div>
              </Link>
            </div>

            <div className="matrix-legend-caption">
              Telemetry Stream Note: The Discovery Matrix tracks macro-economic trends and specific architectural hotspots across the archipelago.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE BROKERS LAYER */}
      <section className="snap-section section-brokers">
        <div className="brokers-content">
          <header className="section-header-center">
            <span className="vector-label">Layer 03 // Partner Network</span>
            <h2>Intelligence Roster</h2>
            <p>Connect with elite space intelligence advisors across the archipelago.</p>
          </header>
          
          <div className="brokers-blur-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {[
              { name: "Miguel Torres, REB", status: "Principal Strategist", history: "3 Verified Closures // BGC Focus", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80", metrics: [
                { label: "Active Retentions", value: "14 this quarter" },
                { label: "Stewardship Velocity", value: "38 avg. days" },
                { label: "Continuity Score", value: "89% repeat" }
              ] },
              { name: "Elena Santos, REB", status: "Global Capital Manager", history: "2 Verified Closures // Makati Core", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80", metrics: [
                { label: "Active Retentions", value: "18 this quarter" },
                { label: "Stewardship Velocity", value: "42 avg. days" },
                { label: "Continuity Score", value: "92% repeat" }
              ] },
              { name: "Marco Reyes, REB", status: "Lead Arbitrage Analyst", history: "4 Verified Closures // STR Sector", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80", metrics: [
                { label: "Active Retentions", value: "22 this quarter" },
                { label: "Stewardship Velocity", value: "35 avg. days" },
                { label: "Continuity Score", value: "95% repeat" }
              ] }
            ].map((broker, i) => (
              <div key={i} className="broker-preview-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-solid)', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'default' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundImage: `url(${broker.image})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(100%) contrast(1.2)', marginBottom: '16px', border: '2px solid var(--border-solid)' }}></div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '4px' }}>{broker.name} <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'normal', fontFamily: 'var(--font-mono)' }}>// {broker.status}</span></h3>
                
                {/* 3-metric trust analytics block */}
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '16px', marginTop: '12px' }}>
                  {broker.metrics.map((m, idx) => (
                    <div key={idx} style={{ flex: 1, background: '#0e0e0e', border: '1px solid #262626', padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500', display: 'block', textAlign: 'center', lineHeight: '1.2' }}>{m.label}</span>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#f0ede8', display: 'block', textAlign: 'center', lineHeight: '1.1' }}>{m.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '4px', width: '100%' }}>{broker.history}</div>
              </div>
            ))}
          </div>

          <div className="section-action-footer">
            <Link href="/brokers" className="prominent-action-link">
              ACCESS ROSTER DIRECTORY →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: THE WISHLIST LAYER */}
      <section className="snap-section section-wishlist" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
        <div className="wishlist-content" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '80px', alignItems: 'center' }}>
          
          {/* Left Column: The Manifesto */}
          <div className="wishlist-manifesto" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="vector-label" style={{ marginBottom: '16px' }}>Layer 04 // Your Board</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--text-primary)', marginBottom: '24px' }}>Your Board</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.8', marginBottom: '40px', maxWidth: '480px' }}>
              Architect your future. Your personal ledger functions as a secure, private command vault. Add your dream properties here to map spatial densities, compare visual DNA, and log live structural telemetries—no account required.
            </p>
            <Link href="/wishlist" className="prominent-action-link" style={{ marginTop: 'auto', background: 'transparent', border: '1px solid #c8a96e', color: '#c8a96e', padding: '12px 24px', borderRadius: '0' }}>
              Start Exploring →
            </Link>
          </div>

          {/* Right Column: Preview Matrix Placeholder */}
          <div className="wishlist-preview-matrix" style={{ flex: 1, width: '100%', background: '#121212', border: '1px dashed #222222', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '350px', borderRadius: '4px' }}>
            {/* Minimalist Glowing Blueprint Icon */}
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="rgba(200, 169, 110, 0.5)" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '32px', filter: 'drop-shadow(0 0 12px rgba(200, 169, 110, 0.2))' }}>
              <path d="M2 22h20"></path>
              <path d="M4 22V6l8-4 8 4v16"></path>
              <path d="M9 22v-8h6v8"></path>
              <path d="M2 10l10-6 10 6"></path>
              <rect x="6" y="10" width="4" height="4"></rect>
              <rect x="14" y="10" width="4" height="4"></rect>
            </svg>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#f0ede8', lineHeight: '1.2' }}>
              Your dreams live here.
            </div>
            <div style={{ fontFamily: 'system-ui', fontSize: '14px', color: '#8a8a8a', marginTop: '8px' }}>
              Dreaming is free. This is your inspiration board.
            </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 6: THE ABOUT US LAYER */}
      <section className="snap-section section-about">
        <div className="about-content">
          <header className="section-header-center">
            <h2>The ScoutIt Manifesto</h2>
          </header>
          
          <div className="about-manifesto-preview">
            <p className="manifesto-lead">
              ScoutIt is not a marketplace. We are a space intelligence platform engineering the acquisition and transfer of prime real estate assets across the Philippine archipelago.
            </p>
            <p className="manifesto-secondary">
              In a fragmented market, information asymmetry dictates value. Our platform aggregates and synthesizes spatial data into a unified, high-fidelity matrix.
            </p>
          </div>

          <div className="section-action-footer">
            <Link href="/about" className="prominent-action-link">
              READ THE CORE DNA →
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        /* Cinematic Snap Container */
        .cinematic-container {
          height: 100vh;
          width: 100vw;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
          background: var(--bg);
          color: var(--text-primary);
        }
        
        .cinematic-container::-webkit-scrollbar {
          display: none;
        }

        .snap-section {
          scroll-snap-align: start;
          width: 100%;
          height: 100vh;
          position: relative;
          overflow: hidden;
        }

        /* Prominent Action Links */
        .prominent-action-link {
          display: inline-block;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--accent);
          background: transparent;
          border: 1px solid var(--accent);
          padding: 16px 32px;
          border-radius: 4px;
          transition: all var(--transition-fast);
          text-decoration: none;
        }

        .prominent-action-link:hover {
          background: var(--accent);
          color: #000;
          box-shadow: 0 0 24px rgba(200, 169, 110, 0.2);
        }

        .section-action-footer {
          text-align: center;
          margin-top: 48px;
        }

        /* SECTION 1: THE HOOK */
        .section-hook {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0e0e0e;
        }

        .hook-content {
          text-align: center;
          z-index: 10;
        }

        .hook-title {
          font-family: var(--font-display);
          font-size: 8vw;
          letter-spacing: 0.15em;
          color: var(--accent);
          margin-bottom: 16px;
          animation: fadeUp 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        .hook-subtitle {
          font-family: var(--font-mono);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: var(--text-muted);
          animation: fadeUp 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        .hook-scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: fadeIn 2s ease 1s forwards;
          opacity: 0;
        }

        .scroll-text {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--accent);
        }

        .scroll-line {
          width: 1px;
          height: 60px;
          background: linear-gradient(to bottom, var(--accent) 0%, transparent 100%);
          animation: pulseLine 2s infinite;
        }

        /* SECTION 2: PROPERTY LAYER */
        .property-split {
          display: flex;
          height: 100vh;
          width: 100%;
        }

        .property-menu {
          width: 450px;
          background: var(--surface);
          border-right: 1px solid var(--border-solid);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px 40px;
          z-index: 10;
        }

        .menu-header h2 {
          font-family: var(--font-display);
          font-size: 36px;
          margin: 12px 0;
          color: var(--text-primary);
        }

        .menu-header p {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .vector-label {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--accent);
        }

        .menu-nav {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .menu-btn {
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-size: 28px;
          font-family: var(--font-display);
          padding: 20px 24px;
          cursor: pointer;
          transition: all var(--transition);
          border-radius: var(--radius-sm);
        }

        .menu-btn:hover {
          color: var(--text-primary);
          padding-left: 32px;
        }

        .menu-btn.active {
          color: var(--accent);
          background: var(--surface2);
          border-color: var(--border-solid);
          padding-left: 32px;
        }

        .menu-footer {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .matrix-preview-pane {
          flex: 1;
          background: #121212;
          padding: 40px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .pane-header {
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-solid);
        }

        .pane-header h3 {
          font-family: var(--font-display);
          font-size: 28px;
          color: #fff;
          margin-bottom: 4px;
        }

        .pane-header p {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .search-container {
          margin-bottom: 24px;
        }

        .search-input-wrapper {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .vector-search-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #333333;
          padding: 12px 16px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 11px;
          letter-spacing: 0.05em;
          outline: none;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .vector-search-input::placeholder {
          color: #666666;
        }

        .vector-search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 8px rgba(200, 169, 110, 0.15);
        }

        .search-suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background: #1a1a1a;
          border: 1px solid var(--border-solid);
          border-top: none;
          z-index: 50;
          display: flex;
          flex-direction: column;
        }

        .dropdown-item {
          padding: 10px 16px;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: 11px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .dropdown-item:hover {
          background: #222222;
          color: var(--accent);
        }

        .empty-state-msg {
          color: var(--text-muted);
          font-size: 13px;
          font-style: italic;
          padding: 24px 0;
          grid-column: 1 / -1;
        }

        .mini-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .mini-preview-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }

        .mini-preview-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
        }

        .mini-card-visual {
          height: 180px;
          overflow: hidden;
          background: #000;
        }

        .mini-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.85;
          transition: transform 0.6s ease, opacity 0.6s ease;
        }

        .mini-preview-card:hover .mini-card-image {
          transform: scale(1.05);
          opacity: 1;
        }

        .mini-card-body {
          padding: 20px;
        }

        .mini-card-body h4 {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .mini-card-tags {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mini-tag-wrapper {
          display: flex;
          flex-direction: column;
        }

        .mini-tag-label {
          color: var(--accent);
          font-size: 9px;
          letter-spacing: 0.1em;
          opacity: 0.75;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .mini-tag {
          font-size: 11px;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 2px;
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
        }

        .matrix-legend-caption {
          margin-top: 24px;
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        /* SECTION 3: DISCOVER LAYER */
        .section-discover {
          background: var(--bg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
        }

        .discover-content {
          width: 100%;
          max-width: 1400px;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .discover-header {
          text-align: center;
        }

        .discover-header h2 {
          font-family: var(--font-display);
          font-size: 42px;
          margin: 12px 0;
        }

        .discover-header p {
          font-size: 15px;
          color: var(--text-secondary);
        }

        .discover-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          height: 400px;
        }

        .preview-card {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-solid);
          display: flex;
          align-items: flex-end;
          padding: 32px;
          transition: all var(--transition);
        }

        .preview-card:hover {
          border-color: var(--accent);
          transform: translateY(-10px);
          box-shadow: var(--shadow-lg);
        }

        .preview-card-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.4;
          transition: transform 0.6s ease, opacity 0.6s ease;
        }

        .preview-card:hover .preview-card-bg {
          transform: scale(1.05);
          opacity: 0.6;
        }

        .matrix-bg {
          background-image: url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80');
        }

        .news-bg {
          background-image: url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80');
        }

        .location-bg {
          background-image: url('https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80');
        }

        .preview-card-content {
          position: relative;
          z-index: 2;
        }

        .preview-card-content h3 {
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          margin-bottom: 8px;
        }

        .preview-card-content p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        /* SECTION 4: BROKERS LAYER */
        .section-brokers {
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
        }
        
        .brokers-content {
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .section-header-center {
          text-align: center;
        }

        .section-header-center h2 {
          font-family: var(--font-display);
          font-size: 42px;
          margin: 12px 0;
        }

        .section-header-center p {
          font-size: 15px;
          color: var(--text-secondary);
        }

        .brokers-blur-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .broker-ghost-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          filter: blur(1px);
          transition: filter var(--transition-fast), background var(--transition-fast);
        }

        .broker-ghost-card:hover {
          filter: blur(0px);
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--accent-border);
        }

        .broker-ghost-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(200, 169, 110, 0.1);
          border: 1px dashed var(--accent-border);
        }

        .broker-ghost-lines {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .broker-ghost-lines .line-1 {
          height: 12px;
          width: 70%;
          background: rgba(240, 237, 232, 0.1);
          border-radius: 2px;
        }

        .broker-ghost-lines .line-2 {
          height: 8px;
          width: 40%;
          background: rgba(240, 237, 232, 0.05);
          border-radius: 2px;
        }

        /* SECTION 5: WISHLIST LAYER */
        .section-wishlist {
          background: var(--bg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
        }

        .wishlist-content {
          width: 100%;
          max-width: 1000px;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .ledger-ghost {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .ledger-ghost-header {
          height: 48px;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid var(--border-solid);
        }

        .ledger-ghost-row {
          height: 72px;
          border-bottom: 1px solid var(--border-solid);
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 16px;
          transition: background var(--transition-fast);
        }
        .ledger-ghost-row:last-child { border-bottom: none; }
        .ledger-ghost-row:hover { background: var(--surface2); }
        .ledger-ghost-row::before {
          content: "";
          height: 12px;
          width: 30%;
          background: rgba(240, 237, 232, 0.05);
          border-radius: 2px;
        }
        .ledger-ghost-row::after {
          content: "";
          height: 24px;
          width: 80px;
          background: rgba(200, 169, 110, 0.05);
          border: 1px solid rgba(200, 169, 110, 0.2);
          border-radius: 12px;
          margin-left: auto;
        }

        /* SECTION 6: ABOUT US LAYER */
        .section-about {
          background: #080808;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
        }

        .about-content {
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: 60px;
          text-align: center;
        }

        .about-manifesto-preview {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .manifesto-lead {
          font-family: var(--font-display);
          font-size: 32px;
          line-height: 1.5;
          color: var(--accent);
          opacity: 0.9;
        }

        .manifesto-secondary {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-secondary);
        }

        /* Animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulseLine {
          0% { opacity: 0.2; height: 0px; }
          50% { opacity: 1; height: 60px; }
          100% { opacity: 0.2; height: 60px; }
        }

        @keyframes zoomIn {
          from { transform: scale(1.05); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Mobile Adjustments */
        @media (max-width: 1024px) {
          .property-split {
            flex-direction: column;
          }
          .property-menu {
            width: 100%;
            height: 40vh;
            padding: 24px;
            border-right: none;
            border-bottom: 1px solid var(--border-solid);
          }
          .discover-preview-grid, .brokers-blur-grid {
            grid-template-columns: 1fr;
            height: auto;
          }
          .preview-card {
            height: 250px;
          }
          .hook-title {
            font-size: 12vw;
          }
        }
      `}</style>
    </main>
  );
}
