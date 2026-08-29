import {
  CAREER_SECTION_STATES,
  CAREER_METRIC_KEYS,
  buildCareerHistorySection,
  validateCareerClaim,
} from "@/lib/brokerCareerHistory";

// ─────────────────────────────────────────────────────────────────────────
// A-023 gap G4 — Career History, the SECONDARY template.
//
// This is the most dangerous surface in the workstream, because it is
// broker-authored numbers sitting next to ScoutIt-computed numbers. A-023's
// locked rule is that the two never add, average, normalize or visually merge.
//
// So the tests that matter are the isolation tests: a career claim must never
// change a ScoutIt figure, never carry a rating weight, and never appear
// without saying it is self-reported and stating the period it covers.
//
// Every claim also requires a unit, a coverage period, a source note and an
// explicit attestation. A number with no period is unfalsifiable — "200
// transactions" over an unstated span means nothing.
// ─────────────────────────────────────────────────────────────────────────

const claim = (over = {}) => ({
  id: "c1",
  metricKey: "historical_transactions",
  valueNumeric: 180,
  unit: "transactions",
  coverageStart: "2010-01-01",
  coverageEnd: "2024-12-31",
  sourceNote: "Firm records, Ayala Land brokerage 2010-2024.",
  attestedAt: "2026-08-01T00:00:00.000Z",
  verificationState: "broker_declared",
  publishState: "published",
  withdrawnAt: null,
  ...over,
});

const build = (claims, extra = {}) =>
  buildCareerHistorySection({
    authorityId: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
    lookup: { ok: true, claims },
    ...extra,
  });

describe("A-023 Career History stays isolated from the ScoutIt Record", () => {
  it("carries no rating, score or weight of any kind", () => {
    const section = build([claim()]);
    expect(JSON.stringify(section)).not.toMatch(/score|weight|rating|points|rank|aggregate/i);
  });

  it("labels every published claim as self-reported", () => {
    const section = build([claim()]);
    expect(section.cards[0].provenance).toBe("Broker-declared");
  });

  it("upgrades the label only after a named review, never by attestation alone", () => {
    // Attestation is the broker saying so. Review is ScoutIt saying so.
    const attestedOnly = build([claim({ verificationState: "broker_declared" })]);
    expect(attestedOnly.cards[0].provenance).toBe("Broker-declared");

    const reviewed = build([
      claim({ verificationState: "scoutit_reviewed", reviewedAt: "2026-08-10T00:00:00.000Z" }),
    ]);
    expect(reviewed.cards[0].provenance).toBe("ScoutIt-reviewed");
    expect(reviewed.cards[0].reviewedAt).toBe("2026-08-10T00:00:00.000Z");
  });

  it("always publishes the coverage period beside the number", () => {
    // A historical count without its span is unfalsifiable.
    const section = build([claim()]);
    expect(section.cards[0].coverageLabel).toBe("2010 – 2024");
    expect(section.cards[0].value).toBe(180);
  });
});

describe("A-023 Career History publishability", () => {
  it.each([
    ["never attested", { attestedAt: null }],
    ["still a draft", { publishState: "draft" }],
    ["withdrawn", { withdrawnAt: "2026-08-20T00:00:00.000Z" }],
    ["missing its coverage period", { coverageStart: null, coverageEnd: null }],
    ["missing its source note", { sourceNote: "" }],
    ["missing its unit", { unit: "" }],
  ])("never publishes a claim that is %s", (_label, over) => {
    expect(build([claim(over)]).cards).toHaveLength(0);
  });

  it("publishes a complete, attested, published claim", () => {
    expect(build([claim()]).cards).toHaveLength(1);
  });
});

describe("A-023 Career History section states", () => {
  it("cannot claim emptiness when the dossier is not linked", () => {
    const section = build([], { authorityId: null });
    expect(section.state).toBe(CAREER_SECTION_STATES.NOT_LINKED);
    expect(section.claimsEmptiness).toBe(false);
  });

  it("cannot claim emptiness when the authority could not be read", () => {
    const section = buildCareerHistorySection({
      authorityId: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
      lookup: { ok: false },
    });
    expect(section.state).toBe(CAREER_SECTION_STATES.LOOKUP_FAILED);
    expect(section.claimsEmptiness).toBe(false);
  });

  it("claims emptiness only after the authority answered", () => {
    const section = build([]);
    expect(section.state).toBe(CAREER_SECTION_STATES.NONE_PUBLISHABLE);
    expect(section.claimsEmptiness).toBe(true);
  });
});

describe("A-023 Career History claim validation", () => {
  it("accepts a complete attested claim", () => {
    expect(validateCareerClaim({
      metricKey: "years_practicing",
      valueNumeric: 15,
      unit: "years",
      coverageStart: "2010-01-01",
      coverageEnd: "2025-01-01",
      sourceNote: "PRC licence issued 2010.",
      attested: true,
    }).ok).toBe(true);
  });

  it("rejects an unrecognised metric key rather than storing it", () => {
    const result = validateCareerClaim({
      metricKey: "invented_metric",
      valueNumeric: 1,
      unit: "x",
      coverageStart: "2010-01-01",
      coverageEnd: "2011-01-01",
      sourceNote: "n",
      attested: true,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.metricKey).toBeTruthy();
  });

  it("requires an explicit boolean attestation", () => {
    for (const attested of [undefined, false, "true", 1, null]) {
      const result = validateCareerClaim({
        metricKey: "years_practicing",
        valueNumeric: 15,
        unit: "years",
        coverageStart: "2010-01-01",
        coverageEnd: "2025-01-01",
        sourceNote: "PRC licence issued 2010.",
        attested,
      });
      expect(result.ok).toBe(false);
      expect(result.errors.attested).toBeTruthy();
    }
  });

  it("rejects a coverage period that ends before it starts", () => {
    const result = validateCareerClaim({
      metricKey: "years_practicing",
      valueNumeric: 15,
      unit: "years",
      coverageStart: "2025-01-01",
      coverageEnd: "2010-01-01",
      sourceNote: "n",
      attested: true,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.coverageEnd).toBeTruthy();
  });

  it("rejects a source note containing contact details", () => {
    const result = validateCareerClaim({
      metricKey: "years_practicing",
      valueNumeric: 15,
      unit: "years",
      coverageStart: "2010-01-01",
      coverageEnd: "2025-01-01",
      sourceNote: "Verify with me at broker@example.com",
      attested: true,
    });
    expect(result.ok).toBe(false);
  });

  it("never lets a broker set their own verification state", () => {
    const result = validateCareerClaim({
      metricKey: "years_practicing",
      valueNumeric: 15,
      unit: "years",
      coverageStart: "2010-01-01",
      coverageEnd: "2025-01-01",
      sourceNote: "n",
      attested: true,
      verificationState: "scoutit_reviewed",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.unknownFields).toContain("verificationState");
  });

  it("exposes the supported metric keys so the editor cannot invent one", () => {
    expect(CAREER_METRIC_KEYS).toContain("years_practicing");
    expect(CAREER_METRIC_KEYS).toContain("historical_transactions");
    expect(CAREER_METRIC_KEYS).not.toContain("scout_rating");
  });
});
