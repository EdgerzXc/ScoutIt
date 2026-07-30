import { describe, it, expect } from 'vitest';
import {
  lowestCurrencyAmount,
  lowestPlainNumber,
  currencyTwin,
  deriveNumericTwins,
} from '../numericTwins.js';

// These numbers drive Airtable's filters. A wrong value here is invisible to
// everyone and silently corrupts every price search, so the bar is: parse
// confidently or return null. Never guess.

describe('lowestCurrencyAmount — only money counts', () => {
  it.each([
    ['Php 850/sqm/mo', 850],
    ['PHP1,200/sqm/mo', 1200],
    ['₱ 95 per sqm', 95],
    ['P 5,000/slot/mo', 5000],
    ['Php 1,250.50/sqm', 1250.5],
  ])('%s -> %s', (input, expected) => {
    expect(lowestCurrencyAmount(input)).toBe(expected);
  });

  it('takes the LOWEST of several rates, matching the "from" semantics', () => {
    expect(lowestCurrencyAmount('Php 900 low zone; Php 1,150 high zone')).toBe(900);
  });

  // THE BUG THIS MODULE EXISTS FOR. "24/7" and "12/7" are operating hours.
  // A naive lowest-number parse returns 7 and prices this space at ₱7/sqm.
  it('never mistakes an operating-hours ratio for a price', () => {
    const real = 'Php 116/sqm/mo 12/7; Php 197 24/7';
    expect(lowestCurrencyAmount(real)).toBe(116);
    expect(lowestCurrencyAmount(real)).not.toBe(7);
  });

  it('returns null when there is no money in the string', () => {
    expect(lowestCurrencyAmount('Metered')).toBeNull();
    expect(lowestCurrencyAmount('')).toBeNull();
    expect(lowestCurrencyAmount(null)).toBeNull();
  });
});

describe('lowestPlainNumber — for non-money quantities', () => {
  it('takes the low end of a floor-plate range', () => {
    expect(lowestPlainNumber('1,200 - 1,800 sqm')).toBe(1200);
    expect(lowestPlainNumber('2,400 sqm')).toBe(2400);
  });

  it('ignores ratio noise', () => {
    expect(lowestPlainNumber('1,200 sqm, 24/7 access')).toBe(1200);
  });

  it('returns null when there is no number', () => {
    expect(lowestPlainNumber('To be advised')).toBeNull();
  });
});

describe('currencyTwin — guarded fallback', () => {
  it('accepts a bare number with no currency marker', () => {
    expect(currencyTwin('850')).toBe(850);
  });

  // Honest Blank Rule: the string clearly means money but we cannot pin the
  // amount, so we blank the filter value instead of inventing one.
  it('refuses to guess when a currency word is present but unparseable', () => {
    expect(currencyTwin('Php — on request')).toBeNull();
    expect(currencyTwin('PHP TBA')).toBeNull();
  });

  it('refuses to guess on bare ratio noise with no currency anchor', () => {
    expect(currencyTwin('12/7 metered')).toBeNull();
  });

  it('handles the real "metered plus fixed" pattern', () => {
    expect(currencyTwin('Metered + Php 100/sqm/mo')).toBe(100);
  });
});

describe('deriveNumericTwins — the write map', () => {
  it('derives all four twins from their display strings', () => {
    expect(deriveNumericTwins({
      rentPerSqm: 'Php 850/sqm/mo',
      camc: 'Php 165/sqm/mo',
      acCharges: 'Php 116/sqm/mo 12/7; Php 197 24/7',
      floorPlate: '1,200 - 1,800 sqm',
    })).toEqual({
      CM_Rent_From: 850,
      CM_CAMC_From: 165,
      CM_AC_Charge_From: 116,
      CM_Floor_Plate_From: 1200,
    });
  });

  // A partial edit must not blank twins it never touched, or saving one field
  // would wipe the filter data for the others.
  it('only emits keys whose source string was supplied', () => {
    expect(deriveNumericTwins({ rentPerSqm: 'Php 900/sqm/mo' }))
      .toEqual({ CM_Rent_From: 900 });
  });

  it('emits null (not a guess) for an unparseable value', () => {
    expect(deriveNumericTwins({ rentPerSqm: 'Php on request' }))
      .toEqual({ CM_Rent_From: null });
  });

  it('survives nullish details', () => {
    expect(deriveNumericTwins(null)).toEqual({});
    expect(deriveNumericTwins(undefined)).toEqual({});
  });

  it('reflects an edit — the whole point of the fix', () => {
    const before = deriveNumericTwins({ rentPerSqm: 'Php 850/sqm/mo' });
    const after = deriveNumericTwins({ rentPerSqm: 'Php 1,200/sqm/mo' });
    expect(before.CM_Rent_From).toBe(850);
    expect(after.CM_Rent_From).toBe(1200);
  });
});
