import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// A-036. Every MapLibre consumer must dress itself from the bundled stylesheet
// that ships with the installed package, never from a CDN copy pinned to a
// different major version. Two dashboard files rendered a
// `maplibre-gl@4.7.1` <link> on top of the bundled 5.x CSS, so one widget could
// receive two major-version stylesheets and a signed-in map depended on a third
// party at render time.
const MAP_CONSUMERS = [
  'src/components/dashboard/BuyerMode.js',
  'src/components/dashboard/BrokerMode.js',
  'src/components/descent/CityApproach.js',
  'src/components/intel/SpatialIntelMap.js',
  'src/components/maps/SpatialCanvas.js',
  'src/components/property/FloodHeatmapMap.js',
  'src/components/property/InteractiveRadiusMap.js',
  'src/components/property/SpatialCommandMap.js',
  'src/components/transit/ManilaTransitMap.js',
];

const read = (p) => readFileSync(p, 'utf8');

describe('A-036 MapLibre stylesheet provenance', () => {
  it.each(MAP_CONSUMERS)('%s imports the bundled MapLibre stylesheet', (file) => {
    // Asserted per-file rather than globally so that deleting the import
    // cannot make the "no CDN link" assertion below pass vacuously.
    expect(read(file)).toMatch(/import ['"]maplibre-gl\/dist\/maplibre-gl\.css['"]/);
  });

  it.each(MAP_CONSUMERS)('%s loads no CDN MapLibre stylesheet', (file) => {
    expect(read(file)).not.toMatch(/unpkg\.com\/maplibre-gl/);
    expect(read(file)).not.toMatch(/cdn\.jsdelivr\.net\/npm\/maplibre-gl/);
  });

  it('pins no MapLibre major version other than the installed one', () => {
    const installed = require('maplibre-gl/package.json').version;
    const major = installed.split('.')[0];
    expect(Number(major)).toBeGreaterThanOrEqual(5);
    for (const file of MAP_CONSUMERS) {
      const pinned = [...read(file).matchAll(/maplibre-gl@(\d+)\./g)].map((m) => m[1]);
      // Any hardcoded version reference must match the installed major, so this
      // fails the day the package is upgraded past a stale pin rather than
      // silently serving mismatched CSS again.
      for (const p of pinned) expect(p).toBe(major);
    }
  });

  it('the bundled stylesheet actually defines the rules the CDN sheet supplied', () => {
    // The removal is only safe if the bundled sheet carries the control, popup
    // and marker rules. Verified against the installed file, not assumed —
    // the whole defect began as an assumption about which sheet was needed.
    const css = read(require.resolve('maplibre-gl/dist/maplibre-gl.css'));
    for (const rule of [
      '.maplibregl-map',
      '.maplibregl-canvas',
      '.maplibregl-ctrl',
      '.maplibregl-popup',
      '.maplibregl-marker',
    ]) {
      expect(css).toContain(rule);
    }
  });
});
