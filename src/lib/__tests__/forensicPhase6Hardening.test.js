import fs from "fs";
import path from "path";

describe("A-210 Phase 6 Forensic Hardening: Design DNA, Viewports & Ergonomics", () => {
  const rootDir = process.cwd();

  test("GAP-05: driftingPropertyBubbles.module.css encloses all :hover states in pointer media query", () => {
    const cssPath = path.join(rootDir, "src/components/hero/driftingPropertyBubbles.module.css");
    const content = fs.readFileSync(cssPath, "utf8");

    // Extract all occurrences of :hover
    const lines = content.split("\n");
    const hoverLines = [];
    lines.forEach((line, index) => {
      if (line.includes(":hover")) {
        hoverLines.push({ lineIndex: index + 1, text: line.trim() });
      }
    });

    expect(hoverLines.length).toBeGreaterThan(0);

    // Verify each hover line is enclosed inside @media (hover: hover) and (pointer: fine)
    // We can check this by verifying that any block containing :hover is wrapped in the media query
    const mediaQueryRegex = /@media\s*\(\s*hover:\s*hover\s*\)\s*and\s*\(\s*pointer:\s*fine\s*\)\s*\{[\s\S]*?\}/g;
    const mediaQueryMatches = content.match(mediaQueryRegex) || [];
    
    // Total :hover occurrences inside media queries must equal total :hover occurrences in file
    let hoversInsideMedia = 0;
    for (const match of mediaQueryMatches) {
      const matchHovers = match.match(/:hover/g) || [];
      hoversInsideMedia += matchHovers.length;
    }

    const totalHovers = (content.match(/:hover/g) || []).length;
    expect(hoversInsideMedia).toBe(totalHovers);
  });

  test("GAP-09: KanbanBoard.js and MissionControlMode.js have zero raw blue Tailwind classes", () => {
    const kanbanPath = path.join(rootDir, "src/components/dashboard/crm/KanbanBoard.js");
    const mcPath = path.join(rootDir, "src/components/dashboard/MissionControlMode.js");

    const kanbanContent = fs.readFileSync(kanbanPath, "utf8");
    const mcContent = fs.readFileSync(mcPath, "utf8");

    // Check for raw blue tailwind tokens like text-blue-, bg-blue-, border-blue-, focus:border-blue-
    const blueRegex = /(?:text|bg|border|ring)-blue-\d+/g;
    
    const kanbanBlueMatches = kanbanContent.match(blueRegex) || [];
    const mcBlueMatches = mcContent.match(blueRegex) || [];

    expect(kanbanBlueMatches).toEqual([]);
    expect(mcBlueMatches).toEqual([]);

    // Kanban viewing appointment indicator must use gold-accent
    expect(kanbanContent).toContain("bg-gold-accent/10 border border-gold-accent/30 text-xs font-mono text-gold-accent");
  });

  test("GAP-19: MissionControlMode.js inputs and selects enforce mobile font-size >= 16px", () => {
    const mcPath = path.join(rootDir, "src/components/dashboard/MissionControlMode.js");
    const mcContent = fs.readFileSync(mcPath, "utf8");

    // Check Org Profile inputs
    expect(mcContent).toContain("text-base md:text-sm text-white focus:outline-none focus:border-gold-accent transition");
    // Check Concierge input
    expect(mcContent).toContain("text-base md:text-sm text-white focus:outline-none focus:border-gold-accent/50 transition");
    // Check Estate selector
    expect(mcContent).toContain("text-base md:text-xs text-white focus:outline-none focus:border-gold-accent min-w-0");
  });

  test("GAP-09 & GAP-19: legal-doc.css tokenized with 100dvh and CSS variables", () => {
    const cssPath = path.join(rootDir, "src/components/legal/legal-doc.css");
    const content = fs.readFileSync(cssPath, "utf8");

    // 100dvh viewport support
    expect(content).toContain("min-height: 100dvh;");
    // Theme token replacements
    expect(content).toContain("background: var(--bg-primary, #0a0a0a);");
    expect(content).toContain("color: var(--text-primary, #f5f3ee);");
    expect(content).toContain("rgba(var(--accent-rgb, 232, 174, 60), 0.32)");
    expect(content).toContain("rgba(var(--accent-rgb, 232, 174, 60), 0.06)");
  });

  test("GAP-15: not-found.css tokenized with 100dvh and CSS variables", () => {
    const cssPath = path.join(rootDir, "src/app/not-found.css");
    const content = fs.readFileSync(cssPath, "utf8");

    // 100dvh viewport support
    expect(content).toContain("min-height: 100dvh;");
    // Theme token replacements
    expect(content).toContain("background: var(--bg-primary, #0a0a0a);");
    expect(content).toContain("color: var(--text-primary, #f5f3ee);");
    expect(content).toContain("color: var(--bg-primary, #0a0a0a);");
    expect(content).toContain("rgba(var(--accent-rgb, 232, 174, 60), 0.12)");
    expect(content).toContain("rgba(var(--accent-rgb, 232, 174, 60), 0.08)");
  });
});
