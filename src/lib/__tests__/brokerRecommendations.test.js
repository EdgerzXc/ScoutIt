import {
  RECOMMENDATION_SECTION_STATES,
  buildRecommendationSection,
  publicRecommendationAuthor,
} from "@/lib/brokerRecommendations";

// ─────────────────────────────────────────────────────────────────────────
// A-023 phase 4. The recommendation is the one place on the dossier where a
// real client's words and identity are exposed, so the tests that matter most
// are the ones proving what does NOT come out: the author's name under any
// attribution mode except the one they chose, and the private evidence they
// attached as proof.
//
// A-023's locked rule: "Verified ScoutIt connection" is earned by a qualifying
// two-sided transaction handshake, never by a representation or a broker's say-so.
// ─────────────────────────────────────────────────────────────────────────

const NOW = "2026-08-26T00:00:00.000Z";

const row = (overrides = {}) => ({
  id: "rec-1",
  broker_id: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
  author_display_name: "Maria Villanueva-Cruz",
  attribution_mode: "full_name",
  relationship_type: "Office tenant",
  body: "They walked the floorplate with us twice before we signed.",
  moderation_state: "approved",
  consent_granted: true,
  withdrawn_at: null,
  disputed_at: null,
  qualifying_handshake_id: null,
  evidence_url: "https://private.example.com/screenshot.png",
  submitted_at: "2026-06-01T00:00:00.000Z",
  ...overrides,
});

const build = (rows, extra = {}) =>
  buildRecommendationSection({
    authorityId: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
    lookup: { ok: true, recommendations: rows },
    now: NOW,
    ...extra,
  });

describe("A-023 recommendation attribution never leaks a name the author did not consent to", () => {
  it("shows the full name only for full_name attribution", () => {
    expect(publicRecommendationAuthor(row()).label).toBe("Maria Villanueva-Cruz");
  });

  it("reduces to initials without exposing the surname", () => {
    const author = publicRecommendationAuthor(row({ attribution_mode: "initials" }));
    expect(author.label).toBe("M.V.");
    expect(JSON.stringify(author)).not.toMatch(/Villanueva|Maria/);
  });

  it("shows only the relationship for role_only attribution", () => {
    const author = publicRecommendationAuthor(
      row({ attribution_mode: "role_only", relationship_type: "Office tenant" }),
    );
    expect(author.label).toBe("Office tenant");
    expect(JSON.stringify(author)).not.toMatch(/Villanueva|Maria/);
  });

  it("names nobody for anonymous attribution", () => {
    const author = publicRecommendationAuthor(row({ attribution_mode: "anonymous" }));
    expect(author.label).toBe("Anonymous client");
    expect(JSON.stringify(author)).not.toMatch(/Villanueva|Maria/);
  });

  it("falls back to anonymous for an unrecognised attribution mode", () => {
    // Rule 6: a gate written as a negative check fails open. An unknown mode
    // must land on the most private option, never the most revealing one.
    const author = publicRecommendationAuthor(row({ attribution_mode: "sneaky_new_mode" }));
    expect(author.label).toBe("Anonymous client");
    expect(JSON.stringify(author)).not.toMatch(/Villanueva|Maria/);
  });
});

describe("A-023 recommendation publishability", () => {
  it("publishes an approved, consented, live recommendation", () => {
    const section = build([row()]);
    expect(section.state).toBe(RECOMMENDATION_SECTION_STATES.LISTED);
    expect(section.cards).toHaveLength(1);
  });

  it.each([
    ["pending moderation", { moderation_state: "pending" }],
    ["rejected moderation", { moderation_state: "rejected" }],
    ["consent not granted", { consent_granted: false }],
    ["withdrawn by its author", { withdrawn_at: "2026-07-01T00:00:00.000Z" }],
    ["under dispute", { disputed_at: "2026-07-01T00:00:00.000Z" }],
  ])("never publishes a recommendation that is %s", (_label, overrides) => {
    const section = build([row(overrides)]);
    expect(section.cards).toHaveLength(0);
    expect(section.state).toBe(RECOMMENDATION_SECTION_STATES.NONE_PUBLISHABLE);
  });

  it("never exposes private evidence to the public projection", () => {
    const section = build([row()]);
    expect(JSON.stringify(section)).not.toMatch(/screenshot|evidence|private\.example/i);
  });

  it("never exposes the raw author name when attribution is not full_name", () => {
    const section = build([row({ attribution_mode: "anonymous" })]);
    expect(JSON.stringify(section)).not.toMatch(/Villanueva|Maria/);
  });
});

describe("A-023 verified-connection labelling", () => {
  it("marks a recommendation verified only with a qualifying handshake", () => {
    const section = build([row({ qualifying_handshake_id: "handshake-9" })]);
    expect(section.cards[0].verified).toBe(true);
    expect(section.cards[0].sourceLabel).toBe("Verified ScoutIt connection");
  });

  it("leaves a recommendation without a handshake explicitly unverified", () => {
    const section = build([row()]);
    expect(section.cards[0].verified).toBe(false);
    expect(section.cards[0].sourceLabel).toBe("Client-submitted · unverified");
  });
});

describe("A-023 recommendation section states", () => {
  it("cannot claim emptiness when the dossier is not linked", () => {
    const section = build([], { authorityId: null });
    expect(section.state).toBe(RECOMMENDATION_SECTION_STATES.NOT_LINKED);
    expect(section.claimsEmptiness).toBe(false);
  });

  it("cannot claim emptiness when the authority could not be read", () => {
    const section = buildRecommendationSection({
      authorityId: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
      lookup: { ok: false },
      now: NOW,
    });
    expect(section.state).toBe(RECOMMENDATION_SECTION_STATES.LOOKUP_FAILED);
    expect(section.claimsEmptiness).toBe(false);
  });

  it("claims emptiness only after the authority answered", () => {
    const section = build([]);
    expect(section.state).toBe(RECOMMENDATION_SECTION_STATES.NONE_PUBLISHABLE);
    expect(section.claimsEmptiness).toBe(true);
  });

  it("ships no star average, immature or otherwise", () => {
    const section = build([row(), row({ id: "rec-2" })]);
    expect(JSON.stringify(section)).not.toMatch(/average|stars?|rating|score/i);
  });
});
