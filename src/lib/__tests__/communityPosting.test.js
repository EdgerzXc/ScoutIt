import { describe, it, expect } from "vitest";
import {
  scoutIdFor,
  validateDraft,
  freshnessFor,
  capacityCheck,
  capacityFor,
  POSTABLE_SIGNAL_TYPES,
} from "../communityPosting";

const GOOD = {
  authorAccountId: "user-123",
  signalType: "LOOKING_FOR",
  title: "1,200 sqm cold-chain hub near C5",
  body: "Need 8m ceiling and truck ingress. Q4 move.",
  city: "Taguig",
  district: "BGC",
  identityMode: "anonymous",
};

describe("community posting — persistent Scout ID", () => {
  it("derives a stable SCOUT-#### per account with no account text in it", () => {
    const a = scoutIdFor("user-123");
    expect(a).toMatch(/^SCOUT-[0-9]{4}$/);
    expect(scoutIdFor("user-123")).toBe(a);
    expect(scoutIdFor("user-456")).not.toBe(a);
    expect(a).not.toContain("user-123");
  });

  it("refuses empty accounts instead of minting a guest identity", () => {
    expect(scoutIdFor("")).toBe(null);
    expect(scoutIdFor(null)).toBe(null);
  });
});

describe("community posting — hard rules", () => {
  it("accepts a complete honest draft and normalizes it", () => {
    const { ok, errors, normalized } = validateDraft(GOOD);
    expect(ok).toBe(true);
    expect(errors).toEqual([]);
    expect(normalized.precisionLevel).toBe("district");
    expect(normalized.commercialFlag).toBe(false);
  });

  it("flags commercial promotion without boosting it", () => {
    const { ok, normalized } = validateDraft({ ...GOOD, signalType: "COMMERCIAL_PROMOTION" });
    expect(ok).toBe(true);
    expect(normalized.commercialFlag).toBe(true);
  });

  it("refuses system-only intelligence from members", () => {
    const { ok, errors } = validateDraft({ ...GOOD, signalType: "SCOUTIT_INTELLIGENCE" });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.code === "BAD_TYPE")).toBe(true);
  });

  it("blocks contact dumping with a Connect redirect, not a bare refusal", () => {
    for (const body of [
      "Call me at 0917 123 4567 any time",
      "Email juan@example.com for details",
      "DM my telegram @juan_deals fast",
    ]) {
      const { ok, errors } = validateDraft({ ...GOOD, body });
      expect(ok).toBe(false);
      const dump = errors.find((e) => e.code === "CONTACT_DUMP");
      expect(dump).toBeTruthy();
      expect(dump.message).toMatch(/Connect/);
    }
  });

  it("never mistakes a rent figure for a phone number", () => {
    const { ok, errors } = validateDraft({ ...GOOD, body: "Budget ₱1,200/sqm, need 500 sqm near Ortigas." });
    expect(errors.some((e) => e.code === "CONTACT_DUMP")).toBe(false);
    expect(ok).toBe(true);
  });

  it("catches email drops too", () => {
    const { ok, errors } = validateDraft({ ...GOOD, body: "Email juan@example.com for floor plans." });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.code === "CONTACT_DUMP")).toBe(true);
  });

  it("still catches real handle drops while sparing place names", () => {
    const caught = validateDraft({ ...GOOD, body: "Message my telegram @juan_deals for floor plans." });
    expect(caught.errors.some((e) => e.code === "CONTACT_DUMP")).toBe(true);
    const atHandle = validateDraft({ ...GOOD, body: "Reach @juan_deals anytime." });
    expect(atHandle.errors.some((e) => e.code === "CONTACT_DUMP")).toBe(true);
  });

  it("redirects listing-shaped drafts to Metropolis instead of publishing", () => {
    const { ok, errors } = validateDraft({
      ...GOOD,
      title: "Corner retail for lease",
      body: "450 sqm corner retail for lease at ₱3,200/sqm. Prime frontage.",
    });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.code === "LISTING_SHAPED")).toBe(true);
  });

  it("requires a place — activity without location is not intelligence", () => {
    const { ok, errors } = validateDraft({ ...GOOD, city: "", district: "" });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.code === "NO_LOCATION")).toBe(true);
  });

  it("rejects off-map coordinates without guessing", () => {
    const { ok, errors, normalized } = validateDraft({ ...GOOD, lat: 999, lng: 200 });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.code === "BAD_COORDS")).toBe(true);
    expect(normalized.lat).toBe(null);
    expect(normalized.coords).toBe(undefined);
  });

  it("caps links at one", () => {
    const { ok, errors } = validateDraft({
      ...GOOD,
      body: "See https://a.example and https://b.example for comps.",
    });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.code === "TOO_MANY_LINKS")).toBe(true);
  });
});

describe("community posting — freshness and capacity", () => {
  const now = new Date("2026-09-24T12:00:00Z");
  const daysAgo = (n) => new Date(now.getTime() - n * 86_400_000).toISOString();

  it("decays fresh → active → aging → expired on fixed instants", () => {
    expect(freshnessFor(daysAgo(0), now)).toBe("fresh");
    expect(freshnessFor(daysAgo(7), now)).toBe("fresh");
    expect(freshnessFor(daysAgo(8), now)).toBe("active");
    expect(freshnessFor(daysAgo(22), now)).toBe("aging");
    expect(freshnessFor(daysAgo(31), now)).toBe("expired");
  });

  it("holds brokers to 10, owners to 5, everyone else to 3", () => {
    expect(capacityFor("broker")).toBe(10);
    expect(capacityFor("owner")).toBe(5);
    expect(capacityFor("standard")).toBe(3);
    expect(capacityCheck(3, "standard").allowed).toBe(false);
    expect(capacityCheck(2, "standard").allowed).toBe(true);
  });
});

describe("community posting — launch set discipline", () => {
  it("offers exactly the seven member types (system intel excluded)", () => {
    expect(POSTABLE_SIGNAL_TYPES).toHaveLength(7);
    expect(POSTABLE_SIGNAL_TYPES).not.toContain("SCOUTIT_INTELLIGENCE");
  });
});
