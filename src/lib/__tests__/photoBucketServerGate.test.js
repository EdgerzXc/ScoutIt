import { describe, it, expect, vi, beforeEach } from "vitest";
import { purgeOrphanPhotos } from "@/lib/queueMaintenance";

// Mock serverAuth
vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

// Mock supabaseAdmin
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn(),
    },
  },
}));

describe("A-317: Public Photo Bucket Server Gate, Magic-Bytes Verification & Orphan GC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API: /api/storage/upload-photo (POST)", () => {
    it("rejects unauthenticated caller with 401", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      resolveUserId.mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/storage/upload-photo/route");
      const req = {
        headers: new Headers(),
        formData: async () => ({
          get: () => null,
        }),
      };

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/Unauthorized/i);
    });

    it("rejects missing file with 400", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      resolveUserId.mockResolvedValueOnce("usr-valid");

      const { POST } = await import("@/app/api/storage/upload-photo/route");
      const req = {
        headers: new Headers({ Authorization: "Bearer token" }),
        formData: async () => ({
          get: () => null,
        }),
      };

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/No file provided/i);
    });

    it("rejects oversized photo (> 10MB) with 413", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      resolveUserId.mockResolvedValueOnce("usr-valid");

      const { POST } = await import("@/app/api/storage/upload-photo/route");
      const file = {
        name: "giant-photo.jpg",
        type: "image/jpeg",
        size: 15 * 1024 * 1024, // 15 MB > 10MB
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      };

      const req = {
        headers: new Headers({ Authorization: "Bearer token" }),
        formData: async () => ({
          get: (k) => (k === "file" ? file : null),
        }),
      };

      const res = await POST(req);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toMatch(/File too large/i);
    });

    it("rejects spoofed HTML disguised as an image with 415 via magic bytes check", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      resolveUserId.mockResolvedValueOnce("usr-attacker");

      const { POST } = await import("@/app/api/storage/upload-photo/route");

      // Spoofed file: declared as image/png, but content is HTML
      const htmlPayload = new TextEncoder().encode("<!DOCTYPE html><html><script>alert(1)</script></html>");
      const file = {
        name: "innocent-photo.png",
        type: "image/png",
        size: htmlPayload.length,
        arrayBuffer: vi.fn().mockResolvedValue(htmlPayload.buffer),
      };

      const req = {
        headers: new Headers({ Authorization: "Bearer token" }),
        formData: async () => ({
          get: (k) => (k === "file" ? file : null),
        }),
      };

      const res = await POST(req);
      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json.error).toMatch(/Rejected/i);
    });

    it("accepts valid image bytes, uploads to property_photos with user prefix, and returns public URL", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      resolveUserId.mockResolvedValueOnce("usr-photographer-42");

      // Real PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const file = {
        name: "facade.png",
        type: "image/png",
        size: pngBytes.length,
        arrayBuffer: vi.fn().mockResolvedValue(pngBytes.buffer),
      };

      const mockUpload = vi.fn().mockResolvedValue({ data: { path: "some/path" }, error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/property_photos/usr-photographer-42/facade.png" },
      });

      supabaseAdmin.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const { POST } = await import("@/app/api/storage/upload-photo/route");
      const req = {
        headers: new Headers({ Authorization: "Bearer token" }),
        formData: async () => ({
          get: (k) => (k === "file" ? file : null),
        }),
      };

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.url).toContain("https://example.supabase.co");
      expect(json.path).toMatch(/^usr-photographer-42\//); // Verified per-user prefix!
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^usr-photographer-42\/.*_facade\.png$/),
        expect.any(Uint8Array),
        expect.objectContaining({
          contentType: "image/png",
          upsert: false,
        })
      );
    });
  });

  describe("Orphan GC: purgeOrphanPhotos", () => {
    it("purges temporary or orphan files older than maxAgeHours while leaving fresh files untouched", async () => {
      const now = Date.now();
      const thirtyHoursAgo = new Date(now - 30 * 60 * 60 * 1000).toISOString();
      const oneHourAgo = new Date(now - 1 * 60 * 60 * 1000).toISOString();

      const mockFiles = [
        { name: "orphan_upload_123.jpg", created_at: thirtyHoursAgo }, // Stale orphan -> delete
        { name: "user_temp_456.png", created_at: thirtyHoursAgo },     // Stale temp -> delete
        { name: "user_temp_789.png", created_at: oneHourAgo },         // Fresh temp -> keep
        { name: "regular_photo.jpg", created_at: thirtyHoursAgo },     // Regular photo -> keep
      ];

      const mockRemove = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockStorage = {
        list: vi.fn().mockResolvedValue({ data: mockFiles, error: null }),
        remove: mockRemove,
      };

      const mockAdmin = {
        storage: {
          from: vi.fn().mockReturnValue(mockStorage),
        },
      };

      const result = await purgeOrphanPhotos(mockAdmin, { maxAgeHours: 24 });
      expect(result.checked).toBe(4);
      expect(result.purged).toBe(2);
      expect(mockRemove).toHaveBeenCalledWith(["orphan_upload_123.jpg", "user_temp_456.png"]);
    });
  });
});
