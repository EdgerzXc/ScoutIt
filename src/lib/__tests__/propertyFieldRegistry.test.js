import { describe, it, expect } from 'vitest';
import {
  deriveLabel,
  splitPrefix,
  visibilityOf,
  isInternal,
  isGated,
  fieldMeta,
  groupFields,
  omitInternal,
  categoryKeyFor,
  INTERNAL_FIELDS,
  VISIBILITY,
} from '../propertyFieldRegistry.js';

describe('categoryKeyFor — stored labels have drifted, so match loosely', () => {
  it.each([
    ['Commercial', 'commercial'],
    ['Commercial Office', 'commercial'],
    ['Residential', 'residential'],
    ['Hospitality', 'hospitality'],
    ['The Meridian Hotel', 'hospitality'],
    ['Restaurants', 'restaurants'],
    ['Culinary / Restaurant', 'restaurants'],
    ['Venues', 'venues'],
    ['Event Space', 'venues'],
  ])('%s -> %s', (input, expected) => {
    expect(categoryKeyFor(input)).toBe(expected);
  });

  // A short-term rental is residential-ish. If "residential" were checked
  // first it would swallow STR and hide every STR_ field from the editor.
  it.each([
    ['Short-Term Rental', 'str'],
    ['STR', 'str'],
    ['Short Term Residential Rental', 'str'],
  ])('classifies %s as STR, not residential', (input, expected) => {
    expect(categoryKeyFor(input)).toBe(expected);
  });

  // Regression: "Warehouse" contains "house". A bare substring match filed the
  // live listing "The Foundry, Warehouse District BGC" as residential.
  it('does not read "house" out of "Warehouse"', () => {
    expect(categoryKeyFor('Warehouse District')).toBeNull();
    expect(categoryKeyFor('The Foundry, Warehouse District BGC')).toBeNull();
    expect(categoryKeyFor('House and Lot')).toBe('residential');
  });

  // Guessing would hide the correct fields. Null means "shared only".
  it('returns null rather than guessing on unknown input', () => {
    expect(categoryKeyFor('')).toBeNull();
    expect(categoryKeyFor(null)).toBeNull();
    expect(categoryKeyFor(undefined)).toBeNull();
  });
});

// The whole point of this registry is that Airtable stays terse and THIS is
// what makes it legible to staff. A wrong label here is worse than no label:
// a staff member reading "Camc Per Sqm" assumes the data is junk too.

describe('deriveLabel — acronyms must survive intact', () => {
  it.each([
    ['CM_CAMC_Per_Sqm', 'CAMC per sqm'],
    ['HOSP_RevPAR', 'RevPAR'],
    ['CM_NOI', 'NOI'],
    ['CM_PEZA', 'PEZA'],
    ['HOSP_GFA', 'GFA'],
    ['RS_Price_Per_Sqm', 'Price per sqm'],
    ['CM_Total_GLA', 'Total GLA'],
    ['STR_WiFi_Speed', 'WiFi Speed'],
  ])('%s -> %s', (input, expected) => {
    expect(deriveLabel(input)).toBe(expected);
  });

  // These predate the prefix convention and are CamelCase, not snake_case.
  it.each([
    ['OutdoorDescription', 'Outdoor Description'],
    ['ScoutItVerdict', 'Scout It Verdict'],
    ['CeilingHeight', 'Ceiling Height'],
  ])('splits legacy CamelCase: %s -> %s', (input, expected) => {
    expect(deriveLabel(input)).toBe(expected);
  });

  it('never returns an empty label', () => {
    for (const name of ['X', 'CM_', 'A_B_C']) {
      expect(deriveLabel(name).length).toBeGreaterThan(0);
    }
  });

  it('capitalises the first word even when it is a connective', () => {
    // "Per" is lowercased mid-label but must be capitalised in first position;
    // "Unit" is not a connective so it keeps its capital either way.
    expect(deriveLabel('Per_Unit')).toBe('Per Unit');
    expect(deriveLabel('RS_Price_Per_Sqm')).toBe('Price per sqm');
  });
});

describe('splitPrefix', () => {
  it.each([
    ['CM_Rent_From', 'commercial'],
    ['RS_Price', 'residential'],
    ['STR_Max_Guests', 'str'],
    ['RST_Gas_Line', 'restaurants'],
    ['HOSP_Room_Count', 'hospitality'],
    ['VEN_Rate_Basis', 'venues'],
    ['Amenities', 'shared'],
  ])('%s belongs to %s', (name, category) => {
    expect(splitPrefix(name)[0]).toBe(category);
  });

  // "Region" starts with R but is NOT an RS_/RST_ field. A sloppy prefix match
  // would file shared fields under a category and hide them on 5 of 6 pages.
  it('does not mistake a shared field for a prefixed one', () => {
    expect(splitPrefix('Region')[0]).toBe('shared');
    expect(splitPrefix('Rating')[0]).toBe('shared');
  });
});

describe('visibility — the monetization boundary', () => {
  it('marks staff-only workflow fields internal', () => {
    for (const f of ['AI_Draft_Notes', 'Broker_Input_Notes', 'PriceRange_Internal',
                     'Pipeline_Status', 'Owner_Ref', 'Deep_Intel_Gate']) {
      expect(visibilityOf(f)).toBe(VISIBILITY.INTERNAL);
    }
  });

  it('marks spatial media as Vault', () => {
    expect(visibilityOf('Luma_3D_Map_URL')).toBe(VISIBILITY.VAULT);
    expect(visibilityOf('Floor_Plans')).toBe(VISIBILITY.VAULT);
  });

  it('marks investor figures as deep intel', () => {
    expect(visibilityOf('CM_Cap_Rate')).toBe(VISIBILITY.DEEP_INTEL);
    expect(visibilityOf('HOSP_RevPAR')).toBe(VISIBILITY.DEEP_INTEL);
  });

  it('defaults an unknown field to public', () => {
    expect(visibilityOf('Some_New_Field')).toBe(VISIBILITY.PUBLIC);
  });

  // Cross-cutting invariant from FIELD_VISIBILITY_MAP.md: hazard data is
  // NEVER gated, at any tier. If someone adds it to a gated set, fail loudly.
  it('never gates flood or hazard risk', () => {
    for (const f of ['FloodRiskScore', 'FloodZoneStatus']) {
      expect(isGated(f)).toBe(false);
      expect(isInternal(f)).toBe(false);
    }
  });

  it('internal and gated are mutually exclusive', () => {
    for (const f of INTERNAL_FIELDS) {
      expect(isGated(f)).toBe(false);
    }
  });
});

describe('groupFields', () => {
  const names = ['CM_Rent_From', 'RS_Price', 'Amenities', 'AI_Draft_Notes', 'CM_PEZA'];

  it('puts internal fields in their own bucket, never in a category panel', () => {
    const groups = groupFields(names);
    expect(groups.internal.map((f) => f.name)).toEqual(['AI_Draft_Notes']);
    for (const [bucket, list] of Object.entries(groups)) {
      if (bucket === 'internal') continue;
      expect(list.some((f) => f.name === 'AI_Draft_Notes')).toBe(false);
    }
  });

  it('drops other categories when a category is given', () => {
    const groups = groupFields(names, { category: 'commercial' });
    const shown = Object.values(groups).flat().map((f) => f.name);
    expect(shown).toContain('CM_Rent_From');
    expect(shown).toContain('Amenities'); // shared always survives
    expect(shown).not.toContain('RS_Price');
  });

  it('sorts each panel by label so staff can scan alphabetically', () => {
    const groups = groupFields(['CM_Total_GLA', 'CM_Backup_Power', 'CM_PEZA']);
    const labels = groups.Commercial.map((f) => f.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it('survives nullish input', () => {
    expect(groupFields(null)).toEqual({});
  });
});

describe('omitInternal — last line of defence', () => {
  it('strips internal keys from a spread record', () => {
    const out = omitInternal({
      Title: 'One BGC',
      AI_Draft_Notes: 'not for the public',
      PriceRange_Internal: 'secret',
      RS_Price: 1000,
    });
    expect(out).toEqual({ Title: 'One BGC', RS_Price: 1000 });
  });

  it('passes non-objects through untouched', () => {
    expect(omitInternal(null)).toBeNull();
    expect(omitInternal('x')).toBe('x');
  });
});

describe('fieldMeta', () => {
  it('returns everything a Mission Control row needs', () => {
    expect(fieldMeta('CM_CAMC_Per_Sqm')).toEqual({
      key: 'CM_CAMC_Per_Sqm',
      name: 'CM_CAMC_Per_Sqm',
      label: 'CAMC per sqm',
      category: 'commercial',
      categoryLabel: 'Commercial',
      visibility: 'public',
      isMachine: false,
      gated: false,
    });
  });

  it('flags JSON blobs as machine-shaped so staff UI can collapse them', () => {
    expect(fieldMeta('Units_JSON').isMachine).toBe(true);
    expect(fieldMeta('DeepIntel_JSON').isMachine).toBe(true);
    expect(fieldMeta('Amenities').isMachine).toBe(false);
  });
});
