import { test, expect } from '@playwright/test';
import { expandDeepIntel } from '../../src/lib/airtable';

test.describe('expandDeepIntel', () => {
  test('should parse valid JSON correctly', () => {
    const validJson = JSON.stringify({ DI_Ceiling: "3m" });
    const result = expandDeepIntel(validJson);
    expect(result.DI_Ceiling).toBe("3m");
    expect(result["Clear Ceiling Height"]).toBe("3m");
  });

  test('should fallback to empty object on invalid JSON', () => {
    const invalidJson = "{ invalid_json: true ";
    const result = expandDeepIntel(invalidJson);
    expect(result).toEqual({});
  });

  test('should fallback to empty object on empty string', () => {
    const emptyStr = "";
    const result = expandDeepIntel(emptyStr);
    expect(result).toEqual({});
  });

  test('should fallback to empty object on null or undefined', () => {
    expect(expandDeepIntel(null)).toEqual({});
    expect(expandDeepIntel(undefined)).toEqual({});
  });

  test('should not override existing label if already present', () => {
    const jsonStr = JSON.stringify({ DI_Ceiling: "3m", "Clear Ceiling Height": "4m" });
    const result = expandDeepIntel(jsonStr);
    expect(result.DI_Ceiling).toBe("3m");
    expect(result["Clear Ceiling Height"]).toBe("4m");
  });
});
