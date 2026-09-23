import { describe, expect, it } from "vitest";
import { freeInboundRecipient, isOpenGateAvailable, openGateContactRevealed } from "@/lib/openGate";
import { anyBlockedStrict } from "@/lib/connectBlocks";

function authority({ entitlement, listing, entitlementError = null, listingError = null }) {
  return {
    from(table) {
      const result = table === "open_gate_entitlements"
        ? { data: entitlement, error: entitlementError }
        : { data: listing, error: listingError };
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => result,
      };
      return chain;
    },
  };
}

const future = () => new Date(Date.now() + 60_000).toISOString();

describe("Open Gate authority and privacy", () => {
  it("requires both a current staff entitlement and a broker-open listing", async () => {
    const valid = authority({ entitlement: { enabled: true, expires_at: future() }, listing: { enabled: true } });
    expect(await isOpenGateAvailable(valid, "p1", "b1")).toBe(true);
    expect(await isOpenGateAvailable(authority({ entitlement: { enabled: false, expires_at: future() }, listing: { enabled: true } }), "p1", "b1")).toBe(false);
    expect(await isOpenGateAvailable(authority({ entitlement: { enabled: true, expires_at: "2000-01-01T00:00:00Z" }, listing: { enabled: true } }), "p1", "b1")).toBe(false);
    expect(await isOpenGateAvailable(authority({ entitlement: { enabled: true, expires_at: future() }, listing: { enabled: false } }), "p1", "b1")).toBe(false);
    expect(await isOpenGateAvailable(authority({ entitlement: { enabled: true, expires_at: future() }, listing: { enabled: true }, listingError: { code: "42P01" } }), "p1", "b1")).toBe(false);
  });

  it("allows an Enterprise owner only on their own property", async () => {
    const data = {
      open_gate_role_entitlements: { enabled: true, expires_at: future() },
      open_gate_role_listings: { enabled: true },
      properties: { owner_id: "owner-1" },
    };
    const admin = { from: table => {
      const chain = { select: () => chain, eq: () => chain, is: () => chain,
        maybeSingle: async () => ({ data: data[table], error: null }) };
      return chain;
    } };
    expect(await isOpenGateAvailable(admin, "property-1", "owner-1", "owner")).toBe(true);
    expect(await isOpenGateAvailable(admin, "property-1", "other-owner", "owner")).toBe(false);
  });

  it("allows an Enterprise operator only on their currently delegated unit", async () => {
    const data = {
      open_gate_role_entitlements: { enabled: true, expires_at: future() },
      open_gate_role_listings: { enabled: true },
      property_units: { operator_id: "operator-1", property_id: "property-1" },
    };
    const admin = { from: table => {
      const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: data[table], error: null }) };
      return chain;
    } };
    expect(await isOpenGateAvailable(admin, "property-1", "operator-1", "operator", "unit-1")).toBe(true);
    data.property_units.operator_id = "replacement-operator";
    expect(await isOpenGateAvailable(admin, "property-1", "operator-1", "operator", "unit-1")).toBe(false);
    expect(await isOpenGateAvailable(admin, "property-1", "operator-1", "operator")).toBe(false);
  });
  it("waives the cost only for a directed inbound broker request", () => {
    expect(freeInboundRecipient(["b1"], "b1", null, "buyer")).toBe(true);
    expect(freeInboundRecipient(["b1", "b2"], "b1", null, "buyer")).toBe(false);
    expect(freeInboundRecipient(["b1"], "b1", "unit-1", "buyer")).toBe(false);
    expect(freeInboundRecipient(["b1"], "b1", null, "operator")).toBe(false);
    expect(freeInboundRecipient(["owner"], "b1", null, "buyer")).toBe(false);
  });

  it("refuses free contact when block records cannot be read", async () => {
    const chain = { select: () => chain, in: () => chain, eq: () => chain, limit: async () => ({ data: null, error: { code: "42P01" } }) };
    expect(await anyBlockedStrict({ from: () => chain }, "buyer", ["owner"])).toEqual({ ok: false, blocked: false });
    chain.limit = async () => ({ data: [{ blocker_id: "owner" }], error: null });
    expect(await anyBlockedStrict({ from: () => chain }, "buyer", ["owner"])).toEqual({ ok: true, blocked: true });
  });
  it("reveals direct contact only after the receiver accepts the server-stamped free request", () => {
    expect(openGateContactRevealed({ open_gate_inbound: true, status: "pending" })).toBe(false);
    expect(openGateContactRevealed({ open_gate_inbound: false, status: "accepted" })).toBe(false);
    expect(openGateContactRevealed({ open_gate_inbound: true, status: "accepted" })).toBe(true);
  });
});
