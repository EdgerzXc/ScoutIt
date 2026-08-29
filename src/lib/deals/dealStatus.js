// The one status vocabulary for deals.
//
// These buckets were previously inline arrays inside the Inbox page. Anything
// else that needed to know whether a request is still waiting on someone had
// to re-derive them, and a re-derivation that drifts is how a live request
// silently lands in the wrong state. Verified against the live `deals` table
// on 2026-08-05: there is NO check constraint on deals.status, the column
// default is 'pitching', and the live distribution is
// connected / invited / accepted.

/** Someone still owes an answer. 'invited' is the owner-invites-broker shape. */
export const WAITING_DEAL_STATUSES = Object.freeze(["pending", "invited"]);

/** The conversation is open and both sides can talk. */
export const ACTIVE_DEAL_STATUSES = Object.freeze(["active", "accepted", "connected", "pitching"]);

/**
 * Finished. 'expired' is retained only so historical rows still bucket
 * correctly — nothing writes it any more (§40.14).
 */
export const CLOSED_DEAL_STATUSES = Object.freeze(["closed", "declined", "expired", "reported", "withdrawn"]);

/**
 * A deleted request must not appear anywhere. It is filtered out before
 * bucketing rather than given a bucket: "deleted" has to mean gone to the
 * person who was told it was deleted, or the word is a lie (§40.15).
 */
export function isDeletedDeal(deal) {
  return (deal?.status ?? deal) === "deleted";
}

/**
 * §40.15: an archived request is still pending and still fully acceptable —
 * archiving moves it out of the way, it does not cancel it. So the bucket is
 * driven by archived_at, not by a separate status value.
 *
 * An unknown or missing status sorts to "closed", the safe default: it must
 * never fall through into the bucket that opens a composer and contact
 * actions.
 *
 * Accepts either shape the codebase uses (`archived_at` or `archivedAt`).
 */
export function bucketOfDeal(deal) {
  const status = deal?.status;
  if (WAITING_DEAL_STATUSES.includes(status)) {
    return deal?.archived_at || deal?.archivedAt ? "archived" : "waiting";
  }
  if (ACTIVE_DEAL_STATUSES.includes(status)) return "active";
  return "closed";
}
