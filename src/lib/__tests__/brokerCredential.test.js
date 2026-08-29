import { CREDENTIAL_STATES, buildBrokerCredential } from "@/lib/brokerCredential";

// ─────────────────────────────────────────────────────────────────────────
// RA 9646 (Real Estate Service Act) credential currency.
//
// A PRC real estate broker licence is valid for THREE YEARS and must be
// renewed with CPD units. ScoutIt's public badge came from a single Airtable
// checkbox, `License_Verified`, ticked once by staff — with no expiry
// component anywhere in the projection. A broker whose licence lapsed in 2024
// would still render "✓ PRC VERIFIED" today, and the dossier's JSON-LD would
// still assert `RealEstateAgent` with a `hasCredential` block.
//
// Asserting a current professional licence for someone whose licence has
// expired is a licensing claim, not a formatting bug. These tests make the
// badge depend on the expiry date, and make "we do not know" its own state
// rather than a silent pass (Rule 14: a NULL is never an assertion).
// ─────────────────────────────────────────────────────────────────────────

const NOW = "2026-08-27T00:00:00.000Z";

const build = (over = {}) =>
  buildBrokerCredential({
    identity: { license: "PRC-0012345", licenseVerified: true, ...over.identity },
    record: over.record === undefined
      ? { prcExpiry: "2027-06-30", prcVerifiedAt: "2026-01-15T00:00:00.000Z" }
      : over.record,
    now: NOW,
  });

describe("RA 9646 credential currency", () => {
  it("publishes a verified badge only while the licence is unexpired", () => {
    const credential = build();
    expect(credential.state).toBe(CREDENTIAL_STATES.VERIFIED_CURRENT);
    expect(credential.canAssertLicensedProfession).toBe(true);
    expect(credential.license).toBe("PRC-0012345");
  });

  it("stops claiming verification once the licence has expired", () => {
    const credential = build({ record: { prcExpiry: "2024-06-30" } });
    expect(credential.state).toBe(CREDENTIAL_STATES.EXPIRED);
    expect(credential.canAssertLicensedProfession).toBe(false);
    // The label must say what is actually true, not simply go blank.
    expect(credential.label).toMatch(/lapsed|expired/i);
  });

  it("treats an unknown expiry as unknown, never as current", () => {
    // Staff ticked the box at some point; without an expiry we cannot say the
    // licence is current today.
    const credential = build({ record: { prcExpiry: null, prcVerifiedAt: "2026-01-15T00:00:00.000Z" } });
    expect(credential.state).toBe(CREDENTIAL_STATES.VERIFIED_UNDATED);
    expect(credential.canAssertLicensedProfession).toBe(false);
    expect(credential.label).toMatch(/2026/);
  });

  it("treats an unreadable credential record as unknown, never as current", () => {
    const credential = build({ record: null });
    expect(credential.canAssertLicensedProfession).toBe(false);
    expect(credential.state).not.toBe(CREDENTIAL_STATES.VERIFIED_CURRENT);
  });

  it("never verifies a broker staff have not verified at all", () => {
    const credential = build({
      identity: { license: "PRC-0012345", licenseVerified: false },
      record: { prcExpiry: "2027-06-30" },
    });
    expect(credential.state).toBe(CREDENTIAL_STATES.UNVERIFIED);
    expect(credential.canAssertLicensedProfession).toBe(false);
    // An unverified licence number is not published; it would lend the number
    // authority nobody granted it.
    expect(credential.license).toBeNull();
  });

  it("expires exactly on the day after the expiry date, tested against a fixed instant", () => {
    // Rule 11: time-dependent logic uses an injected instant.
    const lastDay = buildBrokerCredential({
      identity: { license: "PRC-1", licenseVerified: true },
      record: { prcExpiry: "2026-08-27" },
      now: "2026-08-27T23:00:00.000Z",
    });
    const dayAfter = buildBrokerCredential({
      identity: { license: "PRC-1", licenseVerified: true },
      record: { prcExpiry: "2026-08-27" },
      now: "2026-08-28T01:00:00.000Z",
    });
    expect(lastDay.state).toBe(CREDENTIAL_STATES.VERIFIED_CURRENT);
    expect(dayAfter.state).toBe(CREDENTIAL_STATES.EXPIRED);
  });

  it("only a current verified licence may back a licensed-profession claim", () => {
    for (const record of [
      { prcExpiry: "2024-01-01" },
      { prcExpiry: null },
      null,
    ]) {
      expect(build({ record }).canAssertLicensedProfession).toBe(false);
    }
  });
});
