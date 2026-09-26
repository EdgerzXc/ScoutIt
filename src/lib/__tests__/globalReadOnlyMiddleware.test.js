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

    const { middleware } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/properties", { method: "GET" });
    const res = await middleware(req);
    expect(res.status).toBe(200); // NextResponse.next() defaults to 200 pass-through
  });

  it("blocks POST requests with 503 when global_read_only is enabled", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "global_read_only", is_enabled: true }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { middleware } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/dashboard/update", { method: "POST" });
    const res = await middleware(req);
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

    const { middleware } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/deals/delete", { method: "DELETE" });
    const res = await middleware(req);
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

    const { middleware } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/deals", { method: "POST" });
    const res = await middleware(req);
    expect(res.status).toBe(200); // NextResponse.next() pass-through
  });

  it("fails safe and allows mutations when feature flag lookup throws an error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Supabase network timeout"));

    const { middleware } = await import("@/proxy");
    const req = new NextRequest("https://scoutit.space/api/deals", { method: "POST" });
    const res = await middleware(req);
    expect(res.status).toBe(200); // Pass-through on failure
  });
});
