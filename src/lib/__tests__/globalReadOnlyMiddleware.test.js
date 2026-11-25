import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// A-161 Phase 2: Global Read-Only Edge Proxy Contract

describe("Global Read-Only Edge Proxy Enforcement", () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_service_key";
    const { resetFlagCache } = await import("@/proxy");
    if (resetFlagCache) resetFlagCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("permits GET requests even when global_read_only is true", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "global_read_only", is_enabled: true }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { proxy } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/properties", { method: "GET" });
    const res = await proxy(req);
    expect(res.status).toBe(200); // NextResponse.next() defaults to 200 pass-through
  });

  it("blocks POST requests with 503 when global_read_only is enabled", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "global_read_only", is_enabled: true }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { proxy } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/dashboard/update", { method: "POST" });
    const res = await proxy(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("GLOBAL_READ_ONLY");
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("blocks DELETE requests with 503 when global_read_only is enabled", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "global_read_only", is_enabled: true }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { proxy } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/deals/delete", { method: "DELETE" });
    const res = await proxy(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("GLOBAL_READ_ONLY");
  });

  it("allows mutating requests to proceed when global_read_only is disabled", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "global_read_only", is_enabled: false }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { proxy } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/deals", { method: "POST" });
    const res = await proxy(req);
    expect(res.status).toBe(200); // NextResponse.next() pass-through
  });

  it("blocks normal account writes while leaving authentication and recovery routes available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "global_read_only", is_enabled: true }])),
    );
    const { proxy } = await import("@/proxy");
    for (const [method, path, status] of [
      ["POST", "/api/dashboard/bulk-insert", 503],
      ["POST", "/api/wishlist/merge", 503],
      ["DELETE", "/api/wishlist/saved", 503],
      ["GET", "/api/dashboard/inventory", 200],
      ["POST", "/api/auth/complete-onboarding", 200],
      ["GET", "/api/oauth/google/callback", 200],
      ["POST", "/api/calendar/sync", 200],
      ["POST", "/api/admin/feature-flags", 200],
    ]) {
      const response = await proxy(new NextRequest(`https://scoutit.space${path}`, { method }));
      expect(response.status, path).toBe(status);
    }
  });

  it("fails safe and allows mutations when feature flag lookup throws an error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Supabase network timeout"));

    const { proxy } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/deals", { method: "POST" });
    const res = await proxy(req);
    expect(res.status).toBe(200); // Pass-through on failure
  });

  it("executes a full operator drill: toggle pause on -> verify write freeze & recovery exceptions -> toggle pause off -> verify writes resume", async () => {
    let readOnlyEnabled = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify([{ id: "global_read_only", is_enabled: readOnlyEnabled }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { proxy, resetFlagCache } = await import("@/proxy");

    // Phase 1: Operator enables global_read_only
    readOnlyEnabled = true;
    if (resetFlagCache) resetFlagCache();

    // Normal account mutations are paused with 503 + Retry-After
    for (const blockedPath of [
      "/api/deals",
      "/api/dashboard/publish",
      "/api/wishlist/saved",
      "/api/deals/deal-1/messages",
      "/api/deals/deal-1/attachments",
    ]) {
      const res = await proxy(new NextRequest(`https://scoutit.space${blockedPath}`, { method: "POST" }));
      expect(res.status, blockedPath).toBe(503);
      expect(await res.json()).toMatchObject({ code: "GLOBAL_READ_ONLY" });
    }

    // Normal reads, auth/onboarding, and operator flag recovery stay open (200)
    const getRes = await proxy(new NextRequest("https://scoutit.space/api/cms", { method: "GET" }));
    expect(getRes.status).toBe(200);
    const adminToggleRes = await proxy(new NextRequest("https://scoutit.space/api/admin/feature-flags", { method: "POST" }));
    expect(adminToggleRes.status).toBe(200);

    // Phase 2: Operator disables global_read_only and resets flag cache
    readOnlyEnabled = false;
    if (resetFlagCache) resetFlagCache();

    const resumedRes = await proxy(new NextRequest("https://scoutit.space/api/deals", { method: "POST" }));
    expect(resumedRes.status).toBe(200);
  });
});
