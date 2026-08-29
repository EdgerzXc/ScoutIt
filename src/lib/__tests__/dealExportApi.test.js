import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/deals/[id]/export/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CONTACT_MASK } from "@/lib/contactLeakFilter";

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));

// ─────────────────────────────────────────────────────────────────────────
// A-043, behaviour rather than source text. Two properties are load-bearing:
//
//   1. a non-party gets nothing, and
//   2. contact details stay masked unless the DATABASE says the two-sided
//      handshake completed.
//
// (2) is the one that can fail silently: on screen the reveal is decided from
// React state, and a route that trusted the same input would hand a caller
// their counterparty's phone number before the handshake, in a file.
// ─────────────────────────────────────────────────────────────────────────

const DEAL_ROW = {
  id: "deal-1",
  status: "closed",
  created_at: "2026-08-01T06:03:00.000Z",
  closed_at: "2026-08-20T01:11:00.000Z",
  buyer_id: "buyer-1",
  broker_id: "broker-1",
  properties: { title: "Bonifacio Tower · Unit 12A", owner_id: "owner-1" },
};

const MESSAGE_ROWS = [
  {
    sender_id: "broker-1",
    sender_role: "broker",
    body: "Reach me on 0917 123 4567 any time.",
    created_at: "2026-08-01T07:10:00.000Z",
  },
];

// A deliberately small stand-in for the Supabase query builder: every chain
// method returns itself, and the terminal call resolves whatever this table
// was configured to return. A mock that answered every table identically
// could not catch a route reading the wrong one.
function installDatabase({ deal = DEAL_ROW, handshake = null, messages = MESSAGE_ROWS, routed = null } = {}) {
  const inserted = [];
  const tablesTouched = [];

  supabaseAdmin.from = vi.fn((table) => {
    tablesTouched.push(table);
    const results = {
      deals: { data: deal, error: deal ? null : { message: "not found" } },
      deal_handshakes: { data: handshake, error: null },
      deal_messages: { data: messages, error: null },
      user_profiles: {
        data: [
          { id: "buyer-1", display_name: "Maria Santos" },
          { id: "broker-1", display_name: "Juan Reyes" },
        ],
        error: null,
      },
      deal_routing_recipients: { data: routed, error: null },
      audit_logs: { data: null, error: null },
    };
    const result = results[table] ?? { data: null, error: null };

    const builder = {
      select: () => builder,
      eq: () => builder,
      in: () => builder,
      order: () => Promise.resolve(result),
      single: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
      insert: (row) => {
        inserted.push({ table, row });
        return Promise.resolve({ error: null });
      },
      then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
    };
    return builder;
  });

  return { inserted, tablesTouched };
}

const call = (dealId = "deal-1") =>
  GET(new Request(`https://www.scoutit.space/api/deals/${dealId}/export`), {
    params: Promise.resolve({ id: dealId }),
  });

describe("GET /api/deals/[id]/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses an unauthenticated caller", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue(null);
    installDatabase();
    const res = await call();
    expect(res.status).toBe(401);
  });

  it("refuses someone who is not a party to the deal", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("stranger-9");
    installDatabase();
    const res = await call();
    expect(res.status).toBe(403);
    expect(await res.text()).not.toContain("0917");
  });

  it("gives a party their conversation as a downloadable text file", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase();
    const res = await call();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    expect(res.headers.get("content-disposition")).toMatch(/\.txt"?$/);
    const body = await res.text();
    expect(body).toContain("Bonifacio Tower");
    expect(body).toContain("Maria Santos");
  });

  it("keeps contact details masked when no handshake row exists", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase({ handshake: null });
    const body = await (await call()).text();
    expect(body).not.toContain("0917 123 4567");
    expect(body).toContain(CONTACT_MASK);
  });

  it("keeps contact details masked when only one side has signed", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase({
      handshake: {
        status: "pending",
        party_a_signed_at: "2026-08-05T00:00:00.000Z",
        party_b_signed_at: null,
      },
    });
    const body = await (await call()).text();
    expect(body).not.toContain("0917 123 4567");
    expect(body).toContain(CONTACT_MASK);
  });

  it("reveals contact details once both sides have signed", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase({
      handshake: {
        status: "completed",
        party_a_signed_at: "2026-08-05T00:00:00.000Z",
        party_b_signed_at: "2026-08-06T00:00:00.000Z",
      },
    });
    const body = await (await call()).text();
    expect(body).toContain("0917 123 4567");
    expect(body).not.toContain(CONTACT_MASK);
  });

  it("cannot be talked into revealing by a query string", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase({ handshake: null });
    const res = await GET(
      new Request(
        "https://www.scoutit.space/api/deals/deal-1/export?contactRevealed=true&revealed=1&handshakeState=linked",
      ),
      { params: Promise.resolve({ id: "deal-1" }) },
    );
    const body = await res.text();
    expect(body).not.toContain("0917 123 4567");
    expect(body).toContain(CONTACT_MASK);
  });

  it("records who exported which thread and when", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    const { inserted } = installDatabase();
    await call();
    const audit = inserted.find((i) => i.table === "audit_logs");
    expect(audit).toBeDefined();
    expect(audit.row.action).toBe("deal_conversation_exported");
    expect(audit.row.record_id).toBe("deal-1");
    expect(audit.row.user_id).toBe("buyer-1");
  });

  it("answers 404 for a deal that does not exist, without saying why", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase({ deal: null });
    const res = await call("no-such-deal");
    expect(res.status).toBe(404);
  });

  it("stops a caller who asks over and over", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("rate-test-user");
    installDatabase();
    const statuses = [];
    for (let i = 0; i < 12; i += 1) {
      statuses.push((await call()).status);
    }
    expect(statuses).toContain(429);
  });
});
