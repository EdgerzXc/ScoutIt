// ═══════════════════════════════════════════════════════════════
// PROPERTY FRESHNESS & STALENESS  (NEW_IDEAS.md §21)
// Full spec: _SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PROPERTY_FRESHNESS_AND_STALENESS_SPEC.md
//
// Stale inventory destroys buyer trust faster than a missing feature. This
// is the Honest Data Doctrine applied to time: a listing that hasn't been
// touched in six months should LOOK like one, publicly, whether or not the
// owner likes it.
//
// ── WHY THIS EXISTS NOW ─────────────────────────────────────────────
// /api/cron/check-stale-listings has been running daily and telling owners
// "Re-confirm its details to keep it trustworthy" — while no re-confirm UI
// existed anywhere in the app. The notification was a dead end. This module
// plus the verify endpoint and the modal close that loop.
//
// ── HONEST BLANK ────────────────────────────────────────────────────
// A listing with NO verification date is "unverified", not "fresh". Never
// treat missing data as good news. Defaulting an unknown to fresh is how a
// directory quietly fills with rot.
//
// Source of truth is Airtable's Last_Verified_Date (AGENTS.md §2) — the
// same field /api/cron/check-stale-listings already reads.
// ═══════════════════════════════════════════════════════════════

const DAY_MS = 24 * 60 * 60 * 1000;

// Thresholds in days, from the spec. Order matters — first match wins.
export const FRESHNESS_TIERS = [
  {
    id: "fresh",
    maxDays: 30,
    label: "Verified Fresh",
    badge: "🥇",
    color: "#7fbf7f",
    accent: "rgba(127, 191, 127, 0.30)",
    bg: "rgba(127, 191, 127, 0.07)",
    rankModifier: 0,
    ownerNote: "Verified within the last 30 days. Top placement in discovery.",
    publicNotice: null,
  },
  {
    id: "warning",
    maxDays: 60,
    label: "Re-Verification Due",
    badge: "⚠️",
    color: "#E8AE3C",
    accent: "rgba(232, 174, 60, 0.32)",
    bg: "rgba(232, 174, 60, 0.07)",
    rankModifier: -1,
    ownerNote: "Over 30 days since last verified. Confirm to restore top placement.",
    publicNotice: null,
  },
  {
    id: "stale",
    maxDays: 180,
    label: "Unverified Status",
    badge: "🟧",
    color: "#d98842",
    accent: "rgba(217, 136, 66, 0.32)",
    bg: "rgba(217, 136, 66, 0.07)",
    rankModifier: -2,
    ownerNote: "Over 60 days unverified. Search ranking reduced until re-confirmed.",
    publicNotice: null,
  },
  {
    id: "outdated",
    maxDays: Infinity,
    label: "High Staleness Risk",
    badge: "🚨",
    color: "#e06c6c",
    accent: "rgba(224, 108, 108, 0.34)",
    bg: "rgba(224, 108, 108, 0.07)",
    rankModifier: -3,
    ownerNote: "Over 6 months unverified. A public notice is showing on this listing.",
    // The only tier that warns BUYERS. Past six months, silence would be a
    // representation that the data still holds — and it may not.
    publicNotice:
      "Notice: Last verified over 6 months ago. Specs or availability may have changed.",
  },
];

// A listing that has never been verified. Deliberately NOT "fresh".
export const UNVERIFIED_TIER = {
  id: "unverified",
  maxDays: null,
  label: "Never Verified",
  badge: "⬦",
  color: "#8a8a8a",
  accent: "rgba(138, 138, 138, 0.28)",
  bg: "rgba(138, 138, 138, 0.05)",
  rankModifier: -2,
  ownerNote: "This listing has never been verified. Confirm its details to earn a freshness badge.",
  publicNotice: null,
};

export const STALE_AFTER_DAYS = 30;

/**
 * Whole days since a verification date.
 * @returns {number|null} null when the date is missing or unparseable
 */
export function daysSinceVerified(lastVerifiedDate, now = Date.now()) {
  if (!lastVerifiedDate) return null;
  const ms = new Date(lastVerifiedDate).getTime();
  if (Number.isNaN(ms)) return null;
  // A future date is nonsense (clock skew, a fat-fingered Airtable entry).
  // Clamp to 0 rather than reporting negative age.
  return Math.max(0, Math.floor((now - ms) / DAY_MS));
}

/**
 * The freshness tier for a listing.
 *
 * @param {string|Date|null} lastVerifiedDate
 * @param {number} [now]
 * @returns {object} a tier object, plus `days`
 */
export function getFreshness(lastVerifiedDate, now = Date.now()) {
  const days = daysSinceVerified(lastVerifiedDate, now);
  if (days === null) return { ...UNVERIFIED_TIER, days: null };

  const tier = FRESHNESS_TIERS.find((t) => days < t.maxDays) || FRESHNESS_TIERS[FRESHNESS_TIERS.length - 1];
  return { ...tier, days };
}

/**
 * Does this listing need the owner's attention in the monthly audit?
 * True for anything past 30 days AND for anything never verified.
 */
export function needsReverification(lastVerifiedDate, now = Date.now()) {
  const { id } = getFreshness(lastVerifiedDate, now);
  return id !== "fresh";
}

/**
 * Human age string for badges. "Verified today" reads better than "0d".
 */
export function freshnessAgeLabel(lastVerifiedDate, now = Date.now()) {
  const days = daysSinceVerified(lastVerifiedDate, now);
  if (days === null) return "Never verified";
  if (days === 0) return "Verified today";
  if (days === 1) return "Verified yesterday";
  if (days < 30) return `Verified ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "Verified 1 month ago";
  if (months < 12) return `Verified ${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? "Verified over a year ago" : `Verified over ${years} years ago`;
}

/**
 * Splits a portfolio into what needs attention and what doesn't. Powers the
 * monthly audit modal.
 *
 * @param {Array<{slug?: string, lastVerifiedDate?: string}>} listings
 * @param {number} [now]
 */
export function auditPortfolio(listings = [], now = Date.now()) {
  const rows = (listings || []).map((l) => ({
    ...l,
    freshness: getFreshness(l.lastVerifiedDate ?? l.last_verified_date, now),
  }));

  // Worst first — but "worst" is severity, not raw age. A never-verified
  // listing has no age at all, yet an outdated one is actively showing a
  // public buyer warning and costing trust every day it sits there. Sorting
  // by age alone floats the never-verified rows above the ones doing real
  // damage. Order by tier severity, then by age within a tier.
  const SEVERITY = { outdated: 0, stale: 1, unverified: 2, warning: 3, fresh: 4 };

  const needsAttention = rows
    .filter((r) => r.freshness.id !== "fresh")
    .sort((a, b) => {
      const bySeverity = SEVERITY[a.freshness.id] - SEVERITY[b.freshness.id];
      if (bySeverity !== 0) return bySeverity;
      return (b.freshness.days ?? 0) - (a.freshness.days ?? 0);
    });

  return {
    all: rows,
    needsAttention,
    freshCount: rows.length - needsAttention.length,
    total: rows.length,
  };
}

export default getFreshness;
