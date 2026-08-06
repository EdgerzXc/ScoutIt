// ─────────────────────────────────────────────────────────────────────────
// PENDING REQUEST LIFECYCLE  (NEW_IDEAS.md §40.15)
//
//   Connect sent  →  7 days unanswered  →  ARCHIVED (still fully acceptable)
//                 →  30 days unanswered →  DELETED
//   Unarchiving before day 30 resets BOTH clocks to zero.
//
// ⚠️ Archiving is not expiry. §40.14 removed the 72-hour auto-expiry because a
// timer measures how busy an owner was that week, not whether they were
// interested — and destroying a paid lead on that basis is the platform
// inventing a failure and charging someone for it. Archiving respects that
// finding: an archived request is hidden, never cancelled, and an owner who
// opens their archive on day 20 can still accept it.
//
// Both windows live here because they are quoted to users in four places
// (the waiting card, the receipt, the inquiry modal, two notification bodies)
// and computed in the sweep. A "7 days" that disagrees with a "30 days"
// elsewhere is a promise the product then breaks.
// ─────────────────────────────────────────────────────────────────────────

export const ARCHIVE_AFTER_DAYS = 7;
export const DELETE_AFTER_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Days remaining before a pending request is deleted.
 * Returns null when we can't know — never a guessed number.
 *
 * @param {string|Date|null} resetAt - deals.pending_clock_reset_at
 * @param {Date} [now]
 * @returns {number|null} whole days remaining, floored at 0
 */
export function daysUntilDeletion(resetAt, now = new Date()) {
  if (!resetAt) return null;
  const started = new Date(resetAt).getTime();
  if (Number.isNaN(started)) return null;
  // Clamped at BOTH ends. Negative elapsed time is real: the reset timestamp
  // is minted by Postgres and compared against the browser's clock, so a
  // device running a few seconds slow makes a just-reset request look like it
  // started in the future — and an unclamped ceil() would then promise 31
  // days out of a 30-day window. Quoting a deadline longer than the one the
  // sweep enforces is the same class of error as inventing one.
  const elapsedDays = Math.max(0, (now.getTime() - started) / DAY_MS);
  return Math.min(DELETE_AFTER_DAYS, Math.max(0, Math.ceil(DELETE_AFTER_DAYS - elapsedDays)));
}

/**
 * Days remaining before a pending request is archived.
 * Null once it already has been (or when unknowable).
 *
 * @param {string|Date|null} resetAt
 * @param {string|Date|null} archivedAt
 * @param {Date} [now]
 * @returns {number|null}
 */
export function daysUntilArchive(resetAt, archivedAt, now = new Date()) {
  if (archivedAt) return null;
  if (!resetAt) return null;
  const started = new Date(resetAt).getTime();
  if (Number.isNaN(started)) return null;
  const elapsedDays = Math.max(0, (now.getTime() - started) / DAY_MS);
  return Math.min(ARCHIVE_AFTER_DAYS, Math.max(0, Math.ceil(ARCHIVE_AFTER_DAYS - elapsedDays)));
}

/**
 * One plain-language sentence describing what happens next, for display on
 * the waiting card. The owner asked that users be told the rule explicitly
 * rather than discovering it when a request vanishes.
 *
 * Returns null when the timing isn't known, so the UI can omit the line
 * instead of printing a fabricated deadline.
 *
 * @param {{ archivedAt?: string|null, resetAt?: string|null }} deal
 * @param {Date} [now]
 * @returns {string|null}
 */
export function lifecycleNotice({ archivedAt = null, resetAt = null }, now = new Date()) {
  if (!resetAt) return null;

  const toDelete = daysUntilDeletion(resetAt, now);
  if (toDelete === null) return null;

  if (archivedAt) {
    return toDelete === 0
      ? "Archived. This request is removed today unless it's answered — reopening it restarts the clock."
      : `Archived. They can still accept for another ${toDelete} ${toDelete === 1 ? "day" : "days"}, after which it's removed. Reopening it restarts the clock.`;
  }

  const toArchive = daysUntilArchive(resetAt, archivedAt, now);
  if (toArchive === null) return null;

  return toArchive === 0
    ? `Moves to the archive today if unanswered. It stays acceptable there until day ${DELETE_AFTER_DAYS}, then it's removed.`
    : `Moves to the archive in ${toArchive} ${toArchive === 1 ? "day" : "days"} if unanswered — still acceptable there — and is removed after ${DELETE_AFTER_DAYS} days.`;
}
