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
 * A-144 §10.10 — manual dashboard creation is a paid Connect action that must
 * start a request, never manufacture a relationship. Only waiting states may
 * be created this way; accepted/connected/active/closed states from a client
 * value are forged outcomes and fail before any spend.
 */
export const MANUAL_DEAL_CREATABLE_STATUSES = Object.freeze(["pending", "invited"]);

export function isManualCreatableStatus(status) {
  return MANUAL_DEAL_CREATABLE_STATUSES.includes(status);
}

/**
 * A-144 §10.10 — chat is an accepted-relationship act. Waiting rows
 * (pending/invited) and finished rows (closed/declined/withdrawn/...) cannot
 * post; the open conversation states can, for 0 Connects.
 */
export function canPostInDealStatus(status) {
  return ACTIVE_DEAL_STATUSES.includes(status);
}

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
