import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

import { GET, invalidateBadgesCache } from "@/app/api/badges/route";
import { POST as claimPost } from "@/app/api/badges/claim/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";

describe("Badges API Caching & Rate Limiting Optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateBadgesCache();
  });

  it("serves repeated GET requests from memory without hitting database (X-Cache: HIT)", async () => {
    supabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ badge_id: "PIONEER_BROKER" }],
        error: null,
      }),
    });

    const firstRes = await GET();
    expect(firstRes.status).toBe(200);
    expect(firstRes.headers.get("X-Cache")).toBe("MISS");
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(2); // user_badges + badge_definitions

    // Second GET should hit the in-memory cache
    const secondRes = await GET();
    expect(secondRes.status).toBe(200);
    expect(secondRes.headers.get("X-Cache")).toBe("HIT");
    // Ensure database was NOT queried a second time
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(2);

    const body = await secondRes.json();
    expect(body.definitions).toBeDefined();
    expect(Array.isArray(body.definitions)).toBe(true);
  });

  it("invalidates cache when invalidateBadgesCache() is invoked", async () => {
    supabaseAdmin.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ badge_id: "PIONEER_BROKER" }],
        error: null,
      }),
    });

    await GET();
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(2);

    // Invalidate
    invalidateBadgesCache();

    // Next GET must be a MISS and re-query
    const thirdRes = await GET();
    expect(thirdRes.headers.get("X-Cache")).toBe("MISS");
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(4);
  });

  it("enforces rate limit on claim endpoint after burst requests", async () => {
    resolveUserId.mockResolvedValue("user-test-spammer");

    supabaseAdmin.from.mockImplementation((table) => {
      if (table === "user_profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "broker", active_roles: ["broker"] },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { badge_id: "PIONEER_BROKER", seat_number: 1 },
              error: null,
            }),
          }),
        }),
      };
    });

    const makeRequest = (ip = "192.168.1.100") =>
      new Request("http://localhost:3000/api/badges/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({ badgeId: "PIONEER_BROKER" }),
      });

    // Fire 10 claims (the limit)
    for (let i = 0; i < 10; i++) {
      await claimPost(makeRequest("10.0.0.99"));
    }

    // 11th request from same IP/user must be rejected with 429
    const rateLimitedRes = await claimPost(makeRequest("10.0.0.99"));
    expect(rateLimitedRes.status).toBe(429);
    const body = await rateLimitedRes.json();
    expect(body.error).toContain("Too many claim attempts");
  });
});
