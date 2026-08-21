/**
 * Investigation dossiers — the deep, chaptered story behind a signal.
 *
 * These used to live inside `src/app/layer/stratosphere/page.js`, which made
 * the Stratosphere LAYER carry the full article payload. Stratosphere is the
 * preview; the dossier belongs to the article master page. Keyed by article
 * slug so it joins cleanly onto `ARTICLES` in `mockArticles.js`.
 *
 * Each entry carries an 8-chapter `investigation` object plus the map/impact
 * metadata the radar needs.
 */

export const INVESTIGATIONS = [
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

/** One dossier by article slug, or null when the article has no investigation. */
export function getInvestigation(slug) {
  return INVESTIGATIONS.find((entry) => entry.slug === slug) || null;
}

/** Slugs that have a full chaptered dossier attached. */
export function hasInvestigation(slug) {
  return INVESTIGATIONS.some((entry) => entry.slug === slug);
}
