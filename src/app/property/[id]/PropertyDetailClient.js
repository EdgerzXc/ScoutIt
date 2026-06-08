"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactionButtons from "@/components/ReactionButtons";
import InteractiveMap from "@/components/InteractiveMap";
import "./property.css";

// ═══════════════════════════════════════════════════
// DATA — Airtable CMS first, mockDb fallback
// ═══════════════════════════════════════════════════
import { getPropertyBySlug } from "@/data/mockProperties";

// ═══════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════
function DeepIntelWidget({ open, onToggle, fields }) {
  if (!fields || fields.length === 0) return null;
  return (
    <div style={{marginTop:"32px"}}>
      <div style={{height:"1px", background:"#262626", marginBottom:"16px"}}/>
      <button
        onClick={onToggle}
        style={{width:"100%", background:"#161616", border:"0.5px solid #262626", padding:"14px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", borderRadius:"2px"}}
      >
        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8a96e", letterSpacing:"0.18em", textTransform:"uppercase"}}>
          DEEP INTELLIGENCE // VERIFIED SCOUT
        </span>
        <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="#c8a96e" strokeWidth="1.5">
          <path d={open ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"}/>
        </svg>
      </button>
      {open && (
        <div style={{background:"#161616", border:"0.5px solid #262626", borderTop:"none", padding:"20px", position:"relative", borderRadius:"0 0 2px 2px"}}>
          <div style={{filter:"blur(4px)", pointerEvents:"none", userSelect:"none", display:"flex", flexDirection:"column"}}>
            {fields.map((field, i) => (
              <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom: i < fields.length - 1 ? "1px solid #262626" : "none"}}>
                <span style={{fontFamily:"Georgia,serif", fontSize:"13px", color:"#8a8a8a"}}>{field}</span>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"12px", color:"#3a3a3a", letterSpacing:"0.1em"}}>████████</span>
              </div>
            ))}
          </div>
          <div style={{position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"14px", background:"rgba(22,22,22,0.88)", borderRadius:"0 0 2px 2px"}}>
            <span style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8a96e", letterSpacing:"0.25em", textTransform:"uppercase"}}>VERIFIED SCOUT ONLY</span>
            <button style={{fontFamily:"Georgia,serif", fontSize:"13px", color:"#0e0e0e", background:"#c8a96e", border:"none", padding:"10px 24px", borderRadius:"2px", cursor:"pointer", letterSpacing:"0.04em"}}>
              Unlock Full Intelligence →
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
  const [propertyData, setPropertyData] = useState(() => getPropertyBySlug(slug));
  const [dataLoading,  setDataLoading]  = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [whereToTab,        setWhereToTab]        = useState("map");

  // Per-panel accordion state (independent per section)
  const [accSpace,    setAccSpace]    = useState(null);
  const [accLocation, setAccLocation] = useState(null);
  const [accLife,     setAccLife]     = useState(null);
  const [accUniverse, setAccUniverse] = useState(null);
  const [accMove,     setAccMove]     = useState(null);
  const [widgets,     setWidgets]     = useState({});

  // ── Drag-to-scroll refs ───────────────────────
  const scrollRef    = useRef(null);
  const isDragging   = useRef(false);
  const startX       = useRef(0);
  const scrollStart  = useRef(0);
  const menuRef      = useRef(null);
  const touchStartX  = useRef(0);

  // ── Fetch from Airtable in background; mock data already shown ──
  useEffect(() => {
    async function loadProperty() {
      try {
        const res  = await fetch("/api/cms");
        if (!res.ok) return;
        const data = await res.json();
        if (data.properties && data.properties.length > 0) {
          const match = data.properties.find(
            (p) => p.slug && p.slug.toLowerCase() === (slug || "").toLowerCase()
          );
          if (match) {
            const mock = getPropertyBySlug(slug);
            setPropertyData({ ...mock, ...match });
          }
        }
      } catch { /* stay on mock data */ }
    }
    loadProperty();
  }, [slug]);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Detect horizontal navigation scroll to toggle fade masks
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    };

    el.addEventListener("scroll", checkScroll);
    checkScroll();

    // Check again if page elements settle or window size changes
    window.addEventListener("resize", checkScroll);
    const timer = setTimeout(checkScroll, 300);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [propertyData]);

  // Close platform menu on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Keyboard navigation for fullscreen photo lightbox
  // Also lock/unlock viewport on mobile when lightbox opens/closes
  useEffect(() => {
    if (!isLightboxOpen) {
      // Remove viewport lock when lightbox closes
      document.documentElement.classList.remove('lightbox-open');
      document.body.classList.remove('lightbox-open');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      return;
    }
    
    // Lock viewport when lightbox opens
    document.documentElement.classList.add('lightbox-open');
    document.body.classList.add('lightbox-open');
    
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

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    if (diff > 50) {
      goPrev();
    } else if (diff < -50) {
      goNext();
    }
  };

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

  // Smooth scroll page to chapter content on mobile tab selection
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        document.querySelector('.zone-story')
          ?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
      }, 50);
    }
  };

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
        <div 
          className="zone-photo" 
          id="photoZone" 
          onClick={() => setIsLightboxOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

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

        {/* Mobile-only Hero Intel (visible on mobile viewport, hidden on desktop) */}
        <div className="mobile-hero-intel">
          <p className="mobile-hero-label">ScoutIt &middot; {briefLabel}</p>
          <h1 className="mobile-hero-title">{d.title}</h1>
          <p className="mobile-hero-location">{d.location}</p>
          <p className="mobile-hero-hook">{d.hook}</p>
        </div>

        {/* ════ ZONE 2 – NAV (drag-to-scroll) ════ */}
        <div className={`zone-nav ${canScrollLeft ? "can-scroll-left" : ""} ${canScrollRight ? "can-scroll-right" : ""}`}>
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
                  onClick={() => handleTabClick(tab.id)}
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
                  onClick={() => handleTabClick("units")}
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
              onClick={() => handleTabClick("universe")}
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
              onClick={() => handleTabClick("expansion")}
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
              onClick={() => handleTabClick("yourmove")}
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

          {/* ── THE SPACE (Ch. 1) ── */}
          <div className={`chapter-panel ${activeTab === "space" ? "active" : ""}`} id="panel-space">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>01 — The Space</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {(d.aesthetic_tag || d.accordion_3_rating) && (
                <div style={{marginBottom:"28px"}}>
                  <span style={{fontFamily:"Georgia,serif", fontSize:"13px", color:"#c8a96e", border:"0.5px solid rgba(200,169,110,0.35)", padding:"5px 14px", borderRadius:"2px", letterSpacing:"0.06em"}}>
                    {d.aesthetic_tag || d.accordion_3_rating}
                  </span>
                </div>
              )}

              <div style={{display:"flex", flexWrap:"wrap", gap:"28px 52px", margin:"0 0 32px"}}>
                {pill1Val && pill1Val !== 0 && (
                  <div>
                    <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(40px,5vw,60px)", fontWeight:400, color:"#f0ede8", lineHeight:1}}>{pill1Val}</div>
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#8a8a8a", letterSpacing:"0.22em", textTransform:"uppercase", marginTop:"8px"}}>{pill1Label}</div>
                  </div>
                )}
                {pill2Val && pill2Val !== 0 && (
                  <div>
                    <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(40px,5vw,60px)", fontWeight:400, color:"#f0ede8", lineHeight:1}}>{pill2Val}</div>
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#8a8a8a", letterSpacing:"0.22em", textTransform:"uppercase", marginTop:"8px"}}>{pill2Label}</div>
                  </div>
                )}
                {d.floor_sqm > 0 && (
                  <div>
                    <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(40px,5vw,60px)", fontWeight:400, color:"#f0ede8", lineHeight:1}}>{d.floor_sqm}</div>
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#8a8a8a", letterSpacing:"0.22em", textTransform:"uppercase", marginTop:"8px"}}>sqm floor</div>
                  </div>
                )}
                {d.parking > 0 && (
                  <div>
                    <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(40px,5vw,60px)", fontWeight:400, color:"#f0ede8", lineHeight:1}}>{d.parking}</div>
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#8a8a8a", letterSpacing:"0.22em", textTransform:"uppercase", marginTop:"8px"}}>Parking Slots</div>
                  </div>
                )}
                {d.lot_sqm > 0 && (
                  <div>
                    <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(40px,5vw,60px)", fontWeight:400, color:"#f0ede8", lineHeight:1}}>{d.lot_sqm}</div>
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#8a8a8a", letterSpacing:"0.22em", textTransform:"uppercase", marginTop:"8px"}}>Lot sqm</div>
                  </div>
                )}
              </div>

              <div style={{height:"1px", background:"#262626", margin:"0 0 28px"}}/>

              {d.accordion_3_text && (
                <p style={{fontFamily:"Georgia,serif", fontSize:"16px", color:"#f0ede8", lineHeight:1.85, margin:"0 0 28px", maxWidth:"560px"}}>
                  {d.accordion_3_text}
                </p>
              )}

              <div style={{display:"flex", flexDirection:"column"}}>
                {d.noise_level_text && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Noise Level</span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right", maxWidth:"55%"}}>{d.noise_level_text}</span>
                  </div>
                )}
                {d.ventilation && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Ventilation</span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right", maxWidth:"55%"}}>{d.ventilation}</span>
                  </div>
                )}
                {d.ceiling_height_text && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Ceiling Height</span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.ceiling_height_text}</span>
                  </div>
                )}
                {d.furnishing && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Furnishing</span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.furnishing}</span>
                  </div>
                )}
                {d.outdoor_description && d.outdoor_description !== "None" && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Outdoor</span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right", maxWidth:"55%"}}>{d.outdoor_description}</span>
                  </div>
                )}
              </div>

              <DeepIntelWidget
                open={widgets.space}
                onToggle={() => setWidgets(w => ({...w, space: !w.space}))}
                fields={["Comfort Level Score","Natural Light Index","Privacy Rating","Space Feel Assessment","Layout Efficiency Grade"]}
              />

            </div>

            <div className="panel-sidebar">
              {d.city && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Location</div><div className="sidebar-value">{d.city}</div>{d.location && <div className="sidebar-sub">{d.location}</div>}</div>}
              {d.property_type && <div className="sidebar-block"><div className="sidebar-label">Type</div><div className="sidebar-value">{d.property_type}</div></div>}
              {d.tenure && <div className="sidebar-block"><div className="sidebar-label">Tenure</div><div className="sidebar-value">{d.tenure}</div></div>}
              {d.year_built && <div className="sidebar-block"><div className="sidebar-label">Year Built</div><div className="sidebar-value">{d.year_built}</div></div>}
              {d.title_status && <div className="sidebar-block"><div className="sidebar-label">Title</div><div className="sidebar-value">{d.title_status}</div></div>}
            </div>
          </div>

          {/* ── LOCATION (Ch. 2) ── */}
          <div className={`chapter-panel ${activeTab === "location" ? "active" : ""}`} id="panel-location">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>02 — Location</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {d.city && (
                <div style={{margin:"0 0 24px"}}>
                  <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(28px,4.5vw,52px)", fontWeight:400, color:"#f0ede8", lineHeight:1.1}}>
                    {d.city}
                  </div>
                  {d.location && (
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#8a8a8a", letterSpacing:"0.14em", marginTop:"10px", textTransform:"uppercase"}}>
                      {d.location}
                    </div>
                  )}
                </div>
              )}

              <div style={{height:"340px", borderRadius:"2px", overflow:"hidden", border:"0.5px solid #262626", marginBottom:"24px"}}>
                <InteractiveMap
                  lat={d.lat || d.latitude || 14.5547}
                  lng={d.lng || d.longitude || 121.0244}
                  propertyTitle={d.title}
                  vicinityData={d.whereTo}
                />
              </div>

              <div style={{display:"flex", flexDirection:"column"}}>
                {d.street_type && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Street Type</span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.street_type}</span>
                  </div>
                )}
                {d.tenure && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Tenure Type</span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.tenure}</span>
                  </div>
                )}
              </div>

              <DeepIntelWidget
                open={widgets.location}
                onToggle={() => setWidgets(w => ({...w, location: !w.location}))}
                fields={["Flood Risk Assessment","Safety Perception Index","Daytime Security Score","Night Security Score","Area Growth Projection"]}
              />

            </div>

            <div className="panel-sidebar">
              {d.city && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">District</div><div className="sidebar-value">{d.city}</div><div className="sidebar-sub">NCR</div></div>}
              <div className="mini-map">
                <div className="map-road-h" style={{top:"33%"}}/><div className="map-road-h" style={{top:"55%"}}/>
                <div className="map-road-v" style={{left:"30%"}}/><div className="map-road-v" style={{left:"60%"}}/>
                <div className="map-pulse"/><div className="map-pin"/>
              </div>
              {d.street_type && <div className="sidebar-block"><div className="sidebar-label">Street type</div><div className="sidebar-value">{d.street_type}</div></div>}
            </div>
          </div>

          {/* ── LIFE HERE (Ch. 3) ── */}
          <div className={`chapter-panel ${activeTab === "life" ? "active" : ""}`} id="panel-life">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>03 — Life Here</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {d.lifestyle_vibe && (
                <p style={{fontFamily:"Georgia,serif", fontSize:"22px", fontWeight:400, color:"#f0ede8", lineHeight:1.5, margin:"0 0 16px", maxWidth:"540px"}}>
                  {d.lifestyle_vibe}
                </p>
              )}
              {d.best_for && (
                <p style={{fontFamily:"Georgia,serif", fontSize:"15px", color:"#a0a0a0", lineHeight:1.75, margin:"0 0 8px"}}>
                  Best suited for {d.best_for}.
                </p>
              )}

              <div style={{height:"1px", background:"#262626", margin:"24px 0"}}/>

              <div style={{display:"flex", flexDirection:"column"}}>
                {d.outdoor_description && d.outdoor_description !== "None" && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Outdoor Space</span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right", maxWidth:"55%"}}>{d.outdoor_description}</span>
                  </div>
                )}
                {d.noise_level_text && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Noise Character</span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.noise_level_text}</span>
                  </div>
                )}
              </div>

              <DeepIntelWidget
                open={widgets.life}
                onToggle={() => setWidgets(w => ({...w, life: !w.life}))}
                fields={["Convenience Score","Food Access Rating","Healthcare Proximity Index","Recreation Score","WFH Suitability Grade"]}
              />

            </div>

            <div className="panel-sidebar">
              {d.lifestyle_vibe && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Vibe</div><div className="sidebar-value">{d.lifestyle_vibe}</div></div>}
              {d.best_for && <div className="sidebar-block"><div className="sidebar-label">Best for</div><div className="sidebar-value">{d.best_for}</div></div>}
              {d.street_type && <div className="sidebar-block"><div className="sidebar-label">Street type</div><div className="sidebar-value">{d.street_type}</div></div>}
            </div>
          </div>

          {/* ── WHERE TO? (Ch. 4) ── */}
          <div className={`chapter-panel ${activeTab === "whereto" ? "active" : ""}`} id="panel-whereto">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>04 — Where To?</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              <div className="whereto-tabs" style={{marginBottom:"20px"}}>
                <button className={`whereto-tab-btn ${whereToTab === "map" ? "active" : ""}`} onClick={() => setWhereToTab("map")}>
                  <span className="btn-pulse"/>Tactical Map
                </button>
                <button className={`whereto-tab-btn ${whereToTab === "list" ? "active" : ""}`} onClick={() => setWhereToTab("list")}>
                  Directory List
                </button>
              </div>

              {whereToTab === "map" && (
                <div style={{height:"340px", borderRadius:"2px", overflow:"hidden", border:"0.5px solid #262626", marginBottom:"24px"}}>
                  <InteractiveMap lat={d.lat || d.latitude || 14.5547} lng={d.lng || d.longitude || 121.0244} propertyTitle={d.title} vicinityData={d.whereTo}/>
                </div>
              )}

              {whereToTab === "list" && d.whereTo && d.whereTo.length > 0 && (
                <div style={{display:"flex", flexDirection:"column", marginBottom:"24px"}}>
                  {d.whereTo.map((item, idx) => (
                    <div key={idx} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid #262626"}}>
                      <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                        <div style={{width:"5px", height:"5px", borderRadius:"50%", background:"#c8a96e", flexShrink:0}}/>
                        <div>
                          <div style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{item.name}</div>
                          {item.category && <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#8a8a8a", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:"2px"}}>{item.category}</div>}
                        </div>
                      </div>
                      <span style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#8a8a8a", letterSpacing:"0.1em", flexShrink:0}}>{item.distance}</span>
                    </div>
                  ))}
                </div>
              )}

              {whereToTab === "list" && (!d.whereTo || d.whereTo.length === 0) && (
                <div style={{padding:"32px", background:"#161616", border:"0.5px dashed #262626", borderRadius:"2px", textAlign:"center", fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#8a8a8a", letterSpacing:"0.12em", marginBottom:"24px"}}>
                  [ LOCATION BRIEFING N/A — NO DATA IN CMS ]
                </div>
              )}

              <DeepIntelWidget
                open={widgets.whereto}
                onToggle={() => setWidgets(w => ({...w, whereto: !w.whereto}))}
                fields={["Walkability Score","Transit Frequency Analysis","Peak Hour Commute Data","Zoning Classification","Development Pipeline"]}
              />

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
            </div>
          </div>

          {/* ── BUILD PLANS (Ch. 5) ── */}
          <div className={`chapter-panel ${activeTab === "buildplans" ? "active" : ""}`} id="panel-buildplans">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>05 — Build Plans</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              <p style={{fontFamily:"Georgia,serif", fontSize:"16px", color:"#f0ede8", lineHeight:1.8, margin:"0 0 28px", maxWidth:"520px"}}>
                Structural layout frameworks, permit certifications, and asset load diagnostics verified by ScoutIt&apos;s technical team.
              </p>

              <div style={{display:"flex", flexDirection:"column"}}>
                {[
                  { label:"Floor Plan", value:"Available", note:"Full multi-floor layout" },
                  { label:"Structural Report", value:"Certified", note:"Foundation & beam diagnostics" },
                  { label:"Permit Status", value:"Complete", note:"Building & occupancy certifications" },
                  { label:"Year Assessed", value:"2022", note:"Last technical assessment" },
                ].map(row => (
                  <div key={row.label} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid #262626"}}>
                    <div>
                      <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>{row.label}</div>
                      <div style={{fontFamily:"Georgia,serif", fontSize:"11px", color:"#6a6a6a", marginTop:"2px"}}>{row.note}</div>
                    </div>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#4caf7d"}}>{row.value}</span>
                  </div>
                ))}
              </div>

              <DeepIntelWidget
                open={widgets.buildplans}
                onToggle={() => setWidgets(w => ({...w, buildplans: !w.buildplans}))}
                fields={["Floor Plan Document Access","Structural Engineering Report","Occupancy Certificate","CCTV & Fire Safety Certification","Material Grade Assessment"]}
              />

            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Floor plan</div><div className="sidebar-value">Available</div><div className="sidebar-sub">Full layout</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Permit status</div><div className="sidebar-value" style={{color:"#4caf7d"}}>Complete</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Structure</div><div className="sidebar-value">Reinforced concrete</div></div>
            </div>
          </div>

          {/* ── HIDDEN INTEL (Ch. 6) ── */}
          <div className={`chapter-panel ${activeTab === "hiddenintel" ? "active" : ""}`} id="panel-hiddenintel">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>06 — Hidden Intel</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              <p style={{fontFamily:"Georgia,serif", fontSize:"16px", color:"#f0ede8", lineHeight:1.8, margin:"0 0 28px", maxWidth:"520px"}}>
                Off-market transaction histories, neighborhood capitalization yields, and macro trend forecasts available to Verified Scouts.
              </p>

              <DeepIntelWidget
                open={widgets.hiddenintel}
                onToggle={() => setWidgets(w => ({...w, hiddenintel: !w.hiddenintel}))}
                fields={["Last Transaction Date","Prior Sale Price","Ownership Transfer History","Area Average Cap Rate","Gross Rental Yield Estimate","12-Month Price Trend","MRT-7 Corridor Impact Analysis","Street View & Spatial Walkthrough"]}
              />

            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line" style={{background:"#c8a96e"}}/><div className="sidebar-label">Cap rate est.</div><div className="sidebar-value" style={{color:"#8a8a8a"}}>🔒 Locked</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Price trend</div><div className="sidebar-value" style={{color:"#8a8a8a"}}>🔒 Locked</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Intel source</div><div className="sidebar-value">ScoutIt Verified</div></div>
            </div>
          </div>

          {/* ── UNITS (Ch. 7) ── */}
          <div className={`chapter-panel ${activeTab === "units" ? "active" : ""}`} id="panel-units">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>07 — Units &amp; Spaces</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

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
                        if (u.name.toLowerCase().includes("suite") || u.name.toLowerCase().includes("master")) { targetIndex = 1 % photos.length; }
                        else if (u.name.toLowerCase().includes("room")) { const num = parseInt(u.name.replace(/\D/g, ""), 10); targetIndex = (isNaN(num) ? 1 : num) % photos.length; }
                        else if (u.name.toLowerCase().includes("bath") || u.name.toLowerCase().includes("washroom")) { targetIndex = (photos.length - 1) % photos.length; }
                        else if (u.name.toLowerCase().includes("kitchen") || u.name.toLowerCase().includes("utility")) { targetIndex = 1 % photos.length; }
                        else { targetIndex = 2 % photos.length; }
                        if (photos && photos.length > 0) setCurrentImageIndex(targetIndex);
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
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Total Areas</div><div className="sidebar-value">{dynamicUnits.length}</div><div className="sidebar-sub">Click to preview photos</div></div>
              {isRestaurant ? (
                <>{pill1Val && <div className="sidebar-block"><div className="sidebar-label">Dining Capacity</div><div className="sidebar-value">{pill1Val}</div></div>}{pill2Val && <div className="sidebar-block"><div className="sidebar-label">Kitchen Grade</div><div className="sidebar-value">{pill2Val}</div></div>}</>
              ) : isHospitality ? (
                <>{pill1Val && <div className="sidebar-block"><div className="sidebar-label">Accommodations</div><div className="sidebar-value">{pill1Val}</div></div>}{pill2Val && <div className="sidebar-block"><div className="sidebar-label">Hosting Capacity</div><div className="sidebar-value">{pill2Val}</div></div>}</>
              ) : isVenue ? (
                <>{pill1Val && <div className="sidebar-block"><div className="sidebar-label">Guest Capacity</div><div className="sidebar-value">{pill1Val}</div></div>}{pill2Val && <div className="sidebar-block"><div className="sidebar-label">Setup Grade</div><div className="sidebar-value">{pill2Val}</div></div>}</>
              ) : (
                <>{d.beds > 0 && <div className="sidebar-block"><div className="sidebar-label">Bedrooms</div><div className="sidebar-value">{d.beds} rooms</div></div>}{d.baths > 0 && <div className="sidebar-block"><div className="sidebar-label">Bathrooms</div><div className="sidebar-value">{d.baths} baths</div></div>}</>
              )}
            </div>
          </div>

          {/* ── UNIVERSE (Ch. 8) ── */}
          <div className={`chapter-panel ${activeTab === "universe" ? "active" : ""}`} id="panel-universe">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>08 — Property Universe</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              <div style={{display:"flex", flexDirection:"column", marginBottom:"28px"}}>
                {d.property_type && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Property Type</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.property_type}</span></div>}
                {d.tenure && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Tenure</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.tenure}</span></div>}
                {d.floor_sqm > 0 && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Floor Area</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.floor_sqm} sqm</span></div>}
                {d.lot_sqm > 0 && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Lot Area</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.lot_sqm} sqm</span></div>}
                {isRestaurant && pill1Val && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Dining Capacity</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{pill1Val}</span></div>}
                {isHospitality && pill1Val && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Accommodations</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{pill1Val}</span></div>}
                {isVenue && pill1Val && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Guest Capacity</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{pill1Val}</span></div>}
                {!isRestaurant && !isHospitality && !isVenue && d.beds > 0 && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Bedrooms</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.beds}</span></div>}
                {!isRestaurant && !isHospitality && !isVenue && d.baths > 0 && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Bathrooms</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.baths}</span></div>}
                {d.parking > 0 && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Parking</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.parking} covered</span></div>}
                {d.furnishing && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Furnishing</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.furnishing}</span></div>}
                {d.year_built && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Year Built</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.year_built}</span></div>}
                {d.title_status && <div style={{display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid #262626"}}><span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.12em", textTransform:"uppercase"}}>Title Status</span><span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#4caf7d"}}>{d.title_status}</span></div>}
              </div>

              {d.scoutit_verdict && (
                <>
                  <div style={{height:"1px", background:"#262626", margin:"0 0 20px"}}/>
                  <div className="verdict-block">
                    <div className="verdict-header"><div className="verdict-dot"/><div className="verdict-title">Space Intelligence Verdict</div></div>
                    <p className="verdict-text">{d.scoutit_verdict}</p>
                    {d.bestForTags && d.bestForTags.length > 0 && (
                      <div className="verdict-score">
                        {d.bestForTags.map((t, i) => <span key={i} className="verdict-pill">{t}</span>)}
                      </div>
                    )}
                  </div>
                </>
              )}

              <DeepIntelWidget
                open={widgets.universe}
                onToggle={() => setWidgets(w => ({...w, universe: !w.universe}))}
                fields={["Resale Potential Assessment","Rental Yield Estimate","Area Cap Rate Benchmark","MRT-7 Impact Analysis","5-Year Appreciation Trend"]}
              />

            </div>

            <div className="panel-sidebar">
              {d.title_status && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Title status</div><div className="sidebar-value">{d.title_status}</div></div>}
              {d.scoutit_verdict && <div className="sidebar-block"><div className="sidebar-label">Verdict</div><div className="sidebar-value" style={{color:"#4caf7d", fontSize:"12px", lineHeight:1.4}}>{d.scoutit_verdict}</div></div>}
            </div>
          </div>

          {/* ── EXPANSION NODE ── */}
          <div className={`chapter-panel ${activeTab === "expansion" ? "active" : ""}`} id="panel-expansion">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>09 — Expansion Node</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              <div className="verdict-block" style={{marginTop:"8px"}}>
                <div className="verdict-header"><div className="verdict-dot" style={{background:"#c8a96e"}}/><div className="verdict-title" style={{color:"#c8a96e"}}>Layer V7 — Pipeline Active</div></div>
                <p className="verdict-text" style={{fontFamily:"'Courier New',monospace", fontSize:"11px", letterSpacing:"0.12em", textTransform:"uppercase", color:"#8a8a8a"}}>
                  [ ENGINES COMPILING // LAYER V7 PIPELINE INJECTS COMING SOON ]
                </p>
              </div>

              <div style={{display:"flex", flexDirection:"column", gap:"8px", marginTop:"16px"}}>
                {["Comparative Market Analysis Engine","AR Property Visualization Layer","AI-Powered Space Scoring Matrix","Macro Investment Signal Feed","Live Broker Negotiation Tracker"].map((item, i) => (
                  <div key={i} style={{display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", background:"#161616", border:"0.5px solid #262626", borderRadius:"2px", opacity:0.5}}>
                    <div style={{width:"5px", height:"5px", borderRadius:"50%", background:"#c8a96e", flexShrink:0}}/>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#8a8a8a", lineHeight:1.5}}>{item}</span>
                    <span style={{marginLeft:"auto", fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.1em", textTransform:"uppercase"}}>Soon</span>
                  </div>
                ))}
              </div>

            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line" style={{background:"#c8a96e"}}/><div className="sidebar-label">Pipeline status</div><div className="sidebar-value" style={{color:"#c8a96e"}}>V7 Compiling</div></div>
              <div className="sidebar-block"><div className="sidebar-label">ETA</div><div className="sidebar-value">Incoming</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Features queued</div><div className="sidebar-value">5</div></div>
            </div>
          </div>

          {/* ── YOUR MOVE ── */}
          <div className={`chapter-panel ${activeTab === "yourmove" ? "active" : ""}`} id="panel-yourmove">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>10 — Your Move</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              <div style={{margin:"20px 0 28px", padding:"20px 24px", background:"#161616", border:"0.5px solid #262626", borderRadius:"2px"}}>
                <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(22px,3vw,30px)", fontWeight:400, letterSpacing:"0.04em", color:"#f0ede8"}}>Price Upon Inquiry</div>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.16em", color:"#8a8a8a", marginTop:"8px"}}>Confirmed directly with the listed advisor</div>
              </div>

              <div className="reactions-container" style={{marginTop:"0", display:"flex", flexDirection:"column", gap:"10px"}}>
                <p style={{fontFamily:"'Courier New',monospace", fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.2em", color:"#8a8a8a", marginBottom:"16px"}}>HOW DOES THIS SPACE MAKE YOU FEEL?</p>
                <ReactionButtons propertyId={slug || "batasan-hills"} propertyTitle={d.title} category={d.property_type} city={d.city}/>
              </div>

              <div style={{height:"1px", background:"#262626", margin:"24px 0"}}/>

              <div style={{marginTop:"0"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"12px"}}>Assigned Representative</div>
                <div className="broker-card">
                  <div className="broker-avatar">{brokerInitials}</div>
                  <div className="broker-info">
                    <div className="broker-name-el">{d.broker_name}</div>
                    <div className="broker-meta">Direct Listing</div>
                    <div className="broker-rating" style={{color:"#4caf7d"}}>Verified broker</div>
                  </div>
                </div>
              </div>

              <Link href={`/property/${slug || "batasan-hills"}/brokers`} className="move-cta" style={{textDecoration:"none", marginTop:"16px"}}>
                Inquire with Advisor →
              </Link>

              <p style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#8a8a8a", lineHeight:"1.8", marginTop:"20px", letterSpacing:"0.06em"}}>
                Pricing is not displayed on ScoutIt in compliance with Philippine real estate disclosure standards. Contact the listed advisor or owner directly to confirm the current asking price, payment terms, and availability.
              </p>

              <p style={{fontFamily:"Georgia,serif", fontSize:"13px", color:"#8a8a8a", lineHeight:1.7, marginTop:"12px"}}>
                ScoutIt is a spatial intelligence archive. In compliance with R.A. 9646, all site walks, direct inquiries, and purchase offers are facilitated exclusively by licensed, authorized real estate brokers.
              </p>

            </div>

            <div className="panel-sidebar">
              {d.tenure && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Acquisition</div><div className="sidebar-value">{d.tenure}</div>{d.title_status && <div className="sidebar-sub">{d.title_status}</div>}</div>}
              {d.scoutit_verdict && <div className="sidebar-block"><div className="sidebar-label">ScoutIt verdict</div><div className="sidebar-value" style={{color:"#4caf7d", fontSize:"12px", lineHeight:1.4}}>{d.scoutit_verdict}</div></div>}
            </div>
          </div>

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
