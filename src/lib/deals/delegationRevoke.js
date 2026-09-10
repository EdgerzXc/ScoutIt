/**
 * ENDING A BROKER DELEGATION. One rule, one place.
 *
 * An owner hands a property to a broker and later wants it back. Until
 * 2026-09-10 there was no way to do that: `api/dashboard/units/delegate`
 * accepts only `accept` and `decline`, and both are replies to a request that
 * is still pending. Once accepted, the arrangement had no exit.
 *
 * WHY THAT MATTERED ENOUGH TO BUILD (A-131, prerequisite of A-130).
 * The owner decided that a broker needs no owner approval to run a delegated
 * listing — *"once they commit on one broker it's up to the broker how they
 * should handle it… we don't transact."* That is the right boundary, and it
 * rests entirely on the owner being able to leave. Without an exit, "no owner
 * veto" quietly becomes "no owner recourse", which is a different and much
 * worse arrangement than the one that was agreed.
 *
 * NO MIGRATION. `deals` has no close-reason column, and adding one is
 * owner-gated (O-004). A revoke is therefore recorded as an ACTIVITY ROW —
 * `delegation_revoked` — and the stale state is derived from it. That keeps
 * the audit trail honest without touching the schema.
 */

/**
 * Deal statuses that an active delegation can be sitting in.
 *
 * `connected` is here for the same reason the delegate route accepts it:
 * `create_routed_buyer_deal` wrote `connected` until 2026-08-05 and `pending`
 * after it, and historical rows were deliberately never backfilled. Matching
 * only the modern value would make an older delegation impossible to revoke,
 * silently — an empty result set looks exactly like "nothing to end".
 */
export const REVOCABLE_STATUSES = Object.freeze(["accepted", "connected", "pending"]);

/** What a revoked deal becomes. Terminal, and it stamps `closed_at`. */
export const REVOKED_STATUS = "closed";

/** The activity type that records WHY these rows closed. */
export const REVOKE_ACTIVITY = "delegation_revoked";

/**
 * Does ending the broker's arrangement also end the buyers' conversations?
 *
 * **Yes — owner decision, 2026-09-10, and it was asked explicitly because it
 * costs a third party something.** A buyer who spent a Connect and wrote in
 * good faith loses that thread through no fault of their own:
 *
 *   "conversation close. they get fired. connects get sent, meaning that is
 *    already beyond us — once the connect gets sent it's out of us. No refund
 *    unless they dispute it so intensely, but yeah most case we don't."
 *
 * The reasoning is consistent with the rest of the product: a Connect buys the
 * ACT of reaching out, never a guaranteed outcome (Standing Rule 9 — a tier
 * buys data about a property, never access to a person). The dispute path is
 * the release valve and it already exists (A-041 filing, A-044 staff review).
 *
 * ⚠️ THE PART THAT IS NOT OPTIONAL: closing is allowed, closing **silently**
 * is not. A conversation that vanishes with no explanation reads as a bug or a
 * snub, and the person it happened to is the one party who did nothing. Every
 * closed thread must carry the reason, which is why `revokePlanFor` returns
 * buyer deals as their own list rather than folding them into one bucket.
 */
export const REVOKE_CLOSES_BUYER_THREADS = true;

/** No automatic refunds. The dispute path is the exception, not a rule here. */
export const REVOKE_REFUNDS_CONNECTS = false;

/**
 * Is this deal row the broker's own delegation, or a buyer's conversation that
 * the broker was handling?
 *
 * The distinction is not cosmetic: they close for the same reason but they are
 * told different things, and only the first is a relationship ending.
 */
export function isDelegationRow(deal, brokerId) {
  return deal?.broker_id === brokerId && !deal?.buyer_id;
}

/**
 * Everything a revoke must touch, computed before anything is written.
 *
 * Returning a PLAN rather than performing the writes is deliberate: the caller
 * can count the blast radius, show it, and log it — and a test can assert on
 * the decision without a database.
 *
 * @param {object} input
 * @param {Array}  input.deals    every deal row for this property
 * @param {string} input.brokerId the broker being removed
 * @returns {{delegationDealIds: string[], buyerDealIds: string[], allDealIds: string[], total: number}}
 */
export function revokePlanFor({ deals = [], brokerId = "" } = {}) {
  const mine = (deals || []).filter(
    (d) => d && d.broker_id === brokerId && REVOCABLE_STATUSES.includes(d.status)
  );
  const delegationDealIds = mine.filter((d) => isDelegationRow(d, brokerId)).map((d) => d.id);
  const buyerDealIds = mine.filter((d) => !isDelegationRow(d, brokerId)).map((d) => d.id);
  return {
    delegationDealIds,
    buyerDealIds,
    allDealIds: [...delegationDealIds, ...buyerDealIds],
    total: delegationDealIds.length + buyerDealIds.length,
  };
}

/**
 * What the broker keeps afterwards.
 *
 * Owner decision, 2026-09-10, and it is two answers rather than one:
 *
 *   "they shouldn't be named in their property listing, but on broker's lens
 *    the property listing should still be there — but like stale property
 *    cards. We need to state there that they are no longer connected."
 *
 * A broker's record of what they worked on is theirs; the public listing must
 * stop asserting a relationship that ended. Deleting the rows would have got
 * the second right and the first wrong. (The public property page never named
 * a broker in the first place — verified 2026-09-10 — so nothing is removed
 * there; this keeps it true rather than making it true.)
 */
export const BROKER_KEEPS_STALE_CARD = true;

/** The one sentence a stale card must say. Stated once so it cannot drift. */
export function staleCardNotice(propertyTitle = "") {
  const what = String(propertyTitle || "").trim() || "This property";
  return `${what} — you are no longer connected to this listing.`;
}

/** What the buyer is told, so a closed thread is never an unexplained gap. */
export function revokedThreadNotice() {
  return "This conversation closed because the owner ended their arrangement with this broker.";
}
