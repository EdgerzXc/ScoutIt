import { describe, it, expect } from 'vitest';
import {
  extractPhotos,
  toListingModel,
  buildReadinessReport,
  INDEX_ELIGIBLE_MIN_SCORE,
  MIN_PHOTOS,
  MIN_DESCRIPTION_CHARS,
} from '@/lib/seoReadiness';
import { computeListingStrength } from '@/lib/listingStrength';
import { PROPERTY_LIFECYCLE_STATES } from '@/lib/propertyLifecycle';

const LIVE = PROPERTY_LIFECYCLE_STATES.LIVE;

/** A property row good enough to be indexable, using REAL column names. */
function goodRow(overrides = {}) {
  return {
    id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    slug: 'bgc-luxury-suite-1',
    canonical_slug: 'bgc-luxury-suite-1',
    title: 'BGC Luxury Suite',
    description: 'x'.repeat(180),
    location: '11th Ave, BGC, Taguig',
    price: 120000,
    media_link: 'https://example.com/hero.jpg',
    space_category: 'Commercial Office',
    type: 'office',
    coordinates: 'POINT(121.048 14.5494)',
    details: {
      photos: ['a.jpg', 'b.jpg', 'c.jpg'],
      floor_sqm: 120,
      year_built: 2019,
      parking: 2,
    },
    ...overrides,
  };
}

function report(row, lifecycle = LIVE) {
  return buildReadinessReport(row, {
    strength: computeListingStrength,
    lifecycle,
    liveState: LIVE,
  });
}

describe('extractPhotos — photos live in details, not a column', () => {
  it('reads an array from details.photos', () => {
    expect(extractPhotos({ details: { photos: ['a', 'b'] } })).toEqual(['a', 'b']);
  });

  it('reads the comma-joined string shape carried over from Airtable', () => {
    expect(extractPhotos({ details: { Photos: 'a.jpg, b.jpg ,c.jpg' } }))
      .toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('drops blanks rather than counting them', () => {
    expect(extractPhotos({ details: { photos: ['a', '', null, '  ', 'b'] } })).toEqual(['a', 'b']);
  });

  // THE BUG: the old route read `prop.photos`, a column that does not exist, so
  // this always came back empty and every listing failed the photo check.
  it('returns empty — not a crash — for the shapes that used to be assumed', () => {
    expect(extractPhotos({ photos: ['a', 'b', 'c'] })).toEqual([]);
    expect(extractPhotos({})).toEqual([]);
    expect(extractPhotos(null)).toEqual([]);
    expect(extractPhotos({ details: 'not-an-object' })).toEqual([]);
  });

  // A hero image is media, but it is not a gallery. Conflating them would let a
  // one-image listing pass a check that exists to demand three.
  it('does not count media_link as a photo', () => {
    expect(extractPhotos({ media_link: 'hero.jpg', details: {} })).toEqual([]);
  });
});

describe('toListingModel — maps real columns onto the strength model', () => {
  it('reads location, space_category, details and coordinates', () => {
    const model = toListingModel(goodRow());
    expect(model.location).toBe('11th Ave, BGC, Taguig');
    expect(model.spaceCategory).toBe('Commercial Office');
    expect(model.coordinates).toBeTruthy();
    expect(model.hasMedia).toBe(true);
  });

  it('falls back from space_category to type', () => {
    expect(toListingModel(goodRow({ space_category: null })).spaceCategory).toBe('office');
  });

  it('treats a media_link with no gallery as media', () => {
    const model = toListingModel(goodRow({ details: {}, media_link: 'hero.jpg' }));
    expect(model.hasMedia).toBe(true);
  });

  it('does not throw on a null or partial row', () => {
    expect(() => toListingModel(null)).not.toThrow();
    expect(() => toListingModel({})).not.toThrow();
  });
});

describe('buildReadinessReport', () => {
  it('a complete, live listing is index eligible with no blockers', () => {
    const r = report(goodRow());
    expect(r.seoChecks.isLive).toBe(true);
    expect(r.readinessScore).toBeGreaterThanOrEqual(INDEX_ELIGIBLE_MIN_SCORE);
    expect(r.indexEligible).toBe(true);
    expect(r.blockers).toEqual([]);
  });

  // The single most important case, and the one the broken route got wrong for
  // every listing in the database.
  it('a complete DRAFT is not index eligible, however strong it is', () => {
    const r = report(goodRow(), PROPERTY_LIFECYCLE_STATES.DRAFT);
    expect(r.readinessScore).toBeGreaterThanOrEqual(INDEX_ELIGIBLE_MIN_SCORE);
    expect(r.indexEligible).toBe(false);
    expect(r.blockers[0]).toMatch(/Publish this listing/i);
  });

  it('a live but empty listing is not index eligible either', () => {
    const r = report({ slug: 'bare', lifecycle_state: 'live' });
    expect(r.indexEligible).toBe(false);
    expect(r.blockers.length).toBeGreaterThan(0);
  });

  it('counts photos from details and names the shortfall exactly', () => {
    const r = report(goodRow({ details: { photos: ['only-one.jpg'] } }));
    expect(r.seoChecks.photosCount).toBe(1);
    expect(r.seoChecks.minPhotosPassed).toBe(false);
    expect(r.blockers.join(' ')).toContain(`Add ${MIN_PHOTOS - 1} more photo`);
  });

  // Caught by a test, not by review: `computeListingStrength` is satisfied by
  // ONE image (`hasMedia`), so a 1-photo listing scored 100 and used to come
  // back index eligible while `minPhotosPassed` was false — the panel would
  // have printed "Google can index this" directly above "Add 2 more photos".
  // Eligibility now requires the hard checks, not just the score.
  it('is never index eligible while a HARD check is failing, whatever the score', () => {
    for (const broken of [
      { details: { photos: ['one.jpg'] } },      // too few photos
      { description: 'short' },                   // thin page
      { coordinates: null },                      // ungeocoded
      { slug: null, canonical_slug: null },       // no URL
    ]) {
      const r = report(goodRow(broken));
      expect(r.readinessScore).toBeGreaterThanOrEqual(INDEX_ELIGIBLE_MIN_SCORE);
      expect(r.indexEligible).toBe(false);
    }
  });

  // The invariant that inconsistency violated: eligible means the hard blockers
  // are gone. Remaining blockers may only be ranking advice.
  it('when eligible, no blocker is a hard requirement', () => {
    const r = report(goodRow());
    expect(r.indexEligible).toBe(true);
    for (const blocker of r.blockers) {
      expect(blocker).toMatch(/^Missing: /);
    }
  });

  it('says "has none" rather than "add 3 more" when there are zero', () => {
    const r = report(goodRow({ details: {} }));
    expect(r.blockers.join(' ')).toMatch(/has none/i);
  });

  it('reports the current description length so the fix is measurable', () => {
    const r = report(goodRow({ description: 'Too short.' }));
    expect(r.seoChecks.descriptionSubstantial).toBe(false);
    expect(r.blockers.join(' ')).toContain('it is currently 10');
  });

  it('asks for a description at all when there is none', () => {
    const r = report(goodRow({ description: '   ' }));
    expect(r.blockers.join(' ')).toContain(`${MIN_DESCRIPTION_CHARS} characters`);
    expect(r.blockers.join(' ')).not.toContain('currently');
  });

  it('flags an ungeocoded listing', () => {
    const r = report(goodRow({ coordinates: null }));
    expect(r.seoChecks.geocoded).toBe(false);
    expect(r.blockers.join(' ')).toMatch(/map location/i);
  });

  it('accepts canonical_slug alone as a URL', () => {
    const r = report(goodRow({ slug: null }));
    expect(r.seoChecks.canonicalSlugPresent).toBe(true);
  });

  it('flags a listing with no slug at all', () => {
    const r = report(goodRow({ slug: null, canonical_slug: null }));
    expect(r.seoChecks.canonicalSlugPresent).toBe(false);
    expect(r.blockers.join(' ')).toMatch(/no URL yet/i);
  });

  // Every blocker is rendered verbatim in the dashboard, so each must read as
  // an instruction to a human, not as a failed assertion.
  it('every blocker names a fix rather than a field name', () => {
    const r = report({ slug: null });
    expect(r.blockers.length).toBeGreaterThan(3);
    for (const blocker of r.blockers) {
      expect(blocker).not.toMatch(/false|undefined|null|_/);
      expect(blocker.length).toBeGreaterThan(12);
    }
  });

  it('does not throw on a null row', () => {
    expect(() => report(null)).not.toThrow();
  });
});
