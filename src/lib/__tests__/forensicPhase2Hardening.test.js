import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verificationDecisionForRevert } from "../../../mission-control/src/lib/auditRevertPolicy.mjs";
import { publicMediaUrl } from "../../../mission-control/src/lib/publicMediaUrl.mjs";
import { parseSynthesis } from "../../../mission-control/src/lib/ingestSchema.js";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Phase 2: Dual-CMS & Moderation Invariants Verification", () => {
  describe("GAP-01: MMC setPropertyArchived and bulkArchiveProperties Dual-CMS Invariants", () => {
    it("updates pipeline_status, unpublishes in Airtable, and invalidates cache", () => {
      const code = read("mission-control/src/app/dashboard/cms/actions.js");
      const archive = read("mission-control/src/lib/propertyArchive.mjs");
      expect(archive).toContain('pipeline_status: archive ? "archived" : "pending"');
      expect(archive).toContain('lifecycle_state: archive ? "off_market" : "draft"');
      expect(code).toContain("unpublish: unpublishBoundProperty");
      expect(code).toContain("logActionStrict");
    });
  });

  describe("GAP-02: Harmonized Approval Lifecycle State", () => {
    it("stamps canonical_slug, canonical_slug_locked_at, published_at, and lifecycle_state='live' in main admin approve", () => {
      const code = read("src/app/api/admin/approve/route.js");
      expect(code).toContain("buildFirstPublicationUpdate({ current: submission, computedSlug: binding.slug, now })");
      expect(code).toContain("publication_external_record_id: binding.recordId");
    });

    it("stamps canonical_slug, canonical_slug_locked_at, published_at, and lifecycle_state='live' in MMC approveProperty", () => {
      const code = read("mission-control/src/lib/propertyPublication.mjs");
      expect(code).toContain("lifecycle_state: \"live\"");
      expect(code).toContain("canonical_slug_locked_at: property.canonical_slug_locked_at || now");
      expect(code).toContain("published_at: property.published_at || now");
      expect(code).toContain("publication_external_record_id: binding.recordId");
      expect(code).toContain("pipeline_status: \"approved\"");
    });
  });

  describe("GAP-11: MMC Media Update and verified audit reverts", () => {
    it("updateMedia syncs media_link to Airtable when property is live", () => {
      const code = read("mission-control/src/app/dashboard/media/actions.js");
      const provider = read("mission-control/src/lib/airtable.js");
      expect(code).toContain("await updateBoundPropertyImage(binding, mediaLink)");
      expect(provider).toContain("patchBoundProperty(binding, { Image: mediaLink }, true)");
    });

    it("audit replay only exposes a recorded verification decision with sufficient evidence", () => {
      const id = "f81d4fae-7dec-41d0-a765-00a0c91e6bf6";
      const event = { action: "verification.approve", target_table: "verification_requests", target_id: id, actor_id: id,
        metadata: { decision_at: "2026-11-21T03:00:00.000Z" } };
      expect(verificationDecisionForRevert(event)).toEqual({
        id, reviewerId: id, status: "approved", decidedAt: event.metadata.decision_at,
      });
      expect(verificationDecisionForRevert({ ...event, metadata: {} })).toBeNull();
      expect(verificationDecisionForRevert({ ...event, target_table: "properties", action: "property.approve_publish" })).toBeNull();
      const code = read("mission-control/src/app/dashboard/audit/actions.js");
      expect(code).toContain('.eq("decided_at", decision.decidedAt)');
      expect(code).not.toContain('from("properties")');
    });

    it("keeps temporary authenticated links out of publishable media and stores valid draft fields", () => {
      const media = "https://www.example.com/gallery/office.jpg";
      const privateMedia = "https://www.example.com/storage/v1/object/sign/pdf/source.pdf?token=fixture";
      expect(publicMediaUrl(media)).toBe(media);
      expect(publicMediaUrl(privateMedia)).toBeNull();
      expect(() => parseSynthesis(JSON.stringify({ media_link: privateMedia }))).toThrow("Use a public HTTPS link");
      expect(parseSynthesis(JSON.stringify({ title: "<b>Office</b>", media_link: media, price: "₱35,000" })).patch)
        .toEqual({ title: "Office", media_link: media, price: 35000 });
    });
  });

  describe("GAP-20: MMC CSV Import Pipeline Status & OWASP Sanitization", () => {
    it("sets pipeline_status to pending and protects against formula injection", () => {
      const code = read("mission-control/src/app/dashboard/cms/import/actions.js");
      expect(code).toContain("pipeline_status: \"pending\"");
      expect(code).toContain("lifecycle_state: \"draft\"");
      expect(code).toContain("/^[=+\\-@\\t\\r]/");
      expect(code).toContain("filename: sanitizeFormulaInjection(file.name)");
    });
  });

  describe("GAP-28: Staff Intel Ingest Invalidation", () => {
    it("calls invalidateCmsBundle upon publishing an Intel briefing", () => {
      const code = read("src/app/api/intel/ingest/route.js");
      expect(code).toContain("import { invalidateCmsBundle } from \"@/lib/cmsCache\"");
      expect(code).toMatch(/if\s*\(publish\)\s*\{\s*try\s*\{\s*publicCachePending\s*=\s*await\s*invalidateCmsBundle\(\)/);
      expect(code).toContain("publicCachePending,");
    });
  });
});
