import { describe, it, expect } from 'vitest';
import {
  getFreshness,
  daysSinceVerified,
  needsReverification,
  freshnessAgeLabel,
  auditPortfolio,
} from '../freshness.js';

const NOW = new Date('2026-07-29T00:00:00Z').getTime();
const ago = (days) => new Date(NOW - days * 86400000).toISOString();

describe('tier boundaries', () => {
  it.each([
    [0, 'fresh'],
    [29, 'fresh'],
    [30, 'warning'],
    [59, 'warning'],
    [60, 'stale'],
    [179, 'stale'],
    [180, 'outdated'],
    [400, 'outdated'],
  ])('%i days old is %s', (days, expected) => {
    expect(getFreshness(ago(days), NOW).id).toBe(expected);
  });
});

describe('honest blank — missing data is never good news', () => {
  // Defaulting an unknown verification date to "fresh" is how a directory
  // quietly fills with rot. This is the single most important behaviour here.
  it.each([[null], [undefined], [''], ['not-a-date']])(
    'treats %s as unverified, not fresh',
    (input) => {
      expect(getFreshness(input, NOW).id).toBe('unverified');
    },
  );

  it('ranks unverified below fresh', () => {
    expect(getFreshness(null, NOW).rankModifier).toBeLessThan(0);
    expect(getFreshness(ago(5), NOW).rankModifier).toBe(0);
  });

  it('flags unverified as needing re-verification', () => {
    expect(needsReverification(null, NOW)).toBe(true);
  });
});

describe('clock skew', () => {
  // A future date means a bad Airtable entry or clock drift. Reporting a
  // negative age would break every downstream comparison.
  it('clamps a future date to zero days', () => {
    expect(daysSinceVerified(ago(-10), NOW)).toBe(0);
    expect(getFreshness(ago(-10), NOW).id).toBe('fresh');
  });
});

describe('public buyer notice', () => {
  // Only the outdated tier warns buyers. Stamping "re-verification due" on a
  // public card would punish owners for ScoutIt's own cadence — but past six
  // months, silence becomes a representation that the data still holds.
  it.each([[5], [45], [90]])('stays silent at %i days', (days) => {
    expect(getFreshness(ago(days), NOW).publicNotice).toBeNull();
  });

  it('warns past six months', () => {
    expect(getFreshness(ago(200), NOW).publicNotice).toMatch(/6 months/);
  });

  it('does not warn on a never-verified listing', () => {
    // No date means no claim about age — we can't tell a buyer "6 months".
    expect(getFreshness(null, NOW).publicNotice).toBeNull();
  });
});

describe('freshnessAgeLabel', () => {
  it.each([
    [0, 'Verified today'],
    [1, 'Verified yesterday'],
    [10, 'Verified 10 days ago'],
    [35, 'Verified 1 month ago'],
  ])('%i days reads as "%s"', (days, expected) => {
    expect(freshnessAgeLabel(ago(days), NOW)).toBe(expected);
  });

  it('switches to years past 365 days', () => {
    expect(freshnessAgeLabel(ago(400), NOW)).toMatch(/year/);
  });

  it('says so when never verified', () => {
    expect(freshnessAgeLabel(null, NOW)).toBe('Never verified');
  });
});

describe('auditPortfolio', () => {
  const portfolio = [
    { slug: 'fresh5', lastVerifiedDate: ago(5) },
    { slug: 'outdated200', lastVerifiedDate: ago(200) },
    { slug: 'warning45', lastVerifiedDate: ago(45) },
    { slug: 'never', lastVerifiedDate: null },
    { slug: 'stale90', lastVerifiedDate: ago(90) },
    { slug: 'outdated400', lastVerifiedDate: ago(400) },
  ];

  const audit = auditPortfolio(portfolio, NOW);
  const order = audit.needsAttention.map((r) => r.slug);

  it('excludes fresh listings from the attention list', () => {
    expect(order).not.toContain('fresh5');
    expect(audit.freshCount).toBe(1);
    expect(audit.total).toBe(6);
  });

  // Sorting by raw age floats never-verified rows (age null) to the top —
  // but an outdated listing is actively showing a public buyer warning and
  // costing trust every day. Severity has to beat age.
  it('orders by severity, not raw age', () => {
    expect(order[0]).toBe('outdated400');
    expect(order[1]).toBe('outdated200');
    expect(order.indexOf('stale90')).toBeLessThan(order.indexOf('never'));
    expect(order[order.length - 1]).toBe('warning45');
  });

  it('reads snake_case last_verified_date too', () => {
    expect(auditPortfolio([{ slug: 'x', last_verified_date: ago(5) }], NOW).freshCount).toBe(1);
  });

  it('survives empty and nullish input', () => {
    expect(auditPortfolio([], NOW).total).toBe(0);
    expect(auditPortfolio(null, NOW).total).toBe(0);
  });
});
