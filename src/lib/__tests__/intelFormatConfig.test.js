import { describe, it, expect } from 'vitest';
import { INTEL_FORMATS, BASE_INTEL_FORMATS, getIntelFormatConfig } from '../intelFormatConfig';
import { SPATIAL_SIGNALS, getSignalsForProperty, getSignalBySlug, getSignalResolution } from '../signalsData';

describe('Intel Format Registry (intelFormatConfig.js)', () => {
  it('resolves dossier format for Commercial Signal category', () => {
    const config = getIntelFormatConfig('COMMERCIAL SIGNAL');
    expect(config.format).toBe(INTEL_FORMATS.DOSSIER);
    expect(config.doorChapterId).toBe('hiddenintel');
    expect(config.returnsTo).toBe('yourmove');
    expect(config.config.rail).toBe(true);
  });

  it('resolves scrollytelling format for Area Guide category', () => {
    const config = getIntelFormatConfig('AREA GUIDE');
    expect(config.format).toBe(INTEL_FORMATS.SCROLLYTELLING);
    expect(config.doorChapterId).toBe('whereto');
    expect(config.returnsTo).toBe('yourmove');
    expect(config.config.map).toBe('pinned');
  });

  it('resolves simulation format for Market Intel category', () => {
    const config = getIntelFormatConfig('MARKET INTEL');
    expect(config.format).toBe(INTEL_FORMATS.SIMULATION);
    expect(config.returnsTo).toBe('yourmove');
    expect(config.config.inputs).toBeDefined();
  });

  it('resolves developing format for Developing Story category', () => {
    const config = getIntelFormatConfig('DEVELOPING');
    expect(config.format).toBe(INTEL_FORMATS.DEVELOPING);
    expect(config.doorChapterId).toBe('universe');
    expect(config.returnsTo).toBe('yourmove');
  });

  it('falls back to reader format for unknown categories', () => {
    const config = getIntelFormatConfig('UNKNOWN CATEGORY');
    expect(config.format).toBe(INTEL_FORMATS.READER);
    expect(config.returnsTo).toBe('yourmove');
  });
});

describe('Spatial Signals Data & Curiosity Loop (signalsData.js)', () => {
  it('loads all core spatial signals', () => {
    expect(SPATIAL_SIGNALS.length).toBeGreaterThanOrEqual(3);
    const slugs = SPATIAL_SIGNALS.map(s => s.slug);
    expect(slugs).toContain('makati-leed-mandate');
    expect(slugs).toContain('bgc-subway-migration');
    expect(slugs).toContain('bgc-district-guide');
  });

  it('retrieves signals for a property by slug', () => {
    const estateSignals = getSignalsForProperty('the-estate-makati');
    expect(estateSignals.length).toBeGreaterThan(0);
    expect(estateSignals[0].slug).toBe('makati-leed-mandate');

    const glasshouseSignals = getSignalsForProperty('the-glasshouse-bgc');
    expect(glasshouseSignals.length).toBeGreaterThan(0);
    expect(glasshouseSignals.map(s => s.slug)).toContain('bgc-subway-migration');
  });

  it('finds a signal by slug or id', () => {
    const signalBySlug = getSignalBySlug('makati-leed-mandate');
    expect(signalBySlug).toBeDefined();
    expect(signalBySlug.id).toBe('sig-makati-leed');

    const signalById = getSignalBySlug('sig-bgc-subway');
    expect(signalById).toBeDefined();
    expect(signalById.slug).toBe('bgc-subway-migration');
  });

  it('retrieves resolution outcomes for terminal fulfilment', () => {
    const resolved = getSignalResolution('makati-leed-mandate', 'resolved');
    expect(resolved).toBeDefined();
    expect(resolved.name).toBe('Resolved');
    expect(resolved.headline).toBe('Compliance Upgrade Required');
    expect(resolved.glyph).toBe('●');

    const escalated = getSignalResolution('makati-leed-mandate', 'escalated');
    expect(escalated).toBeDefined();
    expect(escalated.name).toBe('Escalated');
    expect(escalated.glyph).toBe('◆');

    const ruledOut = getSignalResolution('makati-leed-mandate', 'ruledout');
    expect(ruledOut).toBeDefined();
    expect(ruledOut.name).toBe('Ruled Out');
    expect(ruledOut.glyph).toBe('○');
  });
});
