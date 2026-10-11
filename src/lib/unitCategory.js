// A-154 Pillar 2 — unit-category vocabulary. One module owns the set of
// identities a child space may carry, distinct from the parent building's
// single SpaceCategory (owner decision 2026-09-18: "main property has one
// identity but units shall be able to have different unit identity").
//
// Pure constants + predicates, no UI and no imports — the schema columns
// (unit_category, listing_purpose on property_units) land via migration
// O-004 item 8; this module is the contract the build codes against so the
// vocabulary cannot drift per call site (Standing Rule 14: the test is part
// of the change).

export const UNIT_CATEGORIES = Object.freeze([
  "residential_lease",
  "residential_sale",
  "str",
  "commercial_flex",
]);

export const LISTING_PURPOSES = Object.freeze([
  "lease",
  "sale",
  "short_stay",
  "flex",
]);

export const UNIT_CATEGORY_LABELS = Object.freeze({
  residential_lease: "Residential lease",
  residential_sale: "Residential sale",
  str: "Short-term rental",
  commercial_flex: "Commercial flex",
});

export function isUnitCategory(value) {
  return UNIT_CATEGORIES.includes(value);
}

export function isStrCategory(value) {
  return value === "str";
}

export function unitCategoryLabel(value) {
  return UNIT_CATEGORY_LABELS[value] ?? null;
}

// STR nightly figures must never fall into the asset-sale PRICE_BANDS
// (DirectoryClient Entry/Mid/Premium/Trophy); this predicate is the seam
// Pillar 5's adaptive bands switch on.
export function usesNightlyPricing(unitCategory) {
  return unitCategory === "str";
}

// A-154 Pillar 5: Adaptive price bands (internal PHP limits for qualitative filtering)
export const ASSET_PRICE_BANDS = Object.freeze([
  { label: "Entry",   min: 0,        max: 1000000 },
  { label: "Mid",     min: 1000000,  max: 10000000 },
  { label: "Premium", min: 10000000, max: 50000000 },
  { label: "Trophy",  min: 50000000, max: Infinity },
]);

export const STR_PRICE_BANDS = Object.freeze([
  { label: "Under ₱3,000 / night", min: 0,     max: 3000 },
  { label: "₱3,000 – ₱6,000 / night", min: 3000,  max: 6000 },
  { label: "₱6,000 – ₱12,000 / night", min: 6000, max: 12000 },
  { label: "₱12,000+ / night", min: 12000, max: Infinity },
]);

export const LEASE_PRICE_BANDS = Object.freeze([
  { label: "Under ₱50k / mo", min: 0,      max: 50000 },
  { label: "₱50k – ₱100k / mo", min: 50000,  max: 100000 },
  { label: "₱100k – ₱250k / mo", min: 100000, max: 250000 },
  { label: "₱250k+ / mo", min: 250000, max: Infinity },
]);

/**
 * Returns the adaptive price bands based on selected sectors.
 * STR filter -> nightly rates; Residential lease -> monthly rent; otherwise asset sales.
 */
export function getAdaptivePriceBands(sectors = []) {
  if (!Array.isArray(sectors) || sectors.length === 0) return ASSET_PRICE_BANDS;
  if (sectors.includes("STR")) return STR_PRICE_BANDS;
  if (sectors.includes("Residential")) return LEASE_PRICE_BANDS;
  return ASSET_PRICE_BANDS;
}

/**
 * Multi-Category matching predicate (A-154 Pillar 5).
 * Matches parent property category, active_offerings array, or child units_inventory categories.
 */
export function matchesPropertyCategory(property, selectedSectors = []) {
  if (!selectedSectors || selectedSectors.length === 0) return true;
  if (!property) return false;

  const mapped = selectedSectors.map((s) => (s === "Venues/Events" ? "Venues" : s));
  const pCat = property.spaceCategory || "";
  const offerings = Array.isArray(property.active_offerings)
    ? property.active_offerings
    : (Array.isArray(property.Active_Offerings) ? property.Active_Offerings : []);

  const units = Array.isArray(property.units_inventory) ? property.units_inventory : [];

  return mapped.some((sec) => {
    // 1. Direct parent SpaceCategory match
    if (pCat === sec) return true;
    // 2. Airtable Active_Offerings multi-select match
    if (offerings.includes(sec)) return true;
    // 3. Child unit inventory category match
    return units.some((u) => {
      const uCat = (u.unit_category || u.unitCategory || "").toLowerCase();
      if (sec === "STR" && (uCat === "str" || uCat === "short_term_rental")) return true;
      if (sec === "Residential" && (uCat.includes("residential") || uCat === "lease" || uCat === "sale")) return true;
      if (sec === "Commercial" && (uCat.includes("commercial") || uCat === "office" || uCat === "commercial_flex")) return true;
      return false;
    });
  });
}

