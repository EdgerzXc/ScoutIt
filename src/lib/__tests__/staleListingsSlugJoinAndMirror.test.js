import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildFirstPublicationUpdate } from "@/lib/propertyLifecycle";

// Mock serverAuth
vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

// Mock notifications
vi.mock("@/lib/notifications", () => ({
  notifyUser: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

// Mock cronAuth
vi.mock("@/lib/cronAuth", () => ({
  authorizeCronRequest: vi.fn().mockReturnValue(null),
}));

// Mock cronEventLog
vi.mock("@/lib/cronEventLog", () => ({
  withCronEventLog: vi.fn((name, handler) => handler),
}));

// Mock airtableBudget
vi.mock("@/lib/airtableBudget", () => ({
  getAirtableBudgetStatus: vi.fn().mockResolvedValue({ tracked: false, exhausted: false }),
  recordAirtableCall: vi.fn().mockResolvedValue(),
}));

// Mock airtable
vi.mock("@/lib/airtable", () => ({
  fetchPropertyVerificationDates: vi.fn(),
  insertProperty: vi.fn(),
  updateProperty: vi.fn(),
}));

// Mock airtableFreshness
vi.mock("@/lib/airtableFreshness", () => ({
  stampAirtableFreshness: vi.fn().mockResolvedValue({ ok: true }),
}));

// Mock cmsCache
vi.mock("@/lib/cmsCache", () => ({
  invalidateCmsBundle: vi.fn().mockResolvedValue({ sharedCachePurged: true }),
}));

// Mock supabaseAdmin
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe("A-313: Stale Freshness Slug-Join, Supabase Mirror & Missing Verification Stale Treatment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AIRTABLE_API_KEY = "test-airtable-key";
    process.env.AIRTABLE_BASE_ID = "test-airtable-base";
    process.env.CRON_SECRET = "test-cron-secret";
  });

  describe("Publish Lifecycle Mirror", () => {
    it("buildFirstPublicationUpdate mirrors last_verified_date to Supabase on first publication", () => {
      const now = new Date().toISOString();
      const update = buildFirstPublicationUpdate({
        current: { canonical_slug: "grand-tower" },
        computedSlug: "grand-tower",
        now,
      });

      expect(update.last_verified_date).toBe(now);
      expect(update.canonical_slug).toBe("grand-tower");
      expect(update.pipeline_status).toBe("approved");
    });

    it("buildFirstPublicationUpdate preserves existing last_verified_date if present", () => {
      const existingDate = "2026-10-01T12:00:00.000Z";
      const update = buildFirstPublicationUpdate({
        current: { canonical_slug: "grand-tower", last_verified_date: existingDate },
        computedSlug: "grand-tower",
      });

      expect(update.last_verified_date).toBe(existingDate);
    });
  });

  describe("Cron: check-stale-listings Slug History Join & Supabase Mirror", () => {
    it("joins on slug history and notifies when a drifted listing is stale (> 30 days)", async () => {
      const { fetchPropertyVerificationDates } = await import("@/lib/airtable");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const { notifyUser } = await import("@/lib/notifications");

      const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

      // Supabase approved properties: listing with canonical_slug "one-ecom-center"
      const mockProperties = [
        {
          id: "prop-drifted-1",
          slug: "one-ecom-center",
          canonical_slug: "one-ecom-center",
          owner_id: "owner-101",
          title: "One E-Com Center",
          last_verified_date: null,
        },
      ];

      // Slug history: maps old Airtable formula slug "one-e-com-center-drifted" to canonical
      const mockHistory = [
        {
          property_id: "prop-drifted-1",
          old_slug: "one-e-com-center-drifted",
          canonical_slug: "one-ecom-center",
        },
      ];

      // Airtable has the verification record under the drifted formula slug
      fetchPropertyVerificationDates.mockResolvedValueOnce([
        {
          slug: "one-e-com-center-drifted",
          title: "One E-Com Center",
          lastVerifiedDate: fortyFiveDaysAgo,
        },
      ]);

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockProperties, error: null }),
            }),
          };
        }
        if (table === "property_slug_history") {
          return {
            select: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
          };
        }
        if (table === "user_notifications") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { GET } = await import("@/app/api/cron/check-stale-listings/route");
      const req = new Request("http://localhost/api/cron/check-stale-listings", {
        headers: { Authorization: "Bearer test-cron-secret" },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.checked).toBe(1);
      expect(json.stale).toBe(1);
      expect(json.notified).toBe(1);
      expect(notifyUser).toHaveBeenCalledWith(
        supabaseAdmin,
        expect.objectContaining({
          userId: "owner-101",
          propertyId: "prop-drifted-1",
          notificationType: "stale_listing",
        })
      );
    });

    it("joins on slug history and does NOT notify when drifted listing is fresh (< 30 days)", async () => {
      const { fetchPropertyVerificationDates } = await import("@/lib/airtable");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const { notifyUser } = await import("@/lib/notifications");

      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

      const mockProperties = [
        {
          id: "prop-drifted-2",
          slug: "two-ecom-center",
          canonical_slug: "two-ecom-center",
          owner_id: "owner-102",
          title: "Two E-Com Center",
          last_verified_date: null,
        },
      ];

      const mockHistory = [
        {
          property_id: "prop-drifted-2",
          old_slug: "two-e-com-center-drifted",
          canonical_slug: "two-ecom-center",
        },
      ];

      fetchPropertyVerificationDates.mockResolvedValueOnce([
        {
          slug: "two-e-com-center-drifted",
          title: "Two E-Com Center",
          lastVerifiedDate: tenDaysAgo,
        },
      ]);

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockProperties, error: null }),
            }),
          };
        }
        if (table === "property_slug_history") {
          return {
            select: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
          };
        }
        return {};
      });

      const { GET } = await import("@/app/api/cron/check-stale-listings/route");
      const req = new Request("http://localhost/api/cron/check-stale-listings", {
        headers: { Authorization: "Bearer test-cron-secret" },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.checked).toBe(1);
      expect(json.stale).toBe(0);
      expect(json.notified).toBe(0);
      expect(notifyUser).not.toHaveBeenCalled();
    });

    it("treats missing verification row in Airtable as stale and notifies owner", async () => {
      const { fetchPropertyVerificationDates } = await import("@/lib/airtable");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const { notifyUser } = await import("@/lib/notifications");

      const mockProperties = [
        {
          id: "prop-missing-from-airtable",
          slug: "unmatched-property",
          canonical_slug: "unmatched-property",
          owner_id: "owner-103",
          title: "Unmatched Property",
          last_verified_date: null,
        },
      ];

      // Airtable has empty verification list (or doesn't have this slug)
      fetchPropertyVerificationDates.mockResolvedValueOnce([]);

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockProperties, error: null }),
            }),
          };
        }
        if (table === "property_slug_history") {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === "user_notifications") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { GET } = await import("@/app/api/cron/check-stale-listings/route");
      const req = new Request("http://localhost/api/cron/check-stale-listings", {
        headers: { Authorization: "Bearer test-cron-secret" },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.checked).toBe(1);
      expect(json.stale).toBe(1);
      expect(json.notified).toBe(1);
      expect(notifyUser).toHaveBeenCalledWith(
        supabaseAdmin,
        expect.objectContaining({
          userId: "owner-103",
          propertyId: "prop-missing-from-airtable",
        })
      );
    });

    it("reads Supabase last_verified_date as fresh even if Airtable record is missing", async () => {
      const { fetchPropertyVerificationDates } = await import("@/lib/airtable");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const { notifyUser } = await import("@/lib/notifications");

      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

      const mockProperties = [
        {
          id: "prop-supabase-verified",
          slug: "fresh-property",
          canonical_slug: "fresh-property",
          owner_id: "owner-104",
          title: "Fresh Property",
          last_verified_date: fiveDaysAgo,
        },
      ];

      // Missing from Airtable
      fetchPropertyVerificationDates.mockResolvedValueOnce([]);

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockProperties, error: null }),
            }),
          };
        }
        if (table === "property_slug_history") {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      const { GET } = await import("@/app/api/cron/check-stale-listings/route");
      const req = new Request("http://localhost/api/cron/check-stale-listings", {
        headers: { Authorization: "Bearer test-cron-secret" },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.checked).toBe(1);
      expect(json.stale).toBe(0);
      expect(json.notified).toBe(0);
      expect(notifyUser).not.toHaveBeenCalled();
    });
  });

  describe("API: /api/dashboard/verify-freshness (POST)", () => {
    it("updates Supabase last_verified_date and attempts Airtable freshness stamp", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const { stampAirtableFreshness } = await import("@/lib/airtableFreshness");

      resolveUserId.mockResolvedValueOnce("usr-owner-1");

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
                      slug: "one-ecom",
                      canonical_slug: "one-ecom",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      const { POST } = await import("@/app/api/dashboard/verify-freshness/route");
      const req = new Request("http://localhost/api/dashboard/verify-freshness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyIds: ["f81d4fae-7dec-11d0-a765-00a0c91e6bf6"] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.verifiedCount).toBe(1);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          last_verified_date: expect.any(String),
        })
      );
      expect(stampAirtableFreshness).toHaveBeenCalledWith({
        slug: "one-ecom",
        isoDate: expect.any(String),
      });
    });
  });
});
