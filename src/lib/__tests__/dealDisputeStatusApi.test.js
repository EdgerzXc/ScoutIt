import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/deals/[id]/dispute/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { recordSystemEvent } from "@/lib/systemEvents";

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn(), rpc: vi.fn() } }));
vi.mock("@/lib/notifications", () => ({ notifyUser: vi.fn() }));
vi.mock("@/lib/systemEvents", () => ({ recordSystemEvent: vi.fn() }));

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

describe("POST /api/deals/[id]/dispute", () => {
  function submit(actor) {
    serverAuth.resolveUserId.mockResolvedValue(actor);
    return POST(new Request("https://www.scoutit.space/api/deals/deal-1/dispute", {
      method: "POST",
      body: JSON.stringify({ reason: "other", reporter_id: "caller-supplied-id", status: "resolved" }),
      headers: { "Content-Type": "application/json" },
    }), { params: { id: "deal-1" } });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseAdmin.rpc.mockReset();
    installDatabase();
  });

  it("keeps filing closed when the transaction is missing or the caller is unrelated", async () => {
    expect((await submit("stranger-9")).status).toBe(403);
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled();
    supabaseAdmin.rpc.mockResolvedValueOnce({ error: { code: "PGRST202" } });
    expect((await submit("buyer-1")).status).toBe(503);
    expect(notifyUser).not.toHaveBeenCalled();
  });

  it("returns the same receipt on repeat and emits notifications only for a new hold", async () => {
    supabaseAdmin.rpc.mockResolvedValueOnce({
      data: { id: "dispute-1", heldAt: "2026-08-26T01:00:00Z", historyPurged: true, alreadyHeld: false },
    }).mockResolvedValueOnce({ data: { id: "dispute-1", historyPurged: true, alreadyHeld: true } });
    const first = await submit("buyer-1");
    const repeated = await submit("buyer-1");
    expect(first.headers.get("cache-control")).toContain("no-store");
    expect(await first.json()).toMatchObject({ disputeId: "dispute-1", historyPurged: true,
      message: expect.stringContaining("removed by retention") });
    expect(await repeated.json()).toMatchObject({ disputeId: "dispute-1", historyPurged: true, alreadyHeld: true });
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith("file_deal_dispute_hold",
      expect.objectContaining({ p_reporter_id: "buyer-1", p_status: "open_hold" }));
    expect(notifyUser).toHaveBeenCalledTimes(2);
    expect(recordSystemEvent).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ event: "deal.dispute.opened", subjectId: "dispute-1" }),
    );
  });
});
