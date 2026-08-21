/**
 * Geographic helpers shared by the map, the radar filters and the
 * property-to-intel link.
 *
 * This deliberately lives outside any component. It used to be exported from
 * SpatialIntelMap.js, which meant anything importing the maths also pulled in
 * JSX and maplibre — including test files, which then could not parse it.
 *
 * `distanceKm` mirrors the Haversine already used server-side in
 * `/api/cms/route.js`. Keep the two in agreement: if the map ring and the
 * API disagree about what is "inside" a radius, the UI lies.
 */

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two points, in kilometres. */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Kilometres to degrees of longitude at a given latitude. */
export function kmToLngDeg(km, lat) {
  return km / (111.32 * Math.cos((lat * Math.PI) / 180) || 1);
}

/** Kilometres to degrees of latitude. */
export function kmToLatDeg(km) {
  return km / 110.574;
}

/** A circle as a GeoJSON polygon — zone fills, radius rings. */
export function circlePolygon(lng, lat, radiusKm, steps = 72) {
  const coords = [];
  const dLat = kmToLatDeg(radiusKm);
  const dLng = kmToLngDeg(radiusKm, lat);
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * Math.PI * 2;
    coords.push([lng + dLng * Math.cos(theta), lat + dLat * Math.sin(theta)]);
  }
  return { type: "Polygon", coordinates: [coords] };
}

/** A small square footprint, used for the 3D extrusion at a location. */
export function footprintPolygon(lng, lat, sizeKm = 0.09) {
  const dLat = kmToLatDeg(sizeKm);
  const dLng = kmToLngDeg(sizeKm, lat);
  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  };
}

/**
 * Articles near a point, nearest first, each annotated with `distanceKm`.
 *
 * This is the one function behind both directions of the link:
 *   - the radar on Intel and Discover ("what is near this point")
 *   - the reverse link on a property page ("what might affect this space")
 *
 * Rows without coordinates are excluded rather than silently treated as
 * distance zero, which would float untagged articles to the top.
 */
export function articlesNear(articles, lat, lng, radiusKm) {
  if (lat == null || lng == null) return [];
  return articles
    .filter((a) => typeof a.lat === "number" && typeof a.lng === "number")
    .map((a) => ({ ...a, distanceKm: distanceKm(lat, lng, a.lat, a.lng) }))
    .filter((a) => radiusKm == null || a.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** "820 m" / "4.2 km" — distance phrased for a reader, not a machine. */
export function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
