import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { calculateQueuePosition } from "../queuePosition.js";
import { purgeStaleQueueDocs } from "../queueMaintenance.js";
import { resolveQueueDocument } from "../propertyQueueStorage.js";

describe("Queue Intake Quota, Private Lifecycle, and Concurrency (A-303)", () => {
  describe("calculateQueuePosition", () => {
    it("returns 1 when client or propertyId is missing or queue is empty", async () => {
      expect(await calculateQueuePosition(null, "p-1")).toBe(1);
      expect(await calculateQueuePosition({}, null)).toBe(1);

      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                order: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        }),
      };
      expect(await calculateQueuePosition(mockClient, "p-1")).toBe(1);
    });

    it("assigns distinct, deterministic positions to concurrent items with identical timestamps", async () => {
      const now = "2026-11-07T10:00:00.000Z";
      const items = [
        { id: "prop-alpha", created_at: now },
        { id: "prop-beta", created_at: now },
        { id: "prop-gamma", created_at: now },
      ];

      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                order: async () => ({ data: items, error: null }),
              }),
            }),
          }),
        }),
      };

      const posAlpha = await calculateQueuePosition(mockClient, "prop-alpha");
      const posBeta = await calculateQueuePosition(mockClient, "prop-beta");
      const posGamma = await calculateQueuePosition(mockClient, "prop-gamma");

      expect(posAlpha).toBe(1);
      expect(posBeta).toBe(2);
      expect(posGamma).toBe(3);
    });
  });

  describe("purgeStaleQueueDocs", () => {
    it("quarantines a stalled draft with a guarded transition and preserves Storage", async () => {
      const storage = { from: vi.fn() };
      const filters = [];
      const updateQuery = {
        eq(column, value) { filters.push([column, value]); return updateQuery; },
        select: () => updateQuery,
        maybeSingle: async () => ({ data: { id: "stale-1" } }),
      };
      const update = vi.fn(() => updateQuery);

      const mockAdmin = {
        from: () => ({
          select: () => ({
            eq: () => ({
              lt: async () => ({
                data: [
                  {
                    id: "stale-1",
                    owner_id: "u-1",
                    pdf_source_url: "temp_queue_docs/u-1/token_stale.pdf",
                    details: { queued_at: "2026-11-05T00:00:00.000Z" },
                  },
                ],
                error: null,
              }),
            }),
          }),
          update,
        }),
        storage,
      };

      const result = await purgeStaleQueueDocs(mockAdmin, { maxAgeHours: 24 });
      expect(result.purged).toBe(1);
      expect(storage.from).not.toHaveBeenCalled();
      expect(filters).toEqual([["id", "stale-1"], ["pipeline_status", "ai_drafting"]]);
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ pipeline_status: "quarantined" }));
    });
  });

  it("resolves private and legacy queue keys only for the stored owner", () => {
    const owner_id = "u-1";
    const privatePath = "source_queue_docs/u-1/token.pdf";
    const legacyPath = "temp_queue_docs/u-1/token.pdf";
    expect(resolveQueueDocument({ owner_id, pdf_source_url: privatePath })).toEqual({
      bucket: "property-documents-temp",
      path: privatePath,
    });
    expect(resolveQueueDocument({ owner_id, pdf_source_url: legacyPath })).toEqual({
      bucket: "property_photos",
      path: legacyPath,
    });
    expect(resolveQueueDocument({ owner_id, pdf_source_url: "source_queue_docs/u-2/token.pdf" })).toBeNull();
    expect(resolveQueueDocument({ owner_id, pdf_source_url: "source_queue_docs/u-1/nested/token.pdf" })).toBeNull();
    expect(resolveQueueDocument({ owner_id, details: { temp_storage_path: privatePath } })).toBeNull();
  });

  describe("Source Code Contracts for Intake Route", () => {
    it("pins rate limiter and per-user pending cap", () => {
      const intakeSrc = readFileSync("src/app/api/properties/queue/intake/route.js", "utf8");
      expect(intakeSrc).toContain("createRateLimiter");
      expect(intakeSrc).toContain("MAX_PENDING_PER_USER = 5");
      expect(intakeSrc).toContain("Queue limit reached");
      expect(intakeSrc).toContain("retryAfterSeconds");
    });

    it("pins SHA-256 deduplication and unguessable storage path", () => {
      const intakeSrc = readFileSync("src/app/api/properties/queue/intake/route.js", "utf8");
      expect(intakeSrc).toContain('createHash("sha256")');
      expect(intakeSrc).toContain("pdf_hash: fileHash");
      expect(intakeSrc).toContain("deduplicated: true");
      expect(intakeSrc).toContain("randomUUID");
    });

    it("pins calculateQueuePosition usage in intake and status routes", () => {
      const intakeSrc = readFileSync("src/app/api/properties/queue/intake/route.js", "utf8");
      const statusSrc = readFileSync("src/app/api/properties/queue/status/route.js", "utf8");
      expect(intakeSrc).toContain("calculateQueuePosition(supabaseAdmin, inserted.id)");
      expect(statusSrc).toContain("calculateQueuePosition(supabaseAdmin, property.id)");
    });
  });
});
