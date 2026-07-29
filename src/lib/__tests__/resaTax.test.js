import { describe, it, expect } from 'vitest';
import {
  computeTransferCosts,
  parseTransferValue,
  peso,
  TAX_RATES,
  TAX_DISCLAIMER,
  RESA_FOOTER,
} from '../resaTax.js';

// These figures go on a sheet a broker hands to a client. Every assertion
// here is protecting against a number that would mislead someone.

describe('parseTransferValue — must reject non-sale values', () => {
  it('accepts a plain number and a formatted peso string', () => {
    expect(parseTransferValue(45000000)).toBe(45000000);
    expect(parseTransferValue('₱45,000,000')).toBe(45000000);
  });

  // Running transfer taxes on a monthly lease rate would produce a
  // confident, completely meaningless number.
  it.each([
    ['₱120,000 / mo'],
    ['₱1,200 / sqm / mo'],
    ['₱850 per sqm'],
    ['Price on request'],
    [''],
    [null],
    [undefined],
  ])('rejects %s', (input) => {
    expect(parseTransferValue(input)).toBeNull();
  });
});

describe('computeTransferCosts — statutory rates', () => {
  const result = computeTransferCosts('₱45,000,000');

  it('applies 6% CGT', () => {
    expect(result.lines[0].amount).toBe(2_700_000);
  });

  it('applies 1.5% DST', () => {
    expect(result.lines[1].amount).toBe(675_000);
  });

  it('applies the 0.75% Metro Manila transfer tax ceiling by default', () => {
    expect(result.lines[2].amount).toBe(337_500);
  });

  it('applies the 0.5% cap outside Metro Manila', () => {
    const provincial = computeTransferCosts(45_000_000, { isMetroManila: false });
    expect(provincial.lines[2].amount).toBe(225_000);
    expect(provincial.lines[2].rateLabel).toMatch(/outside/i);
  });

  it('formats amounts as pesos', () => {
    expect(result.lines[0].amountLabel).toBe('₱2,700,000');
    expect(peso(1234567)).toBe('₱1,234,567');
  });
});

describe('computeTransferCosts — refuses to invent numbers', () => {
  const result = computeTransferCosts('₱45,000,000');

  // Registration fees follow a graduated LRA schedule. A plausible-looking
  // guess is worse than an honest "look it up".
  it('never computes a registration fee', () => {
    const registration = result.lines.find((l) => l.key === 'registration');
    expect(registration.amount).toBeNull();
    expect(registration.amountLabel).toBeNull();
  });

  it('excludes registration from the total', () => {
    expect(result.totalMin).toBe(2_700_000 + 675_000 + 337_500);
  });

  it('labels the total as a floor, not an estimate', () => {
    expect(result.isFloor).toBe(true);
  });

  it('returns null when there is no usable sale value', () => {
    expect(computeTransferCosts('₱120,000 / mo')).toBeNull();
    expect(computeTransferCosts('Price on request')).toBeNull();
    expect(computeTransferCosts(null)).toBeNull();
  });
});

describe('the caveats that keep this defensible', () => {
  // CGT and DST are assessed on the HIGHEST of selling price, BIR zonal
  // value, or FMV. Where zonal value exceeds the asking price, a figure
  // derived from price understates the bill — so the basis text must say so.
  it('states the zonal-value rule on CGT and DST', () => {
    expect(TAX_RATES.cgt.basis).toMatch(/zonal/i);
    expect(TAX_RATES.dst.basis).toMatch(/zonal/i);
  });

  it('warns that CGT assumes a capital asset', () => {
    expect(TAX_RATES.cgt.note).toMatch(/ordinary/i);
  });

  it('warns that local transfer tax varies by LGU', () => {
    expect(TAX_RATES.transfer.note).toMatch(/Metro Manila|LGU/i);
    expect(TAX_RATES.transfer.rateLabel).toMatch(/0\.5%.*0\.75%/);
  });

  it('flags DST allocation as contractual, not statutory', () => {
    expect(TAX_RATES.dst.customaryPayer).toMatch(/negotiab/i);
  });

  it('assigns CGT to the seller and transfer tax to the buyer', () => {
    expect(TAX_RATES.cgt.customaryPayer).toBe('Seller');
    expect(TAX_RATES.transfer.customaryPayer).toBe('Buyer');
  });

  it('ships a disclaimer naming the zonal-value trap and disclaiming advice', () => {
    expect(TAX_DISCLAIMER).toMatch(/zonal/i);
    expect(TAX_DISCLAIMER).toMatch(/not tax advice/i);
  });

  it('ships an RA 9646 footer asserting neutral-provider status', () => {
    expect(RESA_FOOTER).toMatch(/9646/);
    expect(RESA_FOOTER).toMatch(/neutral technology provider/i);
  });
});
