// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";
import { getAirtableBudgetStatus } from "@/lib/airtableBudget";

vi.mock("@/lib/airtableBudget", () => ({ getAirtableBudgetStatus: vi.fn() }));
vi.mock("@/lib/email", () => ({ isEmailConfigured: () => false }));

const SUPABASE_URL = "https://health-fixture.supabase.co";
const configured = {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-fixture",
  SUPABASE_SERVICE_ROLE_KEY: "server-fixture",
  AIRTABLE_BASE_ID: "airtable-base-fixture",
  AIRTABLE_API_KEY: "airtable-key-fixture",
  UPSTASH_REDIS_REST_URL: "https://redis-fixture.example.test",
  UPSTASH_REDIS_REST_TOKEN: "redis-token-fixture",
};
const budget = { tracked: true, remaining: 0, exhausted: true };

function requestHealth() {
  return GET(new Request("https://scoutit.space/api/health"));
}

describe("public release health", () => {
  beforeEach(() => {
    for (const [name, value] of Object.entries(configured)) vi.stubEnv(name, value);
    vi.mocked(getAirtableBudgetStatus).mockResolvedValue(budget);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not report ready when core provider settings are empty", async () => {
    for (const name of Object.keys(configured)) vi.stubEnv(name, undefined);
    vi.mocked(getAirtableBudgetStatus).mockResolvedValue({ tracked: false });

    const response = await requestHealth();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect((await response.json()).services).toEqual({
      api: "healthy", supabase: "unconfigured", airtable: "unconfigured", redis: "unconfigured", email: "unconfigured",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps exhausted quota and optional email informational", async () => {
    const response = await requestHealth();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toMatchObject({
      services: { api: "healthy", supabase: "healthy", airtable: "configured", redis: "healthy", email: "unconfigured" },
      airtableBudget: budget,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(new URL(url).origin).toBe(SUPABASE_URL);
    expect(options.method).toBe("HEAD");
    expect(new Headers(options.headers).get("apikey")).toBe("anon-fixture");
  });

  it("requires the server credential without sending it to Supabase", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
    const response = await requestHealth();
    expect(response.status).toBe(503);
    expect((await response.json()).services.supabase).toBe("unconfigured");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports a failed Redis read even when Redis credentials are present", async () => {
    vi.mocked(getAirtableBudgetStatus).mockResolvedValue({ tracked: false });
    const response = await requestHealth();
    expect(response.status).toBe(503);
    expect((await response.json()).services.redis).toBe("unhealthy");
  });

  it("bounds the Supabase check and leaves the other diagnostics available", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(
      AbortSignal.abort(new DOMException("Fixture timeout", "TimeoutError")),
    );
    vi.mocked(fetch).mockImplementation(async (_url, options) => {
      options.signal.throwIfAborted();
      throw new Error("The probe did not pass the deadline signal");
    });
    const response = await requestHealth();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      services: { api: "healthy", supabase: "unhealthy", airtable: "configured", redis: "healthy" },
      airtableBudget: budget,
    });
    expect(timeout).toHaveBeenCalledWith(2_500);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
