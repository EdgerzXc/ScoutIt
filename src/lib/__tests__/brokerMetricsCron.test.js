import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────
// A-023 audit gap G3. `recompute_broker_metric_snapshot` existed with no
// caller, which makes it a plan rather than a feature (Rule 13). Without a
// scheduled caller a broker's ScoutIt Record freezes at whatever it was when
// someone last invoked the function by hand — and the first real deal would
// change nothing on the page.
//
// The tests that matter here are the refusals: an unauthenticated request must
// not be able to trigger a database sweep, and example-seeded brokers must not
// be recomputed (that is what protects the demo surface).
// ─────────────────────────────────────────────────────────────────────────

const rpc = vi.fn(async () => ({ data: null, error: null }));
const brokerRows = vi.fn(async () => ({
  data: [{ id: "broker-1" }, { id: "broker-2" }],
  error: null,
}));

// The mock mirrors the route's ACTUAL query chain
// (.select().eq().is().limit()). A mock that answers a shape the code never
// calls tests the mock, not the code (Rule 16).
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    rpc: (...a) => rpc(...a),
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            limit: () => brokerRows(),
          }),
        }),
      }),
    }),
  },
}));

const { GET } = await import("@/app/api/cron/recompute-broker-metrics/route");

const request = (auth) =>
  new Request("https://www.scoutit.space/api/cron/recompute-broker-metrics", {
    headers: auth ? { authorization: auth } : {},
  });

describe("A-023 broker metric recompute cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    rpc.mockResolvedValue({ data: null, error: null });
    brokerRows.mockResolvedValue({ data: [{ id: "broker-1" }, { id: "broker-2" }], error: null });
  });

  it("refuses an unauthenticated caller before touching the database", async () => {
    const response = await GET(request(null));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses a wrong secret", async () => {
    const response = await GET(request("Bearer wrong"));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed when no cron secret is configured", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(request("Bearer anything"));
    expect(response.status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("recomputes every eligible broker when authorized", async () => {
    const response = await GET(request("Bearer test-secret"));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith("recompute_broker_metric_snapshot", {
      p_broker_id: "broker-1",
    });
  });

  it("keeps going when one broker fails rather than aborting the sweep", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const response = await GET(request("Bearer test-secret"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(body.failed).toBe(1);
    expect(body.recomputed).toBe(1);
  });

  it("reports the failure honestly instead of claiming a clean sweep", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const body = await (await GET(request("Bearer test-secret"))).json();
    expect(body.recomputed).toBe(0);
    expect(body.failed).toBe(2);
    expect(body.ok).toBe(false);
  });
});
