import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";
import {
  serializeViaCookie,
  parseViaCookie,
  getViaCookieSecret,
  VIA_ATTRIBUTION_WINDOW_MS,
} from "@/lib/viaRouting";
import {
  getFlags,
  resetFlagCache,
  middleware,
  FLAG_CACHE_TTL_MS,
  FLAG_MAX_STALE_MS,
} from "@/proxy";

describe("A-310: VIA HMAC Signing & Proxy Kill-Switch Bounded Recovery", () => {
  describe("Part 1: VIA Cookie HMAC Signing & Timing-Safe Verification", () => {
    const originalEnv = { ...process.env };
    const testSecret = "scoutit-test-signing-secret-32-chars-ok";

    beforeEach(() => {
      process.env.VIA_COOKIE_SECRET = testSecret;
    });

    afterEach(() => {
      process.env = { ...originalEnv };
      vi.restoreAllMocks();
    });

    it("serializes payload into HMAC-signed format (body.sig)", () => {
      const now = 1760000000000;
      const cookie = serializeViaCookie(
        {
          propertyId: "one-ecom-center",
          promoterId: "broker-juan",
          promoterSlug: "broker-juan",
          promoterType: "broker",
          visitorId: "vis-abc-123",
          firstSeenAt: now,
          expiresAt: now + VIA_ATTRIBUTION_WINDOW_MS,
        },
        testSecret
      );

      expect(typeof cookie).toBe("string");
      expect(cookie).toContain(".");
      const [body, sig] = cookie.split(".");
      expect(body).toBeTruthy();
      expect(sig).toHaveLength(64); // 32-byte sha256 in hex

      // Signature must match HMAC of body
      const expectedSig = crypto.createHmac("sha256", testSecret).update(body).digest("hex");
      expect(sig).toBe(expectedSig);
    });

    it("round-trips signed payload accurately through parseViaCookie", () => {
      const now = 1760000000000;
      const cookie = serializeViaCookie(
        {
          propertyId: "one-ecom-center",
          promoterId: "broker-juan",
          promoterSlug: "broker-juan",
          promoterType: "broker",
          visitorId: "vis-abc-123",
          firstSeenAt: now,
          expiresAt: now + VIA_ATTRIBUTION_WINDOW_MS,
        },
        testSecret
      );

      const parsed = parseViaCookie(cookie, testSecret);
      expect(parsed).toEqual({
        propertyId: "one-ecom-center",
        promoterId: "broker-juan",
        promoterSlug: "broker-juan",
        promoterType: "broker",
        visitorId: "vis-abc-123",
        firstSeenAt: now,
        expiresAt: now + VIA_ATTRIBUTION_WINDOW_MS,
      });
    });

    it("forgery rejection: rejects unsigned cookie (treats as absent)", () => {
      // Legacy unsigned format: URL-encoded JSON or bare JSON
      const legacyPayload = {
        pId: "one-ecom-center",
        prId: "forged-broker-id",
        exp: Date.now() + 100000,
      };
      const unsignedCookie = encodeURIComponent(JSON.stringify(legacyPayload));

      expect(parseViaCookie(unsignedCookie, testSecret)).toBeNull();
      expect(parseViaCookie(JSON.stringify(legacyPayload), testSecret)).toBeNull();
    });

    it("forgery rejection: rejects cookie signed with wrong secret", () => {
      const attackerSecret = "attacker-evil-signing-key";
      const forgedCookie = serializeViaCookie(
        {
          propertyId: "one-ecom-center",
          promoterId: "attacker-broker",
          visitorId: "vis-evil",
          expiresAt: Date.now() + 100000,
        },
        attackerSecret
      );

      // Server tries to parse with authentic testSecret -> fails
      expect(parseViaCookie(forgedCookie, testSecret)).toBeNull();
    });

    it("tamper rejection: rejects cookie when body is altered while keeping original signature", () => {
      const validCookie = serializeViaCookie(
        {
          propertyId: "one-ecom-center",
          promoterId: "broker-juan",
          visitorId: "vis-123",
          expiresAt: Date.now() + 100000,
        },
        testSecret
      );

      const [body, sig] = validCookie.split(".");
      // Attacker decodes body, modifies promoterId, re-encodes, and pairs with original signature
      const decodedJson = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
      decodedJson.prId = "attacker-promoter-id";
      const tamperedBody = Buffer.from(JSON.stringify(decodedJson), "utf8").toString("base64url");
      const tamperedCookie = `${tamperedBody}.${sig}`;

      expect(parseViaCookie(tamperedCookie, testSecret)).toBeNull();
    });

    it("tamper rejection: rejects cookie when signature is corrupted", () => {
      const validCookie = serializeViaCookie(
        {
          propertyId: "one-ecom-center",
          promoterId: "broker-juan",
          visitorId: "vis-123",
          expiresAt: Date.now() + 100000,
        },
        testSecret
      );

      const [body, sig] = validCookie.split(".");
      // Flip one character in the signature hex
      const corruptedSig = (sig[0] === "a" ? "b" : "a") + sig.slice(1);
      const corruptedCookie = `${body}.${corruptedSig}`;

      expect(parseViaCookie(corruptedCookie, testSecret)).toBeNull();
    });

    it("handles non-hex, malformed, empty, or truncated signature strings safely", () => {
      expect(parseViaCookie("validbody.not-hex-characters", testSecret)).toBeNull();
      expect(parseViaCookie("validbody.1234", testSecret)).toBeNull(); // truncated
      expect(parseViaCookie("validbody.", testSecret)).toBeNull();
      expect(parseViaCookie(".invalidsig", testSecret)).toBeNull();
      expect(parseViaCookie("", testSecret)).toBeNull();
      expect(parseViaCookie(null, testSecret)).toBeNull();
      expect(parseViaCookie(undefined, testSecret)).toBeNull();
    });

    it("fails closed in production when no secret is configured", () => {
      delete process.env.VIA_COOKIE_SECRET;
      delete process.env.WISHLIST_SHARE_SECRET;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      process.env.NODE_ENV = "production";

      expect(getViaCookieSecret()).toBeNull();
      expect(parseViaCookie("anybody.anysig")).toBeNull();
      expect(() =>
        serializeViaCookie({
          propertyId: "one-ecom-center",
          promoterId: "broker-juan",
          visitorId: "vis-123",
          expiresAt: Date.now() + 100000,
        })
      ).toThrow("VIA cookie signing secret is not configured in production");
    });
  });

  describe("Part 2: Proxy Kill-Switch Bounded Recovery", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      vi.resetModules();
      resetFlagCache();
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_service_key";
    });

    afterEach(() => {
      process.env = { ...originalEnv };
      vi.restoreAllMocks();
      vi.useRealTimers();
      resetFlagCache();
    });

    it("recovers stuck global_read_only kill switch when outage exceeds FLAG_MAX_STALE_MS", async () => {
      vi.useFakeTimers();
      const startTime = 1000000;
      vi.setSystemTime(startTime);

      // Step 1: Upstream flags set kill switch to TRUE
      let mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            { id: "global_read_only", is_enabled: true },
            { id: "pre_launch_free_mode", is_enabled: true },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
      vi.spyOn(globalThis, "fetch").mockImplementation(mockFetch);

      // Verify kill switch is active and blocks POST
      let flags = await getFlags();
      expect(flags.global_read_only).toBe(true);

      const req1 = new NextRequest("https://scoutit.space/api/deals", { method: "POST" });
      const res1 = await middleware(req1);
      expect(res1.status).toBe(503);
      const body1 = await res1.json();
      expect(body1.code).toBe("GLOBAL_READ_ONLY");

      // Step 2: Advance time past TTL (35s) but BEFORE max stale (60s)
      // Upstream goes down (outage starts)
      vi.setSystemTime(startTime + 35_000);
      mockFetch.mockRejectedValue(new Error("Supabase 500 Outage"));

      // During brief grace period (< 60s), stale flags are kept
      flags = await getFlags();
      expect(flags.global_read_only).toBe(true);

      const req2 = new NextRequest("https://scoutit.space/api/deals", { method: "POST" });
      const res2 = await middleware(req2);
      expect(res2.status).toBe(503); // Still blocked during grace period

      // Step 3: Advance time PAST max stale window (e.g. 65s after initial fetch)
      // Upstream is still down
      vi.setSystemTime(startTime + 65_000);

      // Bounded recovery MUST engage: kill switch clears to false/empty
      flags = await getFlags();
      expect(flags.global_read_only).toBeFalsy();

      // Mutating requests proceed!
      const req3 = new NextRequest("https://scoutit.space/api/deals", { method: "POST" });
      const res3 = await middleware(req3);
      expect(res3.status).toBe(200); // Successfully unblocked! Site keeps working

      // Step 4: Upstream recovers later
      vi.setSystemTime(startTime + 120_000);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify([
            { id: "global_read_only", is_enabled: false },
            { id: "pre_launch_free_mode", is_enabled: true },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      flags = await getFlags();
      expect(flags.global_read_only).toBe(false);
      expect(flags.pre_launch_free_mode).toBe(true);
    });

    it("treats HTTP 500 / 503 response as outage and recovers on schedule", async () => {
      vi.useFakeTimers();
      const startTime = 2000000;
      vi.setSystemTime(startTime);

      let mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([{ id: "global_read_only", is_enabled: true }]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
      vi.spyOn(globalThis, "fetch").mockImplementation(mockFetch);

      let flags = await getFlags();
      expect(flags.global_read_only).toBe(true);

      // Upstream returns 503 Service Unavailable
      mockFetch.mockResolvedValue(
        new Response("Database connection failed", { status: 503 })
      );

      // Advance past 60s
      vi.setSystemTime(startTime + 62_000);

      flags = await getFlags();
      expect(flags.global_read_only).toBeFalsy();
    });

    it("verifies FLAG_CACHE_TTL_MS is 30s and FLAG_MAX_STALE_MS is 60s", () => {
      expect(FLAG_CACHE_TTL_MS).toBe(30_000);
      expect(FLAG_MAX_STALE_MS).toBe(60_000);
      expect(FLAG_MAX_STALE_MS).toBeGreaterThan(FLAG_CACHE_TTL_MS);
    });
  });
});
