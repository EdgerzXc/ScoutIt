/**
 * Visitor contact-message retention, stated once.
 *
 * OWNER DECISION 2026-09-09 (A-002): a resolved visitor support message is
 * kept for seven days, and then its personal fields are cleared. The row
 * survives — a support queue with no history of having answered anyone is not
 * an auditable queue — but the person who wrote it stops being identifiable
 * from it.
 *
 * WHY THIS IS A SEPARATE MODULE FROM `chatRetention.js`, and must stay one:
 * Standing Rule 9. A handshake chat is two identified parties transacting
 * after a Connect is spent. This is an anonymous stranger asking a question.
 * The two must never share a code path, and a shared retention constant would
 * be the first step towards sharing one — a change to the chat window would
 * silently move the contact window with it.
 *
 * WHAT IS DELIBERATELY NOT CLEARED, and is not an oversight:
 *   `message` / `subject`  — the operational record of what was asked and
 *                            answered. The owner's decision names personal
 *                            FIELDS; a body that happens to contain a phone
 *                            number the sender typed is a different question,
 *                            and it belongs with counsel (O-003 / W-009).
 *   `user_id`              — a signed-in sender's identity already lives in
 *                            their account, which has its own erasure path
 *                            (A-075). Nulling it here would hide their message
 *                            from that path rather than clear anything.
 *   `staff_notes`          — written by staff about the handling, not by or
 *                            about the sender.
 */

/** The window, in days. This number is also published on /privacy. */
export const CONTACT_RETENTION_DAYS = 7;

/**
 * Only a RESOLVED message is a candidate. `new` and `in_progress` are still
 * being worked and clearing the sender's email would make the answer
 * undeliverable; `spam` is deliberately not swept by this rule because the
 * owner's decision names resolved messages and inventing a second policy for
 * spam would be inventing policy.
 */
export const CLEARABLE_CONTACT_STATUSES = Object.freeze(["resolved"]);

/**
 * What a cleared field reads as. Not an empty string: `name` and `email` are
 * NOT NULL on the live table, and a blank would render as a nameless message
 * that looks like a bug rather than a kept promise.
 */
export const CLEARED_NAME = "[Cleared after 7 days]";
export const CLEARED_EMAIL = "cleared@retention.invalid";

/**
 * The exact patch applied to an expired message. Exported so the test asserts
 * the same object the job writes, rather than a restatement of it.
 */
export const CONTACT_CLEARED_PATCH = Object.freeze({
  name: CLEARED_NAME,
  email: CLEARED_EMAIL,
  ip_hash: null,
  user_agent: null,
});

/**
 * The cutoff, measured from when the message was RESOLVED (`handled_at`), not
 * from when it arrived. A message that sat in the queue for three weeks before
 * anyone answered it must still be readable for seven days after the answer.
 */
export function contactRetentionCutoffIso(now = Date.now()) {
  return new Date(now - CONTACT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * True once this message's personal fields have already been cleared. Used to
 * keep the job idempotent without depending on a flag column that does not
 * exist on the live table.
 */
export function isContactMessageCleared(row) {
  return row?.email === CLEARED_EMAIL && row?.name === CLEARED_NAME;
}

/**
 * The sentence ScoutIt publishes about this. One string, so the promise on the
 * form, the promise on /privacy and the behaviour of the job cannot drift into
 * three different numbers.
 */
export const CONTACT_RETENTION_NOTICE =
  `Once we have answered and closed your message, we keep your name and email for ${CONTACT_RETENTION_DAYS} days and then clear them. The question and our answer stay on file without them.`;
