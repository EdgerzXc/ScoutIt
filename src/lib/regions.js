// ── Region helper ────────────────────────────────────────────────
// CMS-ready: when Airtable provides an explicit `Region` field it wins;
// otherwise we derive the simplified region bucket from the City field.
// Keep this map in sync as new cities are onboarded (or move it fully to
// the Airtable `Region` column once the base exists).
export function cityToRegion(city = "") {
  const c = (city || "").toLowerCase();
  if (!c) return null;
  if (c.includes("bonifacio") || c.includes("bgc")) return "BGC";
  if (c.includes("makati")) return "Makati";
  if (c.includes("quezon")) return "Quezon City";
  if (c.includes("siargao")) return "Siargao";
  if (c.includes("boracay")) return "Boracay";
  if (c.includes("el nido") || c.includes("coron") || c.includes("palawan")) return "Palawan";
  if (c.includes("panglao") || c.includes("bohol")) return "Bohol";
  if (c.includes("tagaytay")) return "Tagaytay";
  if (c.includes("parañaque") || c.includes("paranaque")) return "Parañaque";
  return city;
}

// Resolve a region from a record that may carry an explicit region or a city.
export function regionOf(rec = {}) {
  return rec.region || cityToRegion(rec.city || rec.location || "");
}
