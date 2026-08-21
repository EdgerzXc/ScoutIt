// ═══════════════════════════════════════════════════════════════════════════
// SPATIAL SIGNALS DATA REPOSITORY — The source of truth for Stratosphere (L2)
// Connects municipal ordinances, transit infrastructure & market signals
// to specific physical properties in Metropolis (L3) via affectedSpaces[].
// ═══════════════════════════════════════════════════════════════════════════

export const SPATIAL_SIGNALS = [
  {
    id: "sig-makati-leed",
    slug: "makati-leed-mandate",
    title: "Makati CBD LEED Platinum Mandate",
    fullTitle: "Ayala Avenue Commercial Decarbonization Mandate",
    channel: "zoning",
    category: "ZONING & REGULATORY",
    intelType: "COMMERCIAL SIGNAL",
    statusBadge: "ORDINANCE RATIFIED",
    severity: "high",
    door: "hiddenintel", // Chapter 06 Fine Print
    doorLabel: "Active Municipal Decarbonization Ordinance",
    doorQuestion: "How does the LEED Platinum mandate affect this building?",
    location: "Ayala Ave, Makati CBD",
    region: "Makati CBD",
    coords: { lat: 14.5547, lng: 121.0244, x: 52, y: 48 },
    corridorName: "Ayala Avenue Corridor",
    impactRadius: "800m Zone",
    readTime: "2m investigation",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "99% CONFIDENCE",
    provenanceCompact: "4 VERIFIED SOURCES · 99% CONFIDENCE",
    evidenceStats: "3 PRIMARY · 1 GOVT RECORD · AUDITED AUG 2026",
    summary: {
      whatHappened: "Makati City Ordinance 2026-042 mandates LEED Gold/Platinum certification for commercial towers along Ayala Avenue by Q4 2027.",
      whyItMatters: "Triggers an immediate 22% rental spread as multinational tenants reject uncertified floorplates.",
      affectedCount: 3,
    },
    resolutions: {
      resolved: {
        id: "resolved",
        name: "Resolved",
        color: "#10b981",
        glyph: "●",
        headline: "Compliance Upgrade Required",
        summary: "The building sits directly in the Ayala corridor. A chiller & thermal envelope upgrade is required before Q4 2027 to avoid progressive municipal tax surcharges.",
        inquiryTopic: "LEED Decarbonization Mandate & Retrofit CapEx Timeline",
      },
      escalated: {
        id: "escalated",
        name: "Escalated",
        color: "#f59e0b",
        glyph: "◆",
        headline: "High Urgency: 22% Tenant Flight Spread",
        summary: "Multinational tenants in this corridor are actively enforcing lease covenants requiring certified green stock. Inquire immediately regarding retrofit schedule.",
        inquiryTopic: "Urgent Tenant Covenant & ESG Certification Status",
      },
      ruledout: {
        id: "ruledout",
        name: "Ruled Out",
        color: "#3b82f6",
        glyph: "○",
        headline: "Pre-Certified / Zero Penalty Risk",
        summary: "The asset is either pre-certified LEED Gold/Platinum or outside the commercial high-rise threshold. Zero tax penalty or compliance friction detected.",
        inquiryTopic: "LEED Exemption & Green Certification Confirmation",
      },
    },
    searchTerms: ["one ayala", "the estate makati", "salcedo", "ayala avenue", "makati", "leed", "green office", "sky pavilion makati"],
    affectedSpaces: [
      {
        id: "prop-makati-one-ayala",
        slug: "one-ayala-tower",
        propertySlug: "the-estate-makati", // maps to available property demo
        title: "One Ayala Corporate Tower",
        location: "Ayala Avenue, Makati CBD",
        distance: "260m from corridor",
        relationReason: "Chiller overhaul required · Façade meets 80% thermal specs",
        impactTag: "Modernization Pressure",
        classification: "UPGRADE REQUIRED",
        defaultResolution: "resolved",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
        specs: "42,000 sqm · 32 Floors",
        complianceRisk: "HIGH",
        coords: { x: 50, y: 46 },
      },
      {
        id: "prop-makati-estate",
        slug: "the-estate-makati",
        propertySlug: "the-estate-makati",
        title: "The Estate Makati Tower",
        location: "Paseo de Roxas, Makati CBD",
        distance: "480m from Ayala",
        relationReason: "Pre-certified LEED Gold · Zero penalty exposure",
        impactTag: "Pre-Compliant Asset",
        classification: "ALREADY COMPLIANT",
        defaultResolution: "ruledout",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
        specs: "650 sqm Penthouse · Floor 54",
        complianceRisk: "NONE",
        coords: { x: 56, y: 52 },
      },
      {
        id: "prop-makati-sky-pavilion",
        slug: "sky-pavilion-makati",
        propertySlug: "sky-pavilion-makati",
        title: "Sky Pavilion Makati",
        location: "Salcedo Village, Makati CBD",
        distance: "520m perimeter",
        relationReason: "High-spec floorplate meets BERDE 4-Star requirements",
        impactTag: "Green Benchmark Asset",
        classification: "ALREADY COMPLIANT",
        defaultResolution: "ruledout",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
        specs: "320 sqm · Penthouse Villa",
        complianceRisk: "NONE",
        coords: { x: 54, y: 50 },
      },
    ],
    investigation: {
      chapter01: {
        headline: "A strict carbon ceiling is reshaping Makati skyline economics.",
        lede: "Makati City Ordinance 2026-042 establishes mandatory LEED certification for commercial assets over 12 stories. Legacy towers face progressive municipal tax surcharges.",
        jurisdiction: "Makati City Urban Planning · Enforceable Q4 2027",
      },
      chapter02: {
        corridors: [
          { name: "Ayala Avenue Core", length: "2.4 km", towerCount: 38, focus: "Primary Tier-1 Target" },
          { name: "Paseo de Roxas Strip", length: "1.8 km", towerCount: 22, focus: "Financial Headquarters" },
          { name: "Salcedo Buffer", length: "3.1 km", towerCount: 16, focus: "Secondary Mixed-Use" },
        ],
      },
      chapter03: {
        frameworkSteps: [
          { step: "01", title: "Energy Reduction", desc: "25% below ASHRAE 90.1 baseline standards." },
          { step: "02", title: "Low-E Glazing", desc: "Façade retrofits with SHGC < 0.28." },
          { step: "03", title: "HVAC Upgrade", desc: "Magnetic-bearing variable speed chillers." },
          { step: "04", title: "Audit Deadline", desc: "USGBC LEED or BERDE 4-Star by Q4 2027." },
        ],
      },
      chapter04: {
        buildingLedger: [
          { name: "One Ayala Corporate Tower", slug: "the-estate-makati", status: "UPGRADE REQUIRED", risk: "HIGH", detail: "Chiller overhaul required; façade meets 80% thermal specs." },
          { name: "The Estate Makati", slug: "the-estate-makati", status: "ALREADY COMPLIANT", risk: "NONE", detail: "Pre-certified LEED Gold upon structural completion." },
          { name: "Sky Pavilion Makati", slug: "sky-pavilion-makati", status: "ALREADY COMPLIANT", risk: "NONE", detail: "Meets BERDE 4-Star benchmark specifications." },
          { name: "Salcedo Commercial Block", slug: "the-estate-makati", status: "RETROFIT REQUIRED", risk: "MODERATE", detail: "Phased CapEx deployment across 24 months." },
          { name: "Ayala Triangle Tower Two", slug: "the-estate-makati", status: "ALREADY COMPLIANT", risk: "NONE", detail: "LEED Platinum benchmark asset." },
        ],
      },
      chapter05: {
        timeline: [
          { year: "2024", phase: "Baseline Carbon Mapping", status: "DONE", detail: "Telemetry mapped across 140 towers." },
          { year: "2026", phase: "Ordinance Ratification", status: "ACTIVE", current: true, detail: "City Council enacts mandatory schedule." },
          { year: "2027", phase: "Audit Filing Deadline", status: "TARGET", detail: "Final certified audits due." },
          { year: "2028", phase: "Tax Surcharges Enforced", status: "TARGET", detail: "1.8% tax surcharge on uncertified assets." },
        ],
      },
      chapter06: {
        pressures: [
          { title: "CapEx Upgrade", severity: "HIGH", text: "₱120M–₱210M average retrofit CapEx per tower." },
          { title: "Tenant Covenants", severity: "CRITICAL", text: "Multinationals legally barred from renewing in uncertified stock." },
          { title: "Power Savings", severity: "POSITIVE", text: "Certified retrofits cut recurring power bills by 28%." },
        ],
      },
      chapter07: {
        marketShift: {
          certifiedStock: { title: "Certified Assets", points: ["+18% to +24% rental premiums", "100% MNC occupancy retention", "Municipal tax rebate eligibility"] },
          legacyStock: { title: "Uncertified Assets", points: ["Accelerated tenant flight", "1.8% annual tax penalties", "Substantial valuation write-downs"] },
        },
      },
      chapter08: {
        impactMatrix: [
          { factor: "Tenant Demand", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Global ESG procurement mandates certified space." },
          { factor: "Retrofit CapEx", shortTerm: "FRICTION", longTerm: "RESOLVED", rationale: "Initial capital offset by 28% operating power savings." },
          { factor: "Rental Rate Spread", shortTerm: "STABLE", longTerm: "HIGH BOOST", rationale: "Widening 22% rental price gap between green & legacy stock." },
          { factor: "Vacancy Risk", shortTerm: "LOW", longTerm: "FRICTION", rationale: "Uncertified older buildings face steady tenant attrition." },
        ],
      },
      evidenceSources: [
        { type: "PRIMARY", name: "Makati City Council Ordinance No. 2026-042", date: "Jul 2026" },
        { type: "GOVERNMENT", name: "Philippine Green Building Council (PHILGBC)", date: "Jun 2026" },
        { type: "SECONDARY", name: "Colliers Philippine Office Intelligence Q2 2026", date: "Aug 2026" },
        { type: "SCOUTIT AUDIT", name: "On-Site Façade & Chiller Audit", date: "Aug 2026" },
      ],
    },
  },
  {
    id: "sig-bgc-subway",
    slug: "bgc-subway-migration",
    title: "BGC West Subway Corridor Migration",
    fullTitle: "BGC West Station Tunneling & Perimeter Appreciation",
    channel: "transit",
    category: "INFRASTRUCTURE & TRANSIT",
    intelType: "DEVELOPING",
    statusBadge: "TUNNELING ACTIVE",
    severity: "moderate",
    door: "universe", // Chapter 08 Property Universe
    doorLabel: "Developing Infrastructure Timeline",
    doorQuestion: "Is the West Station actually tunneling, or still a rendering?",
    location: "11th Ave, BGC, Taguig",
    region: "BGC & Taguig",
    coords: { lat: 14.5409, lng: 121.0503, x: 64, y: 54 },
    corridorName: "11th Ave & Kalayaan Corridor",
    impactRadius: "800m Catchment",
    readTime: "2m investigation",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "99% CONFIDENCE",
    provenanceCompact: "4 VERIFIED SOURCES · 99% CONFIDENCE",
    evidenceStats: "4 PRIMARY · 2 GOVT RECORDS · AUDITED AUG 2026",
    summary: {
      whatHappened: "Metro Manila Subway TBMs advancing toward BGC West Station trigger private capital acquisitions along 11th Avenue.",
      whyItMatters: "Direct 18-minute NAIA airport connection drives an immediate 38% valuation premium on perimeter residences.",
      affectedCount: 3,
    },
    resolutions: {
      resolved: {
        id: "resolved",
        name: "Resolved",
        color: "#10b981",
        glyph: "●",
        headline: "Direct Transit Appreciation Verified",
        summary: "Subterranean tunneling verified within 200m. Rapid airport reach transforms rental yields by Q1 2028.",
        inquiryTopic: "Subway Concourse Access & Station Portal Proximity",
      },
      escalated: {
        id: "escalated",
        name: "Escalated",
        color: "#f59e0b",
        glyph: "◆",
        headline: "High Urgency: Perimeter Land Banking",
        summary: "Off-market acquisition pressure is surging. Inventory along this boundary is contracting rapidly.",
        inquiryTopic: "Off-Market Acquisition Inquiries & Land Banking Velocity",
      },
      ruledout: {
        id: "ruledout",
        name: "Ruled Out",
        color: "#3b82f6",
        glyph: "○",
        headline: "Acoustic Buffer Verified / Zero Vibration",
        summary: "Floating slab isolation and deep rock strata eliminate vibration risk entirely for this parcel.",
        inquiryTopic: "Transit Acoustic Isolation & Foundation Buffer Verification",
      },
    },
    searchTerms: ["the glasshouse bgc", "aurelia residences", "kalayaan", "bgc", "taguig", "subway", "dotr", "naia"],
    affectedSpaces: [
      {
        id: "prop-bgc-glasshouse",
        slug: "the-glasshouse-bgc",
        propertySlug: "the-glasshouse-bgc",
        title: "The Glasshouse BGC",
        location: "11th Avenue, BGC, Taguig",
        distance: "180m from portal",
        relationReason: "Direct subterranean concourse portal connection",
        impactTag: "+38% Appreciation Surge",
        classification: "PRIME BENEFICIARY",
        defaultResolution: "resolved",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
        specs: "450 sqm · Modernist Villa",
        complianceRisk: "NONE",
        coords: { x: 62, y: 52 },
      },
      {
        id: "prop-bgc-aurelia",
        slug: "aurelia-residences",
        propertySlug: "aurelia-residences",
        title: "Aurelia Residences",
        location: "5th Avenue, BGC, Taguig",
        distance: "450m from alignment",
        relationReason: "Acoustic buffer verified · Floating slab isolation",
        impactTag: "High Demand Hold",
        classification: "PRIME BENEFICIARY",
        defaultResolution: "ruledout",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
        specs: "380 sqm · Signature Suite",
        complianceRisk: "NONE",
        coords: { x: 66, y: 58 },
      },
    ],
    investigation: {
      chapter01: {
        headline: "TBM tunneling accelerates toward BGC West multimodal concourse.",
        lede: "The DOTr Metro Manila Subway contract package CP104 has crossed the Kalayaan boundary. Direct pedestrian underpasses link station portals to prime commercial and residential parcels.",
        jurisdiction: "DOTr Infrastructure Delivery · Operations Target 2028",
      },
      chapter02: {
        corridors: [
          { name: "11th Avenue Portal", length: "1.2 km", towerCount: 14, focus: "Primary Direct Catchment" },
          { name: "Kalayaan Flyover Strip", length: "2.0 km", towerCount: 9, focus: "Commercial Edge" },
        ],
      },
      chapter03: {
        frameworkSteps: [
          { step: "01", title: "Tunnel Boring", desc: "Dual TBMs active under 11th Ave." },
          { step: "02", title: "Concourse Box", desc: "Excavation 65% complete." },
          { step: "03", title: "Underpass Integration", desc: "Private developer easements secured." },
          { step: "04", title: "Trackwork & Signalling", desc: "Target commissioning Q1 2028." },
        ],
      },
      chapter04: {
        buildingLedger: [
          { name: "The Glasshouse BGC", slug: "the-glasshouse-bgc", status: "PRIME BENEFICIARY", risk: "NONE", detail: "180m from West Concourse entry portal." },
          { name: "Aurelia Residences", slug: "aurelia-residences", status: "PRIME BENEFICIARY", risk: "NONE", detail: "450m buffer; floating slab isolation verified." },
        ],
      },
      chapter05: {
        timeline: [
          { year: "2023", phase: "Right-of-Way Clearing", status: "DONE", detail: "11th Ave station box cleared." },
          { year: "2026", phase: "TBM Alignment Boring", status: "ACTIVE", current: true, detail: "Passing under BGC West." },
          { year: "2027", phase: "Station Fit-Out & MEP", status: "TARGET", detail: "Underground structural fit-out." },
          { year: "2028", phase: "Revenue Operations", status: "TARGET", detail: "Full subway line launch." },
        ],
      },
      chapter06: {
        pressures: [
          { title: "Construction Noise", severity: "LOW", text: "Subterranean operation; minimal surface impact." },
          { title: "Valuation Premium", severity: "POSITIVE", text: "+38% historical spread on Japanese subway station rings." },
        ],
      },
      chapter07: {
        marketShift: {
          certifiedStock: { title: "Transit-Linked Parcels", points: ["18-min NAIA airport transit", "Surging expat tenant demand", "Capital liquidity peak"] },
          legacyStock: { title: "Unconnected Sub-districts", points: ["Traffic bottleneck exposure", "Lower yield trajectory"] },
        },
      },
      chapter08: {
        impactMatrix: [
          { factor: "Airport Connectivity", shortTerm: "STABLE", longTerm: "HIGH BOOST", rationale: "Express 18-min rail connection to Terminal 3." },
          { factor: "Capital Appreciation", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Immediate +35% to +45% benchmark valuation surge." },
        ],
      },
      evidenceSources: [
        { type: "PRIMARY", name: "DOTr Subway Project Office Dispatch CP104", date: "Aug 2026" },
        { type: "GOVERNMENT", name: "BGC Estate Association Urban Plan", date: "May 2026" },
      ],
    },
  },
  {
    id: "sig-bgc-district",
    slug: "bgc-district-guide",
    title: "BGC City Center & High Street Corridor Guide",
    fullTitle: "Walkability, Micro-Climate & Culinary Density in BGC Center",
    channel: "market",
    category: "AREA GUIDE",
    intelType: "AREA GUIDE",
    statusBadge: "DISTRICT GUIDE",
    severity: "positive",
    door: "whereto", // Chapter 04 The Block
    doorLabel: "District Walkability & Corridor Guide",
    doorQuestion: "What is the true walkability and block rhythm around this building?",
    location: "High Street & 5th Ave, BGC, Taguig",
    region: "BGC & Taguig",
    coords: { lat: 14.5510, lng: 121.0500, x: 60, y: 50 },
    corridorName: "Bonifacio High Street Axis",
    impactRadius: "600m Pedestrian Ring",
    readTime: "2m guide",
    verificationStatus: "VERIFIED PRIMARY",
    confidence: "99% CONFIDENCE",
    provenanceCompact: "3 VERIFIED MAPPINGS · 99% CONFIDENCE",
    evidenceStats: "3 PRIMARY CADASTRE · AUDITED AUG 2026",
    summary: {
      whatHappened: "Detailed spatial walkthrough of pedestrian walkways, parkways, and retail hubs connecting 5th and 11th Avenues.",
      whyItMatters: "Provides hyper-local answers on block-level pedestrian access, green corridors, and noise profiles.",
      affectedCount: 2,
    },
    resolutions: {
      resolved: {
        id: "resolved",
        name: "Resolved",
        color: "#10b981",
        glyph: "●",
        headline: "High Street Walkability Verified",
        summary: "Direct 3-minute walking connection along landscaped pedestrian parkways. Quiet courtyard buffer confirmed.",
        inquiryTopic: "District Walkability & Pedestrian Parkway Access",
      },
      escalated: {
        id: "escalated",
        name: "Escalated",
        color: "#f59e0b",
        glyph: "◆",
        headline: "Prime Corridor Scarcity",
        summary: "Pedestrian-linked floorplates in this block have 0.4% vacancy rate. Immediate offer submission advised.",
        inquiryTopic: "Floorplate Availability in High Street Pedestrian Ring",
      },
      ruledout: {
        id: "ruledout",
        name: "Ruled Out",
        color: "#3b82f6",
        glyph: "○",
        headline: "No Commercial Noise Spillover",
        summary: "Acoustic modeling verifies retail dining noise does not reach upper residential tiers.",
        inquiryTopic: "Acoustic Envelope & Residential Quiet Hours",
      },
    },
    searchTerms: ["the glasshouse bgc", "aurelia residences", "high street", "5th ave", "bgc"],
    affectedSpaces: [
      {
        id: "prop-bgc-glasshouse",
        slug: "the-glasshouse-bgc",
        propertySlug: "the-glasshouse-bgc",
        title: "The Glasshouse BGC",
        location: "11th Avenue, BGC, Taguig",
        distance: "3 min to High Street",
        relationReason: "Direct parkway connectivity",
        impactTag: "Prime Walkability",
        classification: "PRIME BENEFICIARY",
        defaultResolution: "resolved",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
        specs: "450 sqm · Modernist Villa",
        complianceRisk: "NONE",
        coords: { x: 62, y: 52 },
      },
    ],
    investigation: {
      chapter01: {
        headline: "BGC's pedestrian grid creates Manila's lowest-friction urban core.",
        lede: "A network of underground service tunnels and grade-separated green corridors isolates residential and office blocks from freight and traffic congestion.",
        jurisdiction: "BGC Estate Management · Masterplan Active",
      },
      chapter02: {
        corridors: [
          { name: "Bonifacio High Street", length: "1.0 km", towerCount: 28, focus: "Pedestrian Retail Spine" },
          { name: "5th Avenue Parkway", length: "1.4 km", towerCount: 20, focus: "Flagship Corporate & Luxury" },
        ],
      },
      chapter03: {
        frameworkSteps: [
          { step: "01", title: "Walk Score 98", desc: "98/100 pedestrian transit rating." },
          { step: "02", title: "Underground Freight", desc: "No street-level delivery blocking." },
          { step: "03", title: "Dual Power Grids", desc: "Meralco + redundant substation feeds." },
        ],
      },
      chapter04: {
        buildingLedger: [
          { name: "The Glasshouse BGC", slug: "the-glasshouse-bgc", status: "PRIME BENEFICIARY", risk: "NONE", detail: "Direct parkway link to Central Square." },
        ],
      },
      chapter05: {
        timeline: [
          { year: "2024", phase: "Greenway Phase 3", status: "DONE", detail: "Parkway expansion connected." },
          { year: "2026", phase: "Smart Lighting & Sensors", status: "ACTIVE", current: true, detail: "Pedestrian telemetry online." },
        ],
      },
      chapter06: {
        pressures: [
          { title: "Floorplate Scarcity", severity: "HIGH", text: "Sub-1% vacancy on High Street frontage." },
        ],
      },
      chapter07: {
        marketShift: {
          certifiedStock: { title: "Parkway-Fronting Units", points: ["Highest rental ADRs in Taguig", "Zero days on market avg"] },
          legacyStock: { title: "Perimeter Units", points: ["Longer walk to transit", "12% lower yield"] },
        },
      },
      chapter08: {
        impactMatrix: [
          { factor: "Walkability", shortTerm: "HIGH BOOST", longTerm: "HIGH BOOST", rationale: "Continuous car-free green paths." },
        ],
      },
      evidenceSources: [
        { type: "PRIMARY", name: "Fort Bonifacio Development Corp Cadastral Survey", date: "Aug 2026" },
      ],
    },
  },
];

/**
 * Find all spatial signals that reference or touch a given property slug.
 * @param {string} propertySlug 
 * @returns {Array} List of matched spatial signals
 */
export function getSignalsForProperty(propertySlug) {
  if (!propertySlug) return [];
  const clean = propertySlug.toLowerCase().trim();
  return SPATIAL_SIGNALS.filter(sig => {
    return (
      sig.affectedSpaces.some(sp => (sp.propertySlug || sp.slug).toLowerCase() === clean) ||
      sig.searchTerms.some(term => term.toLowerCase().includes(clean))
    );
  });
}

/**
 * Retrieve a single signal by its slug or ID.
 * @param {string} slugOrId 
 * @returns {Object|null}
 */
export function getSignalBySlug(slugOrId) {
  if (!slugOrId) return null;
  const clean = slugOrId.toLowerCase().trim();
  return SPATIAL_SIGNALS.find(s => s.slug.toLowerCase() === clean || s.id.toLowerCase() === clean) || null;
}

/**
 * Retrieve specific resolution info for a signal & property combination.
 * @param {string} signalSlug 
 * @param {string} resolutionKey 'resolved' | 'escalated' | 'ruledout'
 * @returns {Object|null}
 */
export function getSignalResolution(signalSlug, resolutionKey = "resolved") {
  const sig = getSignalBySlug(signalSlug);
  if (!sig || !sig.resolutions) return null;
  return sig.resolutions[resolutionKey] || sig.resolutions.resolved || null;
}
