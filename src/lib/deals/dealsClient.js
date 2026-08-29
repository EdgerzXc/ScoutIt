// One deal-list request per page, instead of two.
//
// Every dashboard surface loaded /api/deals twice: DashboardContext fetched it
// for the role panels, and the page itself fetched it for its own view. A
// request trace on 2026-08-29 caught both on all three surfaces — home at
// 337ms and 454ms, the CRM at 444ms and 449ms, the Inbox at 404ms and 404ms.
// They overlap, so the second one never made the page slower; it simply asked
// the database for the same rows a second time on every single load.
//
// The fix is in-flight coalescing rather than a cache. A caller that asks
// while a request is already running joins that request; once it settles the
// next caller goes to the network as normal. No stored copy means nothing can
// go stale after a status change, an accept, or a new message — which is the
// failure a TTL cache would have introduced here.

import { crmFetch } from "../crmClient";

/** @type {Map<string, Promise<object[]>>} */
const inFlight = new Map();

/**
 * The signed-in user's deals.
 *
 * @param {{ mockUserId?: string|null }} [options] mockUserId is forwarded to
 *   crmFetch, which sends it only where the localhost development fixture is
 *   permitted; it is ignored everywhere else.
 * @returns {Promise<object[]>} the deals array, never null. Rejects the same
 *   way crmFetch does so callers keep their own error handling.
 */
export function loadDeals({ mockUserId = null } = {}) {
  // Keyed by identity: two different users must never share one response, even
  // though in practice a page only ever asks for one.
  const key = mockUserId || "session";

  const existing = inFlight.get(key);
  if (existing) return existing;

  const request = crmFetch("/api/deals", { mockUserId })
    .then((data) => data?.deals || [])
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}
