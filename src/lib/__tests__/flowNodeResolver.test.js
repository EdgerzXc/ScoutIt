import { describe, expect, it } from "vitest";
import { resolveFlowNode, getFlowNode } from "@/lib/flow/flowNodeResolver";

describe("flowNodeResolver", () => {
  it("resolves exact static routes to their respective flow nodes", () => {
    const hero = resolveFlowNode("/");
    expect(hero).not.toBeNull();
    expect(hero.nodeId).toBe("hero");
    expect(hero.domain).toBe("core");
    expect(hero.roles).toContain("visitor");

    const discover = resolveFlowNode("/discover");
    expect(discover).not.toBeNull();
    expect(discover.nodeId).toBe("discover_directory");
    expect(discover.domain).toBe("discovery");
  });

  it("resolves parameterized dynamic routes (e.g. /property/[id])", () => {
    const detail = resolveFlowNode("/property/the-ridgeline-at-capitol-commons");
    expect(detail).not.toBeNull();
    expect(detail.nodeId).toBe("direct_slug");
    expect(detail.domain).toBe("property");
  });

  it("resolves parameterized dynamic routes with query parameters", () => {
    const detailWithQuery = resolveFlowNode("/property/the-ridgeline?view=gallery");
    expect(detailWithQuery).not.toBeNull();
    expect(detailWithQuery.nodeId).toBe("direct_slug");
  });

  it("prioritizes explicit nodeId when provided", () => {
    const node = resolveFlowNode("/random/unmapped/url", "deal_room");
    expect(node).not.toBeNull();
    expect(node.nodeId).toBe("deal_room");
    expect(node.domain).toBe("deal");
  });

  it("resolves newly added features and domain subroutes via fallback matchers", () => {
    const viaPage = resolveFlowNode("/property/the-ridgeline/via/broker-mike");
    expect(viaPage).not.toBeNull();
    expect(viaPage.nodeId).toBe("direct_slug");

    const viaApi = resolveFlowNode("/api/property/rec123/via");
    expect(viaApi).not.toBeNull();
    expect(viaApi.nodeId).toBe("direct_slug");

    const reviewApi = resolveFlowNode("/api/deals/deal-abc-123/review");
    expect(reviewApi).not.toBeNull();
    expect(reviewApi.nodeId).toBe("deal_room");

    const passportApi = resolveFlowNode("/api/user/resident-passport");
    expect(passportApi).not.toBeNull();
    expect(passportApi.nodeId).toBe("auth_onboarding_flow");

    const adminFlow = resolveFlowNode("/admin/flow");
    expect(adminFlow).not.toBeNull();
    expect(adminFlow.nodeId).toBe("mission_control");

    const metropolis = resolveFlowNode("/layer/metropolis");
    expect(metropolis).not.toBeNull();
    expect(metropolis.nodeId).toBe("metropolis");
  });

  it("returns null safely for unknown routes or invalid inputs", () => {
    expect(resolveFlowNode("")).toBeNull();
    expect(resolveFlowNode(null)).toBeNull();
    expect(resolveFlowNode(undefined)).toBeNull();
    expect(resolveFlowNode("/completely-nonexistent-route-xyz-123")).toBeNull();
  });

  it("provides direct node lookup via getFlowNode", () => {
    const node = getFlowNode("deal_room");
    expect(node).not.toBeNull();
    expect(node.name).toBe("Private Inquiry Workspace & Scheduling");
    expect(getFlowNode("invalid_nonexistent_id")).toBeNull();
    expect(getFlowNode(null)).toBeNull();
  });
});
