import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { intelSourceLabel } from "@/lib/freshness";

// A-067 — CommercialFlow.js:2335 and ResidentialFlow.js:2064 each rendered a
// sidebar field labelled "Intel source" whose value was the hardcoded string
// "ScoutIt Verified". It was derived from nothing: every property asserted it,
// on every render. Measured live when the item was opened, `one-ecom-center`
// has no `last_verified_date` at all and its page still claimed ScoutIt had
// verified its intel.
//
// `last_verified_date` is the attestation the Data Dictionary already
// describes, written to Airtable and Supabase together by the verification
// writer. The field now reports it.

const read = (relativePath) => fs.readFileSync(relativePath, "utf8");
const FLOWS = ["src/components/property/CommercialFlow.js", "src/components/property/ResidentialFlow.js"];
const NOW = new Date("2026-09-03T00:00:00.000Z").getTime();

describe("A-067 · the Intel source field reports a verification, never asserts one", () => {
  it("states the unverified case as a value, not as a blank (Honest Blank Rule)", () => {
    expect(intelSourceLabel(null, NOW)).toBe("Owner-submitted — not yet verified");
    expect(intelSourceLabel(undefined, NOW)).toBe("Owner-submitted — not yet verified");
    expect(intelSourceLabel("", NOW)).toBe("Owner-submitted — not yet verified");
  });

  it("never claims ScoutIt verification without a verification record behind it", () => {
    expect(intelSourceLabel(null, NOW)).not.toMatch(/ScoutIt Verified/);
    expect(intelSourceLabel("not-a-date", NOW)).not.toMatch(/ScoutIt Verified/);
  });

  it("reports the freshness the attestation actually carries when there is one", () => {
    expect(intelSourceLabel("2026-09-03T00:00:00.000Z", NOW)).toBe("ScoutIt verified today");
    expect(intelSourceLabel("2026-09-02T00:00:00.000Z", NOW)).toBe("ScoutIt verified yesterday");
    expect(intelSourceLabel("2026-08-31T00:00:00.000Z", NOW)).toBe("ScoutIt verified 3 days ago");
    expect(intelSourceLabel("2026-06-03T00:00:00.000Z", NOW)).toBe("ScoutIt verified 3 months ago");
  });

  it("treats an unparseable date as unverified rather than as fresh", () => {
    expect(intelSourceLabel("not-a-date", NOW)).toBe("Owner-submitted — not yet verified");
  });
});

describe("A-067 · both property flows changed together and cannot drift apart", () => {
  it.each(FLOWS)("%s derives the field instead of hardcoding a claim", (flow) => {
    const source = read(flow);
    expect(source).toContain("intelSourceLabel(d.last_verified_date)");
    expect(source).not.toContain(">ScoutIt Verified<");
  });

  it("does not assert a professional verification from a hardcoded string either", () => {
    // Not named by A-067, found by reading the rendered page while verifying
    // it: a field literally labelled "Verification" whose value was the
    // constant "ScoutIT Pros", in both flows. Same acceptance criterion —
    // no property asserts verification without a record behind it.
    for (const flow of FLOWS) {
      const source = read(flow);
      expect(source).not.toContain(">ScoutIT Pros<");
      expect(source).toContain('<div className="sidebar-label">Verification</div><div className="sidebar-value">{intelSourceLabel(d.last_verified_date)}</div>');
    }
  });

  it("no property surface asserts verification from a missing field", () => {
    for (const flow of FLOWS) {
      const source = read(flow);
      // `d.zoning_type || "Verified Commercial"` is the same defect shape one
      // line above the reported one: it asserts a verified zoning class for a
      // listing whose zoning is simply unrecorded.
      expect(source).not.toContain('"Verified Commercial"');
    }
  });

  it("renders the identical field in both flows, so a future edit to one is visible", () => {
    const field = /<div className="sidebar-block"><div className="sidebar-label">Intel source<\/div><div className="sidebar-value">\{intelSourceLabel\(d\.last_verified_date\)\}<\/div><\/div>/;
    for (const flow of FLOWS) expect(read(flow)).toMatch(field);
  });
});
