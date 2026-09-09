import fs from "node:fs";
import { describe, expect, it } from "vitest";

// A-093 — the layout-mounted toolbox pulled the full internal system graph
// onto public pages (`FloatingToolbox → journeyGuides → masterFlowGraphData`,
// ~1MB), and `/admin/flow` rendered the internal map to any signed-in user.
// The full server gate stays with A-073 (cookie-session migration); what is
// buildable now: (1) the verified journey loads behind the role fetch the
// toolbox already performs, so anonymous chunks ship no internal paths, and
// (2) the flow map renders only for staff roles behind an explicitly
// NON-authoritative client check that names A-073 as the real gate.
// Standing Rule 5: a client-side check presented as authorization would be
// the defect, not the fix — the placeholder must say so.

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

const toolbox = codeOf("src/components/ui/FloatingToolbox.js");
const flowPage = codeOf("src/app/admin/flow/page.js");

describe("A-093 · the anonymous chunk ships no internal graph", () => {
  it("guards the guard — the toolbox still owns help & display", () => {
    expect(toolbox.code).toContain('fetch("/api/profile/me/role")');
    expect(toolbox.code).toContain("scoutit_journey_guide_v1");
  });

  it("no static import pulls the graph into the layout chunk", () => {
    // Static import statements only — the dynamic `import()` call and the
    // function it invokes legitimately name the module below.
    expect(toolbox.code).not.toMatch(/^\s*import\s.*journeyGuides/m);
    expect(toolbox.code).not.toContain("masterFlowGraphData");
    expect(toolbox.code).not.toMatch(/^\s*import\s*\{[^}]*guideForVerifiedRole/m);
  });

  it("the verified journey loads dynamically, gated on the fetched role", () => {
    // Dynamic import of the journey module, reached only when a role exists.
    // Anonymous readers (role null) download no graph data at all.
    expect(toolbox.code).toContain('import("@/lib/journeyGuides")');
    expect(toolbox.code).toMatch(/if \(!role\)[\s\S]{0,120}setVerifiedJourney\(null\)/);
  });
});

describe("A-093 · the flow map is staff-scoped, honestly", () => {
  it("renders the graph only for staff roles from the server-read role", () => {
    expect(flowPage.code).toContain('fetch("/api/profile/me/role")');
    expect(flowPage.code).toMatch(/role === "admin" \|\| role === "staff"/);
    expect(flowPage.code).toContain("MasterFlowGraph");
  });

  it("names A-073 as the real gate — never presents the check as authorization", () => {
    expect(flowPage.source).toContain("A-073");
    expect(flowPage.source).not.toMatch(/authoriz/i);
  });
});
