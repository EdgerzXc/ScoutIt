import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { calculateQueuePosition } from "../queuePosition.js";
import { purgeStaleQueueDocs } from "../queueMaintenance.js";

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
    it("identifies expired ai_drafting items, purges storage, and marks them quarantined", async () => {
      let removedPaths = [];
      let updatedRows = [];

      const mockAdmin = {
        from: (table) => ({
          select: () => ({
            eq: () => ({
              lt: async () => ({
                data: [
                  {
                    id: "stale-1",
                    pdf_source_url: "temp_queue_docs/u-1/token_stale.pdf",
                    details: { queued_at: "2026-11-05T00:00:00.000Z" },
                  },
                ],
                error: null,
              }),
            }),
          }),
          update: (payload) => ({
            eq: async (col, val) => {
              updatedRows.push({ id: val, payload });
              return { error: null };
            },
          }),
        }),
        storage: {
          from: () => ({
            remove: async (paths) => {
              removedPaths.push(...paths);
              return { error: null };
            },
          }),
        },
      };

      const result = await purgeStaleQueueDocs(mockAdmin, { maxAgeHours: 24 });
      expect(result.purged).toBe(1);
      expect(removedPaths).toEqual(["temp_queue_docs/u-1/token_stale.pdf"]);
      expect(updatedRows[0].payload.pipeline_status).toBe("quarantined");
      expect(updatedRows[0].payload.details.quarantine_reason).toContain("Stale intake TTL expired");
    });
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
