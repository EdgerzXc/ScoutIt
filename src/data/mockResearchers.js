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

export function getResearchers() {
  return DUMMY_RESEARCHERS;
}

export function getResearcherById(id) {
  return DUMMY_RESEARCHERS.find(r => r.id === id) || null;
}

