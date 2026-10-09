import { describe, it, expect } from "vitest";
import {
  resolvePrimaryContact,
  orderRemainingContacts,
  isAttributionExpired,
  getViaCookieName,
  serializeViaCookie,
  parseViaCookie,
  ROUTING_REASONS,
  VIA_STATUS,
  VIA_ATTRIBUTION_WINDOW_MS,
} from "@/lib/viaRouting";

describe("ScoutIt VIA Contact Attribution & Priority Routing Engine (A-186)", () => {
  const mockOwner = { id: "owner-1", name: "OneE Management", type: "owner", score: 95 };
  const mockBrokerA = { id: "broker-a", name: "Broker Alpha", type: "broker", score: 91 };
  const mockBrokerB = { id: "broker-b", name: "Broker Beta", type: "broker", score: 87 };
  const mockMariana = { id: "mariana-juan", name: "Mariana Juan", type: "broker", score: 82, slug: "mariana-juan" };
  const mockBrokerC = { id: "broker-c", name: "Broker Charlie", type: "broker", score: 76 };

  // ScoutIt Organic Ranking order: Owner (95) -> Broker A (91) -> Broker B (87) -> Mariana (82) -> Broker C (76)
  const organicRoster = [mockOwner, mockBrokerA, mockBrokerB, mockMariana, mockBrokerC];

  describe("Priority Cascade Hierarchy", () => {
    it("Rule 1: Explicit User Selection always wins over Active Relationship, VIA, and Ranking", () => {
      const result = resolvePrimaryContact({
        eligibleContacts: organicRoster,
        requestedContactId: "broker-a",
        activeRelationshipContactId: "broker-b",
        viaAttribution: {
          promoterId: "mariana-juan",
          expiresAt: Date.now() + 100000,
        },
      });

      expect(result.contact.id).toBe("broker-a");
      expect(result.reason).toBe(ROUTING_REASONS.USER_SELECTION);
      expect(result.otherContacts).toHaveLength(4);
      expect(result.otherContacts.map((c) => c.id)).toEqual(["owner-1", "broker-b", "mariana-juan", "broker-c"]);
    });

    it("Rule 2: Active Relationship Continuity wins over VIA Attribution and Ranking", () => {
      const result = resolvePrimaryContact({
        eligibleContacts: organicRoster,
        activeRelationshipContactId: "broker-b",
        viaAttribution: {
          promoterId: "mariana-juan",
          expiresAt: Date.now() + 100000,
        },
      });

      expect(result.contact.id).toBe("broker-b");
      expect(result.reason).toBe(ROUTING_REASONS.ACTIVE_RELATIONSHIP);
      expect(result.otherContacts.map((c) => c.id)).toEqual(["owner-1", "broker-a", "mariana-juan", "broker-c"]);
    });

    it("Rule 3: Valid VIA Attribution routes to promoter in Position Zero without modifying ranking", () => {
      const result = resolvePrimaryContact({
        eligibleContacts: organicRoster,
        viaAttribution: {
          promoterId: "mariana-juan",
          expiresAt: Date.now() + 100000,
        },
      });

      expect(result.contact.id).toBe("mariana-juan");
      expect(result.reason).toBe(ROUTING_REASONS.VIA_ATTRIBUTION);
      expect(result.viaStatus).toBe(VIA_STATUS.VALID);
      // Remaining contacts strictly preserve original ranking order
      expect(result.otherContacts.map((c) => c.id)).toEqual(["owner-1", "broker-a", "broker-b", "broker-c"]);
      // Mariana's original score is NOT artificially mutated
      expect(result.contact.score).toBe(82);
    });

    it("Rule 4: Organic ScoutIt Ranking takes over when no VIA attribution exists", () => {
      const result = resolvePrimaryContact({
        eligibleContacts: organicRoster,
      });

      expect(result.contact.id).toBe("owner-1");
      expect(result.reason).toBe(ROUTING_REASONS.SCOUTIT_RANKING);
      expect(result.otherContacts.map((c) => c.id)).toEqual(["broker-a", "broker-b", "mariana-juan", "broker-c"]);
    });

    it("Graceful Fallback: Revoked promoter link does not crash and falls back to organic ranking", () => {
      // Promoter is "revoked-broker", which is NOT in eligible organicRoster
      const result = resolvePrimaryContact({
        eligibleContacts: organicRoster,
        viaAttribution: {
          promoterId: "revoked-broker",
          expiresAt: Date.now() + 100000,
        },
      });

      // Falls back to top organic contact without throwing
      expect(result.contact.id).toBe("owner-1");
      expect(result.reason).toBe(ROUTING_REASONS.SCOUTIT_RANKING);
      expect(result.viaStatus).toBe(VIA_STATUS.INVALID);
      expect(result.otherContacts).toHaveLength(4);
    });

    it("Expired Attribution: Falls back to organic ranking when attribution window has elapsed", () => {
      const now = Date.now();
      const expiredAttribution = {
        promoterId: "mariana-juan",
        expiresAt: now - 5000, // expired 5 seconds ago
      };

      const result = resolvePrimaryContact({
        eligibleContacts: organicRoster,
        viaAttribution: expiredAttribution,
        now,
      });

      expect(result.contact.id).toBe("owner-1");
      expect(result.reason).toBe(ROUTING_REASONS.SCOUTIT_RANKING);
      expect(result.viaStatus).toBe(VIA_STATUS.INVALID);
    });

    it("Empty Roster: Returns fallback status gracefully without error", () => {
      const result = resolvePrimaryContact({
        eligibleContacts: [],
      });

      expect(result.contact).toBeNull();
      expect(result.reason).toBe(ROUTING_REASONS.FALLBACK);
      expect(result.otherContacts).toEqual([]);
    });
  });

  describe("Attribution Expiration & Window Mechanics", () => {
    it("correctly identifies non-expired and expired timestamps", () => {
      const now = 1760000000000;
      expect(isAttributionExpired({ expiresAt: now + 10000 }, now)).toBe(false);
      expect(isAttributionExpired({ expiresAt: now - 10 }, now)).toBe(true);
      expect(isAttributionExpired({ expiresAt: now }, now)).toBe(true);
      expect(isAttributionExpired(null)).toBe(true);
    });
  });

  describe("Cookie Serialization & Parsing", () => {
    it("round-trips attribution payload reliably", () => {
      const now = Date.now();
      const expires = now + VIA_ATTRIBUTION_WINDOW_MS;
      const cookieStr = serializeViaCookie({
        propertyId: "onee-tower",
        promoterId: "mariana-juan",
        promoterSlug: "mariana-juan",
        promoterType: "broker",
        visitorId: "vis-12345",
        firstSeenAt: now,
        expiresAt: expires,
      });

      expect(typeof cookieStr).toBe("string");
      const parsed = parseViaCookie(cookieStr);

      expect(parsed).toEqual({
        propertyId: "onee-tower",
        promoterId: "mariana-juan",
        promoterSlug: "mariana-juan",
        promoterType: "broker",
        visitorId: "vis-12345",
        firstSeenAt: now,
        expiresAt: expires,
      });
    });

    it("generates sanitized property-specific cookie names", () => {
      expect(getViaCookieName("OneE")).toBe("scoutit_via_onee");
      expect(getViaCookieName("Aura-Tower/Unit_1")).toBe("scoutit_via_aura_tower_unit_1");
      expect(getViaCookieName("")).toBe("scoutit_via_global");
    });

    it("handles corrupted cookie strings gracefully without throwing", () => {
      expect(parseViaCookie("not-a-json")).toBeNull();
      expect(parseViaCookie("%invalid%json")).toBeNull();
      expect(parseViaCookie("")).toBeNull();
      expect(parseViaCookie(null)).toBeNull();
    });
  });
});
