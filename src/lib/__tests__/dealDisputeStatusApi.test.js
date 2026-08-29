import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/deals/[id]/dispute/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));

// ─────────────────────────────────────────────────────────────────────────
// A-045 requires "confirmation that it was filed, and a way to see its state".
// A POST response alone cannot do that: it is gone on the next page load, and
// the state a person most needs to check is the one they come back for days
// later.
//
// The disclosure rule here is the part worth testing rather than assuming.
// A hold affects BOTH parties' conversation, so both are entitled to know the
// thread is under review and preserved — otherwise the counterparty sees a
// closed conversation quietly refusing to disappear and is told nothing.
// But the GROUND and the DETAIL are the reporter's account of the other
// person, and handing those to the person they are about is how a complaint
// turns into a retaliation risk.
//
// So: existence and status to any party; reason, details and authorship to the
// reporter only.
// ─────────────────────────────────────────────────────────────────────────

const DEAL_ROW = {
  id: "deal-1",
  status: "closed",
  closed_at: "2026-08-25T01:11:00.000Z",
  buyer_id: "buyer-1",
  broker_id: "broker-1",
  properties: { owner_id: "owner-1" },
};

const DISPUTE_ROW = {
  id: "dispute-1",
  status: "open_hold",
  reason: "abuse_or_threat",
  details: "They threatened to report my visa status.",
  reporter_id: "buyer-1",
  hold_placed_at: "2026-08-26T01:00:00.000Z",
  resolved_at: null,
  created_at: "2026-08-26T01:00:00.000Z",
};

function installDatabase({ deal = DEAL_ROW, dispute = DISPUTE_ROW, routed = null } = {}) {
  supabaseAdmin.from = vi.fn((table) => {
    const results = {
      deals: { data: deal, error: deal ? null : { message: "not found" } },
      deal_disputes: { data: dispute ? [dispute] : [], error: null },
      deal_routing_recipients: { data: routed, error: null },
      audit_logs: { data: null, error: null },
    };
    const result = results[table] ?? { data: null, error: null };
    const builder = {
      select: () => builder,
      eq: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => Promise.resolve(result),
      single: () => Promise.resolve(result),
      maybeSingle: () =>
        Promise.resolve(
          Array.isArray(result.data)
            ? { data: result.data[0] ?? null, error: result.error }
            : result,
        ),
      insert: () => Promise.resolve({ error: null }),
      then: (f) => Promise.resolve(result).then(f),
    };
    return builder;
  });
}

const call = (dealId = "deal-1") =>
  GET(new Request(`https://www.scoutit.space/api/deals/${dealId}/dispute`), {
    params: Promise.resolve({ id: dealId }),
  });

describe("GET /api/deals/[id]/dispute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses an unauthenticated caller", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue(null);
    installDatabase();
    expect((await call()).status).toBe(401);
  });

  it("refuses someone who is not a party to the deal", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("stranger-9");
    installDatabase();
    const res = await call();
    expect(res.status).toBe(403);
    expect(await res.text()).not.toContain("visa status");
  });

  it("tells the reporter the full state of their own dispute", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase();
    const body = await (await call()).json();
    expect(body.dispute.status).toBe("open_hold");
    expect(body.dispute.reason).toBe("abuse_or_threat");
    expect(body.dispute.details).toBe("They threatened to report my visa status.");
    expect(body.dispute.isMine).toBe(true);
    expect(body.dispute.holdPlacedAt).toBe("2026-08-26T01:00:00.000Z");
  });

  it("tells the other party the thread is held, and nothing about the accusation", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("broker-1");
    const res = await call();
    const raw = await res.clone().text();
    const body = await res.json();

    expect(body.dispute.onHold).toBe(true);
    expect(body.dispute.isMine).toBe(false);
    // The ground and the free text are the reporter's account of this person.
    expect(body.dispute.reason).toBeUndefined();
    expect(body.dispute.details).toBeUndefined();
    expect(body.dispute.reporterId).toBeUndefined();
    // Belt and braces: nothing leaks anywhere else in the payload either.
    expect(raw).not.toContain("visa status");
    expect(raw).not.toContain("abuse_or_threat");
    expect(raw).not.toContain("buyer-1");
  });

  it("reports no dispute rather than failing when none exists", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase({ dispute: null });
    const res = await call();
    expect(res.status).toBe(200);
    expect((await res.json()).dispute).toBeNull();
  });

  it("does not cache a private answer", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase();
    const res = await call();
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("answers 404 for a deal that does not exist", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("buyer-1");
    installDatabase({ deal: null });
    expect((await call("nope")).status).toBe(404);
  });
});
