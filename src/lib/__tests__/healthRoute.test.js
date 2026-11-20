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
    expect(vi.mocked(fetch).mock.calls.map(([url, options]) => ({
      origin: new URL(url).origin,
      path: new URL(url).pathname,
      method: options.method,
      key: new Headers(options.headers).get("apikey"),
      redirect: options.redirect,
    }))).toEqual([
      { origin: SUPABASE_URL, path: "/rest/v1/properties", method: "HEAD", key: "anon-fixture", redirect: "error" },
      { origin: SUPABASE_URL, path: "/rest/v1/contact_messages", method: "HEAD", key: "server-fixture", redirect: "error" },
    ]);
  });

  it("reports an unconfigured service credential before making a probe", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
    const response = await requestHealth();
    expect(response.status).toBe(503);
    expect((await response.json()).services.supabase).toBe("unconfigured");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails readiness when the privileged database read is denied", async () => {
    vi.mocked(fetch).mockImplementation(async (url) => new Response(null, {
      status: new URL(url).pathname === "/rest/v1/contact_messages" ? 403 : 200,
      headers: { "x-fixture-secret": "secret-provider-detail" },
    }));
    const response = await requestHealth();
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.services.supabase).toBe("unhealthy");
    expect(JSON.stringify(json)).not.toMatch(/server-fixture|anon-fixture|secret-provider-detail|contact_messages/);
  });

  it.each([configured.SUPABASE_SERVICE_ROLE_KEY, "sb_secret_fixture"])("rejects a privileged public key (%s) before probing", async (key) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", key);
    const response = await requestHealth();
    expect(response.status).toBe(503);
    expect((await response.json()).services.supabase).toBe("unhealthy");
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
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
