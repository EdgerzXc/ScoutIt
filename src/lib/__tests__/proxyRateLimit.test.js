// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const upstream = vi.hoisted(() => ({ limit: vi.fn(), fromEnv: vi.fn() }));

vi.mock("@upstash/redis", () => ({ Redis: { fromEnv: upstream.fromEnv } }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() { return () => ({}); }
    constructor({ prefix }) {
      this.limit = (identifier) => upstream.limit(prefix, identifier);
    }
  },
}));

const timeout = { success: true, reason: "timeout", limit: 0, remaining: 0, reset: 0 };
const allowed = { success: true, limit: 5, remaining: 2, reset: 4_000 };

function request(path, method = "GET") {
  return new NextRequest("https://scoutit.space" + path, {
    method,
    headers: { "x-forwarded-for": "203.0.113.9" },
  });
}

describe("production proxy rate limiting", () => {
  let proxy;

  beforeEach(async () => {
    vi.resetModules();
    upstream.fromEnv.mockReset().mockReturnValue({});
    upstream.limit.mockReset().mockResolvedValue(allowed);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://limiter.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "redis-fixture");
    ({ proxy } = await import("@/proxy"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    ["/api/auth/complete-onboarding", "strict"],
    ["/api/ai/assimilate", "ai"],
    ["/api/properties/queue/upload", "standard"],
    ["/api/storage/upload-photo", "standard"],
  ])("blocks %s when Upstash returns success by timeout", async (path, tier) => {
    upstream.limit.mockResolvedValue(timeout);
    const response = await proxy(request(path, "POST"));
    expect(response.status).toBe(503);
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(response.headers.get("x-ratelimit-limit")).toBeNull();
    expect(upstream.limit).toHaveBeenCalledWith(`@upstash/ratelimit:${tier}`, `ratelimit_${tier}_203.0.113.9`);
  });

  it("keeps ordinary reads open during a timeout without reporting zero quota", async () => {
    upstream.limit.mockResolvedValue(timeout);
    const response = await proxy(request("/api/cms"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-ratelimit-limit")).toBeNull();
  });

  it("keeps the intended response for missing, invalid, and failing limiter connectivity", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);
    expect((await proxy(request("/api/auth/complete-onboarding", "POST"))).status).toBe(503);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "redis-fixture");
    vi.spyOn(console, "error").mockImplementation(() => {});
    upstream.fromEnv.mockImplementationOnce(() => { throw new Error("Redis configuration failure"); });
    expect((await proxy(request("/api/cms"))).headers.get("x-middleware-next")).toBe("1");
    upstream.limit.mockRejectedValueOnce(new Error("Redis request failed"));
    expect((await proxy(request("/api/auth/complete-onboarding", "POST"))).status).toBe(503);
  });

  it("preserves quota headers and returns 429 for an actual limit rejection", async () => {
    const accepted = await proxy(request("/api/auth/complete-onboarding", "POST"));
    expect(accepted.headers.get("x-middleware-next")).toBe("1");
    expect(accepted.headers.get("x-ratelimit-remaining")).toBe("2");
    upstream.limit.mockResolvedValue({ ...allowed, success: false, remaining: 0, reason: "cacheBlock" });
    const rejected = await proxy(request("/api/auth/complete-onboarding", "POST"));
    expect(rejected.status).toBe(429);
    expect(rejected.headers.get("x-ratelimit-reset")).toBe("4000");
  });

  it("bounds the feature flag read before evaluating the rate limit", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://flags.example.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-fixture");
    const exhausted = AbortSignal.abort(new DOMException("Fixture timeout", "TimeoutError"));
    const deadline = vi.spyOn(AbortSignal, "timeout").mockReturnValue(exhausted);
    const fetchFlags = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, options) => {
      options.signal.throwIfAborted();
    });
    const response = await proxy(request("/api/auth/complete-onboarding", "POST"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(deadline).toHaveBeenCalledWith(1_500);
    expect(fetchFlags).toHaveBeenCalledWith(expect.stringContaining("/rest/v1/feature_flags"), expect.objectContaining({ signal: exhausted }));
    expect(upstream.limit).toHaveBeenCalledTimes(1);
  });
});
