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
  // Buyer-question checklist (src/lib/faqPreflight.js). Conditional: only
  // scored when the caller actually supplies the count, so listing models
  // that don't carry it aren't unfairly marked down.
  {
    key: "faqPreflight",
    label: "Buyer questions answered (5+)",
    test: (l) => (l.faqAnsweredCount || 0) >= 5,
    appliesWhen: (l) => l.faqAnsweredCount !== undefined && l.faqAnsweredCount !== null,
  },
];

/**
 * @param {object} listing UI listing model
 * @returns {{ score: number, missing: string[], total: number, passed: number }}
 */
export function computeListingStrength(listing) {
  const unconditional = CHECKS.filter((c) => !c.appliesWhen);
  if (!listing) {
    return { score: 0, missing: unconditional.map((c) => c.label), total: unconditional.length, passed: 0 };
  }

  // A conditional check only counts toward the denominator when its data is
  // actually present -- otherwise adding a check would silently drop every
  // existing listing's score.
  const applicable = CHECKS.filter((c) => !c.appliesWhen || c.appliesWhen(listing));

  const missing = [];
  let passed = 0;
  for (const check of applicable) {
    if (check.test(listing)) passed += 1;
    else missing.push(check.label);
  }
  return {
    score: Math.round((passed / applicable.length) * 100),
    missing,
    total: applicable.length,
    passed,
  };
}
