import {
  BROKER_DRAFT_KEYS,
  buildBrokerNarrativeFields,
  getUnpublishableDraftFields,
  validateBrokerDossierDraft,
} from "@/lib/brokerDossierDraft";

const validDraft = {
  portraitUrl: "https://images.example.test/advisor.jpg",
  biography: "Commercial advisor focused on evidence-led occupier searches.",
  firm: "Example Advisory",
  markets: ["Metro Manila"],
  categories: ["Office"],
  languages: ["English", "Filipino"],
  serviceAreas: ["Makati", "Taguig"],
  workingStyle: "Structured shortlists and documented trade-offs.",
  availability: "limited",
  introMediaUrl: "https://video.example.test/introduction",
};

describe("A-023 phase 3 - broker dossier draft contract", () => {
  it("normalizes the complete broker-declared field set", () => {
    const result = validateBrokerDossierDraft(validDraft);

    expect(result.ok).toBe(true);
    expect(Object.keys(result.draft).sort()).toEqual([...BROKER_DRAFT_KEYS].sort());
  });

  it("rejects staff, trust, property, and layout controls", () => {
    const result = validateBrokerDossierDraft({
      ...validDraft,
      licenseVerified: true,
      scoutRating: 100,
      managedProperties: ["prop-1"],
      customHtml: "<strong>Best broker</strong>",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.unknownFields).toEqual([
      "customHtml",
      "licenseVerified",
      "managedProperties",
      "scoutRating",
    ]);
  });

  it("rejects markup and direct-contact leaks in narrative fields", () => {
    const result = validateBrokerDossierDraft({
      ...validDraft,
      biography: "Email me at advisor@example.test <script>alert(1)</script>",
      workingStyle: "WhatsApp +63 917 123 4567",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.biography).toBeDefined();
    expect(result.errors.workingStyle).toBeDefined();
  });

  it("rejects unsupported superiority and outcome claims", () => {
    const result = validateBrokerDossierDraft({
      ...validDraft,
      biography: "The #1 broker with guaranteed returns in every market.",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.biography).toBeDefined();
  });

  it("requires https media URLs and bounded structured arrays", () => {
    const result = validateBrokerDossierDraft({
      ...validDraft,
      portraitUrl: "javascript:alert(1)",
      introMediaUrl: "http://example.test/intro",
      languages: Array.from({ length: 13 }, (_, index) => `Language ${index}`),
    });

    expect(result.ok).toBe(false);
    expect(result.errors.portraitUrl).toBeDefined();
    expect(result.errors.introMediaUrl).toBeDefined();
    expect(result.errors.languages).toBeDefined();
  });

  it("builds an Airtable payload from confirmed fields only", () => {
    const fields = buildBrokerNarrativeFields(validDraft);

    expect(fields).toEqual({
      Bio: validDraft.biography,
      Image: validDraft.portraitUrl,
    });
    expect(JSON.stringify(fields)).not.toContain("firm");
    expect(JSON.stringify(fields)).not.toContain("availability");
  });
  it("blocks publish when a populated draft field has no confirmed Airtable target", () => {
    expect(getUnpublishableDraftFields(validDraft)).toEqual([
      "availability",
      "categories",
      "firm",
      "introMediaUrl",
      "languages",
      "markets",
      "serviceAreas",
      "workingStyle",
    ]);
    expect(getUnpublishableDraftFields({
      ...validDraft,
      firm: "",
      markets: [],
      categories: [],
      languages: [],
      serviceAreas: [],
      workingStyle: "",
      availability: "not_set",
      introMediaUrl: "",
    })).toEqual([]);
  });
});
