import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractPhotoUrls } from "../propertyMedia.js";
import { canChangeDisplayTitle, PROPERTY_LIFECYCLE_STATES } from "../propertyLifecycle.js";

describe("Canonical Slug Freeze and Photo Hardening (A-306)", () => {
  describe("extractPhotoUrls", () => {
    it("handles null, undefined, empty inputs safely", () => {
      expect(extractPhotoUrls(null)).toEqual([]);
      expect(extractPhotoUrls(undefined)).toEqual([]);
      expect(extractPhotoUrls("")).toEqual([]);
      expect(extractPhotoUrls([])).toEqual([]);
      expect(extractPhotoUrls({})).toEqual([]);
    });

    it("parses comma-separated URL strings cleanly", () => {
      const input = "https://example.com/photo1.jpg, https://example.com/photo2.webp";
      expect(extractPhotoUrls(input)).toEqual([
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.webp",
      ]);
    });

    it("handles arrays of Airtable attachment objects without throwing", () => {
      const attachments = [
        { url: "https://v5.airtableusercontent.com/1.jpg", filename: "1.jpg" },
        { filename: "missing-url.jpg" }, // malformed attachment
        null,
        { url: "https://v5.airtableusercontent.com/2.jpg", filename: "2.jpg" },
        { thumbnails: { large: { url: "https://v5.airtableusercontent.com/3.jpg" } } },
      ];

      expect(extractPhotoUrls(attachments)).toEqual([
        "https://v5.airtableusercontent.com/1.jpg",
        "https://v5.airtableusercontent.com/2.jpg",
        "https://v5.airtableusercontent.com/3.jpg",
      ]);
    });

    it("discards dangerous schemes and malformed URLs while preserving valid ones", () => {
      const mixed = [
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "file:///etc/passwd",
        "https://example.com/valid.jpg",
        "not a valid url",
        "https://example.com/valid2.jpg",
      ];

      expect(extractPhotoUrls(mixed)).toEqual([
        "https://example.com/valid.jpg",
        "https://example.com/valid2.jpg",
      ]);
    });

    it("deduplicates repeated photos", () => {
      const repeated = [
        "https://example.com/photo1.jpg",
        "https://example.com/photo1.jpg",
        { url: "https://example.com/photo1.jpg" },
        "https://example.com/photo2.jpg",
      ];

      expect(extractPhotoUrls(repeated)).toEqual([
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
      ]);
    });
  });

  describe("canChangeDisplayTitle", () => {
    it("permits title change on initial draft without canonical_slug", () => {
      expect(canChangeDisplayTitle({
        lifecycle_state: PROPERTY_LIFECYCLE_STATES.DRAFT,
        canonical_slug: null,
      })).toBe(true);
    });

    it("blocks title change whenever canonical_slug is already set", () => {
      expect(canChangeDisplayTitle({
        lifecycle_state: PROPERTY_LIFECYCLE_STATES.DRAFT,
        canonical_slug: "established-slug",
      })).toBe(false);
    });

    it("blocks title change for live listings", () => {
      expect(canChangeDisplayTitle({
        lifecycle_state: PROPERTY_LIFECYCLE_STATES.LIVE,
      })).toBe(false);
    });

    it("blocks title change for off-market or removed listings", () => {
      expect(canChangeDisplayTitle({
        lifecycle_state: PROPERTY_LIFECYCLE_STATES.OFF_MARKET,
      })).toBe(false);
      expect(canChangeDisplayTitle({
        lifecycle_state: PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED,
      })).toBe(false);
    });
  });

  describe("Source Code Contracts for Slug Freeze & Photo Hardening", () => {
    it("pins airtable.js photo parsing to extractPhotoUrls", () => {
      const airtableSrc = readFileSync("src/lib/airtable.js", "utf8");
      expect(airtableSrc).toContain("extractPhotoUrls(f.Photos)");
      expect(airtableSrc).toContain("extractPhotoUrls(f.Enhanced_Photos)");
      expect(airtableSrc).toContain("extractPhotoUrls(data?.details?.photos)");
      expect(airtableSrc).not.toContain("f.Photos.split");
      expect(airtableSrc).not.toContain("f.Enhanced_Photos.split");
    });

    it("pins publish route to frozen canonical slug and redirect tracking", () => {
      const publishSrc = readFileSync("src/app/api/dashboard/publish/route.js", "utf8");
      expect(publishSrc).toContain("recordHistoricalSlug");
      expect(publishSrc).toContain("finalSlug = currentSubmission.canonical_slug || computedSlug;");
    });

    it("pins dashboard update route to lock live listing titles", () => {
      const updateSrc = readFileSync("src/app/api/dashboard/update/route.js", "utf8");
      expect(updateSrc).toContain("canChangeDisplayTitle(currentSubmission)");
      expect(updateSrc).toContain("Live listing titles are locked to protect the canonical public URL");
    });
  });
});
