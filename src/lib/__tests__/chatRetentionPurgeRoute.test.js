import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authFailure: null,
  tables: {},
  calls: [],
}));

/**
 * A builder that records every step of the chain and resolves to whatever the
 * test configured for that table. It is thenable at any depth, so it does not
 * assume how long the route's chain is.
 */
function builder(table) {
  const record = { table, ops: [], payload: null };
  mocks.calls.push(record);
  const chain = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          const result = mocks.tables[table] ?? { data: [], error: null };
          return (resolve) => resolve(result);
        }
        return (...args) => {
          record.ops.push({ op: String(prop), args });
          if (prop === "update") record.payload = args[0];
          return chain;
        };
      },
    },
  );
  return chain;
}

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: (table) => builder(table) },
}));

vi.mock("@/lib/cronAuth", () => ({
  authorizeCronRequest: () => mocks.authFailure,
}));

import { PURGED_BODY } from "@/lib/chatRetention";
import { GET } from "@/app/api/cron/purge-chat-messages/route";

const request = { headers: { get: () => "Bearer test" } };
const opArgs = (table, op) =>
  mocks.calls.find((c) => c.table === table)?.ops.find((o) => o.op === op)?.args;

describe("purge-chat-messages route", () => {
  beforeEach(() => {
    mocks.authFailure = null;
    mocks.calls = [];
    mocks.tables = {
      deals: { data: [{ id: "deal-old" }, { id: "deal-disputed" }], error: null },
      deal_disputes: { data: [{ deal_id: "deal-disputed" }], error: null },
      deal_messages: { data: [{ id: "m1" }, { id: "m2" }], error: null },
    };
  });

  it("redacts bodies only on eligible deals and reports the count", async () => {
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ purged: 2, eligibleDeals: 1, heldByDispute: 1, retentionDays: 7 });

    const messages = mocks.calls.find((c) => c.table === "deal_messages");
    expect(messages.payload).toEqual({ body: PURGED_BODY });
    // The disputed thread must not be in the update's target list.
    expect(opArgs("deal_messages", "in")).toEqual(["deal_id", ["deal-old"]]);
    expect(opArgs("deal_messages", "neq")).toEqual(["body", PURGED_BODY]);
  });

  it("writes nothing when every closed thread is under a dispute hold", async () => {
    mocks.tables.deal_disputes = { data: [{ deal_id: "deal-old" }, { deal_id: "deal-disputed" }], error: null };

    const payload = await (await GET(request)).json();

    expect(payload).toMatchObject({ purged: 0, eligibleDeals: 0, heldByDispute: 2 });
    expect(mocks.calls.some((c) => c.table === "deal_messages")).toBe(false);
  });

  it("writes nothing when no thread has passed the retention window", async () => {
    mocks.tables.deals = { data: [], error: null };

    const payload = await (await GET(request)).json();

    expect(payload).toMatchObject({ purged: 0, eligibleDeals: 0 });
    expect(mocks.calls.some((c) => c.table !== "deals")).toBe(false);
  });

  it("touches nothing at all when the cron caller is not authorised", async () => {
    mocks.authFailure = Response.json({ error: "Unauthorized" }, { status: 401 });

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(mocks.calls).toEqual([]);
  });

  it("reports a read failure instead of claiming a successful purge", async () => {
    mocks.tables.deals = { data: null, error: { message: "connection lost" } };

    const response = await GET(request);

    expect(response.status).toBe(500);
    expect(mocks.calls.some((c) => c.table === "deal_messages")).toBe(false);
  });
});
