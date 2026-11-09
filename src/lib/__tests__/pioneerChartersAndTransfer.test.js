import { describe, expect, it, vi } from "vitest";
import {
  BADGE_DEFINITIONS,
  PIONEER_PERKS,
  isPioneerBadge,
  hasAnyPioneerBadge,
  getPioneerBadge,
  formatCharterSeatLabel,
  resolveUserPerks,
  hasBadge,
} from "../BadgeEngine.js";
import { calculateQueuePosition } from "../queuePosition.js";

describe("Pioneer Charters, Strict Limits & Transfer Protocol (A-344)", () => {
  describe("1. Cohort Slot Caps and Strict Hard Cutoffs", () => {
    it("pins the exact approved pioneer slot limits per cohort", () => {
      expect(BADGE_DEFINITIONS.PIONEER_BROKER.max_slots).toBe(25);
      expect(BADGE_DEFINITIONS.PIONEER_OWNER.max_slots).toBe(20);
      expect(BADGE_DEFINITIONS.FOUNDING_SEEKER.max_slots).toBe(100);
      expect(BADGE_DEFINITIONS.PIONEER_CREATOR.max_slots).toBe(15);
      expect(BADGE_DEFINITIONS.ALPHA_CARTOGRAPHER.max_slots).toBe(5);

      const totalPioneerSeats =
        BADGE_DEFINITIONS.PIONEER_BROKER.max_slots +
        BADGE_DEFINITIONS.PIONEER_OWNER.max_slots +
        BADGE_DEFINITIONS.FOUNDING_SEEKER.max_slots +
        BADGE_DEFINITIONS.PIONEER_CREATOR.max_slots +
        BADGE_DEFINITIONS.ALPHA_CARTOGRAPHER.max_slots;

      expect(totalPioneerSeats).toBe(165);
    });

    it("correctly identifies pioneer cohorts vs non-pioneer badges", () => {
      expect(isPioneerBadge("PIONEER_BROKER")).toBe(true);
      expect(isPioneerBadge("PIONEER_OWNER")).toBe(true);
      expect(isPioneerBadge("PIONEER_CREATOR")).toBe(true);
      expect(isPioneerBadge("FOUNDING_SEEKER")).toBe(true);

      expect(isPioneerBadge("ALPHA_CARTOGRAPHER")).toBe(false);
      expect(isPioneerBadge("TOP_CONTRIBUTOR")).toBe(false);
      expect(isPioneerBadge("COMMUNITY_LEADER")).toBe(false);
      expect(isPioneerBadge("MASTER_SCOUT")).toBe(false);
    });

    it("flags fully claimed cohorts as SOLD_OUT", () => {
      expect(BADGE_DEFINITIONS.FOUNDING_SEEKER.status).toBe("SOLD_OUT");
      expect(BADGE_DEFINITIONS.FOUNDING_SEEKER.claimed).toBe(100);
      expect(BADGE_DEFINITIONS.ALPHA_CARTOGRAPHER.status).toBe("SOLD_OUT");
      expect(BADGE_DEFINITIONS.ALPHA_CARTOGRAPHER.claimed).toBe(5);
    });
  });

  describe("2. Strict 'One Pioneer Badge Per Account' Rule", () => {
    it("detects when a user already holds a pioneer badge across all formats", () => {
      expect(hasAnyPioneerBadge([{ badge_id: "PIONEER_BROKER" }])).toBe(true);
      expect(hasAnyPioneerBadge([{ id: "PIONEER_OWNER" }])).toBe(true);
      expect(hasAnyPioneerBadge([{ badge_id: "FOUNDING_SEEKER" }])).toBe(true);
      expect(hasAnyPioneerBadge([{ id: "PIONEER_CREATOR" }])).toBe(true);
      expect(hasAnyPioneerBadge(["PIONEER_BROKER"])).toBe(true);
      expect(hasAnyPioneerBadge(["FOUNDING_SEEKER"])).toBe(true);

      // Non-pioneer badges return false
      expect(hasAnyPioneerBadge(["ALPHA_CARTOGRAPHER"])).toBe(false);
      expect(hasAnyPioneerBadge([{ badge_id: "TOP_CONTRIBUTOR" }])).toBe(false);
      expect(hasAnyPioneerBadge(["MASTER_SCOUT", "COMMUNITY_LEADER"])).toBe(false);
      expect(hasAnyPioneerBadge([])).toBe(false);
      expect(hasAnyPioneerBadge(null)).toBe(false);
    });

    it("extracts the active pioneer badge from user badge collection", () => {
      const userBadges = [
        { badge_id: "TOP_CONTRIBUTOR" },
        { badge_id: "PIONEER_BROKER", seat_number: 7 },
      ];
      const pioneer = getPioneerBadge(userBadges);
      expect(pioneer).toBeDefined();
      expect(pioneer.badge_id).toBe("PIONEER_BROKER");
      expect(pioneer.seat_number).toBe(7);
    });

    it("prevents multi-role pioneer badge hoarding", () => {
      // If a user has PIONEER_BROKER, attempting to add PIONEER_OWNER must be blocked
      const heldBadges = [{ badge_id: "PIONEER_BROKER" }];
      const candidateBadge = "PIONEER_OWNER";

      const canClaim = !isPioneerBadge(candidateBadge) || !hasAnyPioneerBadge(heldBadges);
      expect(canClaim).toBe(false);
    });
  });

  describe("3. Sequential Seat Numbering & Formatter", () => {
    it("formats sequential seat numbers with zero-padded charter labels", () => {
      expect(formatCharterSeatLabel(1)).toBe("Charter #001");
      expect(formatCharterSeatLabel(8)).toBe("Charter #008");
      expect(formatCharterSeatLabel(25)).toBe("Charter #025");
      expect(formatCharterSeatLabel(100)).toBe("Charter #100");
      expect(formatCharterSeatLabel(0)).toBeNull();
      expect(formatCharterSeatLabel(null)).toBeNull();
      expect(formatCharterSeatLabel(undefined)).toBeNull();
    });
  });

  describe("4. Operational Perks & Capabilities Engine", () => {
    it("resolves approved operational privileges for Pioneer Broker", () => {
      const brokerBadges = [{ badge_id: "PIONEER_BROKER", seat_number: 14 }];
      const perks = resolveUserPerks(brokerBadges);

      expect(perks.queue_priority).toBe(true);
      expect(perks.discount_pct).toBe(50);
      expect(perks.priority_support).toBe(true);
      expect(perks.monthly_connects).toBe(50);
      expect(perks.white_label_pdf).toBe(true);
      expect(perks.charter_seal).toBe(true);
      expect(perks.alpha_notes).toBe(true);
      expect(perks.is_transferable).toBe(true);

      // Verify forbidden perks are strictly NOT granted
      expect(perks.unlimited_storage).toBeUndefined();
      expect(perks.search_boost).toBeUndefined();
      expect(perks.profit_share).toBeUndefined();
    });

    it("resolves approved privileges for Pioneer Owner", () => {
      const ownerBadges = [{ badge_id: "PIONEER_OWNER", seat_number: 8 }];
      const perks = resolveUserPerks(ownerBadges);

      expect(perks.queue_priority).toBe(true);
      expect(perks.discount_pct).toBe(50);
      expect(perks.priority_support).toBe(true);
      expect(perks.white_label_pdf).toBe(true);
      expect(perks.charter_seal).toBe(true);
      expect(perks.is_transferable).toBe(true);
    });

    it("resolves approved privileges for Pioneer Creator", () => {
      const creatorBadges = [{ badge_id: "PIONEER_CREATOR", seat_number: 12 }];
      const perks = resolveUserPerks(creatorBadges);

      expect(perks.priority_bounties).toBe(true);
      expect(perks.priority_support).toBe(true);
      expect(perks.monthly_connects).toBe(25);
      expect(perks.charter_seal).toBe(true);
      expect(perks.is_transferable).toBe(true);
    });

    it("returns zeroed capabilities when user holds no badges", () => {
      const perks = resolveUserPerks([]);
      expect(perks.queue_priority).toBe(false);
      expect(perks.discount_pct).toBe(0);
      expect(perks.monthly_connects).toBe(0);
      expect(perks.white_label_pdf).toBe(false);
      expect(perks.is_transferable).toBe(false);
    });

    it("supports dynamic database perk catalog override", () => {
      const customCatalog = {
        CUSTOM_HONOR: {
          id: "CUSTOM_HONOR",
          perks: {
            custom_telemetry: true,
            monthly_connects: 100,
          },
        },
      };

      const perks = resolveUserPerks([{ badge_id: "CUSTOM_HONOR" }], customCatalog);
      expect(perks.custom_telemetry).toBe(true);
      expect(perks.monthly_connects).toBe(100);
    });
  });

  describe("5. Deterministic Queue Priority Calculation", () => {
    it("moves queue_priority items to the head of the queue", async () => {
      const now = "2026-11-09T10:00:00.000Z";
      const items = [
        { id: "draft-std-1", created_at: now, details: { queue_priority: false } },
        { id: "draft-std-2", created_at: now, details: {} },
        { id: "draft-pioneer-vip", created_at: now, details: { queue_priority: true } },
      ];

      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                order: async () => ({ data: items, error: null }),
              }),
            }),
          }),
        }),
      };

      // VIP Pioneer draft should jump ahead of both standard drafts to rank #1
      const vipPos = await calculateQueuePosition(mockClient, "draft-pioneer-vip");
      const std1Pos = await calculateQueuePosition(mockClient, "draft-std-1");
      const std2Pos = await calculateQueuePosition(mockClient, "draft-std-2");

      expect(vipPos).toBe(1);
      expect(std1Pos).toBe(2);
      expect(std2Pos).toBe(3);
    });

    it("maintains FIFO ordering among multiple queue_priority items", async () => {
      const timeA = "2026-11-09T10:00:00.000Z";
      const timeB = "2026-11-09T10:05:00.000Z";
      const items = [
        { id: "vip-first", created_at: timeA, details: { queue_priority: true } },
        { id: "vip-second", created_at: timeB, details: { queue_priority: true } },
        { id: "std-regular", created_at: timeA, details: {} },
      ];

      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                order: async () => ({ data: items, error: null }),
              }),
            }),
          }),
        }),
      };

      expect(await calculateQueuePosition(mockClient, "vip-first")).toBe(1);
      expect(await calculateQueuePosition(mockClient, "vip-second")).toBe(2);
      expect(await calculateQueuePosition(mockClient, "std-regular")).toBe(3);
    });
  });

  describe("6. Transfer Rule Verification & Safety Boundaries", () => {
    it("validates that non-transferable badges are strictly rejected", () => {
      const alphaPerks = PIONEER_PERKS.ALPHA_CARTOGRAPHER;
      expect(alphaPerks.is_transferable).toBeUndefined();

      const brokerPerks = PIONEER_PERKS.PIONEER_BROKER;
      expect(brokerPerks.is_transferable).toBe(true);
    });

    it("verifies recipient mutual exclusivity rule before transfer", () => {
      // Recipient already has a pioneer charter -> transfer must fail
      const recipientBadges = [{ badge_id: "PIONEER_OWNER", seat_number: 4 }];
      const hasConflict = hasAnyPioneerBadge(recipientBadges);
      expect(hasConflict).toBe(true);

      // Clean recipient -> transfer allowed
      const cleanRecipientBadges = [{ badge_id: "MASTER_SCOUT" }];
      const cleanHasConflict = hasAnyPioneerBadge(cleanRecipientBadges);
      expect(cleanHasConflict).toBe(false);
    });
  });
});
