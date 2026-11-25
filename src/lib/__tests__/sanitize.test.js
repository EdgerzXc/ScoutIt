import { describe, expect, it } from "vitest";

import { extractSafeSvgMarkup, sanitizeObject, stripAllTags } from "../sanitize";

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

describe("extractSafeSvgMarkup for 2FA QR codes", () => {
  const cleanSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>';

  it("accepts raw SVG and Supabase data:image/svg+xml;utf-8 QR payloads", () => {
    expect(extractSafeSvgMarkup(cleanSvg)).toBe(cleanSvg);
    expect(extractSafeSvgMarkup(`data:image/svg+xml;utf-8,${cleanSvg}`)).toBe(cleanSvg);
    expect(extractSafeSvgMarkup(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`)).toBe(cleanSvg);
  });

  it("rejects scripts, event handlers, HTML data URIs, and base64 payloads", () => {
    expect(extractSafeSvgMarkup("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(extractSafeSvgMarkup("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBeNull();
    expect(extractSafeSvgMarkup("data:image/svg+xml;utf-8,<svg onload=\"alert(1)\"><rect/></svg>")).toBeNull();
    expect(extractSafeSvgMarkup(`data:image/svg+xml;utf-8,${encodeURIComponent('<svg><script>alert(1)</script></svg>')}`)).toBeNull();
  });
});
