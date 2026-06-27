export const SPACE_STARS = [
  { top: '15%', left: '12%', size: '1.5px', opacity: 0.15 },
  { top: '8%', left: '34%', size: '2px', opacity: 0.25 },
  { top: '22%', left: '55%', size: '1px', opacity: 0.1 },
  { top: '5%', left: '78%', size: '2px', opacity: 0.2 },
  { top: '28%', left: '92%', size: '1.5px', opacity: 0.18 },
  { top: '45%', left: '8%', size: '2px', opacity: 0.15 },
  { top: '38%', left: '26%', size: '1px', opacity: 0.12 },
  { top: '52%', left: '44%', size: '2.5px', opacity: 0.2 },
  { top: '48%', left: '72%', size: '1.5px', opacity: 0.15 },
  { top: '65%', left: '88%', size: '2px', opacity: 0.22 },
  { top: '78%', left: '15%', size: '1px', opacity: 0.1 },
  { top: '88%', left: '38%', size: '2px', opacity: 0.18 },
  { top: '82%', left: '64%', size: '1.5px', opacity: 0.15 },
  { top: '72%', left: '82%', size: '2px', opacity: 0.2 },
  { top: '92%', left: '95%', size: '1px', opacity: 0.12 }
];

export const DISCOVERY_FEED = {
  Residential: {
    spotlights: [
      {
        slug: "batasan-hills",
        title: "Batasan Hills House & Lot",
        location: "Batasan Hills, Quezon City",
        style: "Modernist",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
        desc: "Modernist villa situated in the quiet hills of Quezon City.",
        newsTitle: "BGC Spatial Movement",
        newsSlug: "bgc-spatial-movement",
        newsExcerpt: "A rise in demand for low-density residences drives modernist villa acquisitions across Bonifacio Global City core."
      },
      {
        slug: "aurelia-residences",
        title: "Aurelia Residences",
        location: "BGC Core",
        style: "Modern Tropical",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
        desc: "Low density luxury high-rise featuring double-glazed glass wrap and custom bronze details.",
        newsTitle: "BGC Spatial Movement",
        newsSlug: "bgc-spatial-movement",
        newsExcerpt: "A rise in demand for low-density residences drives modernist villa acquisitions across Bonifacio Global City core."
      },
      {
        slug: "the-estate-makati",
        title: "The Estate Makati",
        location: "Makati Central",
        style: "Brutalist Luxury",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80",
        desc: "Designed by Foster + Partners. Cruciform structure maximizing floor plate efficiency and natural daylight.",
        newsTitle: "BGC Spatial Movement",
        newsSlug: "bgc-spatial-movement",
        newsExcerpt: "A rise in demand for low-density residences drives modernist villa acquisitions across Bonifacio Global City core."
      }
    ],
    news: [
      { slug: "mastering-qc-market", title: "Mastering the QC Market", date: "Q3 2026", excerpt: "What to look for in QC subdivision residences." },
      { slug: "makati-central-resurgence", title: "Makati Central Resurgence", date: "Q2 2026", excerpt: "Older luxury buildings undergoing massive renovations." },
      { slug: "bgc-condo-yields-rise", title: "BGC Condo Yields Rise", date: "Q2 2026", excerpt: "Premium residential spaces see 4.2% YoY growth." },
      { slug: "bgc-spatial-movement", title: "BGC Spatial Movement", date: "June 2026", excerpt: "A rise in demand for low-density residences drives modernist villa acquisitions." }
    ],
    collections: [
      "Modernist Penthouses",
      "QC Quiet Luxury Estates",
      "Tropical Modern Estates"
    ]
  },
  Commercial: {
    spotlights: [
      {
        slug: "zuellig-building",
        title: "Zuellig Building",
        location: "Makati CBD",
        style: "Sustainable Glass",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
        desc: "LEED Platinum certified skyscraper utilizing low-emissivity glass and rain harvesting systems."
      },
      {
        slug: "arthaland-century-pacific",
        title: "Arthaland Century Pacific",
        location: "BGC North",
        style: "Eco-Corporate",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
        desc: "A boutique commercial landmark combining zero-waste technology and premium workspace layouts."
      }
    ],
    news: [
      { slug: "green-office-demand", title: "Green Office Demand", date: "June 2026", excerpt: "Global firms in Manila mandate LEED-certified workspaces for all future operations." },
      { slug: "bgc-commercial-corridors", title: "BGC Commercial Corridors", date: "April 2026", excerpt: "Retail podiums are evolving to include open-air gardens and wellness zones." }
    ],
    collections: [
      "LEED Platinum Towers",
      "BGC Premium Workspaces",
      "Creative Studio Hubs"
    ]
  },
  STR: {
    spotlights: [
      {
        slug: "siargao-tropical-villa",
        title: "Siargao Tropical Villa",
        location: "Cloud 9",
        style: "Island Minimalist",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80",
        desc: "Open-plan coco-wood pavilion with high-pitched thatch roofs and private sea pools."
      }
    ],
    news: [
      { slug: "surf-front-land-rush", title: "Surf-Front Land Rush", date: "June 2026", excerpt: "Boutique developers scramble to acquire land along General Luna's extended coast." }
    ],
    collections: [
      "Coastal Surf Retreats",
      "Off-Grid Bamboo Pavilions"
    ]
  },
  Hospitality: {
    spotlights: [
      {
        slug: "palawan-eco-retreat",
        title: "Palawan Eco-Retreat",
        location: "El Nido Lio",
        style: "Native Modern",
        image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&q=80",
        desc: "Solar-powered beachfront cabins utilizing locally-sourced bamboo and reclaimed teak structures."
      }
    ],
    news: [
      { slug: "off-grid-island-living", title: "Off-Grid Island Living", date: "May 2026", excerpt: "Palawan resort developers transition fully to solar microgrids and composting systems." }
    ],
    collections: [
      "Luxury Glamping Tents"
    ]
  },
  Restaurants: {
    spotlights: [
      {
        slug: "gallery-by-chele",
        title: "Gallery by Chele",
        location: "BGC Central",
        style: "Wood & Steel",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
        desc: "Industrial minimalist space with warm natural wood overlays and dramatic mood lighting."
      },
      {
        slug: "antonios-tagaytay",
        title: "Antonio's Tagaytay",
        location: "Tagaytay Ridge",
        style: "Heritage Colonial",
        image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&q=80",
        desc: "Grand estate dining hall displaying black-and-white tiles, colonial pillars, and lush greenhouse corridors."
      }
    ],
    news: [
      { slug: "poblacion-food-architecture", title: "Poblacion Food Architecture", date: "June 2026", excerpt: "Abandoned residential warehouses are reborn as high-design multi-concept culinary spots." },
      { slug: "design-first-ridge-dining", title: "Design-First Ridge Dining", date: "May 2026", excerpt: "Tagaytay restaurants design glass pavilions to capture panoramic Taal lake vistas." }
    ],
    collections: [
      "Industrial Culinary Hubs",
      "Heritage Estate Dining",
      "Minimalist Coffee Spots"
    ]
  },
  Venues: {
    spotlights: [
      {
        slug: "the-glasshouse-bgc",
        title: "The Glasshouse BGC",
        location: "Bonifacio Global City",
        style: "Steel & Glass",
        image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=80",
        desc: "Minimalist steel-framed glass pavilion designed for premier social and corporate events."
      }
    ],
    news: [
      { slug: "manila-venue-trends", title: "Manila Venue Trends", date: "June 2026", excerpt: "Premium corporate venues shift toward light-filled glass atrium spaces." }
    ],
    collections: [
      "Prestige Event Venues",
      "Glass Pavilions",
      "BGC Event Spaces"
    ]
  }
};

export const DISCOVER_HUBS = {
  Residential: ["BGC Alpha", "Makati Core", "Arca South", "Nuvali Estate", "Forbes Park"],
  Commercial: ["Makati CBD", "Ortigas Center", "BGC North", "Alabang CBD", "Bay Area"],
  STR: ["Siargao Cloud 9", "Boracay Station 1", "Panglao Island"],
  Hospitality: ["El Nido Lio", "Coron Town"],
  Restaurants: ["BGC High Street", "Salcedo Village", "Tagaytay Ridge", "Poblacion", "Tomas Morato"],
  Venues: ["BGC Core", "Makati Central", "Quezon City"]
};

export const CATEGORY_PREVIEWS = {
  Residential: [
    {
      id: "aurelia-residences",
      title: "Aurelia Residences",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      tags: ["Aesthetic: Modern Tropical", "Spatial Density: Low", "Location: BGC Core"],
    },
    {
      id: "the-estate-makati",
      title: "The Estate Makati",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      tags: ["Aesthetic: Brutalist Luxury", "Spatial Density: Medium", "Location: Makati Central"],
    },
    {
      id: "park-central-towers",
      title: "Park Central Towers",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      tags: ["Aesthetic: Glass Minimalist", "Spatial Density: High", "Location: Roxas Triangle"],
    }
  ],
  Commercial: [
    {
      id: "zuellig-building",
      title: "Zuellig Building",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      tags: ["Aesthetic: Sustainable Glass", "Zoning: Premium IT", "Location: Makati CBD"],
    },
    {
      id: "arthaland-century-pacific",
      title: "Arthaland Century Pacific",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      tags: ["Aesthetic: Eco-Corporate", "Zoning: Mixed-Use", "Location: BGC North"],
    }
  ],
  STR: [
    {
      id: "siargao-tropical-villa",
      slug: "siargao-tropical-villa",
      title: "Siargao Tropical Villa",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      tags: ["Aesthetic: Island Minimalist", "Yield: High Velocity", "Location: Cloud 9"],
    },
    {
      id: "pacific-edge-villa",
      slug: "pacific-edge-villa",
      title: "Pacific Edge Villa",
      image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
      tags: ["Aesthetic: Coastal Modern", "Yield: Beach Premium", "Location: Siargao"],
    },
    {
      id: "boracay-bamboo-hideaway",
      slug: "boracay-bamboo-hideaway",
      title: "Boracay Bamboo Hideaway",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
      tags: ["Aesthetic: Eco Bamboo", "Yield: Peak Season", "Location: Station 1"],
    }
  ],
  Hospitality: [
    {
      id: "palawan-eco-retreat",
      slug: "palawan-eco-retreat",
      title: "Palawan Eco-Retreat",
      image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
      tags: ["Aesthetic: Native Modern", "Yield: Seasonal Peak", "Location: El Nido"],
    },
    {
      id: "coron-island-resort",
      slug: "coron-island-resort",
      title: "Coron Island Resort",
      image: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&q=80",
      tags: ["Aesthetic: Overwater Tropical", "Hosting Capacity: 30 Guests", "Location: Coron"],
    },
    {
      id: "bohol-treehouse-lodge",
      slug: "bohol-treehouse-lodge",
      title: "Bohol Treehouse Lodge",
      image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80",
      tags: ["Aesthetic: Jungle Canopy", "Hosting Capacity: 18 Guests", "Location: Panglao"],
    }
  ],
  Restaurants: [
    {
      id: "gallery-by-chele",
      slug: "gallery-by-chele",
      title: "Gallery by Chele",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      tags: ["Aesthetic: Wood & Steel", "Capacity: Intimate", "Location: BGC Central"],
    },
    {
      id: "antonios-tagaytay",
      slug: "antonios-tagaytay",
      title: "Antonio's Tagaytay",
      image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
      tags: ["Aesthetic: Heritage Colonial", "Capacity: Estate", "Location: Tagaytay Ridge"],
    }
  ],
  Venues: [
    {
      id: "the-glasshouse-bgc",
      slug: "the-glasshouse-bgc",
      title: "The Glasshouse BGC",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
      tags: ["Aesthetic: Steel & Glass", "Capacity: 350 Guests", "Location: BGC Core"],
    },
    {
      id: "solaire-grand-ballroom",
      slug: "solaire-grand-ballroom",
      title: "Solaire Grand Ballroom",
      image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
      tags: ["Aesthetic: Luxury Crystal", "Capacity: 800 Guests", "Location: Parañaque"],
    },
    {
      id: "sky-pavilion-makati",
      slug: "sky-pavilion-makati",
      title: "Sky Pavilion Makati",
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80",
      tags: ["Aesthetic: Open Air Rooftop", "Capacity: 200 Guests", "Location: Makati"],
    }
  ]
};

export const DISCOVER_PROPERTIES = {
  Residential: [
    {
      id: "batasan-hills",
      title: "Batasan Hills House & Lot",
      city: "Quezon City",
      location: "Quezon City",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      density: "3 Bedrooms · 180 sqm"
    },
    {
      id: "aurelia-residences",
      title: "Aurelia Residences",
      city: "Bonifacio Global City",
      location: "Bonifacio Global City",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      density: "4 Bedrooms · 240 sqm"
    }
  ],
  Commercial: [
    {
      id: "gridwork-studio",
      title: "The Gridwork Studio",
      city: "Bonifacio Global City",
      location: "Bonifacio Global City",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      density: "Open Layout · 150 sqm"
    },
    {
      id: "zuellig-building",
      title: "Zuellig Building",
      city: "Makati",
      location: "Makati CBD",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      density: "Sustainable Glass · 500 sqm"
    },
  ],
  STR: [
    {
      id: "pacific-edge-villa",
      slug: "pacific-edge-villa",
      title: "Pacific Edge Villa",
      city: "Siargao",
      location: "Siargao",
      image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
      density: "Beachfront · 250 sqm"
    },
    {
      id: "siargao-tropical-villa",
      slug: "siargao-tropical-villa",
      title: "Siargao Tropical Villa",
      city: "Siargao",
      location: "Cloud 9, Siargao",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      density: "Surf Beachfront · 150 sqm"
    },
    {
      id: "boracay-bamboo-hideaway",
      slug: "boracay-bamboo-hideaway",
      title: "Boracay Bamboo Hideaway",
      city: "Boracay",
      location: "Station 1, Boracay",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
      density: "Eco Bamboo · 120 sqm"
    }
  ],
  Hospitality: [
    {
      id: "palawan-eco-retreat",
      slug: "palawan-eco-retreat",
      title: "Palawan Eco-Retreat Lodge",
      city: "El Nido",
      location: "El Nido Lio, Palawan",
      image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
      density: "Eco Resort / Cabins · 300 sqm"
    },
    {
      id: "coron-island-resort",
      slug: "coron-island-resort",
      title: "Coron Island Resort",
      city: "Coron",
      location: "Coron, Palawan",
      image: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&q=80",
      density: "Overwater Villas · 8 Suites"
    },
    {
      id: "bohol-treehouse-lodge",
      slug: "bohol-treehouse-lodge",
      title: "Bohol Treehouse Lodge",
      city: "Panglao",
      location: "Panglao Island, Bohol",
      image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80",
      density: "Jungle Treehouse · 6 Units"
    }
  ],
  Restaurants: [
    {
      id: "gallery-by-chele",
      slug: "gallery-by-chele",
      title: "Gallery by Chele",
      city: "Bonifacio Global City",
      location: "Bonifacio Global City",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      density: "Intimate Layout · 250 sqm"
    },
    {
      id: "antonios-tagaytay",
      slug: "antonios-tagaytay",
      title: "Antonio's Tagaytay",
      city: "Tagaytay Ridge",
      location: "Tagaytay Ridge",
      image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
      density: "Heritage Colonial · 800 sqm"
    }
  ],
  Venues: [
    {
      id: "the-glasshouse-bgc",
      slug: "the-glasshouse-bgc",
      title: "The Glasshouse BGC",
      city: "Bonifacio Global City",
      location: "Bonifacio Global City",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
      density: "Event Venue · 600 sqm"
    },
    {
      id: "solaire-grand-ballroom",
      slug: "solaire-grand-ballroom",
      title: "Solaire Grand Ballroom",
      city: "Parañaque",
      location: "Entertainment City, Parañaque",
      image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
      density: "Luxury Ballroom · 2,400 sqm"
    },
    {
      id: "sky-pavilion-makati",
      slug: "sky-pavilion-makati",
      title: "Sky Pavilion Makati",
      city: "Makati",
      location: "Ayala CBD, Makati",
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80",
      density: "Rooftop Pavilion · 800 sqm"
    }
  ]
};

export const PROPERTIES_DETAILS = {
  // ═══════════════════════════════════════════════════════════════
  // DEMO SHOWCASE — subscription/tier preview (DEV ONLY, mock-only slug).
  // Loaded with premium Vault (Matterport 3D tour) so the hidden ?dev=1 tier
  // switcher visibly unlocks subscriber content. NOT a real Airtable listing;
  // safe to fill with illustrative premium values. Route:
  //   /property/the-paragon-tower?dev=1   (flip to Cluster to unlock the Vault)
  // Remove with the rest of the dev mocks before launch.
  // ═══════════════════════════════════════════════════════════════
  "the-paragon-tower": {
    title:             "The Paragon — Premier Office Tower",
    location:          "9th Avenue, Bonifacio Global City",
    lat:               14.5510,
    lng:               121.0490,
    hook:              "Trophy Grade-A office floors with full spatial intelligence.",
    city:              "Bonifacio Global City",
    property_type:     "Commercial",
    spaceCategory:     "Commercial",
    tenure:            "For Lease",
    year_built:        "2025",
    floor_sqm:         2200,
    parking:           60,
    ceiling_height_text: "3.2 meters",
    aesthetic_tag:     "Trophy Grade-A Corporate",
    scoutit_verdict:   "Highly Recommended — Trophy CBD Asset",
    best_for:          "Multinationals · Regional HQ · Financial Institutions",
    broker_name:       "ScoutIt Premier Leasing",
    // ── Price (display-only) ──
    listed_price:      "₱1,650 / sqm / month",
    price_status:      "Published",
    price_verified_by: "Property Manager",
    price_source:      "ScoutIt demo data",
    price_notes:       "Demo listing — figures are illustrative.",
    // ── Premium Vault (unlocks at Cluster+) — real public Matterport sample ──
    matterportTourUrl: "https://my.matterport.com/show/?m=SxQL3iGyoDo&play=1",
    // ── Deep intel (unlocks at Solar+) — keyed by the exact labels the commercial
    //    page renders (CategorySpecBlock MINOR + extras + each DeepIntelWidget). ──
    deepIntel: {
      // CategorySpecBlock — commercial MINOR
      "CAMC (CUSA)":          "₱185 / sqm / mo",
      "A/C Charges":          "₱48 / sqm / mo",
      "AC System":            "Centralized VRF · 7am–7pm + paid extension",
      "Reserved Parking":     "1 slot / 100 sqm leased",
      "Escalation Rate":      "5% per annum",
      "Fit-out Allowance":    "₱8,000 / sqm (qualified tenants)",
      "Rent-free Period":     "Up to 2 months on a 3-year term",
      "Parking Ratio":        "1 : 95 sqm",
      "Backup Power":         "100% · N+1 generator backup",
      "Floor Loading":        "500 kg/sqm live load",
      "Internet Providers":   "PLDT, Globe, Converge (redundant FTTH)",
      "Available Units":      "Floors 14, 18 & 22 (full-floor)",
      "Towers / Zones":       "Single tower · low/mid/high zones",
      "Cap Rate":             "6.8%",
      "NOI":                  "₱182.4M / yr (stabilized)",
      // CategorySpecBlock — commercial extraLockedLabels
      "Ventilation Quality":  "ASHRAE 62.1 · MERV-13 filtration",
      "Noise Level Score":    "8.7 / 10 (low ambient)",
      "Natural Light Score":  "9.1 / 10 (floor-to-ceiling glazing)",
      "Privacy Score":        "8.4 / 10",
      "Acoustic Baseline":    "NC-35 office baseline",
      // DeepIntelWidget — location
      "Solar Orientation":        "NE–SW long axis · low afternoon heat gain",
      "Pedestrian Flow Metrics":  "12,400 avg daily (9th Ave frontage)",
      "Office Density Data":      "Grade-A submarket vacancy 8.2%",
      "Development Pipeline":     "2 towers delivering 2027 within 400m",
      // DeepIntelWidget — life
      "Noise Decibel Readings":   "42 dB daytime interior",
      "Lighting Color Temperature":"4000K neutral · tunable lobby",
      "Privacy Score Details":    "Tinted low-e glass · 0.28 SHGC",
      "Peak Hour Crowd Data":     "Lobby peak 8:30–9:15am",
      // DeepIntelWidget — whereto
      "Walkability Score":        "92 / 100",
      "Transit Frequency Analysis":"BGC Bus every 4–6 min at peak",
      "Peak Hour Commute Data":   "BGC↔Makati 18 min off-peak",
      "Zoning Classification":    "BGC Commercial · PEZA IT zone",
      // DeepIntelWidget — buildplans
      "MEP Specifications":       "VRF HVAC · 2 × 2,500 kVA transformers",
      "Electrical Load Capacity": "120 VA / sqm tenant provision",
      "Kitchen-to-Dining Floor Ratio":"N/A — office use",
      "Ventilation Routing":      "Per-floor AHU · fresh-air economizer",
      "Structural Calculations":  "Post-tensioned slab · 0.4g seismic design",
      // DeepIntelWidget — units
      "Precise Room Dimensions":  "Full-floor 2,200 sqm · 8.4m core-to-glass",
      "Technical Asset Manifest": "150mm raised floor · 2 freight + 6 pax lifts",
      "Fixed Equipment Specs":    "BMS · FDAS · NFPA-13 sprinklers",
      "Finish & Material Schedule":"Warm shell · granite lobby · LVT-ready",
      "Utility Point Mapping":    "Core riser · tenant meters per floor",
      // DeepIntelWidget — universe
      "Detailed Historical Transaction Records":"Developer-held · no prior resale",
      "Architectural Heritage Notes":"Completed 2025 · LEED Platinum shell",
      "Original Permit & Blueprint Archive":"On file · released to signed tenants",
      "Provenance & Ownership Lineage":"Single-owner developer SPV",
      // Hidden Intel — market/investment panel (unlocks at Cluster+)
      "Cap Rate (Area Benchmark)":"6.4% – 7.1% (BGC Grade-A)",
      "Transaction History":"No resale · developer-held since 2025",
      "Appreciation Projection":"+5.8% p.a. (5-yr submarket avg)",
      "Price History":"Launch ₱1,500 → ₱1,650 / sqm (2025→26)",
      "Competitive Density":"6 Grade-A towers within 800m",
      "Market Position Index":"Top-decile rents in BGC submarket",
    },
    // ── Per-category spec block (CategorySpecBlock d.cat.commercial) ──
    cat: {
      commercial: {
        rentFrom:       1650,
        rentPerSqm:     "₱1,650 / sqm",
        totalGLA:       2200,
        floorPlate:     "2,200 sqm / floor",
        buildingGrade:  "Trophy (Grade A)",
        camc:           "₱185 / sqm",
        handOver:       "Warm shell",
        availability:   "Available Q4 2026",
        certification:  "LEED Platinum · WELL Core",
        peza:           true,
        minLeaseTerm:   "3 years",
      },
    },
    photos: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Transit",    name: "BGC Bus Terminal",             distance: "4 min walk" },
      { category: "Business",   name: "Bonifacio High Street",        distance: "5 min walk" },
      { category: "Healthcare", name: "St. Luke's Medical Center BGC", distance: "6 min drive" },
    ],
    bestForTags: ["Trophy Grade A", "LEED Platinum", "BGC Core"],
  },
  // ═══════════════════════════════════════════════════════════════
  // TEMP DEV MOCK — remove in Stage 4 (mock-data cleanup).
  // Exists only to render/verify the CategorySpecBlock (d.cat.*) +
  // SOP §9 price logic locally without approving a real Airtable record.
  // Route: /property/sm-ecom-test
  // ═══════════════════════════════════════════════════════════════
  "sm-ecom-test": {
    title:             "SM E-Com Center — Office Tower",
    location:          "Mall of Asia Complex, Pasay City",
    lat:               14.5352,
    lng:               120.9822,
    hook:              "Grade-A leasing floors in the SM MOA business district.",
    city:              "Pasay City",
    property_type:     "Commercial",
    spaceCategory:     "Commercial",
    tenure:            "For Lease",
    year_built:        "2017",
    floor_sqm:         1850,
    parking:           40,
    ceiling_height_text: "2.9 meters",
    aesthetic_tag:     "Grade-A Corporate",
    scoutit_verdict:   "Recommended — Prime CBD Leasing Floor",
    best_for:          "Multinationals · BPO · Corporate HQ",
    accordion_3_text:  "Official SM leasing inventory — one of six E-Com tower floors offered for corporate lease.",
    broker_name:       "SM Prime Leasing",
    // ── SOP §9 price: Published + Property Manager-verified ──
    listed_price:      "₱1,150 / sqm / month",
    price_status:      "Published",
    price_verified_by: "Property Manager",
    price_source:      "SM Offices official leasing deck (June 2026)",
    price_notes:       "Exclusive of CAMC and A/C charges. Minimum 3-year lease.",
    // ── Per-category group consumed by CategorySpecBlock ──
    cat: {
      commercial: {
        rentFrom:       1150,            // hero (currency)
        rentPerSqm:     "₱1,150 / sqm",  // hero
        totalGLA:       1850,            // hero (sqm)
        floorPlate:     "1,850 sqm / floor", // hero
        buildingGrade:  "Premium (Grade A)",
        camc:           "₱155 / sqm",
        handOver:       "Warm shell",
        availability:   "Available Q3 2026",
        certification:  "PEZA-registered IT zone",
        peza:           true,
        // acCharges + minLeaseTerm intentionally omitted → exercise the
        // honest "Not listed yet" blank path (never an invented value).
      },
    },
    photos: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Transit", name: "MOA Bus Terminal", distance: "6 min walk" },
      { category: "Business", name: "SM Mall of Asia", distance: "3 min walk" },
    ],
    bestForTags: ["Grade A", "PEZA", "CBD"],
  },
  "batasan-hills": {
    title:             "Batasan Hills House & Lot",
    location:          "Batasan Hills, Quezon City",
    lat:               14.6853,
    lng:               121.0934,
    hook:              "Positioned within one of QC's fastest-evolving residential corridors.",
    city:              "Quezon City",
    property_type:     "House & Lot",
    spaceCategory:     "Residential",
    tenure:            "For Sale",
    year_built:        "2018",
    furnishing:        "Bare",
    beds:              3,
    baths:             2,
    floor_sqm:         120,
    lot_sqm:           180,
    parking:           1,
    floors:            "2 Storey",
    comfort_level:     8.5,
    natural_light:     9.0,
    privacy:           8.0,
    space_feel:        8.7,
    noise_level_text:         "Low / Minimal",
    ventilation:              "Excellent cross-ventilation",
    ceiling_height_text:      "3.2 meters",
    outdoor_description:      "Spacious multi-use courtyard area",
    street_type:              "Concrete subdivision road",
    lifestyle_vibe:           "Quiet & Family-Oriented",
    best_for:                 "Families · WFH Professionals · Long-term Investors",
    flood_risk_score:  2,
    convenience_score: 7.5,
    title_status:      "TCT — Free & Clear",
    scoutit_verdict:   "Highly Recommended — AAA Asset Tier",

    // ── Ch.1 aesthetic ── (Airtable: AestheticTag) ──
    aesthetic_tag:            "Modern Tropical Filipino",
    // ── Ch.2 location intelligence ──────────────────
    flood_zone_status:        "Low-risk zone · Elevated lot, no recorded flooding", // Airtable: FloodZoneStatus
    zoning_classification:    "R-2 Medium-Density Residential",                       // Airtable: ZoningClassification
    nearest_highway:          "Commonwealth Avenue · 4 min drive",                    // Airtable: NearestHighway
    commute_bgc:              "45–60 min",                                            // Airtable: CommuteBGC
    commute_makati:           "50–65 min",                                            // Airtable: CommuteMakati
    commute_ortigas:          "30–40 min",                                            // Airtable: CommuteOrtigas
    public_transport:         "Commonwealth jeepney routes and UV Express vans run along the main corridor, with MRT-7 (under construction) set to add a North Avenue rail link serving the district.", // Airtable: PublicTransport
    // ── Ch.3 life here ── (Airtable: SafetyPerception / CommunityFeel) ──
    safety_perception:        "The barangay maintains active community watch and gated subdivision entries. Residents describe the streets as calm and walkable well into the evening, with a steady but unobtrusive security presence.",
    community_feel:           "A settled, multi-generational neighborhood where families have lived for decades. Sari-sari stores, weekend basketball, and neighborhood chapels anchor a close-knit, low-turnover community.",
    // ── Ch.5 build plans ────────────────────────────
    expansion_potential:      "The 180 sqm lot leaves generous setback room for a rear extension or a third-storey addition, with the existing reinforced-concrete frame already engineered to carry an added floor.", // Airtable: ExpansionPotential
    zoning_type:              "R-2 Residential",                                       // Airtable: ZoningType
    developer_name:           "Owner-built (private commission)",                      // Airtable: DeveloperName
    developer_notes:          "Built under direct owner supervision with an independent structural engineer; not part of a mass-housing tract.", // Airtable: DeveloperNotes
    structural_notes:         "Reinforced concrete frame on isolated footings, CHB walls, long-span steel trusses over the living area.", // Airtable: StructuralNotes
    // ── Ch.8 universe ───────────────────────────────
    architect_designer:       "Arch. Lance Reyes · LR Atelier",                        // Airtable: ArchitectDesigner
    building_style:           "Tropical Modernist",                                    // Airtable: BuildingStyle
    universe_summary:         "Batasan Hills House & Lot is a quietly confident family home that trades flash for longevity — 120 sqm of well-ventilated, light-filled space on a 180 sqm elevated lot in one of Quezon City's most stable residential corridors. Its tropical-modernist frame, clean title, and room to expand make it equally compelling as a forever home or a long-hold appreciating asset. This is a space that rewards living in it as much as owning it.", // Airtable: UniverseSummary
    // ── Ch.10 price (authorized, display-only) ──────
    listed_price:             "₱18,500,000",                                       // Airtable: Listed_Price
    price_source:             "Owner",                                             // Airtable: Price_Source
    price_notes:              "Negotiable for cash buyers; clean title ready for immediate transfer.", // Airtable: Price_Notes
    accordion_1_title: "Home Feel & Comfort",
    accordion_1_rating:"High",
    accordion_2_title: "Space Usability",
    accordion_2_rating:"Efficient",
    accordion_3_title: "Story of This Space",
    accordion_3_rating:"",
    accordion_3_text:  "Built in 2018 by a family that outgrew the space, this property has never been rented — preserving its material quality and finish integrity across all rooms.",
    broker_name:       "Miguel Torres, REB",
    photos: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
    ],
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
    bestForTags: ["Families", "WFH Professionals", "Long-term Hold"],
  },
  "aurelia-residences": {
    title:             "Aurelia Residences Penthouse",
    location:          "BGC Core, Bonifacio Global City",
    lat:               14.5502,
    lng:               121.0494,
    hook:              "Low density luxury high-rise featuring double-glazed glass wrap.",
    city:              "Bonifacio Global City",
    property_type:     "Penthouse Condo",
    spaceCategory:     "Residential",
    tenure:            "For Sale",
    year_built:        "2024",
    furnishing:        "Semi-Furnished",
    beds:              4,
    baths:             4,
    floor_sqm:         240,
    lot_sqm:           0,
    parking:           2,
    floors:            "Single Level (High Rise)",
    comfort_level:     9.5,
    natural_light:     9.8,
    privacy:           9.2,
    space_feel:        9.6,
    noise_level_text:         "Acoustically insulated double-pane glass",
    ventilation:              "Eco centralized cooling & natural sea drafts",
    ceiling_height_text:      "3.5 meters",
    outdoor_description:      "Panoramic wrap balcony with green pocket planters",
    street_type:              "Private estate access driveway",
    lifestyle_vibe:           "Elite Urban Sophistication",
    best_for:                 "C-Suite Executives · Design Connoisseurs · Multi-gen Investors",
    flood_risk_score:  0,
    convenience_score: 9.8,
    title_status:      "CCT — Clean & Registered",
    scoutit_verdict:   "Pristine Trophy Asset — AAA Investment Grade",
    accordion_1_title: "Acoustics & Air Flow",
    accordion_1_rating:"Outstanding",
    accordion_2_title: "High Rise Usability",
    accordion_2_rating:"Excellent",
    accordion_3_title: "Architectural Intent",
    accordion_3_rating:"Awarded",
    accordion_3_text:  "Constructed to symbolize low-density modern tropical high-rise living, highlighting Italian travertine finishes, bronze exterior fins, and wide floor plate spans.",
    broker_name:       "Miguel Torres, REB",
    photos: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Business",   name: "BGC Corporate Office Hub",               distance: "3 min walk"  },
      { category: "Transit",    name: "Kalayaan Flyover Entrance",               distance: "5 min drive" },
      { category: "Healthcare", name: "St. Luke's Medical Center BGC",           distance: "6 min drive" },
      { category: "Essentials", name: "Bonifacio High Street Shops",            distance: "4 min walk"  },
    ],
    bestForTags: ["High Yield", "Urban Center", "Trophy Asset"],
  },
  "the-estate-makati": {
    title:             "The Estate Makati Suite",
    location:          "Ayala Avenue, Makati Central",
    lat:               14.5562,
    lng:               121.0246,
    hook:              "Cruciform structure designed by Foster + Partners to maximize natural daylight.",
    city:              "Makati Central",
    property_type:     "Premium Condominium",
    spaceCategory:     "Residential",
    tenure:            "For Sale",
    year_built:        "2025",
    furnishing:        "Bare",
    beds:              3,
    baths:             3,
    floor_sqm:         220,
    lot_sqm:           0,
    parking:           2,
    floors:            "Single Level",
    comfort_level:     9.3,
    natural_light:     9.6,
    privacy:           9.5,
    space_feel:        9.4,
    noise_level_text:         "Triple-glazed sound dampening filters",
    ventilation:              "Optimized horizontal airflow shafts",
    ceiling_height_text:      "3.4 meters",
    outdoor_description:      "Private double-foyer lobby entrance",
    street_type:              "Ayala Avenue Central Corridor",
    lifestyle_vibe:           "Quiet Executive Seclusion",
    best_for:                 "Institutional Buyers · Multi-National Executives",
    flood_risk_score:  0,
    convenience_score: 9.6,
    title_status:      "Condo Title — Free & Clear",
    scoutit_verdict:   "Premium Landmark Architecture — Core Portfolio Tier",
    accordion_1_title: "Privacy & Isolation",
    accordion_1_rating:"Safe",
    accordion_2_title: "Column-Free Plan",
    accordion_2_rating:"Efficient",
    accordion_3_title: "Foster + Partners Build",
    accordion_3_rating:"Special",
    accordion_3_text:  "Built using a central core suspension method that keeps all interior spaces completely free of load-bearing pillars, permitting custom room configurations.",
    broker_name:       "Miguel Torres, REB",
    photos: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Business",   name: "Makati Stock Exchange",                  distance: "2 min walk"  },
      { category: "Essentials", name: "Greenbelt Mall Complex",                  distance: "5 min walk"  },
      { category: "Transit",    name: "EDSA Ayala MRT Station",                  distance: "8 min walk"  },
    ],
    bestForTags: ["Makati CBD", "Column-Free Layout", "Investment Core"],
  },
  "siargao-tropical-villa": {
    title:             "Siargao Tropical Beachfront Villa",
    location:          "Cloud 9, General Luna, Siargao",
    lat:               9.8055,
    lng:               126.1622,
    hook:              "Open-plan coco-wood pavilion with high-pitched thatch roofs.",
    city:              "Siargao",
    property_type:     "Beachfront Villa",
    spaceCategory:     "STR",
    tenure:            "For Sale",
    year_built:        "2021",
    furnishing:        "Fully Furnished",
    beds:              2,
    baths:             2,
    floor_sqm:         150,
    lot_sqm:           400,
    parking:           1,
    floors:            "1 Storey Pavilion",
    comfort_level:     8.9,
    natural_light:     9.8,
    privacy:           8.7,
    space_feel:        9.5,
    noise_level_text:         "Soothed by sea breezes and wave breaks",
    ventilation:              "Cross-flow shutter louvers, no AC required",
    ceiling_height_text:      "4.5 meters (Vaulted Thatch)",
    outdoor_description:      "Saltwater pool and private beach access corridor",
    street_type:              "Sub-road off Tourism Road",
    lifestyle_vibe:           "High-End Island Minimalist",
    best_for:                 "Boutique Operators · Remote Entrepreneurs · Eco-Investors",
    flood_risk_score:  3,
    convenience_score: 7.8,
    title_status:      "Vetted Claim & Tax Dec — Clear Title Track",
    scoutit_verdict:   "Premium Surf Asset — A-Class Rental Velocity",
    accordion_1_title: "Tropical Comfort Vibe",
    accordion_1_rating:"High",
    accordion_2_title: "Native Open Layout",
    accordion_2_rating:"Excellent",
    accordion_3_title: "Eco Sustainability Plan",
    accordion_3_rating:"Green",
    accordion_3_text:  "Constructed entirely with local coco-lumber columns and treated bamboo screens to offer passive thermal cooling and complete storm resiliency.",
    broker_name:       "Marco Reyes, REB",
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Recreation", name: "Cloud 9 Surf Break Boardwalk",           distance: "3 min walk"  },
      { category: "Essentials", name: "General Luna Central Hub",                distance: "5 min drive" },
      { category: "Transit",    name: "Sayak Airport (IAO)",                     distance: "35 min drive"},
    ],
    bestForTags: ["Beachfront", "Eco Build", "Short-Term Yield"],
    accommodations:    "2 Luxury Suites",
    hosting_capacity:  "15 Guests",
  },
  "palawan-eco-retreat": {
    title:             "Palawan Eco-Retreat Lodge",
    location:          "El Nido Lio, Palawan",
    lat:               11.1962,
    lng:               119.3956,
    hook:              "Solar-powered beachfront cabins utilizing locally-sourced bamboo and reclaimed teak.",
    city:              "El Nido",
    property_type:     "Eco Resort / Cabins",
    spaceCategory:     "Hospitality",
    tenure:            "For Sale",
    year_built:        "2023",
    furnishing:        "Fully Furnished",
    beds:              5,
    baths:             5,
    floor_sqm:         300,
    lot_sqm:           800,
    parking:           2,
    floors:            "Raised Stilts Cabins",
    comfort_level:     9.1,
    natural_light:     9.5,
    privacy:           9.4,
    space_feel:        9.6,
    noise_level_text:         "Nature ambient sound only",
    ventilation:              "Passive cool-tube ground air ducts",
    ceiling_height_text:      "3.8 meters",
    outdoor_description:      "Stilted walkways and natural coral sand garden",
    street_type:              "Coastal dirt pathway access",
    lifestyle_vibe:           "Off-Grid Wilderness Luxury",
    best_for:                 "Conservationist Owners · Retreat Operators",
    flood_risk_score:  2,
    convenience_score: 6.8,
    title_status:      "Freehold Patent — Vetted and Clear",
    scoutit_verdict:   "Unparalleled Sustainable Asset — High Ethical Yield",
    accordion_1_title: "Off Grid Microclimate",
    accordion_1_rating:"Good",
    accordion_2_title: "Stilted Layout",
    accordion_2_rating:"Safe",
    accordion_3_title: "Zero Footprint Promise",
    accordion_3_rating:"Green",
    accordion_3_text:  "Runs on an isolated solar microgrid with graywater recycling that ensures absolute integration with the local biosphere.",
    broker_name:       "Marco Reyes, REB",
    photos: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Recreation", name: "El Nido Marine Sanctuary",                 distance: "2 min walk"  },
      { category: "Transit",    name: "Lio Airport",                             distance: "10 min drive"},
      { category: "Essentials", name: "El Nido Town Center",                     distance: "15 min drive"},
    ],
    bestForTags: ["Off-Grid", "Palawan Eco", "Sustainable Yield"],
    accommodations:    "5 Eco Cabins",
    hosting_capacity:  "50 Guests",
  },
  "gallery-by-chele": {
    title:             "Gallery by Chele Space",
    location:          "BGC Central, Bonifacio Global City",
    lat:               14.5482,
    lng:               121.0478,
    hook:              "Industrial minimalist space with warm natural wood overlays.",
    city:              "Bonifacio Global City",
    property_type:     "Commercial / Restaurant",
    spaceCategory:     "Restaurants",
    tenure:            "For Lease",
    year_built:        "2017",
    furnishing:        "Fully Fitted (Restaurant)",
    beds:              0,
    baths:             3,
    floor_sqm:         250,
    lot_sqm:           0,
    parking:           2,
    floors:            "1 Level Commercial Podium",
    comfort_level:     9.0,
    natural_light:     8.2,
    privacy:           7.5,
    space_feel:        9.2,
    noise_level_text:         "Vibrant interior acoustics",
    ventilation:              "High volume HVAC with fresh air cycling",
    ceiling_height_text:      "4.2 meters",
    outdoor_description:      "Curated green lobby waiting area",
    street_type:              "BGC Retail Avenue Access",
    lifestyle_vibe:           "Aesthetic Culinary Platform",
    best_for:                 "Fine Dining Brands · Design-First Hospitality Groups",
    flood_risk_score:  0,
    convenience_score: 9.7,
    title_status:      "Commercial Lease — Long Term Contract",
    scoutit_verdict:   "Turnkey Premium Commercial Space — AAA Prime Location",
    accordion_1_title: "Acoustic Dining Fit",
    accordion_1_rating:"Comfortable",
    accordion_2_title: "Kitchen Flow Design",
    accordion_2_rating:"Efficient",
    accordion_3_title: "Fit-Out Integrity",
    accordion_3_rating:"Fitted",
    accordion_3_text:  "Refitted in 2022 to display raw industrial steel structures integrated with warm ash-wood paneling and bespoke kitchen utility lines.",
    broker_name:       "Elena Santos, REB",
    photos: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Essentials", name: "High Street Central Retail Plaza",         distance: "1 min walk"  },
      { category: "Transit",    name: "BGC Central Bus Terminus",                 distance: "3 min walk"  },
      { category: "Healthcare", name: "St. Luke's Medical Center BGC",           distance: "8 min drive" },
    ],
    bestForTags: ["Fitted Kitchen", "High Foot Traffic", "BGC Commercial"],
    seating_capacity:  "80 Seats",
    kitchen_grade:     "Commercial AAA",
  },
  "antonios-tagaytay": {
    title:             "Antonio's Tagaytay Heritage Estate",
    location:          "Tagaytay Ridge, Cavite",
    lat:               14.1206,
    lng:               120.9064,
    hook:              "Grand colonial estate dining hall with black-and-white tiles.",
    city:              "Tagaytay Ridge",
    property_type:     "Heritage Commercial / Land",
    spaceCategory:     "Restaurants",
    tenure:            "For Sale",
    year_built:        "2002",
    furnishing:        "Fully Fitted",
    beds:              2,
    baths:             8,
    floor_sqm:         800,
    lot_sqm:           1500,
    parking:           10,
    floors:            "2 Storey Heritage House",
    comfort_level:     9.4,
    natural_light:     9.6,
    privacy:           9.0,
    space_feel:        9.7,
    noise_level_text:         "Serene highland breeze rustles",
    ventilation:              "Open-air colonial arches, cool mountain air",
    ceiling_height_text:      "4.0 meters",
    outdoor_description:      "Extensive greenhouse botanical walkways and gardens",
    street_type:              "Tagaytay-Nasugbu Highway access road",
    lifestyle_vibe:           "Heritage Colonial Grandeur",
    best_for:                 "Premium Restaurateurs · Private Estate Collectors",
    flood_risk_score:  1,
    convenience_score: 8.2,
    title_status:      "TCT Title — Free & Clear",
    scoutit_verdict:   "Legendary Culinary Estate — S-Class Leisure Property",
    accordion_1_title: "Microclimate & Breeze",
    accordion_1_rating:"Excellent",
    accordion_2_title: "Botanical Flow",
    accordion_2_rating:"Efficient",
    accordion_3_title: "Heritage Conservation",
    accordion_3_rating:"Preserved",
    accordion_3_text:  "Conserved as a prime example of Spanish-Filipino colonial design, merging terracotta tile structures with timber-frame verandas and brick courtyards.",
    broker_name:       "Sofia Araneta",
    photos: [
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Recreation", name: "Taal Volcano Ridge Overlook",             distance: "2 min walk"  },
      { category: "Essentials", name: "Tagaytay City Market",                     distance: "12 min drive"},
      { category: "Transit",    name: "SLEX Santa Rosa Exit",                    distance: "40 min drive"},
    ],
    bestForTags: ["Leisure Estate", "Highlands Vibe", "Heritage Value"],
    seating_capacity:  "250 Seats",
    kitchen_grade:     "Executive AAA",
  },
  "the-glasshouse-bgc": {
    title:             "The Glasshouse BGC Event Space",
    location:          "BGC Core, Bonifacio Global City",
    lat:               14.5518,
    lng:               121.0435,
    hook:              "Minimalist steel-framed glass pavilion designed for premier social and corporate events.",
    city:              "Bonifacio Global City",
    property_type:     "Event Venue",
    spaceCategory:     "Venues",
    tenure:            "For Lease",
    year_built:        "2023",
    furnishing:        "Fully Fitted",
    beds:              0,
    baths:             4,
    floor_sqm:         600,
    lot_sqm:           800,
    parking:           25,
    floors:            "Single Level Pavilion",
    comfort_level:     9.2,
    natural_light:     9.9,
    privacy:           8.5,
    space_feel:        9.8,
    noise_level_text:         "Acoustically treated interior shell",
    ventilation:              "High capacity silent air cycle HVAC",
    ceiling_height_text:      "6.5 meters",
    outdoor_description:      "Lush manicured pre-function lawn and cocktail terrace",
    street_type:              "Corporate boulevard easement",
    lifestyle_vibe:           "High-Design Social Landmark",
    best_for:                 "Luxury Weddings · Corporate Galas · Product Launches",
    flood_risk_score:  0,
    convenience_score: 9.6,
    title_status:      "Commercial Lease — Long Term Contract",
    scoutit_verdict:   "Masterpiece Event Asset — S-Class Venue Caliber",
    accordion_1_title: "Acoustics & Lighting",
    accordion_1_rating:"Outstanding",
    accordion_2_title: "Rigging & Load Capacity",
    accordion_2_rating:"Excellent",
    accordion_3_title: "Architectural Intent",
    accordion_3_rating:"Special",
    accordion_3_text:  "Designed to seamlessly dissolve the boundary between nature and structure, utilizing high-transparency glass walls, reinforced steel arches, and an acoustic sound-absorption ceiling cloud.",
    broker_name:       "Elena Santos, REB",
    photos: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Transit",    name: "BGC Corporate Hub Parking Lot",          distance: "1 min walk"  },
      { category: "Essentials", name: "Grand Hyatt Manila & Shangri-La BGC",     distance: "3 min drive" },
      { category: "Healthcare", name: "St. Luke's Medical Center BGC",           distance: "5 min drive" },
    ],
    bestForTags: ["High Ceiling", "A/V Loaded", "Prestige Venue"],
    seating_capacity:  "350 standing / 200 banquet",
    setup_grade:       "Premium A/V Ready (Acoustic AAA)",
  },
  "boracay-bamboo-hideaway": {
    title:             "Boracay Bamboo Hideaway",
    location:          "Station 1, Boracay Island",
    lat:               11.9674,
    lng:               121.9184,
    hook:              "Off-grid bamboo villa steps from the whitest sand beach in the Philippines.",
    city:              "Boracay",
    property_type:     "Boutique STR Villa",
    spaceCategory:     "STR",
    tenure:            "For Sale",
    year_built:        "2021",
    furnishing:        "Fully Furnished",
    beds:              3,
    baths:             2,
    floor_sqm:         120,
    lot_sqm:           250,
    parking:           2,
    floors:            "Single Level",
    comfort_level:     9.0,
    natural_light:     9.5,
    privacy:           8.8,
    space_feel:        9.2,
    noise_level_text:         "Ocean breeze + soft wave sound",
    ventilation:              "Full natural cross-ventilation, no A/C needed",
    ceiling_height_text:      "4.5 meters (vaulted bamboo)",
    outdoor_description:      "Private deck with outdoor shower and sun beds",
    street_type:               "Beachside footpath",
    lifestyle_vibe:           "Barefoot Luxury",
    best_for:                 "STR Operators · Island Investors · Lifestyle Buyers",
    flood_risk_score:  3,
    convenience_score: 9.0,
    title_status:      "TCT — Free & Clear",
    scoutit_verdict:   "High-Yield Coastal STR — AA Hospitality Grade",
    accordion_1_title: "Beachfront Position",
    accordion_1_rating:"Excellent",
    accordion_2_title: "STR Yield Potential",
    accordion_2_rating:"High Velocity",
    accordion_3_title: "Architectural Intent",
    accordion_3_rating:"Special",
    accordion_3_text:  "Hand-crafted from reclaimed mountain bamboo and local hardwood, this villa was designed by a Filipino-Norwegian studio to maximize ocean views and tropical ventilation.",
    broker_name:       "Marco Reyes, REB",
    photos: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Beach",      name: "White Beach Station 1",                    distance: "2 min walk"  },
      { category: "Recreation", name: "Diniwid Beach",                             distance: "8 min walk"  },
      { category: "Essentials", name: "D'Mall Boracay",                            distance: "12 min walk" },
      { category: "Transit",    name: "Caticlan Jetty Port",                       distance: "25 min boat" },
    ],
    bestForTags: ["Beachfront", "STR High Yield", "Off-Grid"],
  },
  "coron-island-resort": {
    title:             "Coron Island Resort",
    location:          "Coron Bay, Palawan",
    lat:               11.9962,
    lng:               120.2031,
    hook:              "Overwater villas above crystal-clear Coron Bay with direct lagoon diving access.",
    city:              "Coron",
    property_type:     "Island Resort",
    spaceCategory:     "Hospitality",
    tenure:            "For Sale",
    year_built:        "2020",
    furnishing:        "Fully Fitted",
    beds:              8,
    baths:             8,
    floor_sqm:         1200,
    lot_sqm:           3000,
    parking:           5,
    floors:            "Single Level (Overwater)",
    comfort_level:     9.7,
    natural_light:     9.9,
    privacy:           9.5,
    space_feel:        9.8,
    noise_level_text:         "Quiet bay — occasional boat activity",
    ventilation:              "Open-air overwater design, constant sea breeze",
    ceiling_height_text:      "3.8 meters",
    outdoor_description:      "Private dive platforms, sunrise decks per villa",
    street_type:               "Boat access only",
    lifestyle_vibe:           "Secluded Island Luxury",
    best_for:                 "Resort Operators · Eco-Tourism Investors · High-Net-Worth Buyers",
    flood_risk_score:  4,
    convenience_score: 7.5,
    title_status:      "TCT — Under Trust Arrangement",
    scoutit_verdict:   "Trophy Island Asset — S-Class Resort Grade",
    accordion_1_title: "Underwater Access",
    accordion_1_rating:"Exceptional",
    accordion_2_title: "Guest Experience",
    accordion_2_rating:"Pristine",
    accordion_3_title: "Ecological Position",
    accordion_3_rating:"Rare",
    accordion_3_text:  "Positioned directly above the marine sanctuary zone, guests have direct access to world-class dive sites from their private overwater deck.",
    broker_name:       "Marco Reyes, REB",
    photos: [
      "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Recreation", name: "Kayangan Lake",                             distance: "15 min boat" },
      { category: "Recreation", name: "Twin Lagoon",                               distance: "10 min boat" },
      { category: "Transit",    name: "Coron Town Pier",                           distance: "20 min boat" },
      { category: "Essentials", name: "Coron Public Market",                       distance: "25 min boat" },
    ],
    bestForTags: ["Island Resort", "Eco-Tourism", "Overwater"],
    accommodations:    "8 Luxury Suites",
    hosting_capacity:  "30 Guests",
  },
  "bohol-treehouse-lodge": {
    title:             "Bohol Treehouse Lodge",
    location:          "Panglao Island, Bohol",
    lat:               9.5672,
    lng:               123.7712,
    hook:              "Elevated jungle canopy lodge overlooking untouched rainforest and the Chocolate Hills.",
    city:              "Panglao",
    property_type:     "Eco-Lodge",
    spaceCategory:     "Hospitality",
    tenure:            "For Sale",
    year_built:        "2022",
    furnishing:        "Fully Fitted",
    beds:              6,
    baths:             6,
    floor_sqm:         600,
    lot_sqm:           5000,
    parking:           8,
    floors:            "Elevated Treehouse (3-4m platform)",
    comfort_level:     9.2,
    natural_light:     9.5,
    privacy:           9.8,
    space_feel:        9.7,
    noise_level_text:         "Pure jungle silence — wildlife ambience only",
    ventilation:              "Completely open-air, natural forest canopy shade",
    ceiling_height_text:      "5.0 meters (canopy height)",
    outdoor_description:      "Suspension bridge walkways, jungle hammock terraces",
    street_type:               "Forest access road (4WD recommended)",
    lifestyle_vibe:           "Wild Luxury Immersion",
    best_for:                 "Eco-Tourism Operators · Wellness Retreat Investors · Nature Architects",
    flood_risk_score:  1,
    convenience_score: 6.5,
    title_status:      "TCT — Free & Clear",
    scoutit_verdict:   "Rare Eco-Hospitality Asset — S-Class Leisure Grade",
    accordion_1_title: "Jungle Canopy Access",
    accordion_1_rating:"One-of-a-Kind",
    accordion_2_title: "Eco Certification",
    accordion_2_rating:"DENR Compliant",
    accordion_3_title: "Architectural Intent",
    accordion_3_rating:"Awarded",
    accordion_3_text:  "Designed by a Cebu-based biomimicry studio, each treehouse unit uses engineered bamboo columns, reclaimed molave hardwood platforms, and solar micro-grid electricity.",
    broker_name:       "Marco Reyes, REB",
    photos: [
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Recreation", name: "Alona Beach Panglao",                       distance: "15 min drive" },
      { category: "Recreation", name: "Chocolate Hills Complex",                    distance: "60 min drive" },
      { category: "Transit",    name: "Tagbilaran Airport",                         distance: "35 min drive" },
      { category: "Essentials", name: "Panglao Town Market",                        distance: "20 min drive" },
    ],
    bestForTags: ["Eco-Lodge", "Jungle Canopy", "Wellness"],
    accommodations:    "6 Treehouse Suites",
    hosting_capacity:  "18 Guests",
  },
  "solaire-grand-ballroom": {
    title:             "Solaire Grand Ballroom",
    location:          "Entertainment City, Parañaque",
    lat:               14.5222,
    lng:               120.9782,
    hook:              "Crystal-lit luxury ballroom within Manila's premier integrated resort complex.",
    city:              "Parañaque",
    property_type:     "Luxury Ballroom",
    spaceCategory:     "Venues",
    tenure:            "For Lease",
    year_built:        "2013",
    furnishing:        "Fully Fitted",
    beds:              0,
    baths:             12,
    floor_sqm:         2400,
    lot_sqm:           4000,
    parking:           500,
    floors:            "Ground Level (Integrated Resort)",
    comfort_level:     9.8,
    natural_light:     7.5,
    privacy:           9.2,
    space_feel:        9.9,
    noise_level_text:         "Fully acoustic-isolated from casino floor",
    ventilation:              "Precision HVAC with humidity control",
    ceiling_height_text:      "8.0 meters",
    outdoor_description:      "Adjacent palm-lined cocktail terrace with bay views",
    street_type:               "Entertainment City Boulevard",
    lifestyle_vibe:           "Grand Luxury Opulence",
    best_for:                 "Luxury Weddings · State Galas · Corporate Pinnacle Events",
    flood_risk_score:  2,
    convenience_score: 9.5,
    title_status:      "Long-Term Commercial Lease Available",
    scoutit_verdict:   "Philippines' Finest Ballroom — S-Class Venue Asset",
    accordion_1_title: "Grand Crystal Ceiling",
    accordion_1_rating:"Iconic",
    accordion_2_title: "Technical Rigging",
    accordion_2_rating:"World-Class",
    accordion_3_title: "Integrated Resort Access",
    accordion_3_rating:"Unmatched",
    accordion_3_text:  "Direct connectivity to 5-star hotel towers, casino floor, and fine dining restaurants ensures a seamless luxury event ecosystem for every guest.",
    broker_name:       "Elena Santos, REB",
    photos: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Transit",    name: "NAIA Terminal 1",                            distance: "8 min drive"  },
      { category: "Business",   name: "Aseana Business Park",                       distance: "5 min drive"  },
      { category: "Essentials", name: "SM Mall of Asia",                            distance: "10 min drive" },
    ],
    bestForTags: ["Grand Ballroom", "Luxury Events", "Integrated Resort"],
    seating_capacity:  "800 Banquet / 1,200 Cocktail",
    setup_grade:       "Crystal AAA / Full Rigging Ready",
  },
  "sky-pavilion-makati": {
    title:             "Sky Pavilion Makati",
    location:          "Ayala CBD, Makati",
    lat:               14.5555,
    lng:               121.0215,
    hook:              "Open-air rooftop pavilion with 270-degree Makati skyline panorama.",
    city:              "Makati",
    property_type:     "Rooftop Event Venue",
    spaceCategory:     "Venues",
    tenure:            "For Lease",
    year_built:        "2024",
    furnishing:        "Semi-Fitted",
    beds:              0,
    baths:             6,
    floor_sqm:         800,
    lot_sqm:           800,
    parking:           80,
    floors:            "Rooftop Level (38F)",
    comfort_level:     9.3,
    natural_light:     9.8,
    privacy:           8.8,
    space_feel:        9.6,
    noise_level_text:         "Open-air — city ambient sounds",
    ventilation:              "Natural rooftop breeze, retractable shade sails",
    ceiling_height_text:      "Open sky / 4.0 meter retractable glass canopy",
    outdoor_description:      "360-degree skyline terrace, infinity-edge pool view",
    street_type:               "Ayala Avenue Tower Lobby Access",
    lifestyle_vibe:           "Elevated Urban Prestige",
    best_for:                 "Product Launches · Rooftop Galas · Brand Activations",
    flood_risk_score:  0,
    convenience_score: 9.9,
    title_status:      "Annual Lease — Renewal Option",
    scoutit_verdict:   "Makati's Premier Sky Venue — AA Event Grade",
    accordion_1_title: "Panoramic Skyline",
    accordion_1_rating:"Exceptional",
    accordion_2_title: "Flexible Layouts",
    accordion_2_rating:"Modular",
    accordion_3_title: "Architectural Intent",
    accordion_3_rating:"Contemporary",
    accordion_3_text:  "Designed with a glass canopy system that retracts fully for open-air events or closes to provide climate-controlled comfort, offering maximum flexibility for any event format.",
    broker_name:       "Elena Santos, REB",
    photos: [
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    ],
    whereTo: [
      { category: "Business",   name: "Ayala Center Makati",                        distance: "2 min walk"  },
      { category: "Transit",    name: "Makati CBD Stations",                        distance: "3 min walk"  },
      { category: "Healthcare", name: "Makati Medical Center",                      distance: "5 min drive" },
    ],
    bestForTags: ["Rooftop", "Skyline Views", "Brand Events"],
    seating_capacity:  "200 Banquet / 350 Cocktail",
    setup_grade:       "Open-Air Premium / Retractable Canopy",
  }
};

export function getSPACE_STARS() {
  return SPACE_STARS;
}

export function getDISCOVERY_FEED() {
  return DISCOVERY_FEED;
}

export function getDISCOVER_HUBS() {
  return DISCOVER_HUBS;
}

export function getCATEGORY_PREVIEWS() {
  return CATEGORY_PREVIEWS;
}

// ═══════════════════════════════════════════════════════════════
// NEW CMS FIELDS (Chapter Redesign) — blank defaults applied to every
// property so empty-field suppression works uniformly. To surface any
// of these in the live CMS, add the matching Airtable column to
// PROPERTIES_CMS (Airtable name in the comment) and map it in
// src/lib/airtable.js → fetchProperties().
// ═══════════════════════════════════════════════════════════════
export const NEW_CMS_FIELD_DEFAULTS = {
  aesthetic_tag:          "", // AestheticTag
  flood_zone_status:      "", // FloodZoneStatus
  zoning_classification:  "", // ZoningClassification
  nearest_highway:        "", // NearestHighway
  commute_bgc:            "", // CommuteBGC
  commute_makati:         "", // CommuteMakati
  commute_ortigas:        "", // CommuteOrtigas
  public_transport:       "", // PublicTransport
  safety_perception:      "", // SafetyPerception
  community_feel:         "", // CommunityFeel
  expansion_potential:    "", // ExpansionPotential
  zoning_type:            "", // ZoningType
  developer_name:         "", // DeveloperName
  developer_notes:        "", // DeveloperNotes
  structural_notes:       "", // StructuralNotes
  architect_designer:     "", // ArchitectDesigner
  building_style:         "", // BuildingStyle
  universe_summary:       "", // UniverseSummary
  // Ch.10 — only render a price when an authorized party has provided one.
  // "N/A" or "" both suppress the price section.
  listed_price:           "", // Listed_Price  (e.g. "₱8,500,000" or "N/A")
  price_source:           "", // Price_Source  (e.g. "Owner", "Authorized Broker", "Property Manager")
  price_notes:            "", // Price_Notes   (free-text context)
};

export function getProperties(category = null) {
  if (!category) {
    return Object.keys(PROPERTIES_DETAILS).map(slug => ({
      slug,
      ...NEW_CMS_FIELD_DEFAULTS,
      ...PROPERTIES_DETAILS[slug]
    }));
  }
  const cleanCat = category.toLowerCase();
  // Filter details list by city or style if needed, or by matching slug lists
  return Object.keys(PROPERTIES_DETAILS)
    .filter(slug => PROPERTIES_DETAILS[slug].city.toLowerCase().includes(cleanCat) || PROPERTIES_DETAILS[slug].property_type.toLowerCase().includes(cleanCat))
    .map(slug => ({
      slug,
      ...NEW_CMS_FIELD_DEFAULTS,
      ...PROPERTIES_DETAILS[slug]
    }));
}

export function getPropertyBySlug(slug) {
  const normSlug = slug ? slug.toLowerCase().trim() : "";
  const entry = PROPERTIES_DETAILS[normSlug];
  if (entry) return { ...NEW_CMS_FIELD_DEFAULTS, ...entry };
  
  // Return a generic fallback if slug is not matched
  return {
    title:             "ScoutIt Premier Showcase Space",
    location:          "Metro Manila Sector Hub",
    hook:              "Vetted architectural project detail under secondary analysis.",
    city:              "Metro Manila",
    property_type:     "Luxury Showroom",
    tenure:            "For Sale",
    year_built:        "2022",
    furnishing:        "Fitted",
    beds:              3,
    baths:             3,
    floor_sqm:         150,
    lot_sqm:           150,
    parking:           2,
    floors:            "Single Level",
    comfort_level:     8.5,
    natural_light:     8.5,
    privacy:           8.5,
    space_feel:        8.5,
    noise_level_text:         "Low",
    ventilation:              "Climate-controlled HVAC",
    ceiling_height_text:      "3.0 meters",
    outdoor_description:      "Shared green courtyard access",
    street_type:              "Sub-arterial CBD road",
    lifestyle_vibe:           "Modernist & Urban",
    best_for:                 "Professionals · Investors",
    flood_risk_score:  1,
    convenience_score: 8.5,
    title_status:      "TCT Title — Vetted",
    scoutit_verdict:   "Recommended Showcase Asset",
    accordion_1_title: "Home Feel & Comfort",
    accordion_1_rating:"High",
    accordion_2_title: "Space Usability",
    accordion_2_rating:"Efficient",
    accordion_3_title: "Story of This Space",
    accordion_3_rating:"",
    accordion_3_text:  "A dynamic luxury catalog listing representing premium design aesthetics across primary sectors.",
    broker_name:       "Miguel Torres, REB",
    photos: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ],
    whereTo: [
      { category: "Transit", name: "CBD Bus Terminus", distance: "5 min walk" }
    ],
    bestForTags: ["High Yield", "Fitted Design"]
  };
}

export const locations = [
  "Quezon City",
  "Bonifacio Global City",
  "Makati",
  "Siargao",
  "Boracay",
  "El Nido",
  "Coron",
  "Panglao",
  "Tagaytay Ridge",
  "Parañaque"
];
