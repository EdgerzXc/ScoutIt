import { beforeEach, describe, expect, it, vi } from "vitest";

const propertyId = "87998441-6c10-4a24-ac27-5614c6867355";
const ownerId = "e32a7c21-a388-498a-84f0-3fc62bec83c0";
const staffId = "57203bfc-0a8b-45b7-8cdc-e644bc9e3647";
const sourcePath = `source_queue_docs/${ownerId}/uuid_brochure.pdf`;
const sourceUrl = "https://storage.example.test/private-download";
const dbCalls = [];
const storageCalls = [];
let auth;
let draft;
let recordResult;
let storageAvailable;
let removeResult;

const serviceClient = {
  storage: {
    from(bucket) {
      storageCalls.push(["bucket", bucket]);
      return {
        createSignedUrl: vi.fn(async (...args) => {
          storageCalls.push(["sign", ...args]);
          return { data: { signedUrl: sourceUrl }, error: null };
        }),
        info: vi.fn(async (path) => {
          storageCalls.push(["info", path]);
          return storageAvailable ? { data: { size: 123 } } : { error: { code: "NOT_FOUND" } };
        }),
        remove: vi.fn(async (paths) => {
          storageCalls.push(["remove", paths]);
          return removeResult;
        }),
      };
    },
  },
  from(table) {
    dbCalls.push(["table", table]);
    const query = {
      select: () => query,
      eq: (...args) => {
        dbCalls.push(["eq", ...args]);
        return query;
      },
      or: (...args) => {
        dbCalls.push(["or", ...args]);
        return query;
      },
      order: () => query,
      limit: async () => ({ data: [draft] }),
      maybeSingle: async () => ({ data: draft }),
      update: (fields) => {
        dbCalls.push(["update", fields]);
        return query;
      },
    };
    return query;
  },
  async rpc(name, args) {
    dbCalls.push(["rpc", name, args]);
    return recordResult;
  },
};

vi.mock("@/lib/supabaseAdmin", () => ({ get supabaseAdmin() { return serviceClient; } }));
vi.mock("@/lib/adminGuard", () => ({ requireAdmin: async () => auth }));
vi.mock("@/lib/notifications", () => ({ notifyUser: vi.fn(async () => {}) }));

const pdfVerify = await import("@/app/api/admin/pdf-verify/route");

function request(body, queryString = "") {
  return new Request(`https://www.scoutit.space/api/admin/pdf-verify${queryString}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: "Bearer mock-session" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const attestation = { propertyId, sourceReviewed: true, reviewedDraft: { title: "Listing" } };

describe("staff PDF review", () => {
  beforeEach(() => {
    dbCalls.length = 0;
    storageCalls.length = 0;
    auth = { userId: staffId };
    draft = { id: propertyId, owner_id: ownerId, title: "Listing", pipeline_status: "pending", pdf_verified: false, pdf_source_url: sourcePath };
    recordResult = { data: true };
    storageAvailable = true;
    removeResult = { data: [], error: null };
  });

  it("denies non-staff source retrieval and confirmation before querying the database", async () => {
    auth = { error: "Forbidden", status: 403 };
    expect((await pdfVerify.GET(request(null, `?propertyId=${propertyId}`))).status).toBe(403);
    expect((await pdfVerify.POST(request(attestation))).status).toBe(403);
    expect(dbCalls).toEqual([]);
    expect(storageCalls).toEqual([]);
  });

  it("lists PDF-assisted review and cleanup items without exposing object paths", async () => {
    const res = await pdfVerify.GET(request());
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(dbCalls).toContainEqual(["eq", "creation_source", "pdf_assisted"]);
    const body = await res.json();
    expect(body.drafts[0]).toMatchObject({ id: propertyId, sourceAttached: true, cleanupPending: false });
    expect(body.drafts[0]).not.toHaveProperty("pdf_source_url");
    expect(body.drafts[0]).not.toHaveProperty("owner_id");
  });

  it("returns an expiring download signed for the correct owner-bound object and review fields", async () => {
    draft.details = { floor_sqm: 24, storage_token: "internal" };
    const res = await pdfVerify.GET(request(null, `?propertyId=${propertyId}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sourceUrl, reviewedDraft: { title: "Listing", floor_sqm: 24 } });
    expect(storageCalls).toContainEqual(["sign", sourcePath, 300, { download: "scoutit-source.pdf" }]);
  });

  it("requires the explicit comparison and a PDF that still exists", async () => {
    expect((await pdfVerify.POST(request({ propertyId }))).status).toBe(400);
    storageAvailable = false;
    expect((await pdfVerify.POST(request(attestation))).status).toBe(409);
    expect(dbCalls.some(([op]) => op === "rpc")).toBe(false);
    expect(storageCalls.some(([op]) => op === "remove")).toBe(false);
  });

  it("rejects invalid source pointers and drafts still being parsed", async () => {
    draft.pdf_source_url = "https://outside.example.test/untrusted.pdf";
    expect((await pdfVerify.POST(request(attestation))).status).toBe(409);
    draft.pdf_source_url = sourcePath;
    draft.pipeline_status = "ai_drafting";
    expect((await pdfVerify.POST(request(attestation))).status).toBe(409);
    expect(storageCalls).toEqual([]);
  });

  it("records the version and reviewer before deleting and clearing the source", async () => {
    const res = await pdfVerify.POST(request(attestation));
    expect(await res.json()).toEqual({ success: true, cleanupPending: false });
    expect(dbCalls).toContainEqual(["rpc", "record_property_pdf_review", {
      p_property_id: propertyId,
      p_source_path: sourcePath,
      p_staff_id: staffId,
      p_reviewed_draft: attestation.reviewedDraft,
    }]);
    expect(storageCalls).toContainEqual(["remove", [sourcePath]]);
    expect(dbCalls).toContainEqual(["update", { pdf_source_url: null }]);
  });

  it("retains the source when the review loses a race or when recording fails", async () => {
    recordResult = { data: false };
    expect((await pdfVerify.POST(request(attestation))).status).toBe(409);
    recordResult = { error: { code: "23514" } };
    expect((await pdfVerify.POST(request(attestation))).status).toBe(503);
    expect(storageCalls.some(([op]) => op === "remove")).toBe(false);
  });

  it("retries failed deletion without another attestation", async () => {
    removeResult = { error: { code: "TEMPORARY" } };
    const first = await pdfVerify.POST(request(attestation));
    expect(await first.json()).toEqual({ success: true, cleanupPending: true });
    expect(dbCalls.some(([op]) => op === "update")).toBe(false);

    draft.pdf_verified = true;
    removeResult = { data: [], error: null };
    const retry = await pdfVerify.POST(request({ propertyId }));
    expect(await retry.json()).toEqual({ success: true, cleanupPending: false });
    expect(dbCalls.filter(([op]) => op === "rpc")).toHaveLength(1);
  });
});
