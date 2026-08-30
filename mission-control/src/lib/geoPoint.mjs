/**
 * A-060 — the one place that reads a stored position.
 *
 * Supabase writes PostGIS `POINT(lng lat)` — longitude FIRST. Airtable holds
 * `Latitude` and `Longitude` as two separate numbers. Reading that pair the
 * wrong way round is the single most common way a Manila listing ends up in the
 * Pacific, and it is invisible in review because both values are plausible
 * numbers. So the order lives here, once, with a test that asserts it by value.
 *
 * Pure and dependency-free so it can be tested without Next's resolver.
 */
export function parsePointToLatLng(value) {
  if (typeof value !== "string") return null;
  const m = value.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  const lng = Number(m[1]);
  const lat = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
