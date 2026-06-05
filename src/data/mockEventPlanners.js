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

export function getEventPlanners() {
  return DUMMY_EVENT_PLANNERS;
}

export function getEventPlannerById(id) {
  return DUMMY_EVENT_PLANNERS.find(ep => ep.id === id) || null;
}

