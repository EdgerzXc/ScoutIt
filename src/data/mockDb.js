// Centralized Mock Database for ScoutIt Space Intelligence
// This file serves as the local database fallback. 
// Swap this file's functions with live CMS API calls (e.g. Airtable) to transition.

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
        title: "Aurelia Residences",
        location: "BGC Core",
        style: "Modern Tropical",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
        desc: "Low density luxury high-rise featuring double-glazed glass wrap and custom bronze details."
      },
      {
        title: "The Estate Makati",
        location: "Makati Central",
        style: "Brutalist Luxury",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80",
        desc: "Designed by Foster + Partners. Cruciform structure maximizing floor plate efficiency and natural daylight."
      }
    ],
    news: [
      { slug: "bgc-spatial-movement", title: "BGC Spatial Movement", date: "June 2026", excerpt: "A rise in demand for low-density residences drives modernist villa acquisitions." },
      { slug: "return-of-quiet-luxury", title: "The Return of Quiet Luxury", date: "May 2026", excerpt: "Local buyers favor hidden properties in Quezon City over flashy estates." }
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
        title: "Zuellig Building",
        location: "Makati CBD",
        style: "Sustainable Glass",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
        desc: "LEED Platinum certified skyscraper utilizing low-emissivity glass and rain harvesting systems."
      },
      {
        title: "Arthaland Century Pacific",
        location: "BGC North",
        style: "Eco-Corporate",
        image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=400&q=80",
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
        title: "Siargao Tropical Villa",
        location: "Cloud 9",
        style: "Island Minimalist",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80",
        desc: "Open-plan coco-wood pavilion with high-pitched thatch roofs and private sea pools."
      },
      {
        title: "Palawan Eco-Retreat",
        location: "El Nido Lio",
        style: "Native Modern",
        image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&q=80",
        desc: "Solar-powered beachfront cabins utilizing locally-sourced bamboo and reclaimed teak structures."
      }
    ],
    news: [
      { slug: "surf-front-land-rush", title: "Surf-Front Land Rush", date: "June 2026", excerpt: "Boutique developers scramble to acquire land along General Luna's extended coast." },
      { slug: "off-grid-island-living", title: "Off-Grid Island Living", date: "May 2026", excerpt: "Palawan resort developers transition fully to solar microgrids and composting systems." }
    ],
    collections: [
      "Coastal Surf Retreats",
      "Off-Grid Bamboo Pavilions",
      "Luxury Glamping Tents"
    ]
  },
  Restaurants: {
    spotlights: [
      {
        title: "Gallery by Chele",
        location: "BGC Central",
        style: "Wood & Steel",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
        desc: "Industrial minimalist space with warm natural wood overlays and dramatic mood lighting."
      },
      {
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
  }
};

export const DISCOVER_HUBS = {
  Residential: ["BGC Alpha", "Makati Core", "Arca South", "Nuvali Estate", "Forbes Park"],
  Commercial: ["Makati CBD", "Ortigas Center", "BGC North", "Alabang CBD", "Bay Area"],
  STR: ["Siargao Cloud 9", "El Nido Lio", "Boracay Station 1", "Panglao Island", "Coron Town"],
  Restaurants: ["BGC High Street", "Salcedo Village", "Tagaytay Ridge", "Poblacion", "Tomas Morato"]
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
      image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=800&q=80",
      tags: ["Aesthetic: Eco-Corporate", "Zoning: Mixed-Use", "Location: BGC North"],
    }
  ],
  STR: [
    {
      id: "siargao-tropical-villa",
      title: "Siargao Tropical Villa",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      tags: ["Aesthetic: Island Minimalist", "Yield: High Velocity", "Location: Cloud 9"],
    },
    {
      id: "palawan-eco-retreat",
      title: "Palawan Eco-Retreat",
      image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
      tags: ["Aesthetic: Native Modern", "Yield: Seasonal Peak", "Location: El Nido"],
    }
  ],
  Restaurants: [
    {
      id: "gallery-by-chele",
      title: "Gallery by Chele",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      tags: ["Aesthetic: Wood & Steel", "Capacity: Intimate", "Location: BGC Central"],
    },
    {
      id: "antonios-tagaytay",
      title: "Antonio's Tagaytay",
      image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
      tags: ["Aesthetic: Heritage Colonial", "Capacity: Estate", "Location: Tagaytay Ridge"],
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
    }
  ],
  STR: [
    {
      id: "pacific-edge-villa",
      title: "Pacific Edge Villa",
      city: "Siargao",
      location: "Siargao",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      density: "Beachfront · 250 sqm"
    },
    {
      id: "siargao-tropical-villa",
      title: "Siargao Tropical Villa",
      city: "Siargao",
      location: "Cloud 9, Siargao",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      density: "Surf Beachfront · 150 sqm"
    }
  ],
  Restaurants: [
    {
      id: "gallery-by-chele",
      title: "Gallery by Chele",
      city: "Bonifacio Global City",
      location: "Bonifacio Global City",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      density: "Intimate Layout · 250 sqm"
    },
    {
      id: "antonios-tagaytay",
      title: "Antonio's Tagaytay",
      city: "Tagaytay Ridge",
      location: "Tagaytay Ridge",
      image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
      density: "Heritage Colonial · 800 sqm"
    }
  ]
};

export const DISCOVER_INTEL = {
  Residential: [
    { id: "n1", slug: "bgc-condo-yields-rise", category: "NEWS", date: "Q3 2026", title: "BGC Condo Yields Rise", snippet: "Premium residential spaces see 4.2% YoY growth." },
    { id: "n2", slug: "makati-central-resurgence", category: "INSIGHT", date: "Q3 2026", title: "Makati Central Resurgence", snippet: "Older luxury buildings undergoing massive renovations." },
    { id: "n3", slug: "mastering-qc-market", category: "BLOG", date: "Q3 2026", title: "Mastering the QC Market", snippet: "What to look for in QC subdivision residences." }
  ],
  Commercial: [
    { id: "n4", slug: "new-bpo-headquarters", category: "NEWS", date: "Q3 2026", title: "New BPO Headquarters", snippet: "Global tech firms securing massive floor plates." },
    { id: "n5", slug: "high-street-expansion", category: "INSIGHT", date: "Q3 2026", title: "High Street Expansion", snippet: "Retail spaces are fully occupied for the next 24 months." },
    { id: "n6", slug: "bgc-commercial-outlook", category: "BLOG", date: "Q3 2026", title: "BGC Commercial Outlook", snippet: "Corporate spatial requirements shifting to flexible hubs." }
  ],
  STR: [
    { id: "n7", slug: "siargao-villa-boom", category: "NEWS", date: "Q3 2026", title: "Siargao Villa Boom", snippet: "Short term rentals operating at 95% occupancy." },
    { id: "n8", slug: "palawan-eco-resorts", category: "INSIGHT", date: "Q3 2026", title: "Palawan Eco-resorts", snippet: "Sustainable tourism driving massive development." },
    { id: "n9", slug: "str-management-strategies", category: "BLOG", date: "Q3 2026", title: "STR Management Strategies", snippet: "Optimizing yields on seasonal beach properties." }
  ],
  Restaurants: [
    { id: "n10", slug: "michelin-guide-entry", category: "NEWS", date: "Q3 2026", title: "Michelin Guide Entry", snippet: "High-end dining spaces are highly contested." },
    { id: "n11", slug: "ridge-dining-surge", category: "INSIGHT", date: "Q3 2026", title: "Ridge Dining Surge", snippet: "Al fresco estate dining commands premium rates." },
    { id: "n12", slug: "restaurant-space-layouts", category: "BLOG", date: "Q3 2026", title: "Restaurant Space Layouts", snippet: "How spatial density affects kitchen efficiency." }
  ]
};

export const DUMMY_BROKERS = [
  {
    id: "br-01",
    name: "Miguel Torres, REB",
    title: "Principal Strategist",
    specialty: "Ultra-Luxury Residential",
    location: "BGC Focus",
    bio: "With over a decade of experience in BGC and the greater Manila market, Miguel specializes in industrial-modern residential estates and adaptive reuse projects.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
    closures: "3 Verified Closures // BGC Focus",
    clearanceTier: "Tier 1 - Alpha",
    metrics: [
      { label: "Roster Rank", value: "Principal" },
      { label: "Clearance", value: "Tier 1" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "batasan-hills", title: "Batasan Hills House & Lot", category: "Residential", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80" },
      { slug: "aurelia-residences", title: "Aurelia Residences Penthouse", category: "Residential", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "br-02",
    name: "Elena Santos, REB",
    title: "Global Capital Manager",
    specialty: "Grade A Office Spaces",
    location: "Makati Core",
    bio: "Elena provides structural insights for institutional clients, guiding commercial acquisitions and corporate relocations.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
    closures: "2 Verified Closures // QC Residential",
    clearanceTier: "Tier 2 - Omega",
    metrics: [
      { label: "Roster Rank", value: "Manager" },
      { label: "Clearance", value: "Tier 2" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "zuellig-building", title: "Zuellig Commercial Tower", category: "Commercial", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" },
      { slug: "arthaland-century-pacific", title: "Arthaland Century Plaza", category: "Commercial", image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "br-03",
    name: "Marco Reyes, REB",
    title: "Lead Arbitrage Analyst",
    specialty: "STR & Resort Properties",
    location: "STR Sector",
    bio: "Marco connects visionary operators with prime coastal assets and hospitality opportunities across the archipelago, specializing in modern tropical STR architecture.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
    closures: "4 Verified Closures // STR Sector",
    clearanceTier: "Tier 1 - Alpha",
    metrics: [
      { label: "Roster Rank", value: "Lead Analyst" },
      { label: "Clearance", value: "Tier 1" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "siargao-tropical-villa", title: "Siargao Tropical Villa", category: "STR / Resort", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80" },
      { slug: "palawan-eco-retreat", title: "Palawan Eco-Retreat", category: "STR / Resort", image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "br-04",
    name: "Julian Sy",
    title: "Industrial & Logistics Advisor",
    specialty: "Warehousing & Supply Chain",
    location: "Laguna Focus",
    bio: "Focusing on the expanding industrial corridors south of Manila, Julian engineers strategic acquisitions for logistics hubs.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    closures: "2 Verified Closures // Laguna & Batangas",
    clearanceTier: "Tier 3 - Beta",
    metrics: [
      { label: "Roster Rank", value: "Specialist" },
      { label: "Clearance", value: "Tier 3" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: []
  },
  {
    id: "br-05",
    name: "Camille Laurel",
    title: "Architectural Asset Advisor",
    specialty: "Heritage & Conservation",
    location: "Quezon City Focus",
    bio: "An advocate for adaptive reuse, Camille brokers the transfer and restoration of culturally significant structures.",
    image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=800&q=80",
    closures: "1 Verified Closure // Quezon City",
    clearanceTier: "Tier 2 - Omega",
    metrics: [
      { label: "Roster Rank", value: "Advisor" },
      { label: "Clearance", value: "Tier 2" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: []
  },
  {
    id: "br-06",
    name: "Sofia Araneta",
    title: "Boutique Hospitality Specialist",
    specialty: "Culinary Estates",
    location: "Tagaytay Focus",
    bio: "Sofia identifies pre-development opportunities in rising economic zones, advising private equity on long-term holds.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80",
    closures: "2 Verified Closures // Tagaytay & South",
    clearanceTier: "Tier 3 - Beta",
    metrics: [
      { label: "Roster Rank", value: "Specialist" },
      { label: "Clearance", value: "Tier 3" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "antonios-tagaytay", title: "Antonio's Tagaytay Estate", category: "Restaurants", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&q=80" }
    ]
  }
];

export const ARTICLES = [
  {
    slug: "bgc-spatial-movement",
    title: "BGC Spatial Movement",
    category: "Residential",
    date: "June 2026",
    excerpt: "A rise in demand for low-density residences drives modernist villa acquisitions across Bonifacio Global City core.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
  },
  {
    slug: "return-of-quiet-luxury",
    title: "The Return of Quiet Luxury",
    category: "Residential",
    date: "May 2026",
    excerpt: "Local high-net-worth buyers increasingly favor hidden properties in Quezon City over flashy, visible estates.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
  },
  {
    slug: "green-office-demand",
    title: "Green Office Demand",
    category: "Commercial",
    date: "June 2026",
    excerpt: "Global firms in Manila mandate LEED-certified workspaces, shaping future skyscraper architectural footprints.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
  },
  {
    slug: "bgc-commercial-corridors",
    title: "BGC Commercial Corridors",
    category: "Commercial",
    date: "April 2026",
    excerpt: "Retail podiums and commercial corridors evolve to incorporate open-air sky parks and wellness zones.",
    image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=800&q=80"
  },
  {
    slug: "surf-front-land-rush",
    title: "Surf-Front Land Rush",
    category: "Hospitality",
    date: "June 2026",
    excerpt: "Boutique island developers scramble to acquire coastal land along General Luna's extended surf breaks.",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"
  },
  {
    slug: "off-grid-island-living",
    title: "Off-Grid Island Living",
    category: "Hospitality",
    date: "May 2026",
    excerpt: "Resort developers in Palawan shift fully to off-grid solar microgrids, green water treatment, and teak designs.",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80"
  },
  {
    slug: "poblacion-food-architecture",
    title: "Poblacion Food Architecture",
    category: "Culinary",
    date: "June 2026",
    excerpt: "Industrial modernist overlays reshape abandoned residential warehouses into multi-concept culinary destinations.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
  },
  {
    slug: "design-first-ridge-dining",
    title: "Design-First Ridge Dining",
    category: "Culinary",
    date: "May 2026",
    excerpt: "Tagaytay culinary spaces design glass-enclosed structures that maximize views of the Taal Volcano ridge.",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80"
  },
  {
    slug: "bgc-condo-yields-rise",
    title: "BGC Condo Yields Rise",
    category: "Residential",
    date: "Q3 2026",
    excerpt: "Premium residential spaces see 4.2% YoY growth.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
  },
  {
    slug: "makati-central-resurgence",
    title: "Makati Central Resurgence",
    category: "Residential",
    date: "Q3 2026",
    excerpt: "Older luxury buildings undergoing massive renovations.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
  },
  {
    slug: "mastering-qc-market",
    title: "Mastering the QC Market",
    category: "Residential",
    date: "Q3 2026",
    excerpt: "What to look for in QC subdivision residences.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
  },
  {
    slug: "new-bpo-headquarters",
    title: "New BPO Headquarters",
    category: "Commercial",
    date: "Q3 2026",
    excerpt: "Global tech firms securing massive floor plates.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
  },
  {
    slug: "high-street-expansion",
    title: "High Street Expansion",
    category: "Commercial",
    date: "Q3 2026",
    excerpt: "Retail spaces are fully occupied for the next 24 months.",
    image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=800&q=80"
  },
  {
    slug: "bgc-commercial-outlook",
    title: "BGC Commercial Outlook",
    category: "Commercial",
    date: "Q3 2026",
    excerpt: "Corporate spatial requirements shifting to flexible hubs.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
  },
  {
    slug: "siargao-villa-boom",
    title: "Siargao Villa Boom",
    category: "Hospitality",
    date: "Q3 2026",
    excerpt: "Short term rentals operating at 95% occupancy.",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"
  },
  {
    slug: "palawan-eco-resorts",
    title: "Palawan Eco-resorts",
    category: "Hospitality",
    date: "Q3 2026",
    excerpt: "Sustainable tourism driving massive development.",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80"
  },
  {
    slug: "str-management-strategies",
    title: "STR Management Strategies",
    category: "Hospitality",
    date: "Q3 2026",
    excerpt: "Optimizing yields on seasonal beach properties.",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80"
  },
  {
    slug: "michelin-guide-entry",
    title: "Michelin Guide Entry",
    category: "Culinary",
    date: "Q3 2026",
    excerpt: "High-end dining spaces are highly contested.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
  },
  {
    slug: "ridge-dining-surge",
    title: "Ridge Dining Surge",
    category: "Culinary",
    date: "Q3 2026",
    excerpt: "Al fresco estate dining commands premium rates.",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80"
  },
  {
    slug: "restaurant-space-layouts",
    title: "Restaurant Space Layouts",
    category: "Culinary",
    date: "Q3 2026",
    excerpt: "How spatial density affects kitchen efficiency.",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80"
  }
];

export const ARTICLE_DB = {
  "bgc-spatial-movement": {
    title: "BGC Spatial Movement",
    category: "Residential",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
    lead: "Bonifacio Global City's central core is witnessing a rapid structural migration. High-net-worth capital is shifting away from dense skyscrapers toward boutique, low-density modernist villas.",
    body: [
      "As structural requirements for urban living undergo a dramatic realignment, BGC's premier residential sectors are experiencing unprecedented demand. Modern tropical designs, characterized by double-glazed glass enclosures, natural cross-ventilation, and private pocket gardens, have emerged as the absolute standard for low-density luxury.",
      "Voters of private capital are increasingly targeting low-rise properties that offer acoustic isolation and spatial control. This migration is not merely a lifestyle adjustment; it is a long-term capital placement strategy focused on assets that retain value through architectural distinction and location-based density limits.",
      "According to ScoutIt transaction registries, the average listing-to-contract duration for properties featuring private spatial buffers has compressed by over 40% in the last quarter, signaling an urgent, highly concentrated acquisition wave."
    ],
    recommendation: "Target properties in BGC Core that offer private outdoor space, cross-ventilation designs, and low-density layouts (e.g., fewer than 4 units per floor plate)."
  },
  "return-of-quiet-luxury": {
    title: "The Return of Quiet Luxury",
    category: "Residential",
    date: "May 2026",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
    lead: "A quiet, highly private revolution is reshaping Quezon City's elite residential market. Flashy suburban estates are being bypassed in favor of architecturally hidden residences.",
    body: [
      "In Quezon City's traditional luxury pockets, developers are responding to a subtle yet powerful demand shift. Buyers are no longer interested in massive, visible facades. Instead, they seek 'invisible luxury'—structures that blend seamlessly with their natural surroundings, offering complete privacy from the street while presenting spectacular spatial volume internally.",
      "These properties prioritize high-quality raw materials—reclaimed hardwoods, exposed structural concrete, and matte bronze fixtures—over ornate decorations. The focus is on natural light manipulation, double-height ceilings, and interior courtyards that serve as private sanctuaries.",
      "ScoutIt market analysts track a growing roster of transactions executed entirely off-market, highlighting the premium placed on absolute privacy and discretion in this sector."
    ],
    recommendation: "Prioritize New Manila and Batasan Hills off-market curations that feature high perimeter wall integration and inward-facing courtyard architecture."
  },
  "green-office-demand": {
    title: "Green Office Demand",
    category: "Commercial",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    lead: "Global multinational corporations are forcing a design evolution in Manila's business districts. Non-compliant commercial properties are experiencing rapid capital flight.",
    body: [
      "Tenant mandates have shifted permanently toward carbon-neutral, LEED-certified environments. Major international conglomerates operating in Makati and BGC now enforce strict green requirements for all future leases, leaving traditional high-rise buildings with rising vacancies.",
      "Developers are scrambling to retrofit older glass structures with low-emissivity glazing, smart energy grids, and water reclamation systems. New developments, however, are building eco-corporate DNA directly into their layout, using double-skin facades that reduce air conditioning reliance and rain harvesting systems that power entire cooling towers.",
      "ScoutIt research reveals premium grade-A properties that hold LEED Platinum credentials are capturing rental premiums of up to 25% over non-certified assets in the same district, proving sustainability is now directly tied to investment yield."
    ],
    recommendation: "Acquire or lease office spaces that hold at least LEED Gold certifications and verify local utility integration (e.g. graywater recycling pipelines)."
  },
  "bgc-commercial-corridors": {
    title: "BGC Commercial Corridors",
    category: "Commercial",
    date: "April 2026",
    image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=1200&q=80",
    lead: "High-density retail environments are giving way to open-air sky parks. The evolution of BGC's commercial plazas points toward integrated, design-first urban gardens.",
    body: [
      "Traditional commercial layouts are being remodeled to meet a consumer demand for wellness and space. Plazas and high-density shopping structures are integrating massive, glass-domed green zones, open-air pedestrian avenues, and micro-climate gardens that actively cool the surroundings.",
      "This shift is changing how commercial properties are valued. Ground-floor frontage, once the absolute standard for premium rents, is now sharing value with upper-level 'garden zones' that host premier culinary and social spaces in open-air settings.",
      "Transaction structures for commercial space are reflecting this design change, with brands prioritizing layouts that offer outdoor seating, natural ventilation, and direct green-corridor connectivity."
    ],
    recommendation: "Prioritize acquisitions in mixed-use commercial developments that feature rooftop green integration and a ratio of at least 20% dedicated green open space."
  },
  "surf-front-land-rush": {
    title: "Surf-Front Land Rush",
    category: "Hospitality",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
    lead: "Siargao's rapid economic expansion is pushing boutique resort developers further down the coast. The search for raw coastal frontage is entering a critical phase.",
    body: [
      "The global focus on Siargao has created an active land grab along the General Luna coastline. With prime Cloud 9 spots fully saturated, boutique operators and international hospitality brands are acquiring land in neighboring towns, bringing island minimalist design principles with them.",
      "The architectural standard in these new sectors focuses heavily on native materials integrated with modern engineering. Coco-wood framing, high-pitched thatch roofs designed for heavy tropical rainfall, and polished concrete floor plates are the visual markers of these high-yield retreats.",
      "ScoutIt land records show land valuation along the extended northern coast has appreciated by over 80% year-on-year, driven by buyers seeking boutique resort layouts."
    ],
    recommendation: "Target parcels located within 10 minutes of the new surf breaks that feature natural sand dune protection and secure access corridors."
  },
  "off-grid-island-living": {
    title: "Off-Grid Island Living",
    category: "Hospitality",
    date: "May 2026",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80",
    lead: "Palawan's remote eco-resorts are setting the global standard for luxury off-grid infrastructure, combining raw bamboo builds with advanced solar microgrids.",
    body: [
      "As environmental regulations tighten, Palawan developers are abandoning traditional grid connections entirely. Ultra-luxury resorts are designing structures that are 100% self-sustaining, utilizing solar microgrids, advanced battery storage, and localized composting water treatment facilities.",
      "Architecturally, this requires a deep respect for local geography. Buildings are raised on structural stilts to preserve coastal ecosystems, using reclaimed teak and structurally treated bamboo that naturally flexes during weather events.",
      "This off-grid luxury model is capturing high-velocity yields as global travelers seek locations that offer premium comforts alongside a zero-footprint environment."
    ],
    recommendation: "Ensure any island acquisition has a certified independent fresh-water source and a solar installation footprint that supports peak cooling loads."
  },
  "poblacion-food-architecture": {
    title: "Poblacion Food Architecture",
    category: "Culinary",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
    lead: "Makati's creative culinary scene is breathing new life into old structures. Industrial-minimalist designs are converting abandoned warehouses into premier dining spots.",
    body: [
      "Poblacion's architectural landscape is evolving from residential grids to experimental culinary architecture. Old warehouse frames and low-rise apartments are being preserved externally while their interiors are completely gutted to reveal steel trusses, raw brick, and high ceilings.",
      "These industrial spaces host multi-concept culinary dining halls and micro-roasteries. The design highlights raw textures—exposed iron beams, concrete counters, and warm mood lighting—creating a distinct architectural vibe that appeals to Manila's design-conscious diners.",
      "The rent-per-square-meter metric in these repurposed spaces has risen sharply, reflecting the premium value created by design-first renovations."
    ],
    recommendation: "Evaluate properties with high structural ceiling clearance (4m+) that permit mezzanine integration and feature structural load-bearing steel."
  },
  "design-first-ridge-dining": {
    title: "Design-First Ridge Dining",
    category: "Culinary",
    date: "May 2026",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&q=80",
    lead: "Tagaytay's famous ridge is undergoing a glass-enclosed architectural evolution, framing the Taal Lake panorama within minimalist structures.",
    body: [
      "Tagaytay Ridge dining is no longer about simple rustic viewing decks. Architects are deploying cantilevered glass pavilions and modernist steel-framed structures that extend over the ridge, offering uninterrupted, cinematic views of Taal Volcano.",
      "These spaces integrate indoor dining with natural cliff-side flora, using retractable glass walls that allow mountain breezes to circulate during cooler months. The lighting design is kept highly subtle to ensure the natural nighttime panorama remains the primary focus.",
      "This architectural evolution has positioned Tagaytay as a premium destination for design-driven culinary tourism, drawing high-income weekend crowds from the capital."
    ],
    recommendation: "Focus on cantilevered steel-framed structures that have completed verified geological soil checks along the Tagaytay ridge line."
  }
};

// Raw properties data dictionary used on details pages
export const PROPERTIES_DETAILS = {
  "batasan-hills": {
    title:             "Batasan Hills House & Lot",
    location:          "Batasan Hills, Quezon City",
    hook:              "Positioned within one of QC's fastest-evolving residential corridors.",
    city:              "Quezon City",
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
    hook:              "Low density luxury high-rise featuring double-glazed glass wrap.",
    city:              "Bonifacio Global City",
    property_type:     "Penthouse Condo",
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
    hook:              "Cruciform structure designed by Foster + Partners to maximize natural daylight.",
    city:              "Makati Central",
    property_type:     "Premium Condominium",
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
    hook:              "Open-plan coco-wood pavilion with high-pitched thatch roofs.",
    city:              "Siargao",
    property_type:     "Beachfront Villa",
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
  },
  "palawan-eco-retreat": {
    title:             "Palawan Eco-Retreat Lodge",
    location:          "El Nido Lio, Palawan",
    hook:              "Solar-powered beachfront cabins utilizing locally-sourced bamboo and reclaimed teak.",
    city:              "El Nido",
    property_type:     "Eco Resort / Cabins",
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
  },
  "gallery-by-chele": {
    title:             "Gallery by Chele Space",
    location:          "BGC Central, Bonifacio Global City",
    hook:              "Industrial minimalist space with warm natural wood overlays.",
    city:              "Bonifacio Global City",
    property_type:     "Commercial / Restaurant",
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
  },
  "antonios-tagaytay": {
    title:             "Antonio's Tagaytay Heritage Estate",
    location:          "Tagaytay Ridge, Cavite",
    hook:              "Grand colonial estate dining hall with black-and-white tiles.",
    city:              "Tagaytay Ridge",
    property_type:     "Heritage Commercial / Land",
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
  }
};

// Client and server side helper utility functions for fetching data
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

export function getProperties(category = null) {
  if (!category) {
    return Object.keys(PROPERTIES_DETAILS).map(slug => ({
      slug,
      ...PROPERTIES_DETAILS[slug]
    }));
  }
  const cleanCat = category.toLowerCase();
  // Filter details list by city or style if needed, or by matching slug lists
  return Object.keys(PROPERTIES_DETAILS)
    .filter(slug => PROPERTIES_DETAILS[slug].city.toLowerCase().includes(cleanCat) || PROPERTIES_DETAILS[slug].property_type.toLowerCase().includes(cleanCat))
    .map(slug => ({
      slug,
      ...PROPERTIES_DETAILS[slug]
    }));
}

export function getPropertyBySlug(slug) {
  const normSlug = slug ? slug.toLowerCase().trim() : "";
  const entry = PROPERTIES_DETAILS[normSlug];
  if (entry) return entry;
  
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

export function getBrokers() {
  return DUMMY_BROKERS;
}

export function getBrokerById(id) {
  return DUMMY_BROKERS.find(b => b.id === id) || null;
}

export function getArticles(category = "All") {
  if (category === "All") {
    return ARTICLES;
  }
  return ARTICLES.filter(art => art.category.toLowerCase() === category.toLowerCase() || art.category === category);
}

export function getArticleBySlug(slug) {
  const details = ARTICLE_DB[slug];
  if (details) return details;
  
  // Try to find raw metadata
  const meta = ARTICLES.find(a => a.slug === slug);
  if (meta) {
    return {
      title: meta.title,
      category: meta.category,
      date: meta.date,
      image: meta.image,
      lead: meta.excerpt,
      body: ["Details for this editorial briefing are loaded dynamically. Contact your Space Intelligence advisor for details."],
      recommendation: "Request full catalog briefing via advisory network."
    };
  }
  return null;
}
