import { beforeEach, expect, it, vi } from "vitest";
import { PURGED_BODY, PURGE_ELIGIBLE_STATUSES, DISPUTE_HOLD_STATUSES } from "@/lib/chatRetention";
import { GET } from "@/app/api/cron/purge-chat-messages/route";

const db = vi.hoisted(() => ({ auth: null, rpc: vi.fn(), event: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { rpc: db.rpc } }));
vi.mock("@/lib/cronAuth", () => ({ authorizeCronRequest: () => db.auth }));
vi.mock("@/lib/systemEvents", () => ({ recordSystemEvent: db.event }));

const request = new Request("https://www.scoutit.space/api/cron/purge-chat-messages");
const batch = (purged, eligibleDeals, batchCapped) => ({ data: { purged, eligibleDeals, batchCapped } });

beforeEach(() => {
  db.auth = null;
  db.rpc.mockReset();
  db.event.mockReset();
});

it("passes the retention policy and advances across full batches", async () => {
  db.rpc.mockResolvedValueOnce(batch(600, 500, true)).mockResolvedValueOnce(batch(17, 12, false));
  const res = await GET(request);
  expect(await res.json()).toEqual({ purged: 617, eligibleDeals: 512, retentionDays: 7, batchCapped: false });
  expect(db.rpc).toHaveBeenCalledTimes(2);
  const args = db.rpc.mock.calls[0][1];
  expect(db.rpc).toHaveBeenCalledWith("purge_retained_chat_batch", {
    p_terminal_statuses: PURGE_ELIGIBLE_STATUSES,
    p_hold_statuses: DISPUTE_HOLD_STATUSES,
    p_cutoff: expect.any(String),
    p_grace_cutoff: expect.any(String),
    p_purged_body: PURGED_BODY,
  });
  expect(Date.parse(args.p_grace_cutoff) - Date.parse(args.p_cutoff)).toBe(6 * 86_400_000);
  expect(db.event).toHaveBeenCalledWith(expect.objectContaining({ subjectId: "purge-chat-messages", severity: "info" }));
});

it("bounds work and reports a remaining backlog when all batches are full", async () => {
  db.rpc.mockResolvedValue(batch(500, 500, true));
  expect(await (await GET(request)).json()).toMatchObject({ purged: 2000, batchCapped: true });
  expect(db.rpc).toHaveBeenCalledTimes(4);
});

it("reports a failed batch and retains the count from committed batches", async () => {
  db.rpc.mockResolvedValueOnce(batch(500, 500, true)).mockResolvedValueOnce({ error: { code: "08006" } });
  const response = await GET(request);
  expect(response.status).toBe(500);
  expect(await response.json()).toMatchObject({ purged: 500, error: "Chat retention cleanup could not finish." });
  expect(db.event).toHaveBeenCalledWith(expect.objectContaining({ severity: "error" }));
});

it("makes no database call for unauthorized requests", async () => {
  db.auth = Response.json({ error: "Unauthorized" }, { status: 401 });
  expect((await GET(request)).status).toBe(401);
  expect(db.rpc).not.toHaveBeenCalled();
  expect(db.event).not.toHaveBeenCalled();
});

it("keeps retention fail-closed while the migration is missing", async () => {
  db.rpc.mockResolvedValueOnce({ error: { code: "PGRST202" } });
  const response = await GET(request);
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toMatchObject({ purged: 0, eligibleDeals: 0 });
  expect(db.event).not.toHaveBeenCalled();
});
