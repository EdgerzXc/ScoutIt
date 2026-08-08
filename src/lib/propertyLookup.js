// ─────────────────────────────────────────────────────────────────────────
// PROPERTY LOOKUP BY ID-OR-SLUG — the one safe way to do it
// NEW_IDEAS_2.md §55
//
// Three routes independently wrote this:
//
//     .or(`id.eq.${propertyId},slug.eq.${propertyId}`)
//
// and it is wrong in two separate ways, both of which made the endpoint fail
// silently rather than loudly.
//
// ── 1. `properties.id` IS A uuid ────────────────────────────────────
// Passing a slug into `id.eq.` makes Postgres try to cast "bgc-luxury-suite"
// to uuid. That raises `invalid input syntax for type uuid`, the whole query
// errors, and the route's `if (propErr || !prop)` branch reports **"Property
// not found"** — a 404 for a property that exists. Every slug-based call to
// `/api/property/verify` and `/api/seo/readiness` has been failing this way
// since they shipped. Nobody noticed because neither endpoint had a caller.
//
// ── 2. THE VALUE IS INTERPOLATED INTO A POSTGREST FILTER ────────────
// `.or()` takes a filter *expression*, not a bound parameter. A propertyId
// containing a comma, a dot or a parenthesis rewrites the filter. Passing
// `x,owner_id.not.is.null` turns an id lookup into a scan. It is the same
// class of mistake as SQL injection, just one layer up, and no amount of
// downstream authorisation helps because the row selected is already wrong.
//
// ── THE FIX ─────────────────────────────────────────────────────────
// Decide which column to query BEFORE querying, then use `.eq()`, which binds
// its value instead of parsing it. A UUID-shaped string is an id; anything
// else is a slug. Neither path can be steered by its input.
// ─────────────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Is this string a UUID, i.e. a 'properties.id' rather than a slug? */
export function looksLikeUuid(value) {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/**
 * Columns that actually exist on 'public.properties'.
 *
 * ⚠️ VERIFIED AGAINST THE LIVE DATABASE 2026-08-06, not against a document.
 * '/api/seo/readiness' was reading 'prop.address', 'prop.photos',
 * 'prop.category', 'prop.property_type', 'prop.metadata' and 'prop.status' —
 * SIX columns, none of which exist. Every check it performed evaluated against
 * 'undefined' and returned false, so it reported every listing as un-indexable
 * with total confidence. Keep this list honest; a 'select('*')' hides the
 * problem instead of solving it, and also drags internal-only columns
 * ('lister_relationship', 'owner_claim_agreed') into scope.
 */
export const PROPERTY_PUBLIC_COLUMNS = [
  "id",
  "slug",
  "canonical_slug",
  "title",
  "description",
  "location",
  "type",
  "space_category",
  "price",
  "media_link",
  "details",
  "coordinates",
  "completeness_score",
  "verified",
  "owner_id",
  "pipeline_status",
  "lifecycle_state",
  "moderation_status",
  "last_verified_date",
  "published_at",
  "created_at",
];

/**
 * Fetch one property by uuid or slug.
 *
 * @param {object} db - a supabase client (normally supabaseAdmin)
 * @param {string} idOrSlug
 * @param {string[]|string} [columns] - defaults to PROPERTY_PUBLIC_COLUMNS
 * @returns {Promise<{property: object|null, error: Error|null}>}
 *
 * Returns '{property: null, error: null}' for "no such property" and a real
 * error object only when the query itself failed. The old code collapsed those
 * two into one 404, which is how a broken query masqueraded as a missing row
 * for weeks.
 */
export async function findProperty(db, idOrSlug, columns) {
  if (!db) return { property: null, error: new Error("No database client") };
  const key = typeof idOrSlug === "string" ? idOrSlug.trim() : "";
  if (!key) return { property: null, error: null };

  const select = Array.isArray(columns)
    ? columns.join(", ")
    : columns || PROPERTY_PUBLIC_COLUMNS.join(", ");

  // `.eq()` binds; `.or()` parses. Never interpolate into a filter expression.
  const column = looksLikeUuid(key) ? "id" : "slug";
  let { data, error } = await db.from("properties").select(select).eq(column, key).maybeSingle();

  // Slugs have two homes: `slug` is what the app generated, `canonical_slug` is
  // what Airtable's formula computed, and publish reconciles them. A live
  // listing can be reachable by either, so a miss on one is not a miss.
  if (!error && !data && column === "slug") {
    ({ data, error } = await db
      .from("properties")
      .select(select)
      .eq("canonical_slug", key)
      .maybeSingle());
  }

  if (error) return { property: null, error };
  return { property: data || null, error: null };
}
