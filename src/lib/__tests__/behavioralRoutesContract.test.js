import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REVIEW_ROUTE = "src/app/api/deals/[id]/review/route.js";
const PASSPORT_ROUTE = "src/app/api/user/resident-passport/route.js";
const DISPUTE_ROUTE = "src/app/api/reviews/[id]/dispute/route.js";

const readCode = (relPath) =>
  readFileSync(resolve(process.cwd(), relPath), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("A-182: Behavioral Scoring API Route Contracts & Invariants", () => {
  describe("Static Architectural Contracts", () => {
    it("all three API routes exist at expected Next.js App Router paths", () => {
      expect(existsSync(resolve(process.cwd(), REVIEW_ROUTE))).toBe(true);
      expect(existsSync(resolve(process.cwd(), PASSPORT_ROUTE))).toBe(true);
      expect(existsSync(resolve(process.cwd(), DISPUTE_ROUTE))).toBe(true);
    });

    it("deal review route enforces 18+ adult capacity and authentication", () => {
      const code = readCode(REVIEW_ROUTE);
      expect(code).toContain("resolveUserId");
      expect(code).toContain("assertAdultEligibility");
      expect(code).toContain("submitBehavioralReview");
      expect(code).toContain("sanitizeError");
      expect(code).toMatch(/status:\s*401/);
      expect(code).toMatch(/status:\s*403/);
    });

    it("resident passport route enforces selective disclosure scopes", () => {
      const code = readCode(PASSPORT_ROUTE);
      expect(code).toContain("resolveUserId");
      expect(code).toContain("getUserResidentPassport");
      expect(code).toContain("PASSPORT_SCOPES");
      expect(code).toMatch(/status:\s*401/);
    });

    it("dispute route enforces authentication and Trust & Safety flagging", () => {
      const code = readCode(DISPUTE_ROUTE);
      expect(code).toContain("resolveUserId");
      expect(code).toContain("flagReviewDispute");
      expect(code).toMatch(/status:\s*401/);
    });
  });

  describe("Runtime Endpoint Execution Mocks", () => {
    const mockState = {
      userId: "user-101",
      isAdult: true,
      submitResult: { success: true, state: "SINGLE_SUBMITTED", reviewId: "rev-new" },
      passportResult: { passport: { displayBadge: "[First-Time Verified Seeker]" }, metrics: {} },
      disputeResult: { success: true, message: "Quarantined" },
    };

    beforeEach(() => {
      mockState.userId = "user-101";
      mockState.isAdult = true;
      mockState.submitResult = { success: true, state: "SINGLE_SUBMITTED", reviewId: "rev-new" };
      mockState.passportResult = { passport: { displayBadge: "[First-Time Verified Seeker]" }, metrics: {} };
      mockState.disputeResult = { success: true, message: "Quarantined" };
    });

    it("POST /api/deals/[id]/review refuses unauthenticated requests", async () => {
      vi.resetModules();
      vi.doMock("@/lib/serverAuth", () => ({
        resolveUserId: async () => null,
        assertAdultEligibility: async () => true,
      }));
      vi.doMock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: {} }));

      const { POST } = await import("@/app/api/deals/[id]/review/route");
      const req = new Request("http://localhost/api/deals/deal-1/review", {
        method: "POST",
        body: JSON.stringify({ vectors: { payment_punctuality: 5 } }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "deal-1" }) });
      expect(res.status).toBe(401);
    });

    it("POST /api/deals/[id]/review blocks minors under 18 with 403 Forbidden", async () => {
      vi.resetModules();
      vi.doMock("@/lib/serverAuth", () => ({
        resolveUserId: async () => "minor-user",
        assertAdultEligibility: async () => false,
      }));
      vi.doMock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: {} }));

      const { POST } = await import("@/app/api/deals/[id]/review/route");
      const req = new Request("http://localhost/api/deals/deal-1/review", {
        method: "POST",
        body: JSON.stringify({ vectors: { payment_punctuality: 5 } }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "deal-1" }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("18 or older");
    });

    it("GET /api/user/resident-passport delivers passport credentials for authenticated seekers", async () => {
      vi.resetModules();
      vi.doMock("@/lib/serverAuth", () => ({
        resolveUserId: async () => "user-101",
      }));
      vi.doMock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: {} }));
      vi.doMock("@/lib/scoring/serverBehavioralScoring", () => ({
        getUserResidentPassport: async () => mockState.passportResult,
      }));

      const { GET } = await import("@/app/api/user/resident-passport/route");
      const req = new Request("http://localhost/api/user/resident-passport?scope=public_summary");

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.passport.displayBadge).toBe("[First-Time Verified Seeker]");
    });

    it("POST /api/reviews/[id]/dispute successfully flags review for arbitration", async () => {
      vi.resetModules();
      vi.doMock("@/lib/serverAuth", () => ({
        resolveUserId: async () => "user-101",
      }));
      vi.doMock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: {} }));
      vi.doMock("@/lib/scoring/serverBehavioralScoring", () => ({
        flagReviewDispute: async () => mockState.disputeResult,
      }));

      const { POST } = await import("@/app/api/reviews/[id]/dispute/route");
      const req = new Request("http://localhost/api/reviews/rev-1/dispute", {
        method: "POST",
        body: JSON.stringify({ reason: "Unfair claim regarding property condition." }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "rev-1" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe("Quarantined");
    });
  });
});
