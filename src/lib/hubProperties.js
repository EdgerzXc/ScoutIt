// ─────────────────────────────────────────────────────────────────────────
// LOCATION HUB → PROPERTY SELECTION
// SEO-03 · NEW_IDEAS_2.md §51.4 · WORK ORDER W7
//
// `/api/hubs` returns hub METADATA only — name, tagline, coordinates. It has
// never returned listings, despite §51.4 describing it as "the data layer
// already exists". This module is the part that was actually missing: deciding
// which properties belong to a hub.
//
// ── THE HONESTY PROBLEM THIS MODULE EXISTS TO SOLVE ─────────────────
// `cmsCache.geocodeMissingCoords()` falls back to a CITY CENTROID when Mapbox
// can't place a property, and flags it `coordsApproximate: true`. Those
// coordinates are not an address — they are a guess that happens to be a
// number.
//
// A hub page is a claim: "these properties are in BGC." Matching on a centroid
// would let a property with no known location render under a hub heading and
// look verified. So proximity matching **ignores approximate coordinates
// entirely**. A property with a fallback centroid can still appear, but only
// via a city/region name match — which is the field that was actually filled
// in, rather than a number we invented.
//
// Standing Rule 3, applied to geography: a blank is honest, an inferred
// coordinate presented as a location is not.
// ─────────────────────────────────────────────────────────────────────────

/** How far from the hub centre still counts as "in" the hub. */
export const HUB_RADIUS_KM = 6;

const EARTH_RADIUS_KM = 6371;

/**
 * Great-circle distance in km. Returns null when either point is incomplete.
 *
 * ⚠️ 'Number(null)' and 'Number("")' are both 0, and 0 here would read as
 * "exactly at the hub centre" — the most confident possible claim produced by
 * the least possible data. Missing values are therefore rejected BEFORE the
 * numeric coercion, not by it. Caught by a test, not by review.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const raw = [lat1, lng1, lat2, lng2];
  if (raw.some((v) => v === null || v === undefined || v === "" || typeof v === "boolean")) {
    return null;
  }
  const nums = raw.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const [a1, o1, a2, o2] = nums;
  const dLat = ((a2 - a1) * Math.PI) / 180;
  const dLng = ((o2 - o1) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a1 * Math.PI) / 180) * Math.cos((a2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Lowercased, punctuation collapsed to single spaces. */
function norm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Same, with separators removed entirely: "B.G.C." and "BGC" both → "bgc". */
function compact(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Does this property NAME its way into the hub? Checks city, region and the
 * free-text location against both the hub's city and its region label.
 *
 * Substring rather than equality: Airtable's Location is free text
 * ("11th Ave, BGC, Taguig City"), and demanding an exact match there would
 * silently drop most of the catalog — the §40.9a failure mode, where an
 * over-strict filter shows nothing and nothing looks identical to having none.
 */
export function matchesHubByName(property, hub) {
  if (!property || !hub) return false;
  const source = `${property.city} ${property.region} ${property.location}`;
  const haystack = norm(source);
  if (!haystack) return false;
  const haystackCompact = compact(source);

  return [hub.city, hub.region].filter(Boolean).some((needle) => {
    const n = norm(needle);
    if (!n) return false;
    if (haystack.includes(n)) return true;
    // Second pass on the separator-stripped form, so "B.G.C." and "B G C"
    // reach the BGC hub. Only ever ADDS matches — the spaced pass above is
    // still authoritative — because the expensive failure here is the false
    // NEGATIVE: a listing that silently misses its own hub page looks
    // identical to a hub that has no listings (§40.9a).
    return haystackCompact.includes(compact(needle));
  });
}

/**
 * Distance from the hub centre, or null when the property has no coordinates
 * WE CAN STAND BEHIND. Approximate (centroid-fallback) coords return null by
 * design — see the header comment.
 */
export function hubDistanceKm(property, hub) {
  if (!property || !hub) return null;
  if (property.coordsApproximate === true) return null;
  return haversineKm(property.lat, property.lng, hub.lat, hub.lng);
}

/**
 * The properties that belong on a hub page.
 *
 * @param {Array<object>} properties - the CMS bundle's properties
 * @param {object} hub - one entry from LOCATION_HUBS
 * @param {{radiusKm?: number}} [options]
 * @returns {Array<object>} each property with 'hubDistanceKm' (number|null)
 *   and 'hubMatchBasis' ('proximity' | 'name') attached
 *
 * Ordering: measured-distance matches first, nearest to furthest, then
 * name-only matches. A visitor scanning the page reads the strongest evidence
 * first — the same principle as LISTER_RELATIONSHIPS' authority order.
 */
export function selectHubProperties(properties, hub, options = {}) {
  const radiusKm = Number(options.radiusKm) > 0 ? Number(options.radiusKm) : HUB_RADIUS_KM;
  if (!Array.isArray(properties) || !hub) return [];

  const matched = [];
  for (const property of properties) {
    if (!property || !property.slug) continue;
    const distance = hubDistanceKm(property, hub);
    const near = distance !== null && distance <= radiusKm;
    const named = matchesHubByName(property, hub);
    if (!near && !named) continue;
    matched.push({
      ...property,
      hubDistanceKm: near ? distance : null,
      hubMatchBasis: near ? "proximity" : "name",
    });
  }

  return matched.sort((a, b) => {
    if (a.hubMatchBasis !== b.hubMatchBasis) return a.hubMatchBasis === "proximity" ? -1 : 1;
    if (a.hubMatchBasis === "proximity") return a.hubDistanceKm - b.hubDistanceKm;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}
