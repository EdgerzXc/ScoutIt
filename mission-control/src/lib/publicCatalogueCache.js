import "server-only";

/**
 * A-060 — let Mission Control drop the public catalogue cache.
 *
 * The public site serves properties from a single Redis key (`cms_bundle`,
 * written by the main app's `src/lib/cmsCache.js`) in front of Airtable. A
 * correction that reaches Airtable but not this key is a correction a visitor
 * does not see until the cache happens to expire — which for a wrong map pin
 * means the thing staff were trying to fix stays wrong on screen.
 *
 * This talks to Upstash over its REST API with `fetch` rather than adding
 * `@upstash/redis` to this app, matching how `airtable.js` here already speaks
 * to a service the main app uses a client for. It clears only the one key the
 * main app owns; it never writes.
 *
 * The main app also holds a 60-second in-process copy. That layer cannot be
 * reached from another deployment and is deliberately not chased: it expires on
 * its own within a minute, so the worst case is a short delay, not a stale pin.
 */

const CMS_BUNDLE_KEY = "cms_bundle";

/**
 * Drop the public catalogue cache.
 *
 * Never throws. The caller has already committed a correction to Supabase and
 * Airtable by this point, and an unreachable cache must not present itself as
 * a failed correction — but it must not present itself as a success either, so
 * the outcome is returned for the caller to record and show.
 *
 * @returns {Promise<{purged: boolean, detail: string}>}
 */
export async function purgePublicCatalogueCache() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return {
      purged: false,
      detail:
        "Upstash credentials are not set on Mission Control, so the public cache was left alone. " +
        "It refreshes on its own within a minute.",
    };
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/del/${CMS_BUNDLE_KEY}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return { purged: false, detail: `Upstash refused the purge (${res.status}).` };
    }

    return { purged: true, detail: "Public catalogue cache cleared." };
  } catch (err) {
    return { purged: false, detail: `Could not reach Upstash: ${err.message}` };
  }
}
