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
  Crosshair,
  Maximize2,
  Minimize2,
  CheckCircle2,
  HelpCircle,
  Eye,
  ArrowUpRight,
  Info,
  Sliders,
  Check,
  AlertCircle
} from "lucide-react";

import LayerNav from "@/components/descent/LayerNav";
import LayerTransition from "@/components/descent/LayerTransition";
import StratosphereRadarMap from "@/components/intel/StratosphereRadarMap";

// ── TECHNICAL CATEGORIES & TERRITORY CORRIDORS ──────────────────
const CATEGORIES = [
  "All",
  "Zoning",
  "Development",
  "Transit",
  "Infrastructure",
  "Commercial",
  "Hospitality",
  "STR"
];

const REGIONS = [
  "All Regions",
  "Makati CBD",
  "BGC & Taguig",
  "Manila Bay",
  "Siargao",
  "Palawan",
  "Metro Cebu"
];

// ── GEOGRAPHICALLY PLAUSIBLE SPATIAL SIGNALS & AFFECTED ASSETS ───
const SPATIAL_SIGNALS = [
  {
    id: "sig-makati-leed",
    slug: "green-office-demand",
    title: "LEED Platinum Mandate & Makati CBD Office Modernization",
    category: "Zoning",
    statusBadge: "ORDINANCE RATIFIED",
    statusType: "active",
    location: "Ayala Avenue, Makati CBD",
    region: "Makati CBD",
    coords: { lat: 14.5547, lng: 121.0244, x: 52, y: 48 },
    corridorName: "Ayala Avenue & Paseo de Roxas",
    impactRadius: "Ayala Corridor // 800m Zone",
    date: "August 2026",
    readTime: "4 MIN READ",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "99% CONFIDENCE",
    evidenceStats: "3 PRIMARY SOURCES · 1 GOVERNMENT RECORD · LAST AUDITED 16 AUG 2026",
    summary: {
      whatHappened: "Makati City has ratified Ordinance No. 2026-042, mandating that all commercial office towers along Ayala Avenue and Paseo de Roxas achieve minimum LEED Gold or Platinum energy certification by Q4 2027.",
      whyItMatters: "Forces legacy building owners into ₱180M+ façade and HVAC upgrades while driving multinational institutional tenants to secure certified green spaces, creating a 22% rental divergence between certified and uncertified inventory.",
      affectedCount: 3
    },
    // Geographically Plausible Affected ScoutIt Properties situated in Makati CBD
    affectedSpaces: [
      {
        id: "prop-makati-one-ayala",
        slug: "the-estate-makati",
        title: "One Ayala Corporate Tower",
        location: "Ayala Avenue, Makati CBD",
        distance: "260m FROM CORRIDOR CORE",
        relationReason: "Covered territory · Existing office inventory",
        impactTag: "↑ Modernization Pressure",
        classification: "UPGRADE REQUIRED",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
        specs: "42,000 sqm · 32 Floors",
        coords: { x: 50, y: 46 }
      },
      {
        id: "prop-makati-estate",
        slug: "sky-pavilion-makati",
        title: "The Estate Makati Tower",
        location: "Paseo de Roxas, Makati CBD",
        distance: "480m FROM AYALA INTERSECTION",
        relationReason: "Adjacent luxury buffer · Low-E glass installed",
        impactTag: "● Pre-Compliant Asset",
        classification: "ALREADY COMPLIANT",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
        specs: "650 sqm Penthouse · Floor 54",
        coords: { x: 56, y: 52 }
      },
      {
        id: "prop-makati-salcedo-center",
        slug: "the-estate-makati",
        title: "Salcedo Commercial Heritage Block",
        location: "Salcedo Village, Makati CBD",
        distance: "820m SECONDARY PERIMETER",
        relationReason: "Secondary compliance deadline Q4 2028",
        impactTag: "⚠ CapEx Retrofit Pending",
        classification: "LIKELY RETROFIT REQUIRED",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
        specs: "14,500 sqm · Mid-Rise Office",
        coords: { x: 46, y: 42 }
      }
    ],
    // The 8-Chapter Investigation Story Engine
    investigation: {
      chapter01: {
        headline: "The green threshold is reshaping Makati's skyline economics.",
        lede: "The ratification of Makati City Ordinance No. 2026-042 establishes an irreversible carbon ceiling for commercial buildings across Ayala Avenue, Paseo de Roxas, and Makati Avenue. Uncertified legacy towers face progressive municipal tax surcharges, creating an unprecedented wave of architectural retrofits.",
        jurisdiction: "Makati City Urban Planning & Environmental Services Department",
        statusSummary: "RATIFIED & ENFORCEABLE · COMPLIANCE DEADLINE Q4 2027"
      },
      chapter02: {
        territoryHeadline: "Ayala Avenue & Paseo de Roxas Catchment Corridor",
        territoryNotes: "The ordinance applies strictly to commercial assets exceeding 12 stories within the Makati Central Business District core.",
        corridors: [
          { name: "Ayala Avenue Core", length: "2.4 km", towerCount: 38, focus: "Primary Tier-1 Tower Focus" },
          { name: "Paseo de Roxas Strip", length: "1.8 km", towerCount: 22, focus: "Financial & Legal Headquarters" },
          { name: "Salcedo / Legazpi Buffer", length: "3.1 km", towerCount: 16, focus: "Secondary Mixed-Use Compliance" }
        ]
      },
      chapter03: {
        requirementHeadline: "What the Ordinance Mandates",
        frameworkSteps: [
          { step: "01", title: "ENERGY BASELINE", desc: "Mandatory 25% energy reduction below baseline ASHRAE 90.1 energy performance standards." },
          { step: "02", title: "LOW-E GLAZING", desc: "Façade retrofits requiring double-glazed Low-E glass with solar heat gain coefficient (SHGC) < 0.28." },
          { step: "03", title: "HVAC DECARBONIZATION", desc: "Replacement of legacy CFC/HCFC chillers with magnetic-bearing variable speed systems." },
          { step: "04", title: "CERTIFICATION AUDIT", desc: "USGBC LEED Gold/Platinum or PHILGBC BERDE 4-Star certification filed by Q4 2027." }
        ]
      },
      chapter04: {
        classificationHeadline: "Building Exposure & Compliance Ledger",
        buildingLedger: [
          { name: "One Ayala Corporate Tower", status: "UPGRADE REQUIRED", risk: "HIGH", detail: "Chiller overhaul required; façade meets 80% of thermal specs." },
          { name: "The Estate Makati", status: "ALREADY COMPLIANT", risk: "NONE", detail: "Pre-certified LEED Gold upon structural completion in 2024." },
          { name: "Salcedo Commercial Heritage Block", status: "RETROFIT REQUIRED", risk: "MODERATE", detail: "Secondary deadline allows phased CapEx deployment across 24 months." },
          { name: "Ayala Triangle Tower Two", status: "ALREADY COMPLIANT", risk: "NONE", detail: "LEED Platinum benchmark asset with zero penalty exposure." }
        ]
      },
      chapter05: {
        timeline: [
          { year: "2024", phase: "Baseline Carbon Mapping", status: "COMPLETED", detail: "Sensor telemetry mapped energy usage across 140 commercial towers." },
          { year: "2026", phase: "Ordinance Ratification", status: "WE ARE HERE", current: true, detail: "City Council enacts mandatory compliance schedule with tax incentives." },
          { year: "2027", phase: "Verification Audit Deadline", status: "PLANNED", detail: "Final deadline to submit certified third-party engineering audits." },
          { year: "2028", phase: "Penalty Surcharges Active", status: "TARGET", detail: "1.8% annual commercial property tax surcharge applied to uncertified stock." }
        ]
      },
      chapter06: {
        pressures: [
          { title: "CAPEX UPGRADE COSTS", severity: "HIGH", text: "Average retrofit CapEx ranges between ₱120M to ₱210M per commercial high-rise tower." },
          { title: "TENANT ESG COVENANTS", severity: "CRITICAL", text: "Multinational tech and banking tenants legally barred by global corporate policies from renewing leases in uncertified buildings." },
          { title: "OPERATIONAL ADVANTAGE", severity: "POSITIVE", text: "Certified retrofits yield a 28% reduction in recurring building electricity bills." }
        ]
      },
      chapter07: {
        marketShift: {
          certifiedStock: { title: "CERTIFIED / RETROFITTED ASSETS", points: ["Commanding +18% to +24% rental premiums", "100% occupancy retention from global firms", "Eligible for municipal property tax rebates"] },
          legacyStock: { title: "UNCERTIFIED LEGACY ASSETS", points: ["Tenant flight to newer certified buildings", "1.8% annual municipal property tax penalties", "Substantial asset valuation write-downs"] }
        }
      },
      chapter08: {
        impactMatrix: [
          { factor: "Tenant Demand", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Multinational ESG procurement mandates demand certified space." },
          { factor: "Retrofit CapEx", shortTerm: "MODERATE FRICTION", longTerm: "RESOLVED", rationale: "Heavy initial capital outlays recovered via 28% lower operating power costs." },
          { factor: "Rental Rate Spread", shortTerm: "STABLE", longTerm: "HIGH BOOST", rationale: "Growing 22% rental price divergence between green and legacy floorplates." },
          { factor: "Vacancy Risk (Legacy)", shortTerm: "LOW", longTerm: "MODERATE FRICTION", rationale: "Uncertified older buildings face steady tenant attrition." },
          { factor: "Grid Energy Load", shortTerm: "STABLE", longTerm: "HIGH BOOST", rationale: "Projected 42,000-ton annual carbon reduction across the CBD." }
        ]
      },
      evidenceSources: [
        { type: "PRIMARY", name: "Makati City Council Ordinance No. 2026-042", date: "July 2026", verified: true },
        { type: "GOVERNMENT", name: "Philippine Green Building Council (PHILGBC) Register", date: "June 2026", verified: true },
        { type: "SECONDARY", name: "Colliers Philippine Office Market Intelligence Report Q2 2026", date: "August 2026", verified: true },
        { type: "SCOUTIT VERIFIED", name: "On-Site Façade & Chiller Engineering Audit", date: "August 2026", verified: true }
      ]
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
    coords: { lat: 14.5409, lng: 121.0503, x: 64, y: 54 },
    corridorName: "11th Avenue & Kalayaan Perimeter",
    impactRadius: "BGC West // 800m Station Catchment",
    date: "July 2026",
    readTime: "4 MIN READ",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "99% CONFIDENCE",
    evidenceStats: "4 PRIMARY SOURCES · 2 GOVERNMENT RECORDS · LAST AUDITED 12 AUG 2026",
    summary: {
      whatHappened: "Tunnel boring machines advancing toward BGC West Station have triggered a rapid spatial realignment: private capital is aggressively acquiring low-density modernist villas with private acoustic buffers before station activation.",
      whyItMatters: "Direct 18-minute subterranean transit connection to NAIA Airport is driving a 38% price premium on single-detached residences within walking distance.",
      affectedCount: 3
    },
    affectedSpaces: [
      {
        id: "prop-bgc-glasshouse",
        slug: "the-glasshouse-bgc",
        title: "The Glasshouse BGC",
        location: "11th Avenue, BGC, Taguig",
        distance: "180m FROM WEST STATION PORTAL",
        relationReason: "Direct subterranean concourse portal link",
        impactTag: "↑ +38% Appreciation Surge",
        classification: "PRIME BENEFICIARY",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
        specs: "450 sqm · Modernist Villa",
        coords: { x: 62, y: 52 }
      },
      {
        id: "prop-bgc-aurelia",
        slug: "aurelia-residences",
        title: "Aurelia Residences",
        location: "5th Avenue, BGC, Taguig",
        distance: "450m FROM TUNNEL ALIGNMENT",
        relationReason: "Acoustic buffer verified · Floating trackbed isolation",
        impactTag: "● High Demand Hold",
        classification: "PRIME BENEFICIARY",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
        specs: "380 sqm · Signature Suite",
        coords: { x: 66, y: 58 }
      },
      {
        id: "prop-bgc-villa-4",
        slug: "the-glasshouse-bgc",
        title: "Kalayaan Border Villa #04",
        location: "West Perimeter, BGC, Taguig",
        distance: "780m WALKING CATCHMENT",
        relationReason: "Off-market acquisition surge · Transit proximity",
        impactTag: "↑ Private Inquiries +45%",
        classification: "HIGH IMPACT",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        specs: "520 sqm · Acoustic Compound",
        coords: { x: 60, y: 50 }
      }
    ],
    investigation: {
      chapter01: {
        headline: "Subterranean mobility is restructuring BGC's perimeter value.",
        lede: "The arrival of the Metro Manila Subway beneath 11th Avenue represents the most profound transit intervention in Bonifacio Global City since its original master plan. Private family offices are aggressively acquiring surrounding residential assets.",
        jurisdiction: "Department of Transportation & BCDA",
        statusSummary: "TUNNEL BORING UNDERWAY · TARGET ACTIVATION 2028"
      },
      chapter02: {
        territoryHeadline: "BGC West Station 800-Meter Pedestrian Catchment",
        territoryNotes: "Encompasses the western commercial boundary along 11th Avenue and low-density residential buffers.",
        corridors: [
          { name: "11th Avenue Transit Spine", length: "1.4 km", towerCount: 18, focus: "Direct Subway Station Access" },
          { name: "5th Avenue Luxury Corridor", length: "1.8 km", towerCount: 14, focus: "High-End Residential Nodes" }
        ]
      },
      chapter03: {
        requirementHeadline: "Subterranean Transit Specifications",
        frameworkSteps: [
          { step: "01", title: "STATION DEPTH", desc: "-24.5 meters below street grade with 4 integrated concourse plazas." },
          { step: "02", title: "AIRPORT LINK", desc: "Direct 18-minute express transit connection to NAIA Terminal 3." },
          { step: "03", title: "VIBRATION DAMPING", desc: "Floating slab trackbeds absorb all kinetic subterranean vibration." }
        ]
      },
      chapter04: {
        classificationHeadline: "Catchment Exposure Ledger",
        buildingLedger: [
          { name: "The Glasshouse BGC", status: "PRIME BENEFICIARY", risk: "NONE", detail: "Direct subterranean concourse portal link within 180m." },
          { name: "Aurelia Residences", status: "HIGH DEMAND", risk: "NONE", detail: "Acoustic buffer verified; zero track noise transmission." }
        ]
      },
      chapter05: {
        timeline: [
          { year: "2024", phase: "Shaft Excavation & Piling", status: "COMPLETED", detail: "Diaphragm perimeter walls completed." },
          { year: "2026", phase: "Tunnel Boring Active", status: "WE ARE HERE", current: true, detail: "Dual TBMs advancing toward BGC West." },
          { year: "2028", phase: "Commercial Activation", status: "TARGET", detail: "Passenger revenue service opens." }
        ]
      },
      chapter06: {
        pressures: [
          { title: "TRANSIT VELOCITY", severity: "POSITIVE", text: "Eliminates surface highway congestion for airport travel." },
          { title: "SURFACE TRAFFIC", severity: "MODERATE", text: "Station drop-off zones require strict municipal curb management." }
        ]
      },
      chapter07: {
        marketShift: {
          certifiedStock: { title: "STATION-LINKED ASSETS", points: ["+38% capital appreciation surge", "Rapid off-market acquisition velocity", "Guaranteed high-net-worth rental demand"] },
          legacyStock: { title: "OUTER CORRIDOR ASSETS", points: ["Slower relative capital growth", "Dependent on surface vehicular travel"] }
        }
      },
      chapter08: {
        impactMatrix: [
          { factor: "Transit Access", shortTerm: "STABLE", longTerm: "HIGH BOOST", rationale: "Direct 18-minute airport subway connection." },
          { factor: "Property Values", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Historical +38% premium on transit-linked prime residences." }
        ]
      },
      evidenceSources: [
        { type: "PRIMARY", name: "DOTr Metro Manila Subway Project Ledger", date: "July 2026", verified: true },
        { type: "GOVERNMENT", name: "Taguig City Urban Development Authority", date: "May 2026", verified: true }
      ]
    }
  },
  {
    id: "sig-manila-bay",
    slug: "manila-venue-trends",
    title: "Bay Area Glass Atrium Pavilions & Corporate Spatial Tech",
    category: "Development",
    statusBadge: "UNDERWAY · Q4 2028",
    statusType: "active",
    location: "Manila Bay, Pasay / Parañaque",
    region: "Manila Bay",
    coords: { lat: 14.5320, lng: 120.9820, x: 42, y: 58 },
    corridorName: "Seaside Boulevard & Aseana City",
    impactRadius: "Bay Area // 1.2km Coastal Catchment",
    date: "July 2026",
    readTime: "5 MIN READ",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "98% CONFIDENCE",
    evidenceStats: "3 PRIMARY SOURCES · 1 GOVERNMENT RECORD · LAST AUDITED 14 AUG 2026",
    summary: {
      whatHappened: "A 4.8-hectare reclaimed waterfront parcel in Pasay has broken ground for two double-height, photovoltaic glass atrium pavilions designed for international corporate tech summits.",
      whyItMatters: "Directly shifts Manila's corporate event gravity from traditional subterranean ballrooms to daylight-drenched waterfront assets, triggering a 28% surge in surrounding commercial property inquiries.",
      affectedCount: 2
    },
    affectedSpaces: [
      {
        id: "prop-bay-solaire-ballroom",
        slug: "solaire-grand-ballroom",
        title: "Bayfront Glass Pavilion & Event Suite",
        location: "Aseana City, Pasay",
        distance: "250m DIRECT WATERFRONT",
        relationReason: "Directly facing new atrium campus · Hospitality surge",
        impactTag: "↑ +28% Inquiry Surge",
        classification: "PRIME BENEFICIARY",
        image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80",
        specs: "1,200 sqm · Coastal Pavilion",
        coords: { x: 40, y: 56 }
      },
      {
        id: "prop-bay-aseana-tower",
        slug: "solaire-grand-ballroom",
        title: "Aseana Waterfront Commercial Floorplates",
        location: "Seaside Blvd, Parañaque",
        distance: "600m FROM CAMPUS",
        relationReason: "Corporate spillover & executive lodging catchment",
        impactTag: "↑ High Commercial Demand",
        classification: "HIGH IMPACT",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
        specs: "2,400 sqm · Grade A Floorplate",
        coords: { x: 44, y: 60 }
      }
    ],
    investigation: {
      chapter01: {
        headline: "Something is changing across the Manila Bay waterfront.",
        lede: "The ground-breaking of the Bay Area Glass Atrium Pavilions marks a permanent architectural break: a 4.8-hectare waterfront campus that merges maritime sunset vistas with high-bandwidth spatial computing infrastructure.",
        jurisdiction: "Philippine Convention & Exhibition Bureau (PCEB) & Pasay City",
        statusSummary: "FOUNDATIONS COMPLETE · SUPERSTRUCTURE UNDERWAY"
      },
      chapter02: {
        territoryHeadline: "Seaside Boulevard & Aseana Coastal Corridor",
        territoryNotes: "Directly anchors the northern perimeter of the Bay Area Entertainment City with 35-meter public boardwalk setback.",
        corridors: [
          { name: "Seaside Boulevard Waterfront", length: "3.2 km", towerCount: 24, focus: "Waterfront Atrium & Event Hub" }
        ]
      },
      chapter03: {
        requirementHeadline: "Architectural & Spatial Specifications",
        frameworkSteps: [
          { step: "01", title: "14M CEILING CLEAR", desc: "Double-curved panoramic glass pavilions with unobstructed bay views." },
          { step: "02", title: "BIPV SOLAR ARRAY", desc: "2.4 MW rooftop solar glass offsetting 64% of campus energy." }
        ]
      },
      chapter04: {
        classificationHeadline: "Catchment Exposure Ledger",
        buildingLedger: [
          { name: "Bayfront Glass Pavilion", status: "PRIME BENEFICIARY", risk: "NONE", detail: "Direct pedestrian esplanade connection." }
        ]
      },
      chapter05: {
        timeline: [
          { year: "2025", phase: "Deep Caisson Piling", status: "COMPLETED", detail: "420 reinforced concrete piles driven into bedrock." },
          { year: "2026", phase: "Diagrid Steel Erection", status: "WE ARE HERE", current: true, detail: "Superstructure assembly active." },
          { year: "2028", phase: "Global Summit Opening", status: "TARGET", detail: "Commissioning for Asia-Pacific Spatial Summit." }
        ]
      },
      chapter06: {
        pressures: [
          { title: "EVENT GRAVITY", severity: "POSITIVE", text: "Attracts 14,000 weekly executive delegates." }
        ]
      },
      chapter07: {
        marketShift: {
          certifiedStock: { title: "WATERFRONT VENUES", points: ["Premium booking rates", "High corporate tech demand"] },
          legacyStock: { title: "SUBTERRANEAN HALLS", points: ["Discounted pricing pressure", "Loss of tech event market share"] }
        }
      },
      chapter08: {
        impactMatrix: [
          { factor: "Commercial Footfall", shortTerm: "LOW", longTerm: "HIGH BOOST", rationale: "Estimated 14,000 weekly executive visitors." },
          { factor: "Property Values", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Surrounding commercial spaces command +24% pre-completion leasing premium." }
        ]
      },
      evidenceSources: [
        { type: "PRIMARY", name: "Philippine Convention & Exhibition Bureau Gazette", date: "June 2026", verified: true }
      ]
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
    coords: { lat: 9.7800, lng: 126.1550, x: 78, y: 72 },
    corridorName: "Tourism Road & Tuason Beach",
    impactRadius: "Cloud 9 to Tuason Beach // 6km Corridor",
    date: "June 2026",
    readTime: "3 MIN READ",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "97% CONFIDENCE",
    evidenceStats: "2 PRIMARY SOURCES · 1 GOVERNMENT RECORD · LAST AUDITED 10 AUG 2026",
    summary: {
      whatHappened: "Boutique hospitality syndicates are executing off-market land consolidations along Siargao's extended surf breaks, generating annual short-term rental yields exceeding 22%.",
      whyItMatters: "Runway expansion at Sayak Airport allowing direct regional flights has accelerated private acquisitions of titled beachfront land.",
      affectedCount: 2
    },
    affectedSpaces: [
      {
        id: "prop-siargao-villa",
        slug: "siargao-tropical-villa",
        title: "Siargao Tropical Surf Pavilion",
        location: "General Luna, Siargao",
        distance: "120m FROM TUASON POINT",
        relationReason: "25m coastal easement compliant · 22.4% ARR target",
        impactTag: "↑ 22.4% Annual Yield",
        classification: "PRIME BENEFICIARY",
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
        specs: "320 sqm · Teak Surf Villa",
        coords: { x: 76, y: 70 }
      },
      {
        id: "prop-siargao-cloud9",
        slug: "siargao-tropical-villa",
        title: "Cloud 9 Off-Grid Villa Compound",
        location: "General Luna, Siargao",
        distance: "380m FROM SURF BREAK",
        relationReason: "Titled beachfront parcel · 100% solar microgrid",
        impactTag: "● High Occupancy Asset",
        classification: "PRIME BENEFICIARY",
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80",
        specs: "480 sqm · 4 Pavilions",
        coords: { x: 80, y: 74 }
      }
    ],
    investigation: {
      chapter01: {
        headline: "Direct regional aviation is reshaping Siargao's coastal land values.",
        lede: "The extension of the runway at Sayak Airport to accommodate direct regional jet arrivals from Singapore and Hong Kong has permanently altered Siargao's investment velocity.",
        jurisdiction: "Civil Aviation Authority of the Philippines & DOT",
        statusSummary: "RUNWAY PAVING COMPLETED · DIRECT FLIGHTS Q1 2027"
      },
      chapter02: {
        territoryHeadline: "General Luna 6.4-Kilometer Coastal Strip",
        territoryNotes: "Strict 25-meter coastal easement setback enforced by DENR on all new structural developments.",
        corridors: [
          { name: "Tourism Road Beachfront", length: "6.4 km", towerCount: 0, focus: "Eco-Luxury Teak Pavilions" }
        ]
      },
      chapter03: {
        requirementHeadline: "Eco-Luxury Construction Standards",
        frameworkSteps: [
          { step: "01", title: "SETBACK COMPLIANCE", desc: "25-meter coastal buffer zone with elevated teak boardwalks." },
          { step: "02", title: "SOLAR MICROGRID", desc: "100% off-grid solar-battery systems mandatory." }
        ]
      },
      chapter04: {
        classificationHeadline: "Coastal Asset Ledger",
        buildingLedger: [
          { name: "Siargao Tropical Surf Pavilion", status: "PRIME BENEFICIARY", risk: "NONE", detail: "Full DENR coastal easement compliance." }
        ]
      },
      chapter05: {
        timeline: [
          { year: "2024", phase: "Airport Foundation Paved", status: "COMPLETED", detail: "Runway foundation extended to 1,800m." },
          { year: "2026", phase: "Land Consolidation Wave", status: "WE ARE HERE", current: true, detail: "Syndicates acquiring titled plots." },
          { year: "2027", phase: "International Flight Inflow", status: "TARGET", detail: "Direct flights from Singapore and HK." }
        ]
      },
      chapter06: {
        pressures: [
          { title: "SCARCITY DYNAMICS", severity: "HIGH", text: "Only 14 titled coastal parcels remain along primary surf breaks." }
        ]
      },
      chapter07: {
        marketShift: {
          certifiedStock: { title: "TITLED OFF-GRID ESTATES", points: ["22%+ annual rental yield", "High international tourist ADRs"] },
          legacyStock: { title: "UNTITLED / NON-COMPLIANT", points: ["High regulatory demolition risk", "Grid blackouts"] }
        }
      },
      chapter08: {
        impactMatrix: [
          { factor: "Rental Yield", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Current ADRs of ₱35,000/night with extreme luxury scarcity." }
        ]
      },
      evidenceSources: [
        { type: "PRIMARY", name: "CAAP Sayak Airport Development Record", date: "June 2026", verified: true }
      ]
    }
  }
];

export default function StratosphereWorkbench() {
  const router = useRouter();
  
  // ── WORKBENCH STATE ──────────────────────────────────────────
  const [activeSignalId, setActiveSignalId] = useState("sig-makati-leed");
  const [investigationMode, setInvestigationMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRegion, setActiveRegion] = useState("All Regions");
  const [activeChapter, setActiveChapter] = useState(1);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [hoveredSignalId, setHoveredSignalId] = useState(null);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState("radar"); // 'radar' | 'brief' | 'investigation'

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

  // Ensure active signal is valid
  useEffect(() => {
    if (filteredSignals.length > 0) {
      if (!filteredSignals.some(s => s.id === activeSignalId)) {
        setActiveSignalId(filteredSignals[0].id);
      }
    }
  }, [filteredSignals, activeSignalId]);

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
              <span className="telemetry-coords">{currentSignal.coords.lat.toFixed(4)}° N, {currentSignal.coords.lng.toFixed(4)}° E · {currentSignal.region.toUpperCase()}</span>
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
              The physical world changes. ScoutIt detects the signal, maps its territory, connects it to affected spaces, and investigates what happens next.
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
              <span>1. Radar ({filteredSignals.length})</span>
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
                  className={`rail-evidence-btn ${evidenceDrawerOpen ? "is-active" : ""}`}
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
                
                {/* ── A. Interactive Spatial Map Deck with Pin Dropping ── */}
                <section className="radar-cartographic-deck">
                  <div className="deck-header">
                    <div className="deck-kicker">
                      <Crosshair size={12} className="text-gold" />
                      <span>SPATIAL RADAR // {currentSignal.corridorName.toUpperCase()}</span>
                    </div>
                    <span className="deck-status">CARTOGRAPHIC INTEL</span>
                  </div>

                  {/* Real Map System with Animated Dropping Beacon Pin & Linked Properties */}
                  <StratosphereRadarMap
                    currentSignal={currentSignal}
                    affectedSpaces={currentSignal.affectedSpaces}
                    hoveredPropertyId={hoveredPropertyId}
                    onSelectProperty={(prop) => router.push(`/property/${prop.slug}`)}
                  />
                </section>

                {/* ── B. Compact Signal Detection Feed ── */}
                <section className="signal-feed-deck">
                  <div className="deck-header">
                    <div className="deck-kicker">
                      <Radio size={12} className="text-gold" />
                      <span>DISCOVERED SIGNALS ({filteredSignals.length})</span>
                    </div>
                    <span className="deck-status">REAL-TIME RADAR</span>
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
                          onMouseEnter={() => setHoveredSignalId(sig.id)}
                          onMouseLeave={() => setHoveredSignalId(null)}
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
                              {isSelected ? "● ACTIVE INTELLIGENCE" : "INSPECT"}
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
                  
                  {/* Brief Header & Provenance Strip */}
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
                    
                    <div className="brief-provenance-strip">
                      <div className="provenance-strip-left">
                        <FileText size={11} className="text-gold" />
                        <span>{currentSignal.evidenceStats}</span>
                      </div>
                      <span className="confidence-pill">{currentSignal.confidence}</span>
                    </div>
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
                        <span>02 // WHY THIS MATTERS FOR THIS PLACE</span>
                      </div>
                      <p className="block-body-text">{currentSignal.summary.whyItMatters}</p>
                    </div>
                  </div>

                  {/* First-Class Spatially Plausible Affected Properties */}
                  <section className="brief-impacted-spaces-section">
                    <div className="section-header-row">
                      <div className="section-eyebrow">
                        <Building2 size={13} className="text-gold" />
                        <span>AFFECTED SCOUTIT SPACES IN THIS CATCHMENT ({currentSignal.affectedSpaces.length})</span>
                      </div>
                      <span className="section-helper-tag">HOVER TO HIGHLIGHT ON RADAR</span>
                    </div>

                    <div className="impacted-spaces-strip">
                      {currentSignal.affectedSpaces.map((prop) => (
                        <div
                          key={prop.id}
                          className={`impacted-space-node ${hoveredPropertyId === prop.id ? "is-radar-focused" : ""}`}
                          onMouseEnter={() => setHoveredPropertyId(prop.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          onClick={() => router.push(`/property/${prop.slug}`)}
                        >
                          <div className="impacted-space-header">
                            <span className="impacted-space-dist">{prop.distance}</span>
                            <span className={`impacted-space-class ${prop.classification.replace(' ', '-').toLowerCase()}`}>
                              {prop.classification}
                            </span>
                          </div>

                          <div className="impacted-space-body">
                            <h4 className="impacted-space-title">{prop.title}</h4>
                            <span className="impacted-space-loc">{prop.location}</span>
                            
                            <div className="impacted-space-reason">
                              <span className="reason-bullet">●</span>
                              <span>{prop.relationReason}</span>
                            </div>

                            <div className="impacted-space-footer">
                              <span className="impact-tag-text">{prop.impactTag}</span>
                              <span className="view-space-link">VIEW SPACE →</span>
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
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Sparkles size={16} />
                      <span>ENTER FULL SPATIAL INVESTIGATION</span>
                      <ArrowRight size={16} />
                    </button>

                    <div className="brief-cta-note">
                      <span>Expands 8-chapter evidence room, timeline, &amp; ScoutIt impact matrix</span>
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
                      <span>INVESTIGATION ACTIVE // {currentSignal.slug}</span>
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
                      <ShieldCheck size={14} className="text-gold" />
                      <span>JURISDICTION &amp; STATUS: {currentSignal.investigation.chapter01.jurisdiction} · {currentSignal.investigation.chapter01.statusSummary}</span>
                    </div>
                  </section>

                  {/* CHAPTER 02: THE TERRITORY */}
                  <section id="chapter-2" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 02</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">TERRITORY &amp; CORRIDORS</span>
                    </div>

                    <h3 className="chapter-subheading">{currentSignal.investigation.chapter02.territoryHeadline}</h3>
                    <p className="chapter-body-prose">{currentSignal.investigation.chapter02.territoryNotes}</p>

                    <div className="corridor-breakdown-grid">
                      {currentSignal.investigation.chapter02.corridors.map((c, i) => (
                        <div key={i} className="corridor-card">
                          <div className="corridor-head">
                            <span className="corridor-name">{c.name}</span>
                            <span className="corridor-length">{c.length}</span>
                          </div>
                          <div className="corridor-metric">
                            <span>{c.towerCount} Prime Towers</span>
                            <span>·</span>
                            <strong className="text-gold">{c.focus}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* CHAPTER 03: WHAT THE RULE REQUIRES */}
                  <section id="chapter-3" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 03</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">WHAT THE ORDINANCE REQUIRES</span>
                    </div>

                    <h3 className="chapter-subheading">{currentSignal.investigation.chapter03.requirementHeadline}</h3>

                    <div className="framework-steps-grid">
                      {currentSignal.investigation.chapter03.frameworkSteps.map((s, idx) => (
                        <div key={idx} className="framework-step-card">
                          <span className="step-num">{s.step}</span>
                          <h4 className="step-title">{s.title}</h4>
                          <p className="step-desc">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* CHAPTER 04: WHICH BUILDINGS ARE EXPOSED */}
                  <section id="chapter-4" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 04</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">BUILDING EXPOSURE &amp; COMPLIANCE LEDGER</span>
                    </div>

                    <h3 className="chapter-subheading">{currentSignal.investigation.chapter04.classificationHeadline}</h3>

                    <div className="exposure-table-deck">
                      {currentSignal.investigation.chapter04.buildingLedger.map((b, idx) => (
                        <div key={idx} className="exposure-row">
                          <div className="exposure-building-name">
                            <Building2 size={13} className="text-gold" />
                            <span>{b.name}</span>
                          </div>
                          <span className={`exposure-status-pill ${b.status.toLowerCase().replace(' ', '-')}`}>
                            {b.status}
                          </span>
                          <span className="exposure-detail">{b.detail}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* CHAPTER 05: THE TIMELINE (Horizontal Track with "We Are Here") */}
                  <section id="chapter-5" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 05</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">COMPLIANCE TIMELINE</span>
                    </div>

                    <div className="timeline-horizontal-instrument">
                      <div className="timeline-track-line" />
                      
                      <div className="timeline-milestones-grid">
                        {currentSignal.investigation.chapter05.timeline.map((step, idx) => (
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

                  {/* CHAPTER 06: MODERNIZATION PRESSURE */}
                  <section id="chapter-6" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 06</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">THE MODERNIZATION PRESSURE</span>
                    </div>

                    <div className="pressures-grid">
                      {currentSignal.investigation.chapter06.pressures.map((p, idx) => (
                        <div key={idx} className="pressure-card">
                          <div className="pressure-head">
                            <span className="pressure-title">{p.title}</span>
                            <span className={`pressure-sev ${p.severity.toLowerCase()}`}>{p.severity}</span>
                          </div>
                          <p className="pressure-text">{p.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* CHAPTER 07: WINNERS VS. PRESSURES */}
                  <section id="chapter-7" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 07</span>
                      <span className="chapter-divider">/</span>
                      <span className="chapter-title-tag">MARKET DIVERGENCE ANALYSIS</span>
                    </div>

                    <div className="claims-vs-reality-split">
                      <div className="claim-block is-certified">
                        <div className="claim-header">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                          <span>{currentSignal.investigation.chapter07.marketShift.certifiedStock.title}</span>
                        </div>
                        <ul className="claim-bullets">
                          {currentSignal.investigation.chapter07.marketShift.certifiedStock.points.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="claim-block is-legacy">
                        <div className="claim-header">
                          <AlertTriangle size={13} className="text-amber-400" />
                          <span>{currentSignal.investigation.chapter07.marketShift.legacyStock.title}</span>
                        </div>
                        <ul className="claim-bullets">
                          {currentSignal.investigation.chapter07.marketShift.legacyStock.points.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* CHAPTER 08: SCOUTIT INSTITUTIONAL IMPACT MATRIX */}
                  <section id="chapter-8" className="story-chapter">
                    <div className="chapter-eyebrow">
                      <span className="chapter-num">CHAPTER 08</span>
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
                        {currentSignal.investigation.chapter08.impactMatrix.map((row, idx) => (
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

                  {/* SOURCE EVIDENCE DRAWER SECTION */}
                  <section className="evidence-ledger-instrument">
                    <div className="ledger-header">
                      <FileText size={13} className="text-gold" />
                      <span>CHAIN OF CUSTODY &amp; SOURCE PROVENANCE LEDGER</span>
                    </div>

                    <div className="sources-list">
                      {currentSignal.investigation.evidenceSources.map((src, i) => (
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
        <div className="descent-transition-wrap">
          <LayerTransition 
            nextNum="03" 
            nextName="Metropolis" 
            nextHref="/layer/metropolis" 
            teaser="Drop below the clouds. The city directory opens up." 
          />
        </div>
      </main>

      {/* ── TACTICAL MONOLITH STYLES ── */}
      <style jsx global>{`
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
          padding-top: 64px;
        }

        .workbench-container {
          max-width: 1340px;
          margin: 0 auto;
          padding: 16px clamp(16px, 3vw, 36px) 24px;
        }

        .text-gold {
          color: var(--accent);
        }

        /* ── HEADER TELEMETRY STRIP ── */
        .workbench-header {
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 18px;
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
          max-width: 720px;
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
          top: 76px;
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

        /* ── CARTOGRAPHIC VECTOR RADAR FIELD ── */
        .radar-cartographic-deck {
          background: #111114;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
        }

        .radar-vector-field {
          height: 210px;
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
          background-size: 20px 20px;
        }

        .radar-svg-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
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
          background: rgba(0, 0, 0, 0.75);
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
        .legend-dot.is-dashed { border: 1px dashed var(--accent); width: 6px; height: 6px; }

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
          background: #16161b;
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
          top: 76px;
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
        .rail-evidence-btn:hover,
        .rail-evidence-btn.is-active {
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
          gap: 22px;
        }

        .brief-meta-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
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
          margin: 0 0 12px;
        }

        .brief-provenance-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          background: #16161b;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 8px 12px;
        }

        .provenance-strip-left {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .confidence-pill {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          color: var(--accent-bright);
          letter-spacing: 0.12em;
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

        /* First-Class Spatially Plausible Affected Spaces */
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
          padding: 14px;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .impacted-space-node:hover,
        .impacted-space-node.is-radar-focused {
          border-color: var(--accent);
          background: #1e1e24;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .impacted-space-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .impacted-space-dist {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--accent);
        }

        .impacted-space-class {
          font-family: var(--font-mono);
          font-size: 7.5px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
        }
        .impacted-space-class.already-compliant { background: rgba(76, 175, 125, 0.15); color: #4caf7d; }
        .impacted-space-class.upgrade-required { background: rgba(232, 174, 60, 0.15); color: var(--accent-bright); }
        .impacted-space-class.likely-retrofit-required { background: rgba(232, 200, 74, 0.15); color: #e8c84a; }
        .impacted-space-class.prime-beneficiary { background: rgba(76, 175, 125, 0.15); color: #4caf7d; }
        .impacted-space-class.high-impact { background: rgba(232, 174, 60, 0.15); color: var(--accent-bright); }

        .impacted-space-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .impacted-space-title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0;
        }

        .impacted-space-loc {
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--text-muted);
        }

        .impacted-space-reason {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: var(--type-micro);
          line-height: 1.45;
          color: var(--text-secondary);
        }
        .reason-bullet {
          color: var(--accent);
          font-size: 8px;
        }

        .impacted-space-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px dashed rgba(255, 255, 255, 0.06);
          margin-top: 4px;
        }

        .impact-tag-text {
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 700;
          color: var(--accent-bright);
        }

        .view-space-link {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }

        /* Brief Action Footer */
        .brief-action-footer {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 4px;
        }

        .enter-investigation-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--accent);
          color: #0d0d0d;
          font-family: var(--font-mono);
          font-size: var(--type-micro);
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

        .chapter-subheading {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 500;
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

        /* Chapter 02: Corridors Breakdown */
        .corridor-breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 6px;
        }

        .corridor-card {
          background: #16161a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .corridor-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .corridor-name {
          font-family: var(--font-display);
          font-size: 14px;
          color: #f7f5f0;
        }

        .corridor-length {
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: var(--accent);
        }

        .corridor-metric {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-secondary);
        }

        /* Chapter 03: Framework Steps */
        .framework-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 6px;
        }

        .framework-step-card {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .step-num {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          color: var(--accent);
        }

        .step-title {
          font-family: var(--font-mono);
          font-size: var(--type-micro);
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #f7f5f0;
          margin: 0;
        }

        .step-desc {
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Chapter 04: Exposure Table Deck */
        .exposure-table-deck {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          overflow: hidden;
          margin-top: 6px;
        }

        .exposure-row {
          display: grid;
          grid-template-columns: 240px 160px 1fr;
          gap: 14px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          align-items: center;
        }
        .exposure-row:last-child { border-bottom: none; }

        .exposure-building-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-size: 13.5px;
          color: #f7f5f0;
        }

        .exposure-status-pill {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 3px 8px;
          border-radius: 4px;
          text-align: center;
        }
        .exposure-status-pill.already-compliant { background: rgba(76, 175, 125, 0.15); color: #4caf7d; }
        .exposure-status-pill.upgrade-required { background: rgba(232, 174, 60, 0.15); color: var(--accent-bright); }
        .exposure-status-pill.retrofit-required { background: rgba(232, 200, 74, 0.15); color: #e8c84a; }
        .exposure-status-pill.prime-beneficiary { background: rgba(76, 175, 125, 0.15); color: #4caf7d; }

        .exposure-detail {
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* Chapter 05: Horizontal Timeline */
        .timeline-horizontal-instrument {
          position: relative;
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 24px 18px;
          overflow-x: auto;
          margin-top: 6px;
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
          grid-template-columns: repeat(4, minmax(180px, 1fr));
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
          font-size: var(--type-micro);
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
          font-size: var(--type-micro);
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Chapter 06: Pressures Grid */
        .pressures-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 6px;
        }

        .pressure-card {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pressure-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pressure-title {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #f7f5f0;
        }

        .pressure-sev {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .pressure-sev.high { background: rgba(232, 100, 74, 0.15); color: #e8644a; }
        .pressure-sev.critical { background: rgba(232, 100, 74, 0.25); color: #e8644a; }
        .pressure-sev.positive { background: rgba(76, 175, 125, 0.15); color: #4caf7d; }

        .pressure-text {
          font-size: 12.5px;
          line-height: 1.55;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Chapter 07: Winners vs Pressures */
        .claims-vs-reality-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 6px;
        }

        .claim-block {
          border-radius: 8px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .claim-block.is-certified {
          background: rgba(76, 175, 125, 0.04);
          border: 1px solid rgba(76, 175, 125, 0.3);
        }

        .claim-block.is-legacy {
          background: rgba(232, 200, 74, 0.04);
          border: 1px solid rgba(232, 200, 74, 0.3);
        }

        .claim-header {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .claim-block.is-certified .claim-header { color: #4caf7d; }
        .claim-block.is-legacy .claim-header { color: #e8c84a; }

        .claim-bullets {
          margin: 0;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          line-height: 1.55;
          color: #d6d4cd;
        }

        /* Chapter 08: Impact Matrix */
        .impact-matrix-instrument {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
          margin-top: 6px;
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

        /* Source Evidence Drawer */
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
          margin-top: 8px;
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
          font-size: var(--type-micro);
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
          font-size: var(--type-micro);
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        /* ── SECONDARY ARCHIVE GATEWAY ── */
        .workbench-archive-gateway {
          margin-top: 36px;
          margin-bottom: 16px;
        }

        .archive-gateway-inner {
          background: #131316;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 22px 26px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 18px;
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
          margin-bottom: 4px;
        }

        .archive-gateway-title {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0 0 4px;
        }

        .archive-gateway-desc {
          font-size: 12.5px;
          color: var(--text-secondary);
          margin: 0;
          max-width: 620px;
        }

        .archive-gateway-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #1a1a1f;
          border: 1px solid rgba(232, 174, 60, 0.35);
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: var(--type-micro);
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 11px 18px;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .archive-gateway-cta:hover {
          background: var(--accent);
          color: #0d0d0d;
        }

        .descent-transition-wrap {
          margin-top: 20px;
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

          .exposure-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}
