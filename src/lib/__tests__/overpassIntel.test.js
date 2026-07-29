import { describe, it, expect } from 'vitest';
import {
  buildOverpassQuery,
  shapeOverpassResponse,
  describeDistance,
  LAYERS,
} from '../overpassIntel.js';

// BGC, Taguig — the reference coordinate used throughout.
const LAT = 14.5494;
const LON = 121.048;

describe('buildOverpassQuery', () => {
  // `nwr` (not `node`) is essential: a mall or park is usually a WAY, so
  // querying nodes only silently loses the biggest POIs on the page.
  it('queries nodes, ways and relations', () => {
    const q = buildOverpassQuery(LAT, LON);
    expect(q).toContain('nwr[');
    expect(q).not.toMatch(/\bnode\[/);
  });

  // `center` is what gives ways and relations a usable lat/lon. Without it
  // shapeOverpassResponse drops them for having no coordinate.
  it('requests center geometry in the documented modifier order', () => {
    expect(buildOverpassQuery(LAT, LON)).toMatch(/out tags center \d+;/);
  });

  it('includes every filter from every layer', () => {
    const expected = LAYERS.reduce((n, l) => n + l.filters.length, 0);
    const q = buildOverpassQuery(LAT, LON);
    expect((q.match(/nwr\[/g) || []).length).toBe(expected);
  });

  it('honours a custom radius', () => {
    expect(buildOverpassQuery(LAT, LON, 500)).toContain('around:500');
  });
});

describe('describeDistance', () => {
  it('reports metres under 1 km', () => {
    expect(describeDistance(400).distance).toBe('400 m');
  });

  it('switches to km above 1000 m', () => {
    expect(describeDistance(1500).distance).toBe('1.5 km');
  });

  it('estimates walk time at a conservative urban pace', () => {
    expect(describeDistance(400).walkMin).toBe(5);
  });

  it('never reports a zero-minute walk', () => {
    expect(describeDistance(10).walkMin).toBe(1);
  });
});

describe('shapeOverpassResponse', () => {
  const payload = {
    elements: [
      { type: 'node', id: 1, lat: 14.55, lon: 121.0485, tags: { name: 'Tim Hortons', amenity: 'cafe' } },
      // unnamed — "Cafe, 200 m" tells a reader nothing actionable
      { type: 'node', id: 2, lat: 14.5496, lon: 121.0482, tags: { amenity: 'cafe' } },
      // a way with center — the mall case
      { type: 'way', id: 3, center: { lat: 14.551, lon: 121.049 }, tags: { name: 'Market Market', shop: 'mall' } },
      // same brand mapped twice in OSM
      { type: 'node', id: 4, lat: 14.56, lon: 121.05, tags: { name: 'Tim Hortons', amenity: 'cafe' } },
      { type: 'node', id: 5, lat: 14.5495, lon: 121.0481, tags: { name: 'BGC Bus Stop', highway: 'bus_stop' } },
      // tag we don't map to any layer
      { type: 'node', id: 6, lat: 14.5493, lon: 121.0479, tags: { name: 'Statue', tourism: 'artwork' } },
      { type: 'node', id: 7, lat: 14.5499, lon: 121.0483, tags: { name: 'Anytime Fitness', leisure: 'fitness_centre' } },
    ],
  };

  const layers = shapeOverpassResponse(payload, LAT, LON);
  const layer = (id) => layers.find((l) => l.id === id);

  it('always returns all four layers', () => {
    expect(layers).toHaveLength(4);
    expect(layers.map((l) => l.id)).toEqual(['daily', 'wellness', 'social', 'transit']);
  });

  it('drops unnamed POIs', () => {
    expect(layer('daily').items.filter((i) => !i.name)).toHaveLength(0);
    expect(layer('daily').count).toBe(1);
  });

  it('dedupes repeated brand names', () => {
    expect(layer('daily').items.filter((i) => i.name === 'Tim Hortons')).toHaveLength(1);
  });

  it('includes ways via their center coordinate', () => {
    expect(layer('social').items[0].name).toBe('Market Market');
  });

  it('ignores tags outside the layer definitions', () => {
    expect(JSON.stringify(layers)).not.toContain('Statue');
  });

  it('buckets POIs into the right layer', () => {
    expect(layer('transit').items[0].name).toBe('BGC Bus Stop');
    expect(layer('wellness').items[0].name).toBe('Anytime Fitness');
  });

  it('labels types for humans, never raw OSM keys', () => {
    expect(layer('transit').items[0].type).toBe('Bus stop');
    expect(layer('social').items[0].type).toBe('Mall');
  });

  it('attaches distance and walk time to every item', () => {
    const item = layer('daily').items[0];
    expect(item.meters).toBeGreaterThan(0);
    expect(item.walkLabel).toMatch(/min walk/);
  });

  it('keeps count in sync with items', () => {
    expect(layers.every((l) => l.count === l.items.length)).toBe(true);
  });

  it('sorts items nearest first', () => {
    const wellness = shapeOverpassResponse(
      {
        elements: [
          { type: 'node', id: 1, lat: 14.56, lon: 121.06, tags: { name: 'Far Gym', leisure: 'fitness_centre' } },
          { type: 'node', id: 2, lat: 14.5495, lon: 121.0481, tags: { name: 'Near Gym', leisure: 'fitness_centre' } },
        ],
      },
      LAT,
      LON,
    ).find((l) => l.id === 'wellness');
    expect(wellness.items[0].name).toBe('Near Gym');
  });
});

describe('shapeOverpassResponse — honest blank', () => {
  // Zero results is a real fact about a location, not an error. The shape
  // must survive so the UI can say "no verified nodes" rather than crash.
  it('returns four empty layers for an empty payload', () => {
    const layers = shapeOverpassResponse({ elements: [] }, LAT, LON);
    expect(layers).toHaveLength(4);
    expect(layers.every((l) => l.count === 0)).toBe(true);
  });

  it('survives a null or malformed payload', () => {
    expect(shapeOverpassResponse(null, LAT, LON)).toHaveLength(4);
    expect(shapeOverpassResponse({}, LAT, LON)).toHaveLength(4);
  });
});
