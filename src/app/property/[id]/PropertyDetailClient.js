"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import "./property.css";

// ═══════════════════════════════════════════════════
// LOCAL DATA SLOTS — temporary database
// Replace with a CMS/API call later by swapping this
// object with a server fetch or props from page.js
// ═══════════════════════════════════════════════════
const propertyData = {
  // Hero
  title:             "Batasan Hills House & Lot",
  location:          "Batasan Hills, Quezon City",
  hook:              "Positioned within one of QC's fastest-evolving residential corridors.",
  city:              "Quezon City",

  // Specs
  property_type:     "House & Lot",
  tenure:            "For Sale",
  year_built:        "2018",
  furnishing:        "Bare",
  beds:              3,
  baths:             2,
  floor_sqm:         120,
  lot_sqm:           180,
  parking:           1,
  floors:            "2 Storey",

  // Comfort ratings (out of 10)
  comfort_level:     8.5,
  natural_light:     9.0,
  privacy:           8.0,
  space_feel:        8.7,

  // Descriptive fields
  noise_level_text:         "Low / Minimal",
  ventilation:              "Excellent cross-ventilation",
  ceiling_height_text:      "3.2 meters",
  outdoor_description:      "Spacious multi-use courtyard area",
  street_type:              "Concrete subdivision road",
  lifestyle_vibe:           "Quiet & Family-Oriented",
  best_for:                 "Families · WFH Professionals · Long-term Investors",

  // Risk / scores
  flood_risk_score:  2,    // low risk
  convenience_score: 7.5,

  // Verdicts & meta
  title_status:      "TCT — Free & Clear",
  scoutit_verdict:   "Highly Recommended — AAA Asset Tier",
  accordion_1_title: "Home Feel & Comfort",
  accordion_1_rating:"High",
  accordion_2_title: "Space Usability",
  accordion_2_rating:"Efficient",
  accordion_3_title: "Story of This Space",
  accordion_3_rating:"",
  accordion_3_text:  "Built in 2018 by a family that outgrew the space, this property has never been rented — preserving its material quality and finish integrity across all rooms.",

  broker_name:       "Miguel Torres, REB",

  // Photos — bright premium architectural hero images
  photos: [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
  ],

  // Where To proximity data
  whereTo: [
    { category: "Education",  name: "University of the Philippines Diliman",  distance: "8 min drive" },
    { category: "Education",  name: "Batasan Hills National HS",               distance: "4 min walk"  },
    { category: "Healthcare", name: "Quirino Memorial Medical Center",          distance: "12 min drive"},
    { category: "Healthcare", name: "St. Luke's QC",                           distance: "18 min drive"},
    { category: "Essentials", name: "SM Fairview",                             distance: "9 min drive" },
    { category: "Essentials", name: "Puregold Batasan",                        distance: "4 min drive" },
    { category: "Transit",    name: "MRT-7 North Ave (Phase 1)",               distance: "12 min drive"},
    { category: "Transit",    name: "Commonwealth jeepney stops",              distance: "3 min walk"  },
  ],

  // Best For pills
  bestForTags: ["Families", "WFH Professionals", "Long-term Hold"],
};

// ═══════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════
function floodText(score) {
  if (score <= 1) return "No flood history";
  if (score <= 3) return "Minimal risk";
  if (score <= 5) return "Low risk";
  if (score <= 7) return "Moderate risk";
  if (score <= 9) return "High risk";
  return "Extremely dangerous";
}

function ratingTagClass(val) {
  const v = String(val || "").toLowerCase();
  if (["high", "efficient", "excellent", "safe", "strong", "good value", "convenient"].includes(v))
    return "tag-green";
  if (["moderate", "medium", "fair"].includes(v)) return "tag-yellow";
  if (["low", "poor", "high risk"].includes(v))   return "tag-red";
  return "tag-neutral";
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function PropertyDetailClient({ slug }) {
  // ── Interactive UI states ──────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoMode,         setPhotoMode]         = useState("natural");
  const [activeTab,         setActiveTab]         = useState("space");
  const [menuOpen,   setMenuOpen]   = useState(false);

  // Per-panel accordion state (independent per section)
  const [accSpace,    setAccSpace]    = useState(null);
  const [accLocation, setAccLocation] = useState(null);
  const [accLife,     setAccLife]     = useState(null);
  const [accUniverse, setAccUniverse] = useState(null);
  const [accMove,     setAccMove]     = useState(null);

  // ── Drag-to-scroll refs ───────────────────────
  const scrollRef    = useRef(null);
  const isDragging   = useRef(false);
  const startX       = useRef(0);
  const scrollStart  = useRef(0);
  const menuRef      = useRef(null);

  // Close platform menu on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ── Derived values from local data slots ──────
  const d           = propertyData;   // short alias
  const photos      = d.photos;
  const floodRiskText  = floodText(d.flood_risk_score);
  const floodRiskScore = `Score: ${d.flood_risk_score}/10`;
  const convScoreText  = `${d.convenience_score} / 10`;
  const brokerInitials = d.broker_name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  const [currentReaction, setCurrentReaction] = useState(null);
  const [reactionConfirmed, setReactionConfirmed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scoutit_reactions");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const match = parsed.find(item => item.property_id === slug || item.property_id === "batasan-hills");
          if (match) {
            setCurrentReaction(match.reaction_type);
          }
        }
      }
    } catch (e) {}
  }, [slug]);

  const handleReaction = (type) => {
    try {
      const raw = localStorage.getItem("scoutit_reactions") || "[]";
      let parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) parsed = [];

      const index = parsed.findIndex(item => item.property_id === slug || item.property_id === "batasan-hills");

      if (currentReaction === type) {
        if (index > -1) {
          parsed.splice(index, 1);
        }
        setCurrentReaction(null);
        setReactionConfirmed(false);
      } else {
        const newItem = {
          property_id: slug || "batasan-hills",
          property_title: d.title,
          city: d.city,
          category: d.property_type,
          reaction_type: type,
          timestamp: Date.now()
        };

        if (index > -1) {
          parsed[index] = newItem;
        } else {
          parsed.push(newItem);
        }
        setCurrentReaction(type);
        setReactionConfirmed(true);
        setTimeout(() => setReactionConfirmed(false), 3000);
      }
      localStorage.setItem("scoutit_reactions", JSON.stringify(parsed));
    } catch (e) {}
  };

  // ── Photo navigation ──────────────────────────
  const goPrev = () => setCurrentImageIndex(i => (i === 0 ? photos.length - 1 : i - 1));
  const goNext = () => setCurrentImageIndex(i => (i + 1) % photos.length);

  // ── Drag-to-scroll handlers ───────────────────
  const onDragStart = (e) => {
    isDragging.current  = true;
    startX.current      = e.pageX;
    scrollStart.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
  };
  const onDragEnd = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };
  const onDragMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const delta = (e.pageX - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollStart.current - delta;
  };

  // ── Accordion toggle ──────────────────────────
  const tog = (setter, current, key) => setter(current === key ? null : key);

  // ── Where To renderer ─────────────────────────
  const renderWhereTo = () => {
    const groups = {};
    d.whereTo.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return Object.entries(groups).map(([cat, items]) => (
      <div className="where-category" key={cat}>
        <div className="where-cat-label">{cat}</div>
        {items.map((item, idx) => (
          <div className="where-item" key={idx}>
            <span className="where-name">{item.name}</span>
            <span className="where-dist">{item.distance}</span>
          </div>
        ))}
      </div>
    ));
  };

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <>
      <div className="grain" />

      <div className="page">

        {/* ════ ZONE 1 – PHOTO ════ */}
        <div className="zone-photo" id="photoZone">

          {photos.map((url, i) => (
            <div
              key={i}
              className={`photo-slide ${photoMode} ${currentImageIndex === i ? "active" : ""}`}
              style={{ backgroundImage: `url(${url})` }}
            />
          ))}

          <div className="light-shaft" />

          <div className="photo-decor">
            <svg viewBox="0 0 1000 320" preserveAspectRatio="xMidYMid slice">
              <rect x="680" y="30" width="200" height="150" fill="none" stroke="rgba(200,169,110,0.1)" strokeWidth="1"/>
              <line x1="780" y1="30" x2="780" y2="180" stroke="rgba(200,169,110,0.07)" strokeWidth="0.5"/>
              <line x1="680" y1="105" x2="880" y2="105" stroke="rgba(200,169,110,0.07)" strokeWidth="0.5"/>
              <rect x="100" y="240" width="320" height="58" rx="3" fill="rgba(25,20,12,0.75)"/>
              <rect x="118" y="222" width="285" height="32" rx="3" fill="rgba(30,24,14,0.65)"/>
              <rect x="100" y="222" width="26"  height="76" rx="2" fill="rgba(28,22,13,0.7)"/>
              <rect x="392" y="222" width="26"  height="76" rx="2" fill="rgba(28,22,13,0.7)"/>
              <rect x="470" y="264" width="145" height="28" rx="2" fill="rgba(35,27,15,0.55)"/>
              <rect x="875" y="120" width="3"   height="140" fill="rgba(40,32,18,0.45)"/>
              <ellipse cx="876" cy="120" rx="19" ry="7" fill="rgba(40,32,18,0.35)"/>
            </svg>
          </div>

          <div className="photo-fade-top" />
          <div className="photo-fade-bottom" />

          {/* Hero Intel */}
          <div className="hero-intel">
            <p className="hero-label">ScoutIt &middot; Residential Briefing</p>
            <h1 className="hero-title">{d.title}</h1>
            <p className="hero-location">{d.location}</p>
            <p className="hero-hook">{d.hook}</p>
          </div>

          {/* Platform Nav */}
          <nav className="platform-nav" ref={menuRef}>
            <a href="/" className="platform-home-btn">Home</a>
            <button
              className="platform-menu-btn"
              type="button"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 4h12M2 8h12M2 12h12"/>
              </svg>
            </button>
            <div className={`platform-dropdown ${menuOpen ? "open" : ""}`}>
              <div className="dropdown-brand">ScoutIt</div>
              <a href="/intel">News</a>
              <a href="/brokers">Brokers</a>
              <a href="/about">About</a>
            </div>
          </nav>

          {/* Arrows */}
          <div className="photo-arrow left"  onClick={goPrev}>
            <svg className="arrow-svg" viewBox="0 0 14 14"><polyline points="9,2 4,7 9,12"/></svg>
          </div>
          <div className="photo-arrow right" onClick={goNext}>
            <svg className="arrow-svg" viewBox="0 0 14 14"><polyline points="5,2 10,7 5,12"/></svg>
          </div>

          {/* Controls */}
          <div className="photo-controls">
            <div className="photo-controls-left">
              <div className="photo-toggle">
                <button
                  className={`toggle-btn ${photoMode === "natural"  ? "active" : "off"}`}
                  onClick={() => setPhotoMode("natural")}
                >Natural</button>
                <button
                  className={`toggle-btn ${photoMode === "enhanced" ? "active" : "off"}`}
                  onClick={() => setPhotoMode("enhanced")}
                >Enhanced</button>
              </div>
              <div className="photo-dots">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`dot ${currentImageIndex === i ? "active" : ""}`}
                    onClick={() => setCurrentImageIndex(i)}
                  />
                ))}
              </div>
            </div>
            <div className="photo-count">{currentImageIndex + 1} / {photos.length}</div>
          </div>

        </div>{/* /zone-photo */}

        {/* ════ ZONE 2 – NAV (drag-to-scroll) ════ */}
        <div className="zone-nav">
          <div
            className="nav-inner"
            ref={scrollRef}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab" }}
            onMouseDown={onDragStart}
            onMouseLeave={onDragEnd}
            onMouseUp={onDragEnd}
            onMouseMove={onDragMove}
          >

            {/* ── Core tabs ── */}
            {[
              { id: "space",    label: "The Space",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 9h7M6.5 12h4.5M6.5 6h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
              { id: "location", label: "Location",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.5 5 11 5 11s5-6.5 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/></svg> },
              { id: "life",     label: "Life Here",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><path d="M10 3C8 3 5 5 5 8c0 2 1 3.5 2.5 4.5L10 17l2.5-4.5C14 11.5 15 10 15 8c0-3-3-5-5-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="8" r="1.5" fill="currentColor" stroke="none"/></svg> },
              { id: "whereto",  label: "Where To?",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
              { id: "buildplans", label: "Build Plans",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h8M6 9h8M6 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M13 14l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="12" y="12" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.1"/></svg> },
              { id: "hiddenintel", label: "Hidden Intel",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><path d="M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6-3.5-6-8-6z" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.4"/></svg> },
            ].map((tab, idx, arr) => (
              <span key={tab.id} style={{display:"contents"}}>
                <div
                  className={`nav-chapter ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span className="chapter-label">{tab.label}</span>
                </div>
                {idx < arr.length - 1 && <div className="nav-divider" />}
              </span>
            ))}

            <div className="nav-section-divider" />

            {/* Units */}
            <div
              className={`nav-chapter ${activeTab === "units" ? "active" : ""}`}
              onClick={() => setActiveTab("units")}
            >
              <svg className="chapter-icon" viewBox="0 0 20 20" fill="none">
                <rect x="3"  y="3"  width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="11" y="3"  width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="3"  y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              <span className="chapter-label">Units</span>
            </div>

            <div className="nav-divider" />

            {/* Universe */}
            <div
              className={`nav-chapter ${activeTab === "universe" ? "active" : ""}`}
              onClick={() => setActiveTab("universe")}
            >
              <svg className="chapter-icon" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="6" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 6V5a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="10" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              <span className="chapter-label">Universe</span>
            </div>

            <div className="nav-divider" />

            {/* Expansion Node */}
            <div
              className={`nav-chapter nav-chapter--expansion ${activeTab === "expansion" ? "active" : ""}`}
              onClick={() => setActiveTab("expansion")}
            >
              <svg className="chapter-icon" viewBox="0 0 20 20" fill="none">
                <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fill="currentColor" fontFamily="Georgia, serif" fontStyle="italic">?</text>
              </svg>
              <span className="chapter-label">Expansion</span>
            </div>

            <div className="nav-divider" />

            {/* Your Move — CTA */}
            <div
              className={`nav-chapter nav-chapter--cta ${activeTab === "yourmove" ? "active" : ""}`}
              onClick={() => setActiveTab("yourmove")}
            >
              <svg className="chapter-icon" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h10M11 7l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="chapter-label">Your Move</span>
            </div>

          </div>{/* /nav-inner */}

        </div>{/* /zone-nav */}

        {/* ════ ZONE 3 – STORY ════ */}
        <div className="zone-story">

          {/* ── THE SPACE ── */}
          <div className={`chapter-panel ${activeTab === "space" ? "active" : ""}`} id="panel-space">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">The Space</span></div>
              <div className="display-heading">Where <em>light</em><br/>finds its home</div>

              <div className="spec-pills">
                {[
                  { val: d.beds,      label: "Bedrooms",  icon: <><path d="M1 9V5a2 2 0 012-2h8a2 2 0 012 2v4" strokeLinecap="round"/><path d="M1 9h12" strokeLinecap="round"/></> },
                  { val: d.baths,     label: "Bathrooms", icon: <><path d="M2 8h10M2 8V5a2 2 0 012-2v0a1 1 0 011 1v4" strokeLinecap="round"/><path d="M12 8v3" strokeLinecap="round"/></> },
                  { val: d.floor_sqm, label: "sqm floor", icon: <><rect x="2" y="2" width="10" height="10" rx="1"/><path d="M5 2v10M9 2v10M2 5h10M2 9h10" strokeLinecap="round"/></> },
                  { val: d.parking,   label: "Parking",   icon: <><rect x="1" y="6" width="12" height="6" rx="1"/><path d="M3 6V4a3 3 0 016 0v2" strokeLinecap="round"/></> },
                  { val: d.lot_sqm,   label: "Lot Area",  icon: <><rect x="2" y="4" width="10" height="8" rx="1"/><path d="M2 8h10" strokeLinecap="round"/></> },
                ].map(pill => (
                  <div className="spec-pill" key={pill.label}>
                    <div className="pill-icon-wrap">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">{pill.icon}</svg>
                    </div>
                    <div>
                      <div className="pill-val">{pill.val}</div>
                      <div className="pill-label">{pill.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="accordion">

                {/* Accordion 1 — Home Feel & Comfort */}
                <div className={`accordion-item ${accSpace === "comfort" ? "open" : ""}`}>
                  <div className="accordion-header" onClick={() => tog(setAccSpace, accSpace, "comfort")}>
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <path d="M1 9V5.5C1 4.12 2.12 3 3.5 3h7C11.88 3 13 4.12 13 5.5V9"/>
                          <path d="M1 9h12"/><path d="M3 9v2M11 9v2"/>
                        </svg>
                      </div>
                      <div>
                        <div className="accordion-title">{d.accordion_1_title}</div>
                        <div className="accordion-subtitle">Can I live here comfortably?</div>
                      </div>
                    </div>
                    <div className="accordion-right">
                      <span className={`accordion-tag ${ratingTagClass(d.accordion_1_rating)}`}>{d.accordion_1_rating}</span>
                      <div className="accordion-chevron"/>
                    </div>
                  </div>
                  <div className="accordion-body">
                    <div className="accordion-content">
                      <div className="rating-bar-wrap">
                        {[
                          { label: "Comfort level", val: d.comfort_level,  green: false },
                          { label: "Natural light",  val: d.natural_light,  green: false },
                          { label: "Privacy",        val: d.privacy,        green: true  },
                          { label: "Space feel",     val: d.space_feel,     green: false },
                        ].map(r => (
                          <div className="rating-row" key={r.label}>
                            <span className="rating-label">{r.label}</span>
                            <div className="rating-bar">
                              <div className={`rating-fill ${r.green ? "green" : ""}`} style={{width: `${r.val * 10}%`}}/>
                            </div>
                            <span className="rating-val">{r.val.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="detail-row"><span className="detail-key">Noise level</span><span className="detail-val green">{d.noise_level_text}</span></div>
                      <div className="detail-row"><span className="detail-key">Ventilation</span><span className="detail-val">{d.ventilation}</span></div>
                      <div className="detail-row"><span className="detail-key">Ceiling height</span><span className="detail-val">{d.ceiling_height_text}</span></div>
                    </div>
                  </div>
                </div>

                {/* Accordion 2 — Space Usability */}
                <div className={`accordion-item ${accSpace === "efficiency" ? "open" : ""}`}>
                  <div className="accordion-header" onClick={() => tog(setAccSpace, accSpace, "efficiency")}>
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <rect x="2" y="2" width="10" height="10" rx="1"/>
                          <path d="M5 2v10M2 6h3M2 9h3M9 2v4M9 8v4"/>
                        </svg>
                      </div>
                      <div>
                        <div className="accordion-title">{d.accordion_2_title}</div>
                        <div className="accordion-subtitle">Layout &amp; room efficiency</div>
                      </div>
                    </div>
                    <div className="accordion-right">
                      <span className={`accordion-tag ${ratingTagClass(d.accordion_2_rating)}`}>{d.accordion_2_rating}</span>
                      <div className="accordion-chevron"/>
                    </div>
                  </div>
                  <div className="accordion-body">
                    <div className="accordion-content">
                      <div className="detail-row"><span className="detail-key">Floor area</span><span className="detail-val">{d.floor_sqm} sqm</span></div>
                      <div className="detail-row"><span className="detail-key">Lot area</span><span className="detail-val">{d.lot_sqm} sqm</span></div>
                      <div className="detail-row"><span className="detail-key">Outdoor usable</span><span className="detail-val green">{d.outdoor_description}</span></div>
                      <div className="detail-row"><span className="detail-key">Furnishing</span><span className="detail-val">{d.furnishing}</span></div>
                      <div className="detail-row"><span className="detail-key">Floors</span><span className="detail-val">{d.floors}</span></div>
                    </div>
                  </div>
                </div>

                {/* Accordion 3 — Story of This Space */}
                <div className={`accordion-item ${accSpace === "story" ? "open" : ""}`}>
                  <div className="accordion-header" onClick={() => tog(setAccSpace, accSpace, "story")}>
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <path d="M2 3h10M2 6h8M2 9h6M2 12h4"/>
                        </svg>
                      </div>
                      <div>
                        <div className="accordion-title">{d.accordion_3_title}</div>
                        <div className="accordion-subtitle">Feel before figures</div>
                      </div>
                    </div>
                    <div className="accordion-right">
                      <span className="accordion-tag tag-neutral">{d.accordion_3_rating}</span>
                      <div className="accordion-chevron"/>
                    </div>
                  </div>
                  <div className="accordion-body">
                    <div className="accordion-content">
                      <p className="story-text">{d.accordion_3_text}</p>
                    </div>
                  </div>
                </div>

              </div>{/* /accordion */}
            </div>{/* /panel-content */}

            {/* Sidebar — The Space */}
            <div className="panel-sidebar">
              <div className="sidebar-block">
                <div className="sidebar-accent-line"/>
                <div className="sidebar-label">Location</div>
                <div className="sidebar-value">{d.city}</div>
                <div className="sidebar-sub">{d.location}</div>
              </div>
              <div className="mini-map">
                <div className="map-road-h" style={{top:"33%"}}/><div className="map-road-h" style={{top:"55%"}}/><div className="map-road-h" style={{top:"75%"}}/>
                <div className="map-road-v" style={{left:"30%"}}/><div className="map-road-v" style={{left:"55%"}}/><div className="map-road-v" style={{left:"78%"}}/>
                <div className="map-pulse"/><div className="map-pin"/>
              </div>
              <div className="sidebar-block"><div className="sidebar-label">Type</div><div className="sidebar-value">{d.property_type}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Tenure</div><div className="sidebar-value">{d.tenure}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Year Built</div><div className="sidebar-value">{d.year_built}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Furnishing</div><div className="sidebar-value">{d.furnishing}</div></div>
            </div>
          </div>{/* /panel-space */}

          {/* ── LOCATION ── */}
          <div className={`chapter-panel ${activeTab === "location" ? "active" : ""}`} id="panel-location">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">The Location</span></div>
              <div className="display-heading">A city within<br/>a <em>neighborhood</em></div>
              <div className="location-grid">
                {[
                  { title: d.city,               desc: "Established residential enclave in NCR." },
                  { title: "Commonwealth Corridor", desc: "Direct route to Fairview, Philcoa, and EDSA." },
                  { title: "Commute Access",       desc: "MRT-7 North Ave terminus within 12 mins. Multiple jeepney routes." },
                  { title: "Area Growth",          desc: "Property values trending upward since 2022. Active development nearby." },
                ].map(c => (
                  <div className="location-card" key={c.title}>
                    <div className="location-card-icon">
                      <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                        <path d="M6.5 1C4.01 1 2 3.01 2 5.5c0 3.5 4.5 7.5 4.5 7.5S11 9 11 5.5C11 3.01 8.99 1 6.5 1z"/>
                        <circle cx="6.5" cy="5.5" r="1.5"/>
                      </svg>
                    </div>
                    <div className="location-card-title">{c.title}</div>
                    <div className="location-card-desc">{c.desc}</div>
                  </div>
                ))}
              </div>

              <div className="accordion">
                <div className={`accordion-item ${accLocation === "daily" ? "open" : ""}`}>
                  <div className="accordion-header" onClick={() => tog(setAccLocation, accLocation, "daily")}>
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M7 1v2M7 11v2M1 7h2M11 7h2M3 3l1.4 1.4M9.6 9.6L11 11M3 11l1.4-1.4M9.6 4.4L11 3"/></svg></div>
                      <div><div className="accordion-title">Daily Life Reality</div><div className="accordion-subtitle">Is my daily routine easy here?</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-green">Convenient</span><div className="accordion-chevron"/></div>
                  </div>
                  <div className="accordion-body"><div className="accordion-content">
                    <div className="detail-row"><span className="detail-key">Grocery access</span><span className="detail-val green">4 min drive</span></div>
                    <div className="detail-row"><span className="detail-key">Nearest hospital</span><span className="detail-val">12 min · QMMC</span></div>
                    <div className="detail-row"><span className="detail-key">Schools nearby</span><span className="detail-val">3 within 10 min</span></div>
                    <div className="detail-row"><span className="detail-key">Commute to CBD</span><span className="detail-val yellow">35–45 min</span></div>
                    <div className="detail-row"><span className="detail-key">Public transport</span><span className="detail-val green">Good coverage</span></div>
                  </div></div>
                </div>

                <div className={`accordion-item ${accLocation === "safety" ? "open" : ""}`}>
                  <div className="accordion-header" onClick={() => tog(setAccLocation, accLocation, "safety")}>
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M7 1L2 3.5v4C2 10.5 4.5 12.5 7 13c2.5-.5 5-2.5 5-5.5v-4L7 1z"/></svg></div>
                      <div><div className="accordion-title">Safety Perception</div><div className="accordion-subtitle">Day &amp; night security feel</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-green">Safe</span><div className="accordion-chevron"/></div>
                  </div>
                  <div className="accordion-body"><div className="accordion-content">
                    <div className="rating-bar-wrap">
                      <div className="rating-row"><span className="rating-label">Daytime safety</span><div className="rating-bar"><div className="rating-fill green" style={{width:"88%"}}/></div><span className="rating-val">8.8</span></div>
                      <div className="rating-row"><span className="rating-label">Night safety</span><div className="rating-bar"><div className="rating-fill" style={{width:"72%"}}/></div><span className="rating-val">7.2</span></div>
                    </div>
                    <div className="detail-row"><span className="detail-key">Street lighting</span><span className="detail-val green">Good</span></div>
                    <div className="detail-row"><span className="detail-key">Area type</span><span className="detail-val">Established subdivision</span></div>
                    <div className="detail-row"><span className="detail-key">Street type</span><span className="detail-val">{d.street_type}</span></div>
                  </div></div>
                </div>
              </div>
            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">District</div><div className="sidebar-value">{d.city}</div><div className="sidebar-sub">NCR</div></div>
              <div className="mini-map">
                <div className="map-road-h" style={{top:"33%"}}/><div className="map-road-h" style={{top:"55%"}}/>
                <div className="map-road-v" style={{left:"30%"}}/><div className="map-road-v" style={{left:"60%"}}/>
                <div className="map-pulse"/><div className="map-pin"/>
              </div>
              <div className="sidebar-block"><div className="sidebar-label">Street type</div><div className="sidebar-value">{d.street_type}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Flood risk</div><div className="sidebar-value">{floodRiskText}</div><div className="sidebar-sub">{floodRiskScore}</div></div>
            </div>
          </div>{/* /panel-location */}

          {/* ── LIFE HERE ── */}
          <div className={`chapter-panel ${activeTab === "life" ? "active" : ""}`} id="panel-life">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">The Life Here</span></div>
              <div className="display-heading">Quiet mornings,<br/><em>real</em> evenings</div>
              <div className="life-stat-row">
                <div className="life-stat"><div className="life-stat-number">6<span>am</span></div><div className="life-stat-label">When light hits the kitchen. No alarm needed.</div></div>
                <div className="life-stat"><div className="life-stat-number">3<span>min</span></div><div className="life-stat-label">Walk to sari-sari and morning pan de sal.</div></div>
                <div className="life-stat"><div className="life-stat-number">0</div><div className="life-stat-label">Condo rules. No HOA telling you what to do.</div></div>
              </div>
              <div className="accordion">
                <div className={`accordion-item ${accLife === "vibe" ? "open" : ""}`}>
                  <div className="accordion-header" onClick={() => tog(setAccLife, accLife, "vibe")}>
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M5 8.5s.8 1.5 2 1.5 2-1.5 2-1.5M5.5 5.5h.01M8.5 5.5h.01"/></svg></div>
                      <div><div className="accordion-title">Lifestyle Vibe</div><div className="accordion-subtitle">Community type &amp; atmosphere</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-neutral">{d.lifestyle_vibe}</span><div className="accordion-chevron"/></div>
                  </div>
                  <div className="accordion-body"><div className="accordion-content">
                    <div className="detail-row"><span className="detail-key">Lifestyle pace</span><span className="detail-val">{d.lifestyle_vibe}</span></div>
                    <div className="detail-row"><span className="detail-key">Best for</span><span className="detail-val">{d.best_for}</span></div>
                    <div className="detail-row"><span className="detail-key">WFH suitability</span><span className="detail-val green">Excellent</span></div>
                    <div className="detail-row"><span className="detail-key">Street noise</span><span className="detail-val">{d.noise_level_text}</span></div>
                    <div className="detail-row"><span className="detail-key">Outdoor space</span><span className="detail-val">{d.outdoor_description}</span></div>
                  </div></div>
                </div>

                <div className={`accordion-item ${accLife === "convenience" ? "open" : ""}`}>
                  <div className="accordion-header" onClick={() => tog(setAccLife, accLife, "convenience")}>
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 3h12M1 7h12M1 11h8"/></svg></div>
                      <div><div className="accordion-title">Convenience Score</div><div className="accordion-subtitle">Errands &amp; daily needs within reach</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-neutral">{convScoreText}</span><div className="accordion-chevron"/></div>
                  </div>
                  <div className="accordion-body"><div className="accordion-content">
                    <div className="rating-bar-wrap">
                      <div className="rating-row"><span className="rating-label">Food access</span><div className="rating-bar"><div className="rating-fill green" style={{width:"85%"}}/></div><span className="rating-val">8.5</span></div>
                      <div className="rating-row"><span className="rating-label">Shopping</span><div className="rating-bar"><div className="rating-fill" style={{width:"75%"}}/></div><span className="rating-val">7.5</span></div>
                      <div className="rating-row"><span className="rating-label">Healthcare</span><div className="rating-bar"><div className="rating-fill" style={{width:"70%"}}/></div><span className="rating-val">7.0</span></div>
                      <div className="rating-row"><span className="rating-label">Recreation</span><div className="rating-bar"><div className="rating-fill" style={{width:"65%"}}/></div><span className="rating-val">6.5</span></div>
                    </div>
                  </div></div>
                </div>
              </div>
            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Vibe</div><div className="sidebar-value">{d.lifestyle_vibe}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Best for</div><div className="sidebar-value">{d.best_for}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Street type</div><div className="sidebar-value">{d.street_type}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Outdoor</div><div className="sidebar-value">{d.outdoor_description}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Convenience</div><div className="sidebar-value" style={{color:"var(--green)"}}>{convScoreText}</div></div>
            </div>
          </div>{/* /panel-life */}

          {/* ── WHERE TO? ── */}
          <div className={`chapter-panel ${activeTab === "whereto" ? "active" : ""}`} id="panel-whereto">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">Where To?</span></div>
              <div className="display-heading">Everything<br/>within <em>reach</em></div>
              <div id="where-to-content">{renderWhereTo()}</div>
            </div>
            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Nearest mall</div><div className="sidebar-value">SM Fairview</div><div className="sidebar-sub">9 min drive</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Nearest hospital</div><div className="sidebar-value">QMMC</div><div className="sidebar-sub">12 min drive</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Public transit</div><div className="sidebar-value">Good</div><div className="sidebar-sub">Multiple routes</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Walkability</div><div className="sidebar-value">Moderate</div><div className="sidebar-sub">Essentials 10 min</div></div>
            </div>
          </div>{/* /panel-whereto */}

          {/* ── UNIVERSE ── */}
          <div className={`chapter-panel ${activeTab === "universe" ? "active" : ""}`} id="panel-universe">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">Property Universe</span></div>
              <div className="display-heading">The full<br/><em>picture</em></div>
              <table className="universe-table" style={{marginTop: "16px"}}><tbody>
                <tr><td>Property type</td><td>{d.property_type}</td></tr>
                <tr><td>Tenure</td><td>{d.tenure}</td></tr>
                <tr><td>Floor area</td><td>{d.floor_sqm} sqm</td></tr>
                <tr><td>Lot area</td><td>{d.lot_sqm} sqm</td></tr>
                <tr><td>Bedrooms</td><td>{d.beds}</td></tr>
                <tr><td>Bathrooms</td><td>{d.baths}</td></tr>
                <tr><td>Parking slots</td><td>{d.parking} covered</td></tr>
                <tr><td>Furnishing</td><td>{d.furnishing}</td></tr>
                <tr><td>Year built</td><td>{d.year_built}</td></tr>
                <tr><td>Title status</td><td>{d.title_status}</td></tr>
              </tbody></table>

              <div className="accordion">
                <div className={`accordion-item ${accUniverse === "resale" ? "open" : ""}`}>
                  <div className="accordion-header" onClick={() => tog(setAccUniverse, accUniverse, "resale")}>
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,9 4,5 7,7 10,3 13,5"/><path d="M13 3h-3v3"/></svg></div>
                      <div><div className="accordion-title">Resale &amp; Rental Potential</div><div className="accordion-subtitle">Future value outlook</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-green">Strong</span><div className="accordion-chevron"/></div>
                  </div>
                  <div className="accordion-body"><div className="accordion-content">
                    <div className="detail-row"><span className="detail-key">Resale potential</span><span className="detail-val green">High · Growing area</span></div>
                    <div className="detail-row"><span className="detail-key">Rental yield est.</span><span className="detail-val">Contact broker for details</span></div>
                    <div className="detail-row"><span className="detail-key">Monthly rent est.</span><span className="detail-val">Contact broker for details</span></div>
                    <div className="detail-row"><span className="detail-key">MRT-7 impact</span><span className="detail-val green">Positive outlook</span></div>
                    <div className="detail-row"><span className="detail-key">Area trend</span><span className="detail-val green">Appreciating since 2022</span></div>
                  </div></div>
                </div>
              </div>

              <div className="verdict-block">
                <div className="verdict-header"><div className="verdict-dot"/><div className="verdict-title">Space Intelligence Verdict</div></div>
                <p className="verdict-text">{d.scoutit_verdict}</p>
                <div className="verdict-score">
                  {d.bestForTags.map((t, i) => <span key={i} className="verdict-pill">{t}</span>)}
                </div>
              </div>
            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Title status</div><div className="sidebar-value">{d.title_status}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Verdict</div><div className="sidebar-value" style={{color:"var(--green)"}}>{d.scoutit_verdict}</div></div>
            </div>
          </div>{/* /panel-universe */}

          {/* ── YOUR MOVE ── */}
          <div className={`chapter-panel ${activeTab === "yourmove" ? "active" : ""}`} id="panel-yourmove">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">Your Move</span></div>
              <h2 className="display-heading" style={{fontFamily:"var(--font-display)", fontWeight: 300}}>
                When you're ready, we'll make the introduction.
              </h2>
              
              <div className="reactions-container" style={{marginTop:"16px", display:"flex", flexDirection:"column", gap:"10px"}}>
                <p className="sidebar-label">How does this space make you feel?</p>
                <div className="reaction-buttons-grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"}}>
                  {["Save", "Inspired Me", "Potential Fit", "Interested"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleReaction(type)}
                      className={`reaction-action-btn ${currentReaction === type ? "active" : ""}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {reactionConfirmed && (
                  <p style={{fontSize:"12px", color:"var(--accent)", fontStyle:"italic", marginTop:"4px"}}>
                    Saved to Your Board.
                  </p>
                )}
              </div>

              <div className="where-category" style={{marginTop:"16px"}}>
                <div className="where-cat-label">Assigned Representative</div>
                <div className="broker-card">
                  <div className="broker-avatar">{brokerInitials}</div>
                  <div className="broker-info">
                    <div className="broker-name-el">{d.broker_name}</div>
                    <div className="broker-meta">Direct Listing</div>
                    <div className="broker-rating" style={{color: "var(--green)"}}>Verified broker</div>
                  </div>
                </div>
              </div>

              <Link href={`/property/${slug || "batasan-hills"}/brokers`} className="move-cta" style={{textDecoration: "none", marginTop: "16px"}}>
                Connect with an Authorized Broker →
              </Link>

              <p style={{fontSize:"10px", color:"var(--text-muted)", lineHeight:"1.5", marginTop:"16px"}}>
                ScoutIt is a spatial intelligence archive. In compliance with R.A. 9646, all site walks, direct inquiries, and purchase offers are facilitated exclusively by licensed, authorized real estate brokers.
              </p>
            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Acquisition</div><div className="sidebar-value">{d.tenure}</div><div className="sidebar-sub">{d.title_status}</div></div>
              <div className="sidebar-block"><div className="sidebar-label">ScoutIt verdict</div><div className="sidebar-value" style={{color:"var(--green)"}}>{d.scoutit_verdict}</div></div>
            </div>
          </div>{/* /panel-yourmove */}

          {/* ── UNITS ── */}
          <div className={`chapter-panel ${activeTab === "units" ? "active" : ""}`} id="panel-units">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">Units</span></div>
              <div className="display-heading">Every<br/><em>space</em> detailed</div>
              <div className="units-z3-list">
                {[
                  { name:"Balcony",    specs:["45 sqm","Open Air","360° View","Safe with railings","Tiled flooring"] },
                  { name:"Room 1",     specs:["28 sqm","3 Windows","1 Aircon","1 Queen Size Bed","3.2m ceiling"] },
                  { name:"Room 2",     specs:["22 sqm","2 Windows","1 Aircon","2 Single Beds","3.2m ceiling"] },
                  { name:"Bathroom 1", specs:["8 sqm","Standing shower","Glass enclosure","Hot & cold"] },
                  { name:"Bathroom 2", specs:["6 sqm","Bathtub","Hot & cold shower","Exhaust fan"] },
                ].map(u => (
                  <div className="unit-z3-row" key={u.name}>
                    <div className="unit-z3-name">{u.name}</div>
                    <div className="unit-z3-specs">
                      {u.specs.map(s => <span key={s} className="unit-z3-spec">{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Total Units</div><div className="sidebar-value">5</div><div className="sidebar-sub">Click a unit to preview photos</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Bedrooms</div><div className="sidebar-value">{d.beds} rooms</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Bathrooms</div><div className="sidebar-value">{d.baths} baths</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Outdoor</div><div className="sidebar-value">Balcony</div><div className="sidebar-sub">45 sqm · Open Air</div></div>
            </div>
          </div>{/* /panel-units */}

          {/* ── BUILD PLANS ── */}
          <div className={`chapter-panel ${activeTab === "buildplans" ? "active" : ""}`} id="panel-buildplans">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">Build Plans</span></div>
              <div className="display-heading">Structural<br/><em>blueprints</em></div>
              <p className="story-text">High-fidelity structural layout frameworks and asset load diagnostics.</p>
              <div className="accordion">
                <div className="accordion-item">
                  <div className="accordion-header">
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <rect x="2" y="1" width="10" height="12" rx="1"/>
                          <path d="M4 4h6M4 7h6M4 10h3"/>
                        </svg>
                      </div>
                      <div><div className="accordion-title">Floor Plan Matrix</div><div className="accordion-subtitle">Spatial load &amp; room distribution</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-neutral">Available</span></div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-header">
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <rect x="1" y="1" width="12" height="12" rx="1"/>
                          <path d="M4 1v12M1 5h3M1 9h3M4 3h7M4 7h7M4 11h4"/>
                        </svg>
                      </div>
                      <div><div className="accordion-title">Structural Load Report</div><div className="accordion-subtitle">Foundation &amp; beam diagnostics</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-green">Certified</span></div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-header">
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <circle cx="7" cy="7" r="5"/>
                          <path d="M7 4v3l2 1.5"/>
                        </svg>
                      </div>
                      <div><div className="accordion-title">Permit Timeline</div><div className="accordion-subtitle">Building &amp; occupancy certifications</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-green">Complete</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Floor plan</div><div className="sidebar-value">Available</div><div className="sidebar-sub">Full 2-floor layout</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Permit status</div><div className="sidebar-value" style={{color:"var(--green)"}}>Complete</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Structure</div><div className="sidebar-value">Reinforced concrete</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Year assessed</div><div className="sidebar-value">2022</div></div>
            </div>
          </div>{/* /panel-buildplans */}

          {/* ── HIDDEN INTEL ── */}
          <div className={`chapter-panel ${activeTab === "hiddenintel" ? "active" : ""}`} id="panel-hiddenintel">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">Hidden Intel</span></div>
              <div className="display-heading">Off-market<br/><em>intelligence</em></div>
              <p className="story-text">Off-market transaction histories, neighborhood capitalization yields, and macro trend forecasts.</p>
              <div className="accordion">
                <div className="accordion-item">
                  <div className="accordion-header">
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1,10 4,6 7,8 10,4 13,6"/>
                          <path d="M13 4h-3v3"/>
                        </svg>
                      </div>
                      <div><div className="accordion-title">Transaction History</div><div className="accordion-subtitle">Prior sales &amp; off-market closings</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-green">Verified</span></div>
                  </div>
                  <div className="accordion-body">
                    <div className="accordion-content">
                      <div className="detail-row"><span className="detail-key">Last sold</span><span className="detail-val" style={{color:"#8a8a8a"}}>🔒 Available to verified scouts</span></div>
                      <div className="detail-row"><span className="detail-key">Prior price</span><span className="detail-val" style={{color:"#8a8a8a"}}>🔒 Available to verified scouts</span></div>
                      <div className="detail-row"><span className="detail-key">Appreciation</span><span className="detail-val" style={{color:"#8a8a8a"}}>🔒 Available to verified scouts</span></div>
                      <div className="detail-row"><span className="detail-key">Ownership transfers</span><span className="detail-val" style={{color:"#8a8a8a"}}>🔒 Available to verified scouts</span></div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-header">
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <path d="M7 1v12M4 4h4.5a2.5 2.5 0 010 5H4"/><path d="M4 3h5"/>
                        </svg>
                      </div>
                      <div><div className="accordion-title">Cap Rate Intelligence</div><div className="accordion-subtitle">Neighborhood yield benchmarks</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-green">Strong</span></div>
                  </div>
                  <div className="accordion-body">
                    <div className="accordion-content">
                      <div className="detail-row"><span className="detail-key">Area avg. cap rate</span><span className="detail-val" style={{color:"#8a8a8a"}}>🔒 Available to verified scouts</span></div>
                      <div className="detail-row"><span className="detail-key">This asset est.</span><span className="detail-val" style={{color:"#8a8a8a"}}>🔒 Available to verified scouts</span></div>
                      <div className="detail-row"><span className="detail-key">Gross yield (rent)</span><span className="detail-val" style={{color:"#8a8a8a"}}>🔒 Available to verified scouts</span></div>
                      <div className="detail-row"><span className="detail-key">Demand tier</span><span className="detail-val green">High — QC Residential</span></div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <div className="accordion-header">
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <circle cx="7" cy="7" r="5"/><path d="M7 4v2.5L9 8"/>
                        </svg>
                      </div>
                      <div><div className="accordion-title">Macro Trend Forecast</div><div className="accordion-subtitle">12–36 month outlook window</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-green">Bullish</span></div>
                  </div>
                  <div className="accordion-body">
                    <div className="accordion-content">
                      <div className="detail-row"><span className="detail-key">MRT-7 corridor effect</span><span className="detail-val" style={{color:"#8a8a8a"}}>🔒 Available to verified scouts</span></div>
                      <div className="detail-row"><span className="detail-key">12-mo price trend</span><span className="detail-val" style={{color:"#8a8a8a"}}>🔒 Available to verified scouts</span></div>
                      <div className="detail-row"><span className="detail-key">Supply pressure</span><span className="detail-val yellow">Moderate</span></div>
                      <div className="detail-row"><span className="detail-key">Demand signal</span><span className="detail-val green">High — End-user &amp; investor</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Cap rate est.</div><div className="sidebar-value" style={{color:"#8a8a8a"}}>🔒 Locked</div><div className="sidebar-sub">Above area average</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Price trend</div><div className="sidebar-value" style={{color:"#8a8a8a"}}>🔒 Locked</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Ownership history</div><div className="sidebar-value" style={{color:"#8a8a8a"}}>🔒 Locked</div><div className="sidebar-sub">Since build — 2018</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Intel source</div><div className="sidebar-value">ScoutIt Verified</div><div className="sidebar-sub">Internal + Registry Data</div></div>
            </div>
          </div>{/* /panel-hiddenintel */}

          {/* ── EXPANSION NODE ── */}
          <div className={`chapter-panel ${activeTab === "expansion" ? "active" : ""}`} id="panel-expansion">
            <div className="panel-content">
              <div className="chapter-tag"><div className="tag-line"/><span className="tag-text">Expansion Node</span></div>
              <div className="display-heading"><em>?</em><br/>Incoming</div>
              <div className="verdict-block" style={{marginTop: "8px"}}>
                <div className="verdict-header">
                  <div className="verdict-dot" style={{background:"var(--accent)"}}/>
                  <div className="verdict-title" style={{color:"var(--accent)"}}>Layer V7 — Pipeline Active</div>
                </div>
                <p className="verdict-text" style={{fontFamily:"var(--font-body)", fontSize:"11px", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)"}}>
                  [ ENGINES COMPILING // LAYER V7 PIPELINE INJECTS COMING SOON ]
                </p>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:"8px", marginTop:"8px"}}>
                {["Comparative Market Analysis Engine","AR Property Visualization Layer","AI-Powered Space Scoring Matrix","Macro Investment Signal Feed","Live Broker Negotiation Tracker"].map((item, i) => (
                  <div key={i} style={{display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:"4px", opacity: 0.45}}>
                    <div style={{width:"6px", height:"6px", borderRadius:"50%", background:"var(--accent)", flexShrink:0}}/>
                    <span style={{fontSize:"12px", color:"var(--text-secondary)", letterSpacing:"0.04em"}}>{item}</span>
                    <span style={{marginLeft:"auto", fontSize:"9px", fontWeight:600, letterSpacing:"0.1em", color:"var(--text-muted)", textTransform:"uppercase"}}>Soon</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line" style={{background:"var(--accent)"}}/><div className="sidebar-label">Pipeline status</div><div className="sidebar-value" style={{color:"var(--accent)"}}>V7 Compiling</div></div>
              <div className="sidebar-block"><div className="sidebar-label">ETA</div><div className="sidebar-value">Incoming</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Features queued</div><div className="sidebar-value">5</div><div className="sidebar-sub">See panel for list</div></div>
            </div>
          </div>{/* /panel-expansion */}

        </div>{/* /zone-story */}
      </div>{/* /page */}
    </>
  );
}
