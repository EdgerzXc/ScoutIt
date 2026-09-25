import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { INFO_TIPS, getInfoTip } from "../infoTips";
import { PROFESSIONAL_CATEGORIES } from "../professionalDirectory";

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("info tips — explanations on demand (A-160)", () => {
  it("registers every tip the directory hero reaches for", () => {
    for (const id of ["layerNumber", "evidenceProtocol"]) {
      const tip = getInfoTip(id);
      expect(tip, id).toBeTruthy();
      expect(tip.title.length).toBeGreaterThan(0);
      expect(tip.body.length).toBeGreaterThan(0);
    }
    expect(getInfoTip("no-such-tip")).toBe(null);
  });

  it("keeps every body a whisper, not a chapter", () => {
    for (const [id, tip] of Object.entries(INFO_TIPS)) {
      expect(tip.body.length, id).toBeLessThanOrEqual(280);
    }
  });

  it("writes plainly: no em/en dashes, no puffed significance", () => {
    const puff = /(testament|tapestry|delve|showcasing|pivotal|vibrant|nestled|breathtaking)/i;
    for (const [id, tip] of Object.entries(INFO_TIPS)) {
      expect(`${tip.title} ${tip.body}`, id).not.toMatch(/[—–]/);
      expect(`${tip.title} ${tip.body}`, id).not.toMatch(puff);
    }
  });

  it("registers the site-wide rollout keys", () => {
    for (const id of [
      "layerNumber",
      "evidenceProtocol",
      "privateSaves",
      "credentialSort",
      "dataPhilosophy",
      "platformTruth",
      "verifyingSpaces",
      "metropolisMission",
      "crustMission",
      "stratosphereMission",
      "stratosphereWorkspace",
      "signalSources",
      "spatialRadar",
      "priceBands",
      "neighborhoodIntel",
      "faqTiers",
      "claimProperty",
      "proximityRadar",
      "areaWatch",
      "fieldBriefing",
      "listingStrength",
      "vaultMilestones",
      "bulkIngest",
    ]) {
      expect(getInfoTip(id), id).toBeTruthy();
    }
  });

  it("wires tips where the essays were", () => {
    const header = read("src/components/descent/LayerHeader.js");
    expect(header).toContain("missionTipId");
    expect(header).toContain("InfoTip");
    const metro = read("src/app/layer/metropolis/page.js");
    expect(metro).toContain('missionTipId="metropolisMission"');
    expect(metro).not.toContain("building by building with verified spatial data");
    expect(metro).not.toContain('<p className="metro-hint"');
    const crust = read("src/app/layer/crust/page.js");
    expect(crust).toContain('missionTipId="crustMission"');
    expect(crust).not.toContain("without flattening them into one generic verified roster");
    const home = read("src/app/HomeClient.js");
    expect(home).toContain('tipId="dataPhilosophy"');
    expect(home).toContain('tipId="platformTruth"');
    expect(home).not.toContain("Structured property briefings and spatial signals");
    const directory = read("src/app/property/DirectoryClient.js");
    expect(directory).toContain('tipId="verifyingSpaces"');
    expect(directory).not.toContain("once its intelligence has been checked");
  });

  it("InfoTip renders copy it never authors, with tooltip semantics", () => {
    expect(existsSync(join(process.cwd(), "src/components/ui/InfoTip.js"))).toBe(true);
    const src = read("src/components/ui/InfoTip.js");
    expect(src).toContain('role="tooltip"');
    expect(src).toContain("aria-expanded");
    expect(src).toContain("Escape");
    expect(src).toContain("getInfoTip");
    // Viewport-clamped fixed panel: an edge-placed "?" must not bleed off.
    expect(src).toContain("position: fixed");
    expect(src).toContain("VIEWPORT_MARGIN");
    // 44px hit area, hover gated to mice (touch synthesis would toggle shut).
    expect(src).toContain("min-height: 44px");
    expect(src).toContain('pointerType === "mouse"');
    expect(src).toContain("prefers-reduced-motion");
  });

  it("directory hero shows one line per category, not a paragraph", () => {
    for (const [key, config] of Object.entries(PROFESSIONAL_CATEGORIES)) {
      expect(config.description.length, key).toBeLessThanOrEqual(70);
    }
  });

  it("directory hero names its sources and never mid-word breaks (U-039)", () => {
    const component = read("src/components/professionals/ProfessionalDirectory.js");
    expect(component).toContain("protocolRow");
    expect(component).toContain('tipId="evidenceProtocol"');
    expect(component).toContain('tipId="layerNumber"');
    expect(component).not.toContain("truthPanel");
    const css = read("src/components/professionals/professionalDirectory.module.css");
    expect(css).toContain("overflow-wrap: break-word");
    expect(css).toContain("text-wrap: balance");
    expect(css).toContain("protocolRow");
  });
});
