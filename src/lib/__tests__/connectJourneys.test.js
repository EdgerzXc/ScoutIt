import { describe, it, expect, vi, beforeEach } from "vitest";

// A-144 — cross-role Connect journey proofs. One shared in-memory database
// stands in for Supabase; the REAL route handlers, REAL guards
// (connectBlocks/Gates/Source, enterpriseForms, workflow machine,
// delegationDisclosure) and REAL status rules run against it. Three actors —
// a buyer, an owner, a broker — walk every paid and free path end to end:
// spend → inbox → accept/decline/withdraw → chat, plus dedup, blocks,
// forged inputs and the Enterprise question.

const BUYER = "11111111-1111-1111-1111-111111111111";
const OWNER = "22222222-2222-2222-2222-222222222222";
const BROKER = "33333333-3333-3333-3333-333333333333";
const STRANGER = "44444444-4444-4444-4444-444444444444";
const OPERATOR = "55555555-5555-5555-5555-555555555555";

const state = vi.hoisted(() => ({
  currentUser: null,
  db: null,
  enterpriseTables: false,
  operatorRpcAvailable: true,
}));

function seedDb() {
  return {
    seq: 0,
    // Keys MUST equal the queried table names — the fake reads db[table].
    user_profiles: [
      { id: BUYER, display_name: "Betty Buyer", is_profile_public: false, active_roles: ["buyer"], accepting_connects: true, max_pending_connects: null, connects_balance: 5 },
      { id: OWNER, display_name: "Olive Owner", is_profile_public: false, active_roles: ["owner"], accepting_connects: true, max_pending_connects: null, connects_balance: 5 },
      { id: BROKER, display_name: "Bobby Broker", is_profile_public: true, active_roles: ["broker"], accepting_connects: true, max_pending_connects: null, connects_balance: 5 },
      { id: OPERATOR, display_name: "Opal Operator", is_profile_public: true, active_roles: ["operator"], accepting_connects: true, max_pending_connects: null, connects_balance: 5 },
    ],
    properties: [
      { id: "prop-1", slug: "tower-one", title: "Tower One", owner_id: OWNER, lifecycle_state: "live", pipeline_status: "approved", quietly_open_to_offers: false, price: 1000000 },
      { id: "prop-2", slug: "tower-two", title: "Tower Two", owner_id: OWNER, lifecycle_state: "live", pipeline_status: "approved", quietly_open_to_offers: false, price: 2000000 },
    ],
    wallets: { [BUYER]: 5, [OWNER]: 5, [BROKER]: 5 },
    ledger: [],
    deals: [],
    property_broker_representations: [],
    connect_blocks: [],
    open_gate_entitlements: [],
    open_gate_listings: [],
    open_gate_role_entitlements: [],
    open_gate_role_listings: [],
    deal_routing_recipients: [],
    deal_messages: [],
    property_units: [],
    seedForms: [{ id: "form-off", enterprise_id: "ent-1", enabled: false }],
  };
}

const nid = (db, p) => `${p}-${++db.seq}`;

function attachProps(db, row) {
  if (!row || row.properties !== undefined) return row;
  const prop = db.properties.find((p) => p.id === row.property_id) || null;
  return { ...row, properties: prop };
}

class Q {
  constructor(db, table) {
    this.db = db;
    this.table = table;
    this.filters = [];
    this.orderBy = null;
    this.limitN = null;
    this.fields = "*";
    this.insertRows = null;
    this.updateObj = null;
    this.isDelete = false;
  }
  select(f = "*") { this.fields = f; return this; }
  eq(k, v) { this.filters.push({ t: "eq", k, v }); return this; }
  neq(k, v) { this.filters.push({ t: "neq", k, v }); return this; }
  in(k, vs) { this.filters.push({ t: "in", k, vs }); return this; }
  gte(k, v) { this.filters.push({ t: "gte", k, v }); return this; }
  ilike(k, v) { this.filters.push({ t: "ilike", k, v }); return this; }
  contains(k, vs) { this.filters.push({ t: "contains", k, vs }); return this; }
  is() { return this; }
  not() { return this; }
  or(expr) { this.filters.push({ t: "or", expr }); return this; }
  order(col, opts) { this.orderBy = { col, asc: opts?.ascending !== false }; return this; }
  limit(n) { this.limitN = n; return this; }
  insert(rows) { this.insertRows = rows; return this; }
  update(obj) { this.updateObj = obj; return this; }
  delete() { this.isDelete = true; return this; }
  val(row, k) {
    if (k.includes(".")) {
      const [head, tail] = k.split(".");
      const joined = head === "properties" ? attachProps(this.db, row).properties : undefined;
      return joined?.[tail];
    }
    return row[k];
  }
  match(row, f) {
    if (f.t === "eq") return this.val(row, f.k) === f.v;
    if (f.t === "neq") return this.val(row, f.k) !== f.v;
    if (f.t === "in") return Array.isArray(f.vs) && f.vs.includes(this.val(row, f.k));
    if (f.t === "gte") return (this.val(row, f.k) ?? "") >= f.v;
    if (f.t === "ilike") return String(this.val(row, f.k) ?? "").toLowerCase() === String(f.v).toLowerCase();
    if (f.t === "contains") return Array.isArray(f.vs) && f.vs.every((x) => (this.val(row, f.k) || []).includes(x));
    if (f.t === "or") {
      return f.expr.split(",").some((clause) => {
        const m = clause.match(/(\w+)\.eq\.(.+)/);
        return m && String(row[m[1]] ?? "") === m[2];
      });
    }
    return true;
  }
  rows() {
    let rows = (this.db[this.table] || []).filter((r) => this.filters.every((f) => this.match(r, f)));
    if (this.orderBy) {
      rows = [...rows].sort((a, b) => {
        const av = a[this.orderBy.col] ?? "", bv = b[this.orderBy.col] ?? "";
        return this.orderBy.asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    if (this.limitN !== null) rows = rows.slice(0, this.limitN);
    if (typeof this.fields === "string" && this.fields.includes("properties(")) {
      rows = rows.map((r) => attachProps(this.db, r));
    }
    return rows;
  }
  run() {
    const db = this.db;
    if (this.insertRows) {
      if (!Array.isArray(this.insertRows)) this.insertRows = [this.insertRows];
      if (!Array.isArray(db[this.table])) db[this.table] = [];
      const made = this.insertRows.map((r) => {
        const row = { ...r };
        if (!row.id) row.id = nid(db, this.table === "deals" ? "deal" : this.table === "deal_messages" ? "msg" : "row");
        if (!row.created_at) row.created_at = new Date().toISOString();
        if (this.table === "deals") {
          row.connects_spent = row.connects_spent ?? null;
          row.sender_anonymous = row.sender_anonymous ?? false;
          row.closed_at = row.closed_at ?? null;
          row.archived_at = row.archived_at ?? null;
          row.pending_clock_reset_at = row.pending_clock_reset_at ?? null;
        }
        db[this.table].push(row);
        return this.fields.includes("properties(") ? attachProps(db, row) : row;
      });
      return { data: made, error: null };
    }
    if (this.updateObj) {
      for (const r of this.rows()) Object.assign(r, this.updateObj);
      return { data: null, error: null };
    }
    if (this.isDelete) {
      const victims = new Set(this.rows().map((r) => r.id));
      db[this.table] = (db[this.table] || []).filter((r) => !victims.has(r.id));
      return { data: null, error: null };
    }
    return { data: this.rows(), error: null };
  }
  async single() {
    const { data, error } = this.run();
    if (error) return { data: null, error };
    if (!data || data.length === 0) return { data: null, error: { message: "No rows" } };
    return { data: data[0], error: null };
  }
  async maybeSingle() {
    if (this.table === "enterprise_inquiry_forms" && !state.enterpriseTables) {
      return { data: null, error: { code: "42P01", message: 'relation "enterprise_inquiry_forms" does not exist' } };
    }
    if (this.table === "enterprise_inquiry_forms") {
      const want = this.filters.find((f) => f.t === "eq" && f.k === "id")?.v;
      const found = (this.db.seedForms || []).find((f) => f.id === want) || null;
      return { data: found, error: null };
    }
    const { data, error } = this.run();
    if (error) return { data: null, error };
    return { data: data[0] || null, error: null };
  }
  then(resolve) { resolve(this.run()); }
}

function fakeAdmin() {
  return {
    from: (table) => new Q(state.db, table),
    rpc: async (name, args) => {
      const db = state.db;
      if (name === "admit_open_gate_free_deal") {
        const current = db.deals.find(row => row.id === args.p_deal_id && row.buyer_id === args.p_buyer_id && row.status === "pending");
        if (!current) return { data: false, error: null };
        const cutoff = Date.now() - 3_600_000;
        const recent = db.deals.filter(row => row.id !== current.id && row.buyer_id === args.p_buyer_id
          && row.open_gate_inbound === true && Date.parse(row.created_at) >= cutoff);
        if (recent.length >= 10) return { data: false, error: null };
        current.open_gate_inbound = true;
        current.connects_spent = 0;
        return { data: true, error: null };
      }
      if (name === "create_routed_operator_deal") {
        if (!state.operatorRpcAvailable) return { data: null, error: { code: "PGRST202", message: "function does not exist" } };
        const unit = db.property_units.find(row => row.id === args.p_unit_id && row.property_id === args.p_property_id);
        const recipient = unit?.operator_id;
        const entitlement = db.open_gate_role_entitlements.find(row => row.account_id === recipient && row.role === "operator" && row.enabled);
        const listing = db.open_gate_role_listings.find(row => row.property_id === args.p_property_id && row.unit_id === args.p_unit_id && row.recipient_id === recipient && row.enabled);
        if (!recipient || (args.p_open_gate && (!entitlement || !listing))) return { data: null, error: { message: "OPEN_GATE_CLOSED" } };
        const deal = { id: nid(db, "deal"), property_id: args.p_property_id, buyer_id: args.p_buyer_id,
          broker_id: null, unit_id: args.p_unit_id, status: "pending", pitch_message: args.p_message,
          expires_at: args.p_expires_at, connects_spent: args.p_open_gate ? 0 : null, open_gate_inbound: args.p_open_gate, sender_anonymous: false,
          closed_at: null, archived_at: null, pending_clock_reset_at: null, created_at: new Date().toISOString() };
        db.deals.push(deal);
        db.deal_routing_recipients.push({ deal_id: deal.id, property_id: args.p_property_id, recipient_id: recipient, recipient_type: "operator" });
        return { data: [{ deal_id: deal.id, recipient_ids: [recipient], routed_to_roster: false }], error: null };
      }      if (name === "create_routed_buyer_deal") {
        const prop = db.properties.find((p) => p.id === args.p_property_id);
        if (!prop) return { data: null, error: { message: "Property not found" } };
        const deal = {
          id: nid(db, "deal"), property_id: prop.id, buyer_id: args.p_buyer_id,
          broker_id: null, unit_id: args.p_unit_id || null, status: "pending",
          pitch_message: args.p_message, expires_at: args.p_expires_at,
          connects_spent: null, sender_anonymous: false, closed_at: null,
          archived_at: null, pending_clock_reset_at: null,
          created_at: new Date().toISOString(),
        };
        db.deals.push(deal);
        const represented = db.property_broker_representations.find((r) =>
          r.property_id === prop.id && r.broker_id === args.p_preferred_broker_id && r.status === "active");
        if (args.p_preferred_broker_id && !represented) {
          db.deals.pop();
          return { data: null, error: { message: "BROKER_NOT_CONTACTABLE" } };
        }
        const recipient = represented ? represented.broker_id : prop.owner_id;
        db.deal_routing_recipients.push({ deal_id: deal.id, property_id: prop.id, recipient_id: recipient, recipient_type: represented ? "broker" : "owner" });
        return { data: [{ deal_id: deal.id, recipient_ids: [recipient], routed_to_roster: Boolean(represented) }], error: null };
      }
      if (name === "get_property_lead_recipients") {
        const prop = db.properties.find((p) => p.id === args.p_property_id);
        if (!prop) return { data: [], error: null };
        return { data: [{ recipient_id: prop.owner_id, recipient_type: "owner", representation_id: null, sort_rank: 1 }], error: null };
      }
      if (name === "spend_connects" || name === "spend_connects_atomic") {
        const bal = db.wallets[args.p_user_id] ?? 0;
        if (bal < args.p_amount) return { data: null, error: { message: "insufficient balance" } };
        db.wallets[args.p_user_id] = bal - args.p_amount;
        db.ledger.push({ user: args.p_user_id, amount: -args.p_amount, reason: args.p_reason, ref: args.p_ref_id });
        return { data: [{ total_balance: db.wallets[args.p_user_id], success: true }], error: null };
      }
      if (name === "refund_connects_system_error" || name === "refund_connects_system_error_canonical") {
        db.wallets[args.p_user_id] = (db.wallets[args.p_user_id] ?? 0) + args.p_amount;
        db.ledger.push({ user: args.p_user_id, amount: args.p_amount, reason: args.p_reason, ref: args.p_ref_id });
        return { data: null, error: null };
      }
      return { data: null, error: { message: `unknown rpc ${name}` } };
    },
  };
}

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: async () => state.currentUser,
  assertAdultEligibility: async () => true,
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.currentUser ? { id: state.currentUser } : null }, error: state.currentUser ? null : {} }) },
  }),
}));
vi.mock("@/lib/notifications", () => ({ notifyUser: vi.fn(async () => true) }));
vi.mock("@/lib/crmActivity", () => ({ logActivity: vi.fn(async () => true) }));
vi.mock("@/lib/sampleInventory", () => ({ validateSampleInquiryRecipients: () => ({ ok: true }) }));
vi.mock("@/lib/turnstile", () => ({ turnstileGuard: async () => null }));
vi.mock("@/lib/supabaseAdmin", () => ({ get supabaseAdmin() { return fakeAdmin(); } }));

const { POST: initiate } = await import("@/app/api/deals/initiate/route");
const { POST: pitch } = await import("@/app/api/deals/pitch/route");
const { POST: invite } = await import("@/app/api/dashboard/invite/route");
const { GET: inbox, POST: manual } = await import("@/app/api/deals/route");
const { PATCH: answer } = await import("@/app/api/deals/[id]/route");
const { POST: chat } = await import("@/app/api/deals/[id]/messages/route");
const { POST: inquire } = await import("@/app/api/inquiries/route");

const as = (user, body, url = "https://www.scoutit.space/api/x") => {
  state.currentUser = user;
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: "Bearer tok" },
    body: JSON.stringify(body),
  });
};
const patchAs = (user, dealId, status) => {
  state.currentUser = user;
  return [
    new Request(`https://www.scoutit.space/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", Authorization: "Bearer tok" },
      body: JSON.stringify({ status }),
    }),
    { params: Promise.resolve({ id: dealId }) },
  ];
};
const inboxAs = (user) => {
  state.currentUser = user;
  return new Request("https://www.scoutit.space/api/deals", {
    headers: { Authorization: "Bearer tok" },
  });
};
const walletOf = (u) => state.db.wallets[u];

beforeEach(() => {
  state.db = seedDb();
  state.enterpriseTables = false;
  state.operatorRpcAvailable = true;
  state.currentUser = null;
});

describe("Connect journeys — buyer, owner, broker", () => {
  it("J1 buyer spends 1 Connect, owner sees it waiting, accepts, chat opens", async () => {
    const r1 = await initiate(as(BUYER, { propertySlug: "tower-one", message: "Hi, keen to view this week." }));
    expect(r1.status).toBe(200);
    const b1 = await r1.json();
    expect(b1.connects_spent).toBe(1);
    expect(walletOf(BUYER)).toBe(4);

    // Double-tap spends nothing and returns the same request.
    const r1b = await initiate(as(BUYER, { propertySlug: "tower-one", message: "Hi, keen to view this week." }));
    const b1b = await r1b.json();
    expect(b1b.deduped).toBe(true);
    expect(b1b.connects_spent).toBe(0);
    expect(b1b.dealId).toBe(b1.dealId);
    expect(walletOf(BUYER)).toBe(4);

    // Owner inbox: waiting, anonymous-by-default, role shown.
    const inboxRes = await inbox(inboxAs(OWNER));
    const { deals } = await inboxRes.json();
    const row = deals.find((d) => d.id === b1.dealId);
    expect(row.status).toBe("pending");
    expect(row.myRole).toBe("owner");

    // Chat before acceptance is refused.
    const early = await chat(
      as(OWNER, { body: "Hello?", role: "owner" }, `https://www.scoutit.space/api/deals/${b1.dealId}/messages`),
      { params: Promise.resolve({ id: b1.dealId }) },
    );
    expect(early.status).toBe(403);

    // Owner accepts → chat opens both ways, free.
    const [acceptReq, acceptCtx] = patchAs(OWNER, b1.dealId, "accepted");
    expect((await answer(acceptReq, acceptCtx)).status).toBe(200);
    const m1 = await chat(
      as(OWNER, { body: "Sure, Saturday?", role: "owner" }, `https://www.scoutit.space/api/deals/${b1.dealId}/messages`),
      { params: Promise.resolve({ id: b1.dealId }) },
    );
    expect(m1.status).toBe(200);
    const m2 = await chat(
      as(BUYER, { body: "Perfect.", role: "buyer" }, `https://www.scoutit.space/api/deals/${b1.dealId}/messages`),
      { params: Promise.resolve({ id: b1.dealId }) },
    );
    expect(m2.status).toBe(200);
    // Acceptance never spends.
    expect(walletOf(OWNER)).toBe(5);
    expect(walletOf(BUYER)).toBe(4);
  });

  it("J2 broker pitch: double-tap dedupes, owner declines, broker cannot self-accept", async () => {
    const p1 = await pitch(as(BROKER, { listingId: "prop-1", message: "I can move this unit." }));
    expect(p1.status).toBe(200);
    const { dealId } = await p1.json();
    expect(walletOf(BROKER)).toBe(4);

    const p1b = await pitch(as(BROKER, { listingId: "prop-1", message: "I can move this unit." }));
    const dup = await p1b.json();
    expect(dup.deduped).toBe(true);
    expect(dup.dealId).toBe(dealId);
    expect(walletOf(BROKER)).toBe(4);

    // Representation is pending, not active.
    const rep = state.db.property_broker_representations.find((r) => r.property_id === "prop-1" && r.broker_id === BROKER);
    expect(rep.status).toBe("pending");

    // Broker answering their own pitch is refused (U-032).
    const [selfReq, selfCtx] = patchAs(BROKER, dealId, "accepted");
    expect((await answer(selfReq, selfCtx)).status).toBe(403);

    // Owner declines from the inbox → representation declined with it.
    const [decReq, decCtx] = patchAs(OWNER, dealId, "declined");
    expect((await answer(decReq, decCtx)).status).toBe(200);
    expect(state.db.property_broker_representations.find((r) => r.id === rep.id).status).toBe("declined");
  });

  it("J3 owner invite: broker answers from the inbox, representation activates", async () => {
    const inv = await invite(as(OWNER, { listingId: "prop-1", brokerName: "Bobby Broker" }));
    expect(inv.status).toBe(200);
    const { dealId } = await inv.json();
    expect(walletOf(OWNER)).toBe(4);
    expect(state.db.deals.find((d) => d.id === dealId).status).toBe("invited");

    // Broker inbox shows the invite as waiting.
    const { deals } = await (await inbox(inboxAs(BROKER))).json();
    expect(deals.find((d) => d.id === dealId).status).toBe("invited");

    // Broker accepts from the inbox → representation activates.
    const [accReq, accCtx] = patchAs(BROKER, dealId, "accepted");
    expect((await answer(accReq, accCtx)).status).toBe(200);
    expect(
      state.db.property_broker_representations.find((r) => r.property_id === "prop-1" && r.broker_id === BROKER).status,
    ).toBe("active");

    // Owner answering their own invite is refused.
    const inv2 = await invite(as(OWNER, { listingId: "prop-2", brokerName: "Bobby Broker" }));
    const { dealId: deal2 } = await inv2.json();
    const [ownReq, ownCtx] = patchAs(OWNER, deal2, "accepted");
    expect((await answer(ownReq, ownCtx)).status).toBe(403);
  });

  it("J4 manual deals cannot forge outcomes; failures never strand a debit", async () => {
    const forged = await manual(as(OWNER, { propertyId: "prop-1", otherPartyEmail: BROKER, status: "accepted" }));
    expect(forged.status).toBe(400);
    expect(walletOf(OWNER)).toBe(5);

    const ghost = await manual(as(OWNER, { propertyId: "prop-1", otherPartyEmail: STRANGER, status: "pending" }));
    expect(ghost.status).toBe(404);
    expect(walletOf(OWNER)).toBe(5);

    const ok = await manual(as(OWNER, { propertyId: "prop-1", otherPartyEmail: BROKER, status: "pending" }));
    expect(ok.status).toBe(200);
    expect(walletOf(OWNER)).toBe(4);
    const { deal } = await ok.json();
    expect(deal.status).toBe("pending");
  });

  it("J5 blocked senders fail with 0 spent and no phantom request", async () => {
    state.db.connect_blocks.push({ blocker_id: OWNER, blocked_id: BUYER });
    const before = state.db.deals.length;
    const r = await initiate(as(BUYER, { propertySlug: "tower-two", message: "Hi, second tower." }));
    expect(r.status).toBe(403);
    expect(walletOf(BUYER)).toBe(5);
    expect(state.db.deals.length).toBe(before);
  });

  it("J6 withdraw belongs to the sender; strangers cannot answer", async () => {
    const r = await initiate(as(BUYER, { propertySlug: "tower-one", message: "Withdrawing soon." }));
    const { dealId } = await r.json();

    const [strReq, strCtx] = patchAs(STRANGER, dealId, "declined");
    expect((await answer(strReq, strCtx)).status).toBe(403);

    const [recReq, recCtx] = patchAs(OWNER, dealId, "withdrawn");
    expect((await answer(recReq, recCtx)).status).toBe(403);

    const [wdReq, wdCtx] = patchAs(BUYER, dealId, "withdrawn");
    expect((await answer(wdReq, wdCtx)).status).toBe(200);
  });

  it("J7 Open Gate: staff entitlement and broker listing switch waive only inbound cost", async () => {
    state.db.property_broker_representations.push({
      id: "rep-open", property_id: "prop-1", broker_id: BROKER, status: "active",
    });
    state.db.open_gate_entitlements.push({
      broker_id: BROKER, enabled: true, expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
    state.db.open_gate_listings.push({ property_id: "prop-1", broker_id: BROKER, enabled: true });
    const free = await initiate(as(BUYER, {
      propertySlug: "tower-one", preferredBrokerId: BROKER, role: "buyer",
      message: "May I view this space?", anonymous: false,
    }));
    expect(free.status).toBe(200);
    const receipt = await free.json();
    expect(receipt.connects_spent).toBe(0);
    expect(receipt.open_gate).toBe(true);
    expect(walletOf(BUYER)).toBe(5);
    const stored = state.db.deals.find(row => row.id === receipt.dealId);
    expect(stored.open_gate_inbound).toBe(true);
    expect(stored.sender_anonymous).toBe(true); // buyer's private profile wins
    const { deals } = await (await inbox(inboxAs(BROKER))).json();
    expect(deals.find(row => row.id === receipt.dealId)?.status).toBe("pending");
    expect(deals.find(row => row.id === receipt.dealId)?.otherPartyRole).toBe("Buyer");
    expect(deals.find(row => row.id === receipt.dealId)?.open_gate_inbound).toBe(true);
    const buyerInbox = await (await inbox(inboxAs(BUYER))).json();
    expect(buyerInbox.deals.find(row => row.id === receipt.dealId)?.otherPartyRole).toBe("Broker");
    const [acceptOpen, acceptContext] = patchAs(BROKER, receipt.dealId, "accepted");
    expect((await answer(acceptOpen, acceptContext)).status).toBe(200);
    expect(state.db.deals.find(row => row.id === receipt.dealId)?.status).toBe("accepted");
    expect(walletOf(BUYER)).toBe(5);

    // Closing the per-listing switch removes the exemption for the next
    // request. It cannot make this broker's outbound pitch free.
    state.db.open_gate_listings[0].enabled = false;
    state.db.deals = [];
    state.db.deal_routing_recipients = [];
    const paid = await initiate(as(BUYER, {
      propertySlug: "tower-one", preferredBrokerId: BROKER, role: "buyer",
      message: "Second request.",
    }));
    expect((await paid.json()).connects_spent).toBe(1);
    expect(walletOf(BUYER)).toBe(4);
    const outbound = await pitch(as(BROKER, { listingId: "prop-2", message: "I can represent this." }));
    expect(outbound.status).toBe(200);
    expect(walletOf(BROKER)).toBe(4);
  });
  it("J7a Enterprise owner opens direct inbound contact on an unrepresented listing", async () => {
    state.db.open_gate_role_entitlements.push({ account_id: OWNER, role: "owner", enabled: true,
      expires_at: new Date(Date.now() + 86_400_000).toISOString() });
    state.db.open_gate_role_listings.push({ property_id: "prop-1", unit_id: null, recipient_id: OWNER, role: "owner", enabled: true });
    const free = await initiate(as(BUYER, { propertySlug: "tower-one", message: "Owner request", expectOpenGate: true }));
    expect(free.status).toBe(200);
    const receipt = await free.json();
    expect(receipt.connects_spent).toBe(0);
    expect(walletOf(BUYER)).toBe(5);
    expect(state.db.deals.find(row => row.id === receipt.dealId)?.open_gate_inbound).toBe(true);
    const ownerInbox = await (await inbox(inboxAs(OWNER))).json();
    expect(ownerInbox.deals.find(row => row.id === receipt.dealId)?.otherPartyRole).toBe("Buyer");
    const [buyerAccept, buyerContext] = patchAs(BUYER, receipt.dealId, "accepted");
    expect((await answer(buyerAccept, buyerContext)).status).toBe(403);
    const [ownerAccept, ownerContext] = patchAs(OWNER, receipt.dealId, "accepted");
    expect((await answer(ownerAccept, ownerContext)).status).toBe(200);
    state.db.open_gate_role_listings[0].enabled = false;
    state.db.deals = [];
    const closed = await initiate(as(BUYER, { propertySlug: "tower-one", message: "Quoted free", expectOpenGate: true }));
    expect(closed.status).toBe(409);
    expect(walletOf(BUYER)).toBe(5);
  });

  it("J7a2 refuses the eleventh free request without spending a Connect", async () => {
    state.db.open_gate_role_entitlements.push({ account_id: OWNER, role: "owner", enabled: true,
      expires_at: new Date(Date.now() + 86_400_000).toISOString() });
    state.db.open_gate_role_listings.push({ property_id: "prop-1", unit_id: null, recipient_id: OWNER, role: "owner", enabled: true });
    for (let n = 0; n < 10; n += 1) {
      state.db.deals.push({ id: `prior-free-${n}`, property_id: "prop-2", buyer_id: BUYER,
        status: "accepted", open_gate_inbound: true, created_at: new Date().toISOString() });
    }
    const response = await initiate(as(BUYER, { propertySlug: "tower-one", message: "Eleventh", expectOpenGate: true }));
    expect(response.status).toBe(429);
    expect(walletOf(BUYER)).toBe(5);
    expect(state.db.deals.filter(row => row.property_id === "prop-1")).toHaveLength(0);
  });
  it("J7b Enterprise operator receives a directed free request for a delegated unit", async () => {
    state.db.property_units.push({ id: "unit-1", property_id: "prop-1", operator_id: OPERATOR });
    state.db.open_gate_role_entitlements.push({ account_id: OPERATOR, role: "operator", enabled: true,
      expires_at: new Date(Date.now() + 86_400_000).toISOString() });
    state.db.open_gate_role_listings.push({ property_id: "prop-1", unit_id: "unit-1", recipient_id: OPERATOR, role: "operator", enabled: true });
    const free = await initiate(as(BUYER, { propertySlug: "tower-one", unitId: "unit-1", message: "Unit request", expectOpenGate: true }));
    expect(free.status).toBe(200);
    const receipt = await free.json();
    expect(receipt.connects_spent).toBe(0);
    expect(walletOf(BUYER)).toBe(5);
    expect(state.db.deal_routing_recipients.find(row => row.deal_id === receipt.dealId)?.recipient_id).toBe(OPERATOR);
    const operatorInbox = await (await inbox(inboxAs(OPERATOR))).json();
    expect(operatorInbox.deals.find(row => row.id === receipt.dealId)?.myRole).toBe("operator");
    const buyerInbox = await (await inbox(inboxAs(BUYER))).json();
    expect(buyerInbox.deals.find(row => row.id === receipt.dealId)?.otherPartyRole).toBe("Operator");
    const [ownerAccept, ownerContext] = patchAs(OWNER, receipt.dealId, "accepted");
    expect((await answer(ownerAccept, ownerContext)).status).toBe(403);
    const [buyerAccept, buyerContext] = patchAs(BUYER, receipt.dealId, "accepted");
    expect((await answer(buyerAccept, buyerContext)).status).toBe(403);
    const [accept, context] = patchAs(OPERATOR, receipt.dealId, "accepted");
    expect((await answer(accept, context)).status).toBe(200);
  });
  it("J7c closed operator gate routes a paid unit request to the delegate", async () => {
    state.db.property_units.push({ id: "unit-1", property_id: "prop-1", operator_id: OPERATOR });
    const response = await initiate(as(BUYER, { propertySlug: "tower-one", unitId: "unit-1", message: "Paid unit request" }));
    expect(response.status).toBe(200);
    const receipt = await response.json();
    expect(receipt.connects_spent).toBe(1);
    expect(walletOf(BUYER)).toBe(4);
    expect(state.db.deal_routing_recipients.find(row => row.deal_id === receipt.dealId)?.recipient_id).toBe(OPERATOR);
    const operatorInbox = await (await inbox(inboxAs(OPERATOR))).json();
    expect(operatorInbox.deals.find(row => row.id === receipt.dealId)?.myRole).toBe("operator");
  });
  it("J7d preserves the existing paid unit path until the operator RPC is installed", async () => {
    state.db.property_units.push({ id: "unit-1", property_id: "prop-1", operator_id: OPERATOR });
    state.operatorRpcAvailable = false;
    const response = await initiate(as(BUYER, { propertySlug: "tower-one", unitId: "unit-1", message: "Pre-migration unit request" }));
    expect(response.status).toBe(200);
    expect((await response.json()).connects_spent).toBe(1);
    expect(walletOf(BUYER)).toBe(4);
  });
  it("J8 Default contact remains paid; forged Enterprise forms fail", async () => {
    // Without a staff entitlement and listing switch, ordinary contact spends.
    const r = await initiate(as(BUYER, { propertySlug: "tower-one", message: "Enterprise check." }));
    expect((await r.json()).connects_spent).toBe(1);

    // Logged-out public inquiry is free but creates no deal.
    const pub = await inquire(
      as(null, { propertySlug: "tower-one", email: "guest@example.com", message: "Hello?", turnstileToken: "t" },
        "https://www.scoutit.space/api/inquiries"),
    );
    expect(pub.status).toBe(200);
    expect((await pub.json()).free_inquiry).toBe(false);

    // Forged enterprise id with tables missing defers gracefully (pre-migration).
    const forged = await inquire(
      as(null, { propertySlug: "tower-one", email: "guest@example.com", message: "Hello?", turnstileToken: "t", enterprise_form_id: "forged-id" },
        "https://www.scoutit.space/api/inquiries"),
    );
    expect(forged.status).toBe(200);

    // With tables live, a disabled form delivers nothing.
    state.enterpriseTables = true;
    const dead = await inquire(
      as(null, { propertySlug: "tower-one", email: "guest@example.com", message: "Hello?", turnstileToken: "t", enterprise_form_id: "form-off" },
        "https://www.scoutit.space/api/inquiries"),
    );
    expect(dead.status).toBe(403);
  });
});
