import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "node:crypto";
import { deriveAnalyticsViewerKey } from "@/app/api/analytics/route";

describe("A-322 — Analytics Identity Cryptographic HMAC Salting & Anonymization", () => {
  it("exports deriveAnalyticsViewerKey and produces a 24-character hex string", () => {
    const req = new Request("https://www.scoutit.space/api/analytics", {
      headers: {
        "x-forwarded-for": "203.177.12.45",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const key = deriveAnalyticsViewerKey(req, "secret_salt_123");
    expect(typeof key).toBe("string");
    expect(key).toHaveLength(24);
    expect(/^[0-9a-f]{24}$/.test(key)).toBe(true);
  });

  it("produces deterministic keys for the same visitor within the same month and salt", () => {
    const req1 = new Request("https://www.scoutit.space/api/analytics", {
      headers: {
        "x-forwarded-for": "112.198.64.10",
        "user-agent": "ScoutIt-Mobile/1.0",
      },
    });

    const req2 = new Request("https://www.scoutit.space/api/analytics", {
      headers: {
        "x-forwarded-for": "112.198.64.10",
        "user-agent": "ScoutIt-Mobile/1.0",
      },
    });

    const key1 = deriveAnalyticsViewerKey(req1, "my_salt");
    const key2 = deriveAnalyticsViewerKey(req2, "my_salt");
    expect(key1).toBe(key2);
  });

  it("produces completely different keys when server salt changes (rainbow table resistance)", () => {
    const req = new Request("https://www.scoutit.space/api/analytics", {
      headers: {
        "x-forwarded-for": "203.177.12.45",
        "user-agent": "Mozilla/5.0",
      },
    });

    const keyWithSaltA = deriveAnalyticsViewerKey(req, "salt_A_394857394");
    const keyWithSaltB = deriveAnalyticsViewerKey(req, "salt_B_987234982");

    expect(keyWithSaltA).not.toBe(keyWithSaltB);

    // Old predictable hash would have been:
    const month = new Date().toISOString().substring(0, 7);
    const oldPlainHash = createHash("sha256")
      .update(`203.177.12.45:Mozilla/5.0:${month}`)
      .digest("hex")
      .substring(0, 24);

    expect(keyWithSaltA).not.toBe(oldPlainHash);
    expect(keyWithSaltB).not.toBe(oldPlainHash);
  });

  it("isolates multi-hop client IP properly via clientIp parser", () => {
    const req = new Request("https://www.scoutit.space/api/analytics", {
      headers: {
        "x-forwarded-for": "203.177.12.45, 10.0.0.1, 192.168.1.1",
        "user-agent": "Mozilla/5.0",
      },
    });

    const reqSingle = new Request("https://www.scoutit.space/api/analytics", {
      headers: {
        "x-forwarded-for": "203.177.12.45",
        "user-agent": "Mozilla/5.0",
      },
    });

    const keyMulti = deriveAnalyticsViewerKey(req, "test_salt");
    const keySingle = deriveAnalyticsViewerKey(reqSingle, "test_salt");

    // Both should isolate the first real client IP "203.177.12.45"
    expect(keyMulti).toBe(keySingle);
  });
});
