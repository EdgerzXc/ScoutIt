import { describe, it, expect } from "vitest";
import {
  extractFacts,
  factSpecs,
  briefingShape,
  buildShareText,
  xLength,
  X_LIMIT,
  buildPromoPack,
} from "../shareBriefing";

// ═══════════════════════════════════════════════════════════════
// shareBriefing is described in its own header as "the ONE source of factual
// promotional copy" and had no test file at all before 2026-08-13 — including
// no test for the compliance rule it exists to enforce.
//
// The money rule below is the important one. It is a real-estate-law constraint
// (money renders only in the property page's "Your Move" section), and a
// comment cannot enforce it. If someone adds a price line to share copy, that
// test must be what stops them.
// ═══════════════════════════════════════════════════════════════

const FULL_COMMERCIAL = {
  title: "Cyber Sigma Tower 3",
  slug: "cyber-sigma-tower-3",
  spaceCategory: "Commercial",
  location: "McKinley West, Taguig City",
  sqm: 1500,
  building_grade: "Grade A",
  // Money fields deliberately present — a listing that HAS a price is the only
  // meaningful test of the rule that a price must never reach share copy.
  price: "₱ 1,250,000 / month",
  price_php: 1250000,
  monthly_rent: "PHP 1,250,000",
  asking_price: "$25,000",
};

// The real One E-Com Center shape, measured on production 2026-08-13: category
// and location on record, no floor area anywhere, so factSpecs() returns [].
const SPARSE_COMMERCIAL = {
  title: "One E-Com Center",
  slug: "one-ecom-center",
  spaceCategory: "Commercial",
  location: "Mall of Asia Complex, Pasay City",
};

// Currency symbols, currency words, and comma-grouped or decimal amounts.
//
// Deliberately NOT "any 4+ digit number": a floor area is legitimately four
// digits ("1500 sqm") and a rule that flags it would either fail honest copy or
// get loosened until it caught nothing. Money in this codebase always arrives
// with a symbol, a currency word, comma grouping, or cents.
const MONEY = /[₱$€£¥]|\bPHP\b|\bUSD\b|\bpesos?\b|\brent\b|\bprice\b|\d{1,3}(?:,\d{3})+|\d+\.\d{2}\b/i;

describe("shareBriefing — the money compliance rule", () => {
  it("never emits a monetary value in the briefing, for a property that has prices", () => {
    const text = buildShareText(FULL_COMMERCIAL, "https://www.scoutit.space/property/cyber-sigma-tower-3");
    expect(text).not.toMatch(MONEY);
    expect(text).not.toContain("1,250,000");
    expect(text).not.toContain("25,000");
  });

  it("never emits a monetary value in any promo format", () => {
    const pack = buildPromoPack(FULL_COMMERCIAL, "https://www.scoutit.space/property/cyber-sigma-tower-3");
    Object.values(pack).forEach((copy) => {
      expect(copy).not.toMatch(MONEY);
    });
  });

  it("does not extract any price field into the fact sheet", () => {
    const facts = extractFacts(FULL_COMMERCIAL);
    const serialized = JSON.stringify(facts);
    expect(serialized).not.toMatch(MONEY);
  });
});

describe("shareBriefing — buildShareText", () => {
  it("uses the full briefing shape when specs exist", () => {
    const url = "https://www.scoutit.space/property/cyber-sigma-tower-3";
    const text = buildShareText(FULL_COMMERCIAL, url);
    expect(text).toContain("■ MARKET INTELLIGENCE BRIEFING");
    expect(text).toContain("Cyber Sigma Tower 3");
    expect(text).toContain("▸ Category: Commercial");
    expect(text).toContain("▸ Location: McKinley West, Taguig City");
    expect(text).toContain("1500 sqm");
    expect(text).toContain("Grade A building");
    expect(text).toContain(url);
    expect(text).toContain("#ScoutIt");
  });

  it("degrades to the compact shape when no specs are on record", () => {
    // Regression guard for the measured One E-Com Center case: a
    // "MARKET INTELLIGENCE BRIEFING" header over two bullets undersells the
    // platform, so the sparse listing gets an honest shorter form instead.
    const url = "https://www.scoutit.space/property/one-ecom-center";
    const text = buildShareText(SPARSE_COMMERCIAL, url);
    expect(briefingShape(extractFacts(SPARSE_COMMERCIAL))).toBe("compact");
    expect(text).not.toContain("MARKET INTELLIGENCE BRIEFING");
    expect(text).not.toContain("complete operational briefing");
    expect(text).toContain("One E-Com Center — Commercial");
    expect(text).toContain("Mall of Asia Complex, Pasay City");
    expect(text).toContain(url);
  });

  it("invents nothing to reach the richer shape", () => {
    const text = buildShareText(SPARSE_COMMERCIAL, "https://x.test/p");
    expect(text).not.toMatch(/sqm/i);
    expect(text).not.toMatch(/grade/i);
    expect(text).not.toMatch(/approx|estimated|around|circa/i);
  });

  it("survives an empty property without throwing", () => {
    expect(() => buildShareText({}, "https://x.test/p")).not.toThrow();
    expect(buildShareText({}, "https://x.test/p")).toContain("https://x.test/p");
  });
});

describe("shareBriefing — factSpecs category branching", () => {
  it("commercial leads with building grade, then area", () => {
    expect(factSpecs(extractFacts({ spaceCategory: "Commercial", building_grade: "Grade A", sqm: 900 })))
      .toEqual(["Grade A building", "900 sqm"]);
  });

  it("office is treated as commercial", () => {
    expect(factSpecs(extractFacts({ spaceCategory: "Office", building_grade: "Grade B", sqm: 120 })))
      .toEqual(["Grade B building", "120 sqm"]);
  });

  it("restaurant leads with seats", () => {
    expect(factSpecs(extractFacts({ spaceCategory: "Restaurant", seating_capacity: 80, sqm: 200 })))
      .toEqual(["80 seats", "200 sqm"]);
  });

  it("venue prefers seated capacity, falling back to standing", () => {
    expect(factSpecs(extractFacts({ spaceCategory: "Venue", seating_capacity: 300, standing_capacity: 500 })))
      .toEqual(["300 seated"]);
    expect(factSpecs(extractFacts({ spaceCategory: "Venue", standing_capacity: 500 })))
      .toEqual(["500 pax"]);
  });

  it("hospitality leads with keys", () => {
    expect(factSpecs(extractFacts({ spaceCategory: "Hospitality", hosting_capacity: 42, sqm: 3000 })))
      .toEqual(["42 keys", "3000 sqm"]);
  });

  it("residential falls through to beds and baths", () => {
    expect(factSpecs(extractFacts({ spaceCategory: "Residential", beds: 3, baths: 2, sqm: 88 })))
      .toEqual(["3 BR", "2 bath", "88 sqm"]);
  });

  it("returns nothing when nothing is recorded", () => {
    expect(factSpecs(extractFacts(SPARSE_COMMERCIAL))).toEqual([]);
  });
});

describe("shareBriefing — buildPromoPack", () => {
  it("returns all three formats, non-empty, each carrying the link", () => {
    const link = "https://www.scoutit.space/property/cyber-sigma-tower-3";
    const pack = buildPromoPack(FULL_COMMERCIAL, link);
    ["fastPitch", "executiveSummary", "editorialHook"].forEach((key) => {
      expect(typeof pack[key]).toBe("string");
      expect(pack[key].trim().length).toBeGreaterThan(0);
      expect(pack[key]).toContain(link);
    });
  });

  it("keeps the fast pitch inside the 280-character limit", () => {
    const pack = buildPromoPack(FULL_COMMERCIAL, "https://www.scoutit.space/property/cyber-sigma-tower-3");
    expect(pack.fastPitch.length).toBeLessThanOrEqual(280);
  });

  it("still returns three usable formats for a sparse listing", () => {
    const pack = buildPromoPack(SPARSE_COMMERCIAL, "https://x.test/p");
    ["fastPitch", "executiveSummary", "editorialHook"].forEach((key) => {
      expect(pack[key].trim().length).toBeGreaterThan(0);
    });
  });
});

describe("shareBriefing — extractFacts field aliasing", () => {
  it("reads specs out of a JSON-string details blob", () => {
    const facts = extractFacts({
      title: "Aliased Tower",
      details: JSON.stringify({ Floor_Area_Sqm: 640, Building_Grade: "Grade A", location: "BGC, Taguig" }),
      spaceCategory: "Commercial",
    });
    expect(facts.sqm).toBe(640);
    expect(facts.buildingGrade).toBe("Grade A");
    expect(facts.location).toBe("BGC, Taguig");
  });

  it("does not throw on malformed details JSON", () => {
    expect(() => extractFacts({ details: "{not json" })).not.toThrow();
  });
});

describe("shareBriefing - X length budget", () => {
  // A UTM-tagged property URL is ~105 characters, but X rewrites every link
  // through t.co, so it always costs 23. Counting raw `.length` would shorten
  // copy that already fits.
  const X_URL =
    "https://www.scoutit.space/property/cyber-sigma-tower-3?utm_source=x&utm_medium=social&utm_campaign=share";

  it("counts a link as 23 characters, not its real length", () => {
    const text = `head\n${X_URL}`;
    expect(text.length).toBeGreaterThan(100);
    expect(xLength(text, X_URL)).toBe("head\n".length + 23);
  });

  it("keeps the full briefing for every channel except X", () => {
    const text = buildShareText(FULL_COMMERCIAL, X_URL);
    expect(text).toContain("MARKET INTELLIGENCE BRIEFING");
    expect(xLength(text, X_URL)).toBeGreaterThan(X_LIMIT);
  });

  it("fits X, and still carries only facts the listing has", () => {
    const text = buildShareText(FULL_COMMERCIAL, X_URL, { limit: "x" });
    expect(xLength(text, X_URL)).toBeLessThanOrEqual(X_LIMIT);
    expect(text).toContain("Cyber Sigma Tower 3");
    expect(text).toContain(X_URL);
    // the compliance rule survives the shorter shape
    expect(text).not.toMatch(/1,250,000|25,000|PHP|₱|\$/);
  });

  it("leaves copy alone when it already fits X", () => {
    const short = { title: "A", spaceCategory: "Office" };
    const url = "https://x.test/p";
    expect(buildShareText(short, url, { limit: "x" })).toBe(buildShareText(short, url));
  });
});
