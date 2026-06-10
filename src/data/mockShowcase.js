// ═══════════════════════════════════════════════════════════════
// SHOWCASE ("The Board") — mock data + ranking helpers
//
// Flat entries derived from existing properties; ranking is computed
// per (award × category) so the board can be filtered both ways.
// Replace getShowcaseEntries() with the SHOWCASE_CMS fetch later.
// ═══════════════════════════════════════════════════════════════
import { getProperties } from "./mockProperties";

// Airtable column names for the future SHOWCASE_CMS table → app keys.
export const SHOWCASE_CMS_FIELDS = {
  rank: "Rank", property_slug: "Property_Slug", category: "Category",
  award_type: "Award_Type", inquiry_count: "Inquiry_Count", active_month: "Active_Month",
  is_active: "Is_Active", walkthrough_url: "Walkthrough_URL", story_url: "Story_URL",
  section: "Section", broker_slug: "Broker_Slug", photographer_slug: "Photographer_Slug",
};

export const BOARD_CATEGORIES = ["All", "Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues/Events"];
export const BOARD_AWARDS = ["Most Inquired", "Top Rated", "New This Month", "Staff Pick"];

export const tierForRank = (rank) => (rank === 1 ? "universe" : rank === 2 ? "cluster" : rank === 3 ? "solar" : "starry");

const CAT6 = (raw) => {
  const c = (raw || "").toLowerCase();
  if (c.includes("resid") || c.includes("condo") || c.includes("house")) return "Residential";
  if (c.includes("restaurant") || c.includes("culinary") || c.includes("dining")) return "Restaurants";
  if (c.includes("venue") || c.includes("event") || c.includes("ballroom")) return "Venues/Events";
  if (c.includes("str") || c.includes("villa")) return "STR";
  if (c.includes("hospitality") || c.includes("resort") || c.includes("lodge") || c.includes("cabin")) return "Hospitality";
  if (c.includes("commercial") || c.includes("office") || c.includes("retail") || c.includes("showroom")) return "Commercial";
  return "Commercial";
};

// Demo promo embeds — the "privilege" unlocked by reaching the peak.
const PROMOS = [
  "https://www.youtube.com/embed/Cn4G2lZ_g2I",
  "https://www.youtube.com/embed/35LcOLg7Bp0",
  "https://www.youtube.com/embed/yQ0r3Y8gW9k",
  "https://www.youtube.com/embed/itZMM5gCboo",
];
// Curated engagement per slug so the overall leaderboard feels real
const SEED = {
  "batasan-hills": 47, "aurelia-residences": 41, "the-glasshouse-bgc": 36, "gallery-by-chele": 33,
  "the-estate-makati": 31, "palawan-eco-retreat": 27, "siargao-tropical-villa": 24, "antonios-tagaytay": 22,
  "solaire-grand-ballroom": 19, "coron-island-resort": 16, "boracay-bamboo-hideaway": 13,
  "sky-pavilion-makati": 11, "bohol-treehouse-lodge": 9,
};

export function getShowcaseEntries() {
  const props = getProperties();
  return props.map((p, i) => {
    const inquiry = SEED[p.slug] ?? Math.max(4, 40 - i * 3);
    return {
      property_slug: p.slug,
      name: p.title,
      category: CAT6(p.spaceCategory || p.property_type),
      location: p.location || p.city || "",
      photo: (p.photos && p.photos[0]) || p.image || "",
      inquiry_count: inquiry,
      views: inquiry * 7 + (i % 5) * 5,
      saves: Math.round(inquiry * 1.9) - (i % 4) * 2,
      walkthrough_url: PROMOS[i] || "",       // top few properties carry a promo
      is_new: i % 2 === 0,
      is_staff_pick: i % 3 === 0,
      active_month: "June 2026",
      section: "Properties",
    };
  });
}

// Rank a flat entry list by award + category → ranked, tiered list
export function rankBoard(entries, { award = "Most Inquired", category = "All" } = {}) {
  let list = category === "All" ? entries.slice() : entries.filter((e) => e.category === category);
  if (award === "Top Rated") list.sort((a, b) => b.saves - a.saves);
  else if (award === "New This Month") list = list.filter((e) => e.is_new).sort((a, b) => b.inquiry_count - a.inquiry_count);
  else if (award === "Staff Pick") list = list.filter((e) => e.is_staff_pick).sort((a, b) => b.saves - a.saves);
  else list.sort((a, b) => b.inquiry_count - a.inquiry_count);
  return list.map((e, i) => ({ ...e, rank: i + 1, tier: tierForRank(i + 1), award_type: award }));
}
