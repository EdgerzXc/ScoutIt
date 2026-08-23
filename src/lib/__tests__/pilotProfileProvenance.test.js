import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

describe("controlled-pilot public profile provenance", () => {
  it("exposes only an active-participant boolean from the private registry", () => {
    const route = read("src/app/api/profile/public-roles/route.js");
    expect(route).toContain('.from("pilot_participants")');
    expect(route).toContain('.is("offboarded_at", null)');
    expect(route).toContain("isPilotParticipant: Boolean(pilotParticipant?.user_id)");
    expect(route).not.toMatch(/cohort_key\s*:/);
    expect(route).not.toMatch(/email\s*:/);
  });

  it("carries the provenance signal into public profile and directory models", () => {
    const client = read("src/lib/profileClient.js");
    expect(client).toContain("is_pilot_participant: isPilotParticipant");
    expect(client).toContain("is_pilot_participant: provenance.isPilotParticipant === true");

    for (const page of [
      "src/app/photographers/page.js",
      "src/app/researchers/page.js",
      "src/app/event-planners/page.js",
    ]) {
      const source = read(page);
      expect(source, page).toContain("activePilotParticipantIds");
      expect(source, page).toContain("is_pilot_participant: pilotIds.has(p.id)");
      expect(source, page).toContain("normalizeSupabaseProfessional");
      expect(source, page).toContain("publicBadgeGrantsByUserId");
    }
  });

  it("labels active pilot profiles on every public profile surface", () => {
    const baseLayer = read("src/components/profile/ProfileBaseLayer.js");
    const badge = read("src/components/profile/ProfileProvenanceBadge.js");
    expect(baseLayer).toContain("profile.is_pilot_participant === true");
    expect(badge).toContain("Sample profile &mdash; for human testing");

    const normalizer = read("src/lib/professionalDirectory.js");
    const sharedCard = read("src/components/professionals/ProfessionalCard.js");
    expect(normalizer).toContain("isPilot: profile.is_pilot_participant === true");
    expect(sharedCard).toContain("Sample · human testing");

    for (const clientPath of [
      "src/app/photographers/PhotographersClient.js",
      "src/app/researchers/ResearchersClient.js",
      "src/app/event-planners/EventPlannersClient.js",
    ]) expect(read(clientPath), clientPath).toContain("ProfessionalDirectory");
  });

  // Re-aimed 2026-08-20, not deleted (Standing Rule 14). The indexability gate
  // in this layout was rewritten from "spread a noindex object when the caller
  // is a pilot participant" into an allowlist with a single NOINDEX constant,
  // which broke the literal string this asserted. The BEHAVIOUR it guards is
  // unchanged and is now covered directly, by calling generateMetadata, in
  // src/lib/__tests__/publicProfileIndexability.test.js.
  //
  // What stays here is this file's actual job: proving the pilot registry is
  // still consulted, and consulted the narrow way. The literal-string check was
  // replaced with the decision it stands for, because a source test that
  // matches formatting fails on a refactor that changes nothing real.
  it("keeps active pilot profile URLs out of search indexes", () => {
    const layout = read("src/app/profile/[username]/layout.js");
    expect(layout).toContain('.from("public_profiles")');
    expect(layout).toContain('.from("pilot_participants")');
    expect(layout).toContain('.is("offboarded_at", null)');

    // A noindex value exists, and the index decision depends on pilot status.
    expect(layout).toMatch(/index:\s*false,\s*follow:\s*true/);
    expect(layout).toMatch(/isIndexable\s*=[^;]*!isPilotParticipant/);
  });
});
