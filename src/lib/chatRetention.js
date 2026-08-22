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
