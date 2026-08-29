/**
 * The retention rule ScoutIt states publicly, in one place.
 *
 * Privacy section 04 and the deal-close response both promise that message
 * bodies are purged seven days after a chat closes. Until 2026-08-22 that
 * promise had no working implementation: the SQL function written for it was
 * never called by anything, and it addressed a `content` column that does not
 * exist on the live `deal_messages` table.
 */

export const CHAT_RETENTION_DAYS = 7;

/** Statuses that keep a thread under Trust & Safety hold, exempt from purging. */
export const DISPUTE_HOLD_STATUSES = Object.freeze(["open_hold", "under_review"]);

/**
 * What a purged body reads as. The row survives so the thread still shows that
 * a conversation happened; only its contents are gone.
 */
export const PURGED_BODY = "[Purged after 7 days retention policy]";

export function retentionCutoffIso(now = Date.now()) {
  return new Date(now - CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * A-041. The grounds a dispute may be filed on. A free-text-only reason cannot
 * be reported on or adjudicated consistently, and "the broker objected" is not
 * a ground — so the reason is chosen from this list and the detail is context,
 * not the claim itself.
 */
export const DISPUTE_REASONS = Object.freeze([
  "not_a_real_deal",
  "identity_or_authorship",
  "abuse_or_threat",
  "retaliation",
  "contradicted_by_record",
  "other",
]);

/** The status a newly filed dispute takes. Must be a hold status. */
export const INITIAL_DISPUTE_STATUS = "open_hold";

/** Upper bound on the free-text detail accompanying a dispute. */
export const MAX_DISPUTE_DETAILS = 2000;

/**
 * A-045. The same grounds in the words a person actually uses.
 *
 * These live beside `DISPUTE_REASONS` rather than in the component on purpose:
 * a label map kept somewhere else drifts from the list the route validates
 * against, and both directions of that drift are silent. A missing label
 * renders a ground nobody can choose; an extra one renders a ground the route
 * rejects with a 400 after the person has typed their explanation.
 */
export const DISPUTE_REASON_LABELS = Object.freeze({
  not_a_real_deal: "This was not a real transaction",
  identity_or_authorship: "The other person was not who they claimed to be",
  abuse_or_threat: "I was abused or threatened",
  retaliation: "I was punished for refusing something I was not obliged to do",
  contradicted_by_record: "What was said here contradicts what is being claimed",
  other: "Something else",
});

/**
 * A-045. What to tell someone about the window, given the deal in front of
 * them.
 *
 * The retention decision bounds a dispute by retention: a response can be
 * disputed while its thread is still readable. "A right that expires
 * unannounced is not a remedy", so this sentence has to be true for the actual
 * state of this deal rather than a single line of copy that is right in one
 * case and misleading in the other two.
 *
 * Filing is never blocked. Staff may act on evidence outside the thread, and
 * refusing to accept a late report would be a worse failure than accepting one
 * that is hard to adjudicate. What changes with the window is what ScoutIt is
 * willing to PROMISE about preserving the record.
 *
 * @param {object} input
 * @param {string} input.status    the deal's status
 * @param {string|null} input.closedAt ISO timestamp, or null
 * @param {number} [input.now]     fixed instant; never read the clock in a test
 * @returns {{state: string, daysLeft: number|null, canFile: boolean, message: string}}
 */
export function describeDisputeWindow({ status, closedAt, now = Date.now() } = {}) {
  const isOver = ["closed", "declined", "expired", "reported", "withdrawn"].includes(status);

  if (!isOver) {
    return {
      state: "before_close",
      daysLeft: null,
      canFile: true,
      message:
        `This conversation is still open, so nothing is being removed yet. When it closes, ScoutIt keeps the messages for ${CHAT_RETENTION_DAYS} days — filing before then keeps this thread protected while it is reviewed.`,
    };
  }

  // A NULL closing timestamp is not an assertion that it never closed
  // (Rule 14). Older rows predate the column, so say what is certain and
  // promise nothing that depends on a date we do not have.
  if (!closedAt) {
    return {
      state: "unknown_close",
      daysLeft: null,
      canFile: true,
      message:
        `This conversation has ended. ScoutIt keeps messages for ${CHAT_RETENTION_DAYS} days after a conversation closes, and we do not have a recorded closing date for this one — file now and the thread is protected from that moment while it is reviewed.`,
    };
  }

  // Eligibility is decided by the PURGE JOB'S OWN PREDICATE, not by a second
  // arithmetic that happens to agree today. The job selects
  // `closed_at <= retentionCutoffIso()`; asking the same question here means
  // this sentence cannot tell someone they have time left on a thread the next
  // nightly run will overwrite.
  const alreadyEligible = Date.parse(closedAt) <= Date.parse(retentionCutoffIso(now));

  const elapsedMs = now - Date.parse(closedAt);
  const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
  const daysLeft = Math.max(0, CHAT_RETENTION_DAYS - elapsedDays);

  if (alreadyEligible) {
    return {
      state: "elapsed",
      daysLeft: 0,
      canFile: true,
      message:
        `This conversation closed more than ${CHAT_RETENTION_DAYS} days ago, so its messages may already have been replaced. You can still report it — staff can act on evidence from outside the thread — but we cannot promise the messages are still here.`,
    };
  }

  // `daysLeft` cannot be 0 here: reaching zero is exactly the condition the
  // branch above catches, so there is deliberately no "today" case to write.
  const when = `in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  return {
    state: "counting",
    daysLeft,
    canFile: true,
    message:
      `These messages are due to be replaced ${when}. File now and this thread is kept, in full, for as long as the review takes.`,
  };
}
