import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock serverAuth
vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(async () => "user-authed-123"),
}));

// Mock rateLimit and clientIp
vi.mock("@/lib/clientIp", () => ({
  clientIp: () => "127.0.0.1",
}));

describe("A-321 — AI Batch Endpoints Bounded Inputs, Per-Item Limits & Rate Limiting", () => {
  describe("src/app/api/ai/assimilate/route.js", () => {
    it("exports canonical constants and rate limiter", async () => {
      const {
        MAX_ASSIMILATE_ITEMS,
        MAX_ITEM_CHARS,
        MAX_TOTAL_CHARS,
        checkAssimilateRate,
        SCOUTIT_SCHEMA_PROMPT,
      } = await import("@/app/api/ai/assimilate/route");

      expect(MAX_ASSIMILATE_ITEMS).toBe(20);
      expect(MAX_ITEM_CHARS).toBe(20_000);
      expect(MAX_TOTAL_CHARS).toBe(100_000);
      expect(typeof checkAssimilateRate).toBe("function");
      expect(SCOUTIT_SCHEMA_PROMPT).toContain("<untrusted_property_data>");
      expect(SCOUTIT_SCHEMA_PROMPT).toContain("SECURITY MANDATE");
    });

    it("rejects an item exceeding MAX_ITEM_CHARS with 413", async () => {
      const { POST } = await import("@/app/api/ai/assimilate/route");
      const hugeDescription = "A".repeat(25_000);
      const req = new Request("https://www.scoutit.space/api/ai/assimilate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "csv",
          payload: [{ title: "Property 1", notes: hugeDescription }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toContain("exceeds maximum allowed size");
    });

    it("rejects total payload exceeding MAX_TOTAL_CHARS with 413", async () => {
      const { POST } = await import("@/app/api/ai/assimilate/route");
      // 10 items of 15,000 chars = 150,000 chars (> 100,000)
      const payload = Array.from({ length: 10 }, (_, i) => ({
        title: `Property ${i}`,
        notes: "X".repeat(15_000),
      }));
      const req = new Request("https://www.scoutit.space/api/ai/assimilate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "csv", payload }),
      });

      const res = await POST(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toContain("Total payload exceeds maximum allowed size");
    });

    it("rejects requests exceeding rate limit with 429", async () => {
      const { POST, checkAssimilateRate } = await import("@/app/api/ai/assimilate/route");
      // Exhaust rate limiter
      for (let i = 0; i < 25; i++) {
        checkAssimilateRate("127.0.0.1");
      }

      const req = new Request("https://www.scoutit.space/api/ai/assimilate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "csv", payload: [{ title: "Valid" }] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeDefined();
    });
  });

  describe("src/app/api/ai/blueprint/route.js", () => {
    it("exports canonical constants and rate limiter", async () => {
      const {
        MAX_CSV_HEADERS,
        MAX_HEADER_CHARS,
        MAX_SAMPLE_ROWS,
        MAX_SAMPLE_ROW_CHARS,
        checkBlueprintRate,
      } = await import("@/app/api/ai/blueprint/route");

      expect(MAX_CSV_HEADERS).toBe(100);
      expect(MAX_HEADER_CHARS).toBe(120);
      expect(MAX_SAMPLE_ROWS).toBe(5);
      expect(MAX_SAMPLE_ROW_CHARS).toBe(5_000);
      expect(typeof checkBlueprintRate).toBe("function");
    });

    it("rejects headers array exceeding MAX_CSV_HEADERS with 413", async () => {
      const { POST } = await import("@/app/api/ai/blueprint/route");
      const headers = Array.from({ length: 105 }, (_, i) => `Col_${i}`);
      const req = new Request("https://www.scoutit.space/api/ai/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers,
          sampleData: [{ Col_0: "Val" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toContain("Too many headers");
    });

    it("rejects sampleData exceeding MAX_SAMPLE_ROWS with 413", async () => {
      const { POST } = await import("@/app/api/ai/blueprint/route");
      const headers = ["Title", "Price"];
      const sampleData = Array.from({ length: 10 }, (_, i) => ({ Title: `Row ${i}`, Price: 100 }));
      const req = new Request("https://www.scoutit.space/api/ai/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, sampleData }),
      });

      const res = await POST(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toContain("Sample data exceeds maximum rows");
    });
  });

  describe("src/app/api/ai/rewrite/route.js", () => {
    it("exports canonical constants and rate limiter", async () => {
      const {
        MAX_REWRITE_CHARS,
        MAX_LOCATION_CHARS,
        MAX_CATEGORY_CHARS,
        checkRewriteRate,
        SEO_OPTIMIZE_PROMPT,
      } = await import("@/app/api/ai/rewrite/route");

      expect(MAX_REWRITE_CHARS).toBe(8_000);
      expect(MAX_LOCATION_CHARS).toBe(120);
      expect(MAX_CATEGORY_CHARS).toBe(50);
      expect(typeof checkRewriteRate).toBe("function");
      expect(SEO_OPTIMIZE_PROMPT).toContain("<untrusted_description_to_rewrite>");
      expect(SEO_OPTIMIZE_PROMPT).toContain("Security Mandate");
    });

    it("rejects text exceeding MAX_REWRITE_CHARS with 413", async () => {
      const { POST } = await import("@/app/api/ai/rewrite/route");
      const text = "W".repeat(9_000);
      const req = new Request("https://www.scoutit.space/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, location: "Makati", category: "Commercial" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toContain("Text exceeds maximum allowed length");
    });
  });
});
