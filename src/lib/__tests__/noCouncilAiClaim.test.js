import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// A-141 — the dashboard told owners a "Council AI" was drafting their listing.
// No council exists: the PDF path is one Gemini pass plus a staff check, and
// the ScoutIt-team path runs no AI at all. A claim about a system that does
// not exist is the Honest Blank Rule's failure in words instead of numbers.
//
// The council idea itself is kept — NEW_IDEAS §18 — so this guard names what
// ships to users today, not what may be built later. src/data is excluded: the
// Master Flow Graph describes the council as a planned, not-built node.

const ROOTS = ["src/components", "src/context", "src/app"];
const CLAIM = /council\s+ai|ai\s+council/i;
// Comments are for developers (MasterFlowGraph.js names "the AI council" as a
// planned node); only code and copy reach users.
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === "__tests__" ? [] : sourceFiles(path);
    }
    return /\.(js|jsx|ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("A-141 · no user-facing text claims a Council AI", () => {
  it("finds no 'Council AI' / 'AI Council' wording in shipped UI code", () => {
    const offenders = ROOTS.flatMap(sourceFiles)
      .filter((file) => CLAIM.test(stripComments(readFileSync(file, "utf8"))))
      .map((file) => relative(process.cwd(), file));

    expect(offenders).toEqual([]);
  });

  it("the pattern catches the wording it exists to stop", () => {
    for (const phrase of ["COUNCIL AI IS DRAFTING...", "SEO Council AI", "The AI Council is analyzing"]) {
      expect(CLAIM.test(phrase)).toBe(true);
    }
  });
});

// The only producer of an `ai_drafting` listing is addConciergeListing, the
// OwnerMode "join the ScoutIt team queue" request. It runs no AI and uploads
// nothing, so neither it nor the banner it triggers may say otherwise.
describe("A-141 · the ScoutIt-team request says what it is", () => {
  const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  const context = strip(readFileSync("src/context/DashboardContext.js", "utf8"));
  const concierge = context.slice(
    context.indexOf("const addConciergeListing"),
    context.indexOf("const sendPitch")
  );

  it("claims no AI run and no upload", () => {
    expect(concierge.length).toBeGreaterThan(0);
    expect(concierge).not.toMatch(/\bAI\b|Uploading|uploaded|parsed/);
  });

  it("reports whether the request was recorded, and OwnerMode waits for it", () => {
    expect(concierge).toMatch(/return false;/);
    expect(concierge).toMatch(/return true;/);
    const owner = strip(readFileSync("src/components/dashboard/OwnerMode.js", "utf8"));
    expect(owner).toMatch(/const queued = await addConciergeListing\([\s\S]{0,200}if \(!queued\) return;/);
  });

  it("the owner banner and card name the ScoutIt team, not an AI", () => {
    const owner = readFileSync("src/components/dashboard/OwnerMode.js", "utf8");
    const card = readFileSync("src/components/dashboard/cards/OwnerListingCard.js", "utf8");
    expect(owner).not.toMatch(/AI Drafting in Progress|2-5 minutes/);
    expect(owner).toContain("is in the ScoutIt team&apos;s queue");
    expect(card).toContain("With the ScoutIt team");
  });
});
