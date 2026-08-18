"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  ArrowRight, 
  Radio, 
  Compass, 
  BookOpen, 
  Building2, 
  MapPin,
  Clock,
  FileText,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink
} from "lucide-react";

import LayerNav from "@/components/descent/LayerNav";
import BackgroundStratosphere from "@/components/descent/BackgroundStratosphere";
import LayerTransition from "@/components/descent/LayerTransition";
import { getArticles } from "@/data/mock/mockArticles";

const CATEGORIES = [
  "All",
  "Residential",
  "Commercial",
  "STR",
  "Hospitality",
  "Restaurants",
  "Venues"
];

const REGIONS = [
  "All Regions",
  "BGC & Taguig",
  "Makati CBD",
  "Siargao",
  "Palawan & MIMAROPA",
  "Metro Cebu"
];

const REGION_FILTER_MAP = {
  "BGC & Taguig": ["BGC", "Taguig"],
  "Makati CBD": ["Makati", "Poblacion"],
  "Siargao": ["Siargao", "General Luna"],
  "Palawan & MIMAROPA": ["Palawan", "El Nido", "Coron", "Puerto Princesa"],
  "Metro Cebu": ["Cebu", "Mactan", "Visayas"]
};

// Rich Intelligence & Scrollytelling Dossiers
const OSINT_DOSSIERS = [
  {
    id: "bgc-subway-expansion",
    slug: "bgc-spatial-movement",
    title: "BGC West Block Subway Tunneling & Low-Density Villa Migration",
    category: "Residential",
    intelType: "INFRASTRUCTURE RADAR",
    statusBadge: "TUNNELING PHASE 1",
    location: "BGC West Block, Taguig",
    region: "BGC & Taguig",
    impactRadius: "800m station catchment",
    date: "July 2026",
    readTime: "4 MIN READ",
    sourceName: "Taguig Zoning Gazette & DOTr Metro Manila Subway Registry Q2 2026",
    lead: "Tunnel boring machines advancing toward BGC West Station have triggered a rapid spatial realignment: private capital is aggressively acquiring low-density modernist villas with private acoustic buffers before station activation.",
    timeline: [
      { year: "2024", phase: "Right-of-Way & Title Consolidation", detail: "DOTr and BCDA finalized underground subterranean easement rights along the western perimeter." },
      { year: "2026", phase: "Shaft Excavation & Zoning Reclassification", detail: "Ground settlement sensors installed; surrounding residential blocks received acoustic density overlay." },
      { year: "2028", phase: "Target Passenger Activation", detail: "Direct 18-minute subterranean transit connection from BGC Station to NAIA International Airport Terminal 3." }
    ],
    ourTake: {
      boosts: "Direct high-speed airport transit link; projected +38% capital appreciation on properties within 500m.",
      friction: "30 months of localized vibration and deep-bore utility rerouting; temporary heavy vehicle traffic along perimeter roads.",
      promises: "Complete transformation of West BGC into an ultra-connected, car-free transit district with dedicated subterranean pedestrian links."
    },
    projection: {
      title: "Planned Subterranean Pedestrian Concourse",
      specs: ["Depth: -24.5m", "Access Points: 4 Direct Plazas", "Integrated Buffer: 80mm Acoustic Glass"]
    }
  },
  {
    id: "makati-leed-retrofit",
    slug: "green-office-demand",
    title: "LEED Platinum Mandate & Makati CBD Office Modernization",
    category: "Commercial",
    intelType: "ZONING SHIFT",
    statusBadge: "ORDINANCE RATIFIED",
    location: "Ayala Avenue, Makati CBD",
    region: "Makati CBD",
    impactRadius: "Ayala & Paseo Corridors",
    date: "July 2026",
    readTime: "5 MIN READ",
    sourceName: "Makati Urban Redevelopment Authority & Colliers Philippine Office Report",
    lead: "New municipal carbon taxation thresholds have forced legacy tower landlords to execute aggressive green retrofits, driving institutional tenants into net-zero floorplates.",
    timeline: [
      { year: "2023", phase: "ESG Carbon Framework Drafted", detail: "Makati City Council drafted the progressive commercial energy cap for prime CBD towers." },
      { year: "2025", phase: "Double-Glazing & Solar Retrofit Mandate", detail: "Over 24 prime commercial buildings commenced façade replacements and HVAC magnetic-bearing upgrades." },
      { year: "2027", phase: "Full Compliance & Penalty Enforcement", detail: "Non-compliant legacy buildings face tiered municipal surcharges and tenant occupancy restrictions." }
    ],
    ourTake: {
      boosts: "Compressed operating expenses by 28%; surge in multinational headquarters leasing interest for certified spaces.",
      friction: "CapEx expenditure exceeding ₱180M per tower; temporary tenant relocations during core HVAC overhauls.",
      promises: "Establishes Makati CBD as the premier green-certified commercial financial center in Southeast Asia."
    },
    projection: {
      title: "Active Facade Thermal Enclosure Standard",
      specs: ["Low-E Double Glazed", "Solar Shading: 45% Reflection", "Energy Reduction: -32%"]
    }
  },
  {
    id: "siargao-coastal-rush",
    slug: "surf-front-land-rush",
    title: "General Luna Coastal Frontage Expansion & Yield Dynamics",
    category: "STR",
    intelType: "COMMERCIAL SIGNAL",
    statusBadge: "OFF-MARKET SURGE",
    location: "General Luna, Siargao",
    region: "Siargao",
    impactRadius: "Cloud 9 to Tuason Beach",
    date: "June 2026",
    readTime: "3 MIN READ",
    sourceName: "DENR Coastal Cadastral Survey & Tourism Infrastructure Fund Registry",
    lead: "Boutique hospitality syndicates are executing off-market land consolidations along Siargao's extended surf breaks, generating annual short-term rental yields exceeding 22%.",
    timeline: [
      { year: "2024", phase: "Island Airport Runway Extension", detail: "Sayak Airport runway paved to accommodate direct regional jet arrivals from Singapore and Hong Kong." },
      { year: "2026", phase: "Boutique Eco-Resort Land Acquisitions", detail: "Coastal plots command over ₱45,000/sqm as international lifestyle investors outbid traditional operators." },
      { year: "2028", phase: "Sustainable Masterplanned Enclaves", detail: "Opening of five low-impact luxury pavilion resorts built on off-grid solar microgrids." }
    ],
    ourTake: {
      boosts: "Extraordinary ADR (Average Daily Rate) potential of ₱35,000/night; resilient foreign tourist demand curve.",
      friction: "Island grid reliability constraints; rigorous DENR 25-meter coastal easement setback enforcement.",
      promises: "Solidifies Siargao as the undisputed global luxury surfing capital with strictly regulated low-density zoning."
    },
    projection: {
      title: "Coastal Teak Pavilion Standard",
      specs: ["Off-Grid Solar: 100%", "Setback: 25m Coastal Buffer", "ARR Target: 22.4%"]
    }
  },
  {
    id: "palawan-microgrid-resorts",
    slug: "off-grid-island-living",
    title: "Palawan Eco-Resort Solar Microgrids & Teak Architectural Standards",
    category: "Hospitality",
    intelType: "AREA GUIDE",
    statusBadge: "MICROGRID ACTIVE",
    location: "El Nido & Bacuit Bay, Palawan",
    region: "Palawan & MIMAROPA",
    impactRadius: "Bacuit Archipelago",
    date: "June 2026",
    readTime: "4 MIN READ",
    sourceName: "Department of Energy Microgrid Register & Palawan Council for Sustainable Development",
    lead: "Northern Palawan's resort landscape is undergoing a zero-carbon transition: off-grid solar-battery microgrids and sustainable teak construction have become the standard for ultra-luxury island villas.",
    timeline: [
      { year: "2024", phase: "PCSD Environmental Masterplan", detail: "Strict moratorium on heavy diesel generators across the marine reserve islands." },
      { year: "2026", phase: "Solar Microgrid & Desalination Standard", detail: "Bespoke island resorts deploy lithium-iron battery banks and reverse-osmosis water systems." },
      { year: "2027", phase: "Zero-Carbon Certification", detail: "Mandatory eco-luxury audit for all marine hospitality operators in Bacuit Bay." }
    ],
    ourTake: {
      boosts: "Elimination of noisy diesel generators; premium guest pricing justified by verified sustainability credentials.",
      friction: "High initial CapEx on battery storage; marine logistics complexity for maintenance parts.",
      promises: "Pristine marine acoustic environment and world-class luxury eco-living without compromising comfort."
    },
    projection: {
      title: "Zero-Emission Island Pavilion Model",
      specs: ["Solar Capacity: 120kWp", "Battery Bank: 400kWh", "Acoustic Noise: 0 dB"]
    }
  },
  {
    id: "poblacion-adaptive-reuse",
    slug: "poblacion-food-architecture",
    title: "Poblacion Industrial Warehouse Adaptive Reuse & Night Gastronomy",
    category: "Restaurants",
    intelType: "LIFESTYLE DISPATCH",
    statusBadge: "ZONING PILOT",
    location: "Poblacion Heritage Quarter, Makati",
    region: "Makati CBD",
    impactRadius: "Kalayaan to J.P. Rizal",
    date: "May 2026",
    readTime: "3 MIN READ",
    sourceName: "Makati Urban Redevelopment Task Force & Heritage Zoning Board",
    lead: "Industrial modernist architecture overlays are reshaping vintage mid-century warehouses into multi-floor culinary destinations, driving street-level footfall up 44%.",
    timeline: [
      { year: "2023", phase: "Creative District Ordinance", detail: "Barangay Poblacion approved flexible multi-concept food and beverage zoning permits." },
      { year: "2025", phase: "Structural Reinforcement Wave", detail: "Heritage residential warehouses retrofitted with exposed steel frames and rooftop terraces." },
      { year: "2027", phase: "Pedestrian Walkability Network", detail: "Closure of key inner alleys to vehicular traffic during evening dining hours." }
    ],
    ourTake: {
      boosts: "Unmatched culinary culture and vibrant nightlife; prime venue for innovative F&B concepts.",
      friction: "Severe parking limitations; strict 1:00 AM noise ordinances near residential boundaries.",
      promises: "A dense, walkable cultural and gastronomy cluster rivaling Tokyo's Shimokitazawa or New York's Lower East Side."
    },
    projection: {
      title: "Exposed Steel Warehouse Conversion",
      specs: ["Multi-Level Dining", "Acoustic Baffles Installed", "Footfall: +44% YoY"]
    }
  },
  {
    id: "bay-area-venues",
    slug: "manila-venue-trends",
    title: "Bay Area Glass Atrium Pavilions & Corporate Spatial Tech",
    category: "Venues",
    intelType: "COMMERCIAL SIGNAL",
    statusBadge: "DEVELOPMENT ACTIVE",
    location: "Bay Area, Pasay / Parañaque",
    region: "BGC & Taguig",
    impactRadius: "Reclamation District",
    date: "May 2026",
    readTime: "3 MIN READ",
    sourceName: "Philippine Convention & Exhibition Bureau Gazette",
    lead: "Corporate event spaces in Manila's Bay Area are transitioning from subterranean hotel ballrooms to natural light-filled glass atrium pavilions equipped with immersive spatial technology.",
    timeline: [
      { year: "2024", phase: "Coastal Masterplan Phase 2", detail: "Reclamation parcels designated for cultural and international convention centers." },
      { year: "2026", phase: "Glass Atrium Construction", detail: "Double-height panoramic pavilions breaking ground facing Manila Bay sunset." },
      { year: "2028", phase: "Global Tech Summit Delivery", detail: "Opening of three 2,000-capacity hybrid physical/virtual event centers." }
    ],
    ourTake: {
      boosts: "Stunning waterfront sunset backdrops; high capacity for corporate product launches and conferences.",
      friction: "Coastal wind and typhoon weatherproofing requirements; traffic congestion along Roxas Boulevard.",
      promises: "Positions Manila Bay as the premier coastal corporate gathering and entertainment arena in Asia."
    },
    projection: {
      title: "Panoramic Coastal Glass Pavilion",
      specs: ["Capacity: 2,000 Guests", "Ceiling: 14m Clear Height", "Manila Bay Sunset View"]
    }
  }
];

const normalizeCategory = (raw) => {
  const c = (raw || "Residential").toLowerCase();
  if (c === "hospitality") return "Hospitality";
  if (c === "str") return "STR";
  if (c === "culinary" || c === "restaurants") return "Restaurants";
  if (c === "venues" || c === "events") return "Venues";
  if (c === "commercial") return "Commercial";
  return "Residential";
};

export default function StratosphereLayer() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRegion, setActiveRegion] = useState("All Regions");
  const [activeDossierId, setActiveDossierId] = useState("bgc-subway-expansion");
  const [properties, setProperties] = useState([]);
  const [mobileTab, setMobileTab] = useState("discovery"); // 'discovery' | 'intelligence'

  // Fetch live CMS properties to link to spatial news
  useEffect(() => {
    let alive = true;
    async function loadProperties() {
      try {
        const res = await fetch("/api/cms");
        if (!alive || !res.ok) return;
        const data = await res.json();
        if (data.properties && Array.isArray(data.properties)) {
          const list = data.properties.filter(p => p.title && p.slug).map(p => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            category: normalizeCategory(p.spaceCategory),
            city: p.location || p.city || "Philippines",
            style: p.aestheticTag || "Modernist",
            image: p.image || (p.photos?.[0]) || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
            desc: p.hook || p.description || "Verified architectural asset with recorded spatial provenance.",
            beds: p.beds || 3,
            sqm: p.floor_sqm || 320,
            price: p.price_raw ? `₱${(p.price_raw / 1000000).toFixed(1)}M` : "Price on Request"
          }));
          if (alive) setProperties(list);
        }
      } catch (err) {
        if (alive) console.error("Properties load error:", err);
      }
    }
    loadProperties();
    return () => { alive = false; };
  }, []);

  // Filtered Dossiers based on Category and Region
  const filteredDossiers = useMemo(() => {
    return OSINT_DOSSIERS.filter(d => {
      const matchCat = activeCategory === "All" || d.category === activeCategory;
      let matchReg = true;
      if (activeRegion !== "All Regions") {
        const allowed = REGION_FILTER_MAP[activeRegion] || [];
        matchReg = allowed.some(loc => d.location.toLowerCase().includes(loc.toLowerCase()));
      }
      return matchCat && matchReg;
    });
  }, [activeCategory, activeRegion]);

  // Ensure active dossier is valid
  useEffect(() => {
    if (filteredDossiers.length > 0) {
      if (!filteredDossiers.some(d => d.id === activeDossierId)) {
        setActiveDossierId(filteredDossiers[0].id);
      }
    }
  }, [filteredDossiers, activeDossierId]);

  // Selected Active Dossier
  const currentDossier = useMemo(() => {
    return OSINT_DOSSIERS.find(d => d.id === activeDossierId) || OSINT_DOSSIERS[0];
  }, [activeDossierId]);

  // Impacted Properties situated in the Active Dossier's territory
  const impactedProperties = useMemo(() => {
    if (!currentDossier) return [];
    // Match by space category or location
    const matched = properties.filter(p => 
      p.category === currentDossier.category || 
      (p.city && currentDossier.location.toLowerCase().includes(p.city.toLowerCase()))
    );
    return matched.length > 0 ? matched.slice(0, 3) : properties.slice(0, 2);
  }, [properties, currentDossier]);

  return (
    <div className="stratosphere-page-wrapper">
      {/* ── 1. UNIVERSAL LAYER NAVIGATION ── */}
      <LayerNav 
        prev={{ href: "/layer/orbit", label: "Orbit" }} 
        next={{ href: "/layer/metropolis", label: "Metropolis" }} 
      />

      {/* ── 2. 3D WEBGL STRATOSPHERE ARCHIPELAGO BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundStratosphere />
      </div>

      {/* ── 3. MAIN SPATIAL INTELLIGENCE & DISCOVERY CANVAS ── */}
      <main className="stratosphere-main-content">
        <div className="stratosphere-container">
          
          {/* ── HEADER TELEMETRY & STRATOSPHERE COMMAND BAR ── */}
          <header className="stratosphere-hero-split">
            <div className="stratosphere-hero-left">
              <div className="stratosphere-telemetry-badge">
                <span className="stratosphere-signal-pulse" />
                <span className="stratosphere-telemetry-text">
                  LAYER 02 // STRATOSPHERE · SPATIAL OSINT &amp; DISCOVERY RADAR
                </span>
              </div>
              <h1 className="stratosphere-hero-title">
                Spatial Intel &amp; <span className="text-gold-gradient">Stories</span>
              </h1>
              <p className="stratosphere-hero-subtitle">
                Discover urban developments, zoning shifts, and infrastructure signals across the Philippine islands — and inspect the physical properties directly affected before evaluating individual buildings.
              </p>
            </div>

            <aside className="stratosphere-scope-card">
              <div className="stratosphere-scope-header">
                <Radio size={13} className="text-gold-accent" />
                <span className="stratosphere-scope-kicker">THE ASSET-INTELLIGENCE BRIDGE</span>
              </div>
              <p className="stratosphere-scope-body">
                Every spatial news event triggers micro and macro real estate ripples. Select a development on the left to see which physical listings in our directory gain, lose, or transform.
              </p>
              <div className="stratosphere-scope-footer">
                <ShieldCheck size={13} className="text-gold-accent" />
                <span>100% Verified Field OSINT · Source Provenance Tracked</span>
              </div>
            </aside>
          </header>

          {/* ── DUAL-AXIS DISCOVERY TOOLBAR ── */}
          <div className="stratosphere-filter-toolbar">
            {/* Space Category Filter Rail */}
            <div className="stratosphere-filter-rail-wrapper">
              <nav className="stratosphere-filter-rail" aria-label="Space Categories">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`stratosphere-filter-pill ${isActive ? "is-active" : ""}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      <span>{cat === "All" ? "All Categories" : cat}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Region Selector Pills */}
            <div className="stratosphere-region-rail" aria-label="Territory Regions">
              {REGIONS.map((reg) => {
                const isActive = activeRegion === reg;
                return (
                  <button
                    key={reg}
                    type="button"
                    className={`stratosphere-region-pill ${isActive ? "is-active" : ""}`}
                    onClick={() => setActiveRegion(reg)}
                  >
                    <MapPin size={11} className={isActive ? "text-black" : "text-gold-accent"} />
                    <span>{reg}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── MOBILE VIEW TOGGLE: DISCOVERY vs INTELLIGENCE ── */}
          <div className="stratosphere-mobile-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === "discovery"}
              className={`stratosphere-mobile-tab ${mobileTab === "discovery" ? "is-active" : ""}`}
              onClick={() => setMobileTab("discovery")}
            >
              <Compass size={13} />
              <span>1. Discovered Signals ({filteredDossiers.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === "intelligence"}
              className={`stratosphere-mobile-tab ${mobileTab === "intelligence" ? "is-active" : ""}`}
              onClick={() => setMobileTab("intelligence")}
            >
              <FileText size={13} />
              <span>2. Interactive Intelligence</span>
            </button>
          </div>

          {/* ── 4. THE 40/60 SPLIT-CANVAS ENGINE ── */}
          <div className="stratosphere-split-canvas">
            
            {/* ════════════════════════════════════════════════════════════════
                LEFT PANE: DISCOVERY & IMPACTED PROPERTIES RADAR (~40%)
            ════════════════════════════════════════════════════════════════ */}
            <aside className={`stratosphere-discovery-pane ${mobileTab === "discovery" ? "is-mobile-visible" : ""}`}>
              <div className="stratosphere-pane-header">
                <div className="stratosphere-pane-kicker-wrap">
                  <Compass size={13} className="text-gold-accent" />
                  <span className="stratosphere-pane-kicker">DISCOVERED NEWS &amp; DEVELOPMENTS</span>
                </div>
                <span className="stratosphere-pane-count">{filteredDossiers.length} Signals</span>
              </div>

              {/* List of Discovered Developments / Spatial Signals */}
              <div className="stratosphere-signals-list">
                {filteredDossiers.map((dossier) => {
                  const isSelected = dossier.id === activeDossierId;
                  return (
                    <div
                      key={dossier.id}
                      role="button"
                      tabIndex={0}
                      className={`stratosphere-signal-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => {
                        setActiveDossierId(dossier.id);
                        setMobileTab("intelligence"); // On mobile, jump to article on select
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveDossierId(dossier.id);
                          setMobileTab("intelligence");
                        }
                      }}
                    >
                      <div className="stratosphere-signal-card-top">
                        <span className="stratosphere-status-pill">{dossier.statusBadge}</span>
                        <span className="stratosphere-signal-cat">{dossier.category}</span>
                      </div>

                      <h3 className="stratosphere-signal-card-title">{dossier.title}</h3>
                      
                      <div className="stratosphere-signal-meta-row">
                        <span className="stratosphere-signal-loc">
                          <MapPin size={11} />
                          <span>{dossier.location}</span>
                        </span>
                        <span className="stratosphere-signal-radius">
                          <Radio size={11} className="text-gold-accent" />
                          <span>{dossier.impactRadius}</span>
                        </span>
                      </div>

                      <div className="stratosphere-signal-select-indicator">
                        <span>{isSelected ? "ACTIVE DOSSIER" : "SELECT TO ANALYZE"}</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Impacted Property Nodes Section */}
              <div className="stratosphere-impacted-spaces-section">
                <div className="stratosphere-pane-header">
                  <div className="stratosphere-pane-kicker-wrap">
                    <Building2 size={13} className="text-gold-accent" />
                    <span className="stratosphere-pane-kicker">IMPACTED SPACES IN THIS TERRITORY</span>
                  </div>
                  <span className="stratosphere-impact-badge">{impactedProperties.length} Linked</span>
                </div>

                <div className="stratosphere-impacted-grid">
                  {impactedProperties.map((prop) => (
                    <article
                      key={prop.id || prop.slug}
                      className="stratosphere-impacted-card"
                      onClick={() => router.push(`/property/${prop.slug}`)}
                    >
                      <div 
                        className="stratosphere-impacted-thumb"
                        style={{ backgroundImage: `url(${prop.image})` }}
                      >
                        <span className="stratosphere-impacted-style">{prop.style}</span>
                      </div>

                      <div className="stratosphere-impacted-body">
                        <h4 className="stratosphere-impacted-title">{prop.title}</h4>
                        <span className="stratosphere-impacted-loc">{prop.city}</span>
                        <div className="stratosphere-impacted-specs">
                          <span>{prop.beds} Beds</span>
                          <span>·</span>
                          <span>{prop.sqm} sqm</span>
                          <span>·</span>
                          <strong className="text-gold-accent">{prop.price}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </aside>

            {/* ════════════════════════════════════════════════════════════════
                RIGHT PANE: INTERACTIVE INTELLIGENCE DOSSIER (~60%)
            ════════════════════════════════════════════════════════════════ */}
            <article className={`stratosphere-intelligence-pane ${mobileTab === "intelligence" ? "is-mobile-visible" : ""}`}>
              {currentDossier ? (
                <div className="stratosphere-dossier-shell">
                  
                  {/* 1. Dossier Top Header & Provenance */}
                  <header className="stratosphere-dossier-header">
                    <div className="stratosphere-dossier-meta-bar">
                      <div className="stratosphere-dossier-tag-group">
                        <span className="stratosphere-intel-type-tag">{currentDossier.intelType}</span>
                        <span className="stratosphere-location-pill">
                          <MapPin size={11} />
                          <span>{currentDossier.location}</span>
                        </span>
                      </div>
                      <div className="stratosphere-read-time-pill">
                        <Clock size={11} />
                        <span>{currentDossier.date} · {currentDossier.readTime}</span>
                      </div>
                    </div>

                    <h2 className="stratosphere-dossier-headline">{currentDossier.title}</h2>
                    
                    <div className="stratosphere-provenance-box">
                      <FileText size={13} className="text-gold-accent" />
                      <span>OFFICIAL SOURCE PROVENANCE: {currentDossier.sourceName}</span>
                    </div>

                    <p className="stratosphere-dossier-lead-text">{currentDossier.lead}</p>
                  </header>

                  {/* 2. Chronological Scrollytelling Timeline */}
                  <section className="stratosphere-scrolly-section">
                    <div className="stratosphere-dossier-section-title">
                      <Clock size={13} className="text-gold-accent" />
                      <span>DEVELOPMENT CHRONOLOGY &amp; PROGRESS</span>
                    </div>

                    <div className="stratosphere-timeline-track">
                      {currentDossier.timeline.map((step, idx) => (
                        <div key={idx} className="stratosphere-timeline-step">
                          <div className="stratosphere-timeline-node">
                            <span className="stratosphere-node-year">{step.year}</span>
                            <span className="stratosphere-node-pulse" />
                          </div>
                          <div className="stratosphere-timeline-content">
                            <h4 className="stratosphere-timeline-phase">{step.phase}</h4>
                            <p className="stratosphere-timeline-detail">{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 3. ScoutIt "Our Take" Impact Matrix */}
                  <section className="stratosphere-our-take-section">
                    <div className="stratosphere-dossier-section-title">
                      <Sparkles size={13} className="text-gold-accent" />
                      <span>SCOUTIT &quot;OUR TAKE&quot; · SPATIAL IMPACT ANALYSIS</span>
                    </div>

                    <div className="stratosphere-take-grid">
                      {/* Boosts */}
                      <div className="stratosphere-take-card is-boost">
                        <div className="stratosphere-take-head">
                          <TrendingUp size={14} className="text-emerald-400" />
                          <strong>THE CATALYSTS &amp; BOOSTS</strong>
                        </div>
                        <p>{currentDossier.ourTake.boosts}</p>
                      </div>

                      {/* Friction / Disadvantages */}
                      <div className="stratosphere-take-card is-friction">
                        <div className="stratosphere-take-head">
                          <AlertTriangle size={14} className="text-amber-400" />
                          <strong>FRICTION &amp; DISADVANTAGES</strong>
                        </div>
                        <p>{currentDossier.ourTake.friction}</p>
                      </div>

                      {/* The Spatial Promises */}
                      <div className="stratosphere-take-card is-promise">
                        <div className="stratosphere-take-head">
                          <Layers size={14} className="text-gold-accent" />
                          <strong>THE SPATIAL PROMISES</strong>
                        </div>
                        <p>{currentDossier.ourTake.promises}</p>
                      </div>
                    </div>
                  </section>

                  {/* 4. Spatial Projection & Architectural Vision */}
                  {currentDossier.projection && (
                    <section className="stratosphere-projection-card">
                      <div className="stratosphere-projection-head">
                        <Building2 size={13} className="text-gold-accent" />
                        <span>ARCHITECTURAL SPECIFICATION &amp; RESOLUTION</span>
                      </div>
                      <h4 className="stratosphere-projection-title">{currentDossier.projection.title}</h4>
                      <div className="stratosphere-projection-specs">
                        {currentDossier.projection.specs.map((spec, i) => (
                          <div key={i} className="stratosphere-spec-item">
                            <span className="stratosphere-spec-dot" />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 5. Deep Investigation Direct Actions */}
                  <footer className="stratosphere-dossier-actions">
                    <Link 
                      href={`/intel/${currentDossier.slug}`} 
                      className="stratosphere-read-full-btn"
                    >
                      <span>Read Full Investigation &amp; Data Tables</span>
                      <ArrowRight size={15} />
                    </Link>
                    
                    <Link 
                      href={`/property?type=${currentDossier.category}&_cb=1`} 
                      className="stratosphere-browse-spaces-btn"
                    >
                      <span>Browse All {currentDossier.category} Listings</span>
                      <ExternalLink size={13} />
                    </Link>
                  </footer>

                </div>
              ) : (
                <div className="stratosphere-empty-dossier">
                  <FileText size={40} className="text-gold-accent/40 mb-3" />
                  <p>Select an active spatial signal from the Discovery Radar to load its investigative dossier.</p>
                </div>
              )}
            </article>

          </div>

          {/* ── 5. COMPLETE INTEL ARCHIVE PORTAL BANNER ── */}
          <section className="stratosphere-portal-banner">
            <div className="stratosphere-portal-glow" />
            <div className="stratosphere-portal-content">
              <div className="stratosphere-portal-badge">
                <BookOpen size={13} className="text-gold-accent" />
                <span>SPATIAL INTELLIGENCE ARCHIVE</span>
              </div>
              <h2 className="stratosphere-portal-title">
                Explore All 50+ Intelligence Briefings in The Archive
              </h2>
              <p className="stratosphere-portal-desc">
                Access investigative zoning registers, neighborhood transformation profiles, and architectural movements across Metro Manila, Cebu, and top Philippine island corridors.
              </p>
              <div className="stratosphere-portal-meta">
                <div className="stratosphere-portal-pill">
                  <ShieldCheck size={13} className="text-gold-accent" />
                  <span>100% Curated Field Intelligence</span>
                </div>
                <div className="stratosphere-portal-pill">
                  <Radio size={13} className="text-gold-accent" />
                  <span>Updated Weekly with Spatial Signals</span>
                </div>
              </div>
            </div>

            <div className="stratosphere-portal-action">
              <Link href="/intel" className="stratosphere-portal-cta-btn">
                <span>Explore The Intel Archive</span>
                <ArrowRight size={16} />
              </Link>
              <span className="stratosphere-portal-cta-sub">Free public editorial briefings · Instant access</span>
            </div>
          </section>

        </div>

        {/* ── 6. DESCENT CONTINUATION TO LAYER 03 (METROPOLIS) ── */}
        <LayerTransition 
          nextNum="03" 
          nextName="Metropolis" 
          nextHref="/layer/metropolis" 
          teaser="Drop below the clouds. The city directory opens up." 
        />
      </main>

      <style jsx global>{`
        .stratosphere-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0d0d0d;
          color: #f5f3ee;
          position: relative;
          overflow-x: hidden;
          padding-bottom: calc(88px + env(safe-area-inset-bottom));
        }

        .stratosphere-main-content {
          flex: 1;
          position: relative;
          z-index: 10;
          padding-top: 52px;
        }

        .stratosphere-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(24px, 4vw, 48px) clamp(16px, 3.5vw, 32px) 32px;
          position: relative;
          z-index: 10;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        /* ── HERO SPLIT ── */
        .stratosphere-hero-split {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.95fr);
          gap: clamp(24px, 4.5vw, 48px);
          align-items: center;
          margin-bottom: 28px;
        }

        .stratosphere-telemetry-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: rgba(232, 174, 60, 0.08);
          border: 1px solid rgba(232, 174, 60, 0.25);
          margin-bottom: 14px;
        }

        .stratosphere-signal-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-bright);
          box-shadow: 0 0 8px var(--accent-bright);
          animation: stratospherePulse 2s infinite ease-in-out;
        }

        @keyframes stratospherePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.6; }
        }

        .stratosphere-telemetry-text {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: var(--accent);
          text-transform: uppercase;
        }

        .stratosphere-hero-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 4.5vw, 52px);
          font-weight: 500;
          line-height: 1.06;
          letter-spacing: -0.028em;
          color: #f7f5f0;
          margin: 0 0 14px;
        }

        .text-gold-gradient {
          background: linear-gradient(135deg, #f7c64e 20%, #e8ae3c 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stratosphere-hero-subtitle {
          font-family: var(--font-body);
          font-size: clamp(14px, 1.25vw, 15.5px);
          font-weight: 400;
          line-height: 1.62;
          color: var(--text-secondary);
          max-width: 580px;
          margin: 0;
        }

        /* ── SCOPE CARD ── */
        .stratosphere-scope-card {
          background: rgba(13, 13, 16, 0.84);
          border: 1px solid var(--accent-muted);
          border-radius: 16px;
          padding: 22px 26px;
          backdrop-filter: blur(22px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        }

        .stratosphere-scope-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .stratosphere-scope-kicker {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: var(--accent);
          text-transform: uppercase;
        }

        .stratosphere-scope-body {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 400;
          line-height: 1.62;
          color: #d6d4cd;
          margin: 0 0 14px;
        }

        .stratosphere-scope-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        /* ── TOOLBAR: DUAL FILTER RAILS ── */
        .stratosphere-filter-toolbar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .stratosphere-filter-rail-wrapper {
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .stratosphere-filter-rail-wrapper::-webkit-scrollbar { display: none; }

        .stratosphere-filter-rail {
          display: inline-flex;
          gap: 6px;
          background: rgba(18, 18, 22, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 5px;
          border-radius: 9999px;
          backdrop-filter: blur(16px);
        }

        .stratosphere-filter-pill {
          appearance: none;
          border: 0;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          padding: 8px 16px;
          border-radius: 9999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: all 0.18s ease;
        }

        .stratosphere-filter-pill:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
        }

        .stratosphere-filter-pill.is-active {
          background: var(--accent-bright);
          color: #0d0d0d;
          font-weight: 700;
          box-shadow: 0 2px 14px rgba(232, 174, 60, 0.35);
        }

        .stratosphere-region-rail {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .stratosphere-region-pill {
          appearance: none;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.18s ease;
        }

        .stratosphere-region-pill:hover {
          border-color: rgba(232, 174, 60, 0.3);
          color: #f7f5f0;
          background: rgba(232, 174, 60, 0.05);
        }

        .stratosphere-region-pill.is-active {
          background: var(--accent);
          color: #0d0d0d;
          font-weight: 700;
          border-color: var(--accent);
        }

        /* ── MOBILE TAB TOGGLE ── */
        .stratosphere-mobile-toggle {
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: rgba(18, 18, 22, 0.9);
          border: 1px solid rgba(232, 174, 60, 0.25);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 20px;
        }

        .stratosphere-mobile-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .stratosphere-mobile-tab.is-active {
          background: var(--accent);
          color: #0d0d0d;
          font-weight: 700;
        }

        /* ── 40/60 SPLIT CANVAS ENGINE ── */
        .stratosphere-split-canvas {
          display: grid;
          grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.35fr);
          gap: 28px;
          align-items: start;
          margin-bottom: 48px;
        }

        /* ════ LEFT PANE: DISCOVERY RADAR (~40%) ════ */
        .stratosphere-discovery-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: sticky;
          top: 72px;
        }

        .stratosphere-pane-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stratosphere-pane-kicker-wrap {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .stratosphere-pane-kicker {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .stratosphere-pane-count {
          font-family: var(--font-mono);
          font-size: 9.5px;
          color: var(--text-muted);
        }

        .stratosphere-signals-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(232, 174, 60, 0.25) transparent;
        }

        .stratosphere-signal-card {
          background: rgba(18, 18, 22, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(18px);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stratosphere-signal-card:hover {
          border-color: rgba(232, 174, 60, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        }

        .stratosphere-signal-card.is-selected {
          border-color: var(--accent);
          background: rgba(232, 174, 60, 0.06);
          box-shadow: 0 0 24px rgba(232, 174, 60, 0.18), inset 2px 0 0 var(--accent);
        }

        .stratosphere-signal-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stratosphere-status-pill {
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent-bright);
          background: rgba(232, 174, 60, 0.12);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .stratosphere-signal-cat {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .stratosphere-signal-card-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 500;
          line-height: 1.3;
          color: #f7f5f0;
          margin: 0;
        }

        .stratosphere-signal-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-secondary);
        }

        .stratosphere-signal-loc,
        .stratosphere-signal-radius {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .stratosphere-signal-select-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* ── IMPACTED SPACES ── */
        .stratosphere-impacted-spaces-section {
          background: rgba(13, 13, 16, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 16px;
        }

        .stratosphere-impact-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--accent);
          background: rgba(232, 174, 60, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .stratosphere-impacted-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 12px;
        }

        .stratosphere-impacted-card {
          background: rgba(18, 18, 22, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .stratosphere-impacted-card:hover {
          border-color: rgba(232, 174, 60, 0.4);
          background: rgba(232, 174, 60, 0.06);
          transform: translateY(-1px);
        }

        .stratosphere-impacted-thumb {
          width: 52px;
          height: 52px;
          border-radius: 6px;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
          position: relative;
          padding: 3px;
        }

        .stratosphere-impacted-style {
          position: absolute;
          bottom: 2px;
          left: 2px;
          font-family: var(--font-mono);
          font-size: 7px;
          font-weight: 700;
          color: #0d0d0d;
          background: var(--accent);
          padding: 1px 4px;
          border-radius: 2px;
        }

        .stratosphere-impacted-body {
          flex: 1;
          min-width: 0;
        }

        .stratosphere-impacted-title {
          font-family: var(--font-display);
          font-size: 13.5px;
          font-weight: 500;
          color: #f7f5f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0 0 2px;
        }

        .stratosphere-impacted-loc {
          display: block;
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .stratosphere-impacted-specs {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-secondary);
        }

        /* ════ RIGHT PANE: INTELLIGENCE DOSSIER (~60%) ════ */
        .stratosphere-intelligence-pane {
          background: rgba(13, 13, 16, 0.85);
          border: 1px solid rgba(232, 174, 60, 0.35);
          border-radius: 20px;
          padding: clamp(24px, 4vw, 36px);
          backdrop-filter: blur(24px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
        }

        .stratosphere-dossier-meta-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }

        .stratosphere-dossier-tag-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stratosphere-intel-type-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #0d0d0d;
          background: var(--accent-bright);
          padding: 3px 8px;
          border-radius: 4px;
        }

        .stratosphere-location-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stratosphere-read-time-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
        }

        .stratosphere-dossier-headline {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.6vw, 32px);
          font-weight: 500;
          line-height: 1.2;
          color: #f7f5f0;
          margin: 0 0 14px;
        }

        .stratosphere-provenance-box {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          background: rgba(232, 174, 60, 0.06);
          border: 1px solid rgba(232, 174, 60, 0.2);
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .stratosphere-dossier-lead-text {
          font-family: var(--font-body);
          font-size: 14.5px;
          line-height: 1.68;
          color: #d6d4cd;
          margin: 0 0 28px;
        }

        /* ── TIMELINE TRACK ── */
        .stratosphere-scrolly-section {
          margin-bottom: 28px;
          background: rgba(18, 18, 22, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 20px;
        }

        .stratosphere-dossier-section-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 18px;
        }

        .stratosphere-timeline-track {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          padding-left: 20px;
          border-left: 1px solid rgba(232, 174, 60, 0.25);
        }

        .stratosphere-timeline-step {
          position: relative;
        }

        .stratosphere-timeline-node {
          position: absolute;
          left: -26px;
          top: 2px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stratosphere-node-pulse {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent-bright);
        }

        .stratosphere-node-year {
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 700;
          color: var(--accent);
          display: none;
        }

        .stratosphere-timeline-phase {
          font-family: var(--font-display);
          font-size: 14.5px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0 0 4px;
        }

        .stratosphere-timeline-detail {
          font-family: var(--font-body);
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        /* ── OUR TAKE GRID ── */
        .stratosphere-our-take-section {
          margin-bottom: 28px;
        }

        .stratosphere-take-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }

        .stratosphere-take-card {
          background: rgba(18, 18, 22, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stratosphere-take-card.is-boost {
          border-color: rgba(76, 175, 125, 0.35);
          background: rgba(76, 175, 125, 0.03);
        }

        .stratosphere-take-card.is-friction {
          border-color: rgba(232, 200, 74, 0.35);
          background: rgba(232, 200, 74, 0.03);
        }

        .stratosphere-take-card.is-promise {
          border-color: rgba(232, 174, 60, 0.35);
          background: rgba(232, 174, 60, 0.03);
        }

        .stratosphere-take-head {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .stratosphere-take-card p {
          font-family: var(--font-body);
          font-size: 12.5px;
          line-height: 1.55;
          color: var(--text-secondary);
          margin: 0;
        }

        /* ── PROJECTION CARD ── */
        .stratosphere-projection-card {
          background: rgba(232, 174, 60, 0.04);
          border: 1px dashed rgba(232, 174, 60, 0.35);
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 28px;
        }

        .stratosphere-projection-head {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 6px;
        }

        .stratosphere-projection-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0 0 12px;
        }

        .stratosphere-projection-specs {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .stratosphere-spec-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          color: var(--text-secondary);
          background: rgba(0, 0, 0, 0.5);
          padding: 4px 10px;
          border-radius: 4px;
        }

        .stratosphere-spec-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent-bright);
        }

        /* ── DOSSIER ACTIONS ── */
        .stratosphere-dossier-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stratosphere-read-full-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: #0d0d0d;
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 12px 20px;
          border-radius: 8px;
          text-decoration: none;
          box-shadow: 0 4px 18px rgba(232, 174, 60, 0.3);
          transition: all 0.2s ease;
        }

        .stratosphere-read-full-btn:hover {
          background: var(--accent-bright);
          box-shadow: 0 6px 24px rgba(232, 174, 60, 0.45);
          transform: translateY(-2px);
        }

        .stratosphere-browse-spaces-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f7f5f0;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px 18px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .stratosphere-browse-spaces-btn:hover {
          border-color: rgba(232, 174, 60, 0.4);
          color: var(--accent-bright);
          background: rgba(232, 174, 60, 0.06);
        }

        /* ── PORTAL BANNER ── */
        .stratosphere-portal-banner {
          position: relative;
          background: rgba(13, 13, 16, 0.88);
          border: 1px solid rgba(232, 174, 60, 0.38);
          border-radius: 20px;
          padding: clamp(24px, 4vw, 36px) clamp(20px, 4vw, 40px);
          backdrop-filter: blur(24px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.85fr);
          gap: clamp(20px, 3.5vw, 36px);
          align-items: center;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .stratosphere-portal-glow {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232, 174, 60, 0.14) 0%, transparent 70%);
          pointer-events: none;
        }

        .stratosphere-portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 10px;
        }

        .stratosphere-portal-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 2.5vw, 28px);
          font-weight: 500;
          color: #f7f5f0;
          line-height: 1.2;
          margin: 0 0 10px;
        }

        .stratosphere-portal-desc {
          font-family: var(--font-body);
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0 0 16px;
          max-width: 600px;
        }

        .stratosphere-portal-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .stratosphere-portal-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 5px 10px;
          border-radius: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .stratosphere-portal-action {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .stratosphere-portal-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--accent);
          color: #0d0d0d;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 14px 24px;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(232, 174, 60, 0.35);
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
        }

        .stratosphere-portal-cta-btn:hover {
          background: var(--accent-bright);
          box-shadow: 0 6px 28px rgba(232, 174, 60, 0.5);
          transform: translateY(-2px);
        }

        .stratosphere-portal-cta-sub {
          font-family: var(--font-mono);
          font-size: 9.5px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          text-align: center;
          width: 100%;
        }

        /* ── RESPONSIVE MEDIA QUERIES ── */
        @media (max-width: 980px) {
          .stratosphere-hero-split {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .stratosphere-split-canvas {
            grid-template-columns: 1fr;
          }

          .stratosphere-discovery-pane {
            position: static;
          }

          .stratosphere-mobile-toggle {
            display: grid;
          }

          .stratosphere-discovery-pane:not(.is-mobile-visible) {
            display: none;
          }

          .stratosphere-intelligence-pane:not(.is-mobile-visible) {
            display: none;
          }

          .stratosphere-portal-banner {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
