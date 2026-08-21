// ═══════════════════════════════════════════════════════════════
// PROPERTY ↔ ARTICLE MATCHING
//
// Which Intel briefings belong on a property page, and in what order.
//
// TWO KINDS, ONE LIST
// -------------------
// An article earns its place on a property page one of two ways:
//
//   1. It was written ABOUT this property   → `Related_Property` links to it
//   2. It covers the market this property sits in → same city (or region)
//
// They render as ONE list, because a property sits in exactly one location and
// splitting "here" from "this building" into two headed blocks was more
// structure than the content justifies. But the DISTINCTION is kept on every
// item, because collapsing it entirely is a quiet overclaim: a general
// "BGC market outlook" presented under a property's name reads as though
// ScoutIt investigated that specific building. Property-specific articles sort
// first and carry a flag the UI can label. See Standing Rule 22.
//
// ⚠️ `Related_Property` DOES NOT EXIST IN AIRTABLE YET.
// The matching path is written and tested so that adding the field is the only
// remaining step — but until it exists, `aboutThisProperty` is always empty and
// every match is an area match. That is a data gap, not a bug, and the UI must
// not imply otherwise.
// ═══════════════════════════════════════════════════════════════

/** Normalise a place string for comparison: trim, collapse spaces, lowercase. */
const norm = (v) => String(v ?? "").trim().replace(/\s+/g, " ").toLowerCase();

// Words that appear in so many Philippine place names that matching on them
// alone is meaningless. Without this list "Cebu City" matches "Quezon City"
// on the shared token "city", which is worse than no match at all.
const PLACE_STOPWORDS = new Set([
  "city", "cbd", "metro", "manila", "the", "area", "district", "poblacion",
  "north", "south", "east", "west", "central", "new", "old",
]);

/**
 * Meaningful place tokens: "BGC, Taguig" → ["bgc", "taguig"].
 *
 * ⚠️ THIS IS WHY EQUALITY IS NOT ENOUGH. Articles are authored at DISTRICT
 * level and properties are recorded at CITY level:
 *
 *   article.city   "BGC, Taguig" · "Makati CBD" · "Poblacion, Makati"
 *   property.city  "Taguig"      · "Makati"     · "Makati"
 *
 * Every one of those pairs is obviously the same market and NONE of them are
 * string-equal. An exact-match filter would return nothing on every property
 * in the current inventory, and Standing Rule 4 is precise about what that
 * costs: it fails by showing nothing, and showing nothing looks exactly like
 * having nothing. Verified against the live feed before this was written.
 */
function placeTokens(value) {
  return new Set(
    norm(value)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !PLACE_STOPWORDS.has(t)),
  );
}

/** Do two place strings share at least one meaningful token? */
function placesOverlap(a, b) {
  const ta = placeTokens(a);
  if (ta.size === 0) return false;
  const tb = placeTokens(b);
  if (tb.size === 0) return false;
  for (const t of ta) if (tb.has(t)) return true;
  return false;
}

function anyPlaceOverlap(left, right) {
  return left.some((a) => right.some((b) => placesOverlap(a, b)));
}

/**
 * Does this article name this property explicitly?
 *
 * Airtable link fields return RECORD IDS, not slugs, so the id is the primary
 * key here. Slug is accepted too because the Supabase OSINT briefings in the
 * same merged feed are authored against slugs, and a matcher that only
 * understood one of the two sources would silently drop half the feed.
 */
function isAboutProperty(article, property) {
  const links = article?.relatedPropertyIds;
  if (!Array.isArray(links) || links.length === 0) return false;

  const id = property?.id ? String(property.id) : null;
  const slug = property?.slug ? norm(property.slug) : null;

  return links.some((link) => {
    const value = String(link ?? "");
    if (!value) return false;
    if (id && value === id) return true;
    return Boolean(slug) && norm(value) === slug;
  });
}

/**
 * Does this article cover the market this property sits in?
 *
 * City first. Region is a DELIBERATE second tier rather than an equal one:
 * "NCR" covers Makati, Taguig, Pasig and Quezon City, so treating a region
 * match as equivalent to a city match would put a Makati article on a Quezon
 * City listing and call it local. Region matches are still returned — an
 * article about the region genuinely is about this property's market — but they
 * sort below city matches.
 */
function areaRank(article, property) {
  const articleLocal = [article?.location, article?.district, article?.city];
  const propertyLocal = [property?.location, property?.district, property?.city];

  // Most-specific bridge: a district/address on either record may contain the
  // other's city ("Capitol Commons, Pasig City" ↔ "Pasig") or the same
  // neighbourhood even when both City fields are blank.
  if (anyPlaceOverlap(articleLocal, propertyLocal)) return 1;

  // Region is deliberately a broader fallback. It remains useful when an
  // article is regional, but always sorts below a building/district/city match.
  if (articleLocal.some((place) => placesOverlap(place, property?.region))) return 2;
  if (propertyLocal.some((place) => placesOverlap(place, article?.region))) return 2;
  if (placesOverlap(article?.region, property?.region)) return 2;

  return 0; // no match
}

/** Newest first. Undated articles sort last rather than jumping to the top. */
function byDateDesc(a, b) {
  const ta = Date.parse(a?.date || "");
  const tb = Date.parse(b?.date || "");
  const va = Number.isNaN(ta) ? -Infinity : ta;
  const vb = Number.isNaN(tb) ? -Infinity : tb;
  return vb - va;
}

/**
 * Articles that belong on this property's page, best match first.
 *
 * @param {Array<object>} articles Normalised Intel briefings (see lib/airtable.js)
 * @param {object} property        Normalised property record
 * @param {{ limit?: number }} [options]
 * @returns {Array<object & { isAboutThisProperty: boolean }>}
 */
export function articlesForProperty(articles, property, options = {}) {
  const { limit = 8 } = options;
  if (!Array.isArray(articles) || !property) return [];

  const scored = [];
  for (const article of articles) {
    if (!article || !article.slug || !article.title) continue;

    const aboutThis = isAboutProperty(article, property);
    const rank = aboutThis ? 0 : areaRank(article, property);

    // rank 0 from areaRank means "no relationship at all" — but rank 0 from
    // aboutThis means "the strongest relationship there is". They collide, so
    // the flag decides rather than the number.
    if (!aboutThis && rank === 0) continue;

    scored.push({ ...article, isAboutThisProperty: aboutThis, _rank: rank });
  }

  scored.sort((a, b) => (a._rank - b._rank) || byDateDesc(a, b));

  return scored.slice(0, limit).map(({ _rank, ...article }) => article);
}

/**
 * Would a "read more" link have anywhere useful to go?
 *
 * The empty state links to the area's intel rather than to nothing, but only
 * when there is an area to name.
 */
export function areaIntelHref(property) {
  const city = property?.city ? String(property.city).trim() : "";
  return city ? `/intel?q=${encodeURIComponent(city)}` : "/intel";
}

export default articlesForProperty;
