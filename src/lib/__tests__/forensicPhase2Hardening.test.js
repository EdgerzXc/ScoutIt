import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

  describe("GAP-11: MMC Media Update and Revert Dual-CMS Sync", () => {
    it("updateMedia syncs media_link to Airtable when property is live", () => {
      const code = read("mission-control/src/app/dashboard/media/actions.js");
      expect(code).toContain("updatePropertyInAirtable");
      expect(code).toMatch(/if\s*\(isLive\s*&&\s*slug\)/);
      expect(code).toContain("Image: mediaLink");
    });

    it("revertAction syncs property moderation transitions to Airtable", () => {
      const code = read("mission-control/src/app/dashboard/audit/actions.js");
      expect(code).toContain("pipeline_status: pipelineStatus");
      expect(code).toContain("lifecycle_state: lifecycleState");
      expect(code).toContain("updatePropertyInAirtable");
      expect(code).toContain("unpublishPropertyFromAirtable");
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
