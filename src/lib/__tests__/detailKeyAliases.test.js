import { describe, it, expect } from 'vitest';
import { resolveDetailKey, snakeToCamel } from '../detailKeyAliases.js';
import { groupFields } from '../propertyFieldRegistry.js';

// properties.details in the live database mixes THREE naming conventions for
// the same facts. If they don't collapse onto one canonical name, the editor
// shows the same value twice under different headings and the last save wins.

// The real distinct keys observed in live rows, 2026-07-30.
const LIVE_KEYS = [
  'units_inventory', 'CM_Rent_Per_Sqm', 'PEZA', 'camc', 'CM_Certification',
  'CM_Floor_Plate_Sqm', 'CM_Min_Lease_Term', 'CM_Building_Grade', 'CM_Total_GLA',
  'CM_Availability_Status', 'CM_CAMC_Per_Sqm', 'CM_AC_Charges',
  'CM_Hand_Over_Condition', 'ac_charges', 'available_units', 'towers_zones',
  'availability', 'published_rent', 'camc_from', 'certification',
  'hand_over_condition', 'reserved_parking', 'ac_system', 'ac_charge_from', 'source',
];

describe('snakeToCamel', () => {
  it.each([
    ['ac_charges', 'acCharges'],
    ['hand_over_condition', 'handOverCondition'],
    ['towers_zones', 'towersZones'],
    ['camc', 'camc'],
  ])('%s -> %s', (a, b) => expect(snakeToCamel(a)).toBe(b));
});

describe('resolveDetailKey — collapse all three conventions', () => {
  it.each([
    ['ac_charges', 'CM_AC_Charges'],
    ['acCharges', 'CM_AC_Charges'],
    ['CM_AC_Charges', 'CM_AC_Charges'],
    ['camc', 'CM_CAMC_Per_Sqm'],
    ['towers_zones', 'CM_Towers_Zones'],
    ['available_units', 'CM_Available_Units_Summary'],
  ])('%s -> %s', (input, expected) => {
    expect(resolveDetailKey(input, 'commercial')).toBe(expected);
  });

  // Regression: snakeToCamel gives "handOverCondition" but the alias table uses
  // "handOver", so the generic path missed it and the field rendered TWICE.
  it('resolves legacy keys the generic conversion cannot find', () => {
    expect(resolveDetailKey('hand_over_condition')).toBe('CM_Hand_Over_Condition');
    expect(resolveDetailKey('camc_from')).toBe('CM_CAMC_From');
    expect(resolveDetailKey('ac_charge_from')).toBe('CM_AC_Charge_From');
    expect(resolveDetailKey('PEZA')).toBe('CM_PEZA');
  });

  // Ambiguous camelCase keys are shared across categories. Resolving without
  // the category would show a venue a restaurant's ceiling height.
  it.each([
    ['ceiling', 'restaurants', 'RST_Ceiling_Height'],
    ['ceiling', 'venues', 'VEN_Ceiling_Height'],
    ['capRate', 'commercial', 'CM_Cap_Rate'],
    ['capRate', 'hospitality', 'HOSP_Cap_Rate'],
    ['power', 'restaurants', 'RST_Power_Capacity'],
    ['power', 'venues', 'VEN_Power_Capacity'],
  ])('disambiguates "%s" for %s', (key, category, expected) => {
    expect(resolveDetailKey(key, category)).toBe(expected);
  });

  it('prefers the shared field when no category is given', () => {
    // parking → Parking_Slots | RST_Parking | VEN_Parking. Unprefixed wins.
    expect(resolveDetailKey('parking')).toBe('Parking_Slots');
  });

  it('returns unknown keys unchanged so nothing vanishes from the editor', () => {
    expect(resolveDetailKey('published_rent')).toBe('CM_Rent_Per_Sqm');
    expect(resolveDetailKey('some_future_key')).toBe('some_future_key');
  });

  it('survives nullish input', () => {
    expect(resolveDetailKey(null)).toBeNull();
    expect(resolveDetailKey('')).toBe('');
  });
});

describe('groupFields against the real live keys', () => {
  const grouped = groupFields(LIVE_KEYS, { category: 'commercial' });
  const all = Object.values(grouped).flat();

  it('renders each fact exactly once — no duplicate labels', () => {
    const labels = all.map((f) => f.label);
    expect(labels.length).toBe(new Set(labels).size);
  });

  it('renders each canonical field exactly once', () => {
    const names = all.map((f) => f.name);
    expect(names.length).toBe(new Set(names).size);
  });

  it('files snake_case commercial keys under Commercial, not Shared', () => {
    const commercial = (grouped.Commercial || []).map((f) => f.name);
    for (const name of ['CM_AC_Charges', 'CM_Towers_Zones', 'CM_Reserved_Parking',
                        'CM_Hand_Over_Condition', 'CM_PEZA']) {
      expect(commercial).toContain(name);
    }
  });

  // When a record holds BOTH conventions, the canonical key must win
  // regardless of JSON key order — otherwise the same record renders
  // differently between requests.
  it('prefers the canonical key on collision, order-independently', () => {
    const a = groupFields(['CM_AC_Charges', 'ac_charges'], { category: 'commercial' });
    const b = groupFields(['ac_charges', 'CM_AC_Charges'], { category: 'commercial' });
    const keyOf = (g) => Object.values(g).flat().find((f) => f.name === 'CM_AC_Charges').key;
    expect(keyOf(a)).toBe('CM_AC_Charges');
    expect(keyOf(b)).toBe('CM_AC_Charges');
  });

  it('keeps every row saveable under its ORIGINAL key', () => {
    // Writing to the canonical name instead would create a second key and
    // leave the stale original still serving the public page.
    for (const field of all) {
      expect(LIVE_KEYS).toContain(field.key);
    }
  });

  it('marks the units blob as machine-shaped', () => {
    const units = all.find((f) => f.key === 'units_inventory');
    expect(units.isMachine).toBe(true);
  });
});
