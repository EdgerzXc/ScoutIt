import { describe, it, expect } from "vitest";
import {
  ENTITY_TYPES,
  WORKSPACE_CONTEXTS,
  BRIDGE_EVENT_TYPES,
  validateContextBridgePayload,
  createContextBridgeEvent,
  resolveContextRoute,
  buildReturnBrief,
} from "../contextBridges";

describe("contextBridges", () => {
  describe("validateContextBridgePayload", () => {
    it("rejects non-object or null payloads", () => {
      expect(validateContextBridgePayload(null).valid).toBe(false);
      expect(validateContextBridgePayload("string").valid).toBe(false);
    });

    it("requires a valid entity_type", () => {
      const result = validateContextBridgePayload({
        entity_type: "unknown_type",
        entity_id: "prop_123",
        event_type: BRIDGE_EVENT_TYPES.PRICE_UPDATE,
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Invalid entity_type");
    });

    it("requires a non-empty entity_id", () => {
      const result = validateContextBridgePayload({
        entity_type: ENTITY_TYPES.PROPERTY,
        entity_id: "  ",
        event_type: BRIDGE_EVENT_TYPES.PRICE_UPDATE,
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Missing or invalid entity_id");
    });

    it("accepts valid payloads", () => {
      const result = validateContextBridgePayload({
        entity_type: ENTITY_TYPES.PROPERTY,
        entity_id: "prop_123",
        event_type: BRIDGE_EVENT_TYPES.PRICE_UPDATE,
        workspace_context: WORKSPACE_CONTEXTS.BUYER,
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe("createContextBridgeEvent", () => {
    it("creates a properly shaped event object", () => {
      const event = createContextBridgeEvent({
        entity_type: ENTITY_TYPES.PROPERTY,
        entity_id: "prop_456",
        event_type: BRIDGE_EVENT_TYPES.AVAILABILITY_CHANGE,
        workspace_context: WORKSPACE_CONTEXTS.OWNER,
        summary: "Unit 401 is now under contract",
      });

      expect(event.entity_type).toBe(ENTITY_TYPES.PROPERTY);
      expect(event.entity_id).toBe("prop_456");
      expect(event.event_type).toBe(BRIDGE_EVENT_TYPES.AVAILABILITY_CHANGE);
      expect(event.workspace_context).toBe(WORKSPACE_CONTEXTS.OWNER);
      expect(event.summary).toBe("Unit 401 is now under contract");
      expect(typeof event.timestamp).toBe("string");
    });

    it("throws when required fields are missing", () => {
      expect(() =>
        createContextBridgeEvent({
          entity_type: ENTITY_TYPES.PROPERTY,
          entity_id: "",
          event_type: BRIDGE_EVENT_TYPES.PRICE_UPDATE,
        })
      ).toThrow();
    });
  });

  describe("resolveContextRoute", () => {
    it("routes properties to public slug for buyer workspace", () => {
      const route = resolveContextRoute({
        entity_type: ENTITY_TYPES.PROPERTY,
        entity_id: "rec123",
        metadata: { slug: "ridgeline-capitol-commons" },
        workspace_context: WORKSPACE_CONTEXTS.BUYER,
      });
      expect(route).toBe("/property/ridgeline-capitol-commons");
    });

    it("routes properties to dashboard listing for owner workspace", () => {
      const route = resolveContextRoute({
        entity_type: ENTITY_TYPES.PROPERTY,
        entity_id: "prop_abc",
        metadata: { slug: "ridgeline-capitol-commons" },
        workspace_context: WORKSPACE_CONTEXTS.OWNER,
      });
      expect(route).toBe("/dashboard/owner/listings/prop_abc");
    });

    it("routes child units with parent slug query parameter", () => {
      const route = resolveContextRoute({
        entity_type: ENTITY_TYPES.UNIT,
        entity_id: "unit_401",
        metadata: { parent_slug: "ridgeline-capitol-commons" },
      });
      expect(route).toBe("/property/ridgeline-capitol-commons?unit=unit_401");
    });

    it("routes intelligence briefs to /intel/:slug", () => {
      const intelSlug = "bgc-commercial-yield-q3";
      const route = resolveContextRoute({
        entity_type: ENTITY_TYPES.INTELLIGENCE,
        entity_id: "brief_bgc_yield",
        metadata: { slug: intelSlug },
      });
      expect(route).toBe("/intel/" + intelSlug);
    });

    it("routes deals to /dashboard/deals/:id", () => {
      const route = resolveContextRoute({
        entity_type: ENTITY_TYPES.DEAL,
        entity_id: "deal_789",
      });
      expect(route).toBe("/dashboard/deals/deal_789");
    });

    it("resolves nested activity with related entity", () => {
      const route = resolveContextRoute({
        entity_type: ENTITY_TYPES.ACTIVITY,
        entity_id: "act_1",
        related_entity_type: ENTITY_TYPES.PROPERTY,
        related_entity_id: "prop_999",
        metadata: { slug: "luxury-penthouse" },
      });
      expect(route).toBe("/property/luxury-penthouse");
    });
  });

  describe("buildReturnBrief", () => {
    it("returns empty brief state when no events", () => {
      const brief = buildReturnBrief([]);
      expect(brief.hasUpdates).toBe(false);
      expect(brief.items.length).toBe(0);
    });

    it("constructs categorized return brief items", () => {
      const events = [
        {
          id: "e1",
          entity_type: ENTITY_TYPES.PROPERTY,
          entity_id: "p1",
          event_type: BRIDGE_EVENT_TYPES.PRICE_UPDATE,
          summary: "Price reduced by 5%",
          metadata: { slug: "sample-prop" },
        },
        {
          id: "e2",
          entity_type: ENTITY_TYPES.INTELLIGENCE,
          entity_id: "i1",
          event_type: BRIDGE_EVENT_TYPES.INTEL_PUBLISHED,
          summary: "New market analysis for Makati",
          metadata: { slug: "makati-analysis" },
        },
      ];

      const brief = buildReturnBrief(events, WORKSPACE_CONTEXTS.BUYER);
      expect(brief.hasUpdates).toBe(true);
      expect(brief.items.length).toBe(2);
      expect(brief.items[0].category).toBe("Pricing");
      expect(brief.items[0].route).toBe("/property/sample-prop");
      expect(brief.items[1].category).toBe("Intelligence");
      expect(brief.items[1].route).toBe("/intel/" + "makati-analysis");
    });
  });
});
