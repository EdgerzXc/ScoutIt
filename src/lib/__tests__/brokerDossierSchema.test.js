import {
  buildBrokerDossierJsonLd,
  brokerDossierRobots,
} from "@/lib/brokerDossierSchema";

// ─────────────────────────────────────────────────────────────────────────
// A-023 phase 6 — structured data for the broker dossier.
//
// This file inherits a lesson the repo already paid for: the site-wide schema
// asserted "@type": "RealEstateAgent" until 2026-08-08, directly contradicting
// /terms, which states ScoutIt is strictly NOT a real estate broker under
// RA 9646. Asserting a licensed profession in machine-readable data is a
// licensing claim, not a formatting choice.
//
// So the rule here: a broker is a `Person` unless staff have actually verified
// the PRC licence, and only then may the licensed type be asserted.
//
// The second rule: never emit `aggregateRating`. Google renders it as stars.
// A-023 forbids shipping a star average, and emitting one in JSON-LD would put
// stars in search results that the page itself refuses to show.
// ─────────────────────────────────────────────────────────────────────────

const identity = (over = {}) => ({
  id: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
  name: "Marco Villanueva",
  title: "Commercial Advisor",
  specialty: "Office Towers",
  location: "Makati CBD, Metro Manila",
  bio: "Fifteen years across Makati and BGC office leasing.",
  image: "https://example.com/portrait.jpg",
  license: "PRC-0001",
  licenseVerified: false,
  clearanceTier: "Level 1",
  isExample: false,
  ...over,
});

describe("A-023 broker structured data never asserts an unverified licence", () => {
  it("describes an unverified broker as a Person, not a RealEstateAgent", () => {
    const schema = buildBrokerDossierJsonLd({ identity: identity() });
    expect(schema["@type"]).toBe("Person");
    expect(JSON.stringify(schema)).not.toContain("RealEstateAgent");
  });

  // RE-AIMED 2026-08-27. This originally accepted a staff tick alone, which is
  // exactly the defect: RA 9646 licences expire after three years, so
  // `licenseVerified` says only that someone checked once. The licensed type
  // now requires a CURRENT licence (Rule 14 — the test is part of the change).
  it("asserts the licensed type only for a verified AND unexpired licence", () => {
    const schema = buildBrokerDossierJsonLd({
      identity: identity({ licenseVerified: true }),
      credential: { canAssertLicensedProfession: true },
    });
    expect(schema["@type"]).toBe("RealEstateAgent");
    expect(schema.hasCredential?.identifier).toBe("PRC-0001");
  });

  it("refuses the licensed type when the licence has lapsed", () => {
    const schema = buildBrokerDossierJsonLd({
      identity: identity({ licenseVerified: true }),
      credential: { canAssertLicensedProfession: false },
    });
    expect(schema["@type"]).toBe("Person");
    expect(JSON.stringify(schema)).not.toContain("RealEstateAgent");
    expect(JSON.stringify(schema)).not.toContain("PRC-0001");
  });

  it("refuses the licensed type when credential state could not be read", () => {
    const schema = buildBrokerDossierJsonLd({ identity: identity({ licenseVerified: true }) });
    expect(schema["@type"]).toBe("Person");
  });

  it("never publishes the licence number for an unverified broker", () => {
    const schema = buildBrokerDossierJsonLd({ identity: identity({ licenseVerified: false }) });
    expect(JSON.stringify(schema)).not.toContain("PRC-0001");
  });
});

describe("A-023 broker structured data never manufactures a rating", () => {
  it("emits no aggregateRating even when metrics are fully qualified", () => {
    const schema = buildBrokerDossierJsonLd({
      identity: identity(),
      record: {
        state: "qualified",
        metrics: [{ key: "transactions", state: "published", value: 6 }],
      },
    });
    const json = JSON.stringify(schema);
    expect(schema.aggregateRating).toBeUndefined();
    expect(json).not.toMatch(/aggregateRating|ratingValue|reviewCount|bestRating/i);
  });

  it("emits no review objects from client recommendations", () => {
    const schema = buildBrokerDossierJsonLd({
      identity: identity(),
      recommendations: { state: "listed", cards: [{ id: "r1", body: "Great", author: "M.V." }] },
    });
    expect(JSON.stringify(schema)).not.toMatch(/"review"|"Review"/);
  });
});

describe("A-023 broker structured data leaks no contact route", () => {
  it("publishes no email, telephone or direct contact point", () => {
    const json = JSON.stringify(buildBrokerDossierJsonLd({ identity: identity() }));
    expect(json).not.toMatch(/email|telephone|contactPoint|faxNumber/i);
  });

  it("points only at the canonical dossier URL", () => {
    const schema = buildBrokerDossierJsonLd({ identity: identity() });
    expect(schema.url).toContain("/brokers/e7f3634b-65d7-4adc-90ea-0544b61d988d");
    expect(schema.mainEntityOfPage).toContain("/brokers/e7f3634b-65d7-4adc-90ea-0544b61d988d");
  });
});

describe("A-023 example profiles stay out of the search index", () => {
  it("marks an example profile noindex so illustrative data is never indexed", () => {
    // The dossier labels example profiles for humans; robots need the same
    // answer, or seeded demo figures end up in search results.
    expect(brokerDossierRobots(identity({ isExample: true }))).toEqual({
      index: false,
      follow: true,
    });
  });

  it("leaves a real profile indexable", () => {
    expect(brokerDossierRobots(identity({ isExample: false }))).toBeUndefined();
  });

  it("emits no structured data at all for an example profile", () => {
    // Structured data for a fabricated advisor is a machine-readable claim
    // about a person who does not exist.
    expect(buildBrokerDossierJsonLd({ identity: identity({ isExample: true }) })).toBeNull();
  });
});
