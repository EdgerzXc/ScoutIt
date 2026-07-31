export const DISCOVER_INTEL = {
  Residential: [
    { id: "n1", slug: "bgc-spatial-movement", category: "Residential", date: "July 2026", region: "BGC, Taguig", title: "BGC Villa Acquisition Surge", snippet: "Low-density residences command a 40% compressed contract cycle across Bonifacio Global City." }
  ],
  Commercial: [
    { id: "n2", slug: "green-office-demand", category: "Commercial", date: "July 2026", region: "Makati CBD", title: "LEED-Mandated Office Conversions", snippet: "Global corporate tenants drive green retrofits across Makati CBD prime towers." }
  ],
  STR: [
    { id: "n3", slug: "surf-front-land-rush", category: "STR", date: "June 2026", region: "Siargao", title: "Siargao Coastal Frontage Rush", snippet: "Boutique hospitality funds target General Luna coastal plots yielding over 22% ARR." }
  ],
  Hospitality: [
    { id: "n4", slug: "off-grid-island-living", category: "Hospitality", date: "June 2026", region: "El Nido, Palawan", title: "Palawan Off-Grid Solar Microgrids", snippet: "Sustainable teak pavilion resorts redefine island luxury in northern Palawan." }
  ],
  Culinary: [
    { id: "n5", slug: "poblacion-food-architecture", category: "Culinary", date: "May 2026", region: "Poblacion, Makati", title: "Poblacion Adaptive Reuse Gastronomy", snippet: "Industrial warehouse conversions create high-density multi-floor dining destinations." }
  ],
  Venues: [
    { id: "n6", slug: "manila-venue-trends", category: "Venues", date: "May 2026", region: "Bay Area, Manila", title: "Glass Atrium Corporate Pavilions", snippet: "Subterranean ballrooms give way to light-filled glass atrium event spaces." }
  ]
};

export const ARTICLES = [
  {
    slug: "bgc-spatial-movement",
    title: "BGC Spatial Movement & Villa Acquisition Surge",
    category: "Residential",
    intelType: "COMMERCIAL SIGNAL",
    date: "July 2026",
    city: "BGC, Taguig",
    region: "Metro Manila",
    lat: 14.5409,
    lng: 121.0503,
    excerpt: "A rise in demand for low-density residences drives modernist villa acquisitions across Bonifacio Global City core.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
    sourceName: "Taguig Zoning Gazette & LRA Registry Q2 2026",
    sourceUrl: "https://taguig.gov.ph/zoning-bulletin"
  },
  {
    slug: "green-office-demand",
    title: "LEED-Mandated Office Conversions in Makati CBD",
    category: "Commercial",
    intelType: "MARKET INTEL",
    date: "July 2026",
    city: "Makati CBD",
    region: "Metro Manila",
    lat: 14.5547,
    lng: 121.0244,
    excerpt: "Global firms in Manila mandate LEED-certified workspaces, shaping future skyscraper architectural footprints.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    sourceName: "BAP & Colliers Philippine Commercial Report Q2 2026",
    sourceUrl: "https://colliers.com/ph/reports/q2-2026-office"
  },
  {
    slug: "surf-front-land-rush",
    title: "Siargao Coastal Frontage Land Rush & Yield Dynamics",
    category: "STR",
    intelType: "AREA GUIDE",
    date: "June 2026",
    city: "General Luna, Siargao",
    region: "Visayas / Mindanao",
    lat: 9.7800,
    lng: 126.1600,
    excerpt: "Boutique island developers scramble to acquire coastal land along General Luna's extended surf breaks.",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
    sourceName: "DOT Tourism Infrastructure Survey & DENR Coastal Register",
    sourceUrl: "https://tourism.gov.ph/reports/siargao-2026"
  },
  {
    slug: "off-grid-island-living",
    title: "Palawan Eco-Resort Microgrids & Teak Pavilion Standards",
    category: "Hospitality",
    intelType: "INSIGHT",
    date: "June 2026",
    city: "El Nido, Palawan",
    region: "Luzon / MIMAROPA",
    lat: 11.1800,
    lng: 119.3900,
    excerpt: "Resort developers in Palawan shift fully to off-grid solar microgrids, green water treatment, and teak designs.",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80",
    sourceName: "Department of Energy Microgrid Registry & PCSD Bulletin",
    sourceUrl: "https://doe.gov.ph/microgrid-palawan"
  },
  {
    slug: "poblacion-food-architecture",
    title: "Poblacion Adaptive Reuse & Multi-Concept Gastronomy",
    category: "Culinary",
    intelType: "BRIEFING",
    date: "May 2026",
    city: "Poblacion, Makati",
    region: "Metro Manila",
    lat: 14.5630,
    lng: 121.0310,
    excerpt: "Industrial modernist overlays reshape abandoned residential warehouses into multi-concept culinary destinations.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
    sourceName: "Makati Urban Redevelopment Task Force & Barangay Licensing",
    sourceUrl: "https://makati.gov.ph/urban-planning/poblacion"
  },
  {
    slug: "manila-venue-trends",
    title: "Glass Atrium Venues & Corporate Spatial Tech Integration",
    category: "Venues",
    intelType: "MARKET INTEL",
    date: "May 2026",
    city: "Bay Area, Manila",
    region: "Metro Manila",
    lat: 14.5350,
    lng: 120.9820,
    excerpt: "Premium corporate venues shift toward light-filled glass atrium spaces equipped with dynamic projection mapping.",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80",
    sourceName: "Manila Events & Convention Center Association Gazette",
    sourceUrl: "https://mecca.ph/bulletin/2026-q2"
  }
];

export const ARTICLE_DB = {
  "bgc-spatial-movement": {
    slug: "bgc-spatial-movement",
    title: "BGC Spatial Movement & Villa Acquisition Surge",
    category: "Residential",
    intelType: "COMMERCIAL SIGNAL",
    date: "July 2026",
    city: "BGC, Taguig",
    region: "Metro Manila",
    lat: 14.5409,
    lng: 121.0503,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
    sourceName: "Taguig Zoning Gazette & LRA Registry Q2 2026",
    sourceUrl: "https://taguig.gov.ph/zoning-bulletin",
    lead: "Bonifacio Global City's central core is witnessing a rapid structural migration. High-net-worth capital is shifting away from dense skyscrapers toward boutique, low-density modernist villas.",
    bodyJson: JSON.stringify([
      { type: "heading", level: 2, text: "Spatial Density & Private Pocket Enclosures" },
      { type: "paragraph", text: "As structural requirements for urban living undergo a dramatic realignment, BGC's premier residential sectors are experiencing unprecedented demand for low-density spatial layouts. Modern tropical designs featuring double-glazed acoustic enclosures and private pocket gardens have emerged as the benchmark." },
      { type: "stat", label: "Listing to Contract Duration", value: "-40%", detail: "Compressed closing window for low-density villa inventory in Q2 2026" },
      { type: "quote", text: "Private capital is targeting acoustic isolation and spatial control. High-density towers are no longer the default choice for UHNW buyers.", cite: "ScoutIt Spatial Advisory Panel" },
      { type: "callout", label: "OSINT GAZETTE SIGNAL", text: "LRA title transfers reveal 14 private acquisitions in BGC West Block executed off-market during May-June 2026." },
      { type: "table", headers: ["Zone", "Median Price/Sqm", "YoY Absorption", "Density Limit"], rows: [["BGC Core West", "₱480,000", "+18.4%", "Max 4 units/floor"], ["Forbes Park Border", "₱620,000", "+22.1%", "Single Family"], ["High Street North", "₱410,000", "+9.2%", "High Density"]] }
    ]),
    body: [
      "As structural requirements for urban living undergo a dramatic realignment, BGC's premier residential sectors are experiencing unprecedented demand. Modern tropical designs, characterized by double-glazed glass enclosures, natural cross-ventilation, and private pocket gardens, have emerged as the absolute standard for low-density luxury.",
      "Voters of private capital are increasingly targeting low-rise properties that offer acoustic isolation and spatial control. This migration is not merely a lifestyle adjustment; it is a long-term capital placement strategy focused on assets that retain value through architectural distinction.",
      "According to ScoutIt transaction registries, the average listing-to-contract duration for properties featuring private spatial buffers has compressed by over 40% in the last quarter."
    ],
    recommendation: "Target low-density properties in BGC Core offering private outdoor space, cross-ventilation floor plates, and fewer than 4 units per floor plate."
  },

  "green-office-demand": {
    slug: "green-office-demand",
    title: "LEED-Mandated Office Conversions in Makati CBD",
    category: "Commercial",
    intelType: "MARKET INTEL",
    date: "July 2026",
    city: "Makati CBD",
    region: "Metro Manila",
    lat: 14.5547,
    lng: 121.0244,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    sourceName: "BAP & Colliers Philippine Commercial Report Q2 2026",
    sourceUrl: "https://colliers.com/ph/reports/q2-2026-office",
    lead: "Over 68% of international corporate tenants in Makati CBD have instituted strict net-zero requirements, forcing legacy building operators to fast-track green retrofit upgrades.",
    bodyJson: JSON.stringify([
      { type: "heading", level: 2, text: "The Net-Zero Tenant Mandate" },
      { type: "paragraph", text: "Global corporate occupiers are refusing renewal terms in legacy Grade A office towers lacking LEED Gold or Platinum certification. Building owners across Ayala Avenue and Paseo de Roxas are spending over ₱1.4B collectively on HVAC overhauls, solar glass cladding, and smart energy monitoring." },
      { type: "stat", label: "LEED Certified Premium", value: "+24.5%", detail: "Rental rate delta commanded by LEED Platinum office floors vs non-certified stock" },
      { type: "callout", label: "COMMERCIAL METRIC", text: "Un-certified commercial floor plates experienced an average 14.2% vacancy rise, while LEED-certified towers maintain 94.8% occupancy." },
      { type: "table", headers: ["Building Tier", "Avg Rent/Sqm", "Vacancy Rate", "LEED Status"], rows: [["Grade A+ Prime", "₱1,650", "4.2%", "LEED Platinum"], ["Legacy Grade A", "₱1,200", "15.8%", "Non-Certified"], ["Boutique Commercial", "₱1,400", "7.1%", "LEED Gold"]] }
    ]),
    body: [
      "Global firms in Manila are mandating LEED-certified workspaces, directly shaping future skyscraper architectural footprints and tenant retention strategies.",
      "Commercial developers who proactively upgrade thermal insulation, install low-E curtain walls, and integrate smart occupancy sensors are securing 10-year lease lock-ins with Fortune 500 regional hubs.",
      "ScoutIt commercial data indicates un-retrofitted legacy towers face high tenant churn entering H2 2026."
    ],
    recommendation: "Prioritize commercial floor plates with existing LEED Gold certification or pre-funded ESG retrofit reserves."
  },

  "surf-front-land-rush": {
    slug: "surf-front-land-rush",
    title: "Siargao Coastal Frontage Land Rush & Yield Dynamics",
    category: "STR",
    intelType: "AREA GUIDE",
    date: "June 2026",
    city: "General Luna, Siargao",
    region: "Visayas / Mindanao",
    lat: 9.7800,
    lng: 126.1600,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
    sourceName: "DOT Tourism Infrastructure Survey & DENR Coastal Register",
    sourceUrl: "https://tourism.gov.ph/reports/siargao-2026",
    lead: "Short-term rental yields along General Luna's prime beach frontage have hit record highs, triggering aggressive land banking by boutique hospitality funds.",
    bodyJson: JSON.stringify([
      { type: "heading", level: 2, text: "High Yields Drive Coastal Acquisition" },
      { type: "paragraph", text: "General Luna and Cloud 9 coastal plots are experiencing unprecedented investor interest. Short-term villa rentals utilizing eco-minimalist bamboo and rammed-earth construction report net annual yields exceeding 22%." },
      { type: "stat", label: "Average Daily Rate (ADR)", value: "₱18,500", detail: "Peak season rate for 2-bedroom private pool villas in General Luna" },
      { type: "quote", text: "Investors are looking for sustainable luxury that honors local island geography while delivering high occupancy via digital booking platforms.", cite: "Siargao Hospitality Association" }
    ]),
    body: [
      "Boutique island developers are scrambling to acquire coastal land along General Luna's extended surf breaks.",
      "With local airport expansion projects underway, accessibility to Siargao is reaching critical mass, compressing development timelines for boutique luxury STR compounds.",
      "ScoutIt STR analytics highlight a 35% surge in direct booking inquiries for high-design coastal villas."
    ],
    recommendation: "Acquire titled coastal land parcels near General Luna featuring setback compliance and eco-disposal clearance."
  },

  "off-grid-island-living": {
    slug: "off-grid-island-living",
    title: "Palawan Eco-Resort Microgrids & Teak Pavilion Standards",
    category: "Hospitality",
    intelType: "INSIGHT",
    date: "June 2026",
    city: "El Nido, Palawan",
    region: "Luzon / MIMAROPA",
    lat: 11.1800,
    lng: 119.3900,
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80",
    sourceName: "Department of Energy Microgrid Registry & PCSD Bulletin",
    sourceUrl: "https://doe.gov.ph/microgrid-palawan",
    lead: "Off-grid luxury has transcended marketing narrative — it is now an operational necessity for island hospitality developers in northern Palawan.",
    bodyJson: JSON.stringify([
      { type: "heading", level: 2, text: "Solar Microgrid Architecture in Island Hospitality" },
      { type: "paragraph", text: "Resort developments in El Nido and Coron are deploying lithium-iron-phosphate battery banks tied to rooftop solar arrays, eliminating generator diesel reliance and reducing operational expenditure by 52%." },
      { type: "stat", label: "OpEx Reduction", value: "52%", detail: "Achieved through solar microgrids vs traditional diesel generators" },
      { type: "callout", label: "SUSTAINABILITY METRIC", text: "PCSD environmental compliance requires zero-single-use plastics and closed-loop rainwater harvesting for all new eco-resort permits." }
    ]),
    body: [
      "Resort developers in Palawan are shifting fully to off-grid solar microgrids, green water treatment, and teak structural frameworks.",
      "High-end international travelers demand environmental integrity alongside luxury amenities. Off-grid systems provide uninterrupted power while preserving the pristine ecological baseline.",
      "ScoutIt hospitality data confirms eco-certified Palawan resorts command a 30% premium over conventional hotel stock."
    ],
    recommendation: "Invest in hospitality assets with verified solar-storage microgrid infrastructure and PCSD environmental clearance."
  },

  "poblacion-food-architecture": {
    slug: "poblacion-food-architecture",
    title: "Poblacion Adaptive Reuse & Multi-Concept Gastronomy",
    category: "Culinary",
    intelType: "BRIEFING",
    date: "May 2026",
    city: "Poblacion, Makati",
    region: "Metro Manila",
    lat: 14.5630,
    lng: 121.0310,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
    sourceName: "Makati Urban Redevelopment Task Force & Barangay Licensing",
    sourceUrl: "https://makati.gov.ph/urban-planning/poblacion",
    lead: "Poblacion's architectural landscape is undergoing a structured transformation as heritage residential frames are retrofitted into multi-floor dining hubs.",
    bodyJson: JSON.stringify([
      { type: "heading", level: 2, text: "Adaptive Reuse Architecture in Makati's Culinary Core" },
      { type: "paragraph", text: "Industrial modernist overlays are converting 1970s residential homes and quiet industrial warehouses into multi-concept culinary destinations. Exposed steel trusses, polished concrete, and open courtyard dining create a high-vibe, design-forward dining atmosphere." },
      { type: "stat", label: "Foot Traffic Growth", value: "+38%", detail: "Weekend evening traffic increase across Poblacion multi-concept hubs" }
    ]),
    body: [
      "Industrial modernist overlays reshape abandoned residential warehouses into multi-concept culinary destinations.",
      "Design-conscious diners in Manila favor authentic, adaptive-reuse spaces over sterile mall dining options. Operators who integrate rooftop lounges and micro-breweries within historic structural frames are achieving peak revenue metrics.",
      "ScoutIt culinary dispatches note a tight market for restorable Poblacion properties with high ceiling clearance."
    ],
    recommendation: "Evaluate commercial properties in Poblacion offering 4m+ ceiling height and structural capacity for mezzanine dining."
  },

  "manila-venue-trends": {
    slug: "manila-venue-trends",
    title: "Glass Atrium Venues & Corporate Spatial Tech Integration",
    category: "Venues",
    intelType: "MARKET INTEL",
    date: "May 2026",
    city: "Bay Area, Manila",
    region: "Metro Manila",
    lat: 14.5350,
    lng: 120.9820,
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80",
    sourceName: "Manila Events & Convention Center Association Gazette",
    sourceUrl: "https://mecca.ph/bulletin/2026-q2",
    lead: "The demand for windowless subterranean ballrooms has collapsed, replaced by high-ceilinged glass pavilions that blend indoor scale with natural light.",
    bodyJson: JSON.stringify([
      { type: "heading", level: 2, text: "Natural Light Integration in Corporate Event Venues" },
      { type: "paragraph", text: "Modern corporate galas and international product launches are favoring high-bay glass atrium venues. Equipped with smart electrochromic tinting, these spaces transition seamlessly from daylight keynotes to night celebrations." },
      { type: "stat", label: "Booking Lead Time", value: "9 Months", detail: "Advance reservation window for glass pavilion venues in Manila Bay Area" }
    ]),
    body: [
      "Premium corporate venues shift toward light-filled glass atrium spaces equipped with dynamic projection mapping.",
      "Event hosts are seeking modular venues that provide panoramic views and acoustic isolation. Integrated A/V infrastructure and green pre-function lawns are now mandatory specifications.",
      "ScoutIt venue analytics show a 65% YoY increase in corporate booking inquiries for daylight-integrated event spaces."
    ],
    recommendation: "Acquire or develop event spaces featuring clear-span glass architecture and integrated stage rigging systems."
  }
};

export function getArticles(category = "All") {
  if (category === "All") {
    return ARTICLES;
  }
  return ARTICLES.filter(art =>
    art.category.toLowerCase() === category.toLowerCase() ||
    art.category === category ||
    art.intelType === category
  );
}

export function getArticleBySlug(slug) {
  const details = ARTICLE_DB[slug];
  if (details) return details;
  
  const meta = ARTICLES.find(a => a.slug === slug);
  if (meta) {
    return {
      slug: meta.slug,
      title: meta.title,
      category: meta.category,
      intelType: meta.intelType || "ANALYSIS",
      date: meta.date,
      city: meta.city,
      region: meta.region,
      lat: meta.lat,
      lng: meta.lng,
      image: meta.image,
      sourceName: meta.sourceName,
      sourceUrl: meta.sourceUrl,
      lead: meta.excerpt,
      body: [meta.excerpt],
      recommendation: "Request full catalog briefing via advisory network."
    };
  }
  return null;
}
