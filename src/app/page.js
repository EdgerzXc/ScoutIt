"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

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

  // ── Sparkle glitters — upper zone (4-point stars) ──────────────
  const STAR_POSITIONS = [
    { top: '6%',  left: '8%',  type: 'tiny'   },
    { top: '11%', left: '22%', type: 'medium'  },
    { top: '4%',  left: '38%', type: 'tiny'    },
    { top: '8%',  left: '55%', type: 'hero'    },
    { top: '13%', left: '68%', type: 'medium'  },
    { top: '5%',  left: '80%', type: 'tiny'    },
    { top: '10%', left: '92%', type: 'medium'  },
    { top: '18%', left: '12%', type: 'medium'  },
    { top: '22%', left: '30%', type: 'tiny'    },
    { top: '16%', left: '47%', type: 'tiny'    },
    { top: '20%', left: '62%', type: 'hero'    },
    { top: '15%', left: '75%', type: 'medium'  },
    { top: '24%', left: '88%', type: 'tiny'    },
    { top: '28%', left: '5%',  type: 'hero'    },
    { top: '30%', left: '18%', type: 'tiny'    },
    { top: '26%', left: '42%', type: 'medium'  },
    { top: '32%', left: '72%', type: 'tiny'    },
    { top: '29%', left: '95%', type: 'medium'  },
  ];

  // ── Background dot-stars — CSS twinkle, staggered delays ─────
  const BG_STAR_POSITIONS = [
    { top: '8%',  left: '4%',  cls: 'star-fast', delay: 0.3  },
    { top: '45%', left: '3%',  cls: 'star-slow', delay: 2.1  },
    { top: '70%', left: '7%',  cls: 'star-med',  delay: 1.4  },
    { top: '85%', left: '14%', cls: 'star-fast', delay: 3.7  },
    { top: '55%', left: '24%', cls: 'star-slow', delay: 0.8  },
    { top: '80%', left: '31%', cls: 'star-med',  delay: 4.2  },
    { top: '38%', left: '40%', cls: 'star-fast', delay: 1.9  },
    { top: '65%', left: '44%', cls: 'star-slow', delay: 5.5  },
    { top: '92%', left: '51%', cls: 'star-med',  delay: 0.6  },
    { top: '75%', left: '64%', cls: 'star-fast', delay: 3.1  },
    { top: '52%', left: '77%', cls: 'star-slow', delay: 6.8  },
    { top: '88%', left: '83%', cls: 'star-med',  delay: 2.4  },
    { top: '42%', left: '13%', cls: 'star-fast', delay: 7.2  },
    { top: '68%', left: '54%', cls: 'star-slow', delay: 1.1  },
    { top: '78%', left: '41%', cls: 'star-med',  delay: 4.9  },
    { top: '25%', left: '90%', cls: 'star-fast', delay: 0.4  },
    { top: '60%', left: '11%', cls: 'star-slow', delay: 8.3  },
    { top: '35%', left: '57%', cls: 'star-med',  delay: 2.7  },
    { top: '82%', left: '59%', cls: 'star-fast', delay: 5.1  },
    { top: '48%', left: '34%', cls: 'star-slow', delay: 1.6  },
    { top: '72%', left: '19%', cls: 'star-med',  delay: 6.4  },
    { top: '62%', left: '89%', cls: 'star-fast', delay: 3.3  },
    { top: '90%', left: '27%', cls: 'star-slow', delay: 9.1  },
    { top: '40%', left: '73%', cls: 'star-med',  delay: 0.9  },
    { top: '55%', left: '97%', cls: 'star-fast', delay: 4.6  },
    { top: '15%', left: '53%', cls: 'star-slow', delay: 7.8  },
    { top: '95%', left: '69%', cls: 'star-med',  delay: 2.2  },
    { top: '33%', left: '86%', cls: 'star-fast', delay: 5.9  },
    { top: '18%', left: '77%', cls: 'star-slow', delay: 1.3  },
    { top: '50%', left: '48%', cls: 'star-med',  delay: 8.7  },
  ];

  const [activeStars, setActiveStars] = useState({});
  const starTimers = useRef([]);

  // Glitter sparkles (upper zone — JS random timer)
  useEffect(() => {
    const scheduleNext = (idx) => {
      const delay = 2000 + Math.random() * 7000;
      const t = setTimeout(() => {
        setActiveStars(prev => ({ ...prev, [idx]: true }));
        const hideT = setTimeout(() => {
          setActiveStars(prev => ({ ...prev, [idx]: false }));
          scheduleNext(idx);
        }, 1800 + Math.random() * 600);
        starTimers.current.push(hideT);
      }, delay);
      starTimers.current.push(t);
    };
    STAR_POSITIONS.forEach((_, idx) => {
      const t = setTimeout(() => scheduleNext(idx), Math.random() * 5000);
      starTimers.current.push(t);
    });
    return () => starTimers.current.forEach(clearTimeout);
  }, []);
  // bg-stars now use pure CSS twinkle animations (no JS timers needed)

  return (
    <main className="cinematic-container">
      {/* SECTION 1: SPACE HERO */}
      <section className="snap-section section-hook">
        <div className="grain"></div>

        {/* Deep space nebula background */}
        <div className="nebula-bg"></div>

        {/* Background dot-stars — CSS infinite twinkle, staggered */}
        {BG_STAR_POSITIONS.map((pos, idx) => (
          <div
            key={`bg-star-${idx}`}
            className={`bg-star ${pos.cls}`}
            style={{ top: pos.top, left: pos.left, animationDelay: `${pos.delay}s` }}
          />
        ))}

        {/* Occasional sparkle glitters — upper zone */}
        {STAR_POSITIONS.map((pos, idx) => (
          <div
            key={`glitter-${idx}`}
            className={`glitter glitter-${pos.type} ${activeStars[idx] ? 'glitter-active' : ''}`}
            style={{ top: pos.top, left: pos.left }}
          >
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0 L11.2 8.8 L20 10 L11.2 11.2 L10 20 L8.8 11.2 L0 10 L8.8 8.8 Z"
                fill={pos.type === 'hero' ? '#e8d5a3' : pos.type === 'medium' ? '#f0ebe0' : '#ffffff'}
              />
            </svg>
          </div>
        ))}

        {/* Main hook content */}
        <div className="hook-content">

          {/* Animated SCOUTIT wordmark */}
          <div className="scoutit-wordmark" aria-label="SCOUTIT">
            {/* S — comet trail draw */}
            <span className="letter letter-s" style={{ animationDelay: '0s' }}>S</span>
            {/* C — eclipse reveal */}
            <span className="letter letter-c" style={{ animationDelay: '0.55s' }}>C</span>
            {/* O — planet orbit */}
            <span className="letter letter-o" style={{ animationDelay: '1.0s' }}>
              O
              <span className="orbit-ring"></span>
            </span>
            {/* U — signal fill */}
            <span className="letter letter-u" style={{ animationDelay: '1.45s' }}>U</span>
            {/* T — satellite arms */}
            <span className="letter letter-t1" style={{ animationDelay: '1.9s' }}>T</span>

            {/* I — normal letter, UFO anchored above via two wrapper layers:
                  ufo-anchor = static centering (never animated)
                  ufo-float  = animation only (translateY, never touches X) */}
            <span className="letter letter-i" style={{ animationDelay: '2.3s' }}>
              I
              <span className="ufo-anchor">
                <span className="ufo-float">
                  <span className="ufo">
                    <span className="ufo-dome"></span>
                    <span className="ufo-disc">
                      <span className="ufo-light ufo-light-1"></span>
                      <span className="ufo-light ufo-light-2"></span>
                      <span className="ufo-light ufo-light-3"></span>
                    </span>
                  </span>
                </span>
              </span>
            </span>

            {/* T — targeting reticle */}
            <span className="letter letter-t2" style={{ animationDelay: '3.5s' }}>
              T
              <span className="reticle-ring reticle-1"></span>
              <span className="reticle-ring reticle-2"></span>
            </span>
          </div>

          <p className="hook-subtitle">The Space Intelligence Matrix of the Philippines</p>
        </div>

        {/* Scroll indicator — direct child of section so absolute bottom works */}
        <div className="hook-scroll-indicator">
          <span className="scroll-text">Scroll to Initialize</span>
          <div className="scroll-line"></div>
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
                Discover Your Next Space →
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
              Selecting alternative categories (Commercial, STR, Restaurants) updates the localized zone ribbons dynamically. Explore the discovery layer below to interact with live property tracks and intel briefs.
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
                Begin Your Search →
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
              { name: "Elena Santos, REB", status: "Global Capital Manager", history: "2 Verified Closures // QC Residential", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80", metrics: [
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
              Your dreams live here. Save the spaces that move you — no account needed. Come back to them anytime.
            </p>
            <Link href="/wishlist" className="prominent-action-link" style={{ marginTop: 'auto', background: 'transparent', border: '1px solid #c8a96e', color: '#c8a96e', padding: '12px 24px', borderRadius: '0' }}>
              Find the One →
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

        /* ═══ SECTION 1: SPACE HERO ══════════════════════════════════ */
        .section-hook {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #07071a;
          overflow: hidden;
        }

        /* Deep nebula background gradient */
        .nebula-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,20,80,0.7) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%, rgba(10,30,60,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 60%, rgba(20,10,50,0.4) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Background dot-stars — CSS infinite twinkle ─────────── */
        .bg-star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: #fff;
          opacity: 0;
          pointer-events: none;
          z-index: 1;
        }

        /* Fast twinkling stars — blink in/out every ~2s */
        .star-fast {
          animation: twinkleFast 2.2s ease-in-out infinite;
        }

        /* Medium twinkling stars — every ~4s */
        .star-med {
          animation: twinkleMed 4.1s ease-in-out infinite;
        }

        /* Slow, deep-space stars — every ~7s */
        .star-slow {
          animation: twinkleSlow 7.4s ease-in-out infinite;
        }


        /* ── Occasional sparkle glitters ──────────────────────────── */
        .glitter {
          position: absolute;
          z-index: 2;
          opacity: 0;
          transform: scale(0) rotate(0deg);
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
          pointer-events: none;
          filter: drop-shadow(0 0 4px rgba(255,255,255,0.8));
        }

        .glitter-active {
          opacity: 1;
          transform: scale(1) rotate(15deg);
          transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }

        .glitter-tiny  { width: 8px;  height: 8px; }
        .glitter-medium { width: 12px; height: 12px; filter: drop-shadow(0 0 6px rgba(240,235,224,0.9)); }
        .glitter-hero  { width: 18px; height: 18px; filter: drop-shadow(0 0 10px rgba(232,213,163,1)); }

        /* ── Main wordmark container ─────────────────────────────── */
        .hook-content {
          text-align: center;
          z-index: 10;
          position: relative;
        }

        .scoutit-wordmark {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 0.04em;
          margin-bottom: 24px;
          line-height: 1;
        }

        /* Base letter style */
        .letter {
          font-family: var(--font-display);
          font-size: 8vw;
          letter-spacing: 0.05em;
          color: var(--accent);
          display: inline-block;
          position: relative;
          opacity: 0;
        }

        /* ── S: Comet Trail ───────────────────────────── */
        .letter-s {
          animation: cometDraw 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
          text-shadow: 4px -2px 12px rgba(200,169,110,0.8), 8px -4px 20px rgba(200,169,110,0.4);
        }

        /* ── C: Eclipse Reveal ────────────────────────── */
        .letter-c {
          animation: eclipseReveal 0.65s ease forwards;
          clip-path: inset(0 100% 0 0);
        }

        /* ── O: Planet + Orbit Ring ───────────────────── */
        .letter-o {
          animation: planetPulse 0.6s ease forwards;
        }

        .orbit-ring {
          position: absolute;
          top: 50%; left: 50%;
          width: 120%; height: 35%;
          border: 1px solid rgba(200,169,110,0.5);
          border-radius: 50%;
          transform: translate(-50%, -50%) rotateX(65deg);
          animation: orbitSweep 1.4s ease-out 1.0s forwards;
          opacity: 0;
          pointer-events: none;
        }

        /* -- U: Signal Dish Fill -- */
        .letter-u {
          animation: signalFill 0.55s ease forwards;
        }

        /* ── T1: Satellite Arms ───────────────────────── */
        .letter-t1 {
          animation: satelliteArms 0.55s ease forwards;
          transform-origin: center center;
        }

        /* I — normal letter, just needs position:relative for the UFO anchor */
        .letter-i {
          animation: fadeIn 0.4s ease forwards;
          position: relative;
        }

        /* UFO ANCHOR — static centering, never animated.
           ::after drops the green cognition beam down through the I */
        .ufo-anchor {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          margin-bottom: 0.08em;
        }

        .ufo-anchor::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 1.1em;
          background: linear-gradient(to bottom, rgba(34,197,94,0.35), transparent);
          animation: beamGlow 2.2s ease-in-out 3.5s infinite;
          opacity: 0;
          animation-fill-mode: forwards;
          border-radius: 0 0 2px 2px;
        }

        /* UFO FLOAT — only translateY animated, horizontal centering untouched */
        .ufo-float {
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0;
          animation:
            ufoDescend 1.0s cubic-bezier(0.22,1,0.36,1) 2.3s forwards,
            float       3.5s ease-in-out 3.4s infinite;
        }

        /* GREEN UFO disc */
        .ufo-disc {
          width: 0.5em;
          height: 0.11em;
          background: linear-gradient(180deg, #6eff8a 0%, #1faa3a 100%);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,220,80,0.7), 0 0 22px rgba(0,220,80,0.3);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-evenly;
          padding: 0 6%;
        }

        .ufo-disc::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: transparent;
          box-shadow: 0 0 14px rgba(0,220,80,0.5);
          animation: discGlow 2.5s ease-in-out 3.5s infinite;
        }

        /* GREEN UFO dome */
        .ufo-dome {
          width: 0.22em;
          height: 0.12em;
          background: linear-gradient(180deg, rgba(80,255,120,0.2) 0%, rgba(0,200,60,0.08) 100%);
          border: 1px solid rgba(80,255,120,0.5);
          border-bottom: none;
          border-radius: 50% 50% 0 0;
        }

        /* GREEN UFO lights */
        .ufo-light {
          width: 0.04em;
          height: 0.04em;
          min-width: 3px;
          min-height: 3px;
          border-radius: 50%;
          background: #a8ffb8;
          box-shadow: 0 0 5px #50ff80;
        }


        .ufo {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }


        .ufo-light-1 { animation: blinkLight 1.2s ease-in-out 3.5s infinite; }
        .ufo-light-2 { animation: blinkLight 1.8s ease-in-out 3.9s infinite; }
        .ufo-light-3 { animation: blinkLight 1.5s ease-in-out 4.3s infinite; }

        /* Tractor beam (vertical stroke of I) */
        .ufo-beam {
          width: 0.08em;
          min-width: 4px;
          flex: 1;
          min-height: 0.55em;
          background: linear-gradient(to bottom, rgba(200,169,110,0.7) 0%, rgba(200,169,110,0.15) 100%);
          clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
          animation: beamPulse 2s ease-in-out 3.4s infinite;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        /* ── T2: Targeting Reticle ────────────────────── */
        .letter-t2 {
          animation: targetLock 0.6s ease forwards;
          position: relative;
        }

        .reticle-ring {
          position: absolute;
          top: 50%; left: 50%;
          border-radius: 50%;
          border: 1px solid rgba(200,169,110,0.5);
          transform: translate(-50%, -50%) scale(2);
          opacity: 0;
          pointer-events: none;
        }

        .reticle-1 {
          width: 1.4em; height: 1.4em;
          animation: reticleContract 0.5s ease 3.5s forwards;
        }
        .reticle-2 {
          width: 2.2em; height: 2.2em;
          animation: reticleContract 0.5s ease 3.65s forwards;
        }

        /* ── Subtitle ─────────────────────────────────── */
        .hook-subtitle {
          font-family: var(--font-mono);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: var(--text-muted);
          animation: fadeUp 1s ease 4.0s forwards;
          opacity: 0;
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
          animation: fadeIn 1.5s ease 4.5s forwards;
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

        /* KEYFRAMES ═══════════════════════════════════════════════════ */

        /* S — comet: draws left-to-right with trailing glow */
        @keyframes cometDraw {
          0%   { opacity: 0; clip-path: inset(0 100% 0 0); }
          30%  { opacity: 1; clip-path: inset(0 60% 0 0); }
          100% { opacity: 1; clip-path: inset(0 0% 0 0); }
        }

        /* C — eclipse reveal */
        @keyframes eclipseReveal {
          0%   { opacity: 0; clip-path: inset(0 100% 0 0); }
          100% { opacity: 1; clip-path: inset(0 0% 0 0); }
        }

        /* O — planet pulse */
        @keyframes planetPulse {
          0%   { opacity: 0; transform: scale(0.6); filter: blur(4px); }
          60%  { opacity: 1; transform: scale(1.08); filter: blur(0); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* O orbit ring sweep */
        @keyframes orbitSweep {
          0%   { opacity: 0.8; transform: translate(-50%, -50%) rotateX(65deg) rotateZ(0deg); }
          100% { opacity: 0;   transform: translate(-50%, -50%) rotateX(65deg) rotateZ(360deg); }
        }

        /* U — signal fill from bottom */
        @keyframes signalFill {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* T1 — satellite arms extend */
        @keyframes satelliteArms {
          0%   { opacity: 0; transform: scaleX(0.1); }
          50%  { opacity: 1; transform: scaleX(1.1); }
          100% { opacity: 1; transform: scaleX(1); }
        }

        /* UFO: drops from above into dot position */
        @keyframes ufoDescend {
          0%   { opacity: 0; transform: translateY(-180px); }
          60%  { opacity: 1; transform: translateY(4px); }
          80%  { transform: translateY(-2px); }
          100% { opacity: 1; transform: translateY(0px); }
        }

        /* UFO: idle vertical bob */
        @keyframes ufoHoverBob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }

        /* UFO: idle horizontal sway */
        @keyframes ufoHoverSway {
          0%, 100% { margin-left: 0px; }
          33%       { margin-left: -3px; }
          66%       { margin-left: 3px; }
        }

        /* UFO disc glow pulse */
        @keyframes discGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(200,169,110,0.4); }
          50%       { box-shadow: 0 0 22px rgba(200,169,110,0.9), 0 0 40px rgba(200,169,110,0.2); }
        }

        /* UFO lights blink */
        @keyframes blinkLight {
          0%, 85%, 100% { opacity: 1; }
          88%, 97%       { opacity: 0.1; }
        }

        /* Tractor beam pulse */
        @keyframes beamPulse {
          0%   { opacity: 0.5; }
          50%  { opacity: 0.8; }
          100% { opacity: 0.5; }
        }

        /* T2 — reticle contract */
        @keyframes reticleContract {
          0%   { opacity: 0.8; transform: translate(-50%, -50%) scale(2); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(0.9); }
        }

        /* T2 — target lock-in */
        @keyframes targetLock {
          0%   { opacity: 0; transform: scale(1.3); filter: blur(3px); }
          70%  { opacity: 1; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }

        /* UFO gentle float bob ─────────────────── */
        @keyframes float {
          0%, 100% { transform: translateY(-3px); }
          50%       { transform: translateY(3px); }
        }

        /* Green cognition beam pulse ───────────── */
        @keyframes beamGlow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }

        /* Star twinkle — fast (bright, quick blink) */
        @keyframes twinkleFast {
          0%, 100% { opacity: 0;    transform: scale(0.8); }
          40%, 60% { opacity: 0.75; transform: scale(1.2); }
        }

        /* Star twinkle — medium */
        @keyframes twinkleMed {
          0%, 100% { opacity: 0;   transform: scale(0.9); }
          45%, 55% { opacity: 0.5; transform: scale(1.1); }
        }

        /* Star twinkle — slow (dim, deep-space) */
        @keyframes twinkleSlow {
          0%, 100% { opacity: 0;    }
          40%, 60% { opacity: 0.35; }
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
