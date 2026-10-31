import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory dummy test state
const state = {
  currentUser: null,
  isAdult: true,
  profiles: {},
  properties: {},
  deals: {},
  handshakes: {},
  routingRecipients: [],
  connectBalances: {},
};

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(async () => state.currentUser),
  assertAdultEligibility: vi.fn(async () => state.isAdult),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.currentUser ? { id: state.currentUser } : null },
        error: state.currentUser ? null : { message: "No user" },
      }),
    },
  }),
}));

vi.mock("@/lib/notifications", () => ({ notifyUser: vi.fn(async () => true) }));
vi.mock("@/lib/crmActivity", () => ({ logActivity: vi.fn(async () => true) }));
vi.mock("@/lib/sampleInventory", () => ({ validateSampleInquiryRecipients: () => ({ ok: true }) }));
vi.mock("@/lib/turnstile", () => ({ turnstileGuard: async () => null }));
vi.mock("@/lib/connectBlocks", () => ({ anyBlocked: async () => false, isBlocked: async () => false }));
vi.mock("@/lib/connectGates", () => ({
  findRecentPendingDeal: async () => null,
  checkReceiverGate: async () => ({ ok: true }),
}));

function fakeSupabase() {
  return {
    rpc: vi.fn(async (name, args) => {
      if (name === "create_routed_buyer_deal") {
        const dealId = "deal-created-" + Math.random().toString(36).substring(7);
        state.deals[dealId] = {
          id: dealId,
          property_id: args.p_property_id,
          buyer_id: args.p_buyer_id,
          broker_id: args.p_preferred_broker_id || null,
          status: "pending",
        };
        return { data: [{ deal_id: dealId, recipient_ids: ["owner-1"], routed_to_roster: false }], error: null };
      }
      if (name === "complete_transaction_handshake") {
        const deal = state.deals[args.p_deal_id];
        if (!deal) return { data: null, error: { message: "Deal not found" } };
        let hs = state.handshakes[args.p_deal_id];
        if (!hs) {
          const prop = state.properties[deal.property_id];
          hs = {
            id: "hs-" + args.p_deal_id,
            deal_id: args.p_deal_id,
            property_id: deal.property_id,
            party_a_id: deal.buyer_id,
            party_a_signed_at: null,
            party_b_id: deal.broker_id || prop?.owner_id,
            party_b_signed_at: null,
            status: "pending",
            rating_incremented: false,
          };
          state.handshakes[args.p_deal_id] = hs;
        }
        if (args.p_user_id === hs.party_a_id && !hs.party_a_signed_at) {
          hs.party_a_signed_at = new Date().toISOString();
        } else if (args.p_user_id === hs.party_b_id && !hs.party_b_signed_at) {
          hs.party_b_signed_at = new Date().toISOString();
        }
        if (hs.party_a_signed_at && hs.party_b_signed_at) {
          hs.status = "completed";
          hs.rating_incremented = true;
          return { data: [{ success: true, rating_updated: true, handshake_status: "completed" }], error: null };
        }
        return { data: [{ success: true, rating_updated: false, handshake_status: "pending" }], error: null };
      }
      return { data: null, error: null };
    }),
    from: vi.fn((table) => {
      let filterCol = null;
      let filterVal = null;
      let secondFilterCol = null;
      let secondFilterVal = null;

      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn((col, val) => {
          if (!filterCol) {
            filterCol = col;
            filterVal = val;
          } else {
            secondFilterCol = col;
            secondFilterVal = val;
          }
          return builder;
        }),
        in: vi.fn(() => builder),
        order: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        insert: vi.fn(async (rows) => {
          const items = Array.isArray(rows) ? rows : [rows];
          if (table === "deal_routing_recipients") {
            state.routingRecipients.push(...items);
          }
          return { data: items, error: null };
        }),
        update: vi.fn((updates) => ({
          eq: vi.fn((c, v) => ({
            eq: vi.fn(async () => {
              if (table === "deal_handshakes") {
                const hs = state.handshakes[v] || Object.values(state.handshakes).find((h) => h.id === v);
                if (hs) Object.assign(hs, updates);
              }
              return { data: null, error: null };
            }),
            in: vi.fn(async () => ({ data: null, error: null })),
            then: (resolve) => {
              if (table === "deals") {
                const d = state.deals[v];
                if (d) Object.assign(d, updates);
              }
              if (table === "deal_handshakes") {
                const hs = state.handshakes[v] || Object.values(state.handshakes).find((h) => h.id === v);
                if (hs) Object.assign(hs, updates);
              }
              resolve({ data: null, error: null });
            },
          })),
        })),
        maybeSingle: vi.fn(async () => {
          if (table === "user_profiles") {
            return { data: state.profiles[filterVal] || null, error: null };
          }
          if (table === "properties") {
            const prop = state.properties[filterVal];
            return { data: prop || null, error: null };
          }
          if (table === "deals") {
            const deal = state.deals[filterVal];
            if (!deal) return { data: null, error: null };
            const prop = state.properties[deal.property_id];
            return {
              data: {
                ...deal,
                properties: prop ? { owner_id: prop.owner_id } : null,
              },
              error: null,
            };
          }
          if (table === "deal_handshakes") {
            const hs = state.handshakes[filterVal] || Object.values(state.handshakes).find((h) => h.deal_id === filterVal);
            return { data: hs || null, error: null };
          }
          if (table === "deal_routing_recipients") {
            const match = state.routingRecipients.find(
              (r) => r.deal_id === filterVal && r.recipient_id === secondFilterVal
            );
            return { data: match || null, error: null };
          }
          return { data: null, error: null };
        }),
        single: vi.fn(async () => {
          if (table === "properties") {
            return { data: state.properties[filterVal] || null, error: null };
          }
          if (table === "deals") {
            const deal = state.deals[filterVal];
            const prop = state.properties[deal?.property_id];
            return {
              data: deal ? { ...deal, properties: prop ? { owner_id: prop.owner_id } : null } : null,
              error: null,
            };
          }
          return { data: null, error: null };
        }),
      };
      return builder;
    }),
  };
}

vi.mock("@/lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return fakeSupabase();
  },
}));

// Import routes under test
const { POST: initiateDeal } = await import("@/app/api/deals/initiate/route");
const { PATCH: updateDeal } = await import("@/app/api/deals/[id]/route");
const { POST: handleHandshake } = await import("@/app/api/deals/handshake/route");

describe("Deals Security, Market Lifecycle & Handshake Contracts", () => {
  beforeEach(() => {
    state.currentUser = null;
    state.isAdult = true;
    state.profiles = {
      "starry-seeker": { id: "starry-seeker", role: "buyer", subscription_tier: "starry" },
      "universe-seeker": { id: "universe-seeker", role: "buyer", subscription_tier: "universe" },
      "owner-user": { id: "owner-user", role: "owner", active_roles: ["owner"], subscription_tier: "starry" },
      "broker-user": { id: "broker-user", role: "broker", subscription_tier: "starry" },
      "operator-user": { id: "operator-user", role: "operator", subscription_tier: "starry" },
      "unrelated-user": { id: "unrelated-user", role: "buyer", subscription_tier: "starry" },
    };
    state.properties = {
      "prop-live": {
        id: "prop-live",
        title: "Skyline Tower Penthouse",
        slug: "skyline-tower-penthouse",
        owner_id: "owner-user",
        pipeline_status: "approved",
        lifecycle_state: "live",
        quietly_open_to_offers: false,
      },
      "prop-offmarket-closed": {
        id: "prop-offmarket-closed",
        title: "Quiet Villa Closed",
        slug: "quiet-villa-closed",
        owner_id: "owner-user",
        pipeline_status: "off_market",
        lifecycle_state: "off_market",
        quietly_open_to_offers: false,
      },
      "prop-offmarket-open": {
        id: "prop-offmarket-open",
        title: "Quiet Villa Vault",
        slug: "quiet-villa-vault",
        owner_id: "owner-user",
        pipeline_status: "off_market",
        lifecycle_state: "off_market",
        quietly_open_to_offers: true,
      },
    };
    state.deals = {
      "deal-active-1": {
        id: "deal-active-1",
        property_id: "prop-live",
        buyer_id: "starry-seeker",
        broker_id: "broker-user",
        status: "pending",
      },
    };
    state.handshakes = {};
    state.routingRecipients = [];
  });

  describe("1. POST /api/deals/initiate — Security & Quota Gates", () => {
    it("rejects an owner initiating an inquiry on their own property (Self-Contact 409)", async () => {
      state.currentUser = "owner-user";
      const req = new Request("https://www.scoutit.space/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: "prop-live", role: "buyer", message: "Self contact test" }),
      });

      const res = await initiateDeal(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain("cannot initiate an inquiry on your own property");
    });

    it("rejects contact on off-market property when quiet offers are closed (403 view-only)", async () => {
      state.currentUser = "universe-seeker";
      const req = new Request("https://www.scoutit.space/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: "prop-offmarket-closed", role: "buyer" }),
      });

      const res = await initiateDeal(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("view-only; the owner has not opened quiet offers");
    });

    it("blocks a starry tier seeker from contacting an off-market property (Universe Gate 403)", async () => {
      state.currentUser = "starry-seeker";
      const req = new Request("https://www.scoutit.space/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: "prop-offmarket-open", role: "buyer" }),
      });

      const res = await initiateDeal(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("requires Universe tier membership");
    });

    it("permits a Universe tier seeker to contact an off-market property with quiet offers (200)", async () => {
      state.currentUser = "universe-seeker";
      const req = new Request("https://www.scoutit.space/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: "prop-offmarket-open", role: "buyer", message: "Private offer" }),
      });

      const res = await initiateDeal(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("permits non-universe seeker referring from Layer 2 Stratosphere promotional post (200)", async () => {
      state.currentUser = "starry-seeker";
      const req = new Request("https://www.scoutit.space/api/deals/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: "prop-offmarket-open",
          role: "buyer",
          source_type: "stratosphere_signal",
          source_id: "sig-alpha",
          message: "Saw your Layer 2 brief",
        }),
      });

      const res = await initiateDeal(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("2. PATCH /api/deals/[id] — IDOR & Unilateral Acceptance Protection", () => {
    it("blocks the buyer (sender) from accepting their own inquiry (IDOR 403)", async () => {
      state.currentUser = "starry-seeker"; // The buyer on deal-active-1
      const req = new Request("https://www.scoutit.space/api/deals/deal-active-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer test" },
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await updateDeal(req, { params: Promise.resolve({ id: "deal-active-1" }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Only the recipient may answer this inquiry. The sender may only withdraw.");
    });

    it("blocks the buyer from declining an inquiry (sender can only withdraw 403)", async () => {
      state.currentUser = "starry-seeker";
      const req = new Request("https://www.scoutit.space/api/deals/deal-active-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer test" },
        body: JSON.stringify({ status: "declined" }),
      });

      const res = await updateDeal(req, { params: Promise.resolve({ id: "deal-active-1" }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Only the recipient may answer this inquiry. The sender may only withdraw.");
    });

    it("allows the buyer to withdraw their own pending request (200)", async () => {
      state.currentUser = "starry-seeker";
      const req = new Request("https://www.scoutit.space/api/deals/deal-active-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer test" },
        body: JSON.stringify({ status: "withdrawn" }),
      });

      const res = await updateDeal(req, { params: Promise.resolve({ id: "deal-active-1" }) });
      expect(res.status).toBe(200);
      expect(state.deals["deal-active-1"].status).toBe("withdrawn");
    });

    it("allows the recipient (broker) to accept the inquiry (200)", async () => {
      state.currentUser = "broker-user";
      const req = new Request("https://www.scoutit.space/api/deals/deal-active-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer test" },
        body: JSON.stringify({ status: "accepted" }),
      });

      const res = await updateDeal(req, { params: Promise.resolve({ id: "deal-active-1" }) });
      expect(res.status).toBe(200);
      expect(state.deals["deal-active-1"].status).toBe("accepted");
    });
  });

  describe("3. POST /api/deals/handshake — Party Enforcement & Bilateral Completion", () => {
    it("refuses unauthenticated caller with 401", async () => {
      state.currentUser = null;
      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-active-1", action: "sign" }),
      });

      const res = await handleHandshake(req);
      expect(res.status).toBe(401);
    });

    it("refuses age-ineligible (<18) user with 403", async () => {
      state.currentUser = "starry-seeker";
      state.isAdult = false;
      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-active-1", action: "sign" }),
      });

      const res = await handleHandshake(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("must confirm you are 18 or older");
    });

    it("refuses an unrelated user from signing or declining someone else's deal (403)", async () => {
      state.currentUser = "unrelated-user";
      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-active-1", action: "sign" }),
      });

      const res = await handleHandshake(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("not a party to this deal");
    });

    it("rejects non-existent deal with uniform 403 (anti-enumeration)", async () => {
      state.currentUser = "starry-seeker";
      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "non-existent-deal", action: "sign" }),
      });

      const res = await handleHandshake(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("not a party to this deal");
    });

    it("allows Party A (buyer) to record first signature, awaiting Party B (200 pending)", async () => {
      state.currentUser = "starry-seeker";
      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-active-1", action: "sign" }),
      });

      const res = await handleHandshake(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe("pending");
      expect(json.ratingUpdated).toBe(false);
      expect(json.message).toContain("Handshake signature recorded. Awaiting second party.");
    });

    it("allows Party B (broker) to complete the bilateral handshake (200 completed)", async () => {
      // First party A signs
      state.currentUser = "starry-seeker";
      await handleHandshake(
        new Request("https://www.scoutit.space/api/deals/handshake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: "deal-active-1", action: "sign" }),
        })
      );

      // Then party B signs
      state.currentUser = "broker-user";
      const reqB = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-active-1", action: "sign" }),
      });

      const resB = await handleHandshake(reqB);
      expect(resB.status).toBe(200);
      const jsonB = await resB.json();
      expect(jsonB.success).toBe(true);
      expect(jsonB.status).toBe("completed");
      expect(jsonB.ratingUpdated).toBe(true);
      expect(jsonB.message).toContain("Handshake completed! Scout Rating incremented.");
    });

    it("allows a routed recipient in deal_routing_recipients to decline the deal handshake (200)", async () => {
      state.deals["deal-routed"] = {
        id: "deal-routed",
        property_id: "prop-live",
        buyer_id: "starry-seeker",
        broker_id: null,
        status: "accepted",
      };
      state.routingRecipients.push({
        deal_id: "deal-routed",
        property_id: "prop-live",
        recipient_id: "operator-user",
        recipient_type: "operator",
      });

      state.currentUser = "operator-user";
      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-routed", action: "decline" }),
      });

      const res = await handleHandshake(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("declined");
    });

    it("rejects handshake on terminated/withdrawn deal (409 Conflict)", async () => {
      state.deals["deal-withdrawn"] = {
        id: "deal-withdrawn",
        property_id: "prop-live",
        buyer_id: "starry-seeker",
        broker_id: "broker-user",
        status: "withdrawn",
      };

      state.currentUser = "starry-seeker";
      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-withdrawn", action: "sign" }),
      });

      const res = await handleHandshake(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain("Cannot execute handshake on a withdrawn deal");
    });

    it("blocks self-dealing handshake where buyer equals seller (409 Conflict)", async () => {
      state.deals["deal-self"] = {
        id: "deal-self",
        property_id: "prop-live",
        buyer_id: "owner-user",
        broker_id: null,
        status: "pending",
      };

      state.currentUser = "owner-user";
      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-self", action: "sign" }),
      });

      const res = await handleHandshake(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain("Senders cannot conduct a bilateral handshake with themselves");
    });
  });
});
