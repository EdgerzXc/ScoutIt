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
