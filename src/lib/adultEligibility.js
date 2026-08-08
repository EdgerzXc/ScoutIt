// ─────────────────────────────────────────────────────────────────────────
// ADULT ELIGIBILITY — the 18+ legal capacity gate
// NEW_IDEAS.md §34.2 · §47 · §48
//
// Legal basis: Civil Code of the Philippines (capacity to contract requires
// 18+), RA 8792 (E-Commerce Act — contracts need legally capacitated
// parties), RA 10173 (birth date is sensitive personal information).
//
// ── OWNER DECISION 2026-08-06: NEW SIGNUPS ONLY ──
// The 40 accounts that existed before the gate went live are grandfathered.
// They were never asked, and retroactively blocking them from contacting
// anyone would break live conversations with no warning.
//
// Implemented as a CUTOFF DATE rather than a flag, which matters:
//   · accounts created BEFORE the cutoff  → allowed even when `unknown`
//   · accounts created AFTER  the cutoff  → must have attested
//
// A blanket "allow unknown" would have left the hole open forever, so every
// future signup that slipped past onboarding would also pass. The cutoff
// closes on its own — the grandfathered set can only shrink.
//
// ⚠️ RESIDUAL RISK, ACCEPTED KNOWINGLY: the grandfathered 40 are exactly the
// accounts already transacting. If the gate's purpose is legal capacity for
// contracts, those are the ones it would most want to cover. Recorded here
// rather than argued away — revisit before payments go live.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Accounts created before this instant are grandfathered.
 *
 * Set to when the DOB column shipped. Do NOT move it later — that would
 * retroactively grandfather accounts created after the gate existed, which is
 * the failure mode this constant is designed to prevent.
 */
export const AGE_GATE_CUTOFF = new Date("2026-08-06T00:00:00.000Z");

export const MINIMUM_AGE = 18;

/** Statuses that count as a positive adult attestation. */
export const ADULT_STATUSES = new Set(["declared_adult", "verified_adult"]);

/**
 * Whole years elapsed between a birth date and 'now'.
 *
 * Calendar-correct: compares month and day rather than dividing by 365.25,
 * so someone whose birthday is tomorrow is not counted as already older. On a
 * gate where a day either side is the difference between a minor and an adult,
 * an approximation is not good enough.
 *
 * @param {string|Date} dob
 * @param {Date} [now]
 * @returns {number|null} null when the input is unusable
 */
export function ageInYears(dob, now = new Date()) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  if (birth > now) return null; // future birth date — not a typo we should tolerate

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Turns a submitted birth date into the status to store.
 *
 * @param {string|Date} dob
 * @param {Date} [now]
 * @returns {{ ok: boolean, status: string, age: number|null, error?: string }}
 */
export function statusFromDateOfBirth(dob, now = new Date()) {
  const age = ageInYears(dob, now);

  if (age === null) {
    return { ok: false, status: "unknown", age: null, error: "Enter a valid date of birth." };
  }
  // 130 rather than a tighter bound: the point is to catch a mistyped year
  // (1902 for 1992), not to adjudicate anyone's longevity.
  if (age > 130) {
    return { ok: false, status: "unknown", age, error: "Enter a valid date of birth." };
  }
  if (age < MINIMUM_AGE) {
    // Recorded, not just rejected. Someone who states they are underage must
    // not be able to retry with a different date and slip through.
    return {
      ok: false,
      status: "underage",
      age,
      error: `You must be at least ${MINIMUM_AGE} to use ScoutIt.`,
    };
  }
  return { ok: true, status: "declared_adult", age };
}

/**
 * The gate itself. Decides whether a profile may transact.
 *
 * Pure so it can be tested without a database; the async wrapper that loads
 * the profile lives in serverAuth.js.
 *
 * @param {{ adult_eligibility_status?: string, created_at?: string, is_example_account?: boolean }} profile
 * @returns {boolean}
 */
export function profileIsEligible(profile) {
  if (!profile) return false;                      // no profile = no decision = deny
  if (profile.is_example_account === true) return true; // seeded demo accounts

  // An explicit 'underage' is always a hard no, grandfathered or not. Nobody
  // gets in on a technicality because their account happens to be old.
  if (profile.adult_eligibility_status === "underage") return false;

  if (ADULT_STATUSES.has(profile.adult_eligibility_status)) return true;

  // Status is 'unknown' (or unrecognised). Grandfathered only if the account
  // predates the gate.
  return isGrandfathered(profile.created_at);
}

/**
 * @param {string|Date|null} createdAt
 * @returns {boolean}
 */
export function isGrandfathered(createdAt) {
  if (!createdAt) return false; // unknown creation date → not grandfathered
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created < AGE_GATE_CUTOFF;
}
