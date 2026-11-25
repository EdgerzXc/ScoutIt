import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { timingSafeCompare, authorizeCronRequest } from "@/lib/cronAuth";
import { isSafeSvgMarkup } from "@/lib/sanitize";
import { generateQrSvg } from "@/lib/qrCodeGenerator";
import { isSensitivePath, rateLimitTier } from "@/lib/sensitiveRoutes";
import { MAX_INTENT_TEXT_CHARS, checkIntentRate } from "@/app/api/properties/updates/intent/route";
import { checkCounterOfferRate } from "@/app/api/ai/counter-offer/route";
import { checkQuestRaiseRate } from "@/app/api/v1/questit/raise/route";
import { checkDealStatusRate } from "@/app/api/dashboard/deals/update/route";
import { checkDealPatchRate } from "@/app/api/deals/[id]/route";
import { checkDeleteRate } from "@/app/api/dashboard/delete/route";
import { checkArchiveRate } from "@/app/api/dashboard/archive/route";
import { checkPhotoUploadRate } from "@/app/api/storage/upload-photo/route";
import { checkVideoUploadRate } from "@/app/api/storage/upload/route";
import { checkActivateRoleRate } from "@/app/api/user/activate-role/route";
import { checkDeleteAccountRate } from "@/app/api/user/delete-account/route";
import { checkClaimRate } from "@/app/api/property/claim/route";
import { checkClaimUploadRate } from "@/app/api/property/claim/upload/route";
import { checkSpatialRequestRate } from "@/app/api/spatial/request/route";
import { checkSpatialRevisionRate } from "@/app/api/spatial/revision/route";
import { checkReviewDisputeRate } from "@/app/api/reviews/[id]/dispute/route";
import { checkDealDisputeRate } from "@/app/api/deals/[id]/dispute/route";
import { checkDealAttachmentRate } from "@/app/api/deals/[id]/attachments/route";
import { checkPublishRate } from "@/app/api/dashboard/publish/route";
import { checkInviteRate } from "@/app/api/dashboard/invite/route";
import { sanitizeStationName, isValidCoordinate } from "../../../scripts/sync_transit_data";

describe("A-349: Full-Stack Security Tightening & Infrastructure Hardening", () => {
  describe("1. Timing-Safe Secret Comparisons (cronAuth)", () => {
    it("returns true for identical strings", () => {
      expect(timingSafeCompare("my-super-secret-token-12345", "my-super-secret-token-12345")).toBe(true);
    });

    it("returns false for different strings of equal length", () => {
      expect(timingSafeCompare("my-super-secret-token-12345", "my-super-secret-token-12349")).toBe(false);
    });

    it("returns false for strings of differing lengths without throwing", () => {
      expect(timingSafeCompare("short", "much-longer-string-value")).toBe(false);
      expect(timingSafeCompare("much-longer-string-value", "short")).toBe(false);
    });

    it("returns false for non-string inputs safely", () => {
      expect(timingSafeCompare(null, "secret")).toBe(false);
      expect(timingSafeCompare("secret", undefined)).toBe(false);
      expect(timingSafeCompare(12345, "12345")).toBe(false);
      expect(timingSafeCompare({}, {})).toBe(false);
    });

    it("authorizeCronRequest fails closed when CRON_SECRET is unconfigured", () => {
      const origSecret = process.env.CRON_SECRET;
      delete process.env.CRON_SECRET;
      try {
        const req = new Request("http://localhost/api/cron/test");
        const res = authorizeCronRequest(req);
        expect(res).not.toBeNull();
        expect(res.status).toBe(503);
      } finally {
        if (origSecret !== undefined) process.env.CRON_SECRET = origSecret;
      }
    });

    it("authorizeCronRequest rejects invalid authorization header using timingSafeCompare", () => {
      const origSecret = process.env.CRON_SECRET;
      process.env.CRON_SECRET = "production-cron-secret-alpha";
      try {
        const req = new Request("http://localhost/api/cron/test", {
          headers: { authorization: "Bearer invalid-secret-guess" },
        });
        const res = authorizeCronRequest(req);
        expect(res).not.toBeNull();
        expect(res.status).toBe(401);
      } finally {
        if (origSecret !== undefined) process.env.CRON_SECRET = origSecret;
        else delete process.env.CRON_SECRET;
      }
    });

    it("authorizeCronRequest approves valid authorization header", () => {
      const origSecret = process.env.CRON_SECRET;
      process.env.CRON_SECRET = "production-cron-secret-alpha";
      try {
        const req = new Request("http://localhost/api/cron/test", {
          headers: { authorization: "Bearer production-cron-secret-alpha" },
        });
        const res = authorizeCronRequest(req);
        expect(res).toBeNull();
      } finally {
        if (origSecret !== undefined) process.env.CRON_SECRET = origSecret;
        else delete process.env.CRON_SECRET;
      }
    });
  });

  describe("2. SVG Sanitization (isSafeSvgMarkup)", () => {
    it("approves clean SVG markup", () => {
      const validSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>`;
      expect(isSafeSvgMarkup(validSvg)).toBe(true);
    });

    it("rejects non-svg strings", () => {
      expect(isSafeSvgMarkup("<div>Hello World</div>")).toBe(false);
      expect(isSafeSvgMarkup("alert(1)")).toBe(false);
      expect(isSafeSvgMarkup(null)).toBe(false);
      expect(isSafeSvgMarkup(undefined)).toBe(false);
    });

    it("rejects SVGs containing script tags", () => {
      const xssSvg = `<svg><script>alert(document.cookie)</script><rect width="10" height="10"/></svg>`;
      expect(isSafeSvgMarkup(xssSvg)).toBe(false);
    });

    it("rejects SVGs containing onload or other DOM event handlers", () => {
      const xssSvg = `<svg onload="alert('pwned')"><circle cx="50" cy="50" r="40"/></svg>`;
      expect(isSafeSvgMarkup(xssSvg)).toBe(false);
      const onErrorSvg = `<svg><image href="x" onerror="alert(1)"/></svg>`;
      expect(isSafeSvgMarkup(onErrorSvg)).toBe(false);
    });

    it("rejects SVGs containing javascript: pseudo-protocols", () => {
      const jsProtoSvg = `<svg><a href="javascript:alert(1)"><text>Click</text></a></svg>`;
      expect(isSafeSvgMarkup(jsProtoSvg)).toBe(false);
    });

    it("rejects SVGs containing foreignObject tags", () => {
      const foreignObjectSvg = `<svg><foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject></svg>`;
      expect(isSafeSvgMarkup(foreignObjectSvg)).toBe(false);
    });
  });

  describe("3. Sensitive Routes & Rate Limiting Classifiers", () => {
    it("marks critical financial, auth, AI, and mutation paths as sensitive", () => {
      expect(isSensitivePath("/api/auth/callback")).toBe(true);
      expect(isSensitivePath("/api/ai/rewrite")).toBe(true);
      expect(isSensitivePath("/api/storage/upload")).toBe(true);
      expect(isSensitivePath("/api/intel/ingest")).toBe(true);
      expect(isSensitivePath("/api/properties/updates/intent")).toBe(true);
      expect(isSensitivePath("/api/questit/raise")).toBe(true);
      expect(isSensitivePath("/api/v1/questit/raise")).toBe(true);
      expect(isSensitivePath("/api/property/claim")).toBe(true);
      expect(isSensitivePath("/api/badges/claim")).toBe(true);
      expect(isSensitivePath("/api/badges/transfer")).toBe(true);
      expect(isSensitivePath("/api/user/delete-account")).toBe(true);
      expect(isSensitivePath("/api/contact")).toBe(true);
    });

    it("does not classify public read-only paths as sensitive", () => {
      expect(isSensitivePath("/api/cms")).toBe(false);
      expect(isSensitivePath("/api/browse")).toBe(false);
      expect(isSensitivePath("/property/one-ecom-center")).toBe(false);
    });

    it("assigns strict rateLimitTier to authentication and irreversible mutations", () => {
      expect(rateLimitTier("/api/auth/reset-password")).toBe("strict");
      expect(rateLimitTier("/api/user/delete-account")).toBe("strict");
      expect(rateLimitTier("/api/badges/transfer")).toBe("strict");
      expect(rateLimitTier("/api/badges/claim")).toBe("strict");
    });

    it("assigns ai rateLimitTier to model-inference endpoints", () => {
      expect(rateLimitTier("/api/ai/rewrite")).toBe("ai");
      expect(rateLimitTier("/api/ai/counter-offer")).toBe("ai");
      expect(rateLimitTier("/api/intel/ingest")).toBe("ai");
      expect(rateLimitTier("/api/properties/updates/intent")).toBe("ai");
      expect(rateLimitTier("/api/questit/bounty")).toBe("ai");
      expect(rateLimitTier("/api/v1/questit/raise")).toBe("ai");
    });

    it("assigns standard rateLimitTier to normal APIs", () => {
      expect(rateLimitTier("/api/cms")).toBe("standard");
      expect(rateLimitTier("/api/wishlist")).toBe("standard");
    });
  });

  describe("4. AI Prompt Injection & Anti-Abuse Protections", () => {
    it("enforces MAX_INTENT_TEXT_CHARS bound on property intent updates", () => {
      expect(MAX_INTENT_TEXT_CHARS).toBe(10_000);
      expect(typeof checkIntentRate).toBe("function");
    });

    it("enforces checkCounterOfferRate limiter on counter-offer assistant", () => {
      expect(typeof checkCounterOfferRate).toBe("function");
    });

    it("Mission Control Brain defines MAX_QUESTION_CHARS and prompt injection defense", () => {
      const brainSource = fs.readFileSync(path.resolve("mission-control/src/lib/brain.js"), "utf8");
      expect(brainSource).toContain("MAX_QUESTION_CHARS = 1000");
      expect(brainSource).toContain("<user_question>");
      expect(brainSource).toContain("<untrusted_vault_sources>");
      expect(brainSource).toContain("CRITICAL SECURITY INSTRUCTION");
      expect(brainSource).toContain("replaceAll(\"</user_question>\", \"\")");
    });

    it("AI routes neutralize XML boundary escape injections", () => {
      const rewriteSource = fs.readFileSync(path.resolve("src/app/api/ai/rewrite/route.js"), "utf8");
      expect(rewriteSource).toContain("replaceAll('</untrusted_description_to_rewrite>', '')");

      const assimilateSource = fs.readFileSync(path.resolve("src/app/api/ai/assimilate/route.js"), "utf8");
      expect(assimilateSource).toContain("replaceAll('</untrusted_property_data>', '')");

      const blueprintSource = fs.readFileSync(path.resolve("src/app/api/ai/blueprint/route.js"), "utf8");
      expect(blueprintSource).toContain("replaceAll('</untrusted_csv_headers>', '')");
    });
  });

  describe("5. CI/CD Spatial Transit Untrusted Feed Ingestion Hardening", () => {
    it("sanitizeStationName strips script tags and restricts length", () => {
      expect(sanitizeStationName("Ayala Station <script>alert(1)</script>")).toBe("Ayala Station alert(1)");
      expect(sanitizeStationName("")).toBe("Station");
      expect(sanitizeStationName(null)).toBe("Station");
      const longName = "A".repeat(200);
      expect(sanitizeStationName(longName).length).toBe(100);
    });

    it("isValidCoordinate enforces finite Philippines/Manila coordinates", () => {
      expect(isValidCoordinate(14.5492, 121.0494)).toBe(true); // BGC
      expect(isValidCoordinate(14.5833, 120.9789)).toBe(true); // Manila
      expect(isValidCoordinate(37.7749, -122.4194)).toBe(false); // San Francisco
      expect(isValidCoordinate(NaN, 121.0)).toBe(false);
      expect(isValidCoordinate(14.5, Infinity)).toBe(false);
      expect(isValidCoordinate("14.5", "121.0")).toBe(false);
    });
  });

  describe("6. Route-Level Rate Limiter Protection on Mutation Endpoints", () => {
    it("exports rate limiters for previously unmetered mutation endpoints", () => {
      expect(typeof checkQuestRaiseRate).toBe("function");
      expect(typeof checkDealStatusRate).toBe("function");
      expect(typeof checkDealPatchRate).toBe("function");
      expect(typeof checkDeleteRate).toBe("function");
      expect(typeof checkArchiveRate).toBe("function");
      expect(typeof checkPhotoUploadRate).toBe("function");
      expect(typeof checkVideoUploadRate).toBe("function");
      expect(typeof checkActivateRoleRate).toBe("function");
      expect(typeof checkDeleteAccountRate).toBe("function");
      expect(typeof checkClaimRate).toBe("function");
      expect(typeof checkClaimUploadRate).toBe("function");
      expect(typeof checkSpatialRequestRate).toBe("function");
      expect(typeof checkSpatialRevisionRate).toBe("function");
      expect(typeof checkReviewDisputeRate).toBe("function");
      expect(typeof checkDealDisputeRate).toBe("function");
      expect(typeof checkDealAttachmentRate).toBe("function");
      expect(typeof checkPublishRate).toBe("function");
      expect(typeof checkInviteRate).toBe("function");
    });

    it("supports reset() to clear tracked rate limit buckets", () => {
      expect(typeof checkDeleteAccountRate.reset).toBe("function");
      checkDeleteAccountRate.reset();
      const res = checkDeleteAccountRate("test-user-rate-reset");
      expect(res.allowed).toBe(true);
      checkDeleteAccountRate.reset();
    });
  });

  describe("7. Idempotency & Optimistic Concurrency Lock in Badge Transfer Fallback", () => {
    it("verifies user_badges update includes sender user_id check", () => {
      const transferSource = fs.readFileSync(path.resolve("src/app/api/badges/transfer/route.js"), "utf8");
      expect(transferSource).toContain('.eq("id", senderBadge.id)');
      expect(transferSource).toContain('.eq("user_id", senderId)');
    });
  });

  describe("8. Open Redirect Prevention in OAuth Callback", () => {
    it("validates and sanitizes next parameter in Mission Control auth callback", () => {
      const callbackSource = fs.readFileSync(path.resolve("mission-control/src/app/auth/callback/route.js"), "utf8");
      expect(callbackSource).toContain("getSafeRedirectPath");
      expect(callbackSource).toContain('!trimmed.startsWith("//")');
      expect(callbackSource).toContain('!trimmed.includes(":")');
    });
  });

  describe("9. CI/CD Pipeline Surface Lock Integrity Gate", () => {
    it("enforces verify-approved-surfaces in spatial transit auto-update workflow", () => {
      const workflowSource = fs.readFileSync(path.resolve(".github/workflows/update-spatial-data.yml"), "utf8");
      expect(workflowSource).toContain("node scripts/verify-approved-surfaces.mjs");
    });
  });

  describe("10. Luxury Story Studio SVG Sanitization Gate", () => {
    it("guards dangerouslySetInnerHTML with isSafeSvgMarkup in LuxuryStoryStudio", () => {
      const studioSource = fs.readFileSync(path.resolve("src/components/property/LuxuryStoryStudio.js"), "utf8");
      expect(studioSource).toContain("isSafeSvgMarkup(qrSvg)");
    });

    it("accepts generated QR code SVGs from generateQrSvg", () => {
      const qrSvg = generateQrSvg("https://www.scoutit.space/property/tower-one", {
        color: "rgb(232, 174, 60)",
        background: "#121212",
        padding: 2,
      });
      expect(isSafeSvgMarkup(qrSvg)).toBe(true);
    });

    it("rejects hardened SVG XSS, smuggling, and oversize vectors", () => {
      expect(isSafeSvgMarkup("")).toBe(false);
      expect(isSafeSvgMarkup("   ")).toBe(false);
      expect(isSafeSvgMarkup(`<svg>${"a".repeat(65536)}</svg>`)).toBe(false);
      expect(isSafeSvgMarkup("<svg><rect/></svg><svg><rect/></svg>")).toBe(false);
      expect(isSafeSvgMarkup("<svg><svg><rect/></svg></svg>")).toBe(false);
      expect(isSafeSvgMarkup('<svg><rect fill="vbscript:msgbox(1)"/></svg>')).toBe(false);
      expect(isSafeSvgMarkup('<svg><rect fill="data:text/html,<script>alert(1)</script>"/></svg>')).toBe(false);
      expect(isSafeSvgMarkup('<svg><rect fill="data:image/svg+xml;base64,PHN2Zz4="/></svg>')).toBe(false);
      expect(isSafeSvgMarkup("<svg><iframe src='https://evil.test'/></svg>")).toBe(false);
      expect(isSafeSvgMarkup("<svg><style>body{background:red}</style></svg>")).toBe(false);
      expect(isSafeSvgMarkup('<svg><use href="#x"/></svg>')).toBe(false);
      expect(isSafeSvgMarkup('<svg><animate attributeName="href" to="javascript:alert(1)"/></svg>')).toBe(false);
      expect(isSafeSvgMarkup('<svg><rect xlink:href="#evil"/></svg>')).toBe(false);
      expect(isSafeSvgMarkup('<svg><rect fill="url(javascript:alert(1))"/></svg>')).toBe(false);
      expect(isSafeSvgMarkup("<svg><text>&#x6a;avascript:alert(1)</text></svg>")).toBe(false);
    });
  });

  describe("11. Admin Approve Request Validation Hardening", () => {
    it("returns 400 for malformed JSON and invalid submissionId payloads", async () => {
      vi.resetModules();
      vi.doMock("@/lib/adminGuard", () => ({
        requireAdmin: vi.fn(async () => ({ userId: "admin-test-1" })),
      }));
      vi.doMock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: {} }));
      vi.doMock("@/lib/airtable", () => ({ insertProperty: vi.fn() }));
      vi.doMock("@/lib/cmsCache", () => ({ invalidateCmsBundle: vi.fn() }));
      vi.doMock("@/lib/propertyRedirects", () => ({ recordHistoricalSlug: vi.fn() }));

      const { POST } = await import("@/app/api/admin/approve/route");

      const badJsonReq = new Request("https://www.scoutit.space/api/admin/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not-valid-json",
      });
      const badJsonRes = await POST(badJsonReq);
      expect(badJsonRes.status).toBe(400);
      await expect(badJsonRes.json()).resolves.toEqual({ error: "Invalid JSON payload" });

      for (const invalidId of [undefined, null, "", "   ", 12345, {}, "a".repeat(129)]) {
        const req = new Request("https://www.scoutit.space/api/admin/approve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ submissionId: invalidId }),
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: "Invalid submissionId" });
      }
    });
  });
});
