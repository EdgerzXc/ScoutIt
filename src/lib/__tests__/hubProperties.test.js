import { describe, it, expect } from 'vitest';
import {
  haversineKm,
  matchesHubByName,
  hubDistanceKm,
  selectHubProperties,
  HUB_RADIUS_KM,
} from '@/lib/hubProperties';
import { LOCATION_HUBS, LOCATION_HUB_SLUGS, getLocationHub } from '@/lib/locationHubs';

const BGC = getLocationHub('bgc-taguig');
const MAKATI = getLocationHub('makati-cbd');

/** A property sitting exactly on the hub's centre, with trusted coordinates. */
function atHub(hub, overrides = {}) {
  return {
    slug: 'on-the-dot',
    title: 'On The Dot',
    lat: hub.lat,
    lng: hub.lng,
    city: '',
    region: '',
    location: '',
    ...overrides,
  };
}

describe('locationHubs', () => {
  it('exposes the three advertised slugs', () => {
    expect(LOCATION_HUB_SLUGS).toEqual(['bgc-taguig', 'makati-cbd', 'quezon-city-hub']);
  });

  it('every hub has the fields the page and sitemap depend on', () => {
    for (const hub of LOCATION_HUBS) {
      expect(typeof hub.slug).toBe('string');
      expect(hub.slug.length).toBeGreaterThan(0);
      expect(typeof hub.name).toBe('string');
      expect(typeof hub.city).toBe('string');
      expect(typeof hub.tagline).toBe('string');
      expect(Number.isFinite(hub.lat)).toBe(true);
      expect(Number.isFinite(hub.lng)).toBe(true);
    }
  });

  it('returns null for an unknown slug rather than inventing a hub', () => {
    expect(getLocationHub('cebu-it-park')).toBeNull();
    expect(getLocationHub('')).toBeNull();
    expect(getLocationHub(undefined)).toBeNull();
  });
});

describe('haversineKm', () => {
  it('is zero for the same point', () => {
    expect(haversineKm(14.5494, 121.048, 14.5494, 121.048)).toBeCloseTo(0, 6);
  });

  it('measures BGC to Makati CBD at roughly 2-3 km', () => {
    const d = haversineKm(BGC.lat, BGC.lng, MAKATI.lat, MAKATI.lng);
    expect(d).toBeGreaterThan(1);
    expect(d).toBeLessThan(4);
  });

  // A missing coordinate must not silently become 0 — 0 would read as "at the
  // hub centre", the most confident possible claim from the least data.
  it('returns null when any coordinate is missing or unparseable', () => {
    expect(haversineKm(null, 121, 14.5, 121)).toBeNull();
    expect(haversineKm(14.5, undefined, 14.5, 121)).toBeNull();
    expect(haversineKm(14.5, 121, 14.5, 'not-a-number')).toBeNull();
    expect(haversineKm(NaN, 121, 14.5, 121)).toBeNull();
  });
});

describe('matchesHubByName', () => {
  it('matches on city, region, or free-text location', () => {
    expect(matchesHubByName({ city: 'Taguig' }, BGC)).toBe(true);
    expect(matchesHubByName({ region: 'BGC' }, BGC)).toBe(true);
    expect(matchesHubByName({ location: '11th Ave, BGC, Taguig City' }, BGC)).toBe(true);
  });

  it('is case- and punctuation-insensitive', () => {
    expect(matchesHubByName({ location: 'b.g.c.' }, BGC)).toBe(true);
    expect(matchesHubByName({ city: 'MAKATI' }, MAKATI)).toBe(true);
  });

  it('does not match an unrelated city', () => {
    expect(matchesHubByName({ city: 'Cebu City', location: 'Lahug' }, BGC)).toBe(false);
  });

  it('does not match on empty or missing fields', () => {
    expect(matchesHubByName({}, BGC)).toBe(false);
    expect(matchesHubByName({ city: '', region: '', location: '' }, BGC)).toBe(false);
    expect(matchesHubByName(null, BGC)).toBe(false);
    expect(matchesHubByName({ city: 'Taguig' }, null)).toBe(false);
  });
});

describe('hubDistanceKm — the honesty rule', () => {
  it('measures a property with real coordinates', () => {
    expect(hubDistanceKm(atHub(BGC), BGC)).toBeCloseTo(0, 6);
  });

  // cmsCache.geocodeMissingCoords() falls back to a CITY CENTROID when Mapbox
  // can't place a property and flags it coordsApproximate. That number is a
  // guess. Treating it as a measurement would let an unlocatable property
  // render under a hub heading looking verified.
  it('refuses to measure approximate (centroid-fallback) coordinates', () => {
    const guessed = atHub(BGC, { coordsApproximate: true });
    expect(hubDistanceKm(guessed, BGC)).toBeNull();
  });

  it('only `=== true` suppresses the measurement, not any truthy value', () => {
    expect(hubDistanceKm(atHub(BGC, { coordsApproximate: false }), BGC)).toBeCloseTo(0, 6);
    expect(hubDistanceKm(atHub(BGC, { coordsApproximate: undefined }), BGC)).toBeCloseTo(0, 6);
  });
});

describe('selectHubProperties', () => {
  it('includes a property inside the radius', () => {
    const out = selectHubProperties([atHub(BGC)], BGC);
    expect(out).toHaveLength(1);
    expect(out[0].hubMatchBasis).toBe('proximity');
    expect(out[0].hubDistanceKm).toBeCloseTo(0, 6);
  });

  it('excludes a property outside the radius with no name match', () => {
    // Cebu — several hundred km away, and no BGC/Taguig text anywhere.
    const far = atHub(BGC, { slug: 'cebu', lat: 10.3157, lng: 123.8854, city: 'Cebu City' });
    expect(selectHubProperties([far], BGC)).toHaveLength(0);
  });

  // The §40.9a failure mode: an over-strict filter shows nothing, and nothing
  // looks exactly like having nothing. A property whose city says Taguig
  // belongs on the BGC page even when we could not place it on a map.
  it('still includes an unplaceable property when its city names the hub', () => {
    const named = {
      slug: 'no-coords',
      title: 'Unplaced but named',
      city: 'Taguig',
      coordsApproximate: true,
      lat: BGC.lat,
      lng: BGC.lng,
    };
    const out = selectHubProperties([named], BGC);
    expect(out).toHaveLength(1);
    expect(out[0].hubMatchBasis).toBe('name');
    // …and carries NO distance, so the page cannot render "0 m from centre".
    expect(out[0].hubDistanceKm).toBeNull();
  });

  it('orders measured matches first, nearest first, then name-only matches', () => {
    const near = atHub(BGC, { slug: 'near', title: 'Near' });
    const midLat = BGC.lat + 0.02; // ~2.2 km north
    const mid = atHub(BGC, { slug: 'mid', title: 'Mid', lat: midLat });
    const named = { slug: 'named', title: 'Aaa Named', city: 'Taguig', coordsApproximate: true };

    const out = selectHubProperties([named, mid, near], BGC);
    expect(out.map((p) => p.slug)).toEqual(['near', 'mid', 'named']);
  });

  it('skips entries with no slug — the page keys and links on it', () => {
    const noSlug = { title: 'Ghost', city: 'Taguig' };
    expect(selectHubProperties([noSlug, null, undefined], BGC)).toHaveLength(0);
  });

  it('returns an empty array for bad input rather than throwing', () => {
    expect(selectHubProperties(null, BGC)).toEqual([]);
    expect(selectHubProperties([], null)).toEqual([]);
    expect(selectHubProperties(undefined, undefined)).toEqual([]);
  });

  it('honours a custom radius, and falls back to the default for junk values', () => {
    const twoKmNorth = atHub(BGC, { lat: BGC.lat + 0.018 });
    expect(selectHubProperties([twoKmNorth], BGC, { radiusKm: 0.5 })).toHaveLength(0);
    expect(selectHubProperties([twoKmNorth], BGC, { radiusKm: 5 })).toHaveLength(1);
    expect(selectHubProperties([twoKmNorth], BGC, { radiusKm: -1 })).toHaveLength(1);
    expect(HUB_RADIUS_KM).toBeGreaterThan(2);
  });

  it('does not mutate the properties it is given', () => {
    const input = [atHub(BGC)];
    const snapshot = JSON.stringify(input);
    selectHubProperties(input, BGC);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
