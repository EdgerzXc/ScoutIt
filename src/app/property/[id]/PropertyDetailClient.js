"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactionButtons from "@/components/ReactionButtons";
import InteractiveMap from "@/components/InteractiveMap";
import MapboxMap from "@/components/MapboxMap";
import "./property.css";

// ═══════════════════════════════════════════════════
// DATA — Airtable CMS first, mockDb fallback
// ═══════════════════════════════════════════════════
import { getPropertyBySlug } from "@/data/mockProperties";

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
  const [propertyData, setPropertyData] = useState(null);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [whereToTab,        setWhereToTab]        = useState("map");

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

  // ── Fetch property from Airtable → fallback to mockDb ──
  useEffect(() => {
    async function loadProperty() {
      try {
        const res  = await fetch("/api/cms");
        const data = await res.json();
        if (data.properties && data.properties.length > 0) {
          const match = data.properties.find(
            (p) => p.slug && p.slug.toLowerCase() === (slug || "").toLowerCase()
          );
          if (match) {
            // Merge Airtable data over mockDb so missing fields gracefully fall back
            const mock = getPropertyBySlug(slug);
            setPropertyData({ ...mock, ...match });
            setDataLoading(false);
            return;
          }
        }
      } catch { /* network error — fall through to mockDb */ }
      // Fallback: use local mockDb
      setPropertyData(getPropertyBySlug(slug));
      setDataLoading(false);
    }
    loadProperty();
  }, [slug]);

  // Close platform menu on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Keyboard navigation for fullscreen photo lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, propertyData]);

  // ── Loading guard ─────────────────────────────
  if (dataLoading || !propertyData) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        letterSpacing: "0.15em",
        color: "var(--text-muted)"
      }}>
        LOADING SPACE INTELLIGENCE...
      </div>
    );
  }

  // ── Derived values ────────────────────────────
  const d           = propertyData;   // short alias
  const photos      = d.photos && d.photos.length > 0 ? d.photos : (d.image ? [d.image] : [""]);
  const floodRiskText  = floodText(d.flood_risk_score);
  const floodRiskScore = `Score: ${d.flood_risk_score}/10`;
  const convScoreText  = `${d.convenience_score} / 10`;
  const brokerInitials = (d.broker_name || "SA").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  // ── Category Detection & Custom Labels ──────────
  const cat = (d.spaceCategory || "").toLowerCase() || (d.property_type || "").toLowerCase();
  const isRestaurant = cat.includes("restaurant") || cat.includes("culinary");
  const isHospitality = cat.includes("str") || cat.includes("hospitality");
  const isVenue = cat.includes("venue") || cat.includes("event");

  // Determine brief label
  let briefLabel = "Residential Briefing";
  if (isRestaurant) {
    briefLabel = "Culinary Briefing";
  } else if (isHospitality) {
    briefLabel = "Hospitality Briefing";
  } else if (isVenue) {
    briefLabel = "Venue Briefing";
  } else if (d.property_type?.toLowerCase().includes("commercial") || d.property_type?.toLowerCase().includes("office") || d.property_type?.toLowerCase().includes("retail") || cat.includes("commercial")) {
    briefLabel = "Commercial Briefing";
  }

  // ── Spec Pills Dynamic Curators ────────────────
  let pill1Val = d.beds;
  let pill1Label = "Bedrooms";
  let pill1Icon = <><path d="M1 9V5a2 2 0 012-2h8a2 2 0 012 2v4" strokeLinecap="round"/><path d="M1 9h12" strokeLinecap="round"/></>;

  let pill2Val = d.baths;
  let pill2Label = "Bathrooms";
  let pill2Icon = <><path d="M2 8h10M2 8V5a2 2 0 012-2v0a1 1 0 011 1v4" strokeLinecap="round"/><path d="M12 8v3" strokeLinecap="round"/></>;

  if (isRestaurant) {
    pill1Val = d.seating_capacity || "80 Seats";
    pill1Label = "Seating Capacity";
    pill1Icon = <><path d="M3 2h8v5H3V2zm0 5h8v4.5C11 12.3 10.3 13 9.5 13H4.5C3.7 13 3 12.3 3 11.5V7zM1 13h12" strokeLinecap="round"/></>;

    pill2Val = d.kitchen_grade || "Commercial AAA";
    pill2Label = "Kitchen Grade";
    pill2Icon = <><circle cx="6" cy="6" r="4"/><path d="M10 6h3" strokeLinecap="round"/><path d="M6 10v3" strokeLinecap="round"/></>;
  } else if (isHospitality) {
    pill1Val = d.accommodations || "2 Beach Suites";
    pill1Label = "Accommodations";
    pill1Icon = <><rect x="2" y="2" width="10" height="10" rx="1.5"/><circle cx="7" cy="7" r="1.5"/><path d="M3 5h4" strokeLinecap="round"/></>;

    pill2Val = d.hosting_capacity || "15 Guests";
    pill2Label = "Hosting Capacity";
    pill2Icon = <><circle cx="5" cy="4" r="2"/><circle cx="9" cy="4" r="2"/><path d="M2 11c0-2 2-3 3-3s3 1 3 3M7 11c0-2 2-3 3-3s3 1 3 3"/></>;
  } else if (isVenue) {
    pill1Val = d.seating_capacity || "350 Capacity";
    pill1Label = "Guest Capacity";
    pill1Icon = <><path d="M2 12a4 4 0 018 0" strokeLinecap="round"/><circle cx="6" cy="5" r="3"/><circle cx="12" cy="7" r="1.5"/><path d="M10 12a2 2 0 013-1" strokeLinecap="round"/></>;

    pill2Val = d.setup_grade || "Premium A/V";
    pill2Label = "Setup Grade";
    pill2Icon = <><circle cx="7" cy="7" r="5"/><path d="M7 2v2M7 10v2M2 7h2M10 7h2" strokeLinecap="round"/></>;
  }

  // ── Build Dynamic Units List ───────────────────
  const dynamicUnits = [];
  const isCommercial = 
    d.property_type?.toLowerCase().includes("commercial") || 
    d.property_type?.toLowerCase().includes("restaurant") || 
    d.property_type?.toLowerCase().includes("office") ||
    d.property_type?.toLowerCase().includes("retail") ||
    isVenue;

  if (isRestaurant) {
    // 1. Dining Area
    dynamicUnits.push({
      name: "Main Dining Area",
      specs: [
        `${d.floor_sqm ? Math.round(d.floor_sqm * 0.6) : 150} sqm dining layout`,
        "Curated ambient lighting & interior acoustics",
        `Capacity: ${d.seating_capacity || "80 seats"}`,
        "Fitted furniture & custom seating plan"
      ]
    });
    // 2. Prep Kitchen
    dynamicUnits.push({
      name: "Prep Kitchen",
      specs: [
        "High electrical load capacity ready",
        "Dedicated HVAC & exhaust air integration",
        "Fresh water supply & commercial drainage lines",
        `Grade: ${d.kitchen_grade || "Commercial AAA"}`
      ]
    });
    // 3. Specialties / Menus
    dynamicUnits.push({
      name: "Secret Recipes & Menus",
      specs: [
        "Signature menu concept integration",
        "Locally-sourced organic supplier chain",
        "Award-winning recipe alignments",
        "Optimized food delivery flow"
      ]
    });
    // 4. Washrooms
    const bathsCount = Number(d.baths || 0);
    if (bathsCount > 0) {
      dynamicUnits.push({
        name: "Washrooms",
        specs: [
          `${bathsCount} fitted guest washrooms`,
          "Exhaust system integrated",
          "Premium plumbing fixtures"
        ]
      });
    }
  } else if (isHospitality) {
    // 1. Main Guest Pavilion
    dynamicUnits.push({
      name: "Main Lounge & Pavilion",
      specs: [
        `${d.floor_sqm ? Math.round(d.floor_sqm * 0.5) : 80} sqm central pavilion`,
        "High-vaulted ceiling with natural sea drafts",
        "Polished concrete & local coco-lumber columns",
        "Seamless indoor/outdoor integration"
      ]
    });
    // 2. Guest Suites
    dynamicUnits.push({
      name: "Guest Suites",
      specs: [
        `Accommodations: ${d.accommodations || "2 Luxury Suites"}`,
        "Premium ocean breeze ventilation",
        "En-suite bathroom & standing shower",
        "Private veranda access ready"
      ]
    });
    // 3. Wellness & Pool
    dynamicUnits.push({
      name: "Wellness & Pool Zones",
      specs: [
        "Saltwater pool integration",
        "Lush tropical manicured gardens",
        "Dedicated spa / massage pavilions",
        "Eco-friendly zero-footprint structures"
      ]
    });
    // 4. Washrooms
    const bathsCount = Number(d.baths || 0);
    if (bathsCount > 0) {
      dynamicUnits.push({
        name: "Washrooms",
        specs: [
          `${bathsCount} separate guest washrooms`,
          "Exhaust system integrated",
          "Hot & cold utility water"
        ]
      });
    }
  } else if (isVenue) {
    // 1. Ballroom / Pavilion
    dynamicUnits.push({
      name: "Grand Ballroom / Glasshouse",
      specs: [
        `${d.floor_sqm ? Math.round(d.floor_sqm * 0.7) : 400} sqm event floor`,
        `Ceiling clearance: ${d.ceiling_height_text || "6.5 meters"}`,
        "Reinforced overhead rigging points",
        "Smart acoustic ceiling clouds"
      ]
    });
    // 2. Dressing Suite
    dynamicUnits.push({
      name: "VIP Holding & Dressing Suite",
      specs: [
        "Dedicated vanity mirrors & makeup console",
        "Private en-suite restroom & lounge seating",
        "Secure card-key access control",
        "Acoustical isolation from main floor"
      ]
    });
    // 3. Service Bay
    dynamicUnits.push({
      name: "Catering Prep & Service Bay",
      specs: [
        "Direct utility access & loading dock corridor",
        "Dedicated high flow wastewater line",
        "High load power outlets for cooling/cooking",
        "Easy ingress/egress for vendor teams"
      ]
    });
    // 4. Washrooms
    const bathsCount = Number(d.baths || 0);
    if (bathsCount > 0) {
      dynamicUnits.push({
        name: "Washrooms",
        specs: [
          `${bathsCount} separate washrooms`,
          "Modern high-traffic plumbing fixtures",
          "Dedicated makeup counter & wash basins",
          "Exhaust system integrated"
        ]
      });
    }
  } else {
    // Traditional Fallback
    // 1. Outdoor/Lobby/Pool
    if (d.outdoor_description && d.outdoor_description !== "None" && d.outdoor_description !== "") {
      let name = "Balcony";
      if (d.outdoor_description.toLowerCase().includes("pool") || d.outdoor_description.toLowerCase().includes("beach")) {
        name = "Pool & Beach";
      } else if (d.outdoor_description.toLowerCase().includes("lobby") || d.outdoor_description.toLowerCase().includes("foyer") || d.outdoor_description.toLowerCase().includes("waiting")) {
        name = "Lobby & Entrance";
      } else if (d.outdoor_description.toLowerCase().includes("garden") || d.outdoor_description.toLowerCase().includes("walkway")) {
        name = "Gardens & Walkways";
      } else if (d.outdoor_description.toLowerCase().includes("courtyard")) {
        name = "Courtyard";
      }
      
      dynamicUnits.push({
        name,
        specs: [
          d.outdoor_description,
          "Open Air / Access Space",
          "Safe & Maintained"
        ]
      });
    }

    // 2. Main Spaces (for Commercial) or Rooms (for Residential/STR)
    if (isCommercial) {
      dynamicUnits.push({
        name: "Main Hall / Space",
        specs: [
          `${d.floor_sqm ? Math.round(d.floor_sqm * 0.6) : 150} sqm est.`,
          "Open layout configuration",
          "Central lighting & acoustics",
          `${d.ceiling_height_text || "3.8m ceiling"}`
        ]
      });
      dynamicUnits.push({
        name: "Kitchen & Utilities",
        specs: [
          `${d.floor_sqm ? Math.round(d.floor_sqm * 0.25) : 50} sqm est.`,
          "High load power ready",
          "Fresh air intake systems",
          "Water supply integration"
        ]
      });
    } else {
      const bedsCount = Number(d.beds || 0);
      for (let i = 1; i <= bedsCount; i++) {
        dynamicUnits.push({
          name: i === 1 ? "Master Suite" : `Room ${i}`,
          specs: [
            `${bedsCount > 0 ? Math.round((d.floor_sqm * 0.6) / bedsCount) : 25} sqm est.`,
            "Premium ventilation & lighting",
            "Aircon integration ready",
            i === 1 ? "Large layout double-bed space" : "Single/Twin bed sizing",
            `${d.ceiling_height_text || "3.2m ceiling"}`
          ]
        });
      }
    }

    // 3. Bathrooms / Washrooms
    const bathsCount = Number(d.baths || 0);
    if (bathsCount > 0) {
      if (isCommercial) {
        dynamicUnits.push({
          name: "Washrooms",
          specs: [
            `${bathsCount} separate units`,
            "Modern plumbing fixtures",
            "High flow exhaust fans",
            "Dedicated wash stations"
          ]
        });
      } else {
        for (let i = 1; i <= bathsCount; i++) {
          dynamicUnits.push({
            name: i === 1 ? "Master Bath" : `Bathroom ${i}`,
            specs: [
              "Standing shower installation",
              "Hot & cold utility water",
              "Exhaust system integrated",
              i === 1 ? "Dual vanity ready" : "Single vanity sizing"
            ]
          });
        }
      }
    }
  }



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
  // Extract sidebar location values dynamically from whereTo array
  const nearestMallObj = d.whereTo?.find(p => p.category?.toLowerCase() === "essentials" || p.category?.toLowerCase() === "business" || p.name?.toLowerCase().includes("mall") || p.name?.toLowerCase().includes("shop"));
  const nearestHospitalObj = d.whereTo?.find(p => p.category?.toLowerCase() === "healthcare" || p.name?.toLowerCase().includes("hospital") || p.name?.toLowerCase().includes("medical"));
  const publicTransitObj = d.whereTo?.find(p => p.category?.toLowerCase() === "transit" || p.name?.toLowerCase().includes("mrt") || p.name?.toLowerCase().includes("lrt") || p.name?.toLowerCase().includes("bus") || p.name?.toLowerCase().includes("station"));
  
  const hasWalk = d.whereTo?.some(p => p.distance?.toLowerCase().includes("walk"));
  const walkabilitySub = hasWalk ? "Essentials within walking distance" : "Vehicle recommended for errands";

  // ── Where To renderer ─────────────────────────
  const renderWhereTo = () => {
    if (!d.whereTo || d.whereTo.length === 0) {
      return (
        <div style={{
          padding: "32px",
          background: "var(--surface)",
          border: "0.5px dashed var(--border-mid)",
          borderRadius: "4px",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          gridColumn: "1 / -1"
        }}>
          [ LOCATION BRIEFING N/A — NO DATA IN CMS ]
        </div>
      );
    }

    const groups = {};
    d.whereTo.forEach(p => {
      const cat = p.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
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
        <div className="zone-photo" id="photoZone" onClick={() => setIsLightboxOpen(true)}>

          {photos.map((url, i) => (
            <div
              key={i}
              className={`photo-slide ${photoMode} ${currentImageIndex === i ? "active" : ""}`}
              style={{ 
                backgroundImage: `url(${url})`
              }}
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
          <div className="photo-fade-left" />
          <div className="photo-fade-bottom" />

          {/* Hero Intel */}
          <div className="hero-intel">
            <p className="hero-label">ScoutIt &middot; {briefLabel}</p>
            <h1 className="hero-title">{d.title}</h1>
            <p className="hero-location">{d.location}</p>
            <p className="hero-hook">{d.hook}</p>
          </div>

          {/* Go Back Button (Top Left) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
            className="platform-back-btn"
          >
            ← Go Back
          </button>

          {/* Platform Nav (Top Right - Menu only) */}
          <nav className="platform-nav" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              className="platform-menu-btn"
              type="button"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 4h12M2 8h12M2 12h12"/>
              </svg>
            </button>
            <div className={`platform-dropdown ${menuOpen ? "open" : ""}`}>
              <div className="dropdown-brand">ScoutIt</div>
              <Link href="/">Home</Link>
              <Link href="/discover">Discover</Link>
              <Link href="/discover">News</Link>
              <Link href="/brokers">Brokers</Link>
              <Link href="/photographers">Photographers</Link>
              <Link href="/researchers">Researchers</Link>
              <Link href="/event-planners">Event Planners</Link>
              <Link href="/wishlist">Your Board</Link>
              <Link href="/about">About</Link>
            </div>
          </nav>

          {/* Arrows */}
          <div className="photo-arrow left"  onClick={(e) => { e.stopPropagation(); goPrev(); }}>
            <svg className="arrow-svg" viewBox="0 0 14 14"><polyline points="9,2 4,7 9,12"/></svg>
          </div>
          <div className="photo-arrow right" onClick={(e) => { e.stopPropagation(); goNext(); }}>
            <svg className="arrow-svg" viewBox="0 0 14 14"><polyline points="5,2 10,7 5,12"/></svg>
          </div>

          {/* Controls */}
          <div className="photo-controls" onClick={(e) => e.stopPropagation()}>
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
            {dynamicUnits.length > 0 && (
              <>
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
              </>
            )}

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
                  { val: pill1Val,    label: pill1Label,  icon: pill1Icon },
                  { val: pill2Val,    label: pill2Label,  icon: pill2Icon },
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
                      <div>
                        <div className="accordion-title">
                          {isRestaurant ? "Operations Reality" : isHospitality ? "Guest Experience Reality" : isVenue ? "Event Logistics Reality" : "Daily Life Reality"}
                        </div>
                        <div className="accordion-subtitle">
                          {isRestaurant ? "Is running restaurant operations easy here?" : isHospitality ? "Is guest accessibility easy here?" : isVenue ? "Are event setups and load-ins easy here?" : "Is my daily routine easy here?"}
                        </div>
                      </div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-green">Convenient</span><div className="accordion-chevron"/></div>
                  </div>
                  <div className="accordion-body"><div className="accordion-content">
                    {isRestaurant && (
                      <>
                        <div className="detail-row"><span className="detail-key">Food supplier access</span><span className="detail-val green">Direct delivery route</span></div>
                        <div className="detail-row"><span className="detail-key">Foot traffic density</span><span className="detail-val">High · Commercial zone</span></div>
                        <div className="detail-row"><span className="detail-key">Nearest transit hub</span><span className="detail-val">4 min walk</span></div>
                        <div className="detail-row"><span className="detail-key">Parking convenience</span><span className="detail-val green">Valet option available</span></div>
                      </>
                    )}
                    {isHospitality && (
                      <>
                        <div className="detail-row"><span className="detail-key">Beach / activity access</span><span className="detail-val green">2 min walk to sea</span></div>
                        <div className="detail-row"><span className="detail-key">Airport commute</span><span className="detail-val">35 min drive</span></div>
                        <div className="detail-row"><span className="detail-key">Local food options</span><span className="detail-val green">Excellent coverage</span></div>
                        <div className="detail-row"><span className="detail-key">Security presence</span><span className="detail-val">Guarded subdivision</span></div>
                      </>
                    )}
                    {isVenue && (
                      <>
                        <div className="detail-row"><span className="detail-key">Acoustic insulation</span><span className="detail-val green">Sound dampening shell</span></div>
                        <div className="detail-row"><span className="detail-key">Load-in dock access</span><span className="detail-val green">Direct service entry</span></div>
                        <div className="detail-row"><span className="detail-key">Visitor parking</span><span className="detail-val">25 slots + valet</span></div>
                        <div className="detail-row"><span className="detail-key">Egress capacity</span><span className="detail-val green">Meets standard safety code</span></div>
                      </>
                    )}
                    {!isRestaurant && !isHospitality && !isVenue && (
                      <>
                        <div className="detail-row"><span className="detail-key">Grocery access</span><span className="detail-val green">4 min drive</span></div>
                        <div className="detail-row"><span className="detail-key">Nearest hospital</span><span className="detail-val">12 min · QMMC</span></div>
                        <div className="detail-row"><span className="detail-key">Schools nearby</span><span className="detail-val">3 within 10 min</span></div>
                        <div className="detail-row"><span className="detail-key">Commute to CBD</span><span className="detail-val yellow">35–45 min</span></div>
                        <div className="detail-row"><span className="detail-key">Public transport</span><span className="detail-val green">Good coverage</span></div>
                      </>
                    )}
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
              
              {/* View Switcher buttons */}
              <div className="whereto-tabs">
                <button 
                  className={`whereto-tab-btn ${whereToTab === "map" ? "active" : ""}`}
                  onClick={() => setWhereToTab("map")}
                >
                  <span className="btn-pulse" />
                  Tactical Map
                </button>
                <button 
                  className={`whereto-tab-btn ${whereToTab === "mapbox" ? "active" : ""}`}
                  onClick={() => setWhereToTab("mapbox")}
                >
                  3D Spatial Map
                </button>
                <button 
                  className={`whereto-tab-btn ${whereToTab === "list" ? "active" : ""}`}
                  onClick={() => setWhereToTab("list")}
                >
                  Directory List
                </button>
              </div>

              {/* Conditional view panel */}
              <div className="whereto-view-container" style={{ position: "relative", width: "100%", minHeight: "380px" }}>
                {whereToTab === "list" && (
                  <div id="where-to-content">{renderWhereTo()}</div>
                )}

                {whereToTab === "map" && (
                  <div style={{ position: "relative", width: "100%", height: "380px" }}>
                    <InteractiveMap 
                      lat={d.lat || d.latitude || 14.5547} 
                      lng={d.lng || d.longitude || 121.0244} 
                      propertyTitle={d.title} 
                      vicinityData={d.whereTo} 
                    />
                  </div>
                )}

                {whereToTab === "mapbox" && (
                  <div style={{ position: "relative", width: "100%", height: "380px" }}>
                    <MapboxMap 
                      lat={d.lat || d.latitude || 14.5547} 
                      lng={d.lng || d.longitude || 121.0244} 
                      propertyTitle={d.title} 
                      vicinityData={d.whereTo} 
                    />
                  </div>
                )}
              </div>
            </div>
             <div className="panel-sidebar">
              <div className="sidebar-block">
                <div className="sidebar-accent-line"/>
                <div className="sidebar-label">Nearest mall</div>
                <div className="sidebar-value">{nearestMallObj ? nearestMallObj.name : "N/A"}</div>
                <div className="sidebar-sub">{nearestMallObj ? nearestMallObj.distance : "Not specified"}</div>
              </div>
              <div className="sidebar-block">
                <div className="sidebar-label">Nearest hospital</div>
                <div className="sidebar-value">{nearestHospitalObj ? nearestHospitalObj.name : "N/A"}</div>
                <div className="sidebar-sub">{nearestHospitalObj ? nearestHospitalObj.distance : "Not specified"}</div>
              </div>
              <div className="sidebar-block">
                <div className="sidebar-label">Public transit</div>
                <div className="sidebar-value">{publicTransitObj ? publicTransitObj.name : "N/A"}</div>
                <div className="sidebar-sub">{publicTransitObj ? publicTransitObj.distance : "Not specified"}</div>
              </div>
              <div className="sidebar-block">
                <div className="sidebar-label">Walkability</div>
                <div className="sidebar-value">{d.whereTo && d.whereTo.length > 0 ? (hasWalk ? "Good" : "Moderate") : "N/A"}</div>
                <div className="sidebar-sub">{d.whereTo && d.whereTo.length > 0 ? walkabilitySub : "Not specified"}</div>
              </div>
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
                {isRestaurant ? (
                  <>
                    <tr><td>Dining Capacity</td><td>{pill1Val}</td></tr>
                    <tr><td>Kitchen Grade</td><td>{pill2Val}</td></tr>
                  </>
                ) : isHospitality ? (
                  <>
                    <tr><td>Accommodations</td><td>{pill1Val}</td></tr>
                    <tr><td>Hosting Capacity</td><td>{pill2Val}</td></tr>
                  </>
                ) : isVenue ? (
                  <>
                    <tr><td>Guest Capacity</td><td>{pill1Val}</td></tr>
                    <tr><td>Setup Grade</td><td>{pill2Val}</td></tr>
                  </>
                ) : (
                  <>
                    <tr><td>Bedrooms</td><td>{d.beds}</td></tr>
                    <tr><td>Bathrooms</td><td>{d.baths}</td></tr>
                  </>
                )}
                <tr><td>Parking slots</td><td>{d.parking} covered</td></tr>
                <tr><td>Furnishing</td><td>{d.furnishing}</td></tr>
                <tr><td>Year built</td><td>{d.year_built}</td></tr>
                <tr><td>Title status</td><td>{d.title_status}</td></tr>
                <tr><td>Asking price</td><td style={{color:"var(--text-muted)", fontStyle:"italic"}}>Price Upon Request</td></tr>
                <tr><td>Price per sqm</td><td style={{color:"var(--text-muted)", fontStyle:"italic"}}>Inquire with broker</td></tr>
              </tbody></table>

              <div className="accordion">
                <div className={`accordion-item ${accUniverse === "priceval" ? "open" : ""}`}>
                  <div className="accordion-header" onClick={() => tog(setAccUniverse, accUniverse, "priceval")}>
                    <div className="accordion-left">
                      <div className="accordion-icon-wrap"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1v12M4 4h4.5a2.5 2.5 0 010 5H4"/><path d="M4 3h5"/></svg></div>
                      <div><div className="accordion-title">Price vs Value</div><div className="accordion-subtitle">Investment positioning context</div></div>
                    </div>
                    <div className="accordion-right"><span className="accordion-tag tag-neutral">On Request</span><div className="accordion-chevron"/></div>
                  </div>
                  <div className="accordion-body"><div className="accordion-content">
                    <div className="detail-row"><span className="detail-key">Asking price</span><span className="detail-val" style={{color:"var(--text-muted)", fontStyle:"italic"}}>Contact broker to confirm</span></div>
                    <div className="detail-row"><span className="detail-key">Price per sqm</span><span className="detail-val" style={{color:"var(--text-muted)", fontStyle:"italic"}}>Area range estimate only</span></div>
                    <div className="detail-row"><span className="detail-key">Sqm range est.</span><span className="detail-val">Est. ₱180K–₱220K / sqm range</span></div>
                    <div className="detail-row"><span className="detail-key">Negotiation room</span><span className="detail-val green">Yes · Open</span></div>
                    <div className="detail-row"><span className="detail-key">How to confirm</span><span className="detail-val">Inquire directly with listed advisor</span></div>
                  </div></div>
                </div>
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
                    <div className="detail-row"><span className="detail-key">Rental yield est.</span><span className="detail-val">~5–6% annually</span></div>
                    <div className="detail-row"><span className="detail-key">Monthly rent est.</span><span className="detail-val">₱60,000 / month</span></div>
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

              {/* Price Upon Inquiry block — replaces any specific price hero figure */}
              <div style={{
                margin: "20px 0 24px",
                padding: "20px 24px",
                background: "var(--surface)",
                border: "0.5px solid var(--border-mid)",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(22px, 3vw, 30px)",
                  fontWeight: 300,
                  letterSpacing: "0.04em",
                  color: "var(--text-primary)"
                }}>Price Upon Inquiry</div>
                <div style={{
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)"
                }}>Confirmed directly with the listed advisor</div>
              </div>

              <div className="reactions-container" style={{marginTop:"0", display:"flex", flexDirection:"column", gap:"10px"}}>
                <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "#8a8a8a", marginBottom: "16px" }}>
                  HOW DOES THIS SPACE MAKE YOU FEEL?
                </p>
                <ReactionButtons
                  propertyId={slug || "batasan-hills"}
                  propertyTitle={d.title}
                  category={d.property_type}
                  city={d.city}
                />
              </div>

              {/* HOA standalone fact row */}
              <div className="detail-row" style={{marginTop: "16px"}}>
                <span className="detail-key">HOA dues</span>
                <span className="detail-val">None</span>
              </div>

              <div className="where-category" style={{marginTop:"20px"}}>
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
                Inquire with Advisor →
              </Link>

              {/* Philippine real estate disclosure compliance notice */}
              <p style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                lineHeight: "1.7",
                marginTop: "14px",
                letterSpacing: "0.02em"
              }}>
                Pricing is not displayed on ScoutIt in compliance with Philippine real estate disclosure standards. Contact the listed advisor or owner directly to confirm the current asking price, payment terms, and availability.
              </p>

              <p style={{fontSize:"15px", color:"#8a8a8a", lineHeight:"1.65", marginTop:"12px"}}>
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
                {dynamicUnits.map(u => {
                  const activeUnit = selectedUnit || (dynamicUnits.length > 0 ? dynamicUnits[0].name : "");
                  return (
                    <div 
                      className={`unit-z3-row ${activeUnit === u.name ? "selected" : ""}`} 
                      key={u.name}
                      onClick={() => {
                        setSelectedUnit(u.name);
                        let targetIndex = 0;
                        if (u.name.toLowerCase().includes("suite") || u.name.toLowerCase().includes("master")) {
                          targetIndex = 1 % photos.length;
                        } else if (u.name.toLowerCase().includes("room")) {
                          const num = parseInt(u.name.replace(/\D/g, ""), 10);
                          targetIndex = (isNaN(num) ? 1 : num) % photos.length;
                        } else if (u.name.toLowerCase().includes("bath") || u.name.toLowerCase().includes("washroom")) {
                          targetIndex = (photos.length - 1) % photos.length;
                        } else if (u.name.toLowerCase().includes("hall") || u.name.toLowerCase().includes("space")) {
                          targetIndex = 0;
                        } else if (u.name.toLowerCase().includes("kitchen") || u.name.toLowerCase().includes("utility")) {
                          targetIndex = 1 % photos.length;
                        } else {
                          targetIndex = 2 % photos.length;
                        }
                        if (photos && photos.length > 0) {
                          setCurrentImageIndex(targetIndex);
                        }
                      }}
                    >
                      <div className="unit-z3-name">{u.name}</div>
                      <div className="unit-z3-specs">
                        {u.specs.map(s => <span key={s} className="unit-z3-spec">{s}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="panel-sidebar">
              <div className="sidebar-block">
                <div className="sidebar-accent-line"/>
                <div className="sidebar-label">Total Areas</div>
                <div className="sidebar-value">{dynamicUnits.length}</div>
                <div className="sidebar-sub">Click an area to preview photos</div>
              </div>
              {isRestaurant ? (
                <>
                  <div className="sidebar-block">
                    <div className="sidebar-label">Dining Capacity</div>
                    <div className="sidebar-value">{pill1Val}</div>
                  </div>
                  <div className="sidebar-block">
                    <div className="sidebar-label">Kitchen Grade</div>
                    <div className="sidebar-value">{pill2Val}</div>
                  </div>
                </>
              ) : isHospitality ? (
                <>
                  <div className="sidebar-block">
                    <div className="sidebar-label">Accommodations</div>
                    <div className="sidebar-value">{pill1Val}</div>
                  </div>
                  <div className="sidebar-block">
                    <div className="sidebar-label">Hosting Capacity</div>
                    <div className="sidebar-value">{pill2Val}</div>
                  </div>
                </>
              ) : isVenue ? (
                <>
                  <div className="sidebar-block">
                    <div className="sidebar-label">Guest Capacity</div>
                    <div className="sidebar-value">{pill1Val}</div>
                  </div>
                  <div className="sidebar-block">
                    <div className="sidebar-label">Setup Grade</div>
                    <div className="sidebar-value">{pill2Val}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="sidebar-block">
                    <div className="sidebar-label">Bedrooms</div>
                    <div className="sidebar-value">{d.beds || 0} rooms</div>
                  </div>
                  <div className="sidebar-block">
                    <div className="sidebar-label">Bathrooms</div>
                    <div className="sidebar-value">{d.baths || 0} baths</div>
                  </div>
                </>
              )}
              {d.outdoor_description && d.outdoor_description !== "None" && d.outdoor_description !== "" && (
                <div className="sidebar-block">
                  <div className="sidebar-label">Outdoor Space</div>
                  <div className="sidebar-value">Available</div>
                  <div className="sidebar-sub">{d.outdoor_description}</div>
                </div>
              )}
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
                <p className="verdict-text" style={{fontFamily:"var(--font-body)", fontSize:"12px", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)"}}>
                  [ ENGINES COMPILING // LAYER V7 PIPELINE INJECTS COMING SOON ]
                </p>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:"8px", marginTop:"8px"}}>
                {["Comparative Market Analysis Engine","AR Property Visualization Layer","AI-Powered Space Scoring Matrix","Macro Investment Signal Feed","Live Broker Negotiation Tracker"].map((item, i) => (
                  <div key={i} style={{display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:"4px", opacity: 0.45}}>
                    <div style={{width:"6px", height:"6px", borderRadius:"50%", background:"var(--accent)", flexShrink:0}}/>
                    <span style={{fontSize:"15px", color:"#8a8a8a", lineHeight:"1.65", letterSpacing:"0.04em"}}>{item}</span>
                    <span style={{marginLeft:"auto", fontSize:"12px", fontWeight:600, letterSpacing:"0.1em", color:"var(--text-muted)", textTransform:"uppercase"}}>Soon</span>
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

      {/* Lightbox / Fullscreen Modal */}
      {isLightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <button 
            className="lightbox-close" 
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            aria-label="Close fullscreen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          
          <button 
            className="lightbox-arrow left" 
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous photo"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9,2 4,7 9,12"/></svg>
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={photos[currentImageIndex]} 
              alt={`${d.title} fullscreen view`} 
              className={`lightbox-image ${photoMode}`} 
            />
          </div>

          <button 
            className="lightbox-arrow right" 
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next photo"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="5,2 10,7 5,12"/></svg>
          </button>

          <div className="lightbox-counter">
            {currentImageIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
