import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

const { limit } = vi.hoisted(() => ({ limit: vi.fn() }));
vi.mock("@upstash/redis", () => ({ Redis: { fromEnv: () => ({}) } }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() {}
    limit = limit;
  },
}));

function post(path, headers) {
  return new NextRequest(new URL(path, "https://www.scoutit.space"), { method: "POST", headers });
}

describe("browser API origin and limiter behavior", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test");
    limit.mockReset().mockResolvedValue({ success: true, limit: 5, reset: Date.now() + 5000, remaining: 4 });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("rejects a cross-origin browser write before metering", async () => {
    const headers = { origin: "https://mantle.scoutit.space" };
    expect((await proxy(post("/api/auth/complete-onboarding", headers))).status).toBe(403);
    expect((await proxy(post("/api/oauth/google/disconnect", headers))).status).toBe(403);
    expect(limit).not.toHaveBeenCalled();
  });

  it("allows same-origin browser writes, server requests and provider callbacks", async () => {
    expect((await proxy(post("/api/auth/complete-onboarding", { origin: "https://www.scoutit.space" }))).status).toBe(200);
    expect((await proxy(post("/api/auth/complete-onboarding"))).status).toBe(200);
    expect((await proxy(post("/api/webhooks/provider", { origin: "https://provider.example" }))).status).toBe(200);
  });

  it("returns 503 for sensitive limiter timeouts and keeps public reads available", async () => {
    limit.mockResolvedValue({ success: true, reason: "timeout" });
    expect((await proxy(post("/api/auth/complete-onboarding"))).status).toBe(503);
    expect((await proxy(new NextRequest("https://www.scoutit.space/api/cms"))).status).toBe(200);
  });
});
