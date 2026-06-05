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
  },
  Venues: {
    spotlights: [
      {
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
      image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=800&q=80",
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
    { id: "n7", slug: "siargao-villa-boom", category: "NEWS", date: "Q3 2026", title: "Siargao Villa Boom", snippet: "Short term rentals operating at 95% occupancy across General Luna." },
    { id: "n9", slug: "str-management-strategies", category: "BLOG", date: "Q3 2026", title: "STR Management Strategies", snippet: "Optimizing yields on seasonal beach properties through dynamic pricing." },
    { id: "n14", slug: "surf-front-land-rush", category: "INSIGHT", date: "Q3 2026", title: "Surf-Front Land Rush", snippet: "Boracay and Siargao developers compete for remaining coastal frontage." }
  ],
  Hospitality: [
    { id: "n8", slug: "palawan-eco-resorts", category: "INSIGHT", date: "Q3 2026", title: "Palawan Eco-resorts", snippet: "Sustainable tourism driving massive eco-lodge development in El Nido." },
    { id: "n15", slug: "off-grid-island-living", category: "BLOG", date: "Q3 2026", title: "Off-Grid Island Living", snippet: "Palawan resorts go fully solar — a new standard for island hospitality." },
    { id: "n16", slug: "coron-resort-surge", category: "NEWS", date: "Q3 2026", title: "Coron Resort Surge", snippet: "Overwater villas in Coron achieve highest ADR in the archipelago." }
  ],
  Restaurants: [
    { id: "n10", slug: "michelin-guide-entry", category: "NEWS", date: "Q3 2026", title: "Michelin Guide Entry", snippet: "High-end dining spaces in BGC and Makati are highly contested." },
    { id: "n11", slug: "ridge-dining-surge", category: "INSIGHT", date: "Q3 2026", title: "Ridge Dining Surge", snippet: "Al fresco estate dining commands premium Tagaytay rates." },
    { id: "n12", slug: "restaurant-space-layouts", category: "BLOG", date: "Q3 2026", title: "Restaurant Space Layouts", snippet: "How spatial density affects kitchen efficiency and chef performance." }
  ],
  Venues: [
    { id: "n13", slug: "manila-venue-trends", category: "NEWS", date: "Q3 2026", title: "Manila Venue Trends", snippet: "Premium corporate venues shift toward light-filled glass atrium spaces." },
    { id: "n17", slug: "rooftop-events-boom", category: "INSIGHT", date: "Q3 2026", title: "Rooftop Events Boom", snippet: "Skyline venues in Makati and BGC post record bookings for 2026 season." },
    { id: "n18", slug: "venue-tech-integration", category: "BLOG", date: "Q3 2026", title: "Venue Tech Integration", snippet: "Smart A/V systems and dynamic lighting transform the corporate event game." }
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
    rating: 84,
    license: "PRC REB License No. 0019284",
    subscriptionTier: 4,
    niche: ["Industrial Modern", "BGC Residential", "Asset Valuation"],
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
    rating: 76,
    license: "PRC REB License No. 0021485",
    subscriptionTier: 5,
    niche: ["QC Luxury Estates", "Family Homes", "Negotiation"],
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
    specialty: "Hospitality & Resort Properties",
    location: "Hospitality Sector",
    bio: "Marco connects visionary operators with prime coastal assets and hospitality opportunities across the archipelago, specializing in modern tropical hospitality architecture.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
    closures: "4 Verified Closures // Hospitality Sector",
    clearanceTier: "Tier 1 - Alpha",
    rating: 92,
    license: "PRC REB License No. 0011593",
    subscriptionTier: 2,
    niche: ["Hospitality", "Yield Optimization", "Siargao/BGC"],
    metrics: [
      { label: "Roster Rank", value: "Lead Analyst" },
      { label: "Clearance", value: "Tier 1" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "siargao-tropical-villa", title: "Siargao Tropical Villa", category: "Hospitality / Resort", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80" },
      { slug: "palawan-eco-retreat", title: "Palawan Eco-Retreat", category: "Hospitality / Resort", image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=400&q=80" }
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
    rating: 88,
    license: "PRC REB License No. 0014902",
    subscriptionTier: 5,
    niche: ["Logistics Hubs", "Industrial Land", "Supply Chain Planning"],
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
    rating: 90,
    license: "PRC REB License No. 0020184",
    subscriptionTier: 3,
    niche: ["Heritage Transfer", "Adaptive Reuse", "Conservation Consulting"],
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
    rating: 95,
    license: "PRC REB License No. 0016839",
    subscriptionTier: 1,
    niche: ["Boutique Hotels", "Culinary Acreage", "Private Equity Holds"],
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

export const DUMMY_PHOTOGRAPHERS = [
  {
    id: "ph-001",
    name: "Marco Reyes",
    location: "BGC, Taguig",
    title: "Architectural & Interior Photographer",
    specialty: "Interior Architecture",
    equipment: "Sony A7R V · Tilt-Shift 24mm · Profoto B10",
    style: "Clean, high-contrast natural light with minimal staging",
    rate: "Starting at ₱8,500 / session",
    shoots: "42 Space Shoots",
    bio: "Seven years documenting Metro Manila's most compelling interiors. Trusted by developers, architects, and private sellers who need photos that move properties.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80",
    tier: 1,
    license: "Licensed Architectural Photographer · BGC Guild",
    clearanceTier: "Tier 1 - Elite Creator",
    rating: 94,
    niche: ["Interior Design", "BGC Commercial", "Natural Light Focus"],
    metrics: [
      { label: "Roster Rank", value: "Principal Artist" },
      { label: "Clearance", value: "Tier 1" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "aurelia-residences", title: "Aurelia Residences Penthouse", category: "Residential", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80" },
      { slug: "gridwork-studio", title: "The Gridwork Studio", category: "Commercial", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "ph-002",
    name: "Alicia Tan",
    location: "Makati, Metro Manila",
    title: "Aerial & Lifestyle Property Photographer",
    specialty: "Drone Aerial + Lifestyle",
    equipment: "DJI Mavic 3 Pro · Canon R5 · Godox AD400 Pro",
    style: "Golden hour cinematic with wide environmental context",
    rate: "Starting at ₱12,000 / session",
    shoots: "61 Space Shoots",
    bio: "CAA-licensed drone operator and lifestyle photographer. Specializes in resort, STR, and luxury residential where the surrounding environment is part of the story.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&q=80",
    tier: 2,
    license: "CAA UAS Pilot License No. 0089281",
    clearanceTier: "Tier 2 - Alpha",
    rating: 91,
    niche: ["Resort Aerials", "STR Cinematic", "Lifestyle Property"],
    metrics: [
      { label: "Roster Rank", value: "Lead Pilot" },
      { label: "Clearance", value: "Tier 2" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "siargao-tropical-villa", title: "Siargao Tropical Villa", category: "STR", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80" },
      { slug: "palawan-eco-retreat", title: "Palawan Eco-Retreat", category: "Hospitality", image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "ph-003",
    name: "Daniel Flores",
    location: "Cebu City",
    title: "Commercial Space & Restaurant Photographer",
    specialty: "Commercial & F&B",
    equipment: "Nikon Z8 · 14–24mm f/2.8 · Elinchrom ELB 500",
    style: "Warm editorial tones, ambiance-forward with texture and depth",
    rate: "Starting at ₱6,000 / session",
    shoots: "28 Space Shoots",
    bio: "Cebu-based specialist in restaurants, cafés, and boutique commercial spaces. Delivers gallery-ready images within 48 hours.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    tier: 3,
    license: "Certified Commercial Photographer · Visayas Association",
    clearanceTier: "Tier 3 - Beta",
    rating: 88,
    niche: ["F&B Spaces", "Cafe Ambiance", "Visayas Regional"],
    metrics: [
      { label: "Roster Rank", value: "Commercial Specialist" },
      { label: "Clearance", value: "Tier 3" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "gallery-by-chele", title: "Gallery by Chele", category: "Restaurants", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80" },
      { slug: "antonios-tagaytay", title: "Antonio's Tagaytay Estate", category: "Restaurants", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&q=80" }
    ]
  }
];

export const DUMMY_RESEARCHERS = [
  {
    id: "sr-001",
    name: "Patricia Lim",
    location: "Metro Manila",
    title: "Senior Space Intelligence Researcher",
    focus: "Residential Due Diligence",
    markets: "BGC · Makati · Ortigas · Eastwood",
    turnaround: "5–7 Business Days",
    reports: "84 Reports Delivered",
    bio: "Former property appraiser with 9 years of field experience. Specializes in pre-purchase residential due diligence — title verification, structural assessment coordination, neighborhood pattern analysis, and comparable sales mapping.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
    tier: 1,
    deliverables: ["Title chain verification", "On-site structural walkthrough", "Neighborhood livability report", "Comparable sales within 500m", "Developer track record analysis"],
    license: "PRC Licensed Appraiser No. 0092184",
    clearanceTier: "Tier 1 - Lead Inspector",
    rating: 95,
    niche: ["Title Chain Verification", "Structural Coordination", "BGC Due Diligence"],
    metrics: [
      { label: "Roster Rank", value: "Senior Researcher" },
      { label: "Clearance", value: "Tier 1" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "batasan-hills", title: "Batasan Hills House & Lot", category: "Residential", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80" },
      { slug: "aurelia-residences", title: "Aurelia Residences Penthouse", category: "Residential", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "sr-002",
    name: "Kristoffer Navarro",
    location: "Cebu & Visayas",
    title: "Commercial & Investment Researcher",
    focus: "Commercial Investment Analysis",
    markets: "Cebu City · Lapu-Lapu · Mandaue · Dumaguete",
    turnaround: "7–10 Business Days",
    reports: "37 Reports Delivered",
    bio: "Commercial real estate analyst with background in urban planning. Focuses on ROI feasibility, zoning compliance, and foot traffic pattern studies for retail, office, and mixed-use acquisitions in the Visayas.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
    tier: 2,
    deliverables: ["Zoning & land use verification", "ROI feasibility worksheet", "Foot traffic data (3-month avg)", "Competing tenant analysis", "Infrastructure & utilities report"],
    license: "Licensed Urban Planner No. 0019283",
    clearanceTier: "Tier 2 - Alpha Analyst",
    rating: 89,
    niche: ["Zoning & Compliance", "Foot Traffic Studies", "Visayas Mixed-Use"],
    metrics: [
      { label: "Roster Rank", value: "Urban Planner" },
      { label: "Clearance", value: "Tier 2" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "zuellig-building", title: "Zuellig Commercial Tower", category: "Commercial", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" },
      { slug: "bohol-treehouse-lodge", title: "Bohol Treehouse Lodge", category: "Hospitality", image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "sr-003",
    name: "Sunshine Ramos",
    location: "Davao & Mindanao",
    title: "Hospitality & STR Researcher",
    focus: "Short-Term Rental & Hospitality",
    markets: "Davao City · Siargao · General Santos · Bukidnon",
    turnaround: "6–8 Business Days",
    reports: "21 Reports Delivered",
    bio: "Tourism industry background combined with STR market expertise. Delivers occupancy benchmarking, revenue potential estimates, and compliance checks for Airbnb, resort, and boutique hotel acquisitions in Mindanao.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80",
    tier: 3,
    deliverables: ["Occupancy rate benchmarking", "Revenue potential estimate", "Barangay permit & compliance check", "STR saturation analysis", "Tourism corridor outlook"],
    license: "Certified STR Yield Analyst · Davao Guild",
    clearanceTier: "Tier 3 - Beta",
    rating: 91,
    niche: ["Occupancy Benchmarking", "Mindanao Saturation", "Siargao STR"],
    metrics: [
      { label: "Roster Rank", value: "Hospitality Specialist" },
      { label: "Clearance", value: "Tier 3" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "siargao-tropical-villa", title: "Siargao Tropical Villa", category: "STR", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80" },
      { slug: "palawan-eco-retreat", title: "Palawan Eco-Retreat", category: "Hospitality", image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=400&q=80" }
    ]
  }
];

export const DUMMY_EVENT_PLANNERS = [
  {
    id: "ep-001",
    name: "Isabella Cruz",
    location: "Metro Manila",
    title: "Luxury Event Designer & Planner",
    specialty: "Wedding & Luxury Events",
    style: "Modern, opulent, floral-forward design with custom lighting",
    venues: "The Peninsula Manila · Shangri-La The Fort · Enderun Tent",
    rate: "Starting at ₱150,000 / event",
    events: "120+ Events",
    bio: "Over a decade of creating bespoke luxury weddings and high-profile social galas. Specializes in transforming raw spaces into breathtaking immersive environments.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    tier: 1,
    license: "Professional Event Organizer Guild ID 20281",
    clearanceTier: "Tier 1 - Elite Designer",
    rating: 96,
    niche: ["Luxury Weddings", "Galas & Socials", "Immersive Lighting"],
    metrics: [
      { label: "Roster Rank", value: "Elite Designer" },
      { label: "Clearance", value: "Tier 1" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "the-glasshouse-bgc", title: "The Glasshouse BGC", category: "Venues", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80" },
      { slug: "solaire-grand-ballroom", title: "Solaire Grand Ballroom", category: "Venues", image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "ep-002",
    name: "James Villanueva",
    location: "Cebu & Visayas",
    title: "Corporate Experience & Brand Designer",
    specialty: "Corporate & Brand Events",
    style: "Sleek, tech-integrated, high-energy experiential production",
    venues: "Jpark Island Resort · Oakridge Pavilion · Radisson Blu Cebu",
    rate: "Starting at ₱85,000 / event",
    events: "74 Events",
    bio: "Specializes in product launches, brand activations, and corporate retreats across the Visayas. Blends modern aesthetics with seamless event logistics.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
    tier: 2,
    license: "Visayas Event Organizers Guild ID 00192",
    clearanceTier: "Tier 2 - Alpha Producer",
    rating: 90,
    niche: ["Product Launches", "Corporate Retreats", "Visayas Regional"],
    metrics: [
      { label: "Roster Rank", value: "Lead Producer" },
      { label: "Clearance", value: "Tier 2" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "sky-pavilion-makati", title: "Sky Pavilion Makati", category: "Venues", image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=400&q=80" },
      { slug: "zuellig-building", title: "Zuellig Commercial Tower", category: "Commercial", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" }
    ]
  },
  {
    id: "ep-003",
    name: "Maria Santos",
    location: "Davao & Mindanao",
    title: "Boutique & Social Celebrations Planner",
    specialty: "Birthdays & Intimate Celebrations",
    style: "Chic, warm, minimalist rustic and bohemian aesthetics",
    venues: "Dusit Thani Lubi Plantation · Waterfront Insular Davao",
    rate: "Starting at ₱45,000 / event",
    events: "38 Events",
    bio: "Davao-based planner specializing in intimate weddings, milestone birthdays, and boutique social gatherings. Passionate about personalized, detail-rich celebrations.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80",
    tier: 3,
    license: "Mindanao Celebrations Association No. 00812",
    clearanceTier: "Tier 3 - Beta",
    rating: 92,
    niche: ["Intimate Weddings", "Bohemian Aesthetics", "Mindanao Boutique"],
    metrics: [
      { label: "Roster Rank", value: "Boutique Designer" },
      { label: "Clearance", value: "Tier 3" },
      { label: "Roster Status", value: "Active" }
    ],
    managedProperties: [
      { slug: "boracay-bamboo-hideaway", title: "Boracay Bamboo Hideaway", category: "STR", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80" },
      { slug: "bohol-treehouse-lodge", title: "Bohol Treehouse Lodge", category: "Hospitality", image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=400&q=80" }
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
    category: "STR",
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
    slug: "manila-venue-trends",
    title: "Manila Venue Trends",
    category: "Venues",
    date: "June 2026",
    excerpt: "Premium corporate venues shift toward light-filled glass atrium spaces.",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"
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
    category: "STR",
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
    category: "STR",
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
    category: "STR",
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
  },
  "manila-venue-trends": {
    title: "Manila Venue Trends",
    category: "Venues",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80",
    lead: "A major transformation is underway in Metro Manila's high-end social and corporate event sectors, with a major design shift toward light-filled glass atrium spaces.",
    body: [
      "Event organizers and corporate hosts are moving away from traditional, windowless hotel ballrooms. Instead, they seek modular pavilions that merge indoor safety with the visual beauty of the outdoor elements.",
      "These structures integrate double-glazed high-efficiency glass panes, load-bearing steel arches, and high acoustic ceiling clouds to permit premium stage setups while maintaining absolute thermal and acoustic isolation from the urban buzz.",
      "According to ScoutIt registry analytics, occupancy and lease inquiries for architectural venues featuring natural daylight integration have grown by 65% year-on-year."
    ],
    recommendation: "Acquire or lease event spaces designed with integrated pre-function outdoor spaces and modern rigging/sound proofing."
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

export function getPhotographers() {
  return DUMMY_PHOTOGRAPHERS;
}

export function getPhotographerById(id) {
  return DUMMY_PHOTOGRAPHERS.find(p => p.id === id) || null;
}

export function getResearchers() {
  return DUMMY_RESEARCHERS;
}

export function getResearcherById(id) {
  return DUMMY_RESEARCHERS.find(r => r.id === id) || null;
}

export function getEventPlanners() {
  return DUMMY_EVENT_PLANNERS;
}

export function getEventPlannerById(id) {
  return DUMMY_EVENT_PLANNERS.find(ep => ep.id === id) || null;
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
