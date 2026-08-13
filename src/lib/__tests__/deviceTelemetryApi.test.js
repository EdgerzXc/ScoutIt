import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };
const insert = vi.fn(async () => ({ error: null }));
const rpc = vi.fn(async () => ({ error: null }));
const maybeSingle = vi.fn(async () => ({ data: null, error: null }));
const limit = vi.fn(() => ({ maybeSingle }));
const order = vi.fn(() => ({ limit }));
const eq = vi.fn(() => ({ eq: vi.fn(() => ({ order })) }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ insert, select }));

vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from, rpc } }));

const { POST, classifyTelemetryPath } = await import("@/app/api/telemetry/device/route");

const request = (body, headers = {}) =>
  new Request("https://www.scoutit.space/api/telemetry/device", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.9, 10.0.0.1",
      "user-agent": "ScoutIt-Test",
      ...headers,
    },
    body: JSON.stringify(body),
  });

const pageview = (overrides = {}) => ({
  eventType: "pageview",
  deviceType: "desktop",
  path: "/property/public-listing-slug",
  ...overrides,
});

describe("/api/telemetry/device", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.IP_SALT = "test-only-private-salt";
    insert.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ error: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("derives a pseudonymous identity server-side and classifies dynamic paths", async () => {
    const response = await POST(request(pageview()));
    expect(response.status).toBe(200);
    expect(classifyTelemetryPath("/wishlist/shared/secret-token")).toBe("/wishlist/:state");
    expect(rpc).toHaveBeenCalledWith("record_security_pageview", expect.objectContaining({
      p_masked_ip: expect.stringMatching(/^telemetry_anon_[a-f0-9]{24}$/),
      p_route_accessed: "/property/:item",
    }));
    expect(insert).not.toHaveBeenCalled();
  });

  it("uses the bounded compatibility path until the owner-gated RPC is deployed", async () => {
    rpc.mockResolvedValue({ error: { code: "PGRST202", message: "function is absent from schema cache" } });

    const response = await POST(request(pageview()));

    expect(response.status).toBe(200);
    expect(order).toHaveBeenCalledWith("last_request_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(1);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      route_accessed: "/property/:item",
    }));
  });
  it.each([
    ["oversized path", pageview({ path: `/${"a".repeat(241)}` })],
    ["unknown event", pageview({ eventType: "arbitrary" })],
    ["unknown field", pageview({ deviceId: "caller-controlled" })],
    ["sensitive search text", { ...pageview(), eventType: "search", searchCategory: "all", matchCount: 0, searchQuery: "private medical concern" }],
    ["unknown friction label", { ...pageview(), eventType: "friction", frictionType: "free form text" }],
  ])("rejects %s without a service-role write", async (_label, body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not write when the server identity salt is absent", async () => {
    delete process.env.IP_SALT;
    const response = await POST(request(pageview()));
    expect(response.status).toBe(503);
    expect(insert).not.toHaveBeenCalled();
  });

  // §1.0B: friction and search are now counters upserted through
  // record_security_event, not raw inserts — that is what bounds table growth.
  // The insert path remains only as the pre-migration fallback, so these two
  // tests drive it by declaring the RPC absent.
  it("retries without optional geo fields when the live table predates them", async () => {
    rpc.mockResolvedValue({ error: { code: "PGRST202", message: "function is absent from schema cache" } });
    insert
      .mockResolvedValueOnce({ error: new Error("Could not find the 'city' column in the schema cache") })
      .mockResolvedValueOnce({ error: null });

    const response = await POST(request({
      eventType: "friction",
      deviceType: "mobile",
      path: "/property/slug",
      frictionType: "abandoned_inquiry_modal",
    }, { "x-vercel-ip-city": "Makati" }));

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[1][0]).not.toHaveProperty("city");
  });

  it("never exposes database error details", async () => {
    rpc.mockResolvedValue({ error: { code: "PGRST202", message: "function is absent from schema cache" } });
    insert.mockResolvedValue({ error: new Error("relation security_access_logs contains secret internals") });
    const response = await POST(request({
      eventType: "friction",
      deviceType: "mobile",
      path: "/property/slug",
      frictionType: "abandoned_inquiry_modal",
    }));
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.error).toBe("Telemetry unavailable");
    expect(JSON.stringify(json)).not.toContain("security_access_logs");
  });

  it("keeps telemetry under the centralized API rate limiter", () => {
    const proxy = readFileSync(resolve(process.cwd(), "src/proxy.js"), "utf8");
    expect(proxy).toContain("matcher: '/api/:path*'");
    expect(proxy).toContain("Ratelimit.slidingWindow(30, '10 s')");
  });

  // ── §1.0B: storage exhaustion ──
  it("upserts friction events as counters instead of inserting a row each time", async () => {
    const response = await POST(request({
      eventType: "friction",
      deviceType: "mobile",
      path: "/property/slug",
      frictionType: "abandoned_inquiry_modal",
    }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("record_security_event", expect.objectContaining({
      p_route_accessed: "FRICTION:abandoned_inquiry_modal:/property/:item",
      p_is_flagged: true,
    }));
    expect(insert).not.toHaveBeenCalled();
  });

  it("upserts search events as counters instead of inserting a row each time", async () => {
    const response = await POST(request({
      eventType: "search",
      deviceType: "desktop",
      path: "/discover",
      searchCategory: "commercial",
      matchCount: 0,
    }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("record_security_event", expect.objectContaining({
      p_route_accessed: "SEARCH:commercial:zero:/discover",
      p_is_flagged: true,
    }));
    expect(insert).not.toHaveBeenCalled();
  });

  it("meters a flooding client and stops writing once the window is exhausted", async () => {
    // A distinct IP so this test does not consume another test's quota.
    const floodHeaders = { "x-forwarded-for": "198.51.100.77" };
    let sawTooMany = false;

    for (let i = 0; i < 400; i += 1) {
      const res = await POST(request(pageview(), floodHeaders));
      if (res.status === 429) {
        sawTooMany = true;
        expect(res.headers.get("Retry-After")).toMatch(/^\d+$/);
        break;
      }
    }

    expect(sawTooMany).toBe(true);

    // The denial happens before any database work — the whole point.
    const callsAtDenial = rpc.mock.calls.length;
    const denied = await POST(request(pageview(), floodHeaders));
    expect(denied.status).toBe(429);
    expect(rpc.mock.calls.length).toBe(callsAtDenial);
  });

  it("bounds telemetry rows with a total identity/route invariant", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260812000001_critical_logic_and_security_fixes.sql"),
      "utf8",
    );
    // The old index deliberately EXCLUDED FRICTION/SEARCH rows; that exclusion
    // was the unbounded-growth path.
    expect(migration).toContain("DROP INDEX IF EXISTS public.uq_security_pageview_identity_route");
    expect(migration).toContain("uq_security_event_identity_route");
    expect(migration).toContain("record_security_event");
  });

  // Replaces "defines a daily 30-day retention job" (removed 2026-08-13).
  //
  // That test read supabase/migrations/20260809000001_security_telemetry_retention.sql
  // and asserted it scheduled a daily hard-delete cron. Two things were wrong with
  // it: the file is deliberately untracked, so the test passed locally and failed
  // in CI on every clean checkout; and the design it guarded was retired. The owner
  // decided on 2026-08-13 that the visitor-traffic log is a METRICS ASSET and old
  // rows must be COMPRESSED INTO AGGREGATES, NOT DELETED (§1.0C).
  //
  // clean_old_security_logs() still exists in the live database and is a straight
  // DELETE ... WHERE last_request_at < now() - interval '30 days'. It is harmless
  // only because nothing calls it. Scheduling it would destroy exactly the history
  // the owner wants to keep, so this test now guards the decision instead of the
  // retired migration: no tracked migration may schedule that job.
  // The retired file itself is excluded by name: it is deliberately left
  // untracked on the author's machine and must never be committed, so it is
  // present locally and absent in CI. Excluding it is what keeps this test
  // honest in both places — the invariant being guarded is that no OTHER
  // migration reintroduces the job.
  const RETIRED_MIGRATION = "20260809000001_security_telemetry_retention.sql";

  it("never schedules the retired hard-delete telemetry job", () => {
    const migrationsDir = resolve(process.cwd(), "supabase/migrations");
    const offenders = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql") && name !== RETIRED_MIGRATION)
      .filter((name) => {
        const sql = readFileSync(resolve(migrationsDir, name), "utf8");
        return (
          sql.includes("scoutit-clean-security-telemetry") &&
          /cron\.schedule/.test(sql)
        );
      });

    expect(offenders).toEqual([]);
  });
});
