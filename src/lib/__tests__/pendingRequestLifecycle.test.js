import { describe, it, expect } from 'vitest';
import {
  ARCHIVE_AFTER_DAYS,
  DELETE_AFTER_DAYS,
  daysUntilArchive,
  daysUntilDeletion,
  lifecycleNotice,
} from '../pendingRequestLifecycle.js';

// These numbers are quoted to users in five places and acted on by the sweep
// cron. If the maths here disagrees with the sweep, ScoutIt tells someone
// their request has "3 days left" and then deletes it that night.

const DAY = 24 * 60 * 60 * 1000;

// A FIXED reference instant, not `new Date()` at call time.
//
// The first version of this file derived `ago()` from Date.now() while `NOW`
// was captured at module load. The few milliseconds between them meant "10
// days ago" was really 9.9999 days ago, and a ceil() then reported 21 days
// remaining instead of 20 — a test that failed for a reason that had nothing
// to do with the behaviour under test. Anchoring both to one instant makes
// these assertions exact and repeatable.
const NOW = new Date('2026-08-05T12:00:00.000Z');
const ago = (days) => new Date(NOW.getTime() - days * DAY).toISOString();
const justNow = () => NOW.toISOString();

describe('the two windows', () => {
  it('archives before it deletes — the whole point of archiving', () => {
    expect(ARCHIVE_AFTER_DAYS).toBeLessThan(DELETE_AFTER_DAYS);
  });

  it('leaves a usable window to act in after archiving', () => {
    // If these ever converge, archiving stops being a warning and becomes a
    // formality immediately before deletion.
    expect(DELETE_AFTER_DAYS - ARCHIVE_AFTER_DAYS).toBeGreaterThanOrEqual(14);
  });
});

describe('daysUntilDeletion', () => {
  it('is the full window for a request sent just now', () => {
    expect(daysUntilDeletion(justNow(), NOW)).toBe(DELETE_AFTER_DAYS);
  });

  it('counts down as the request ages', () => {
    expect(daysUntilDeletion(ago(10), NOW)).toBe(DELETE_AFTER_DAYS - 10);
  });

  it('floors at 0 rather than going negative', () => {
    // A "-4 days left" on screen is worse than nothing.
    expect(daysUntilDeletion(ago(45), NOW)).toBe(0);
  });

  it('never promises more than the full window, even if the clock is skewed', () => {
    // Postgres mints the reset timestamp; the browser reads it. A device
    // running slow makes a just-reset request look like it starts in the
    // future. Unclamped, that promised 31 days out of a 30-day window.
    const future = new Date(NOW.getTime() + 5 * DAY).toISOString();
    expect(daysUntilDeletion(future, NOW)).toBe(DELETE_AFTER_DAYS);
  });

  it.each([[null], [undefined], ['not-a-date']])(
    'returns null for unusable input (%s) instead of guessing',
    (input) => {
      expect(daysUntilDeletion(input, NOW)).toBeNull();
    },
  );
});

describe('daysUntilArchive', () => {
  it('is the archive window for a fresh request', () => {
    expect(daysUntilArchive(justNow(), null, NOW)).toBe(ARCHIVE_AFTER_DAYS);
  });

  it('returns null once already archived — there is no second archiving', () => {
    expect(daysUntilArchive(ago(3), ago(1), NOW)).toBeNull();
  });
});

describe('lifecycleNotice — what the user is actually told', () => {
  it('warns about the archive step while still unarchived', () => {
    const notice = lifecycleNotice({ archivedAt: null, resetAt: ago(2) }, NOW);
    expect(notice).toMatch(/archive/i);
    expect(notice).toContain(String(DELETE_AFTER_DAYS));
  });

  it('switches to the deletion countdown once archived, and mentions reopening', () => {
    const notice = lifecycleNotice({ archivedAt: ago(1), resetAt: ago(8) }, NOW);
    expect(notice).toMatch(/archived/i);
    expect(notice).toMatch(/reopen/i);
    // Must still say it can be accepted -- archiving is not cancellation.
    expect(notice).toMatch(/accept/i);
  });

  it('never promises a deadline it cannot compute', () => {
    expect(lifecycleNotice({ archivedAt: null, resetAt: null }, NOW)).toBeNull();
  });

  it('does not render a negative or nonsensical count when overdue', () => {
    const notice = lifecycleNotice({ archivedAt: ago(20), resetAt: ago(40) }, NOW);
    expect(notice).not.toMatch(/-\d/);
  });

  // A reset is what "reopening" does. If the notice didn't move with it, the
  // user would reopen a request and still see it about to be deleted.
  it('reflects a clock reset immediately', () => {
    const stale = lifecycleNotice({ archivedAt: null, resetAt: ago(6) }, NOW);
    const reset = lifecycleNotice({ archivedAt: null, resetAt: new Date().toISOString() }, NOW);
    expect(stale).not.toBe(reset);
    expect(daysUntilDeletion(justNow(), NOW)).toBe(DELETE_AFTER_DAYS);
  });
});
