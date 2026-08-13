import { describe, expect, it } from "vitest";

import { sanitizeObject, stripAllTags } from "../sanitize";

describe("plain-text sanitization boundary", () => {
  it("converts ordinary markup to separated plain text", () => {
    expect(stripAllTags("<p>Hello <b>there</b></p>")).toBe("Hello there");
  });

  it.each([
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "<svg><a href='javascript:alert(1)'>link</a></svg>",
    "broken <tag data-value='>' still-open",
    "stray > delimiter",
  ])("never returns an HTML tag delimiter for %s", (payload) => {
    const result = stripAllTags(payload);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("recursively sanitizes values and rejects prototype-polluting keys", () => {
    const input = JSON.parse('{"safe":"<b>value</b>","__proto__":{"polluted":true}}');
    const result = sanitizeObject(input);

    expect(result.safe).toBe("value");
    expect(Object.prototype.polluted).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(result, "__proto__")).toBe(false);
  });
});
