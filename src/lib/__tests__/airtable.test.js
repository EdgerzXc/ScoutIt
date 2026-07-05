import { describe, it, expect } from 'vitest';
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
