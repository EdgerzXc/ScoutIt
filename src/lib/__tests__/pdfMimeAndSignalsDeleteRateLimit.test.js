import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as readPdfPost } from "@/app/api/ai/read-pdf/route";
import { DELETE as relevantDelete } from "@/app/api/community/signals/[id]/relevant/route";
import { DELETE as saveDelete } from "@/app/api/community/signals/[id]/save/route";
import { createTaskSchema, toTaskRow } from "@/lib/crm/taskModel";
import { createTask } from "@/lib/crmActivity";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Mocks for read-pdf dependencies
vi.mock("@/lib/clientIp", () => ({ clientIp: vi.fn(() => "127.0.0.1") }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "usr-valid-tester" } },
        error: null,
      }),
    },
  }),
}));
vi.mock("unpdf", () => ({
  extractText: vi.fn().mockResolvedValue({ totalPages: 1, text: "Mock brochure content" }),
  getDocumentProxy: vi.fn().mockResolvedValue({
    numPages: 1,
    getPage: vi.fn().mockResolvedValue({
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: "Mock brochure content" }],
      }),
    }),
  }),
}));
vi.mock("@/lib/fileTypeCheck", () => ({
  verifyFileFamily: vi.fn((buffer, allowed) => {
    // Check if buffer starts with %PDF-
    const header = String.fromCharCode(...buffer.slice(0, 5));
    if (header === "%PDF-") {
      return { ok: true, realMime: "application/pdf" };
    }
    return { ok: false, realMime: null, reason: "Magic bytes mismatch" };
  }),
}));
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));
vi.mock("@/lib/communityStore", () => ({ isMissingTable: (err) => err?.code === "42P01" }));

describe("A-327: PDF MIME Flexibility, Signals Counter DELETE Rate Limiting & CRM Task Completion Parity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Part 1: PDF Upload MIME Flexibility with Magic-Byte Enforcement", () => {
    it("accepts a valid PDF with application/octet-stream MIME when magic bytes match", async () => {
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
      const file = {
        name: "condo_brochure.pdf",
        type: "application/octet-stream",
        size: pdfBytes.length,
        arrayBuffer: vi.fn().mockResolvedValue(pdfBytes.buffer),
      };

      const req = {
        headers: new Headers({ Authorization: "Bearer valid-auth-token" }),
        formData: async () => ({
          get: (key) => (key === "file" ? file : null),
        }),
      };

      const res = await readPdfPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.text).toContain("Mock brochure content");
    });

    it("accepts a valid PDF with missing/empty MIME when filename ends with .pdf and magic bytes match", async () => {
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
      const file = {
        name: "floor_plan.pdf",
        type: "",
        size: pdfBytes.length,
        arrayBuffer: vi.fn().mockResolvedValue(pdfBytes.buffer),
      };

      const req = {
        headers: new Headers({ Authorization: "Bearer valid-auth-token" }),
        formData: async () => ({
          get: (key) => (key === "file" ? file : null),
        }),
      };

      const res = await readPdfPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("rejects non-PDF declared MIME (e.g. image/jpeg) with HTTP 415", async () => {
      const file = {
        name: "photo.jpg",
        type: "image/jpeg",
        size: 1000,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1000)),
      };

      const req = {
        headers: new Headers({ Authorization: "Bearer valid-auth-token" }),
        formData: async () => ({
          get: (key) => (key === "file" ? file : null),
        }),
      };

      const res = await readPdfPost(req);
      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json.error).toMatch(/must be a pdf/i);
    });

    it("rejects a file claiming .pdf extension whose magic bytes are not PDF with HTTP 415", async () => {
      const fakeBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG signature
      const file = {
        name: "trojan.pdf",
        type: "application/pdf",
        size: fakeBytes.length,
        arrayBuffer: vi.fn().mockResolvedValue(fakeBytes.buffer),
      };

      const req = {
        headers: new Headers({ Authorization: "Bearer valid-auth-token" }),
        formData: async () => ({
          get: (key) => (key === "file" ? file : null),
        }),
      };

      const res = await readPdfPost(req);
      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json.error).toMatch(/rejected: magic bytes mismatch/i);
    });
  });

  describe("Part 2: Rate Limiting on Signals DELETE Endpoints", () => {
    it("rate-limits relevant DELETE endpoint after 30 taps with HTTP 429", async () => {
      const { clientIp } = await import("@/lib/clientIp");
      clientIp.mockReturnValue("198.51.100.42"); // Unique test IP

      resolveUserId.mockResolvedValue("usr-voter-1");
      supabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { signal_id: "sig-1" } })),
            })),
            maybeSingle: vi.fn(async () => ({ data: { relevant_count: 5 } })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
      });

      // Run 30 allowed DELETE requests
      for (let i = 0; i < 30; i++) {
        const req = new Request("https://scoutit.space/api/community/signals/sig-1/relevant", {
          method: "DELETE",
        });
        const res = await relevantDelete(req, { params: Promise.resolve({ id: "sig-1" }) });
        expect(res.status).toBe(200);
      }

      // The 31st DELETE request within the minute window must return HTTP 429
      const burstReq = new Request("https://scoutit.space/api/community/signals/sig-1/relevant", {
        method: "DELETE",
      });
      const burstRes = await relevantDelete(burstReq, { params: Promise.resolve({ id: "sig-1" }) });
      expect(burstRes.status).toBe(429);
      const json = await burstRes.json();
      expect(json.error).toMatch(/too many taps/i);
    });

    it("rate-limits save DELETE endpoint after 30 taps with HTTP 429", async () => {
      const { clientIp } = await import("@/lib/clientIp");
      clientIp.mockReturnValue("198.51.100.43"); // Unique test IP

      resolveUserId.mockResolvedValue("usr-saver-1");
      supabaseAdmin.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        })),
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ count: 2, error: null })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
      });

      // Run 30 allowed DELETE requests
      for (let i = 0; i < 30; i++) {
        const req = new Request("https://scoutit.space/api/community/signals/sig-2/save", {
          method: "DELETE",
        });
        const res = await saveDelete(req, { params: Promise.resolve({ id: "sig-2" }) });
        expect(res.status).toBe(200);
      }

      // The 31st DELETE request within the minute window must return HTTP 429
      const burstReq = new Request("https://scoutit.space/api/community/signals/sig-2/save", {
        method: "DELETE",
      });
      const burstRes = await saveDelete(burstReq, { params: Promise.resolve({ id: "sig-2" }) });
      expect(burstRes.status).toBe(429);
      const json = await burstRes.json();
      expect(json.error).toMatch(/too many taps/i);
    });
  });

  describe("Part 3: CRM Task Creation Schema & Completion Parity", () => {
    it("createTaskSchema accepts completed: true and toTaskRow maps it to status: 'done' with completed_at", () => {
      const parsed = createTaskSchema.safeParse({
        title: "Sign non-disclosure agreement",
        completed: true,
      });

      expect(parsed.success).toBe(true);
      expect(parsed.data.completed).toBe(true);

      const fixedClock = new Date("2026-11-07T12:00:00.000Z");
      const row = toTaskRow(parsed.data, fixedClock);

      expect(row.status).toBe("done");
      expect(row.completed_at).toBe("2026-11-07T12:00:00.000Z");
    });

    it("crmActivity createTask accepts status: 'done' and completedAt parameter", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: "task-100",
          title: "Verify broker license",
          status: "done",
          completed_at: "2026-11-07T10:00:00.000Z",
        },
        error: null,
      });

      const mockServiceClient = {
        from: vi.fn(() => ({
          insert: vi.fn((rows) => {
            expect(rows[0].status).toBe("done");
            expect(rows[0].completed_at).toBe("2026-11-07T10:00:00.000Z");
            return {
              select: () => ({
                single: mockSingle,
              }),
            };
          }),
        })),
      };

      const result = await createTask(mockServiceClient, {
        ownerUserId: "usr-broker-99",
        title: "Verify broker license",
        status: "done",
        completedAt: "2026-11-07T10:00:00.000Z",
      });

      expect(result).not.toBeNull();
      expect(result.status).toBe("done");
    });
  });
});
