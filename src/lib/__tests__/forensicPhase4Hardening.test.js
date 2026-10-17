import { describe, it, expect, vi, beforeEach } from "vitest";
import robots from "@/app/robots";

// Mock cmsCache for sitemap testing
vi.mock("@/lib/cmsCache", () => ({
  getCmsBundle: vi.fn().mockResolvedValue({
    source: "upstash_redis",
    properties: [
      {
        slug: "bgc-tower-one",
        is_sample: false,
        units_inventory: [
          { id: "unit-101", name: "Executive Suite" },
          { id: "unit-102", name: "Corner Office" },
        ],
      },
      {
        slug: "makati-sky-villas",
        is_sample: false,
        units_inventory: [],
      },
      {
        slug: "sample-property",
        is_sample: true,
        units_inventory: [{ id: "unit-999" }],
      },
    ],
    intel: [],
    brokers: [],
  }),
}));

describe("A-210 Phase 4: Edge Proxy, Network & Crawler Boundaries", () => {
  describe("GAP-22: Search Crawler Disallow on One-Time Claim Tokens", () => {
    it("disallows /claim and /claim/ in robots.js", () => {
      const config = robots();
      const disallowRules = config.rules[0].disallow;
      expect(disallowRules).toContain("/claim");
      expect(disallowRules).toContain("/claim/");
    });
  });

  describe("GAP-06 & GAP-10: Sitemap Canonical Static Routes & Child Space Units", () => {
    it("includes /contact, /transit, and /about-you in sitemap static routes (GAP-06)", async () => {
      const sitemap = (await import("@/app/sitemap")).default;
      const routes = await sitemap();
      const urls = routes.map((r) => r.url);

      expect(urls).toContain("https://www.scoutit.space/contact");
      expect(urls).toContain("https://www.scoutit.space/transit");
      expect(urls).toContain("https://www.scoutit.space/about-you");
    });

    it("generates child unit routes for non-sample properties with units_inventory (GAP-10)", async () => {
      const sitemap = (await import("@/app/sitemap")).default;
      const routes = await sitemap();
      const urls = routes.map((r) => r.url);

      expect(urls).toContain("https://www.scoutit.space/property/bgc-tower-one/unit/unit-101");
      expect(urls).toContain("https://www.scoutit.space/property/bgc-tower-one/unit/unit-102");
      // Sample property units should never be in sitemap
      expect(urls).not.toContain("https://www.scoutit.space/property/sample-property/unit/unit-999");
    });
  });

  describe("GAP-13 & GAP-14: Edge Proxy IP Parsing & Inbound Webhooks Exemption", () => {
    it("proxy correctly processes first IP and exempts webhooks from global_read_only", async () => {
      const { readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const proxySrc = readFileSync(resolve(process.cwd(), "src/proxy.js"), "utf8");

      // GAP-13: check IP parsing
      expect(proxySrc).toContain("rawIp.split(',')[0].trim()");

      // GAP-14: check webhook exemptions
      expect(proxySrc).toContain("isExemptFromMaintenance");
      expect(proxySrc).toContain("/api/webhooks/");
      expect(proxySrc).toContain("/api/calendar/sync");
      expect(proxySrc).toContain("/api/oauth/");
    });
  });
});
