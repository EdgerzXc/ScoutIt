import { describe, it, expect } from 'vitest';
import {
  ageInYears,
  statusFromDateOfBirth,
  profileIsEligible,
  isGrandfathered,
  AGE_GATE_CUTOFF,
  MINIMUM_AGE,
} from '../adultEligibility.js';

// This gate exists for legal capacity (Civil Code 18+, RA 8792). The previous
// implementation failed OPEN in two ways (§47.2), so the assertions that
// matter most here are the ones proving it now fails CLOSED.

const NOW = new Date('2026-08-06T12:00:00.000Z');
const before = new Date(AGE_GATE_CUTOFF.getTime() - 86_400_000).toISOString();
const after = new Date(AGE_GATE_CUTOFF.getTime() + 86_400_000).toISOString();

describe('ageInYears — calendar-correct, not 365.25', () => {
  it('counts a birthday that has already passed this year', () => {
    expect(ageInYears('2000-01-01', NOW)).toBe(26);
  });

  // The reason not to divide by 365.25: someone turning 18 tomorrow is 17.
  it('does NOT count a birthday still to come this year', () => {
    expect(ageInYears('2000-12-31', NOW)).toBe(25);
  });

  it('counts the birthday itself as the new age', () => {
    expect(ageInYears('2008-08-06', NOW)).toBe(18);
  });

  it('is one year short the day before an 18th birthday', () => {
    expect(ageInYears('2008-08-07', NOW)).toBe(17);
  });

  it.each([[null], [undefined], [''], ['not-a-date']])(
    'returns null for unusable input (%s)',
    (input) => expect(ageInYears(input, NOW)).toBeNull(),
  );

  it('rejects a future birth date rather than returning a negative age', () => {
    expect(ageInYears('2030-01-01', NOW)).toBeNull();
  });
});

describe('statusFromDateOfBirth', () => {
  it('accepts an adult and returns declared_adult', () => {
    const r = statusFromDateOfBirth('1990-05-04', NOW);
    expect(r.ok).toBe(true);
    expect(r.status).toBe('declared_adult');
  });

  it(`accepts someone exactly ${MINIMUM_AGE} today`, () => {
    expect(statusFromDateOfBirth('2008-08-06', NOW).ok).toBe(true);
  });

  // The boundary that decides whether a minor gets in.
  it(`rejects someone one day short of ${MINIMUM_AGE}`, () => {
    const r = statusFromDateOfBirth('2008-08-07', NOW);
    expect(r.ok).toBe(false);
    expect(r.status).toBe('underage');
  });

  it('returns underage — not unknown — so the answer can be persisted', () => {
    // Rejecting without recording would let someone retry with a new date.
    expect(statusFromDateOfBirth('2015-01-01', NOW).status).toBe('underage');
  });

  it.each([[null], [''], ['garbage'], ['2030-01-01']])(
    'rejects unusable input (%s) without guessing',
    (input) => {
      const r = statusFromDateOfBirth(input, NOW);
      expect(r.ok).toBe(false);
      expect(r.status).toBe('unknown');
    },
  );

  it('rejects an implausible year, catching a mistyped date', () => {
    expect(statusFromDateOfBirth('1850-01-01', NOW).ok).toBe(false);
  });
});

describe('profileIsEligible — must fail CLOSED', () => {
  it('denies a missing profile', () => {
    expect(profileIsEligible(null)).toBe(false);
    expect(profileIsEligible(undefined)).toBe(false);
  });

  it('allows a positive attestation', () => {
    expect(profileIsEligible({ adult_eligibility_status: 'declared_adult', created_at: after })).toBe(true);
    expect(profileIsEligible({ adult_eligibility_status: 'verified_adult', created_at: after })).toBe(true);
  });

  it('denies underage even on a grandfathered account', () => {
    // Nobody gets in on a technicality because their account is old.
    expect(profileIsEligible({ adult_eligibility_status: 'underage', created_at: before })).toBe(false);
  });

  it('denies unknown on a NEW account', () => {
    expect(profileIsEligible({ adult_eligibility_status: 'unknown', created_at: after })).toBe(false);
  });

  // Owner decision 2026-08-06: the 40 pre-existing accounts are grandfathered.
  it('allows unknown on an account predating the cutoff', () => {
    expect(profileIsEligible({ adult_eligibility_status: 'unknown', created_at: before })).toBe(true);
  });

  it('denies an unrecognised status on a new account — the old bug', () => {
    // The previous `!== "underage"` test passed anything unexpected.
    expect(profileIsEligible({ adult_eligibility_status: 'wibble', created_at: after })).toBe(false);
  });

  it('denies when created_at is missing and status is unknown', () => {
    expect(profileIsEligible({ adult_eligibility_status: 'unknown' })).toBe(false);
  });

  it('exempts seeded example accounts so demo flows are not blocked', () => {
    expect(profileIsEligible({ adult_eligibility_status: 'unknown', is_example_account: true })).toBe(true);
  });
});

describe('isGrandfathered', () => {
  it('is true before the cutoff, false after', () => {
    expect(isGrandfathered(before)).toBe(true);
    expect(isGrandfathered(after)).toBe(false);
  });

  it.each([[null], [undefined], ['garbage']])(
    'is false for an unusable created_at (%s) — deny, do not assume old',
    (input) => expect(isGrandfathered(input)).toBe(false),
  );

  // If the cutoff ever moves forward, accounts created after the gate existed
  // would be retroactively excused. That must never happen silently.
  it('the cutoff is a fixed instant in the past, not a rolling window', () => {
    expect(AGE_GATE_CUTOFF.toISOString()).toBe('2026-08-06T00:00:00.000Z');
    expect(AGE_GATE_CUTOFF.getTime()).toBeLessThan(Date.now() + 86_400_000);
  });
});
