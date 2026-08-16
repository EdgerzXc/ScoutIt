// ═══════════════════════════════════════════════════════════════
// GEOCODE CONFIDENCE
//
// Owners never type coordinates. Every position on the platform is inferred
// from a line of location text, and that inference is not always good: "BGC,
// Taguig" resolves to a district centroid, not a building. Until now the result
// was accepted silently either way, so a listing pinned to the middle of a city
// looked exactly as authoritative as one pinned to its own front door.
//
// This grades the answer so an uncertain one can be flagged for a human instead
// of being published as fact.
//
// Mapbox gives us two useful signals:
//
//   relevance   0..1, how well the result matched the query string
//   place_type  what KIND of thing was matched — an address, a point of
//               interest, a neighbourhood, a whole city
//
// place_type matters more than relevance. A query of "Makati" matches the city
// of Makati with relevance 1.0 — a perfect match to a useless answer, because a
// city centroid is not where the building is.
// ═══════════════════════════════════════════════════════════════

/** Building-level. The coordinate is the place. */
const EXACT_TYPES = new Set(["address", "poi"]);

/** Street or block level. Close enough to draw, worth a human glance. */
const APPROXIMATE_TYPES = new Set(["neighborhood", "locality", "postcode"]);

/**
 * Anything at this level is a centroid of an area, not a position. A map drawn
 * from one of these is confidently wrong.
 */
const COARSE_TYPES = new Set(["place", "district", "region", "country"]);

/** Below this the match itself is doubtful, whatever kind of thing it matched. */
const MIN_RELEVANCE = 0.8;

export const GEO_PRECISION = {
  EXACT: "exact",
  APPROXIMATE: "approximate",
  COARSE: "coarse",
  NONE: "none",
};

/**
 * Grades a Mapbox geocoding feature.
 *
 * @param {object|null} feature  a feature from the geocoding response
 * @param {string} [query]       the text that was geocoded, kept for the record
 * @returns {{
 *   lat: number|null, lng: number|null,
 *   precision: string, relevance: number|null, placeType: string|null,
 *   uncertain: boolean, reason: string|null, placeName: string|null,
 *   query: string|null, at: string
 * }}
 */
export function assessGeocode(feature, query = null) {
  const at = new Date().toISOString();
  const base = {
    lat: null,
    lng: null,
    precision: GEO_PRECISION.NONE,
    relevance: null,
    placeType: null,
    uncertain: true,
    reason: null,
    placeName: null,
    query: query || null,
    at,
  };

  const center = feature?.center;
  if (!Array.isArray(center) || center.length < 2) {
    return { ...base, reason: "No result for this location text" };
  }

  const [lng, lat] = center.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ...base, reason: "Result had no usable coordinates" };
  }

  const placeType = Array.isArray(feature.place_type) ? feature.place_type[0] : feature.place_type || null;
  const relevance = typeof feature.relevance === "number" ? feature.relevance : null;
  const placeName = feature.place_name || null;

  let precision = GEO_PRECISION.APPROXIMATE;
  if (EXACT_TYPES.has(placeType)) precision = GEO_PRECISION.EXACT;
  else if (COARSE_TYPES.has(placeType)) precision = GEO_PRECISION.COARSE;
  else if (!APPROXIMATE_TYPES.has(placeType)) precision = GEO_PRECISION.APPROXIMATE;

  let reason = null;
  if (precision === GEO_PRECISION.COARSE) {
    reason = `Matched a ${placeType}, not a building — this is the centre of an area`;
  } else if (relevance !== null && relevance < MIN_RELEVANCE) {
    reason = `Weak match for the location text (${relevance.toFixed(2)})`;
  } else if (precision === GEO_PRECISION.APPROXIMATE) {
    reason = `Matched a ${placeType || "general area"} rather than an address`;
  }

  // Only a building-level match with a strong score is trusted outright.
  const uncertain = precision !== GEO_PRECISION.EXACT || (relevance !== null && relevance < MIN_RELEVANCE);

  return { lat, lng, precision, relevance, placeType, uncertain, reason, placeName, query: query || null, at };
}

/**
 * One line a human can act on, for the staff console.
 */
export function describeGeoFlag(geo) {
  if (!geo) return "Never geocoded";
  if (!geo.lat || !geo.lng) return geo.reason || "No position";
  if (!geo.uncertain) return "Verified to building level";
  return geo.reason || "Position needs checking";
}
