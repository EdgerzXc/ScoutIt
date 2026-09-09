// ═══════════════════════════════════════════════════════════════
// SUPABASE INTEL BRIEFINGS → PUBLIC INTEL BUNDLE
// U-021 + A-082 · full-stack gap audit 2026-09-01 / 2026-09-03
//
// ── WHY THIS IS ITS OWN MODULE ───────────────────────────────────────
// Both defects lived in one anonymous `.map()` inside `getCmsBundle()`,
// where the only way to test either was to run the whole Airtable bundle
// fetch. U-021 exists *because* a correct write-side fix had no reader and
// no test; putting the read side behind a named, importable function is
// how the guard stops being vacuous.
//
// ── U-021: THE FILTER ────────────────────────────────────────────────
// The query said `.select("*")` with no publication filter, under a comment
// that read "Fetch published briefings". `intel_briefings` carries
// `published_to_airtable`, set true in exactly one place —
// `intelPublish.js` `publishedMarkers()`, which refuses without an Airtable
// record id — and `/api/admin/osint` explicitly inserts it false. So staff
// drafted a briefing, it was correctly marked unpublished, and it went to
// the public /intel page anyway, overriding any real Airtable article
// sharing its slug (Supabase wins by slug in the merge).
//
// The flag is required to be exactly `true`. A missing or NULL flag is a
// draft, not a publication: fail closed.
//
// ── A-082: ABSENT BEATS INVENTED ─────────────────────────────────────
// The same block substituted a plausible constant for every missing field —
// `"OSINT Public Filing"` for the source, `"BGC, Taguig"` for the city,
// the BGC coordinates for the position, a stock Unsplash photograph for the
// cover, and `"Just Now"` for the date. ScoutIt's entire Intel proposition
// is named provenance (the homepage promises "Named sources"), and this
// manufactured provenance precisely when it was missing.
//
// Every consumer already guards for absence — `/intel` checks
// `art.image ?`, `art.lat == null`, `featuredArticle.sourceName ?` — so
// reporting nothing renders nothing. Nothing needed a default; the defaults
// were the bug.
//
// `Number(b.lat) || 14.5547` also rewrote a legitimate `0`, because `0` is
// falsy. Not reachable in the Philippines, but the same bug shape, so
// coordinates are parsed explicitly rather than through truthiness.
// ═══════════════════════════════════════════════════════════════

/** The publication filter the database query must apply. Exported so the
 *  query and its test name the same column. */
export const PUBLISHED_BRIEFING_FILTER = Object.freeze({
  column: "published_to_airtable",
  value: true,
});

/** A briefing is public only when its publication flag is exactly true. */
export function isPublishedBriefing(row) {
  return row?.[PUBLISHED_BRIEFING_FILTER.column] === PUBLISHED_BRIEFING_FILTER.value;
}

/** A coordinate the row did not supply is absent, not a default. `0` is a
 *  real coordinate and survives; anything unparseable is null. */
function coordinate(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function publishedDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Map one `intel_briefings` row into the public intel bundle shape,
 *  reporting only what the row actually carries. */
export function mapBriefingToIntel(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category || "",
    intelType: row.category || "",
    date: publishedDate(row.published_at),
    city: row.city || "",
    region: row.region || "",
    location: row.location || row.district || row.city || "",
    district: row.district || "",
    lat: coordinate(row.lat),
    lng: coordinate(row.lng),
    image: row.cover_image_url || "",
    excerpt: row.excerpt || "",
    lead: row.lead || "",
    ourTake: row.our_take || "",
    sourceName: row.source_name || "",
    sourceUrl: row.source_url || "",
    body: Array.isArray(row.body_json) ? row.body_json : [],
    bodyJson: Array.isArray(row.body_json) ? JSON.stringify(row.body_json) : row.body_json,
    source: "supabase_osint",
  };
}
