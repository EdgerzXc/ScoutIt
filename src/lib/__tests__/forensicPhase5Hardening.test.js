import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Mock adminGuard
vi.mock("@/lib/adminGuard", () => ({
  requireAdmin: vi.fn(),
}));

// Mock supabaseAdmin
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe("A-210 Phase 5: Notification Coverage & Data Integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GAP-18: Truthful Reporting in OSINT Ingestion", () => {
    it("returns 500 with error message if Supabase insert fails during publish_briefing", async () => {
      const { requireAdmin } = await import("@/lib/adminGuard");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const { POST } = await import("@/app/api/admin/osint/route");

      requireAdmin.mockResolvedValueOnce({ staff: true, userId: "admin-1" });

      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed during insert" },
      });
      const mockSelect = vi.fn().mockReturnValueOnce({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValueOnce({ select: mockSelect });

      supabaseAdmin.from.mockReturnValueOnce({ insert: mockInsert });

      const req = new Request("http://localhost/api/admin/osint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish_briefing",
          briefingData: {
            title: "Test Briefing",
            slug: "test-briefing",
          },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Database connection failed during insert");
    });
  });

  describe("GAP-26: Mojibake Character Sanitization", () => {
    it("uses UTF-8 speech bubble emoji in inquiries route", () => {
      const inquiriesSrc = readFileSync(
        resolve(process.cwd(), "src/app/api/inquiries/route.js"),
        "utf8"
      );
      expect(inquiriesSrc).not.toContain("ðŸ’¬");
      expect(inquiriesSrc).toContain('icon: "💬"');
    });
  });

  describe("GAP-21 & GAP-23: Notification Coverage Wiring", () => {
    it("property claim route notifies claimant and owner", () => {
      const claimSrc = readFileSync(
        resolve(process.cwd(), "src/app/api/property/claim/route.js"),
        "utf8"
      );
      expect(claimSrc).toContain("notifyUser(supabaseAdmin");
      expect(claimSrc).toContain("claim_submitted");
      expect(claimSrc).toContain("claim_filed");
    });

    it("MMC claims actions notifies claimant and prior owner", () => {
      const mmcClaimSrc = readFileSync(
        resolve(process.cwd(), "mission-control/src/app/dashboard/claims/actions.js"),
        "utf8"
      );
      expect(mmcClaimSrc).toContain("notifyUser");
      expect(mmcClaimSrc).toContain("claim_approved");
      expect(mmcClaimSrc).toContain("claim_transferred");
      expect(mmcClaimSrc).toContain("claim_rejected");
      expect(mmcClaimSrc).toContain("claim_needs_info");
    });

    it("viewing booking service notifies viewing host", () => {
      const bookingSrc = readFileSync(
        resolve(process.cwd(), "src/lib/viewings/bookingService.js"),
        "utf8"
      );
      expect(bookingSrc).toContain("notifyUser");
      expect(bookingSrc).toContain("viewing_scheduled");
    });

    it("viewing appointments route notifies counterparties on reschedule and status changes", () => {
      const apptSrc = readFileSync(
        resolve(process.cwd(), "src/app/api/viewing-appointments/[id]/route.js"),
        "utf8"
      );
      expect(apptSrc).toContain("notifyUser");
      expect(apptSrc).toContain("viewing_rescheduled");
      expect(apptSrc).toContain("viewing_${status}");
    });

    it("deal messages route notifies counterparties", () => {
      const msgSrc = readFileSync(
        resolve(process.cwd(), "src/app/api/deals/[id]/messages/route.js"),
        "utf8"
      );
      expect(msgSrc).toContain("notifyUser");
      expect(msgSrc).toContain("deal_message");
    });

    it("deals status route notifies buyer on answer and counterparty on withdrawal", () => {
      const dealSrc = readFileSync(
        resolve(process.cwd(), "src/app/api/deals/[id]/route.js"),
        "utf8"
      );
      expect(dealSrc).toContain("notifyUser");
      expect(dealSrc).toContain("deal_accepted");
      expect(dealSrc).toContain("deal_declined");
      expect(dealSrc).toContain("deal_connected");
      expect(dealSrc).toContain("deal_withdrawn");
    });

    it("broker invite route notifies invited broker", () => {
      const inviteSrc = readFileSync(
        resolve(process.cwd(), "src/app/api/dashboard/invite/route.js"),
        "utf8"
      );
      expect(inviteSrc).toContain("notifyUser");
      expect(inviteSrc).toContain("broker_invite");
    });

    it("unit delegation route notifies operator on accept and decline", () => {
      const delegateSrc = readFileSync(
        resolve(process.cwd(), "src/app/api/dashboard/units/delegate/route.js"),
        "utf8"
      );
      expect(delegateSrc).toContain("notifyUser");
      expect(delegateSrc).toContain("delegation_declined");
      expect(delegateSrc).toContain("delegation_accepted");
    });

    it("recommendation routes notify broker on submission and moderation", () => {
      const recSrc = readFileSync(
        resolve(process.cwd(), "src/app/api/broker/recommendations/route.js"),
        "utf8"
      );
      expect(recSrc).toContain("notifyUser");
      expect(recSrc).toContain("recommendation_submitted");

      const mmcRecSrc = readFileSync(
        resolve(process.cwd(), "mission-control/src/app/dashboard/recommendations/actions.js"),
        "utf8"
      );
      expect(mmcRecSrc).toContain("notifyUser");
      expect(mmcRecSrc).toContain("recommendation_approved");
    });

    it("connects refund route notifies refunded user", () => {
      const refundSrc = readFileSync(
        resolve(process.cwd(), "src/app/api/admin/connects-refund/route.js"),
        "utf8"
      );
      expect(refundSrc).toContain("notifyUser");
      expect(refundSrc).toContain("connects_refund");
    });

    it("MMC FAQ appeals action notifies appellant", () => {
      const faqSrc = readFileSync(
        resolve(process.cwd(), "mission-control/src/app/dashboard/faq-appeals/actions.js"),
        "utf8"
      );
      expect(faqSrc).toContain("notifyUser");
      expect(faqSrc).toContain("faq_appeal_approved");
    });
  });
});
