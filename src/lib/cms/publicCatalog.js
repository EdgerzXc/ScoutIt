// One public-catalogue request per page, instead of one per component.
//
// /api/cms is fetched by whichever components happen to be mounted, and two of
// them often land on the same page: DiscoverClient with DiscoverSearch, the
// Intel page with OSINTFlashTicker. A production trace on 2026-08-29 caught
// both pages fetching the same 72 KB catalogue twice on a single load.
//
// The 60-second cache header means the second fetch is usually cheap, but
// "cheap" is not "free": it is still a request, a parse, and a second copy of
// the same array in memory. Concurrent callers now share one.
//
// In-flight coalescing, not a store — the same choice made for the deal list.
// Freshness stays entirely the cache header's job, so there is no second,
// invisible expiry rule to reason about. This only collapses the mount burst.

/** @type {Map<string, Promise<object>>} */
const inFlight = new Map();

/**
 * Builds the public-scope catalogue URL.
 *
 * `scope=public` is not optional here: it is what makes the response
 * cacheable, because it tells the route to strip premium fields for every
 * caller rather than resolving the session. Anything needing tier-resolved
 * data must call /api/cms itself and must not use this module.
 *
 * @param {{radius?: string|number, lng?: number, lat?: number}} [params]
 */
export function publicCatalogUrl({ radius, lng, lat } = {}) {
  const search = new URLSearchParams({ scope: "public" });
  if (radius !== undefined && radius !== null && radius !== "") {
    search.set("radius", String(radius));
    if (lng !== undefined && lng !== null) search.set("lng", String(lng));
    if (lat !== undefined && lat !== null) search.set("lat", String(lat));
  }
  return `/api/cms?${search.toString()}`;
}

/**
 * The public catalogue bundle: properties, intel, brokers, homepage.
 *
 * @param {{radius?: string|number, lng?: number, lat?: number}} [params]
 * @returns {Promise<object>} the parsed bundle. Rejects on a non-OK response so
 *   callers keep their own fallback behaviour.
 */
export function loadPublicCatalog(params) {
  // Keyed by the full URL: a radius search is a different question with a
  // different answer, and must never be served the unfiltered result.
  const url = publicCatalogUrl(params);

  const existing = inFlight.get(url);
  if (existing) return existing;

  const request = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Catalogue request failed (${res.status})`);
      return res.json();
    })
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, request);
  return request;
}
