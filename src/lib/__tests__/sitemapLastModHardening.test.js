import { describe, it, expect, vi, beforeEach } from "vitest";

const { getCmsBundle } = vi.hoisted(() => ({
  getCmsBundle: vi.fn(),
}));

vi.mock("@/lib/cmsCache", () => ({ getCmsBundle }));

import sitemap, { safeIsoDate, STATIC_SITEMAP_DATE } from "@/app/sitemap";

describe("A-325: Sitemap lastmod Dynamic Timestamp Hardening (D-10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes ISO dates and falls back to baseline safely", () => {
    expect(safeIsoDate("2026-10-15T08:30:00Z", "fallback-iso")).toBe("2026-10-15T08:30:00.000Z");
    expect(safeIsoDate(null, "fallback-iso")).toBe("fallback-iso");
    expect(safeIsoDate("", "fallback-iso")).toBe("fallback-iso");
    expect(safeIsoDate("not-a-valid-date", "fallback-iso")).toBe("fallback-iso");
  });

  it("applies item-specific last_verified_date to property routes", async () => {
    const verifiedPropertyDate = "2026-10-20T14:00:00.000Z";
    getCmsBundle.mockResolvedValue({
      source: "upstash_redis",
      properties: [
        {
          slug: "alpha-tower",
          is_sample: false,
          last_verified_date: verifiedPropertyDate,
        },
        {
          slug: "beta-tower",
          is_sample: false,
          last_verified_date: null,
          updated_at: "2026-09-01T00:00:00.000Z",
        },
      ],
      intel: [],
      brokers: [],
    });

    const entries = await sitemap();
    const alpha = entries.find((e) => e.url.endsWith("/property/alpha-tower"));
    const beta = entries.find((e) => e.url.endsWith("/property/beta-tower"));

    expect(alpha).toBeDefined();
    expect(alpha.lastModified).toBe(verifiedPropertyDate);

    expect(beta).toBeDefined();
    expect(beta.lastModified).toBe("2026-09-01T00:00:00.000Z");
  });

  it("applies unit and intel publication dates rather than dynamic request timestamps", async () => {
    const articleDate = "2026-10-05T12:00:00.000Z";
    const unitDate = "2026-10-12T09:00:00.000Z";
    getCmsBundle.mockResolvedValue({
      source: "upstash_redis",
      properties: [
        {
          slug: "gamma-tower",
          is_sample: false,
          last_verified_date: "2026-10-10T00:00:00.000Z",
          units_inventory: [
            { id: "unit-101", last_verified_date: unitDate },
            { id: "unit-102" }, // inherits parent date
          ],
        },
      ],
      intel: [
        {
          slug: "bgc-market-report",
          date: articleDate,
        },
      ],
      brokers: [],
    });

    const entries = await sitemap();
    const unit101 = entries.find((e) => e.url.endsWith("/unit/unit-101"));
    const unit102 = entries.find((e) => e.url.endsWith("/unit/unit-102"));
    const intel = entries.find((e) => e.url.endsWith("/intel/bgc-market-report"));

    expect(unit101).toBeDefined();
    expect(unit101.lastModified).toBe(unitDate);

    expect(unit102).toBeDefined();
    expect(unit102.lastModified).toBe("2026-10-10T00:00:00.000Z");

    expect(intel).toBeDefined();
    expect(intel.lastModified).toBe(articleDate);
  });

  it("stamps static and hub routes with stable baseline date", async () => {
    getCmsBundle.mockResolvedValue({
      source: "upstash_redis",
      properties: [],
      intel: [],
      brokers: [],
    });

    const entries = await sitemap();
    const home = entries.find((e) => e.url.endsWith("scoutit.space") || e.url.endsWith("localhost:3000"));
    const hub = entries.find((e) => e.url.includes("/hubs/"));

    expect(home).toBeDefined();
    expect(home.lastModified).toBe(STATIC_SITEMAP_DATE);

    if (hub) {
      expect(hub.lastModified).toBe(STATIC_SITEMAP_DATE);
    }
  });
});
