import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  COMPLETENESS_UNKNOWN_LABEL,
  completenessScoreOf,
  mapCatalogueListing,
  ownerTenureLabel,
} from "@/lib/dashboardListings";

// A-081 + A-077 — closed together, because they are the same defect reached by
// different paths and fixing one alone lets the other reintroduce the number.
//
// A-081: DashboardContext.js mapped public Airtable catalogue records into the
// dashboard and stamped each one `verified: true`, `completenessScore: 100`,
// `pipelineStatus: 'approved'`, `time: 'Verified'` and a signals object —
// without consulting the record. BrokerMode.js:1094 renders one of those
// constants under the label "Owner Tenure", so every owner read
// "ScoutIt Verified" to every broker assessing whether to take the listing.
//
// A-077: three different fallbacks for one missing measurement — `?? 50`, `?? 0`
// and a hardcoded `100`. 50 is the worst, because it is the value that looks
// computed.

const read = (relativePath) => fs.readFileSync(relativePath, "utf8");

const catalogueRecord = (over = {}) => ({
  id: "recX",
  slug: "one-ecom-center",
  title: "One E-Com Center",
  property_type: "Commercial",
  location: "Pasay",
  tenure: "For Lease",
  ...over,
});

describe("A-081 · a catalogue listing carries only what its record says", () => {
  it("does not report a verification for a record with no verification date", () => {
    const mapped = mapCatalogueListing(catalogueRecord({ last_verified_date: null }));
    expect(mapped.verified).toBe(false);
    expect(JSON.stringify(mapped)).not.toMatch(/ScoutIt Verified/);
  });

  it("reports a verification when the record actually carries one", () => {
    const mapped = mapCatalogueListing(catalogueRecord({ last_verified_date: "2026-07-03" }));
    expect(mapped.verified).toBe(true);
  });

  it("states an unknown completeness as absence, never as a number", () => {
    const mapped = mapCatalogueListing(catalogueRecord());
    expect(mapped.completenessScore).toBeNull();
    const serialized = JSON.stringify(mapped);
    expect(serialized).not.toMatch(/"completenessScore":\s*(100|50)/);
    expect(serialized).not.toMatch(/100%/);
  });

  it("leaves owner tenure absent — a catalogue record has no owner account at all", () => {
    const mapped = mapCatalogueListing(catalogueRecord());
    expect(mapped.signals.accountAge).toBeNull();
  });

  it("drops the unused ownerAge / ownerAgeClass pair rather than leaving it dormant", () => {
    const mapped = mapCatalogueListing(catalogueRecord());
    expect(mapped.signals).not.toHaveProperty("ownerAge");
    expect(mapped.signals).not.toHaveProperty("ownerAgeClass");
    expect(mapped.signals).not.toHaveProperty("completeness");
  });

  it("keeps the two states the record really does establish", () => {
    // Presence in /api/cms means fetchProperties already filtered on
    // Approved_For_ScoutIt, so live-and-approved is read from the record.
    const mapped = mapCatalogueListing(catalogueRecord());
    expect(mapped.tag).toBe("LIVE");
    expect(mapped.pipelineStatus).toBe("approved");
  });
});

describe("A-081 · Owner Tenure shows a real age or says it is unknown", () => {
  it("never invents 'New' for an owner whose account age is unknown", () => {
    expect(ownerTenureLabel(null)).toBe(COMPLETENESS_UNKNOWN_LABEL);
    expect(ownerTenureLabel(undefined)).toBe(COMPLETENESS_UNKNOWN_LABEL);
  });

  it("reports a real account age when one exists", () => {
    expect(ownerTenureLabel("2 years")).toBe("2 years");
  });

  it("BrokerMode reads the shared label instead of defaulting to 'New'", () => {
    const source = read("src/components/dashboard/BrokerMode.js");
    expect(source).toContain("ownerTenureLabel(item.signals?.accountAge)");
    expect(source).not.toContain("item.signals?.accountAge || 'New'");
  });
});

describe("A-077 · one fallback for a missing completeness score, everywhere", () => {
  it("returns the real score when the record has one, including a legitimate 0", () => {
    expect(completenessScoreOf({ completeness_score: 72 })).toBe(72);
    expect(completenessScoreOf({ completeness_score: 0 })).toBe(0);
  });

  it("returns absence — not 50, not 0, not 100 — when the score is missing", () => {
    expect(completenessScoreOf({})).toBeNull();
    expect(completenessScoreOf({ completeness_score: null })).toBeNull();
  });

  it.each([
    "src/context/DashboardContext.js",
    "src/lib/profileClient.js",
    "src/components/profile/panels/OwnerPanel.js",
  ])("%s uses the one fallback rather than its own", (file) => {
    const source = read(file);
    expect(source).toContain("completenessScoreOf");
    expect(source).not.toMatch(/completeness_score\s*\?\?\s*(50|0)\b/);
  });

  it("no dashboard mapping path writes a hardcoded completeness score", () => {
    const source = read("src/context/DashboardContext.js");
    expect(source).not.toMatch(/completenessScore:\s*100/);
    expect(source).not.toContain("completeness: '100%'");
    expect(source).not.toContain("completeness: '50%'");
  });

  it("DashboardContext maps catalogue records through the shared mapper", () => {
    const source = read("src/context/DashboardContext.js");
    expect(source).toContain("mapCatalogueListing");
    expect(source).not.toContain("accountAge: 'ScoutIt Verified'");
  });
});

describe("A-100 — price never carries tenure", () => {
  it("maps no price for a catalogue record, with tenure under its own name", () => {
    const mapped = mapCatalogueListing(catalogueRecord({ tenure: "For Lease", listed_price: "" }));
    expect(mapped.price).toBeNull();
    expect(mapped.tenure).toBe("For Lease");
    expect(mapped.listed_price).toBeNull();
  });

  it("passes a real owner-confirmed listed price through untouched", () => {
    const mapped = mapCatalogueListing(
      catalogueRecord({ tenure: "For Lease", listed_price: "?45,000,000" }),
    );
    expect(mapped.listed_price).toBe("?45,000,000");
    expect(mapped.price).toBeNull();
  });

  it("the briefing price chain cannot resolve a tenure string", () => {
    // BrokerFieldBriefing reads `listed_price ?? price`: with the mapper
    // fixed, neither side can be a tenure value for a catalogue listing.
    const mapped = mapCatalogueListing(catalogueRecord({ tenure: "Freehold" }));
    const priceSource = mapped.listed_price ?? mapped.price ?? null;
    expect(priceSource).toBeNull();
  });

  it("no tenure-to-price alias remains in the mapper", () => {
    expect(read("src/lib/dashboardListings.js")).not.toMatch(/price:\s*p\.tenure/);
  });
});
