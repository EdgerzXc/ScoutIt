import { describe, it, expect } from 'vitest';
import { computeListingStrength } from '../listingStrength.js';

const COMPLETE = {
  title: 'One BGC Tower',
  location: 'BGC, Taguig',
  price: 145000000,
  desc: 'x'.repeat(60),
  hasMedia: true,
  coordinates: [14.55, 121.05],
  spaceCategory: 'Commercial',
  details: { a: 1, b: 2, c: 3 },
};

// The FAQ pre-flight check is CONDITIONAL — it only enters the denominator
// when faqAnsweredCount is actually supplied. Without that, adding the check
// would silently drop every existing listing's score from 100% to 89%.
describe('computeListingStrength — conditional FAQ check', () => {
  it('excludes the FAQ check when the count is absent', () => {
    const result = computeListingStrength(COMPLETE);
    expect(result.total).toBe(8);
    expect(result.score).toBe(100);
  });

  it('excludes the FAQ check when the count is explicitly undefined', () => {
    const result = computeListingStrength({ ...COMPLETE, faqAnsweredCount: undefined });
    expect(result.total).toBe(8);
    expect(result.score).toBe(100);
  });

  it('includes the FAQ check once a count is supplied', () => {
    const result = computeListingStrength({ ...COMPLETE, faqAnsweredCount: 0 });
    expect(result.total).toBe(9);
    expect(result.passed).toBe(8);
    expect(result.missing).toContain('Buyer questions answered (5+)');
  });

  it('passes the FAQ check at 5 answers', () => {
    const result = computeListingStrength({ ...COMPLETE, faqAnsweredCount: 5 });
    expect(result.total).toBe(9);
    expect(result.score).toBe(100);
    expect(result.missing).toHaveLength(0);
  });

  it('still fails the FAQ check at 4 answers', () => {
    const result = computeListingStrength({ ...COMPLETE, faqAnsweredCount: 4 });
    expect(result.missing).toContain('Buyer questions answered (5+)');
  });
});

describe('computeListingStrength — baseline behaviour', () => {
  it('scores a null listing at zero without listing conditional checks as missing', () => {
    const result = computeListingStrength(null);
    expect(result.score).toBe(0);
    expect(result.missing).not.toContain('Buyer questions answered (5+)');
  });

  it('reports the specific missing fields', () => {
    const result = computeListingStrength({ ...COMPLETE, title: '', hasMedia: false, mediaLink: null });
    expect(result.missing).toContain('Title');
    expect(result.missing).toContain('Photos or media gallery');
    expect(result.score).toBeLessThan(100);
  });
});
