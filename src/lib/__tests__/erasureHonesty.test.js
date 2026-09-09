import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A-075 (engineering half) — the right-to-erasure route reported success when
// the auth deletion failed. It `console.error`ed a "warning", recorded
// `auth_user_removed: false` in audit metadata where the person asking would
// never see it, and still returned
// `{ success: true, message: "Your account and private data have been deleted." }`.
//
// The contrast inside the same function is the whole point: an *audit-write*
// failure was reported honestly, with a `warning` field and a comment about not
// implying a complete paper trail. The *auth-deletion* failure — the more
// consequential of the two, because the person can still sign in — was silent.
// That makes it a slip, not a policy.
//
// The coverage question (which of the ~38 tables holding a user reference are
// lawfully retained) is deliberately NOT touched here. That is a decision for
// the owner and counsel, and it stays open.

const state = {
  deleteUserError: null,
  auditOk: true,
  tableErrors: {},
};

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => "user-1" }));
vi.mock("@/lib/sanitizeError", () => ({ sanitizeError: (_e, fallback) => fallback }));
const auditCalls = [];
vi.mock("@/lib/auditTrail", () => ({
  writeAuditLog: async (_client, entry) => {
    auditCalls.push(entry);
    return { ok: state.auditOk };
  },
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => ({
      delete: () => ({ eq: async () => ({ error: state.tableErrors[table] || null }) }),
      update: () => ({ eq: async () => ({ error: state.tableErrors[table] || null }) }),
    }),
    auth: { admin: { deleteUser: async () => ({ error: state.deleteUserError }) } },
  },
}));

const route = await import("@/app/api/user/delete-account/route");

const deleteRequest = () =>
  new Request("https://www.scoutit.space/api/user/delete-account", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: "DELETE MY ACCOUNT" }),
  });

describe("A-075 · the erasure route never reports a deletion that did not happen", () => {
  beforeEach(() => {
    state.deleteUserError = null;
    state.auditOk = true;
    state.tableErrors = {};
    auditCalls.length = 0;
  });
  afterEach(() => vi.restoreAllMocks());

  it("reports success when the account really was deleted", async () => {
    const response = await route.POST(deleteRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.accountAccessRevoked).toBe(true);
  });

  it("does NOT claim the account was deleted when auth deletion fails", async () => {
    state.deleteUserError = { message: "auth service unavailable" };

    const response = await route.POST(deleteRequest());
    const payload = await response.json();

    expect(payload.success).not.toBe(true);
    // The whole payload, so this cannot pass merely because the claim moved
    // from `message` to some other field.
    expect(JSON.stringify(payload)).not.toMatch(/have been deleted/i);
    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it("tells the person the truth: data erased, sign-in still open", async () => {
    state.deleteUserError = { message: "auth service unavailable" };

    const payload = await (await route.POST(deleteRequest())).json();
    const text = `${payload.error || ""} ${payload.message || ""}`;

    expect(text).toMatch(/sign in/i);
    expect(text).toMatch(/erased|deleted/i);
    expect(payload.accountAccessRevoked).toBe(false);
    // Nothing is hidden: what WAS erased is still reported.
    expect(Array.isArray(payload.erased)).toBe(true);
  });

  it("still writes the audit record when auth deletion fails — the request was made", async () => {
    state.deleteUserError = { message: "auth service unavailable" };

    await route.POST(deleteRequest());

    expect(auditCalls).toHaveLength(1);
    expect(auditCalls[0].metadata.auth_user_removed).toBe(false);
  });

  it("keeps reporting an audit-write failure honestly, as it already did", async () => {
    state.auditOk = false;

    const payload = await (await route.POST(deleteRequest())).json();

    expect(payload.auditRecorded).toBe(false);
    expect(payload.warning).toMatch(/audit/i);
  });

  it("records why soft-delete is used, without asserting the FK reason that was false", async () => {
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/app/api/user/delete-account/route.js", "utf8");
    // `audit_logs` has NO foreign key to auth.users — verified via pg_constraint.
    // The old comment justified soft-delete with that nonexistent FK.
    expect(source).not.toMatch(/preserve FK references for audit logs/);
    expect(source).toMatch(/A-075/);
  });
});
