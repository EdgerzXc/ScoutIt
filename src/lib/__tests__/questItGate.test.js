import fs from "node:fs";
import path from "node:path";
import { isQuestItPath, shouldBlockQuestIt } from "../questItGate";

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("QuestIT fail-closed feature gate", () => {
  it.each([
    "/api/questit",
    "/api/questit/search",
    "/api/v1/questit",
    "/api/v1/questit/quests",
    "/api/v1/questit/raise",
  ])("recognizes the complete QuestIT route family: %s", (pathname) => {
    expect(isQuestItPath(pathname)).toBe(true);
  });

  it.each([
    "/api/questit-other",
    "/api/v1/questit-other",
    "/api/intel/questit",
  ])("does not capture a near-prefix route: %s", (pathname) => {
    expect(isQuestItPath(pathname)).toBe(false);
  });

  it.each([undefined, {}, { ai_search: false }])(
    "blocks QuestIT unless ai_search is explicitly true",
    (flags) => {
      expect(shouldBlockQuestIt("/api/questit", flags)).toBe(true);
      expect(shouldBlockQuestIt("/api/v1/questit/quests", flags)).toBe(true);
    }
  );

  it("allows QuestIT only when ai_search is explicitly true", () => {
    expect(shouldBlockQuestIt("/api/questit", { ai_search: true })).toBe(false);
    expect(shouldBlockQuestIt("/api/v1/questit/raise", { ai_search: true })).toBe(false);
  });

  it("keeps the proxy and route-level fallback aligned with fail-closed policy", () => {
    const proxy = read("src/proxy.js");
    const flags = read("src/lib/featureFlags.js");

    expect(proxy).toContain("shouldBlockQuestIt(path, flags)");
    expect(proxy).not.toContain("flags.ai_search === false");
    expect(flags).toContain('getFlag("ai_search", false)');
  });
});
