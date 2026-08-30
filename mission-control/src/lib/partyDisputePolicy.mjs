/**
 * A-061 — the one place that knows how a party-filed dispute and a staff
 * mediation record correspond.
 *
 * `deal_disputes` (main site) and `disputes` (this console) were built by
 * different hands with different status vocabularies. The mapping between them
 * is not decoration: `deal_disputes.status` decides whether the nightly chat
 * purge spares a thread, so a wrong or drifting mapping does not merely
 * mislabel a queue — it deletes the evidence a dispute exists to weigh.
 *
 * This module is pure and dependency-free so the mapping can be tested without
 * a database, and so both the server actions and the queue page read the same
 * table rather than each restating it.
 */

/**
 * Statuses that keep a thread exempt from the seven-day purge.
 *
 * Mirrors `DISPUTE_HOLD_STATUSES` in the main site's `src/lib/chatRetention.js`.
 * The two apps are separate packages and cannot import from each other, so the
 * copy is guarded by a test that reads the main site's module and fails if the
 * lists ever diverge.
 */
export const PARTY_HOLD_STATUSES = Object.freeze(["open_hold", "under_review"]);

/** The status a filing arrives with. Must be a hold status. */
export const PARTY_INITIAL_STATUS = "open_hold";

/** Statuses a party dispute can end in. Neither holds the thread. */
export const PARTY_CLOSED_STATUSES = Object.freeze(["resolved", "dismissed"]);

/**
 * The grounds a party can file on, in the words they were shown.
 *
 * Mirrors `DISPUTE_REASON_LABELS` in the main site's `src/lib/chatRetention.js`,
 * guarded by the same drift test. A ground rendered as a raw enum in the staff
 * queue is a ground a mediator reads as a code rather than as an accusation.
 */
export const PARTY_REASON_LABELS = Object.freeze({
  not_a_real_deal: "This was not a real transaction",
  identity_or_authorship: "The other person was not who they claimed to be",
  abuse_or_threat: "I was abused or threatened",
  retaliation: "I was punished for refusing something I was not obliged to do",
  contradicted_by_record: "What was said here contradicts what is being claimed",
  other: "Something else",
});

/** Does this `deal_disputes.status` currently protect the thread? */
export function holdsThread(status) {
  return PARTY_HOLD_STATUSES.includes(status);
}

/**
 * The `disputes.status` a mirror row takes for a given party status, so the
 * adopted filing sorts and renders like every other item in the hub.
 */
export function mirrorStatusFor(partyStatus) {
  switch (partyStatus) {
    case "open_hold":
      return "open";
    case "under_review":
      return "investigating";
    case "resolved":
      return "resolved";
    case "dismissed":
      return "dismissed";
    default:
      return "open";
  }
}

/**
 * The `deal_disputes.status` a console transition writes back.
 *
 * `claim` deliberately stays inside the hold set: taking mediation must never
 * be the act that makes a thread purgeable. Only a close does that, and a
 * close is Ops Manager gated and requires a written resolution.
 */
export function partyStatusForTransition(transition) {
  switch (transition) {
    case "claim":
      return "under_review";
    case "resolved":
      return "resolved";
    case "dismissed":
      return "dismissed";
    default:
      throw new Error(`Unknown dispute transition: ${transition}`);
  }
}

/**
 * Does this transition release the retention hold? Used to say so out loud —
 * in the mediation thread, in the audit entry, and on the button itself.
 * Staff closing a dispute are deciding the fate of the conversation record,
 * and a consequence nobody is told about is a consequence nobody weighed.
 */
export function releasesHold(transition) {
  return !holdsThread(partyStatusForTransition(transition));
}

/** A readable title for an adopted filing, since a party never wrote one. */
export function titleForFiling({ reason, dealId }) {
  const ground = PARTY_REASON_LABELS[reason] || "Dispute filed by a party";
  const ref = typeof dealId === "string" ? dealId.slice(0, 8) : "";
  return ref ? `${ground} (deal ${ref})` : ground;
}
