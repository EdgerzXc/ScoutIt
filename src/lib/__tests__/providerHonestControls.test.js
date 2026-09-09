import fs from "node:fs";
import { describe, expect, it } from "vitest";

// A-092 — twelve buttons + `raiseQuest` claimed success and wrote nothing.
// Every listed control is either wired to a real write with error handling
// or honestly inert (disabled + Phase-2 affordance). No success-claiming
// toast without an adjacent write.
//
// Source assertion is the right shape: the property is the absence of
// specific success strings where no write exists. Comments stripped before
// matching per the proxyBanGuardRetired precedent. Behavioural render tests
// are unavailable in this repo (JSX in .js files, see ACTIVE "Not in this
// queue"). Boundary: provider Phase-2 scope decisions stay owner-gated — no
// backend contract is invented to satisfy this test; inert is honest.

function codeOf(p) {
  const source = fs.readFileSync(p, "utf8");
  return {
    source,
    code: source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(/\r?\n/)
      .map((line) => line.replace(/(^|\s)\/\/.*/, "$1"))
      .join("\n"),
  };
}

const provider = codeOf("src/components/dashboard/ProviderMode.js");
const photographer = codeOf(
  "src/components/dashboard/providers/PhotographerHUD.js",
);
const researcher = codeOf(
  "src/components/dashboard/providers/ResearcherHUD.js",
);
const designer = codeOf("src/components/dashboard/providers/DesignerHUD.js");
const mission = codeOf("src/components/dashboard/MissionControlMode.js");
const context = codeOf("src/context/DashboardContext.js");
const panel = codeOf("src/components/profile/panels/PhotographerPanel.js");

describe("A-092 · guards the guard", () => {
  it("reads the real files", () => {
    for (const f of [
      provider,
      photographer,
      researcher,
      designer,
      mission,
      context,
      panel,
    ]) {
      expect(f.code.length).toBeGreaterThan(1000);
    }
    expect(provider.code).toContain("ProviderMode");
    expect(context.code).toContain("raiseQuest");
  });
});

describe("A-092 · no success-claiming toast without a write", () => {
  it("ProviderMode waitlist button opens the real waitlist, not a fake save", () => {
    expect(provider.code).not.toContain("secured in the waitlist database");
    expect(provider.code).toContain("scoutit:open-waitlist");
  });

  it("provider HUDs claim no submission or profile update", () => {
    for (const hud of [photographer, researcher, designer]) {
      expect(hud.code).not.toContain("Submitted.");
      expect(hud.code).not.toContain("Updated.");
    }
  });

  it("MissionControl org Save claims no update", () => {
    expect(mission.code).not.toContain("Organization profile updated");
  });

  it("inert controls say they are Phase 2", () => {
    for (const f of [photographer, researcher, designer, mission]) {
      expect(f.source).toMatch(/Phase 2/);
    }
  });
});

describe("A-092 · the writes that exist handle failure", () => {
  it("raiseQuest reads the insert error instead of toasting success blindly", () => {
    // Exact corrected lines — a regex window here passed vacuously once
    // (matched an unrelated `.error` downstream), so the guard names the
    // lines themselves. Deleting either line turns this red.
    expect(context.code).toContain(
      "const { error } = await supabase.from('bounty_claims')",
    );
    expect(context.code).toContain("return false;");
  });

  it("PhotographerPanel availability checks the write and reverts on failure", () => {
    expect(panel.code).toContain("toggleAvailability");
    expect(panel.code).toContain("const { error } = await supabase");
    // Revert: the optimistic value is restored when the write fails.
    expect(panel.code).toContain("if (error) setAvailable(available);");
  });
});
