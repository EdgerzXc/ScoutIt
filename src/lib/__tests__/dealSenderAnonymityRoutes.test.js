import { describe, it, expect, vi, beforeEach } from "vitest";

// A-148 route proofs: the initiate stamp (with its missing-column fail-closed
// path) and the inbox render ("Anonymous" for flagged sends). One file so the
// shared supabaseAdmin chain mock serves both routes.

const state = vi.hoisted(() => ({
  updates: [],
  deletes: [],
  refunds: [],
  anonMissing: false,
  profiles: [],
  dealRows: [],
}));

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: async () => "viewer-1",
  assertAdultEligibility: async () => true,
}));

vi.mock("@/lib/notifications", () => ({ notifyUser: vi.fn(async () => true) }));
vi.mock("@/lib/crmActivity", () => ({ logActivity: vi.fn(async () => true) }));
vi.mock("@/lib/sampleInventory", () => ({ validateSampleInquiryRecipients: () => ({ ok: true }) }));
vi.mock("@/lib/connectBlocks", () => ({ anyBlocked: async () => false, isBlocked: async () => false }));
vi.mock("@/lib/connectGates", () => ({
  findRecentPendingDeal: async () => null,
  checkReceiverGate: async () => ({ ok: true }),
}));
vi.mock("@/lib/connectSource", () => ({
  normalizeConnectSource: () => ({ source: "test" }),
  connectSourceMetadata: () => ({}),
}));
vi.mock("@/lib/brokerRepresentation", () => ({ routingFailureStatus: () => 403 }));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => ({
      select: (fields) => ({
        eq: (...args) => ({
          single: async () => {
            if (table === "properties" && typeof fields === "string" && fields === "id") {
              return { data: { id: "prop-1" }, error: null };
            }
            if (table === "properties") {
              return {
                data: {
                  id: "prop-1", title: "Tower One", slug: "tower-one", owner_id: "owner-1",
                  lifecycle_state: "live", pipeline_status: "approved", quietly_open_to_offers: false,
                },
                error: null,
              };
            }
            return { data: null, error: null };
          },
        }),
        in: async () => {
          if (table === "user_profiles") return { data: [...state.profiles], error: null };
          return { data: [], error: null };
        },
      }),
      update: (obj) => ({
        eq: async () => {
          state.updates.push({ table, obj });
          if (obj && obj.sender_anonymous === true && state.anonMissing) {
            return { error: { code: "42703", message: "column deals.sender_anonymous does not exist" } };
          }
          return { error: null };
        },
      }),
      delete: () => ({
        eq: async () => {
          state.deletes.push(table);
          return { error: null };
        },
      }),
    }),
    rpc: async (name, args) => {
      if (name === "create_routed_buyer_deal") {
        return { data: [{ deal_id: "deal-1", recipient_ids: ["owner-1"], routed_to_roster: false }], error: null };
      }
      if (name === "spend_connects") return { data: [{ total_balance: 9 }], error: null };
      if (name === "refund_connects_system_error") {
        state.refunds.push(args);
        return { data: null, error: null };
      }
      return { data: null, error: null };
    },
  },
}));

const { POST: initiate } = await import("@/app/api/deals/initiate/route");
const { GET: listDeals } = await import("@/app/api/deals/route");

const initiateBody = (extra = {}) =>
  new Request("https://www.scoutit.space/api/deals/initiate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ propertySlug: "tower-one", message: "Hi, keen to view this week.", ...extra }),
  });

beforeEach(() => {
  state.updates = [];
  state.deletes = [];
  state.refunds = [];
  state.anonMissing = false;
  state.profiles = [];
  state.dealRows = [];
});

describe("A-148 — initiate stamps the anonymity choice", () => {
  it("writes sender_anonymous when requested and reports it back", async () => {
    const res = await initiate(initiateBody({ anonymous: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sender_anonymous).toBe(true);
    expect(state.updates.some((u) => u.table === "deals" && u.obj.sender_anonymous === true)).toBe(true);
  });

  it("never touches the gated column for ordinary sends", async () => {
    const res = await initiate(initiateBody());
    expect(res.status).toBe(200);
    expect(state.updates.some((u) => "sender_anonymous" in (u.obj || {}))).toBe(false);
  });

  it("fails an anonymous send honestly when the column is missing — rolled back, refunded, nothing spent silently", async () => {
    state.anonMissing = true;
    const res = await initiate(initiateBody({ anonymous: true }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/Anonymous sending isn't available yet/);
    expect(body.error).toMatch(/No Connect was spent/);
    expect(state.deletes).toContain("deals");
    expect(state.refunds).toHaveLength(1);
    expect(state.refunds[0]).toMatchObject({ p_user_id: "viewer-1", p_amount: 1 });
  });
});

describe("A-148 — inbox renders Anonymous for flagged sends", () => {
  // doMock cannot re-mock an already-imported module, so the rows come from
  // hoisted mutable state read at call time (same pattern as the roster test).
  // viewer-1 is the property OWNER; buyer-9 sent the inquiry. So the viewer
  // is the recipient and the counterparty under test is the buyer — the exact
  // seat the anonymity rule protects.
  const inbox = vi.hoisted(() => ({
    row: {
      id: "d1", status: "pending", pitch_message: "Hi", private_notes: null,
      buyer_id: "buyer-9", broker_id: null, unit_id: null, created_at: new Date().toISOString(),
      closed_at: null, expires_at: null, connects_spent: 1, archived_at: null, pending_clock_reset_at: null,
      properties: { id: "p1", title: "Tower One", slug: "tower-one", owner_id: "viewer-1", price: null },
    },
  }));

  vi.mock("@/lib/deals/userDeals", () => ({
    loadUserDealRows: async () => ({ rows: [{ ...inbox.row }], error: null }),
    loadDealMessageActivity: async () => ({
      lastMessageByDeal: {}, lastActivityByDeal: {}, unreadByDeal: {}, oldestUnreadByDeal: {},
    }),
    deriveMyRole: (r, userId) => {
      if (r?.buyer_id === userId) return "buyer";
      if (r?.broker_id === userId) return "broker";
      if (r?.properties?.owner_id === userId) return "owner";
      return "broker";
    },
  }));

  const getDeals = async () => {
    const res = await listDeals(new Request("https://www.scoutit.space/api/deals"));
    expect(res.status).toBe(200);
    return res.json();
  };

  it("shows Anonymous to the recipient for a flagged send, even from a public profile", async () => {
    inbox.row = { ...inbox.row, status: "pending", sender_anonymous: true };
    state.profiles = [{ id: "buyer-9", display_name: "Leroy", is_profile_public: true }];
    const body = await getDeals();
    expect(body.deals).toHaveLength(1);
    expect(body.deals[0].otherParty).toBe("Anonymous");
  });

  it("names a public sender without the flag", async () => {
    inbox.row = { ...inbox.row, status: "pending" };
    delete inbox.row.sender_anonymous;
    state.profiles = [{ id: "buyer-9", display_name: "Leroy", is_profile_public: true }];
    const body = await getDeals();
    expect(body.deals[0].otherParty).toBe("Leroy");
  });

  it("keeps the role label for a private sender without the flag", async () => {
    inbox.row = { ...inbox.row, status: "pending" };
    delete inbox.row.sender_anonymous;
    state.profiles = [{ id: "buyer-9", display_name: "Leroy", is_profile_public: false }];
    const body = await getDeals();
    expect(body.deals[0].otherParty).toBe("Buyer");
  });

  it("still reveals on acceptance despite the flag", async () => {
    inbox.row = { ...inbox.row, status: "accepted", sender_anonymous: true };
    state.profiles = [{ id: "buyer-9", display_name: "Leroy", is_profile_public: false }];
    const body = await getDeals();
    expect(body.deals[0].otherParty).toBe("Leroy");
  });
});
