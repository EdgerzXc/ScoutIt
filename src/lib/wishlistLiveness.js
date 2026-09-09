// ═══════════════════════════════════════════════════════════════
// SAVED-BOARD LIVENESS — A-102
//
// A saved property id is a slug. The live catalogue is the authority on
// whether that slug still resolves. Classify, never guess:
//
//   'ok'      — id present in a loaded live set: link normally.
//   'removed' — id absent from a loaded live set: render a non-link
//               "Listing removed" marker. Only this state removes a link.
//   'unknown' — everything else: liveness not loaded yet (a failed or
//               pending fetch must NEVER read as removed — Standing Rule 6),
//               broker saves (roster liveness, not catalogue liveness),
//               missing ids, and legacy UUID-shaped ids that predate slug
//               saves. Unknown renders exactly like today.
// ═══════════════════════════════════════════════════════════════

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** An empty CMS response may be an outage fallback, not proof of removal. */
export function liveSlugSet(properties) {
  const slugs = new Set(
    (properties || [])
      .map((p) => p && p.slug)
      .filter((slug) => typeof slug === "string" && slug.length > 0),
  );
  return slugs.size ? slugs : null;
}

/**
 * @param {{property_id?: string, is_broker?: boolean}|null} item
 * @param {Set<string>|null|undefined} liveSlugs
 * @returns {"ok"|"removed"|"unknown"}
 */
export function classifySavedItem(item, liveSlugs) {
  if (!item || item.is_broker || typeof item.property_id !== "string" || item.property_id.length === 0) {
    return "unknown";
  }
  if (UUID_LIKE.test(item.property_id)) return "unknown";
  if (!(liveSlugs instanceof Set)) return "unknown";
  return liveSlugs.has(item.property_id) ? "ok" : "removed";
}
