import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("A-029 Truthful Voice and Display Typography Contract", () => {
  it("enforces no uncited 'Philippines first' or blanket marketing claims in public metadata and shell", () => {
    const layout = read("src/app/layout.js");
    const footer = read("src/components/layout/Footer.js");
    const home = read("src/app/page.js");
    const terms = read("src/app/terms/page.js");
    const jsonLd = read("src/components/seo/JsonLd.js");
    const share = read("src/lib/shareBriefing.js");

    // Prohibit "Philippines' first" across all core public branding strings
    expect(layout).not.toContain("Philippines' first");
    expect(footer).not.toContain("Philippines' first");
    expect(footer).not.toContain("Philippines&apos; first");
    expect(home).not.toContain("Philippines' first");
    expect(home).not.toContain("Philippines&apos; first");
    expect(terms).not.toContain("Philippines' first");
    expect(jsonLd).not.toContain("Philippines' first");
    expect(share).not.toContain("Philippines' first");

    // Prohibit "No fake listings" in shell copy
    expect(home).not.toContain("No fake listings");
    expect(home).not.toContain("No duplicate listings");
    expect(home).not.toContain("direct owner connections");
    expect(home).not.toContain("verified facts");

    // Verify truthful spatial intelligence phrasing
    expect(layout).toContain("Property and space intelligence platform for the Philippines");
    expect(footer).toContain("Space intelligence for the Philippines");
    expect(home).toContain("Space intelligence for the Philippines");
    expect(home).toContain("Named sources. No manufactured urgency. Clear terms.");
    expect(terms).toContain("The terms of service for ScoutIt");
    expect(jsonLd).toContain("ScoutIt is a property and space intelligence platform in the Philippines");
  });


  it("enforces strict anti-cliché and factual grounding rules in AI rewrite prompt", () => {
    const rewriteSource = read("src/app/api/ai/rewrite/route.js");

    // Verify banned cliché corpus is explicitly forbidden in the prompt
    expect(rewriteSource).toContain("BANNED AI CLICHÉS");
    expect(rewriteSource).toContain('"bespoke", "curated", "panoramic", "seamless", "prestige", "uncompromising"');
    expect(rewriteSource).toContain('"oasis", "nestled", "boasts", "breathtaking", "epitome", "haven"');

    // Verify prompt does NOT promote generic luxury tone
    expect(rewriteSource).not.toContain('"White-Glove Luxury" Brand Voice');
    expect(rewriteSource).not.toContain("Cinematic & evocative (e.g., bespoke, curated, panoramic, seamless, prestige, uncompromising)");

    // Verify factual grounding rules
    expect(rewriteSource).toContain("Strictly preserve facts, dimensions, specs, and features");
    expect(rewriteSource).toContain("NEVER invent, hallucinate, or estimate amenities");
    expect(rewriteSource).toContain("GEO-First Formatting");
  });

  it("enforces grounded GEO rules in AI assimilate ingest prompt without cliché instructions", () => {
    const assimilateSource = read("src/app/api/ai/assimilate/route.js");

    // Verify assimilate prompt does NOT instruct model to use 'bespoke' or 'premier' as brand voice
    expect(assimilateSource).not.toContain("White-Glove Luxury");
    expect(assimilateSource).not.toContain("language like 'bespoke', 'premier'");

    // Verify factual rules
    expect(assimilateSource).toContain("NEVER invent facts, hallucinate amenities, or use AI luxury clichés");
    expect(assimilateSource).toContain("Generative Engine Optimization (GEO)");
  });

  it("verifies canonical Voice & Copy Guide exists with banned clichés table", () => {
    const guidePath = "_SCOUTIT_BRAIN/01_IDENTITY_AND_VISION/VOICE_AND_COPY_GUIDE.md";
    expect(existsSync(resolve(process.cwd(), guidePath))).toBe(true);

    const guideContent = read(guidePath);
    expect(guideContent).toContain("Banned Clichés & Replacement Table");
    expect(guideContent).toContain("Architectural & Spatial Precision");
    expect(guideContent).toContain("Absolute Grounding");
    expect(guideContent).toContain("Display Typography Stance");
  });

  it("verifies display typography tokens in globals.css use deliberate single-load system", () => {
    const globalsCss = read("src/app/globals.css");
    expect(globalsCss).toContain("--font-display: var(--font-geist-sans), system-ui, -apple-system, sans-serif;");
    expect(globalsCss).toContain("--font-body: var(--font-geist-sans), system-ui, -apple-system, 'Segoe UI', sans-serif;");
    expect(globalsCss).toContain("--font-mono: var(--font-geist-mono), 'Courier New', monospace;");
  });

  it("keeps Help & Display named consistently on both persistent controls", () => {
    const floatingToolbox = read("src/components/ui/FloatingToolbox.js");
    const bottomNav = read("src/components/layout/BottomNav.js");

    expect(floatingToolbox).toContain("Help & Display");
    expect(bottomNav).toContain('theme-sheet-title">Help & Display');
    expect(bottomNav).not.toContain('theme-sheet-title">Display Settings');
  });
});
