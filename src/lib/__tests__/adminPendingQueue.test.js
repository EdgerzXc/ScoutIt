import { beforeEach, describe, expect, it, vi } from "vitest";

// A-073 — /admin's Pending Approvals panel read Supabase DIRECTLY from the
// browser with the anon key. Read against the live database (2026-09-05), the
// only SELECT policies on `properties` are `lifecycle_state = 'live'` and
// `owner_id = auth.uid()`; there is NO staff bypass policy, and
// pipeline_status 'pending' maps to lifecycle_state 'draft'. So staff saw only
// pending listings they personally owned — third-party submissions were
// invisible in the tool built to review them.
//
// These assertions are behavioural on purpose. The guard is proven by observing
// that the database is never reached, and the owner-scoping regression is proven
// by observing the actual filters applied — not by grepping the source.

const queryLog = [];
let queryResult = { data: [], error: null };

function makeQueryBuilder() {
  const builder = {
    select(fields) {
      queryLog.push(["select", fields]);
      return builder;
    },
    eq(column, value) {
      queryLog.push(["eq", column, value]);
      return builder;
    },
    order(column, opts) {
      queryLog.push(["order", column, opts]);
      return Promise.resolve(queryResult);
    },
  };
  return builder;
}

const serviceClient = {
  from(table) {
    queryLog.push(["from", table]);
    return makeQueryBuilder();
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

const pending = await import("@/app/api/admin/pending/route");

function request() {
  return new Request("https://www.scoutit.space/api/admin/pending", {
    headers: { Authorization: "Bearer session-token" },
  });
}

describe("A-073 · the staff pending queue", () => {
  beforeEach(() => {
    queryLog.length = 0;
    queryResult = { data: [], error: null };
    adminClient.value = serviceClient;
    adminVerdict.value = { user: { id: "staff-1" }, userId: "staff-1" };
  });

  it("denies a non-staff caller without ever reaching the database", async () => {
    adminVerdict.value = { error: "Unauthorized: Admin privileges required", status: 403 };

    const res = await pending.GET(request());

    expect(res.status).toBe(403);
    // The point of the assertion: the gate runs BEFORE any read, so a denied
    // caller cannot cause a query at all.
    expect(queryLog).toEqual([]);
  });

  it("returns every pending submission, not only the caller's own", async () => {
    queryResult = {
      data: [
        { id: "p1", title: "Owned by someone else", owner_id: "other-owner" },
        { id: "p2", title: "Owned by the reviewer", owner_id: "staff-1" },
      ],
      error: null,
    };

    const res = await pending.GET(request());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.properties.map((p) => p.id)).toEqual(["p1", "p2"]);

    // THE REGRESSION THIS ROUTE EXISTS TO PREVENT: no owner scoping. If an
    // owner_id filter ever reappears here, staff silently stop seeing
    // third-party submissions again — the exact failure A-073 found.
    const filters = queryLog.filter(([op]) => op === "eq");
    expect(filters).toEqual([["eq", "pipeline_status", "pending"]]);
    expect(queryLog).toContainEqual(["from", "properties"]);
  });

  it("selects only the fields the queue renders, never select('*')", async () => {
    await pending.GET(request());

    const [, selected] = queryLog.find(([op]) => op === "select");
    expect(selected).not.toContain("*");
    // Internal fields (staff notes, pipeline state, internal pricing) must not
    // reach the browser just because a reviewer opened the queue.
    for (const field of ["id", "title", "type", "location", "coordinates", "owner_id"]) {
      expect(selected).toContain(field);
    }
  });

  it("surfaces a query failure instead of rendering an empty queue", async () => {
    queryResult = { data: null, error: { message: "connection reset" } };

    const res = await pending.GET(request());
    const body = await res.json();

    // An empty queue and a failed load look identical to a reviewer, and the
    // wrong one means real submissions sit unreviewed. The old client code did
    // `if (!error && data)` and swallowed this entirely.
    expect(res.status).toBe(500);
    expect(body.properties).toBeUndefined();
    expect(body.error).toBeTruthy();
  });

  it("fails closed when the service client is unavailable", async () => {
    adminClient.value = null;

    const res = await pending.GET(request());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.properties).toBeUndefined();
  });
});
