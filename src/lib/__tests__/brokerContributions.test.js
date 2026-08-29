import {
  CONTRIBUTION_SECTION_STATES,
  buildContributionSection,
} from "@/lib/brokerContributions";

// ─────────────────────────────────────────────────────────────────────────
// A-023 phase 4. A-023 requires contributions to be *inspectable*: each one
// opens the artifact it claims credit for. A contribution with no reachable
// artifact is an unverifiable claim of work, so it is not published at all —
// Rule 13 ("an endpoint with no caller is not a feature") applied to content.
//
// Contributions must also stay entirely outside the rating: A-023 forbids
// platform incentives from being fed by anything but eligible ScoutIt events.
// ─────────────────────────────────────────────────────────────────────────

const row = (overrides = {}) => ({
  id: "con-1",
  kind: "briefing",
  title: "What changed in BGC office supply this quarter",
  artifact_path: "/property/one-ecom-center",
  published_at: "2026-05-02T00:00:00.000Z",
  status: "published",
  ...overrides,
});

const build = (rows, extra = {}) =>
  buildContributionSection({
    authorityId: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
    lookup: { ok: true, contributions: rows },
    ...extra,
  });

describe("A-023 contributions must open their artifact", () => {
  it("publishes a contribution that has a resolvable internal artifact", () => {
    const section = build([row()]);
    expect(section.state).toBe(CONTRIBUTION_SECTION_STATES.LISTED);
    expect(section.cards[0].href).toBe("/property/one-ecom-center");
  });

  it.each([
    ["no artifact path at all", { artifact_path: "" }],
    ["a whitespace-only path", { artifact_path: "   " }],
    ["an unpublished artifact", { status: "draft" }],
    ["a retracted artifact", { status: "retracted" }],
  ])("never publishes a contribution with %s", (_label, overrides) => {
    const section = build([row(overrides)]);
    expect(section.cards).toHaveLength(0);
  });

  it("rejects an off-site or scheme-relative path rather than linking off the dossier", () => {
    // A contribution is credit for work published *on ScoutIt*. An absolute or
    // protocol-relative URL is not an inspectable ScoutIt artifact, and
    // `//evil.example.com` is a real open-redirect shape.
    for (const artifact_path of [
      "https://evil.example.com/post",
      "//evil.example.com/post",
      "javascript:alert(1)",
    ]) {
      expect(build([row({ artifact_path })]).cards).toHaveLength(0);
    }
  });

  it("orders contributions newest first", () => {
    const section = build([
      row({ id: "old", published_at: "2026-01-01T00:00:00.000Z" }),
      row({ id: "new", published_at: "2026-07-01T00:00:00.000Z" }),
    ]);
    expect(section.cards.map((c) => c.id)).toEqual(["new", "old"]);
  });
});

describe("A-023 contributions stay outside the rating", () => {
  it("carries no score, weight, or rating field of any kind", () => {
    const section = build([row()]);
    expect(JSON.stringify(section)).not.toMatch(/score|weight|rating|points|rank/i);
  });
});

describe("A-023 contribution section states", () => {
  it("cannot claim emptiness when the dossier is not linked", () => {
    const section = build([], { authorityId: null });
    expect(section.state).toBe(CONTRIBUTION_SECTION_STATES.NOT_LINKED);
    expect(section.claimsEmptiness).toBe(false);
  });

  it("cannot claim emptiness when the authority could not be read", () => {
    const section = buildContributionSection({
      authorityId: "e7f3634b-65d7-4adc-90ea-0544b61d988d",
      lookup: { ok: false },
    });
    expect(section.state).toBe(CONTRIBUTION_SECTION_STATES.LOOKUP_FAILED);
    expect(section.claimsEmptiness).toBe(false);
  });

  it("claims emptiness only after the authority answered", () => {
    const section = build([]);
    expect(section.state).toBe(CONTRIBUTION_SECTION_STATES.NONE_PUBLISHABLE);
    expect(section.claimsEmptiness).toBe(true);
  });
});
