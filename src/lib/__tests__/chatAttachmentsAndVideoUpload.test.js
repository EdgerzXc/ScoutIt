import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResolveUserId = vi.fn();
const mockIsRoutedDealRecipient = vi.fn();
const mockRecordSystemEvent = vi.fn();

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: (...args) => mockResolveUserId(...args),
}));

vi.mock("@/lib/dealParty", () => ({
  isRoutedDealRecipient: (...args) => mockIsRoutedDealRecipient(...args),
}));

vi.mock("@/lib/systemEvents", () => ({
  recordSystemEvent: (...args) => mockRecordSystemEvent(...args),
}));

let mockSupabaseState = {};

function createMockSupabase() {
  return {
    auth: {
      getUser: vi.fn(async (token) => {
        if (!token || token === "invalid") {
          return { data: { user: null }, error: { message: "Invalid token" } };
        }
        return { data: { user: { id: token.replace(/^token-/, "") } }, error: null };
      }),
    },
    from: vi.fn((table) => {
      if (table === "deals") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col, id) => ({
              single: vi.fn(async () => {
                const deal = mockSupabaseState.deals?.[id];
                if (!deal) return { data: null, error: { message: "Not found" } };
                return { data: deal, error: null };
              }),
            })),
          })),
        };
      }
      if (table === "user_profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col, id) => ({
              maybeSingle: vi.fn(async () => ({
                data: mockSupabaseState.profiles?.[id] || { id, is_shadowbanned: false, archived_at: null },
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === "properties") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col, id) => ({
              maybeSingle: vi.fn(async () => {
                const prop = mockSupabaseState.properties?.[id] || null;
                return { data: prop, error: null };
              }),
            })),
          })),
        };
      }
      if (table === "file_scans") {
        return {
          select: vi.fn(() => {
            const filters = {};
            const builder = {
              eq: vi.fn((col, val) => {
                filters[col] = val;
                return builder;
              }),
              order: vi.fn(() => builder),
              limit: vi.fn(() => builder),
              maybeSingle: vi.fn(async () => {
                const found = (mockSupabaseState.fileScans || []).find(
                  (r) =>
                    (!filters.bucket || r.bucket === filters.bucket) &&
                    (!filters.storage_path || r.storage_path === filters.storage_path)
                );
                return { data: found || null, error: null };
              }),
            };
            return builder;
          }),
          insert: vi.fn(async (row) => {
            if (mockSupabaseState.failFileScanInsert) {
              return { error: { message: "file_scans insert failed" } };
            }
            const entry = Array.isArray(row) ? row[0] : row;
            mockSupabaseState.fileScans.push({ id: `scan-${mockSupabaseState.fileScans.length + 1}`, ...entry });
            return { data: entry, error: null };
          }),
        };
      }
      if (table === "video_upload_queue") {
        return {
          select: vi.fn(() => {
            const filters = {};
            const builder = {
              eq: vi.fn((col, val) => {
                filters[col] = val;
                return builder;
              }),
              in: vi.fn((col, vals) => {
                filters[col] = vals;
                return builder;
              }),
              order: vi.fn(() => builder),
              limit: vi.fn(() => builder),
              maybeSingle: vi.fn(async () => {
                const found = (mockSupabaseState.videoQueue || []).find((r) => {
                  if (filters.storage_path && r.storage_path !== filters.storage_path) return false;
                  if (filters.owner_id && r.owner_id !== filters.owner_id) return false;
                  if (filters.property_id && r.property_id !== filters.property_id) return false;
                  if (filters.original_filename && r.original_filename !== filters.original_filename) return false;
                  if (filters.file_size_bytes && r.file_size_bytes !== filters.file_size_bytes) return false;
                  if (Array.isArray(filters.status) && !filters.status.includes(r.status)) return false;
                  return true;
                });
                return { data: found || null, error: null };
              }),
            };
            return builder;
          }),
          insert: vi.fn(async (row) => {
            if (mockSupabaseState.failVideoQueueInsert) {
              return { error: { message: "video_upload_queue insert failed" } };
            }
            const entry = Array.isArray(row) ? row[0] : row;
            mockSupabaseState.videoQueue.push({ id: `vq-${mockSupabaseState.videoQueue.length + 1}`, ...entry });
            return { data: entry, error: null };
          }),
        };
      }
      return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: null, error: null })) })) })),
      };
    }),
    storage: {
      from: vi.fn((bucket) => ({
        upload: vi.fn(async (path, bytes, opts) => {
          if (mockSupabaseState.failStorageUpload) {
            return { data: null, error: { message: "Storage write failed" } };
          }
          const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
          mockSupabaseState.objects[`${bucket}:${path}`] = {
            bytes: buf,
            size: buf.byteLength,
            contentType: opts?.contentType || "application/octet-stream",
          };
          return { data: { path }, error: null };
        }),
        createSignedUploadUrl: vi.fn(async (path) => {
          return {
            data: {
              path,
              token: `signed-upload-token-${path}`,
              signedUrl: `https://example.supabase.co/storage/v1/object/upload/sign/${bucket}/${path}?token=signed`,
            },
            error: null,
          };
        }),
        createSignedUrl: vi.fn(async (path, expiresIn) => {
          return {
            data: {
              signedUrl: `https://example.supabase.co/storage/v1/object/sign/${bucket}/${path}?exp=${expiresIn}`,
            },
            error: null,
          };
        }),
        info: vi.fn(async (path) => {
          const obj = mockSupabaseState.objects[`${bucket}:${path}`];
          return obj ? { data: { size: obj.size }, error: null } : { data: null, error: { message: "Object not found" } };
        }),
        download: vi.fn((path) => {
          const obj = mockSupabaseState.objects[`${bucket}:${path}`];
          return Object.assign(Promise.resolve(obj
            ? {
                data: {
                  size: obj.size,
                  arrayBuffer: async () => obj.bytes.buffer.slice(obj.bytes.byteOffset, obj.bytes.byteOffset + obj.bytes.byteLength),
                },
                error: null,
              }
            : { data: null, error: { message: "Object not found" } }), {
            asStream: async () => ({
              data: new ReadableStream({
                start(controller) {
                  controller.enqueue(obj.bytes);
                  controller.close();
                },
              }),
              error: null,
            }),
          });
        }),
        remove: vi.fn(async (paths) => {
          for (const p of paths) {
            delete mockSupabaseState.objects[`${bucket}:${p}`];
          }
          return { data: paths, error: null };
        }),
      })),
    },
  };
}

let mockAdminClient = createMockSupabase();

vi.mock("@/lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return mockAdminClient;
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockAdminClient),
}));

// Valid magic headers
const VALID_PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x00, 0x00, 0x00, 0x00]);
const VALID_MP4_BYTES = new Uint8Array([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00,
]);
const SPOOFED_EXE_BYTES = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);

describe("U-046: Private Chat Attachments & Large Video Uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    mockSupabaseState = {
      deals: {
        "deal-open-1": {
          id: "deal-open-1",
          status: "accepted",
          property_id: "prop-1",
          buyer_id: "user-buyer",
          broker_id: "user-broker",
          properties: { id: "prop-1", title: "Ayala Tower", owner_id: "user-owner" },
        },
        "deal-pending-1": {
          id: "deal-pending-1",
          status: "pending",
          property_id: "prop-1",
          buyer_id: "user-buyer",
          broker_id: "user-broker",
          properties: { id: "prop-1", title: "Ayala Tower", owner_id: "user-owner" },
        },
      },
      properties: {
        "prop-1": { id: "prop-1", owner_id: "user-owner" },
        "prop-other": { id: "prop-other", owner_id: "user-someone-else" },
      },
      profiles: {},
      fileScans: [],
      videoQueue: [],
      objects: {},
      failFileScanInsert: false,
      failVideoQueueInsert: false,
      failStorageUpload: false,
    };
    mockAdminClient = createMockSupabase();
    mockIsRoutedDealRecipient.mockResolvedValue(false);
  });

  describe("1. Private Chat Attachments (/api/deals/[id]/attachments)", () => {
    it("allows participant 1 to upload a private PDF and participant 2 to download it, while blocking an unrelated user with 403", async () => {
      const { POST, GET } = await import("@/app/api/deals/[id]/attachments/route");

      // Participant 1 (buyer) uploads a PDF attachment
      mockResolveUserId.mockResolvedValueOnce("user-buyer");
      const pdfFile = {
        name: "floorplan.pdf",
        type: "application/pdf",
        size: VALID_PDF_BYTES.byteLength,
        arrayBuffer: async () => VALID_PDF_BYTES.buffer,
      };
      const uploadReq = {
        url: "http://localhost/api/deals/deal-open-1/attachments",
        headers: new Headers({ Authorization: "Bearer token-user-buyer" }),
        formData: async () => ({
          get: (k) => (k === "file" ? pdfFile : null),
        }),
      };

      const uploadRes = await POST(uploadReq, { params: Promise.resolve({ id: "deal-open-1" }) });
      expect(uploadRes.status).toBe(200);
      const uploaded = await uploadRes.json();
      expect(uploaded.success).toBe(true);
      expect(uploaded.path).toMatch(/^deal-open-1\/.*_floorplan\.pdf$/);
      expect(uploaded.scanQueued).toBe(true);
      expect(mockSupabaseState.fileScans).toHaveLength(1);
      expect(mockSupabaseState.fileScans[0]).toMatchObject({
        bucket: "chat_attachments",
        storage_path: uploaded.path,
        uploader_id: "user-buyer",
        scan_status: "pending_scan",
      });

      // Participant 2 (broker) requests a signed download URL for that attachment
      mockResolveUserId.mockResolvedValueOnce("user-broker");
      const getReqBroker = new Request(
        `http://localhost/api/deals/deal-open-1/attachments?path=${encodeURIComponent(uploaded.path)}`,
        { headers: { Authorization: "Bearer token-user-broker" } }
      );
      const getResBroker = await GET(getReqBroker, { params: Promise.resolve({ id: "deal-open-1" }) });
      expect(getResBroker.status).toBe(200);
      const brokerDownload = await getResBroker.json();
      expect(brokerDownload.url).toContain(`chat_attachments/${uploaded.path}`);

      // Unrelated account attempts to read the same attachment -> 403 Forbidden
      mockResolveUserId.mockResolvedValueOnce("user-intruder");
      const getReqIntruder = new Request(
        `http://localhost/api/deals/deal-open-1/attachments?path=${encodeURIComponent(uploaded.path)}`,
        { headers: { Authorization: "Bearer token-user-intruder" } }
      );
      const getResIntruder = await GET(getReqIntruder, { params: Promise.resolve({ id: "deal-open-1" }) });
      expect(getResIntruder.status).toBe(403);

      // Unrelated account attempts to upload to the deal -> 403 Forbidden
      mockResolveUserId.mockResolvedValueOnce("user-intruder");
      const intruderUploadRes = await POST(uploadReq, { params: Promise.resolve({ id: "deal-open-1" }) });
      expect(intruderUploadRes.status).toBe(403);
    });

    it("rejects attachment uploads before deal acceptance (pending status) and rejects spoofed magic bytes", async () => {
      const { POST, GET } = await import("@/app/api/deals/[id]/attachments/route");

      // Pending deal cannot upload attachments
      mockResolveUserId.mockResolvedValueOnce("user-buyer");
      const pdfFile = {
        name: "floorplan.pdf",
        type: "application/pdf",
        size: VALID_PDF_BYTES.byteLength,
        arrayBuffer: async () => VALID_PDF_BYTES.buffer,
      };
      const pendingReq = {
        url: "http://localhost/api/deals/deal-pending-1/attachments",
        headers: new Headers({ Authorization: "Bearer token-user-buyer" }),
        formData: async () => ({
          get: (k) => (k === "file" ? pdfFile : null),
        }),
      };
      const pendingRes = await POST(pendingReq, { params: Promise.resolve({ id: "deal-pending-1" }) });
      expect(pendingRes.status).toBe(403);

      // Spoofed executable disguised as PDF on an open deal -> 415
      mockResolveUserId.mockResolvedValueOnce("user-buyer");
      const spoofedFile = {
        name: "invoice.pdf",
        type: "application/pdf",
        size: SPOOFED_EXE_BYTES.byteLength,
        arrayBuffer: async () => SPOOFED_EXE_BYTES.buffer,
      };
      const spoofReq = {
        url: "http://localhost/api/deals/deal-open-1/attachments",
        headers: new Headers({ Authorization: "Bearer token-user-buyer" }),
        formData: async () => ({
          get: (k) => (k === "file" ? spoofedFile : null),
        }),
      };
      const spoofRes = await POST(spoofReq, { params: Promise.resolve({ id: "deal-open-1" }) });
      expect(spoofRes.status).toBe(415);

      // Quarantined file (scan_verdict = 'infected') is blocked on GET with 423
      mockSupabaseState.fileScans.push({
        id: "scan-infected",
        bucket: "chat_attachments",
        storage_path: "deal-open-1/bad.pdf",
        scan_status: "scanned",
        scan_verdict: "infected",
      });
      mockResolveUserId.mockResolvedValueOnce("user-buyer");
      const quarantinedReq = new Request(
        "http://localhost/api/deals/deal-open-1/attachments?path=deal-open-1%2Fbad.pdf",
        { headers: { Authorization: "Bearer token-user-buyer" } }
      );
      const quarantinedRes = await GET(quarantinedReq, { params: Promise.resolve({ id: "deal-open-1" }) });
      expect(quarantinedRes.status).toBe(423);
    });
  });

  describe("2. Large Video Uploads (/api/storage/upload)", () => {
    it("rejects video upload for a property owned by another user with 403", async () => {
      const { POST } = await import("@/app/api/storage/upload/route");

      const req = new Request("http://localhost/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-user-owner",
        },
        body: JSON.stringify({
          action: "init",
          owner_id: "user-owner",
          property_id: "prop-other",
          file_name: "walkthrough.mp4",
          file_size: 40 * 1024 * 1024,
          mime_type: "video/mp4",
          header_hex: Buffer.from(VALID_MP4_BYTES).toString("hex"),
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/own this property|Forbidden/i);
    });

    it("rejects a video above the private bucket limit before signing", async () => {
      const { POST } = await import("@/app/api/storage/upload/route");
      const res = await POST(new Request("http://localhost/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-user-owner",
        },
        body: JSON.stringify({
          action: "init",
          owner_id: "user-owner",
          property_id: "prop-1",
          file_name: "walkthrough.mp4",
          file_size: 50 * 1024 * 1024 + 1,
          mime_type: "video/mp4",
        }),
      }));
      expect(res.status).toBe(413);
      expect(mockAdminClient.storage.from).not.toHaveBeenCalled();
    });

    it("handles a presigned 40 MB video, detects interrupted uploads, and deduplicates duplicate submissions", async () => {
      const { POST } = await import("@/app/api/storage/upload/route");
      const headerHex = Buffer.from(VALID_MP4_BYTES).toString("hex");
      const realVideoSize = 40 * 1024 * 1024;

      // Step 1: Authorize & init scoped presigned upload
      const initReq = new Request("http://localhost/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-user-owner",
        },
        body: JSON.stringify({
          action: "init",
          owner_id: "user-owner",
          property_id: "prop-1",
          file_name: "penthouse-tour.mp4",
          file_size: realVideoSize,
          mime_type: "video/mp4",
          header_hex: headerHex,
        }),
      });

      const initRes = await POST(initReq);
      expect(initRes.status).toBe(200);
      const initData = await initRes.json();
      expect(initData.success).toBe(true);
      expect(initData.path).toMatch(/^user-owner\/prop-1\/.*penthouse-tour\.mp4$/);
      expect(initData.signedUrl).toContain("property-videos-temp");
      expect(initData.token).toBeTruthy();

      // Step 2: Interrupted upload check — calling complete BEFORE object is in storage returns 409 retryable
      const interruptedReq = new Request("http://localhost/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-user-owner",
        },
        body: JSON.stringify({
          action: "complete",
          owner_id: "user-owner",
          property_id: "prop-1",
          path: initData.path,
          file_name: "penthouse-tour.mp4",
          file_size: realVideoSize,
          mime_type: "video/mp4",
        }),
      });

      const interruptedRes = await POST(interruptedReq);
      expect(interruptedRes.status).toBe(409);
      const interruptedJson = await interruptedRes.json();
      expect(interruptedJson.retryable).toBe(true);
      expect(mockSupabaseState.videoQueue).toHaveLength(0);

      // Step 3: A truncated object cannot be queued, even with a valid header.
      mockSupabaseState.objects[`property-videos-temp:${initData.path}`] = {
        bytes: VALID_MP4_BYTES,
        size: realVideoSize - 1,
        contentType: "video/mp4",
      };

      const completeReq = new Request("http://localhost/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-user-owner",
        },
        body: JSON.stringify({
          action: "complete",
          owner_id: "user-owner",
          property_id: "prop-1",
          path: initData.path,
          file_name: "penthouse-tour.mp4",
          file_size: realVideoSize,
          mime_type: "video/mp4",
        }),
      });

      const shortRes = await POST(completeReq.clone());
      expect(shortRes.status).toBe(409);
      expect(mockSupabaseState.videoQueue).toHaveLength(0);

      mockSupabaseState.objects[`property-videos-temp:${initData.path}`].size = realVideoSize;
      const completeRes = await POST(completeReq);
      expect(completeRes.status).toBe(200);
      const completeJson = await completeRes.json();
      expect(completeJson.success).toBe(true);
      expect(completeJson.processingQueued).toBe(true);
      expect(mockSupabaseState.fileScans).toHaveLength(1);
      expect(mockSupabaseState.videoQueue).toHaveLength(1);

      // Step 4: Duplicate submission (either re-completing or re-initializing the same video) is deduplicated
      const dupCompleteReq = new Request("http://localhost/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-user-owner",
        },
        body: JSON.stringify({
          action: "complete",
          owner_id: "user-owner",
          property_id: "prop-1",
          path: initData.path,
          file_name: "penthouse-tour.mp4",
          file_size: realVideoSize,
          mime_type: "video/mp4",
        }),
      });

      const dupRes = await POST(dupCompleteReq);
      expect(dupRes.status).toBe(200);
      const dupJson = await dupRes.json();
      expect(dupJson.deduplicated).toBe(true);
      expect(mockSupabaseState.videoQueue).toHaveLength(1);
    });

    it("attaches failure recovery system event when queue registration fails after storage upload succeeds", async () => {
      const { POST } = await import("@/app/api/storage/upload/route");
      mockSupabaseState.failVideoQueueInsert = true;
      mockRecordSystemEvent.mockResolvedValueOnce({ recorded: true });

      const videoPath = "user-owner/prop-1/1700000000_tour.mp4";
      mockSupabaseState.objects[`property-videos-temp:${videoPath}`] = {
        bytes: VALID_MP4_BYTES,
        size: 50 * 1024 * 1024,
        contentType: "video/mp4",
      };

      const completeReq = new Request("http://localhost/api/storage/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-user-owner",
        },
        body: JSON.stringify({
          action: "complete",
          owner_id: "user-owner",
          property_id: "prop-1",
          path: videoPath,
          file_name: "tour.mp4",
          file_size: 50 * 1024 * 1024,
          mime_type: "video/mp4",
        }),
      });

      const res = await POST(completeReq);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.processingQueued).toBe(false);
      expect(mockRecordSystemEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "storage.video_upload.recovery_required",
          subjectTable: "properties",
          subjectId: "prop-1",
        })
      );
    });
  });
});
