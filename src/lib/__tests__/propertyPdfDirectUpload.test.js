import { beforeEach, describe, expect, it, vi } from "vitest";
import { isSensitivePath, rateLimitTier } from "@/lib/sensitiveRoutes";
import { PRIVATE_QUEUE_BUCKET, PROPERTY_PDF_MAX_BYTES, propertyPdfUploadPath } from "@/lib/propertyQueueStorage";

const ownerId = "57203bfc-0a8b-45b7-8cdc-e644bc9e3647";
const uploadId = "87998441-6c10-4a24-ac27-5614c6867355";
const propertyId = "e32a7c21-a388-498a-84f0-3fc62bec83c0";
const calls = [];
let currentUser;
let activeUpload;
let latestFile;
let storedSources;
let deletedFiles;

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => currentUser }));
vi.mock("@/lib/notifications", () => ({ notifyUser: vi.fn(async () => true) }));
vi.mock("@/lib/queuePosition", () => ({ calculateQueuePosition: async () => 1 }));
vi.mock("@/lib/cronEventLog", () => ({ withCronEventLog: (_name, handler) => handler }));

const client = {
  rpc: vi.fn(async (name) => ({ data: name === "reserve_property_pdf_upload" ? uploadId : { state: "ready", propertyId, created: false } })),
  from(table) {
    const query = {
      select: () => query,
      delete: () => { calls.push(["delete", table]); return query; },
      eq: (key, value) => { calls.push(["eq", key, value]); return query; },
      gt: () => query,
      lte: () => query,
      order: () => query,
      limit: async () => ({ data: [{ id: uploadId, owner_id: ownerId }, { id: propertyId, owner_id: ownerId }] }),
      in: () => query,
      maybeSingle: async () => ({ data: activeUpload }),
      then: (resolve, reject) => Promise.resolve({ data: table === "properties" ? storedSources : [] }).then(resolve, reject),
    };
    return query;
  },
  storage: {
    from(bucket) {
      calls.push(["bucket", bucket]);
      return {
        createSignedUploadUrl: vi.fn(async (...args) => {
          calls.push(["sign", ...args]);
          return { data: { token: "fixture-signed-token" } };
        }),
        info: async (path) => {
          calls.push(["info", path]);
          return latestFile ? { data: { size: latestFile.size } } : { error: { statusCode: 404 } };
        },
        download: async (path) => {
          calls.push(["download", path]);
          return { data: latestFile };
        },
        remove: async (files) => { deletedFiles.push(...files); return {}; },
      };
    },
  },
};

vi.mock("@/lib/supabaseAdmin", () => ({ get supabaseAdmin() { return client; } }));

const upload = await import("@/app/api/properties/queue/upload/route");
const cleanup = await import("@/app/api/cron/purge-expired-property-pdf-uploads/route");

function request(method, payload) {
  return new Request("https://scoutit.space/api/properties/queue/upload", { method, body: JSON.stringify(payload) });
}

describe("property PDF direct upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
    currentUser = ownerId;
    latestFile = new Blob(["%PDF-1.4\nfixture"], { type: "application/pdf" });
    activeUpload = { size_bytes: latestFile.size, property_id: null };
    storedSources = [];
    deletedFiles = [];
  });

  it("blocks anonymous reservations and oversize files before obtaining credentials", async () => {
    const payload = { filename: "brochure.pdf", size: PROPERTY_PDF_MAX_BYTES + 1 };
    expect((await upload.POST(request("POST", payload))).status).toBe(413);
    currentUser = null;
    expect((await upload.POST(request("POST", { ...payload, size: 1024 }))).status).toBe(401);
    expect(calls).toEqual([]);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("signs exactly one private immutable path for a 25 MB PDF", async () => {
    const response = await upload.POST(request("POST", { filename: "Brochure.PDF", size: PROPERTY_PDF_MAX_BYTES }));
    const path = propertyPdfUploadPath(ownerId, uploadId);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ uploadId, path, token: "fixture-signed-token" });
    expect(calls).toContainEqual(["bucket", PRIVATE_QUEUE_BUCKET]);
    expect(calls).toContainEqual(["sign", path, { upsert: false }]);
  });

  it("scopes finalization to its owner before reaching Storage", async () => {
    activeUpload = null;
    expect((await upload.PATCH(request("PATCH", { uploadId }))).status).toBe(404);
    expect(calls).toContainEqual(["eq", "owner_id", ownerId]);
    expect(calls.some(([operation]) => operation === "bucket")).toBe(false);
  });

  it("validates the stored bytes and forwards their digest to atomic finalization", async () => {
    const response = await upload.PATCH(request("PATCH", { uploadId, path: "ignored" }));
    expect(await response.json()).toEqual({ success: true, propertyId });
    expect(calls).toContainEqual(["download", propertyPdfUploadPath(ownerId, uploadId)]);
    expect(client.rpc).toHaveBeenCalledWith("finalize_property_pdf_upload", {
      p_upload_id: uploadId, p_owner_id: ownerId, p_pdf_hash: expect.stringMatching(/^[\da-f]{64}$/), p_priority: false,
    });
  });

  it("returns an existing draft without rereading storage and prevents invalid files from entering the queue", async () => {
    activeUpload.property_id = propertyId;
    expect(await (await upload.PATCH(request("PATCH", { uploadId }))).json()).toMatchObject({ propertyId });
    expect(calls.some(([operation]) => operation === "bucket")).toBe(false);

    activeUpload.property_id = null;
    latestFile = new Blob(["ordinary text"], { type: "application/pdf" });
    expect((await upload.PATCH(request("PATCH", { uploadId }))).status).toBe(422);
    activeUpload.size_bytes = latestFile.size;
    expect((await upload.PATCH(request("PATCH", { uploadId }))).status).toBe(415);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("cleans abandoned uploads after expiry and preserves PDFs referenced by a draft", async () => {
    vi.stubEnv("CRON_SECRET", "local-pdf-cleanup-test");
    try {
      storedSources = [{ pdf_source_url: propertyPdfUploadPath(ownerId, uploadId) }];
      const url = "https://scoutit.space/api/cron/purge-expired-property-pdf-uploads";
      expect((await cleanup.GET(new Request(url))).status).toBe(401);
      expect(deletedFiles).toEqual([]);
      const response = await cleanup.GET(new Request(url, { headers: { Authorization: "Bearer local-pdf-cleanup-test" } }));
      expect(await response.json()).toEqual({ cleared: 2, preservedSources: 1 });
      expect(deletedFiles).toEqual([propertyPdfUploadPath(ownerId, propertyId)]);
      expect(calls).toContainEqual(["delete", "property_pdf_uploads"]);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("uses distributed failure-closed protection for signing and parsing", () => {
    expect(isSensitivePath("/api/properties/queue/upload")).toBe(true);
    expect(isSensitivePath("/api/properties/queue/process")).toBe(true);
    expect(rateLimitTier("/api/properties/queue/process")).toBe("ai");
  });
});
