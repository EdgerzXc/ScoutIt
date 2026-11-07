import { describe, expect, it } from "vitest";
import {
  validateAndSanitizeAssimilated,
  sanitizeMediaLink,
  sanitizePrice,
  sanitizeDescription,
  sanitizeDetails,
  MAX_RAW_TEXT_CHARS,
  MAX_DESCRIPTION_CHARS,
  MAX_PDF_BYTES,
} from "@/lib/assimilateProperty";

describe("Assimilate Property · Validation & Sanitization (A-302)", () => {
  it("enforces price boundaries: strips negative, non-finite, and absurd numbers", () => {
    expect(sanitizePrice(-50000)).toBe(null);
    expect(sanitizePrice(Infinity)).toBe(null);
    expect(sanitizePrice(NaN)).toBe(null);
    expect(sanitizePrice(999_999_999_999_999)).toBe(null);

    // Valid prices
    expect(sanitizePrice(15000000)).toBe(15000000);
    expect(sanitizePrice("₱15,000,000")).toBe(15000000);
    expect(sanitizePrice("Php 45,000")).toBe(45000);
    expect(sanitizePrice(0)).toBe(0);
  });

  it("sanitizes media_link: blocks javascript:, data:, file:, and malformed schemes", () => {
    expect(sanitizeMediaLink("javascript:alert(document.cookie)")).toBe(null);
    expect(sanitizeMediaLink("data:text/html,<script>evil()</script>")).toBe(null);
    expect(sanitizeMediaLink("file:///etc/passwd")).toBe(null);
    expect(sanitizeMediaLink("vbscript:msgbox")).toBe(null);
    expect(sanitizeMediaLink("not a valid url")).toBe(null);
    expect(sanitizeMediaLink("")).toBe(null);
    expect(sanitizeMediaLink(null)).toBe(null);

    // Valid http/https
    expect(sanitizeMediaLink("https://storage.scoutit.space/brochure.pdf")).toBe(
      "https://storage.scoutit.space/brochure.pdf"
    );
    expect(sanitizeMediaLink("http://example.com/property")).toBe("http://example.com/property");
  });

  it("sanitizes description: strips <script> tags, null bytes, and truncates to MAX_DESCRIPTION_CHARS", () => {
    const malicious = "Beautiful penthouse <script>stealTokens()</script> with panoramic view.\0";
    const cleaned = sanitizeDescription(malicious);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("stealTokens()");
    expect(cleaned).not.toContain("\0");
    expect(cleaned).toContain("Beautiful penthouse");

    const huge = "A".repeat(10000);
    expect(sanitizeDescription(huge).length).toBe(MAX_DESCRIPTION_CHARS);
  });

  it("sanitizes details: eliminates prototype pollution (__proto__, constructor) and limits key count", () => {
    const hostile = {
      __proto__: { injected: true },
      constructor: { hacked: true },
      prototype: { evil: true },
      "bad<script>key": "val",
      valid_sqm: 120,
      building_name: "Tower One",
      parking_slots: 2,
    };

    const cleaned = sanitizeDetails(hostile);
    expect(cleaned.__proto__).toBe(Object.prototype);
    expect(cleaned.constructor).toBe(Object);
    expect(Object.prototype.injected).toBeUndefined();
    expect(cleaned.valid_sqm).toBe(120);
    expect(cleaned.building_name).toBe("Tower One");
    expect(cleaned.parking_slots).toBe(2);
    expect(cleaned["bad<script>key"]).toBeUndefined();
  });

  it("validateAndSanitizeAssimilated neutralizes full hostile payload", () => {
    const hostilePayload = {
      title: "  Hostile Penthouse Listing  ",
      location: "Taguig City",
      space_category: "invalid_category",
      price: -100000,
      media_link: "javascript:evil()",
      description: "Hostile description <script>xss()</script>",
      details: {
        __proto__: { admin: true },
        amenities: ["pool", "gym"],
      },
      confidence: 1.5, // out of range
      gaps: ["price"],
    };

    const sanitized = validateAndSanitizeAssimilated(hostilePayload, "Default Title");

    expect(sanitized.title).toBe("Hostile Penthouse Listing");
    expect(sanitized.space_category).toBe(null); // invalid category rejected
    expect(sanitized.price).toBe(null); // negative price rejected
    expect(sanitized.price_status).toBe("On Request");
    expect(sanitized.media_link).toBe(null); // javascript: link rejected
    expect(sanitized.description).toBe("Hostile description");
    expect(sanitized.confidence).toBe(1.0); // clamped to 1.0
    expect(sanitized.details.amenities).toEqual(["pool", "gym"]);
    expect(sanitized.pipeline_status).toBe("pending");
  });

  it("exports sensible limits for text and PDF payload size", () => {
    expect(MAX_RAW_TEXT_CHARS).toBe(50000);
    expect(MAX_DESCRIPTION_CHARS).toBe(5000);
    expect(MAX_PDF_BYTES).toBe(25 * 1024 * 1024);
  });
});
