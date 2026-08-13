import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  is: vi.fn(() => query),
  lt: vi.fn(() => query),
  gte: vi.fn(() => query),
  limit: vi.fn(async () => ({ data: [], error: null })),
};

const from = vi.fn(() => query);
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from } }));
vi.mock("@/lib/airtable", () => ({ fetchPropertyVerificationDates: vi.fn(async () => []) }));
vi.mock("@/lib/notifications", () => ({ notifyUser: vi.fn(async () => true) }));
vi.mock("@/lib/crmActivity", () => ({ logActivity: vi.fn(async () => true) }));

const staleRoute = await import("@/app/api/cron/check-stale-listings/route");
const sweepRoute = await import("@/app/api/cron/sweep-pending-requests/route");

const request = (authorization) =>
  new Request("https://www.scoutit.space/api/cron/test", {
    headers: authorization ? { authorization } : {},
  });

describe("configured Vercel cron routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.limit.mockResolvedValue({ data: [], error: null });
    process.env.CRON_SECRET = "scheduled-secret";
    process.env.AIRTABLE_API_KEY = "airtable-key";
    process.env.AIRTABLE_BASE_ID = "airtable-base";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it.each([
    ["stale-listing", staleRoute.GET],
    ["pending-request", sweepRoute.GET],
  ])("fails closed when %s CRON_SECRET is absent", async (_name, GET) => {
    delete process.env.CRON_SECRET;
    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(from).not.toHaveBeenCalled();
  });

  it.each([
    ["stale-listing", staleRoute.GET],
    ["pending-request", sweepRoute.GET],
  ])("rejects a wrong %s bearer token", async (_name, GET) => {
    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it.each([
    ["stale-listing", staleRoute.GET],
    ["pending-request", sweepRoute.GET],
  ])("runs the scheduled %s job with the correct bearer token", async (_name, GET) => {
    const response = await GET(request("Bearer scheduled-secret"));

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalled();
  });

  it("keeps both protected routes registered in vercel.json", () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));
    const paths = config.crons.map((cron) => cron.path);

    expect(paths).toContain("/api/cron/check-stale-listings");
    expect(paths).toContain("/api/cron/sweep-pending-requests");
  });
});
