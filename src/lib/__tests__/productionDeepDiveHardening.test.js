import { describe, it, expect, vi, beforeEach } from "vitest";
import { encodeCursor, decodeCursor } from "@/app/api/crm/activity/route";
import { findRecentPendingDeal } from "@/lib/connectGates";
import { refreshUserMetrics } from "@/lib/scoring/serverBehavioralScoring";
import { recomputeTargetUserMetrics } from "../../../mission-control/src/lib/reviewMetricsRecompute";

const updateProperty = vi.fn(async () => ({}));
const insertProperty = vi.fn(async () => ({}));

vi.mock("@/lib/airtable", () => ({
  updateProperty: (...args) => updateProperty(...args),
  insertProperty: (...args) => insertProperty(...args),
}));

vi.mock("@/lib/cmsCache", () => ({
  invalidateCmsBundle: vi.fn(async () => ({ sharedCachePurged: true })),
}));

process.env.AIRTABLE_API_KEY = "keyTest";
process.env.AIRTABLE_BASE_ID = "appTest";

const { syncPropertyUnitsToAirtable } = await import("@/lib/unitsSync");

describe("A-273 — Production Deep-Dive Hardening Suite", () => {
  beforeEach(() => {
    updateProperty.mockClear();
    insertProperty.mockClear();
  });

  describe("1. CRM Activity Cursor Filter Injection Prevention", () => {
    it("decodes a valid ISO-8601 + UUID cursor", () => {
      const validRow = {
        created_at: "2026-10-31T12:00:00.000Z",
        id: "550e8400-e29b-41d4-a716-446655440000",
      };
      const encoded = encodeCursor(validRow);
      expect(decodeCursor(encoded)).toEqual({
        createdAt: validRow.created_at,
        id: validRow.id,
      });
    });

    it("rejects cursor payloads attempting PostgREST .or() filter injection in id", () => {
      const injectedId = Buffer.from(
        "2026-10-31T12:00:00.000Z|550e8400-e29b-41d4-a716-446655440000),id.not.is.null",
        "utf8"
      ).toString("base64url");
      expect(decodeCursor(injectedId)).toBeNull();
    });

    it("rejects cursor payloads attempting PostgREST .or() filter injection in createdAt", () => {
      const injectedTs = Buffer.from(
        "2026-10-31T12:00:00.000Z,id.not.is.null|550e8400-e29b-41d4-a716-446655440000",
        "utf8"
      ).toString("base64url");
      expect(decodeCursor(injectedTs)).toBeNull();
    });

    it("rejects cursors with extra pipe delimiters or non-UUID ids", () => {
      const extraPipe = Buffer.from(
        "2026-10-31T12:00:00.000Z|550e8400-e29b-41d4-a716-446655440000|extra",
        "utf8"
      ).toString("base64url");
      expect(decodeCursor(extraPipe)).toBeNull();
    });
  });

  describe("2. Units Sync Canonical Slug & Off-Market Lifecycle Gate", () => {
    function mockServiceClient() {
      return {
        from: (table) => {
          if (table === "property_units") {
            return {
              select: () => ({
                eq: () => ({
                  order: async () => ({ data: [], error: null }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              in: async () => ({ data: [], error: null }),
            }),
          };
        },
      };
    }

    it("refuses to sync off_market or permanently_removed properties to public Airtable even if legacy pipeline_status is approved", async () => {
      const offMarketRes = await syncPropertyUnitsToAirtable(mockServiceClient(), {
        id: "p-off",
        pipeline_status: "approved",
        lifecycle_state: "off_market",
        slug: "secret-tower",
        canonical_slug: "secret-tower",
        details: {},
      });
      expect(offMarketRes).toBeNull();
      expect(updateProperty).not.toHaveBeenCalled();
      expect(insertProperty).not.toHaveBeenCalled();

      const removedRes = await syncPropertyUnitsToAirtable(mockServiceClient(), {
        id: "p-del",
        pipeline_status: "approved",
        lifecycle_state: "permanently_removed",
        slug: "deleted-tower",
        canonical_slug: "deleted-tower",
        details: {},
      });
      expect(removedRes).toBeNull();
      expect(updateProperty).not.toHaveBeenCalled();
    });

    it("prefers canonical_slug over mutable slug when updating Airtable Units_JSON", async () => {
      await syncPropertyUnitsToAirtable(mockServiceClient(), {
        id: "p-canon",
        pipeline_status: "approved",
        lifecycle_state: "live_market",
        slug: "drifted-slug",
        canonical_slug: "locked-canonical-slug",
        details: {},
      });
      expect(updateProperty).toHaveBeenCalledTimes(1);
      expect(updateProperty.mock.calls[0][2]).toBe("locked-canonical-slug");
    });
  });

  describe("3. SAFE_ID Guards on PostgREST .or() User ID Interpolations", () => {
    it("blocks unsafe senderId characters in findRecentPendingDeal before querying Supabase", async () => {
      const fromSpy = vi.fn();
      const res = await findRecentPendingDeal(
        { from: fromSpy },
        "user-1,status.neq.pending",
        "prop-1"
      );
      expect(res).toBeNull();
      expect(fromSpy).not.toHaveBeenCalled();
    });

    it("blocks unsafe userId characters in refreshUserMetrics and recomputeTargetUserMetrics", async () => {
      const fromSpy = vi.fn();
      const res1 = await refreshUserMetrics({ from: fromSpy }, "user-1,id.not.is.null");
      expect(res1).toBeNull();

      const res2 = await recomputeTargetUserMetrics({ from: fromSpy }, "user-1,id.not.is.null");
      expect(res2.success).toBe(false);
      expect(fromSpy).not.toHaveBeenCalled();
    });
  });

  describe("4. Mission Control Behavioral Standing Recompute Parity", () => {
    it("counts qualifying owner deals and ensures transaction_count >= eligible_review_count", async () => {
      const upsertedRows = [];
      const mockAdmin = {
        from: (table) => {
          if (table === "user_behavioral_reviews") {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    eq: async () => ({
                      data: [
                        {
                          id: "rev-1",
                          vectors: {
                            payment_punctuality: 5,
                            space_care_maintenance: 5,
                            communication_conduct: 5,
                            lease_covenant_adherence: 5,
                          },
                          is_double_blind_locked: false,
                          is_disputed: false,
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "deals") {
            return {
              select: (_cols, opts) => {
                if (opts?.head) {
                  return {
                    or: () => ({
                      eq: async () => ({ count: 0, error: null }),
                    }),
                  };
                }
                return {
                  in: async () => ({
                    data: [
                      {
                        id: "deal-1",
                        buyer_id: "other-buyer",
                        broker_id: null,
                        status: "closed",
                        properties: { owner_id: "owner-target-1" },
                      },
                      {
                        id: "deal-2",
                        buyer_id: "owner-target-1",
                        broker_id: null,
                        status: "accepted",
                        properties: { owner_id: "another-owner" },
                      },
                    ],
                    error: null,
                  }),
                };
              },
            };
          }
          if (table === "user_behavioral_metrics") {
            return {
              upsert: async (row) => {
                upsertedRows.push(row);
                return { error: null };
              },
            };
          }
          return {};
        },
      };

      const result = await recomputeTargetUserMetrics(mockAdmin, "owner-target-1");
      expect(result.success).toBe(true);
      expect(upsertedRows).toHaveLength(1);
      expect(upsertedRows[0].transaction_count).toBe(2);
      expect(upsertedRows[0].tier).toBe("TIER_SOVEREIGN");
    });
  });

  describe("5. VIA Attribution & Telemetry Route Slug Validation & Rate Limiting", () => {
    it("rejects malformed/injection property slugs with 400 on /api/property/[id]/via and /api/property/[id]/via/telemetry", async () => {
      const viaRoute = await import("@/app/api/property/[id]/via/route");
      const viaTelemetryRoute = await import("@/app/api/property/[id]/via/telemetry/route");

      const badSlugParams = Promise.resolve({ id: "tower-1,id.not.is.null" });
      const getReq = new Request("http://localhost:3000/api/property/bad/via");
      const getRes = await viaRoute.GET(getReq, { params: badSlugParams });
      expect(getRes.status).toBe(400);

      const postReq = new Request("http://localhost:3000/api/property/bad/via", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const postRes = await viaRoute.POST(postReq, { params: badSlugParams });
      expect(postRes.status).toBe(400);

      const telReq = new Request("http://localhost:3000/api/property/bad/via/telemetry", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const telRes = await viaTelemetryRoute.POST(telReq, { params: badSlugParams });
      expect(telRes.status).toBe(400);
    });

    it("enforces per-IP rate limiting (60 req/min) on /api/property/[id]/via/telemetry", async () => {
      const viaTelemetryRoute = await import("@/app/api/property/[id]/via/telemetry/route");
      const validParams = Promise.resolve({ id: "the-estate-makati" });
      const testIp = "198.51.100.77";

      let lastStatus = 200;
      for (let i = 0; i < 61; i++) {
        const req = new Request("http://localhost:3000/api/property/the-estate-makati/via/telemetry", {
          method: "POST",
          headers: { "x-forwarded-for": testIp },
          body: JSON.stringify({ visitorId: "v-1", dwellTimeSeconds: 5 }),
        });
        const res = await viaTelemetryRoute.POST(req, { params: validParams });
        lastStatus = res.status;
      }
      expect(lastStatus).toBe(429);
    });
  });
});
