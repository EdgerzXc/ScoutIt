"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Crosshair,
  Maximize2,
  Minimize2,
  CheckCircle2,
  HelpCircle,
  Eye,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";

import LayerNav from "@/components/descent/LayerNav";
import LayerTransition from "@/components/descent/LayerTransition";

// ── TECHNICAL CATEGORIES & TERRITORY CORRIDORS ──────────────────
const CATEGORIES = [
  "All",
  "Development",
  "Infrastructure",
  "Zoning",
  "Transit",
  "Commercial",
  "Hospitality",
  "STR"
];

const REGIONS = [
  "All Regions",
  "Manila Bay",
  "BGC & Taguig",
  "Makati CBD",
  "Siargao",
  "Palawan",
  "Metro Cebu"
];

// ── COMPREHENSIVE OSINT SPATIAL SIGNALS DATABASE ────────────────
const SPATIAL_SIGNALS = [
  {
    id: "sig-manila-bay-pavilion",
    slug: "manila-venue-trends",
    title: "Bay Area Glass Atrium Pavilions & Corporate Spatial Tech",
    category: "Development",
    statusBadge: "UNDERWAY · Q4 2028",
    statusType: "active",
    location: "Manila Bay, Pasay / Parañaque",
    region: "Manila Bay",
    coords: { lat: 14.5320, lng: 120.9820, x: 42, y: 55 },
    impactRadius: "1.2 km Coastal Catchment",
    date: "July 2026",
    readTime: "5 MIN READ",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "98%",
    summary: {
      whatHappened: "A 4.8-hectare reclaimed waterfront parcel in Pasay has broken ground for two double-height, photovoltaic glass atrium pavilions designed for corporate tech summits and hybrid physical-virtual international conferences.",
      whyItMatters: "Directly shifts Manila's corporate event gravity from traditional subterranean hotel ballrooms to daylight-drenched waterfront assets, triggering a 28% surge in surrounding commercial property inquiries.",
      affectedCount: 3
    },
    // The 8-Chapter Modular Investigation Story
    investigation: {
      chapter01: {
        headline: "Something is changing across the Manila Bay waterfront.",
        lede: "For two decades, corporate gatherings in Metro Manila were confined to underground hotel ballrooms with artificial lighting. The ground-breaking of the Bay Area Glass Atrium Pavilions marks a permanent architectural break: a 4.8-hectare waterfront campus that uses structural glass and solar shading to merge maritime sunset vistas with high-bandwidth spatial computing infrastructure.",
        territoryContext: "Situated along the reclaimed coastal corridor between Pasay and Parañaque, the site directly anchors the northern perimeter of the Bay Area Entertainment City."
      },
      chapter02: {
        siteNotes: "The site directly borders Seaside Boulevard and is situated within an 8-minute drive from NAIA Expressway Terminal 1 & 2 on-ramps.",
        radiusZones: [
          { radius: "250m", impact: "Immediate acoustic & footfall zone; direct pedestrian promenade connection." },
          { radius: "500m", impact: "High-density hospitality & commercial leasing catchment." },
          { radius: "1.0km", impact: "Macro traffic dispersal & premium residential appreciation corridor." }
        ]
      },
      chapter03: {
        announcementTitle: "Official Ground-Breaking & Framework Approval",
        announcer: "Philippine Convention & Exhibition Bureau (PCEB) & Pasay City Planning Office",
        filingRef: "PCEB-2026-WZ-0941",
        verifiedFacts: [
          "48,000 sqm total gross land allocation on consolidated reclaimed title.",
          "Two double-curved panoramic glass pavilions with 14-meter clear interior ceiling heights.",
          "Integrated 2.4 MW rooftop building-integrated photovoltaic (BIPV) solar array.",
          "Dedicated subterranean pedestrian concourse linking directly to the Seaside Monorail station."
        ]
      },
      chapter04: {
        timeline: [
          { year: "2024", phase: "Right-of-Way & Environmental Compliance", status: "COMPLETED", detail: "DENR issued Environmental Compliance Certificate (ECC-2024-082) after hydrodynamic tidal surge modeling." },
          { year: "2025", phase: "Deep Caisson Piling & Marine Defense", status: "COMPLETED", detail: "Installation of 420 reinforced concrete friction piles and a 4.2-meter wave-attenuation perimeter seawall." },
          { year: "2026", phase: "Superstructure & Glass Enclosure", status: "WE ARE HERE", current: true, detail: "Erection of specialized diagrid steel arches and German-engineered triple-laminated low-emissivity glass panels." },
          { year: "2027", phase: "Spatial Tech & Acoustic Fitout", status: "PLANNED", detail: "Deployment of spatial audio arrays, ceiling-integrated lidar tracking, and redundant fiber-optic trunks." },
          { year: "2028", phase: "Operational Commissioning", status: "TARGET", detail: "Inaugural hosting of the Asia-Pacific Spatial Computing Summit Q4 2028." }
        ]
      },
      chapter05: {
        proposalName: "The Horizon Glass Pavilion Specifications",
        specs: [
          { label: "Clear Ceiling Height", value: "14.0 Meters" },
          { label: "Simultaneous Guest Capacity", value: "3,500 Attendees" },
          { label: "Solar Energy Offset", value: "64% Annual Campus Power" },
          { label: "Acoustic Attenuation", value: "Rw 52 dB Noise Barrier" },
          { label: "Waterfront Setback", value: "35-Meter Public Boardwalk" }
        ],
        architecturalLogic: "Designed with an aerodynamic cantilever that diffuses typhoon wind loads while providing unobstructed sunset views across Manila Bay."
      },
      chapter06: {
        developerClaims: "The consortium claims the complex will generate ₱4.2B in annual regional economic activity and position Manila as Asia's top corporate waterfront destination.",
        scoutItAudit: "While tourism and executive summit demand are historically high, regional road bottlenecks along Roxas Boulevard during evening rush hours remain an unmitigated operational friction point until the NAIAX connector is completed."
      },
      chapter07: {
        // Multi-Factor Institutional Impact Matrix
        impactMatrix: [
          { factor: "Accessibility", shortTerm: "STABLE", longTerm: "HIGH BOOST", rationale: "Short-term construction rerouting shifts to a direct monorail and expressway link upon commissioning." },
          { factor: "Traffic Load", shortTerm: "MODERATE FRICTION", longTerm: "MANAGED", rationale: "Localized heavy vehicle congestion during façade installation; long-term subterranean parking mitigates street queuing." },
          { factor: "Commercial Footfall", shortTerm: "LOW", longTerm: "HIGH BOOST", rationale: "Estimated 14,000 weekly executive visitors entering the surrounding retail and dining promenade." },
          { factor: "Property Values", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Surrounding commercial spaces commanding a +24% pre-completion leasing premium." },
          { factor: "Construction Acoustics", shortTerm: "MODERATE FRICTION", longTerm: "RESOLVED", rationale: "Deep-bore piling completed; current steel erection generates localized daytime decibel spikes." },
          { factor: "Public Realm Quality", shortTerm: "STABLE", longTerm: "HIGH BOOST", rationale: "Creation of a 35-meter landscaped public sunset esplanade accessible to residents." }
        ]
      },
      chapter08: {
        sources: [
          { type: "PRIMARY", name: "Philippine Convention & Exhibition Bureau Gazette", date: "June 2026", verified: true },
          { type: "GOVERNMENT", name: "Pasay City Urban Planning & Zoning Registry", date: "April 2026", verified: true },
          { type: "DEVELOPER", name: "Bay Horizon Consortium Masterplan Disclosure", date: "January 2026", verified: true },
          { type: "SCOUTIT VERIFIED", name: "On-Site Drone Telemetry & Cadastral Audit", date: "July 2026", verified: true }
        ]
      }
    }
  },
  {
    id: "sig-bgc-subway",
    slug: "bgc-spatial-movement",
    title: "BGC West Block Subway Tunneling & Low-Density Villa Migration",
    category: "Transit",
    statusBadge: "TUNNELING PHASE 1",
    statusType: "active",
    location: "BGC West Block, Taguig",
    region: "BGC & Taguig",
    coords: { lat: 14.5409, lng: 121.0503, x: 62, y: 48 },
    impactRadius: "800m Station Catchment",
    date: "July 2026",
    readTime: "4 MIN READ",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "99%",
    summary: {
      whatHappened: "Tunnel boring machines advancing toward BGC West Station have triggered a rapid spatial realignment: private capital is aggressively acquiring low-density modernist villas with private acoustic buffers before station activation.",
      whyItMatters: "Direct 18-minute subterranean transit connection to NAIA Airport is driving a 38% price premium on single-detached homes within walking distance.",
      affectedCount: 3
    },
    investigation: {
      chapter01: {
        headline: "Subterranean mobility is restructuring BGC's perimeter value.",
        lede: "The arrival of the Metro Manila Subway beneath 11th Avenue represents the most profound transit intervention in Bonifacio Global City since its 1995 master plan. As tunnel boring progresses 24 meters below street level, private family offices and institutional buyers are executing off-market acquisitions of surrounding low-density residences.",
        territoryContext: "Bonifacio Global City West Perimeter bordering Forbes Park and Kalayaan Avenue."
      },
      chapter02: {
        siteNotes: "The station box excavation spans 280 meters along the western perimeter, creating a permanent high-frequency transit anchor.",
        radiusZones: [
          { radius: "200m", impact: "Direct underground pedestrian concourse portal." },
          { radius: "450m", impact: "Prime residential appreciation zone with minimal street noise." },
          { radius: "800m", impact: "Outer 10-minute pedestrian walking catchment." }
        ]
      },
      chapter03: {
        announcementTitle: "DOTr Subterranean Easement & Station Structural Works",
        announcer: "Department of Transportation & Bases Conversion and Development Authority",
        filingRef: "DOTr-MMS-PKG-104",
        verifiedFacts: [
          "BGC West Station excavation depth reaches -24.5 meters below street grade.",
          "Four integrated station entrances designed with acoustic baffles and glass canopies.",
          "Subterranean utility rerouting for water and fiber-optic grids completed in Q1 2026."
        ]
      },
      chapter04: {
        timeline: [
          { year: "2023", phase: "Right-of-Way & Utility Relocation", status: "COMPLETED", detail: "Subterranean utilities mapped and diverted along perimeter corridors." },
          { year: "2025", phase: "Diaphragm Wall & Shaft Excavation", status: "COMPLETED", detail: "Reinforced concrete perimeter walls poured to prevent ground settlement." },
          { year: "2026", phase: "Tunnel Boring Machine (TBM) Transit", status: "WE ARE HERE", current: true, detail: "Dual TBMs excavating northbound and southbound running tunnels simultaneously." },
          { year: "2027", phase: "Trackwork & Station Interior Architecture", status: "PLANNED", detail: "Platform screen doors, ventilation shafts, and high-speed elevators installed." },
          { year: "2028", phase: "Commercial Passenger Activation", status: "TARGET", detail: "Opening of direct transit link to NAIA Terminal 3 and Ortigas CBD." }
        ]
      },
      chapter05: {
        proposalName: "BGC West Subterranean Concourse Architecture",
        specs: [
          { label: "Excavation Depth", value: "-24.5 Meters" },
          { label: "Daily Passenger Capacity", value: "85,000 Commuters" },
          { label: "Travel Time to NAIA", value: "18 Minutes" },
          { label: "Acoustic Vibration Buffer", value: "Floating Slab Trackbed" }
        ],
        architecturalLogic: "Floating trackbeds absorb mechanical vibrations, isolating surface villas from underground resonance."
      },
      chapter06: {
        developerClaims: "DOTr asserts the station will eliminate 35,000 daily vehicular trips into BGC's western corridor.",
        scoutItAudit: "Surface-level drop-off traffic will require rigorous municipal enforcement to prevent bottlenecks along 11th Avenue during peak arrival hours."
      },
      chapter07: {
        impactMatrix: [
          { factor: "Accessibility", shortTerm: "STABLE", longTerm: "HIGH BOOST", rationale: "Direct airport and regional subway rail connectivity." },
          { factor: "Traffic Load", shortTerm: "MODERATE FRICTION", longTerm: "POSITIVE", rationale: "Surface traffic diverted subterranean upon completion." },
          { factor: "Commercial Footfall", shortTerm: "LOW", longTerm: "HIGH BOOST", rationale: "High-net-worth commuter density entering retail blocks." },
          { factor: "Property Values", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Historical +35% appreciation on transit-linked prime real estate." },
          { factor: "Construction Noise", shortTerm: "MODERATE FRICTION", longTerm: "RESOLVED", rationale: "Deep tunnel boring produces zero surface disturbance." }
        ]
      },
      chapter08: {
        sources: [
          { type: "PRIMARY", name: "DOTr Metro Manila Subway Project Ledger", date: "July 2026", verified: true },
          { type: "GOVERNMENT", name: "Taguig City Urban Development Authority", date: "May 2026", verified: true },
          { type: "SCOUTIT VERIFIED", name: "Field Lidar & Ground Settlement Telemetry", date: "July 2026", verified: true }
        ]
      }
    }
  },
  {
    id: "sig-makati-leed",
    slug: "green-office-demand",
    title: "LEED Platinum Mandate & Makati CBD Office Modernization",
    category: "Zoning",
    statusBadge: "ORDINANCE RATIFIED",
    statusType: "active",
    location: "Ayala Avenue, Makati CBD",
    region: "Makati CBD",
    coords: { lat: 14.5547, lng: 121.0244, x: 55, y: 44 },
    impactRadius: "Ayala & Paseo Corridors",
    date: "July 2026",
    readTime: "4 MIN READ",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "97%",
    summary: {
      whatHappened: "Makati City has ratified a progressive carbon taxation ordinance mandating that prime office towers achieve minimum LEED Gold or Platinum certification by 2027.",
      whyItMatters: "Forces legacy building owners into ₱180M+ façade and HVAC overhauls while driving multinational tenants to secure certified green spaces.",
      affectedCount: 2
    },
    investigation: {
      chapter01: {
        headline: "The green threshold is reshaping Makati's skyline economics.",
        lede: "The passage of the Makati Sustainable Skyscraper Ordinance has introduced a mandatory carbon ceiling for commercial buildings along Ayala Avenue, Paseo de Roxas, and Makati Avenue. Uncertified legacy towers face progressive municipal tax surcharges, creating an unprecedented wave of architectural retrofits.",
        territoryContext: "Central Business District core encompassing 68 prime office towers."
      },
      chapter02: {
        siteNotes: "Affects all commercial properties exceeding 12 stories built prior to 2018.",
        radiusZones: [
          { radius: "Core CBD", impact: "Immediate mandate compliance required by Q4 2027." },
          { radius: "Perimeter Salcedo/Legazpi", impact: "Secondary compliance deadline Q4 2028." }
        ]
      },
      chapter03: {
        announcementTitle: "Makati City Ordinance No. 2026-042: Green Building Standards",
        announcer: "Makati City Council & Department of Environmental Services",
        filingRef: "MKT-ORD-2026-042",
        verifiedFacts: [
          "Mandatory 25% energy reduction baseline compared to ASHRAE 90.1 standards.",
          "Tiered tax incentives for properties achieving LEED Platinum or WELL Building Standard.",
          "Non-compliant properties penalized with 1.8% annual commercial property tax surcharge starting 2028."
        ]
      },
      chapter04: {
        timeline: [
          { year: "2024", phase: "Energy Audit & Carbon Baseline Mapping", status: "COMPLETED", detail: "Citywide sensor mapping completed across 140 commercial towers." },
          { year: "2026", phase: "Ordinance Ratification & Retrofit Launch", status: "WE ARE HERE", current: true, detail: "Over 24 prime commercial buildings commenced façade replacements and HVAC upgrades." },
          { year: "2027", phase: "First Verification Audit & Certification", status: "PLANNED", detail: "Third-party USGBC engineering audits submitted to city hall." },
          { year: "2028", phase: "Penalty Enforcement & Tax Adjustment", status: "TARGET", detail: "Surcharges applied to uncertified commercial assets." }
        ]
      },
      chapter05: {
        proposalName: "Active Façade Thermal Enclosure Standard",
        specs: [
          { label: "Glazing Spec", value: "Low-E Double Glazed (U-factor < 1.4)" },
          { label: "HVAC Efficiency", value: "Magnetic-Bearing Chillers (COP > 6.8)" },
          { label: "Energy Reduction", value: "-28% Operating Power" }
        ],
        architecturalLogic: "High-performance solar control coatings reduce cooling load by 32% without sacrificing natural daylight."
      },
      chapter06: {
        developerClaims: "City planning projects a 42,000-ton annual reduction in carbon emissions across the CBD.",
        scoutItAudit: "Building owners without available CapEx capital will likely face tenant flight to newer certified developments like Ayala Triangle Tower Two."
      },
      chapter07: {
        impactMatrix: [
          { factor: "Operating Efficiency", shortTerm: "MODERATE FRICTION", longTerm: "HIGH BOOST", rationale: "Initial retrofit CapEx recovered through 28% reduced power bills." },
          { factor: "Tenant Demand", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Multinational ESG mandates restrict leasing to certified green towers." },
          { factor: "Asset Valuation", shortTerm: "STABLE", longTerm: "HIGH BOOST", rationale: "Certified buildings maintain 15-20% rental rate premiums over legacy stock." }
        ]
      },
      chapter08: {
        sources: [
          { type: "PRIMARY", name: "Makati City Official Gazette No. 2026-042", date: "July 2026", verified: true },
          { type: "GOVERNMENT", name: "Philippine Green Building Council (PHILGBC)", date: "June 2026", verified: true },
          { type: "SCOUTIT VERIFIED", name: "Engineering Telemetry & Façade Inspections", date: "July 2026", verified: true }
        ]
      }
    }
  },
  {
    id: "sig-siargao-coastal",
    slug: "surf-front-land-rush",
    title: "General Luna Coastal Frontage Expansion & Yield Dynamics",
    category: "STR",
    statusBadge: "OFF-MARKET SURGE",
    statusType: "active",
    location: "General Luna, Siargao",
    region: "Siargao",
    coords: { lat: 9.7800, lng: 126.1550, x: 80, y: 72 },
    impactRadius: "Cloud 9 to Tuason Beach",
    date: "June 2026",
    readTime: "3 MIN READ",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "96%",
    summary: {
      whatHappened: "Boutique hospitality syndicates are executing off-market land consolidations along Siargao's extended surf breaks, generating annual short-term rental yields exceeding 22%.",
      whyItMatters: "Runway expansion at Sayak Airport allowing direct regional flights has accelerated private acquisitions of titled beachfront land.",
      affectedCount: 2
    },
    investigation: {
      chapter01: {
        headline: "Direct regional aviation is reshaping Siargao's coastal land values.",
        lede: "The extension of the runway at Sayak Airport to accommodate regional jet flights from Singapore and Hong Kong has permanently altered Siargao's tourism velocity. Prime beachfront parcels between Cloud 9 and Tuason Beach are seeing rapid off-market transactions.",
        territoryContext: "General Luna coastal corridor spanning 6.4 kilometers."
      },
      chapter02: {
        siteNotes: "Strict 25-meter coastal easement setback enforced by DENR on all new structural developments.",
        radiusZones: [
          { radius: "Beachfront", impact: "Zero-density buffer zone with elevated teak boardwalks." },
          { radius: "50-100m Inland", impact: "Prime luxury pavilion villa footprint." }
        ]
      },
      chapter03: {
        announcementTitle: "Civil Aviation Authority of the Philippines (CAAP) Runway Expansion",
        announcer: "CAAP & Department of Tourism (DOT)",
        filingRef: "CAAP-SYK-2025-019",
        verifiedFacts: [
          "Runway lengthened to 1,800 meters to accept Airbus A320 and Embraer E190 aircraft.",
          "Direct flights from Singapore (Changi) slated for commencement Q1 2027.",
          "Municipal moratorium on non-biodegradable construction materials in coastal zones."
        ]
      },
      chapter04: {
        timeline: [
          { year: "2024", phase: "Airport Land Acquisition & Paving", status: "COMPLETED", detail: "Runway foundation paved and instrument landing systems installed." },
          { year: "2026", phase: "Boutique Land Consolidation Wave", status: "WE ARE HERE", current: true, detail: "Hospitality syndicates securing titled agricultural-to-commercial conversions." },
          { year: "2027", phase: "Direct International Flight Inflow", status: "PLANNED", detail: "First direct scheduled international arrivals." },
          { year: "2028", phase: "Masterplanned Eco-Resort Deliveries", status: "TARGET", detail: "Opening of five low-density, off-grid luxury pavilion estates." }
        ]
      },
      chapter05: {
        proposalName: "Sustainable Teak Pavilion Standard",
        specs: [
          { label: "Renewable Power", value: "100% Off-Grid Solar & Battery" },
          { label: "Coastal Setback", value: "25-Meter Protected Easement" },
          { label: "Target ARR", value: "22.4% Annual Rental Yield" }
        ],
        architecturalLogic: "Open-air pavilions elevated on stilts to respect natural dune topography and maximize sea breezes."
      },
      chapter06: {
        developerClaims: "Syndicates project consistent 85% year-round occupancy from international surf and wellness travelers.",
        scoutItAudit: "Island grid reliability and water desalination infrastructure require private onsite solutions to maintain five-star luxury standards."
      },
      chapter07: {
        impactMatrix: [
          { factor: "Rental Yields", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Current nightly ADRs of ₱35,000+ with minimal luxury inventory." },
          { factor: "Land Scarcity", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Only 14 titled coastal parcels remain available along primary breaks." },
          { factor: "Infrastructure Risk", shortTerm: "MODERATE FRICTION", longTerm: "MANAGED", rationale: "Requires private solar microgrid and deep-well water filtration." }
        ]
      },
      chapter08: {
        sources: [
          { type: "PRIMARY", name: "CAAP Sayak Airport Development Record", date: "June 2026", verified: true },
          { type: "GOVERNMENT", name: "DENR Region XIII Coastal Cadastral Survey", date: "May 2026", verified: true },
          { type: "SCOUTIT VERIFIED", name: "Title Verification & Land Registry Audit", date: "June 2026", verified: true }
        ]
      }
    }
  }
];

export default function StratosphereWorkbench() {
  const router = useRouter();
  
  // ── WORKBENCH STATE ──────────────────────────────────────────
  const [activeSignalId, setActiveSignalId] = useState("sig-manila-bay-pavilion");
  const [investigationMode, setInvestigationMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRegion, setActiveRegion] = useState("All Regions");
  const [activeChapter, setActiveChapter] = useState(1);
  const [properties, setProperties] = useState([]);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [mobileSection, setMobileSection] = useState("radar"); // 'radar' | 'brief' | 'investigation'

  // Fetch Live Directory Properties from Dual-CMS API
  useEffect(() => {
    let alive = true;
    async function loadProperties() {
      try {
        const res = await fetch("/api/cms");
        if (!alive || !res.ok) return;
        const data = await res.json();
        if (data.properties && Array.isArray(data.properties)) {
          const list = data.properties.filter(p => p.title && p.slug).map(p => ({
            id: p.id || p.slug,
            slug: p.slug,
            title: p.title,
            category: p.spaceCategory || "Commercial",
            city: p.location || p.city || "Philippines",
            style: p.aestheticTag || "Modernist",
            image: p.image || (p.photos?.[0]) || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
            beds: p.beds || 3,
            sqm: p.floor_sqm || 340,
            price: p.price_raw ? `₱${(p.price_raw / 1000000).toFixed(1)}M` : "Price on Request",
            distance: "350m radius",
            influence: "High Demand Surge"
          }));
          if (alive && list.length > 0) setProperties(list);
        }
      } catch (err) {
        if (alive) console.error("CMS properties load error:", err);
      }
    }
    loadProperties();
    return () => { alive = false; };
  }, []);

  // Filter Signals
  const filteredSignals = useMemo(() => {
    return SPATIAL_SIGNALS.filter(sig => {
      const matchCat = activeCategory === "All" || sig.category.toLowerCase() === activeCategory.toLowerCase();
      const matchReg = activeRegion === "All Regions" || sig.region.toLowerCase().includes(activeRegion.toLowerCase()) || sig.location.toLowerCase().includes(activeRegion.toLowerCase());
      return matchCat && matchReg;
    });
  }, [activeCategory, activeRegion]);

  // Active Signal Object
  const currentSignal = useMemo(() => {
    return SPATIAL_SIGNALS.find(s => s.id === activeSignalId) || SPATIAL_SIGNALS[0];
  }, [activeSignalId]);

  // Linked Affected Properties for the Active Signal
  const affectedProperties = useMemo(() => {
    if (!currentSignal) return [];
    const matched = properties.filter(p => 
      p.category.toLowerCase() === currentSignal.category.toLowerCase() ||
      p.city.toLowerCase().includes(currentSignal.region.toLowerCase()) ||
      currentSignal.location.toLowerCase().includes(p.city.toLowerCase())
    );
    return matched.length > 0 ? matched.slice(0, 3) : properties.slice(0, 3);
  }, [properties, currentSignal]);

  // Scroll to Chapter in Investigation Mode
  const scrollToChapter = (chapterNum) => {
    setActiveChapter(chapterNum);
    const el = document.getElementById(`chapter-${chapterNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={`stratosphere-workbench ${investigationMode ? "is-investigation-mode" : "is-overview-mode"}`}>
      
      {/* ── 1. COSMIC DESCENT LAYER WAYPOINT NAV ── */}
      <LayerNav 
        prev={{ href: "/layer/orbit", label: "Orbit" }} 
        next={{ href: "/layer/metropolis", label: "Metropolis" }} 
      />

      {/* ── 2. MAIN TACTICAL WORKBENCH CANVAS ── */}
      <main className="workbench-main">
        <div className="workbench-container">

          {/* ── 3. PRECISION TELEMETRY & STRATOSPHERE COMMAND HEADER ── */}
          <header className="workbench-header">
            <div className="header-telemetry-strip">
              <div className="telemetry-node">
                <span className="telemetry-live-dot" />
                <span className="telemetry-label">LAYER 02 // STRATOSPHERE</span>
              </div>
              <span className="telemetry-divider">/</span>
              <span className="telemetry-sub">SPATIAL INTELLIGENCE WORKBENCH</span>
              <span className="telemetry-divider">/</span>
              <span className="telemetry-coords">14.5995° N, 120.9842° E · PHILIPPINE ARCHIPELAGO</span>
            </div>

            <div className="header-title-row">
              <h1 className="header-title">
                Spatial Intelligence <span className="header-gold-text">&amp; Discovery</span>
              </h1>
              
              <div className="header-status-badge">
                <ShieldCheck size={13} className="text-gold" />
                <span>OSINT SOURCE PROVENANCE VERIFIED</span>
              </div>
            </div>

            <p className="header-mission-statement">
              The world changes. A place is affected. ScoutIt investigates the spatial impact across physical assets.
            </p>
          </header>

          {/* ── 4. TECHNICAL DISCOVERY FILTERS ── */}
          <section className="workbench-filter-bar" aria-label="Spatial Intelligence Filters">
            <div className="filter-group">
              <span className="filter-label">CATEGORY:</span>
              <div className="filter-pills-wrap">
                {CATEGORIES.map(cat => {
                  const isSel = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`filter-pill ${isSel ? "is-active" : ""}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">TERRITORY:</span>
              <div className="filter-pills-wrap">
                {REGIONS.map(reg => {
                  const isSel = activeRegion === reg;
                  return (
                    <button
                      key={reg}
                      type="button"
                      className={`filter-pill ${isSel ? "is-active" : ""}`}
                      onClick={() => setActiveRegion(reg)}
                    >
                      {reg}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── 5. MOBILE VIEWPORT STATE SELECTOR ── */}
          <div className="mobile-view-nav" role="tablist">
            <button
              type="button"
              className={`mobile-tab-btn ${mobileSection === "radar" ? "is-active" : ""}`}
              onClick={() => setMobileSection("radar")}
            >
              <Compass size={13} />
              <span>1. Discovery ({filteredSignals.length})</span>
            </button>
            <button
              type="button"
              className={`mobile-tab-btn ${mobileSection === "brief" ? "is-active" : ""}`}
              onClick={() => setMobileSection("brief")}
            >
              <FileText size={13} />
              <span>2. Brief</span>
            </button>
            <button
              type="button"
              className={`mobile-tab-btn ${mobileSection === "investigation" ? "is-active" : ""}`}
              onClick={() => {
                setMobileSection("investigation");
                setInvestigationMode(true);
              }}
            >
              <Sparkles size={13} />
              <span>3. Investigation</span>
            </button>
          </div>

          {/* ── 6. THE ASYMMETRIC WORKBENCH GRID ── */}
          <div className="workbench-grid">

            {/* ════════════════════════════════════════════════════════════════
                LEFT COLUMN: DISCOVERY RADAR (~32% Overview / ~6% Rail in Investigation)
            ════════════════════════════════════════════════════════════════ */}
            {investigationMode ? (
              /* Collapsed Persistent Radar Rail in Investigation Mode */
              <aside className="collapsed-radar-rail" aria-label="Persistent Investigation Radar Rail">
                <button
                  type="button"
                  className="rail-back-btn"
                  onClick={() => {
                    setInvestigationMode(false);
                    setMobileSection("brief");
                  }}
                  title="Return to Discovery Radar Overview"
                >
                  <Minimize2 size={14} />
                  <span className="rail-btn-text">RADAR</span>
                </button>

                <div className="rail-signal-indicator">
                  <span className="rail-pulse-node" />
                  <span className="rail-signal-cat">{currentSignal.category}</span>
                </div>

                {/* Vertical Chapter Jump Waypoints */}
                <nav className="rail-chapter-nav" aria-label="Story Chapters">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      className={`rail-chapter-dot ${activeChapter === ch ? "is-active" : ""}`}
                      onClick={() => scrollToChapter(ch)}
                      title={`Jump to Chapter 0${ch}`}
                    >
                      <span>0{ch}</span>
                    </button>
                  ))}
                </nav>

                <button
                  type="button"
                  className="rail-evidence-btn"
                  onClick={() => setEvidenceDrawerOpen(!evidenceDrawerOpen)}
                  title="Toggle Source Evidence Drawer"
                >
                  <FileText size={14} />
                  <span>OSINT</span>
                </button>
              </aside>
            ) : (
              /* Full Discovery Radar Column (~32%) */
              <aside className={`discovery-radar-column ${mobileSection === "radar" ? "is-mobile-active" : ""}`}>
                
                {/* ── A. Spatial Coordinate Radar Field ── */}
                <section className="radar-cartographic-deck">
                  <div className="deck-header">
                    <div className="deck-kicker">
                      <Crosshair size={12} className="text-gold" />
                      <span>SPATIAL COORDINATE RADAR</span>
                    </div>
                    <span className="deck-status">ACTIVE SCANNING</span>
                  </div>

                  {/* Abstract Vector Coordinate Field */}
                  <div className="radar-vector-field">
                    <div className="radar-grid-lines" />
                    <div className="radar-concentric-ring ring-1" />
                    <div className="radar-concentric-ring ring-2" />
                    <div className="radar-crosshair-h" />
                    <div className="radar-crosshair-v" />

                    {/* Plotted Signals Nodes */}
                    {filteredSignals.map(sig => {
                      const isFocused = sig.id === currentSignal.id;
                      return (
                        <button
                          key={sig.id}
                          type="button"
                          className={`radar-signal-node ${isFocused ? "is-focused" : ""}`}
                          style={{ left: `${sig.coords.x}%`, top: `${sig.coords.y}%` }}
                          onClick={() => {
                            setActiveSignalId(sig.id);
                            setMobileSection("brief");
                          }}
                          title={`${sig.title} (${sig.location})`}
                        >
                          <span className="node-pulse" />
                          <span className="node-label">{sig.region}</span>
                        </button>
                      );
                    })}

                    {/* Active Target Reticle Overlay */}
                    <div 
                      className="radar-active-reticle"
                      style={{ left: `${currentSignal.coords.x}%`, top: `${currentSignal.coords.y}%` }}
                    >
                      <div className="reticle-box" />
                      <span className="reticle-coords">
                        {currentSignal.coords.lat.toFixed(4)}°N, {currentSignal.coords.lng.toFixed(4)}°E
                      </span>
                    </div>
                  </div>

                  <div className="deck-footer-legend">
                    <span className="legend-item"><span className="legend-dot is-gold" /> SIGNAL DETECTED</span>
                    <span className="legend-item"><span className="legend-dot is-white" /> PROPERTY NODE</span>
                    <span className="legend-item"><span className="legend-dot is-muted" /> REGIONAL RADIUS</span>
                  </div>
                </section>

                {/* ── B. Compact Signal Detection Feed ── */}
                <section className="signal-feed-deck">
                  <div className="deck-header">
                    <div className="deck-kicker">
                      <Radio size={12} className="text-gold" />
                      <span>DISCOVERED SIGNALS ({filteredSignals.length})</span>
                    </div>
                    <span className="deck-status">REAL-TIME OSINT</span>
                  </div>

                  <div className="signal-detection-list">
                    {filteredSignals.map(sig => {
                      const isSelected = sig.id === currentSignal.id;
                      return (
                        <article
                          key={sig.id}
                          className={`signal-detection-item ${isSelected ? "is-selected" : ""}`}
                          onClick={() => {
                            setActiveSignalId(sig.id);
                            setMobileSection("brief");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setActiveSignalId(sig.id);
                              setMobileSection("brief");
                            }
                          }}
                          tabIndex={0}
                          role="button"
                        >
                          <div className="signal-item-top">
                            <span className="signal-status-tag">{sig.statusBadge}</span>
                            <span className="signal-cat-tag">{sig.category}</span>
                          </div>

                          <h3 className="signal-item-title">{sig.title}</h3>

                          <div className="signal-item-meta">
                            <span className="signal-loc-tag">
                              <MapPin size={10} />
                              <span>{sig.location}</span>
                            </span>
                            <span className="signal-prop-count">
                              <Building2 size={10} />
                              <span>{sig.summary.affectedCount} Linked Spaces</span>
                            </span>
                          </div>

                          <div className="signal-item-footer">
                            <span className="signal-date">{sig.date}</span>
                            <span className="signal-action-prompt">
                              {isSelected ? "ACTIVE FOCUS →" : "INSPECT"}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </aside>
            )}

            {/* ════════════════════════════════════════════════════════════════
                RIGHT COLUMN: INTELLIGENCE CANVAS (~68% Overview / ~94% Investigation)
            ════════════════════════════════════════════════════════════════ */}
            <section className={`intelligence-canvas-column ${mobileSection !== "radar" ? "is-mobile-active" : ""}`}>
              
              {!investigationMode ? (
                /* ── DEFAULT STATE: COMPACT INTELLIGENCE BRIEF (Simple First, Deep on Demand) ── */
                <article className="intelligence-brief-deck">
                  
                  {/* Brief Header & Provenance */}
                  <header className="brief-header">
                    <div className="brief-meta-strip">
                      <span className="brief-tag-category">{currentSignal.category} SIGNAL</span>
                      <span className="brief-tag-location">
                        <MapPin size={11} />
                        <span>{currentSignal.location}</span>
                      </span>
                      <span className="brief-tag-verification">
                        <ShieldCheck size={11} className="text-gold" />
                        <span>{currentSignal.verificationStatus}</span>
                      </span>
                      <span className="brief-tag-readtime">{currentSignal.readTime}</span>
                    </div>

                    <h2 className="brief-headline">{currentSignal.title}</h2>
                    <span className="brief-radius-pill">
                      <Radio size={11} className="text-gold" />
                      <span>SPATIAL INFLUENCE RADIUS: {currentSignal.impactRadius}</span>
                    </span>
                  </header>

                  {/* Concise 2-Section Overview: What Happened & Why It Matters */}
                  <div className="brief-core-grid">
                    <div className="brief-insight-block">
                      <div className="block-eyebrow">
                        <Info size={12} className="text-gold" />
                        <span>01 // WHAT HAPPENED</span>
                      </div>
                      <p className="block-body-text">{currentSignal.summary.whatHappened}</p>
                    </div>

                    <div className="brief-insight-block">
                      <div className="block-eyebrow">
                        <TrendingUp size={12} className="text-gold" />
                        <span>02 // WHY THIS MATTERS FOR THIS TERRITORY</span>
                      </div>
                      <p className="block-body-text">{currentSignal.summary.whyItMatters}</p>
                    </div>
                  </div>

                  {/* First-Class Impacted Properties Section */}
                  <section className="brief-impacted-spaces-section">
                    <div className="section-header-row">
                      <div className="section-eyebrow">
                        <Building2 size={13} className="text-gold" />
                        <span>AFFECTED SCOUTIT SPACES IN THIS CATCHMENT ({affectedProperties.length})</span>
                      </div>
                      <span className="section-helper-tag">PROXIMITY LINKED</span>
                    </div>

                    <div className="impacted-spaces-strip">
                      {affectedProperties.map((prop, idx) => (
                        <div
                          key={prop.id || prop.slug}
                          className="impacted-space-node"
                          onMouseEnter={() => setHoveredPropertyId(prop.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          onClick={() => router.push(`/property/${prop.slug}`)}
                        >
                          <div 
                            className="impacted-space-photo"
                            style={{ backgroundImage: `url(${prop.image})` }}
                          >
                            <span className="impacted-space-radius">
                              {idx === 0 ? "250m RADIUS" : idx === 1 ? "500m RADIUS" : "1.0km RADIUS"}
                            </span>
                          </div>

                          <div className="impacted-space-info">
                            <h4 className="impacted-space-title">{prop.title}</h4>
                            <span className="impacted-space-loc">{prop.city}</span>
                            <div className="impacted-space-metrics">
                              <span>{prop.sqm} sqm</span>
                              <span>·</span>
                              <strong className="text-gold">{prop.price}</strong>
                            </div>
                            <div className="impacted-space-influence">
                              <span>Impact: </span>
                              <strong>{prop.influence}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Primary Action: Enter Investigation */}
                  <footer className="brief-action-footer">
                    <button
                      type="button"
                      className="enter-investigation-cta"
                      onClick={() => {
                        setInvestigationMode(true);
                        setMobileSection("investigation");
                      }}
                    >
                      <Sparkles size={16} />
                      <span>ENTER FULL SPATIAL INVESTIGATION</span>
                      <ArrowRight size={16} />
                    </button>

                    <div className="brief-cta-note">
                      <span>Expands 8-chapter evidence room, milestone chronology, &amp; ScoutIt impact matrix</span>
                    </div>
                  </footer>

                </article>
              ) : (
                /* ── EXPANDED INVESTIGATION MODE: MODULAR STORY ENGINE (~94% Canvas) ── */
                <article className="investigation-story-engine">
                  
                  {/* Investigation Top Command Header */}
                  <div className="investigation-top-bar">
                    <button
                      type="button"
                      className="exit-investigation-btn"
                      onClick={() => setInvestigationMode(false)}
                    >
                      <ArrowRight size={14} className="rotate-180" />
                      <span>RETURN TO RADAR OVERVIEW</span>
                    </button>

                    <div className="investigation-status-pill">
                      <span className="live-dot" />
                      <span>INVESTIGATION DOSSIER ACTIVE // {currentSignal.slug}</span>
                    </div>
                  </div>

                  {/* CHAPTER 01: THE SIGNAL */}
                  <section id="chapter-1" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 01</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">THE SPATIAL SIGNAL</span>
                    </div>

                    <h2 className="chapter-headline">{currentSignal.investigation.chapter01.headline}</h2>
                    <p className="chapter-lede">{currentSignal.investigation.chapter01.lede}</p>
                    
                    <div className="territory-context-callout">
                      <Compass size={14} className="text-gold" />
                      <span>TERRITORIAL CONTEXT: {currentSignal.investigation.chapter01.territoryContext}</span>
                    </div>
                  </section>

                  {/* CHAPTER 02: THE SITE & CATCHMENT RADIUS */}
                  <section id="chapter-2" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 02</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">THE SITE &amp; CATCHMENT RADIUS</span>
                    </div>

                    <p className="chapter-body-prose">{currentSignal.investigation.chapter02.siteNotes}</p>

                    <div className="radius-zones-instrument">
                      {currentSignal.investigation.chapter02.radiusZones.map((zone, i) => (
                        <div key={i} className="radius-zone-card">
                          <div className="zone-header">
                            <span className="zone-radius-pill">{zone.radius}</span>
                            <span className="zone-tag">INFLUENCE ZONE 0{i+1}</span>
                          </div>
                          <p className="zone-impact-text">{zone.impact}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* CHAPTER 03: THE OFFICIAL ANNOUNCEMENT & VERIFIED FACTS */}
                  <section id="chapter-3" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 03</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">THE OFFICIAL ANNOUNCEMENT</span>
                    </div>

                    <div className="announcement-dossier-card">
                      <div className="dossier-header-strip">
                        <span className="dossier-ref">REF: {currentSignal.investigation.chapter03.filingRef}</span>
                        <span className="dossier-authority">AUTHORITY: {currentSignal.investigation.chapter03.announcer}</span>
                      </div>
                      <h3 className="dossier-title">{currentSignal.investigation.chapter03.announcementTitle}</h3>

                      <div className="verified-facts-list">
                        {currentSignal.investigation.chapter03.verifiedFacts.map((fact, idx) => (
                          <div key={idx} className="verified-fact-row">
                            <CheckCircle2 size={13} className="text-gold" />
                            <span>{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* CHAPTER 04: THE CHRONOLOGY (Horizontal Track with "We Are Here") */}
                  <section id="chapter-4" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 04</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">DEVELOPMENT CHRONOLOGY</span>
                    </div>

                    <div className="timeline-horizontal-instrument">
                      <div className="timeline-track-line" />
                      
                      <div className="timeline-milestones-grid">
                        {currentSignal.investigation.chapter04.timeline.map((step, idx) => (
                          <div key={idx} className={`timeline-milestone-node ${step.current ? "is-current-step" : ""}`}>
                            <div className="milestone-badge-wrap">
                              <span className="milestone-year">{step.year}</span>
                              {step.current && <span className="we-are-here-flag">WE ARE HERE</span>}
                            </div>
                            
                            <div className="milestone-marker-dot" />

                            <h4 className="milestone-phase-name">{step.phase}</h4>
                            <p className="milestone-detail-text">{step.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* CHAPTER 05: THE PROPOSAL & ARCHITECTURAL SPECIFICATION */}
                  <section id="chapter-5" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 05</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">ARCHITECTURAL PROPOSAL</span>
                    </div>

                    <div className="architectural-specs-deck">
                      <h3 className="specs-deck-title">{currentSignal.investigation.chapter05.proposalName}</h3>
                      <p className="specs-deck-logic">{currentSignal.investigation.chapter05.architecturalLogic}</p>

                      <div className="specs-data-grid">
                        {currentSignal.investigation.chapter05.specs.map((item, i) => (
                          <div key={i} className="spec-data-plate">
                            <span className="spec-label">{item.label}</span>
                            <strong className="spec-val">{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* CHAPTER 06: DEVELOPER CLAIMS VS. AUDIT */}
                  <section id="chapter-6" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 06</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">DEVELOPER CLAIMS VS. FIELD AUDIT</span>
                    </div>

                    <div className="claims-vs-reality-split">
                      <div className="claim-block is-developer">
                        <div className="claim-header">
                          <HelpCircle size={13} />
                          <span>PROJECT / DEVELOPER CLAIM</span>
                        </div>
                        <p className="claim-prose">{currentSignal.investigation.chapter06.developerClaims}</p>
                      </div>

                      <div className="claim-block is-scoutit">
                        <div className="claim-header">
                          <ShieldCheck size={13} className="text-gold" />
                          <span>SCOUTIT SPATIAL AUDIT &amp; REALITY</span>
                        </div>
                        <p className="claim-prose">{currentSignal.investigation.chapter06.scoutItAudit}</p>
                      </div>
                    </div>
                  </section>

                  {/* CHAPTER 07: SCOUTIT INSTITUTIONAL IMPACT MATRIX */}
                  <section id="chapter-7" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 07</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">SCOUTIT SPATIAL IMPACT MATRIX</span>
                    </div>

                    <div className="impact-matrix-instrument">
                      <div className="matrix-table-header">
                        <span className="col-factor">FACTOR</span>
                        <span className="col-short">SHORT TERM</span>
                        <span className="col-long">LONG TERM</span>
                        <span className="col-rationale">SCOUTIT RATIONALE &amp; EVIDENCE</span>
                      </div>

                      <div className="matrix-rows-list">
                        {currentSignal.investigation.chapter07.impactMatrix.map((row, idx) => (
                          <div key={idx} className="matrix-row">
                            <span className="cell-factor">{row.factor}</span>
                            <span className={`cell-short ${row.shortTerm.includes('BOOST') ? 'is-boost' : row.shortTerm.includes('FRICTION') ? 'is-friction' : ''}`}>
                              {row.shortTerm}
                            </span>
                            <span className={`cell-long ${row.longTerm.includes('BOOST') ? 'is-boost' : row.longTerm.includes('FRICTION') ? 'is-friction' : ''}`}>
                              {row.longTerm}
                            </span>
                            <span className="cell-rationale">{row.rationale}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* CHAPTER 08: OSINT EVIDENCE & SOURCE PROVENANCE */}
                  <section id="chapter-8" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 08</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">SOURCE PROVENANCE &amp; OSINT LEDGER</span>
                    </div>

                    <div className="evidence-ledger-instrument">
                      <div className="ledger-header">
                        <FileText size={13} className="text-gold" />
                        <span>CHAIN OF CUSTODY &amp; VERIFIED SOURCES</span>
                      </div>

                      <div className="sources-list">
                        {currentSignal.investigation.chapter08.sources.map((src, i) => (
                          <div key={i} className="source-record-row">
                            <span className={`source-type-pill ${src.type.toLowerCase().replace(' ', '-')}`}>
                              {src.type}
                            </span>
                            <span className="source-name">{src.name}</span>
                            <span className="source-date">{src.date}</span>
                            <span className="source-verified-tag">
                              <ShieldCheck size={11} className="text-gold" />
                              <span>VERIFIED</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Investigation Story Footer Actions */}
                  <footer className="investigation-story-footer">
                    <div className="footer-action-prompt">
                      <h3 className="footer-title">Ready to inspect physical assets in this corridor?</h3>
                      <p className="footer-sub">Explore verified properties situated within the active catchment radius.</p>
                    </div>

                    <div className="footer-buttons-row">
                      <Link href={`/property?type=${currentSignal.category}&_cb=1`} className="footer-browse-btn">
                        <span>Browse Linked Directory Properties</span>
                        <ArrowUpRight size={14} />
                      </Link>

                      <button
                        type="button"
                        className="footer-return-btn"
                        onClick={() => {
                          setInvestigationMode(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <span>← Return to Radar</span>
                      </button>
                    </div>
                  </footer>

                </article>
              )}

            </section>
          </div>

          {/* ── 7. SECONDARY INTEL ARCHIVE GATEWAY (End-of-Layer Action) ── */}
          <section className="workbench-archive-gateway">
            <div className="archive-gateway-inner">
              <div className="archive-gateway-info">
                <div className="archive-gateway-tag">
                  <BookOpen size={12} className="text-gold" />
                  <span>SPATIAL INTELLIGENCE REPOSITORY</span>
                </div>
                <h3 className="archive-gateway-title">
                  Access 50+ Historical Field Briefings &amp; Market Telemetry
                </h3>
                <p className="archive-gateway-desc">
                  Explore full cadastral logs, zoning gazettes, and demographic migration briefings across Metro Manila, Cebu, and island investment zones.
                </p>
              </div>

              <Link href="/intel" className="archive-gateway-cta">
                <span>OPEN THE INTEL ARCHIVE</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>

        </div>

        {/* ── 8. DESCENT WAYPOINT CONTINUATION TO LAYER 03 (METROPOLIS) ── */}
        <LayerTransition 
          nextNum="03" 
          nextName="Metropolis" 
          nextHref="/layer/metropolis" 
          teaser="Drop below the clouds. The city directory opens up." 
        />
      </main>

      {/* ── TACTICAL MONOLITH STYLES (No Slop, No Generic Glassmorphism) ── */}
      <style jsx global>{`
        /* ════════════════════════════════════════════════════════════════
           TACTICAL CARTOGRAPHIC INSTRUMENT DESIGN SYSTEM
        ════════════════════════════════════════════════════════════════ */
        .stratosphere-workbench {
          min-height: 100vh;
          background: #0d0d0d;
          color: #f0ede8;
          font-family: var(--font-body);
          position: relative;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          padding-bottom: calc(88px + env(safe-area-inset-bottom));
          -webkit-font-smoothing: antialiased;
        }

        .workbench-main {
          flex: 1;
          position: relative;
          z-index: 10;
          padding-top: 54px;
        }

        .workbench-container {
          max-width: 1340px;
          margin: 0 auto;
          padding: 24px clamp(16px, 3vw, 36px) 36px;
        }

        .text-gold {
          color: var(--accent);
        }

        /* ── HEADER TELEMETRY STRIP ── */
        .workbench-header {
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 20px;
        }

        .header-telemetry-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 10px;
        }

        .telemetry-node {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--accent);
        }

        .telemetry-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-bright);
          box-shadow: 0 0 8px var(--accent-bright);
          animation: reticlePulse 2s infinite ease-in-out;
        }

        @keyframes reticlePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }

        .telemetry-divider {
          color: rgba(255, 255, 255, 0.2);
        }

        .telemetry-coords {
          color: var(--text-secondary);
        }

        .header-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 8px;
        }

        .header-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 3.8vw, 44px);
          font-weight: 500;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #f7f5f0;
          margin: 0;
        }

        .header-gold-text {
          color: var(--accent);
        }

        .header-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          background: rgba(232, 174, 60, 0.08);
          border: 1px solid rgba(232, 174, 60, 0.25);
          padding: 6px 12px;
          border-radius: 4px;
        }

        .header-mission-statement {
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
          max-width: 680px;
        }

        /* ── TECHNICAL FILTER BAR ── */
        .workbench-filter-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #131316;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 24px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .filter-group::-webkit-scrollbar { display: none; }

        .filter-label {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .filter-pills-wrap {
          display: flex;
          gap: 6px;
        }

        .filter-pill {
          appearance: none;
          background: #1a1a1e;
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 11px;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .filter-pill:hover {
          color: #fff;
          border-color: rgba(232, 174, 60, 0.3);
        }

        .filter-pill.is-active {
          background: var(--accent);
          color: #0d0d0d;
          font-weight: 700;
          border-color: var(--accent);
        }

        /* ── MOBILE VIEW NAV ── */
        .mobile-view-nav {
          display: none;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 18px;
        }

        .mobile-tab-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 6px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 5px;
          cursor: pointer;
        }

        .mobile-tab-btn.is-active {
          background: var(--accent);
          color: #0d0d0d;
          font-weight: 700;
        }

        /* ── WORKBENCH GRID ── */
        .workbench-grid {
          display: grid;
          gap: 24px;
          align-items: start;
        }

        .is-overview-mode .workbench-grid {
          grid-template-columns: minmax(310px, 0.88fr) minmax(0, 1.42fr);
        }

        .is-investigation-mode .workbench-grid {
          grid-template-columns: 56px minmax(0, 1fr);
        }

        /* ════ LEFT: DISCOVERY RADAR COLUMN (~32%) ════ */
        .discovery-radar-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 70px;
        }

        .deck-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #16161a;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .deck-kicker {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .deck-status {
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }

        /* ── CARTOGRAPHIC VECTOR FIELD ── */
        .radar-cartographic-deck {
          background: #111114;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
        }

        .radar-vector-field {
          height: 190px;
          position: relative;
          background: #09090b;
          overflow: hidden;
        }

        .radar-grid-lines {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .radar-concentric-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px dashed rgba(232, 174, 60, 0.15);
          pointer-events: none;
        }
        .radar-concentric-ring.ring-1 { width: 110px; height: 110px; }
        .radar-concentric-ring.ring-2 { width: 220px; height: 220px; }

        .radar-crosshair-h {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
        }
        .radar-crosshair-v {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 1px;
          background: rgba(255, 255, 255, 0.06);
        }

        .radar-signal-node {
          position: absolute;
          transform: translate(-50%, -50%);
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          z-index: 5;
          padding: 4px;
        }

        .node-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          transition: all 0.2s ease;
        }

        .node-label {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
          background: rgba(0, 0, 0, 0.7);
          padding: 1px 4px;
          border-radius: 2px;
        }

        .radar-signal-node.is-focused .node-pulse {
          background: var(--accent-bright);
          box-shadow: 0 0 12px var(--accent-bright);
          transform: scale(1.4);
        }
        .radar-signal-node.is-focused .node-label {
          color: var(--accent);
          font-weight: 700;
        }

        .radar-active-reticle {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 4;
        }

        .reticle-box {
          width: 24px;
          height: 24px;
          border: 1px solid var(--accent);
          position: relative;
        }
        .reticle-box::before {
          content: '';
          position: absolute;
          top: -3px; left: -3px;
          width: 6px; height: 6px;
          border-top: 2px solid var(--accent-bright);
          border-left: 2px solid var(--accent-bright);
        }
        .reticle-box::after {
          content: '';
          position: absolute;
          bottom: -3px; right: -3px;
          width: 6px; height: 6px;
          border-bottom: 2px solid var(--accent-bright);
          border-right: 2px solid var(--accent-bright);
        }

        .reticle-coords {
          position: absolute;
          top: 28px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-mono);
          font-size: 7.5px;
          color: var(--accent);
          letter-spacing: 0.12em;
          white-space: nowrap;
          background: rgba(0, 0, 0, 0.85);
          padding: 1px 5px;
          border: 1px solid rgba(232, 174, 60, 0.3);
          border-radius: 2px;
        }

        .deck-footer-legend {
          display: flex;
          justify-content: space-around;
          padding: 8px 12px;
          background: #141418;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .legend-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .legend-dot.is-gold { background: var(--accent); }
        .legend-dot.is-white { background: #f0ede8; }
        .legend-dot.is-muted { background: #555; }

        /* ── SIGNAL FEED DECK ── */
        .signal-feed-deck {
          background: #111114;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
        }

        .signal-detection-list {
          display: flex;
          flex-direction: column;
          max-height: 480px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(232, 174, 60, 0.3) transparent;
        }

        .signal-detection-item {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          background: transparent;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .signal-detection-item:last-child {
          border-bottom: none;
        }

        .signal-detection-item:hover {
          background: #17171c;
        }

        .signal-detection-item.is-selected {
          background: rgba(232, 174, 60, 0.06);
          border-left: 2px solid var(--accent);
          padding-left: 14px;
        }

        .signal-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .signal-status-tag {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent-bright);
        }

        .signal-cat-tag {
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .signal-item-title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
          color: #f7f5f0;
          margin: 0;
        }

        .signal-item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-secondary);
        }

        .signal-loc-tag,
        .signal-prop-count {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .signal-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 8.5px;
          padding-top: 4px;
          border-top: 1px dashed rgba(255, 255, 255, 0.05);
        }

        .signal-date {
          color: var(--text-muted);
        }

        .signal-action-prompt {
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        /* ── COLLAPSED PERSISTENT RADAR RAIL (6% Mode) ── */
        .collapsed-radar-rail {
          background: #111114;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 16px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          position: sticky;
          top: 70px;
        }

        .rail-back-btn {
          background: #1a1a1e;
          border: 1px solid rgba(232, 174, 60, 0.3);
          color: var(--accent);
          border-radius: 6px;
          padding: 8px 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 100%;
        }
        .rail-back-btn:hover {
          background: var(--accent);
          color: #0d0d0d;
        }
        .rail-btn-text {
          font-family: var(--font-mono);
          font-size: 7.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .rail-signal-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .rail-pulse-node {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-bright);
          box-shadow: 0 0 8px var(--accent-bright);
        }
        .rail-signal-cat {
          font-family: var(--font-mono);
          font-size: 7.5px;
          color: var(--text-muted);
          writing-mode: vertical-rl;
          text-orientation: mixed;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .rail-chapter-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .rail-chapter-dot {
          background: #18181c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          padding: 6px 2px;
          border-radius: 4px;
          cursor: pointer;
          text-align: center;
        }
        .rail-chapter-dot:hover {
          color: #fff;
          border-color: rgba(232, 174, 60, 0.4);
        }
        .rail-chapter-dot.is-active {
          background: var(--accent);
          color: #0d0d0d;
          border-color: var(--accent);
        }

        .rail-evidence-btn {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 7.5px;
          font-weight: 700;
          padding: 8px 2px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 100%;
        }
        .rail-evidence-btn:hover {
          color: var(--accent);
          border-color: var(--accent);
        }

        /* ════ RIGHT: INTELLIGENCE CANVAS COLUMN (~68% Overview / ~94% Investigation) ════ */
        .intelligence-canvas-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ── DEFAULT BRIEF DECK (Simple First, Deep on Demand) ── */
        .intelligence-brief-deck {
          background: #111114;
          border: 1px solid rgba(232, 174, 60, 0.28);
          border-radius: 12px;
          padding: clamp(20px, 3.5vw, 32px);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .brief-meta-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .brief-tag-category {
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          background: var(--accent);
          color: #0d0d0d;
          padding: 3px 8px;
          border-radius: 3px;
        }

        .brief-tag-location,
        .brief-tag-verification {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-secondary);
          background: #18181c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 3px 8px;
          border-radius: 3px;
        }

        .brief-tag-readtime {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
        }

        .brief-headline {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.6vw, 32px);
          font-weight: 500;
          line-height: 1.2;
          color: #f7f5f0;
          margin: 0 0 10px;
        }

        .brief-radius-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          background: rgba(232, 174, 60, 0.06);
          border: 1px solid rgba(232, 174, 60, 0.2);
          padding: 4px 10px;
          border-radius: 4px;
        }

        /* Core Insight Blocks */
        .brief-core-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .brief-insight-block {
          background: #16161a;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .block-eyebrow {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .block-body-text {
          font-size: 13.5px;
          line-height: 1.6;
          color: #d6d4cd;
          margin: 0;
        }

        /* First-Class Impacted Spaces */
        .brief-impacted-spaces-section {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-eyebrow {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .section-helper-tag {
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--text-muted);
        }

        .impacted-spaces-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 12px;
        }

        .impacted-space-node {
          background: #1a1a1f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .impacted-space-node:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .impacted-space-photo {
          height: 100px;
          background-size: cover;
          background-position: center;
          position: relative;
          padding: 6px;
        }

        .impacted-space-radius {
          position: absolute;
          top: 6px;
          left: 6px;
          font-family: var(--font-mono);
          font-size: 7.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          background: rgba(0, 0, 0, 0.85);
          color: var(--accent);
          border: 1px solid rgba(232, 174, 60, 0.35);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .impacted-space-info {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .impacted-space-title {
          font-family: var(--font-display);
          font-size: 13.5px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .impacted-space-loc {
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--text-muted);
        }

        .impacted-space-metrics {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .impacted-space-influence {
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--text-muted);
          padding-top: 6px;
          border-top: 1px dashed rgba(255, 255, 255, 0.06);
          margin-top: 4px;
        }
        .impacted-space-influence strong {
          color: var(--accent-bright);
        }

        /* Brief Action Footer */
        .brief-action-footer {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 8px;
        }

        .enter-investigation-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--accent);
          color: #0d0d0d;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 16px 28px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(232, 174, 60, 0.35);
        }

        .enter-investigation-cta:hover {
          background: var(--accent-bright);
          box-shadow: 0 6px 28px rgba(232, 174, 60, 0.5);
          transform: translateY(-2px);
        }

        .brief-cta-note {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
        }

        /* ── EXPANDED INVESTIGATION STORY ENGINE ── */
        .investigation-story-engine {
          background: #111114;
          border: 1px solid rgba(232, 174, 60, 0.3);
          border-radius: 12px;
          padding: clamp(24px, 4vw, 40px);
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .investigation-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .exit-investigation-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #18181c;
          border: 1px solid rgba(232, 174, 60, 0.3);
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 8px 14px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .exit-investigation-btn:hover {
          background: var(--accent);
          color: #0d0d0d;
        }

        .investigation-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--text-muted);
          letter-spacing: 0.14em;
        }
        .live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent-bright);
        }

        /* Story Chapters */
        .story-chapter {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .story-chapter:last-of-type {
          border-bottom: none;
        }

        .chapter-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .chapter-num { color: var(--accent); }
        .chapter-divider { color: rgba(255, 255, 255, 0.2); }
        .chapter-title-tag { color: var(--text-secondary); }

        .chapter-headline {
          font-family: var(--font-display);
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 500;
          line-height: 1.2;
          color: #f7f5f0;
          margin: 0;
        }

        .chapter-lede {
          font-size: 15.5px;
          line-height: 1.7;
          color: #d6d4cd;
          margin: 0;
        }

        .chapter-body-prose {
          font-size: 14px;
          line-height: 1.65;
          color: #c8c6be;
          margin: 0;
        }

        .territory-context-callout {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #16161a;
          border: 1px solid rgba(232, 174, 60, 0.2);
          border-radius: 6px;
          padding: 10px 14px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
        }

        /* Chapter 02: Radius Zones */
        .radius-zones-instrument {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 8px;
        }

        .radius-zone-card {
          background: #16161a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .zone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .zone-radius-pill {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          color: var(--accent);
        }

        .zone-tag {
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--text-muted);
        }

        .zone-impact-text {
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Chapter 03: Announcement Dossier */
        .announcement-dossier-card {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dossier-header-strip {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }

        .dossier-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0;
        }

        .verified-facts-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .verified-fact-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          line-height: 1.5;
          color: #d6d4cd;
        }

        /* Chapter 04: Horizontal Timeline */
        .timeline-horizontal-instrument {
          position: relative;
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 24px 18px;
          overflow-x: auto;
        }

        .timeline-track-line {
          position: absolute;
          top: 52px;
          left: 20px;
          right: 20px;
          height: 2px;
          background: rgba(232, 174, 60, 0.25);
        }

        .timeline-milestones-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(180px, 1fr));
          gap: 16px;
          position: relative;
          z-index: 2;
        }

        .timeline-milestone-node {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .milestone-badge-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 24px;
        }

        .milestone-year {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
        }

        .we-are-here-flag {
          font-family: var(--font-mono);
          font-size: 7.5px;
          font-weight: 700;
          color: #0d0d0d;
          background: var(--accent-bright);
          padding: 1px 5px;
          border-radius: 3px;
          letter-spacing: 0.1em;
        }

        .milestone-marker-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #222;
          border: 2px solid var(--accent);
          margin-bottom: 4px;
        }

        .timeline-milestone-node.is-current-step .milestone-marker-dot {
          background: var(--accent-bright);
          box-shadow: 0 0 10px var(--accent-bright);
        }

        .milestone-phase-name {
          font-family: var(--font-display);
          font-size: 13.5px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0;
        }

        .milestone-detail-text {
          font-size: 11.5px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Chapter 05: Architectural Proposal */
        .architectural-specs-deck {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .specs-deck-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0;
        }

        .specs-deck-logic {
          font-size: 13px;
          line-height: 1.55;
          color: var(--text-secondary);
          margin: 0;
        }

        .specs-data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .spec-data-plate {
          background: #1a1a1f;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .spec-label {
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .spec-val {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--accent);
        }

        /* Chapter 06: Claims vs. Reality */
        .claims-vs-reality-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .claim-block {
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .claim-block.is-developer {
          background: #16161a;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .claim-block.is-scoutit {
          background: rgba(232, 174, 60, 0.04);
          border: 1px solid rgba(232, 174, 60, 0.25);
        }

        .claim-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .claim-block.is-scoutit .claim-header {
          color: var(--accent);
        }

        .claim-prose {
          font-size: 13px;
          line-height: 1.6;
          color: #d6d4cd;
          margin: 0;
        }

        /* Chapter 07: Impact Matrix */
        .impact-matrix-instrument {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
        }

        .matrix-table-header {
          display: grid;
          grid-template-columns: 180px 140px 140px 1fr;
          gap: 12px;
          padding: 10px 16px;
          background: #18181c;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.12em;
        }

        .matrix-rows-list {
          display: flex;
          flex-direction: column;
        }

        .matrix-row {
          display: grid;
          grid-template-columns: 180px 140px 140px 1fr;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          align-items: center;
          font-size: 12.5px;
        }
        .matrix-row:last-child { border-bottom: none; }

        .cell-factor {
          font-family: var(--font-display);
          font-size: 13px;
          color: #f7f5f0;
        }

        .cell-short, .cell-long {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
        }
        .cell-short.is-boost, .cell-long.is-boost { color: #4caf7d; }
        .cell-short.is-friction, .cell-long.is-friction { color: #e8c84a; }

        .cell-rationale {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        /* Chapter 08: Evidence Ledger */
        .evidence-ledger-instrument {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ledger-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .sources-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .source-record-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #18181c;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 12px;
        }

        .source-type-pill {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #0d0d0d;
          background: var(--accent);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .source-name {
          flex: 1;
          color: #f7f5f0;
        }

        .source-date {
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--text-muted);
        }

        .source-verified-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          color: var(--accent);
        }

        /* Investigation Story Footer */
        .investigation-story-footer {
          background: #141418;
          border: 1px solid rgba(232, 174, 60, 0.25);
          border-radius: 10px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 12px;
        }

        .footer-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0 0 4px;
        }

        .footer-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .footer-buttons-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .footer-browse-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--accent);
          color: #0d0d0d;
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 12px 18px;
          border-radius: 6px;
          text-decoration: none;
        }

        .footer-return-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f7f5f0;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        /* ── SECONDARY ARCHIVE GATEWAY ── */
        .workbench-archive-gateway {
          margin-top: 48px;
          margin-bottom: 24px;
        }

        .archive-gateway-inner {
          background: #131316;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .archive-gateway-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 6px;
        }

        .archive-gateway-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0 0 6px;
        }

        .archive-gateway-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          max-width: 600px;
        }

        .archive-gateway-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #1a1a1f;
          border: 1px solid rgba(232, 174, 60, 0.35);
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 12px 20px;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .archive-gateway-cta:hover {
          background: var(--accent);
          color: #0d0d0d;
        }

        /* ── RESPONSIVE ADAPTATIONS ── */
        @media (max-width: 1080px) {
          .is-overview-mode .workbench-grid {
            grid-template-columns: 1fr;
          }

          .discovery-radar-column {
            position: static;
          }

          .mobile-view-nav {
            display: grid;
          }

          .discovery-radar-column:not(.is-mobile-active) {
            display: none;
          }

          .intelligence-canvas-column:not(.is-mobile-active) {
            display: none;
          }

          .brief-core-grid {
            grid-template-columns: 1fr;
          }

          .claims-vs-reality-split {
            grid-template-columns: 1fr;
          }

          .matrix-table-header,
          .matrix-row {
            grid-template-columns: 120px 100px 100px 1fr;
          }
        }
      `}</style>
    </div>
  );
}
