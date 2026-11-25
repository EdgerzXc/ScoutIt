import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { canRevealCounterpartyIdentity } from "@/lib/identityDisclosure";

const state = vi.hoisted(() => ({
  dealRows: [],
  profiles: [],
  metrics: [],
}));

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: async () => "owner-1",
  assertAdultEligibility: async () => true,
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => ({
      select: () => ({
        in: async () => {
          if (table === "user_profiles") {
            return { data: [...state.profiles], error: null };
          }
          if (table === "user_behavioral_metrics") {
            return { data: [...state.metrics], error: null };
          }
          return { data: [], error: null };
        },
      }),
    }),
  },
}));

vi.mock("@/lib/deals/userDeals", () => ({
  deriveMyRole: (row, uid) => (String(row?.buyer_id) === String(uid) ? "buyer" : "owner"),
  loadDealMessageActivity: async () => ({
    lastMessageByDeal: {},
    lastActivityByDeal: {},
    unreadByDeal: {},
  }),
  loadUserDealRows: async () => ({
    rows: [...state.dealRows],
    error: null,
    routedRecipients: [],
  }),
  extractServiceTargetRole: () => null,
  describeDealIntent: () => ({
    targetRole: "owner",
    sourceLayer: "property_listing",
    intentBadge: "PROPERTY · REQUIRES OWNER",
    intentSummary: "Wants Property",
  }),
}));

const { GET: listDeals } = await import("@/app/api/deals/route");

const SENDER_UUID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  state.dealRows = [];
  state.profiles = [];
  state.metrics = [];
});

describe("canRevealCounterpartyIdentity", () => {
  it("withholds identity on pending anonymous or private requests and reveals on accept or public non-anonymous", () => {
    expect(canRevealCounterpartyIdentity({ dealStatus: "pending", counterpartyIsPublic: true, senderAnonymous: true })).toBe(false);
    expect(canRevealCounterpartyIdentity({ dealStatus: "pending", counterpartyIsPublic: false, senderAnonymous: false })).toBe(false);
    expect(canRevealCounterpartyIdentity({ dealStatus: "pending", counterpartyIsPublic: true, senderAnonymous: false })).toBe(true);
    expect(canRevealCounterpartyIdentity({ dealStatus: "accepted", counterpartyIsPublic: false, senderAnonymous: true })).toBe(true);
  });
});

describe("GET /api/deals pre-accept anonymity and anonymized trust strip", () => {
  it("strips otherPartyId when pending + anonymous and returns scored otherPartyTrust without PII", async () => {
    state.dealRows = [
      {
        id: "deal-1",
        status: "pending",
        buyer_id: SENDER_UUID,
        broker_id: null,
        sender_anonymous: true,
        pitch_message: "Interested in viewing next week.",
        created_at: "2026-11-25T01:00:00Z",
        properties: { id: "prop-1", title: "One Bonifacio", slug: "one-bonifacio", owner_id: "owner-1", price: 150000 },
      },
    ];
    state.profiles = [
      { id: SENDER_UUID, display_name: "Alex Santos", is_profile_public: true, prc_verified: false },
    ];
    state.metrics = [
      {
        user_id: SENDER_UUID,
        tier: "TIER_SOVEREIGN",
        display_badge: "[Sovereign Resident]",
        composite_score: 93,
        eligible_review_count: 4,
        transaction_count: 4,
        vector_averages: {
          payment_punctuality: 4.8,
          space_care_maintenance: 4.6,
          communication_conduct: 4.7,
          lease_covenant_adherence: 4.5,
        },
      },
    ];

    const res = await listDeals(new Request("http://localhost/api/deals"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.deals).toHaveLength(1);

    const deal = body.deals[0];
    expect(deal.otherParty).toBe("Anonymous");
    expect(deal.otherPartyId).toBeNull();
    expect(deal.identityRevealed).toBe(false);
    expect(deal.otherPartyTrust).toEqual({
      tier: "TIER_SOVEREIGN",
      displayBadge: "[Sovereign Resident]",
      compositeScore: 93,
      isHonestBlank: false,
      verifiedTransactions: 4,
      eligibleReviewCount: 4,
      isPrcVerified: false,
      vectorAverages: {
        payment_punctuality: 4.8,
        space_care_maintenance: 4.6,
        communication_conduct: 4.7,
        lease_covenant_adherence: 4.5,
      },
    });
    expect(JSON.stringify(deal.otherPartyTrust)).not.toContain(SENDER_UUID);
    expect(JSON.stringify(deal.otherPartyTrust)).not.toContain("Alex Santos");
  });

  it("falls back to Honest Blank protection when no behavioral metrics exist, and reveals otherPartyId after accept", async () => {
    state.dealRows = [
      {
        id: "deal-pending",
        status: "pending",
        buyer_id: SENDER_UUID,
        broker_id: null,
        sender_anonymous: false,
        pitch_message: "Hi!",
        created_at: "2026-11-25T01:00:00Z",
        properties: { id: "prop-1", title: "One Bonifacio", slug: "one-bonifacio", owner_id: "owner-1", price: 150000 },
      },
      {
        id: "deal-accepted",
        status: "accepted",
        buyer_id: SENDER_UUID,
        broker_id: null,
        sender_anonymous: true,
        pitch_message: "Accepted chat.",
        created_at: "2026-11-25T02:00:00Z",
        properties: { id: "prop-2", title: "The Suites", slug: "the-suites", owner_id: "owner-1", price: 200000 },
      },
    ];
    state.profiles = [
      { id: SENDER_UUID, display_name: "Private Seeker", is_profile_public: false, prc_verified: true },
    ];

    const res = await listDeals(new Request("http://localhost/api/deals"));
    const body = await res.json();
    expect(res.status).toBe(200);

    const pendingDeal = body.deals.find((d) => d.id === "deal-pending");
    const acceptedDeal = body.deals.find((d) => d.id === "deal-accepted");

    expect(pendingDeal.otherParty).toBe("Buyer");
    expect(pendingDeal.otherPartyId).toBeNull();
    expect(pendingDeal.identityRevealed).toBe(false);
    expect(pendingDeal.otherPartyTrust).toEqual({
      tier: "TIER_HONEST_BLANK",
      displayBadge: "[First-Time Verified Seeker]",
      compositeScore: null,
      isHonestBlank: true,
      verifiedTransactions: 0,
      eligibleReviewCount: 0,
      isPrcVerified: true,
      vectorAverages: null,
    });

    expect(acceptedDeal.otherParty).toBe("Private Seeker");
    expect(acceptedDeal.otherPartyId).toBe(SENDER_UUID);
    expect(acceptedDeal.identityRevealed).toBe(true);
    expect(acceptedDeal.otherPartyTrust).toBeNull();
  });
});

describe("Multi-role Anonymity Shield and ChatBox trust strip contracts", () => {
  it("PrivacyShieldPanel evaluates activeRoles so multi-role broker+owner accounts retain shield toggles", () => {
    const shieldSrc = fs.readFileSync(path.resolve("src/components/profile/PrivacyShieldPanel.js"), "utf8");
    expect(shieldSrc).toContain("activeRoles.filter((r) => canUseAnonymityShield(r))");
    expect(shieldSrc).toContain("canUseAnonymityShield(role) || eligibleShieldRoles.length > 0");
  });

  it("ChatBox renders deal.otherPartyTrust cleanly using ScoutIt tokens and >=12px font classes", () => {
    const chatSrc = fs.readFileSync(path.resolve("src/components/dashboard/ChatBox.js"), "utf8");
    expect(chatSrc).toContain("deal.otherPartyTrust");
    expect(chatSrc).toContain("Honest Blank protection");
    expect(chatSrc).toContain("Public profile");
    expect(chatSrc).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
