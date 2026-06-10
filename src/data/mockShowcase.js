// ═══════════════════════════════════════════════════════════════
// SHOWCASE ("The Board") — mock data
//
// Derived from the existing properties so names/photos/locations stay
// real. Ranks, award types, and engagement counts are mock until the
// SHOWCASE_CMS Airtable table is wired (see SHOWCASE_CMS_FIELDS below).
// ═══════════════════════════════════════════════════════════════
import { getProperties } from "./mockProperties";

// Airtable column names for the future SHOWCASE_CMS table → app keys.
// Add these to Airtable later and map them in src/lib/airtable.js.
export const SHOWCASE_CMS_FIELDS = {
  rank:            "Rank",            // number 1-10
  property_slug:   "Property_Slug",   // links to PROPERTIES_CMS slug
  category:        "Category",        // All | Residential | Commercial | STR
  award_type:      "Award_Type",      // Most Inquired | Top Rated | New This Month | Staff Pick
  inquiry_count:   "Inquiry_Count",   // number
  active_month:    "Active_Month",    // e.g. "June 2026"
  is_active:       "Is_Active",       // checkbox
  walkthrough_url: "Walkthrough_URL", // YouTube embed URL
  story_url:       "Story_URL",       // URL
  section:         "Section",         // Properties | Brokers | Photographers | Researchers
  broker_slug:     "Broker_Slug",     // text
  photographer_slug: "Photographer_Slug", // text
};

// Tier per rank: 1 = Universe(gold), 2 = Cluster(silver), 3 = Solar(bronze), 4-10 = Starry
export function tierForRank(rank) {
  if (rank === 1) return "universe";
  if (rank === 2) return "cluster";
  if (rank === 3) return "solar";
  return "starry";
}

const CATEGORY_MAP = (raw) => {
  const c = (raw || "").toLowerCase();
  if (c.includes("commercial") || c.includes("restaurant") || c.includes("venue") || c.includes("office") || c.includes("retail") || c.includes("culinary")) return "Commercial";
  if (c.includes("str") || c.includes("hospitality") || c.includes("resort") || c.includes("villa") || c.includes("retreat") || c.includes("lodge") || c.includes("hideaway")) return "STR";
  return "Residential";
};

// Seeded engagement so the top of the board matches the showcase mockups
const SEED = [
  { inquiry_count: 47, views: 312, saves: 89 },
  { inquiry_count: 38, views: 280, saves: 71 },
  { inquiry_count: 29, views: 198, saves: 54 },
  { inquiry_count: 22, views: 145, saves: 38 },
  { inquiry_count: 19, views: 131, saves: 33 },
  { inquiry_count: 16, views: 118, saves: 28 },
  { inquiry_count: 14, views: 102, saves: 24 },
  { inquiry_count: 11, views:  88, saves: 19 },
  { inquiry_count:  9, views:  74, saves: 15 },
  { inquiry_count:  7, views:  61, saves: 12 },
];

// A couple of demo walkthrough embeds for the top 3 (royalty-free ambient clips)
const WALKTHROUGHS = [
  "https://www.youtube.com/embed/Cn4G2lZ_g2I",
  "https://www.youtube.com/embed/35LcOLg7Bp0",
  "",
];

export function getShowcase() {
  const props = getProperties();
  const top = props.slice(0, 10);

  const properties = top.map((p, i) => {
    const rank = i + 1;
    return {
      rank,
      property_slug: p.slug,
      name: p.title,
      category: CATEGORY_MAP(p.spaceCategory || p.property_type),
      location: p.location || p.city || "",
      award_type: "Most Inquired",
      inquiry_count: SEED[i]?.inquiry_count ?? Math.max(3, 7 - (i - 9)),
      views: SEED[i]?.views ?? 60,
      saves: SEED[i]?.saves ?? 10,
      active_month: "June 2026",
      walkthrough_url: rank <= 3 ? (WALKTHROUGHS[rank - 1] || "") : "",
      story_url: "",
      photo: (p.photos && p.photos[0]) || p.image || "",
      section: "Properties",
      tier: tierForRank(rank),
    };
  });

  // A few entries on other award tabs so the tabs aren't empty (mock)
  const topRated = [...properties]
    .sort((a, b) => b.saves - a.saves)
    .slice(0, 6)
    .map((e, i) => ({ ...e, rank: i + 1, award_type: "Top Rated", tier: tierForRank(i + 1) }));

  const newThisMonth = [...properties]
    .slice(3, 9)
    .map((e, i) => ({ ...e, rank: i + 1, award_type: "New This Month", tier: tierForRank(i + 1) }));

  const staffPick = [...properties]
    .filter((_, i) => i % 2 === 0)
    .slice(0, 5)
    .map((e, i) => ({ ...e, rank: i + 1, award_type: "Staff Pick", tier: tierForRank(i + 1) }));

  return {
    "Most Inquired": properties,
    "Top Rated": topRated,
    "New This Month": newThisMonth,
    "Staff Pick": staffPick,
  };
}

export const AWARD_TABS = ["Most Inquired", "Top Rated", "New This Month", "Staff Pick"];
export const CATEGORY_FILTERS = ["All Properties", "Residential", "Commercial", "STR"];
export const SERVICE_FILTERS = ["Brokers", "Photographers", "Researchers"];
