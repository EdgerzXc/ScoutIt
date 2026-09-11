import { beforeEach, describe, expect, it, vi } from "vitest";

// U-032 / A-134 — both routes that answer a broker request, driven for real.
//
// The defect: a broker could accept their OWN pitch through
// /api/dashboard/deals/update and switch the representation to active, and the
// inbox path (/api/deals/[id]) accepted a broker's pitch without ever moving the
// representation. Both are proven here by the writes each route makes, not by
// reading its source.

const state = { actor: null, deal: null, calls: [] };

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.actor ? { id: state.actor } : null }, error: null }),
    },
  }),
}));
vi.mock("@/lib/crmActivity", () => ({ logActivity: async () => ({ ok: true }) }));
vi.mock("@/lib/dealParty", () => ({ isRoutedDealRecipient: async () => false }));
vi.mock("@/lib/supabaseAdmin", () => {
  const from = (table) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      single: async () => ({ data: state.deal, error: state.deal ? null : { message: "not found" } }),
      update: (payload) => {
        state.calls.push({ table, payload });
        return chain;
      },
      then: (resolve) => resolve({ error: null }),
    };
    return chain;
  };
  return { supabaseAdmin: { from } };
});

const dashboardRoute = await import("@/app/api/dashboard/deals/update/route");
const inboxRoute = await import("@/app/api/deals/[id]/route");

const PITCH = Object.freeze({
  id: "d1",
  status: "pending",
  property_id: "p1",
  broker_id: "broker-1",
  buyer_id: null,
  properties: { owner_id: "owner-1" },
});

const headers = { Authorization: "Bearer token", "content-type": "application/json" };
const answerViaDashboard = (newStatus) =>
  dashboardRoute.POST(
    new Request("http://localhost/api/dashboard/deals/update", {
      method: "POST",
      headers,
      body: JSON.stringify({ dealId: "d1", newStatus }),
    }),
  );
const answerViaInbox = (status) =>
  inboxRoute.PATCH(
    new Request("http://localhost/api/deals/d1", { method: "PATCH", headers, body: JSON.stringify({ status }) }),
    { params: Promise.resolve({ id: "d1" }) },
  );

const writesTo = (table) => state.calls.filter((call) => call.table === table);

beforeEach(() => {
  state.actor = null;
  state.deal = null;
  state.calls = [];
});

describe("U-032 · a broker cannot accept their own pitch", () => {
  it("refuses it on the dashboard route and writes nothing", async () => {
    state.deal = { ...PITCH };
    state.actor = "broker-1";
    const response = await answerViaDashboard("accepted");
    expect(response.status).toBe(403);
    expect(writesTo("deals")).toHaveLength(0);
    expect(writesTo("property_broker_representations")).toHaveLength(0);
  });

  it("refuses it on the inbox route and writes nothing", async () => {
    state.deal = { ...PITCH };
    state.actor = "broker-1";
    const response = await answerViaInbox("accepted");
    expect(response.status).toBe(403);
    expect(writesTo("deals")).toHaveLength(0);
    expect(writesTo("property_broker_representations")).toHaveLength(0);
  });

  it("still lets the broker answer an owner's invitation, and not the owner", async () => {
    state.deal = { ...PITCH, status: "invited" };
    state.actor = "owner-1";
    expect((await answerViaDashboard("accepted")).status).toBe(403);

    state.calls = [];
    state.actor = "broker-1";
    expect((await answerViaDashboard("accepted")).status).toBe(200);
    expect(writesTo("property_broker_representations")[0]?.payload.status).toBe("active");
  });
});

describe("A-134 · the owner's answer moves the representation on both surfaces", () => {
  it("dashboard: accepting activates it, declining declines it", async () => {
    state.deal = { ...PITCH };
    state.actor = "owner-1";
    expect((await answerViaDashboard("accepted")).status).toBe(200);
    expect(writesTo("property_broker_representations")[0]?.payload.status).toBe("active");

    state.calls = [];
    expect((await answerViaDashboard("declined")).status).toBe(200);
    expect(writesTo("property_broker_representations")[0]?.payload.status).toBe("declined");
  });

  it("inbox: accepting a broker's pitch activates the representation (it used to stay pending)", async () => {
    state.deal = { ...PITCH };
    state.actor = "owner-1";
    const response = await answerViaInbox("accepted");
    expect(response.status).toBe(200);
    expect(writesTo("deals")[0]?.payload.status).toBe("accepted");
    expect(writesTo("property_broker_representations")[0]?.payload.status).toBe("active");
  });
});

describe("a buyer inquiry never moves a representation", () => {
  const ROUTED_BUYER = { ...PITCH, buyer_id: "buyer-1" };

  it("a broker declining one routed buyer does not decline their whole representation", async () => {
    state.deal = { ...ROUTED_BUYER };
    state.actor = "broker-1";
    expect((await answerViaDashboard("declined")).status).toBe(200);
    expect(writesTo("deals")).toHaveLength(1);
    expect(writesTo("property_broker_representations")).toHaveLength(0);
  });

  it("the inbox route leaves the representation alone for a buyer inquiry", async () => {
    state.deal = { ...ROUTED_BUYER };
    state.actor = "broker-1";
    expect((await answerViaInbox("accepted")).status).toBe(200);
    expect(writesTo("property_broker_representations")).toHaveLength(0);
  });
});
