import { describe, it, expect } from "vitest";
import { CONNECT_COSTS, SPENDABLE_CONNECT_COSTS } from "@/lib/connectsWallet";
import { normalizeConnectSource, CONNECT_SOURCES } from "@/lib/connectSource";
import { IDEMPOTENCY_WINDOW_MINUTES } from "@/lib/connectGates";
import { isBlocked } from "@/lib/connectBlocks";

// A-144: Connect Rules v1 invariants as runnable contracts.
describe("A-144 connect rules v1", () => {
  it("invariant #1: no single send costs more than 1 Connect", () => {
    for (const [key, cost] of Object.entries(CONNECT_COSTS)) {
      expect(cost, `${key} must cost exactly 1`).toBe(1);
    }
    for (const key of SPENDABLE_CONNECT_COSTS) {
      expect(CONNECT_COSTS[key]).toBe(1);
    }
  });

  it("source context normalizes unknown values instead of blocking send", () => {
    const n = normalizeConnectSource({ source_type: "nope", reason_tag: "nope", sender_identity_mode: "nope" });
    expect(n.source_type).toBe("general");
    expect(n.reason_tag).toBe("GENERAL_CONNECT");
    expect(n.sender_identity_mode).toBe("public");
    expect(CONNECT_SOURCES).toContain("stratosphere_signal");
  });

  it("signal source maps to SIGNAL_CONNECT reason", () => {
    const n = normalizeConnectSource({ source_type: "stratosphere_signal", source_id: "sig-1" });
    expect(n.reason_tag).toBe("SIGNAL_CONNECT");
    expect(n.source_id).toBe("sig-1");
  });

  it("idempotency window is a positive number of minutes", () => {
    expect(IDEMPOTENCY_WINDOW_MINUTES).toBeGreaterThan(0);
  });

  it("block check fails open (never throws) when the table is missing", async () => {
    const fakeAdmin = {
      from: () => ({
        select: () => ({ eq: () => ({ eq: () => ({ limit: async () => ({ data: null, error: { code: "42P01" } }) }) }) }),
      }),
    };
    await expect(isBlocked(fakeAdmin, "a", "b")).resolves.toBe(false);
    await expect(isBlocked(null, "a", "b")).resolves.toBe(false);
  });
});
