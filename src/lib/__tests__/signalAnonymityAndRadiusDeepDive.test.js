import { describe, it, expect } from "vitest";
import { validateDraft, scoutIdFor } from "../communityPosting";
import { mapDbSignalToCard } from "../communityStore";
import { generateBeaconGeoJSON, SIGNAL_TYPES } from "../communitySignalsAdapter";

describe("Signal Anonymity Invariants & Privacy Guardrails (Deep Dive)", () => {
  it("generates deterministic persistent Scout IDs without leaking user UUIDs", () => {
    const id1 = scoutIdFor("user-uuid-12345");
    const id2 = scoutIdFor("user-uuid-12345");
    const id3 = scoutIdFor("user-uuid-67890");

    expect(id1).toMatch(/^SCOUT-\d{4}$/);
    expect(id1).toBe(id2); // Deterministic
    expect(id1).not.toBe(id3); // Different accounts get different pseudonyms
    expect(scoutIdFor("")).toBe(null);
    expect(scoutIdFor(null)).toBe(null);
  });

  it("completely strips author name and database UUID when is_anonymous is true", () => {
    const row = {
      id: "sig-test-anon",
      author_account_id: "private-db-uuid-8888",
      scout_id_snapshot: "SCOUT-7777",
      public_identity_mode: "anonymous",
      signal_type: SIGNAL_TYPES.LOOKING_FOR,
      title: "Private Corporate Expansion Requirement",
      body: "Confidential corporate mandate for 2,000 sqm office.",
      last_confirmed_at: "2026-10-28T00:00:00Z",
      created_at: "2026-10-28T00:00:00Z",
    };

    const card = mapDbSignalToCard(row, { district: "BGC", city: "Taguig" }, {}, new Date("2026-10-28T01:00:00Z"), "viewer-uuid");

    expect(card.author.scoutId).toBe("SCOUT-7777");
    expect(card.author.mode).toBe("anonymous");
    expect(card.author.name).toBeUndefined(); // Author name MUST NOT exist on card
    expect(card).not.toHaveProperty("author_account_id"); // UUID MUST NOT leak
    expect(card.author).not.toHaveProperty("author_account_id");
    expect(card.author).not.toHaveProperty("id");
  });

  it("exposes public profile name only when explicitly posted in public mode", () => {
    const row = {
      id: "sig-test-public",
      author_account_id: "user-uuid-public",
      author_display_name: "Ayala Land Commercial",
      scout_id_snapshot: "SCOUT-1234",
      public_identity_mode: "public",
      signal_type: SIGNAL_TYPES.UPCOMING_SUPPLY,
      title: "New Grade-A Tower Floor Handover",
      body: "High-zone floors ready for fit-out.",
      last_confirmed_at: "2026-10-28T00:00:00Z",
      created_at: "2026-10-28T00:00:00Z",
    };

    const card = mapDbSignalToCard(row, { district: "Makati CBD" }, {}, new Date("2026-10-28T01:00:00Z"));

    expect(card.author.mode).toBe("public");
    expect(card.author.name).toBe("Ayala Land Commercial");
    expect(card.author.scoutId).toBe("SCOUT-1234");
  });
});

describe("Zero-Knowledge Behavioral Trust Standing (Deep Dive)", () => {
  const baseRow = {
    id: "sig-bk-test",
    author_account_id: "user-uuid-999",
    scout_id_snapshot: "SCOUT-9999",
    public_identity_mode: "anonymous",
    signal_type: SIGNAL_TYPES.LOOKING_FOR,
    title: "Demand Mandate",
    body: "Office demand.",
    last_confirmed_at: "2026-10-28T00:00:00Z",
    created_at: "2026-10-28T00:00:00Z",
  };

  it("applies the Honest Blank Rule for new users with zero transaction metrics", () => {
    const card = mapDbSignalToCard(baseRow, {}, {}, new Date("2026-10-28T01:00:00Z"), null, false, null);

    expect(card.author.trustTier).toBe("[First-Time Verified Seeker]");
    expect(card.author.behavioralBadge).toBe("[First-Time Verified Seeker]");
    expect(card.author.behavioralScore).toBe(null);
    expect(card.author.verified).toBe(false);
  });

  it("renders verified behavioral index for seasoned platform participants", () => {
    const authorMetrics = {
      user_id: "user-uuid-999",
      tier: "resident",
      display_badge: "[Verified Resident]",
      composite_score: 92.4,
      transaction_count: 8,
    };

    const card = mapDbSignalToCard(baseRow, {}, {}, new Date("2026-10-28T01:00:00Z"), null, false, authorMetrics);

    expect(card.author.trustTier).toBe("[Verified Resident] · 92 Index");
    expect(card.author.behavioralBadge).toBe("[Verified Resident]");
    expect(card.author.behavioralScore).toBe(92.4);
    expect(card.author.transactionCount).toBe(8);
    expect(card.author.verified).toBe(true);
  });
});

describe("Multi-Station Catchment Radius Engine (Deep Dive)", () => {
  it("normalizes coverage radius and stores radius:Xkm in requirements.mustHave", () => {
    const input = {
      authorAccountId: "user-uuid-1",
      signalType: SIGNAL_TYPES.LOOKING_FOR,
      title: "Beachfront Resort Boutique Hotel Site",
      body: "Looking for beachfront commercial space in Boracay.",
      city: "Malay",
      district: "Boracay",
      transactionType: "lease",
      coverageRadius: 3.5,
      mustHave: ["Beachfront Access", "Commercial Title"],
    };

    const { ok, errors, normalized } = validateDraft(input);

    expect(ok).toBe(true);
    expect(errors.length).toBe(0);
    expect(normalized.coverageRadius).toBe(3.5);
    expect(normalized.mustHave).toContain("radius:3.5km");
    expect(normalized.mustHave).toContain("Beachfront Access");
  });

  it("derives radiusKm and unlocks radar coordinates for wide-area district signals", () => {
    const row = {
      id: "sig-boracay-multi-station",
      author_account_id: "user-uuid-boracay",
      scout_id_snapshot: "SCOUT-3333",
      public_identity_mode: "anonymous",
      signal_type: SIGNAL_TYPES.LOOKING_FOR,
      title: "Commercial Space across Stations 1, 2, and 3",
      body: "Seeking high foot traffic retail space anywhere along White Beach.",
      last_confirmed_at: "2026-10-28T00:00:00Z",
      created_at: "2026-10-28T00:00:00Z",
    };

    const location = {
      district: "Boracay",
      city: "Malay",
      precision_level: "district", // Not exact! But wide area radius unlocks it
      lat: 11.9674,
      lng: 121.9248,
    };

    const requirements = {
      transaction_type: "lease",
      must_have: ["Beachfront Access", "radius:3.5km"],
    };

    const card = mapDbSignalToCard(row, location, requirements, new Date("2026-10-28T01:00:00Z"));

    expect(card.radiusKm).toBe(3.5);
    expect(card.location).toBe("Boracay (3.5km radius)");
    expect(card.coords).toEqual({ lat: 11.9674, lng: 121.9248 });
    expect(card.glyphType).toBe("pulse");
    expect(card.glyphData).toEqual({ radiusM: 3500 });
  });

  it("generates 36-segment smooth polygon ground rings in generateBeaconGeoJSON for wide areas", () => {
    const wideSignal = {
      id: "sig-wide-1",
      signalType: SIGNAL_TYPES.LOOKING_FOR,
      title: "Wide Area Demand",
      district: "Boracay",
      coords: { lat: 11.9674, lng: 121.9248 },
      radiusKm: 3.5,
      relevantCount: 15,
    };

    const { groundRings, beacons } = generateBeaconGeoJSON([wideSignal]);

    expect(groundRings.features.length).toBe(1);
    const ring = groundRings.features[0];
    expect(ring.properties.radiusKm).toBe(3.5);

    // 36 segments + 1 closing point = 37 coordinate pairs
    const coords = ring.geometry.coordinates[0];
    expect(coords.length).toBe(37);

    // Beacons pillar should also be generated
    expect(beacons.features.length).toBe(1);
  });
});

describe("Anti-Disintermediation Contact Dumping Defense", () => {
  it("blocks phone numbers, email addresses, and social handles from signal drafts", () => {
    const badDrafts = [
      { field: "email in body", body: "Contact me at dealmaker@gmail.com for details." },
      { field: "PH mobile", body: "Call me directly at 0917-888-9999 for inquiries." },
      { field: "international mobile", body: "WhatsApp or call +639181234567 anytime." },
      { field: "telegram handle", body: "Message me on telegram: @philsurvey to negotiate." },
      { field: "viber mention", body: "Reach me on viber @makatibroker." },
    ];

    for (const draft of badDrafts) {
      const { ok, errors } = validateDraft({
        authorAccountId: "user-1",
        signalType: SIGNAL_TYPES.LOOKING_FOR,
        title: "Legitimate Title",
        body: draft.body,
        city: "Taguig",
        district: "BGC",
        transactionType: "lease",
      });

      expect(ok, `Should have failed for ${draft.field}`).toBe(false);
      expect(errors.some((e) => e.code === "CONTACT_DUMP")).toBe(true);
    }
  });
});
