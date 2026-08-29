import {
  validateRecommendationSubmission,
  MAX_RECOMMENDATION_LENGTH,
} from "@/lib/brokerRecommendationSubmission";

// ─────────────────────────────────────────────────────────────────────────
// A-023 audit gap G1. The recommendations section could be read but never
// written, so it was guaranteed to stay empty forever (Rule 21: a consumer
// with no producer).
//
// This boundary owns what a client may say and what consent must accompany it.
// The refusals are the point:
//
//   * consent is REQUIRED and must be explicit true — never inferred, never
//     defaulted (Rule 7, Rule 14);
//   * an unrecognised attribution mode is rejected outright rather than
//     silently downgraded, because submission is the one moment the author is
//     present to correct it;
//   * contact details and unsupported superiority claims are refused, the same
//     controls the broker's own narrative is held to.
// ─────────────────────────────────────────────────────────────────────────

const valid = (over = {}) => ({
  brokerId: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
  body: "They flagged the chiller schedule we would have missed, twice.",
  attributionMode: "initials",
  // `initials` and `full_name` both need a name to derive from; the fixture
  // carries one so each test varies only the thing it is about.
  authorDisplayName: "Maria Villanueva-Cruz",
  relationshipType: "Office tenant",
  consentGranted: true,
  ...over,
});

describe("A-023 recommendation submission requires real consent", () => {
  it("accepts a complete, consented submission", () => {
    const result = validateRecommendationSubmission(valid());
    expect(result.ok).toBe(true);
    expect(result.value.consentGranted).toBe(true);
  });

  it.each([
    ["missing", undefined],
    ["false", false],
    ["the string 'true'", "true"],
    ["the number 1", 1],
    ["null", null],
  ])("rejects consent that is %s", (_label, consentGranted) => {
    // Only an explicit boolean true is consent. Anything else is an assumption.
    const result = validateRecommendationSubmission(valid({ consentGranted }));
    expect(result.ok).toBe(false);
    expect(result.errors.consentGranted).toBeTruthy();
  });
});

describe("A-023 recommendation submission validates attribution", () => {
  it.each(["full_name", "initials", "role_only", "anonymous"])(
    "accepts the supported mode %s",
    (attributionMode) => {
      expect(validateRecommendationSubmission(valid({ attributionMode })).ok).toBe(true);
    },
  );

  it("rejects an unrecognised attribution mode rather than downgrading it", () => {
    const result = validateRecommendationSubmission(valid({ attributionMode: "sneaky" }));
    expect(result.ok).toBe(false);
    expect(result.errors.attributionMode).toBeTruthy();
  });

  it("requires a display name when the author chose full_name or initials", () => {
    for (const attributionMode of ["full_name", "initials"]) {
      const result = validateRecommendationSubmission(
        valid({ attributionMode, authorDisplayName: "" }),
      );
      expect(result.ok).toBe(false);
      expect(result.errors.authorDisplayName).toBeTruthy();
    }
  });

  it("does not require a display name for anonymous or role_only", () => {
    for (const attributionMode of ["anonymous", "role_only"]) {
      expect(
        validateRecommendationSubmission(valid({ attributionMode, authorDisplayName: "" })).ok,
      ).toBe(true);
    }
  });
});

describe("A-023 recommendation submission applies the same content controls", () => {
  it.each([
    ["an email address", "Reach me at broker@example.com for details"],
    ["a phone number", "Call 0917 555 1234 and ask for me"],
    ["an off-platform channel", "Message me on WhatsApp instead"],
  ])("refuses a body containing %s", (_label, body) => {
    const result = validateRecommendationSubmission(valid({ body }));
    expect(result.ok).toBe(false);
    expect(result.errors.body).toBeTruthy();
  });

  it("refuses markup in the body", () => {
    const result = validateRecommendationSubmission(
      valid({ body: "They were great <script>alert(1)</script>" }),
    );
    expect(result.ok).toBe(false);
  });

  it("refuses an empty body and one beyond the length limit", () => {
    expect(validateRecommendationSubmission(valid({ body: "   " })).ok).toBe(false);
    expect(
      validateRecommendationSubmission(valid({ body: "a".repeat(MAX_RECOMMENDATION_LENGTH + 1) })).ok,
    ).toBe(false);
  });

  it("refuses unsupported superiority claims", () => {
    const result = validateRecommendationSubmission(
      valid({ body: "Hands down the best broker in the country, guaranteed returns" }),
    );
    expect(result.ok).toBe(false);
  });

  it("never lets a caller set moderation, verification or evidence fields", () => {
    const result = validateRecommendationSubmission(
      valid({
        moderationState: "approved",
        qualifyingHandshakeId: "forged",
        evidenceUrl: "https://example.com/x.png",
        brokerIdOverride: "someone-else",
      }),
    );
    // Unknown keys are rejected outright rather than quietly dropped, so a
    // client attempting to self-approve gets told no instead of a silent pass.
    expect(result.ok).toBe(false);
    expect(result.errors.unknownFields).toContain("moderationState");
    expect(result.errors.unknownFields).toContain("qualifyingHandshakeId");
  });
});
