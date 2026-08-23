// ── Region helper ────────────────────────────────────────────────
// CMS-ready: when Airtable provides an explicit `Region` field it wins;
// otherwise we derive the simplified region bucket from the City field.
// Keep this map in sync as new cities are onboarded (or move it fully to
// the Airtable `Region` column once the base exists).
export function cityToRegion(city = "") {
  const c = (city || "").toLowerCase().trim();
  if (!c) return null;
  if (c.includes("bonifacio") || c.includes("bgc") || c.includes("taguig")) return "BGC";
  if (c.includes("makati") || c.includes("poblacion") || c.includes("ayala")) return "Makati";
  if (c.includes("quezon") || c.includes("qc")) return "Quezon City";
  if (c.includes("siargao") || c.includes("general luna")) return "Siargao";
  if (c.includes("boracay") || c.includes("malay")) return "Boracay";
  if (c.includes("el nido") || c.includes("coron") || c.includes("palawan") || c.includes("san vicente")) return "Palawan";
  if (c.includes("panglao") || c.includes("bohol") || c.includes("tagbilaran")) return "Bohol";
  if (c.includes("tagaytay")) return "Tagaytay";
  if (c.includes("parañaque") || c.includes("paranaque") || c.includes("aseana") || c.includes("bay area")) return "Parañaque";
  if (c.includes("cebu") || c.includes("mandaue")) return "Cebu";
  if (c.includes("pasig") || c.includes("ortigas")) return "Pasig";
  if (c.includes("mandaluyong")) return "Mandaluyong";
  if (c.includes("alabang") || c.includes("muntinlupa")) return "Alabang";
  return city;
}

// Resolve a region from a record that may carry an explicit region or a city.
export function regionOf(rec = {}) {
  if (!rec) return null;
  if (rec.region) {
    const normalized = cityToRegion(rec.region);
    if (normalized) return normalized;
  }
  return cityToRegion(rec.city || rec.location || "") || rec.region || null;
}
