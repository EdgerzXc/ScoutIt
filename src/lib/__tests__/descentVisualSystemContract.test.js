import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

const componentFiles = [
  "src/components/descent/LayerNav.js",
  "src/components/descent/LayerHeader.js",
  "src/components/descent/LayerTransition.js",
];

const routeFiles = [
  "src/app/layer/orbit/page.js",
  "src/app/layer/stratosphere/page.js",
  "src/app/layer/metropolis/page.js",
  "src/app/layer/crust/page.js",
  "src/components/descent/MantleArchive.js",
  "src/components/descent/CoreGateway.js",
  "src/components/descent/AboutYouExperience.js",
];

describe("F-008 shared descent visual-system contract", () => {
  it("routes every descent and About You experience through the shared layer navigation", () => {
    for (const file of routeFiles) {
      expect(read(file), file).toContain("LayerNav");
    }
  });

  it("uses one shared tokenized chrome module without raw colors or inline style blocks", () => {
    const css = read("src/components/descent/layerChrome.module.css");
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).toContain("var(--accent)");
    expect(css).toContain("var(--text-primary)");
    expect(css).toContain("var(--surface-rgb)");

    for (const file of componentFiles) {
      const source = read(file);
      expect(source, file).toContain("layerChrome.module.css");
      expect(source, file).not.toContain("dangerouslySetInnerHTML");
      expect(source, file).not.toMatch(/style=\{\{/);
    }
  });

  it("keeps navigation and calls to action touch-sized and visibly focusable", () => {
    const css = read("src/components/descent/layerChrome.module.css");
    expect(css).toMatch(/\.pill\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.primaryCta\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.transitionLink\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toContain(":focus-visible");
    expect(css).toMatch(/outline:\s*2px solid var\(--accent-bright\)/);
  });

  it("provides explicit reduced-motion and solid-transparency fallbacks", () => {
    const css = read("src/components/descent/layerChrome.module.css");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/\.transitionArrow\s*\{\s*animation:\s*none/);
    expect(css).toMatch(/@media \(prefers-reduced-transparency: reduce\)/);
    expect(css).toMatch(/backdrop-filter:\s*none/);
  });

  it("keeps Orbit and Stratosphere route-local foregrounds tokenized and state-complete", () => {
    const orbitPage = read("src/app/layer/orbit/page.js");
    const orbitCss = read("src/app/layer/orbit/page.module.css");
    const podium = read("src/components/board/BoardPodium.js");
    const stratosphereCss = read("src/app/layer/stratosphere/stratosphere-layer.css");

    for (const [name, source] of Object.entries({ orbitPage, orbitCss, podium, stratosphereCss })) {
      expect(source, name).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(source, name).not.toMatch(/rgba\(\s*\d/);
    }

    expect(orbitPage).toContain('import styles from "./page.module.css"');
    expect(podium).toContain("Reading the current sample index…");
    expect(podium).toMatch(/\.orbit-filter-pill\s*\{[\s\S]*?min-height:\s*44px/);
    expect(podium).toMatch(/\.orbit-runner-save\s*\{[\s\S]*?min-height:\s*44px/);
    expect(podium).toMatch(/@media \(prefers-reduced-transparency: reduce\)/);
    expect(stratosphereCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation:\s*none/);
    expect(stratosphereCss).toMatch(/@media \(prefers-reduced-transparency: reduce\)/);
  });

  it("keeps Crust, Mantle, Core, and About You touch-sized, focused, and tokenized", () => {
    const crustCss = read("src/app/layer/crust/page.module.css");
    const mantle = read("src/components/descent/MantleArchive.js");
    const core = read("src/components/descent/CoreGateway.js");
    const about = read("src/components/descent/AboutYouExperience.js");

    expect(crustCss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(crustCss).not.toMatch(/rgba\(\s*\d/);

    for (const [name, source] of Object.entries({ mantle, core, about })) {
      expect(source, name).not.toContain("min-height:40px");
      expect(source, name).not.toContain("min-height:42px");
      expect(source, name).not.toContain("font-family:var(--display)");
      expect(source, name).toContain("outline:2px solid var(--accent-bright)");
      expect(source, name).toContain("@media(prefers-reduced-motion:reduce)");
      expect(source, name).toContain("@media(prefers-reduced-transparency:reduce)");
    }

    expect(mantle).toContain("width:44px;height:44px");
    expect(core).toMatch(/\.core-continue,[^\n]*min-height:44px/);
    expect(about).toMatch(/\.step-controls button\{min-height:44px/);
    expect(about).toMatch(/\.return-core\{[^\n]*min-height:44px/);
  });

  it("gives the shared brand and directional links exact accessible names", () => {
    const nav = read("src/components/descent/LayerNav.js");
    const wordmark = read("src/components/brand/ScoutItWordmark.js");
    expect(nav).toContain("ScoutItWordmark");
    expect(wordmark).toContain('aria-label="ScoutIt"');
    expect(nav).toContain('aria-label={`${previous ? "Previous" : "Next"} layer:');
  });
});
