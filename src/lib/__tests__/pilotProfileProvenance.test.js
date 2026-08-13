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
      expect(source, page).toContain("isPilot: pilotIds.has(p.id)");
    }
  });

  it("labels active pilot profiles on every public profile surface", () => {
    const baseLayer = read("src/components/profile/ProfileBaseLayer.js");
    const badge = read("src/components/profile/ProfileProvenanceBadge.js");
    expect(baseLayer).toContain("profile.is_pilot_participant === true");
    expect(badge).toContain("Sample profile &mdash; for human testing");

    for (const clientPath of [
      "src/app/photographers/PhotographersClient.js",
      "src/app/researchers/ResearchersClient.js",
      "src/app/event-planners/EventPlannersClient.js",
    ]) {
      const source = read(clientPath);
      expect(source, clientPath).toContain("isPilot: !!p.is_pilot_participant");
      expect(source, clientPath).toContain("Sample Profile — For Human Testing");
    }
  });

  it("keeps active pilot profile URLs out of search indexes", () => {
    const layout = read("src/app/profile/[username]/layout.js");
    expect(layout).toContain('.from("public_profiles")');
    expect(layout).toContain('.from("pilot_participants")');
    expect(layout).toContain('.is("offboarded_at", null)');
    expect(layout).toContain("robots: { index: false, follow: true }");
  });
});
