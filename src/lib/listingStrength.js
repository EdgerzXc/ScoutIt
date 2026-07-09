// Rule-based Listing Strength score (Honest Blank Rule: no AI, no fabricated
// probabilities — a plain field-completeness checklist any user can verify by
// looking at their own listing). Works on the UI listing model produced by
// DashboardContext's mapSupabaseProperties / CMS mapper.

const CHECKS = [
  { key: "title", label: "Title", test: (l) => !!l.title && l.title.trim().length >= 5 },
  { key: "location", label: "Location", test: (l) => !!(l.location || l.loc) },
  { key: "price", label: "Price", test: (l) => l.price !== null && l.price !== undefined && l.price !== "" },
  { key: "description", label: "Description (50+ characters)", test: (l) => !!l.desc && l.desc.trim().length >= 50 },
  { key: "media", label: "Photos or media gallery", test: (l) => !!l.hasMedia || !!l.mediaLink },
  { key: "coordinates", label: "Map location (geocoded)", test: (l) => !!l.coordinates },
  { key: "category", label: "Space category", test: (l) => !!l.spaceCategory && l.spaceCategory !== "Unknown" },
  { key: "details", label: "Deep intel (specs, financials)", test: (l) => l.details && Object.keys(l.details).length >= 3 },
];

/**
 * @param {object} listing UI listing model
 * @returns {{ score: number, missing: string[], total: number, passed: number }}
 */
export function computeListingStrength(listing) {
  if (!listing) return { score: 0, missing: CHECKS.map((c) => c.label), total: CHECKS.length, passed: 0 };
  const missing = [];
  let passed = 0;
  for (const check of CHECKS) {
    if (check.test(listing)) passed += 1;
    else missing.push(check.label);
  }
  return {
    score: Math.round((passed / CHECKS.length) * 100),
    missing,
    total: CHECKS.length,
    passed,
  };
}
