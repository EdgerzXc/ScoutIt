import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  kindForSignalType,
  normalizeKeyPart,
  promoDedupeKey,
  demandDedupeKey,
  validateDraft,
} from "../communityPosting";
import { SIGNAL_TYPES } from "../communitySignalsAdapter";

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

// ── Owner decisions 2026-09-26: one surface, two logics ──────────────────
// Promos: same post = same building. Demand: same post = same person.
// Promotions may not run at city scale or larger.

describe("signal kinds", () => {
  it("classifies COMMERCIAL_PROMOTION as promo and everything else as demand", () => {
    expect(kindForSignalType(SIGNAL_TYPES.COMMERCIAL_PROMOTION)).toBe("promo");
    expect(kindForSignalType(SIGNAL_TYPES.LOOKING_FOR)).toBe("demand");
    expect(kindForSignalType(SIGNAL_TYPES.MARKET_OBSERVATION)).toBe("demand");
    expect(kindForSignalType("NOPE")).toBe("demand");
  });

  it("normalizes keys so spelling variants match but places never do", () => {
    expect(normalizeKeyPart("One E-Com Center")).toBe("oneecomcenter");
    expect(normalizeKeyPart("one ecom center")).toBe("oneecomcenter");
    expect(promoDedupeKey("One E-Com Center")).toBe(promoDedupeKey("ONE ECOM CENTER"));
    expect(promoDedupeKey("BGC")).not.toBe(promoDedupeKey("Makati"));
  });

  it("keys demand dedupe on person + want, seeing through case", () => {
    const base = { authorAccountId: "u1", signalType: "LOOKING_FOR", city: "Taguig", district: "BGC" };
    expect(demandDedupeKey(base)).toBe(
      demandDedupeKey({ ...base, city: "taguig", district: "bgc" })
    );
    expect(demandDedupeKey(base)).not.toBe(demandDedupeKey({ ...base, authorAccountId: "u2" }));
    expect(demandDedupeKey(base)).not.toBe(demandDedupeKey({ ...base, district: "Ortigas" }));
    expect(demandDedupeKey(base)).not.toBe(
      demandDedupeKey({ ...base, signalType: "COMMERCIAL_PROMOTION" })
    );
  });
});

describe("promo place specificity (R1)", () => {
  const promo = (over = {}) => ({
    authorAccountId: "u1",
    signalType: SIGNAL_TYPES.COMMERCIAL_PROMOTION,
    title: "Weekend food crawl",
    body: "Five kitchens, one street, Saturday only",
    identityMode: "public",
    ...over,
  });

  it("refuses a city-scale promo with the specificity notice", () => {
    const { ok, errors } = validateDraft(promo({ city: "Taguig", district: "" }));
    expect(ok).toBe(false);
    expect(errors.some((e) => e.code === "PLACE_TOO_BROAD")).toBe(true);
  });

  it("accepts a district promo and a named-building promo", () => {
    expect(validateDraft(promo({ city: "Taguig", district: "BGC" })).ok).toBe(true);
    expect(
      validateDraft(promo({ city: "", district: "", buildingName: "One E-Com Center" })).ok
    ).toBe(true);
  });

  it("still requires a place on demand signals (unchanged)", () => {
    const { ok, errors } = validateDraft({
      authorAccountId: "u1",
      signalType: SIGNAL_TYPES.LOOKING_FOR,
      title: "Need a warehouse",
      body: "Cold chain near the port",
      identityMode: "anonymous",
      city: "",
      district: "",
    });
    expect(ok).toBe(false);
    expect(errors.some((e) => e.code === "NO_LOCATION")).toBe(true);
  });
});

describe("POST route carries the split (contract)", () => {
  const route = read("src/app/api/community/signals/route.js");

  it("gates named-building promos on owner-or-handler authority", () => {
    expect(route).toContain("properties");
    expect(route).toContain("owner_id");
    expect(route).toContain("property_broker_representations");
    expect(route).toContain("isActiveRosterBroker");
    expect(route).toContain("Only the owner or handling broker");
    expect(route).toContain("status: 403");
  });

  it("blocks promo duplicates by building and demand duplicates by person", () => {
    expect(route).toContain("findLivePromoByBuilding");
    expect(route).toContain("findLiveDemandByKey");
    expect(route).toContain("already has a live promo");
    expect(route).toContain("already have this want live");
    expect(route).toContain("status: 409");
    expect(route).toContain("duplicateId");
  });

  it("composer collects the building name for promos", () => {
    const composer = read("src/components/stratosphere/SignalComposer.js");
    expect(composer).toContain("buildingName");
    expect(composer).toContain("COMMERCIAL_PROMOTION");
  });
});
