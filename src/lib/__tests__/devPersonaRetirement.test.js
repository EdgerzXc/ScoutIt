import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

describe("A-021 product dev-persona retirement", () => {
  it("removes every public query, gesture, role, tier, and console-preview entry from the Eye", () => {
    const source = read("src/components/ui/FloatingToolbox.js");

    for (const forbidden of [
      "?dev=1",
      'get("dev")',
      '"scoutit_dev"',
      "tapTimes",
      "DEV_ROLES",
      "applyDev",
      "turnOffDev",
      "enterMissionControl",
      "Dev · Tier",
      "Staff Console — simulated",
      "Enterprise Console — preview",
      "DEVELOPMENT_MOCK_STORAGE_KEY",
      'id: "master-dev"',
    ]) expect(source).not.toContain(forbidden);
  });

  it("removes indirect browser mutation tokens and obsolete role activation", () => {
    const context = read("src/context/DashboardContext.js");
    const dashboard = read("src/app/dashboard/page.js");
    const intelStudio = read("src/components/intel/IntelStudioPanel.js");
    const editor = read("src/components/dashboard/LiveEditorWorkspace.js");
    expect(editor).not.toContain("currentUser?.id === 'master-dev'");
    const helpers = read("e2e_tests/full-system/helpers.js");

    expect(context).not.toContain("mock-e2e-token");
    expect(dashboard).not.toContain('user.id === "master-dev"');
    expect(intelStudio).not.toContain("mockOwnerId");
    expect(intelStudio).not.toContain("master-dev");
    expect(helpers).not.toContain("real dev account with real production");
  });

  it("keeps the fixture helper explicit about E2E-only authority", () => {
    const source = read("src/lib/developmentMock.js");
    expect(source).toContain('e2eFlag === "1"');
    expect(source).not.toContain('nodeEnv === "development"');
  });
});
