import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { expandDeepIntel } from '../airtable.js';

describe('expandDeepIntel', () => {
  it('should parse valid JSON correctly', () => {
    const validJson = JSON.stringify({ DI_Ceiling: "3m" });
    const result = expandDeepIntel(validJson);
    expect(result.DI_Ceiling).toBe("3m");
    expect(result["Clear Ceiling Height"]).toBe("3m");
  });

  it('should fallback to empty object on invalid JSON', () => {
    const invalidJson = "{ invalid_json: true ";
    const result = expandDeepIntel(invalidJson);
    expect(result).toEqual({});
  });

  it('should fallback to empty object on empty string', () => {
    const emptyStr = "";
    const result = expandDeepIntel(emptyStr);
    expect(result).toEqual({});
  });

  it('should fallback to empty object on null or undefined', () => {
    expect(expandDeepIntel(null)).toEqual({});
    expect(expandDeepIntel(undefined)).toEqual({});
  });

  it('should not override existing label if already present', () => {
    const jsonStr = JSON.stringify({ DI_Ceiling: "3m", "Clear Ceiling Height": "4m" });
    const result = expandDeepIntel(jsonStr);
    expect(result.DI_Ceiling).toBe("3m");
    expect(result["Clear Ceiling Height"]).toBe("4m");
  });
});


// ─────────────────────────────────────────────────────────────────────────
// A field that exists in Airtable and has no consumer in code is invisible:
// nothing errors, nothing logs, the feature just quietly does nothing. That is
// how SEO_Title, Floor_Plans and Verification_Status each hid for months
// (AIRTABLE_COMPRESSION_PLAN F1/F2/F3), and how Related_Property hid until
// 2026-08-20 despite being the strongest article↔property signal in the base.
//
// This asserts the wiring, not the data. The Airtable records are empty today;
// the mapping still has to survive.
// ─────────────────────────────────────────────────────────────────────────
describe('fetchIntel field wiring', () => {
  const source = readFileSync('src/lib/airtable.js', 'utf8');

  it('maps Related_Property, the link field that drives "About this property"', () => {
    expect(source).toContain('relatedPropertyIds');
    expect(source).toContain('f.Related_Property');
  });

  it('defends against Airtable returning a non-array for the link field', () => {
    // An empty link field is omitted from the payload entirely rather than
    // returned as [], so the guard is doing real work on every article that
    // has no related property — which is currently all of them.
    expect(source).toContain('Array.isArray(f.Related_Property) ? f.Related_Property : []');
  });

  it('preserves article location and district for property-market matching', () => {
    expect(source).toContain('location:     f.Location');
    expect(source).toContain('district:     f.District');
  });
});
