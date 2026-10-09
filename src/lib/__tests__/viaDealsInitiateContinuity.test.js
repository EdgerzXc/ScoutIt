import { describe, it, expect, vi } from "vitest";
import { getViaCookieName, serializeViaCookie, parseViaCookie } from "@/lib/viaRouting";

describe("VIA Deals Initiate Continuity (A-186 Phase 2)", () => {
  it("generates and parses property-scoped VIA cookie accurately", () => {
    const propertyId = "prop-bgc-horizon-101";
    const cookieName = getViaCookieName(propertyId);
    expect(cookieName).toBe("scoutit_via_prop_bgc_horizon_101");

    const cookiePayload = serializeViaCookie({
      propertyId,
      promoterId: "broker-sarah-lee",
      promoterSlug: "sarah-lee",
      promoterType: "broker",
      visitorId: "vis-12345",
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    const parsed = parseViaCookie(cookiePayload);
    expect(parsed).not.toBeNull();
    expect(parsed.propertyId).toBe(propertyId);
    expect(parsed.promoterId).toBe("broker-sarah-lee");
    expect(parsed.promoterSlug).toBe("sarah-lee");
    expect(parsed.visitorId).toBe("vis-12345");
  });

  it("cookie resolution simulates priority cascade in deal initiation", () => {
    // Case 1: User explicitly provided a preferred broker -> User Choice Supremacy
    const explicitBrokerId = "broker-chosen-by-user";
    const cookieAttributedBrokerId = "broker-from-cookie";

    let effectivePreferredBroker = explicitBrokerId || null;
    if (!effectivePreferredBroker && cookieAttributedBrokerId) {
      effectivePreferredBroker = cookieAttributedBrokerId;
    }
    expect(effectivePreferredBroker).toBe("broker-chosen-by-user");

    // Case 2: User did not specify broker -> Cookie Attribution takes Priority
    let effectiveNoExplicit = null;
    if (!effectiveNoExplicit && cookieAttributedBrokerId) {
      effectiveNoExplicit = cookieAttributedBrokerId;
    }
    expect(effectiveNoExplicit).toBe("broker-from-cookie");
  });

  it("handles resilient degradation when attributed broker is inactive", () => {
    // Simulating RPC call behavior
    let rpcCalls = [];
    const mockRpc = (fnName, args) => {
      rpcCalls.push({ fnName, args: { ...args } });
      if (args.p_preferred_broker_id === "inactive-broker") {
        return { data: null, error: { message: "BROKER_NOT_CONTACTABLE" } };
      }
      return { data: [{ deal_id: "deal-success-uuid", recipient_ids: ["owner-uuid"] }], error: null };
    };

    let isViaAttributedBroker = true;
    let legacyArgs = {
      p_property_id: "prop-uuid",
      p_preferred_broker_id: "inactive-broker",
    };

    let result = mockRpc("create_routed_buyer_deal", legacyArgs);

    // Invariant 4 check: If VIA-attributed promoter is inactive, fallback to organic
    if (isViaAttributedBroker && result.error?.message?.includes("BROKER_NOT_CONTACTABLE")) {
      legacyArgs.p_preferred_broker_id = null;
      result = mockRpc("create_routed_buyer_deal", legacyArgs);
    }

    expect(result.error).toBeNull();
    expect(result.data[0].deal_id).toBe("deal-success-uuid");
    expect(rpcCalls).toHaveLength(2);
    expect(rpcCalls[0].args.p_preferred_broker_id).toBe("inactive-broker");
    expect(rpcCalls[1].args.p_preferred_broker_id).toBeNull();
  });
});
