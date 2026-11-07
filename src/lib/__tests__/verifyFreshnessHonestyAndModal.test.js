import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const { getCmsBundle, invalidateCmsBundle } = vi.hoisted(() => ({
  getCmsBundle: vi.fn(),
  invalidateCmsBundle: vi.fn(async () => ({ sharedCachePurged: true })),
}));

vi.mock("@/lib/cmsCache", () => ({ getCmsBundle, invalidateCmsBundle }));

const { resolveUserId } = vi.hoisted(() => ({
  resolveUserId: vi.fn(),
}));

vi.mock("@/lib/serverAuth", () => ({ resolveUserId }));

const { stampAirtableFreshness } = vi.hoisted(() => ({
  stampAirtableFreshness: vi.fn(),
}));

vi.mock("@/lib/airtableFreshness", () => ({ stampAirtableFreshness }));

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (...args) => mockFrom(...args),
  },
}));

import { GET, POST } from "@/app/api/dashboard/verify-freshness/route";

describe("A-326: Freshness Verification Transparency & Modal Selection Hardening (D-07, D-08)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/dashboard/verify-freshness", () => {
    it("flags cmsSyncPending: true when public Airtable catalogue is lagging behind Supabase", async () => {
      resolveUserId.mockResolvedValue("owner-123");

      const supabaseDate = "2026-11-06T10:00:00.000Z";
      const laggingAirtableDate = "2026-09-01T10:00:00.000Z";

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "prop-1",
                    slug: "lagging-tower",
                    canonical_slug: "lagging-tower",
                    title: "Lagging Tower",
                    location: "BGC",
                    last_verified_date: supabaseDate,
                    pipeline_status: "published",
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      getCmsBundle.mockResolvedValue({
        properties: [
          {
            slug: "lagging-tower",
            last_verified_date: laggingAirtableDate,
          },
        ],
      });

      const res = await GET(new Request("http://localhost/api/dashboard/verify-freshness"));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.items).toHaveLength(1);
      const item = json.items[0];
      expect(item.id).toBe("prop-1");
      expect(item.cmsSyncPending).toBe(true);
      expect(item.publicLastVerifiedDate).toBe(laggingAirtableDate);
      expect(item.publicFreshness).toBeDefined();
    });

    it("marks cmsSyncPending: false when public Airtable catalogue matches Supabase verified date", async () => {
      resolveUserId.mockResolvedValue("owner-123");

      const inSyncDate = "2026-11-06T10:00:00.000Z";

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "prop-2",
                    slug: "synced-tower",
                    canonical_slug: "synced-tower",
                    title: "Synced Tower",
                    location: "Makati",
                    last_verified_date: inSyncDate,
                    pipeline_status: "published",
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      getCmsBundle.mockResolvedValue({
        properties: [
          {
            slug: "synced-tower",
            last_verified_date: inSyncDate,
          },
        ],
      });

      const res = await GET(new Request("http://localhost/api/dashboard/verify-freshness"));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      const item = json.items[0];
      expect(item.cmsSyncPending).toBe(false);
      expect(item.publicLastVerifiedDate).toBe(inSyncDate);
    });
  });

  describe("POST /api/dashboard/verify-freshness", () => {
    it("reports slug-less published listings in cmsSyncPending instead of silently skipping", async () => {
      resolveUserId.mockResolvedValue("owner-123");

      const propertyId = "11111111-1111-4111-8111-111111111111";

      mockFrom.mockImplementation((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: propertyId,
                      slug: null,
                      canonical_slug: null,
                      title: "Unslugged Published Tower",
                      pipeline_status: "published",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const res = await POST(
        new Request("http://localhost/api/dashboard/verify-freshness", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyIds: [propertyId] }),
        })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.verifiedCount).toBe(1);
      // Unslugged published property is surfaced in cmsSyncPending
      expect(json.cmsSyncPending).toContain("Unslugged Published Tower");
    });
  });

  describe("MonthlyFreshnessModal Selection Hardening (D-08)", () => {
    it("source contract: modal initializes selected with empty set and does not bulk pre-check stale rows", () => {
      const modalSrc = readFileSync(
        resolve(process.cwd(), "src/components/dashboard/MonthlyFreshnessModal.js"),
        "utf8"
      );

      // Verify that after items are filtered, selected is set to empty set rather than mapping stale ids
      expect(modalSrc).not.toContain("setSelected(new Set(stale.map((i) => i.id)))");
      expect(modalSrc).toContain("setSelected(new Set())");

      // Verify confirm button is disabled when selected.size === 0
      expect(modalSrc).toContain("disabled={busy || selected.size === 0}");
    });
  });
});
