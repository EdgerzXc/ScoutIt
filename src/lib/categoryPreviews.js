import { categoryKeyFor, CATEGORY_LABELS } from "./propertyFieldRegistry";
import { loadPublicCatalog } from "./cms/publicCatalog";

export const METROPOLIS_CATEGORIES = [
  "Residential",
  "Commercial",
  "STR",
  "Hospitality",
  "Restaurants",
  "Venues",
];

const CATEGORY_LABEL_TO_KEY = {
  Residential: "residential",
  Commercial: "commercial",
  STR: "str",
  Hospitality: "hospitality",
  Restaurants: "restaurants",
  Venues: "venues",
};

/**
 * Format a human-readable primary space type tag.
 */
function extractTypeTag(prop) {
  const t = prop.type || prop.property_type || prop.spaceCategory || prop.category;
  if (!t) return "Space: Verified Space";
  return `Type: ${t}`;
}

/**
 * Extract the most relevant metric for the category (sqm, beds, seating, etc.)
 */
function extractMetricTag(prop, categoryKey) {
  if (categoryKey === "residential") {
    if (prop.bedrooms || prop.beds) {
      return `Beds: ${prop.bedrooms || prop.beds} BR`;
    }
    if (prop.sqm) {
      return `Area: ${prop.sqm} sqm`;
    }
  }

  if (categoryKey === "commercial") {
    if (prop.building_grade) {
      return `Grade: Grade ${prop.building_grade.replace(/^grade\s*/i, "")}`;
    }
    if (prop.sqm) {
      return `Floor: ${prop.sqm} sqm`;
    }
  }

  if (categoryKey === "str") {
    if (prop.guests || prop.hosting_capacity) {
      return `Guests: Up to ${prop.guests || prop.hosting_capacity}`;
    }
    if (prop.bedrooms || prop.beds) {
      return `Layout: ${prop.bedrooms || prop.beds} BR`;
    }
  }

  if (categoryKey === "restaurants") {
    if (prop.seating_capacity) {
      return `Seating: ${prop.seating_capacity} seats`;
    }
  }

  if (categoryKey === "venues") {
    if (prop.standing_capacity || prop.seating_capacity) {
      return `Capacity: ${prop.standing_capacity || prop.seating_capacity} pax`;
    }
  }

  if (prop.sqm) {
    return `Area: ${prop.sqm} sqm`;
  }

  return null;
}

/**
 * Transforms raw catalog properties into normalized preview objects grouped by category.
 *
 * @param {Array<object>} properties - raw properties from CMS
 * @returns {Record<string, Array<object>>} - mapping of category name to preview card objects
 */
export function buildCategoryPreviews(properties = []) {
  const result = {
    Residential: [],
    Commercial: [],
    STR: [],
    Hospitality: [],
    Restaurants: [],
    Venues: [],
  };

  if (!Array.isArray(properties)) return result;

  for (const p of properties) {
    if (!p) continue;
    // Derive authoritative category
    const catRaw = p.spaceCategory || p.category || p.property_type || p.type || "";
    const key = categoryKeyFor(catRaw);
    if (!key) continue;

    // Find target Metropolis category name
    const targetCat = Object.keys(CATEGORY_LABEL_TO_KEY).find(
      (catName) => CATEGORY_LABEL_TO_KEY[catName] === key
    );
    if (!targetCat) continue;

    const id = p.slug || p.id || "";
    const title = p.title || "Untitled Space";
    const image =
      p.image ||
      (Array.isArray(p.photos) && p.photos.length > 0 ? p.photos[0] : null) ||
      "";

    const tags = [];
    // 1. Space type tag
    tags.push(extractTypeTag(p));

    // 2. City or Location tag
    if (p.city || p.location) {
      tags.push(`Location: ${p.city || p.location}`);
    }

    // 3. Category-specific key metric
    const metricTag = extractMetricTag(p, key);
    if (metricTag) {
      tags.push(metricTag);
    }

    result[targetCat].push({
      id,
      slug: id,
      title,
      image,
      category: targetCat,
      tags,
      city: p.city || "",
      isSample: Boolean(p.is_sample),
    });
  }

  return result;
}

/**
 * Counts properties across all categories.
 *
 * @param {Record<string, Array<object>>} previews
 * @returns {{ counts: Record<string, number>, total: number }}
 */
export function getCategoryCounts(previews = {}) {
  const counts = {};
  let total = 0;

  for (const cat of METROPOLIS_CATEGORIES) {
    const count = Array.isArray(previews[cat]) ? previews[cat].length : 0;
    counts[cat] = count;
    total += count;
  }

  return { counts, total };
}

/**
 * Filter properties for a category by search term.
 *
 * @param {Record<string, Array<object>>} previews
 * @param {string} category
 * @param {string} search
 * @returns {Array<object>}
 */
export function filterCategoryPreviews(previews = {}, category = "Residential", search = "") {
  const items = previews[category] || [];
  if (!search || typeof search !== "string") return items;

  const q = search.trim().toLowerCase();
  if (!q) return items;

  return items.filter((p) => {
    if (!p) return false;
    if (p.title && p.title.toLowerCase().includes(q)) return true;
    if (p.city && p.city.toLowerCase().includes(q)) return true;
    if (Array.isArray(p.tags)) {
      return p.tags.some((t) => typeof t === "string" && t.toLowerCase().includes(q));
    }
    return false;
  });
}

/**
 * Asynchronously fetch CMS catalogue and build category previews.
 *
 * @returns {Promise<Record<string, Array<object>>>>}
 */
export async function loadCategoryPreviews() {
  try {
    const catalog = await loadPublicCatalog();
    return buildCategoryPreviews(catalog?.properties || []);
  } catch (err) {
    return buildCategoryPreviews([]);
  }
}
