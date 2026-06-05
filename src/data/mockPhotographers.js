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

export function getPhotographers() {
  return DUMMY_PHOTOGRAPHERS;
}

export function getPhotographerById(id) {
  return DUMMY_PHOTOGRAPHERS.find(p => p.id === id) || null;
}

