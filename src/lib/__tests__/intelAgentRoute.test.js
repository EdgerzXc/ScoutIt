import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const request = (method = "GET", authorization, body) =>
  new Request("https://www.scoutit.space/api/cron/intel-agent", {
    method,
    headers: {
      ...(authorization ? { authorization } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

describe("Autonomous Intel Agent Cron Route (/api/cron/intel-agent) (A-195)", () => {
  let route;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    route = await import("@/app/api/cron/intel-agent/route");
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("fails closed when CRON_SECRET is unconfigured", async () => {
    delete process.env.CRON_SECRET;
    const res = await route.GET(request("GET"));
    expect(res.status).toBe(503);
  });

  it("rejects unauthorized calls with invalid secret", async () => {
    const res = await route.GET(request("GET", "Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns agent health and available blueprints on GET with valid auth", async () => {
    const res = await route.GET(request("GET", "Bearer test-cron-secret"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.blueprintCount).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(data.availableBlueprints)).toBe(true);
  });

  it("synthesizes valid article briefing on POST with valid blueprintId", async () => {
    const res = await route.POST(
      request("POST", "Bearer test-cron-secret", {
        blueprintId: "the-estate-makati",
        dryRun: true,
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.dryRun).toBe(true);
    expect(data.article.title).toContain("The Estate Makati");
    expect(data.article.blocks.length).toBeGreaterThan(5);
  });

  it("rejects unknown blueprintId with 400", async () => {
    const res = await route.POST(
      request("POST", "Bearer test-cron-secret", {
        blueprintId: "nonexistent-building-xyz",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid blueprintId");
  });
});
