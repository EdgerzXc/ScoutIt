import { describe, it, expect, vi, beforeEach } from "vitest";
import { MAX_RAW_TEXT_CHARS, MAX_PDF_PAGES, assimilatePropertyText } from "@/lib/assimilateProperty";

// Mock clientIp
vi.mock("@/lib/clientIp", () => ({
  clientIp: vi.fn().mockReturnValue("192.168.1.100"),
}));

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "usr-tester" } },
        error: null,
      }),
    },
  }),
}));

// Mock unpdf
vi.mock("unpdf", () => ({
  extractText: vi.fn(),
  getDocumentProxy: vi.fn(),
}));

// Mock fileTypeCheck
vi.mock("@/lib/fileTypeCheck", () => ({
  verifyFileFamily: vi.fn().mockReturnValue({ ok: true }),
}));

describe("A-315: AI PDF Chain Rate Limit, Oversize Cap & Text/Page Budget Bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API: /api/ai/read-pdf (POST)", () => {
    it("rejects oversized file (e.g. 61 MB) with HTTP 413", async () => {
      const { clientIp } = await import("@/lib/clientIp");
      clientIp.mockReturnValueOnce("192.168.1.10");

      const { POST } = await import("@/app/api/ai/read-pdf/route");

      const file = {
        name: "oversize-listing.pdf",
        type: "application/pdf",
        size: 61 * 1024 * 1024, // 61 MB
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      };

      const req = {
        headers: new Headers({ Authorization: "Bearer mock-valid-token" }),
        formData: async () => ({
          get: (key) => (key === "file" ? file : null),
        }),
      };

      const res = await POST(req);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toMatch(/too large/i);
    });

    it("rate-limits after 20 requests per minute with HTTP 429", async () => {
      const { clientIp } = await import("@/lib/clientIp");
      clientIp.mockReturnValue("192.168.1.20");

      const { POST } = await import("@/app/api/ai/read-pdf/route");
      const { getDocumentProxy, extractText } = await import("unpdf");

      getDocumentProxy.mockResolvedValue({
        numPages: 2,
      });
      extractText.mockResolvedValue({
        totalPages: 2,
        text: "Sample listing text for Makati condo with 2 bedrooms.",
      });

      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x31]); // %PDF1
      const file = {
        name: "small-listing.pdf",
        type: "application/pdf",
        size: 1024 * 100, // 100 KB
        arrayBuffer: vi.fn().mockResolvedValue(pdfHeader.buffer),
      };

      let lastResponse = null;
      // Perform 20 valid requests
      for (let i = 0; i < 20; i++) {
        const req = {
          headers: new Headers({ Authorization: "Bearer mock-valid-token" }),
          formData: async () => ({
            get: (key) => (key === "file" ? file : null),
          }),
        };
        lastResponse = await POST(req);
        expect(lastResponse.status).toBe(200);
      }

      // The 21st request must trigger 429 rate limit
      const req21 = {
        headers: new Headers({ Authorization: "Bearer mock-valid-token" }),
        formData: async () => ({
          get: (key) => (key === "file" ? file : null),
        }),
      };
      const res21 = await POST(req21);
      expect(res21.status).toBe(429);
      const json21 = await res21.json();
      expect(json21.error).toMatch(/Too many PDF read requests/i);
      expect(res21.headers.get("Retry-After")).toBeDefined();
    });

    it("server-side truncates a 50-page PDF to MAX_PDF_PAGES (30 pages)", async () => {
      // Use different IP to avoid rate limit from previous test
      const { clientIp } = await import("@/lib/clientIp");
      clientIp.mockReturnValueOnce("192.168.1.30");

      const { POST } = await import("@/app/api/ai/read-pdf/route");
      const { getDocumentProxy } = await import("unpdf");

      const mockGetPage = vi.fn().mockImplementation((pageNum) => ({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: `Content on page ${pageNum}` }],
        }),
      }));

      getDocumentProxy.mockResolvedValueOnce({
        numPages: 50, // 50-page PDF!
        getPage: mockGetPage,
      });

      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x31]);
      const file = {
        name: "huge-50-page-deck.pdf",
        type: "application/pdf",
        size: 5 * 1024 * 1024, // 5 MB
        arrayBuffer: vi.fn().mockResolvedValue(pdfHeader.buffer),
      };

      const req = {
        headers: new Headers({ Authorization: "Bearer mock-valid-token" }),
        formData: async () => ({
          get: (key) => (key === "file" ? file : null),
        }),
      };

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.totalPages).toBe(50);
      expect(json.pages).toBe(MAX_PDF_PAGES); // Capped to 30 pages!
      expect(json.truncated).toBe(true);
      expect(mockGetPage).toHaveBeenCalledTimes(MAX_PDF_PAGES); // Only extracted 30 pages, not 50!
    });

    it("truncates extracted text exceeding MAX_RAW_TEXT_CHARS (50,000 chars)", async () => {
      const { clientIp } = await import("@/lib/clientIp");
      clientIp.mockReturnValueOnce("192.168.1.102");

      const { POST } = await import("@/app/api/ai/read-pdf/route");
      const { getDocumentProxy, extractText } = await import("unpdf");

      getDocumentProxy.mockResolvedValueOnce({
        numPages: 5,
      });

      const hugeText = "A".repeat(80_000); // 80k characters
      extractText.mockResolvedValueOnce({
        totalPages: 5,
        text: hugeText,
      });

      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x31]);
      const file = {
        name: "verbose-listing.pdf",
        type: "application/pdf",
        size: 2 * 1024 * 1024,
        arrayBuffer: vi.fn().mockResolvedValue(pdfHeader.buffer),
      };

      const req = {
        headers: new Headers({ Authorization: "Bearer mock-valid-token" }),
        formData: async () => ({
          get: (key) => (key === "file" ? file : null),
        }),
      };

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.text.length).toBe(MAX_RAW_TEXT_CHARS);
      expect(json.truncated).toBe(true);
    });
  });

  describe("assimilatePropertyText Bounds", () => {
    it("bounds raw text before handing to fallback", async () => {
      const input = "B".repeat(100_000);
      const result = await assimilatePropertyText(input, "big.pdf");

      expect(result).toBeDefined();
      expect(result.pipeline_status).toBe("pending");
      // Description must be bounded to MAX_DESCRIPTION_CHARS
      expect(result.description.length).toBeLessThanOrEqual(5_000);
    });
  });
});
