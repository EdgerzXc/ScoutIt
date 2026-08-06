import { describe, it, expect } from 'vitest';
import {
  stripPremiumFields,
  pickPremiumFields,
  PREMIUM_FIELD_MAP,
  ALL_PREMIUM_FIELDS,
} from '../premiumFields.js';
import { FEATURE_MIN_TIER } from '../entitlements.js';

// §25.1's requirement in one line: "Filter premium fields SERVER-SIDE before
// serialization — do not send-then-hide in the client."
//
// The test that matters most is therefore the serialisation one: after
// stripping, no premium VALUE may survive anywhere in the JSON. A component
// hiding a field is not the same as the field being absent.

const FULL = {
  slug: 'bgc-tower-unit',
  title: 'BGC Tower Unit',
  price: '₱185,000/mo',
  photos: ['https://cdn/1.jpg'],
  // solar
  deepIntel: { 'Cap Rate': '6.2%', 'Noise Level': 'Quiet' },
  enhanced_photos: ['https://cdn/enhanced-1.jpg'],
  // cluster
  virtual_tour_url: 'https://tour.example/abc',
  matterportTourUrl: 'https://tour.example/abc',
  luma3dMapUrl: 'https://luma.example/xyz',
  droneHeatmapUrl: 'https://drone.example/heat',
  floorPlans: [{ url: 'https://cdn/plan.pdf', name: 'Floor 12' }],
};

describe('the field map stays honest', () => {
  it('every gated group maps to a real tier', () => {
    for (const feature of Object.keys(PREMIUM_FIELD_MAP)) {
      expect(FEATURE_MIN_TIER[feature]).toBeTruthy();
    }
  });
});

describe('stripPremiumFields — anonymous / starry', () => {
  const stripped = stripPremiumFields(FULL, 'starry');

  it('leaves free fields untouched', () => {
    expect(stripped.title).toBe(FULL.title);
    expect(stripped.price).toBe(FULL.price);
    expect(stripped.photos).toEqual(FULL.photos);
  });

  // THE test. Everything else is detail.
  it('leaks no premium VALUE into the serialised payload', () => {
    const json = JSON.stringify(stripped);
    for (const secret of [
      '6.2%', 'Quiet',
      'https://cdn/enhanced-1.jpg',
      'https://tour.example/abc',
      'https://luma.example/xyz',
      'https://drone.example/heat',
      'https://cdn/plan.pdf',
    ]) {
      expect(json).not.toContain(secret);
    }
  });

  it('preserves each field\'s SHAPE so consumers do not crash', () => {
    // A component doing `property.floorPlans.map(...)` must not meet undefined.
    expect(Array.isArray(stripped.floorPlans)).toBe(true);
    expect(Array.isArray(stripped.enhanced_photos)).toBe(true);
    expect(typeof stripped.deepIntel).toBe('object');
    expect(typeof stripped.luma3dMapUrl).toBe('string');
  });

  it('reports what was locked, so the teaser can still advertise it', () => {
    expect(stripped.lockedFeatures).toContain('deepIntel');
    expect(stripped.lockedFeatures).toContain('vault');
    expect(stripped.premiumAvailable).toContain('vault');
  });

  it('does not advertise features this listing has no data for', () => {
    const bare = stripPremiumFields({ slug: 'x', title: 'Bare' }, 'starry');
    // An owner who never uploaded a 3D tour must not get a Vault upsell.
    expect(bare.premiumAvailable).toEqual([]);
  });
});

describe('stripPremiumFields — tier ladder', () => {
  it('solar unlocks deep intel and enhanced photos but NOT the vault', () => {
    const s = stripPremiumFields(FULL, 'solar');
    expect(s.deepIntel).toEqual(FULL.deepIntel);
    expect(s.enhanced_photos).toEqual(FULL.enhanced_photos);
    expect(s.luma3dMapUrl).toBe('');
    expect(s.floorPlans).toEqual([]);
    expect(s.lockedFeatures).toEqual(['vault']);
  });

  it('cluster unlocks everything mapped', () => {
    const s = stripPremiumFields(FULL, 'cluster');
    expect(s.luma3dMapUrl).toBe(FULL.luma3dMapUrl);
    expect(s.floorPlans).toEqual(FULL.floorPlans);
    expect(s.lockedFeatures).toEqual([]);
  });

  it('universe unlocks everything', () => {
    expect(stripPremiumFields(FULL, 'universe').lockedFeatures).toEqual([]);
  });

  // An unrecognised tier must not be treated as generous.
  it.each([['garbage'], [null], [undefined], ['']])(
    'treats unknown tier %s as the lowest, not the highest',
    (tier) => {
      const s = stripPremiumFields(FULL, tier);
      expect(s.deepIntel).toEqual({});
      expect(s.luma3dMapUrl).toBe('');
    },
  );

  it('does not mutate the input — the cache holds the full object', () => {
    const original = JSON.parse(JSON.stringify(FULL));
    stripPremiumFields(FULL, 'starry');
    expect(FULL).toEqual(original);
  });
});

describe('pickPremiumFields — the authenticated endpoint', () => {
  it('returns nothing for starry', () => {
    expect(pickPremiumFields(FULL, 'starry')).toEqual({});
  });

  it('returns only the entitled subset for solar', () => {
    const picked = pickPremiumFields(FULL, 'solar');
    expect(picked.deepIntel).toEqual(FULL.deepIntel);
    expect(picked.luma3dMapUrl).toBeUndefined();
  });

  it('round-trips: strip + pick reconstructs the original for an entitled tier', () => {
    const merged = { ...stripPremiumFields(FULL, 'starry'), ...pickPremiumFields(FULL, 'cluster') };
    for (const field of ALL_PREMIUM_FIELDS) {
      expect(merged[field]).toEqual(FULL[field]);
    }
  });

  it('handles a missing property without throwing', () => {
    expect(pickPremiumFields(null, 'universe')).toEqual({});
  });
});
