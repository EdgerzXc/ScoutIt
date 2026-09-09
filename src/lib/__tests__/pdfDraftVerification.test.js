import { beforeEach, describe, expect, it, vi } from "vitest";

// A-076 — AGENTS.md §2.4 requires a ScoutIt-built PDF draft to be checked
// against its source document before publication. The publish-time 422 and the
// service-role-only `verify_pdf_draft` RPC both existed; nothing called the RPC,
// and nothing ever wrote `creation_source: 'pdf_assisted'`.
//
// The producer was NOT missing — OwnerMode's PDF concierge has been live and
// simply never tagged its drafts, so `creation_source` defaulted to 'manual'
// and the mandated gate never fired for a single real listing.
//
// And the unlock the design named was itself dead: `verify_pdf_draft` sets a
// `properties.updated_at` that does not exist, so it throws 42703 on every
// call. Verified live 2026-09-05. It went a month undetected precisely because
// it had no caller — Standing Rule 15.
//
// These assertions are behavioural: the write path is exercised, and the
// refusal paths are proven by observing what was written, not by reading source.

const rpcCalls = [];
const auditRows = [];
let rpcResult = { data: true, error: null };
let queryResult = { data: [], error: null };
const queryLog = [];

let updateResult = { data: [{ id: "prop-1" }], error: null };
let isUpdate = false;

function makeQueryBuilder() {
  const builder = {
    select(fields) {
      queryLog.push(["select", fields]);
      // On the update path `.select()` terminates the chain.
      return isUpdate ? Promise.resolve(updateResult) : builder;
    },
    update(patch) {
      isUpdate = true;
      queryLog.push(["update", patch]);
      return builder;
    },
    eq(column, value) {
      queryLog.push(["eq", column, value]);
      return builder;
    },
    order() {
      return Promise.resolve(queryResult);
    },
    insert(row) {
      auditRows.push(row);
      return Promise.resolve({ error: null });
    },
  };
  return builder;
}

const serviceClient = {
  from(table) {
    queryLog.push(["from", table]);
    return makeQueryBuilder();
  },
  rpc(name, args) {
    rpcCalls.push([name, args]);
    return Promise.resolve(rpcResult);
  },
};

const adminClient = { value: serviceClient };
vi.mock("@/lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return adminClient.value;
  },
}));

const adminVerdict = { value: { user: { id: "staff-1" }, userId: "staff-1" } };
vi.mock("@/lib/adminGuard", () => ({
  requireAdmin: async () => adminVerdict.value,
}));

const pdfVerify = await import("@/app/api/admin/pdf-verify/route");

function req(body) {
  return new Request("https://www.scoutit.space/api/admin/pdf-verify", {
    method: body ? "POST" : "GET",
    headers: { Authorization: "Bearer session-token" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe("A-076 · the PDF draft verification surface", () => {
  beforeEach(() => {
    rpcCalls.length = 0;
    auditRows.length = 0;
    queryLog.length = 0;
    isUpdate = false;
    rpcResult = { data: true, error: null };
    queryResult = { data: [], error: null };
    updateResult = { data: [{ id: "prop-1" }], error: null };
    adminClient.value = serviceClient;
    adminVerdict.value = { user: { id: "staff-1" }, userId: "staff-1" };
  });

  it("denies a non-staff caller without writing anything", async () => {
    adminVerdict.value = { error: "Unauthorized: Admin privileges required", status: 403 };

    const res = await pdfVerify.POST(req({ propertyId: "prop-1" }));

    expect(res.status).toBe(403);
    // The route must not reach the database at all for a non-staff caller.
    expect(queryLog.filter(([op]) => op === "update")).toEqual([]);
    expect(auditRows).toEqual([]);
  });

  it("never calls the verify_pdf_draft RPC, which is broken in the database", async () => {
    // Verified live 2026-09-05: the function references `properties.updated_at`,
    // a column that does not exist, so every call throws 42703. It went a month
    // undetected because nothing called it (Rule 15). The repair is prepared in
    // 20260905000001 but is owner-gated, so the route must not depend on it —
    // if it ever does again, every verification 500s.
    await pdfVerify.POST(req({ propertyId: "prop-1" }));
    expect(rpcCalls).toEqual([]);
  });

  it("queues only unverified pdf_assisted drafts", async () => {
    await pdfVerify.GET(req());

    const filters = queryLog.filter(([op]) => op === "eq");
    expect(filters).toEqual([
      ["eq", "creation_source", "pdf_assisted"],
      ["eq", "pdf_verified", false],
    ]);
  });

  it("sets pdf_verified only on a pdf_assisted row, and audits the actor", async () => {
    const res = await pdfVerify.POST(req({ propertyId: "prop-1" }));

    expect(res.status).toBe(200);
    expect(queryLog).toContainEqual(["update", { pdf_verified: true }]);

    // The scoping the broken RPC used to provide must be kept here, or staff
    // could mark any listing verified by passing its id.
    const filters = queryLog.filter(([op]) => op === "eq");
    expect(filters).toEqual([
      ["eq", "id", "prop-1"],
      ["eq", "creation_source", "pdf_assisted"],
    ]);

    // A staff attestation that leaves no record is not an attestation.
    expect(auditRows).toHaveLength(1);
    expect(auditRows[0]).toMatchObject({
      action: "PDF_DRAFT_VERIFIED",
      record_id: "prop-1",
      user_id: "staff-1",
    });
  });

  it("refuses, and records nothing, when no pdf_assisted row matched", async () => {
    // A wrong id, or a listing that was never PDF-assisted. Reporting success
    // would record an attestation about nothing (Rule 7).
    updateResult = { data: [], error: null };

    const res = await pdfVerify.POST(req({ propertyId: "not-a-pdf-draft" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBeUndefined();
    expect(auditRows).toEqual([]);
  });

  it("does not audit a verification the database refused", async () => {
    updateResult = { data: null, error: { message: "deadlock detected" } };

    const res = await pdfVerify.POST(req({ propertyId: "prop-1" }));

    expect(res.status).toBe(500);
    expect(auditRows).toEqual([]);
  });

  it("rejects a request with no propertyId before touching the database", async () => {
    const res = await pdfVerify.POST(req({}));

    expect(res.status).toBe(400);
    expect(queryLog.filter(([op]) => op === "update")).toEqual([]);
  });
});
