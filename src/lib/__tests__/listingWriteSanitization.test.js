import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { stripAllTags } from "@/lib/sanitize";

const readCode = (file) =>
  readFileSync(resolve(process.cwd(), file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const CONTEXT = "src/context/DashboardContext.js";
const OWNER = "src/components/dashboard/OwnerMode.js";

// ── A-120 — owner free text is stripped before it is stored ─────────────────
//
// The security checklist claimed "all submitted strings, titles, and details are
// sanitized via stripAllTags & sanitizeObject before database storage". That was
// false: `sanitizeObject` was imported in OwnerMode.js and never called, and
// titles reached the database raw. The claim is what made the gap invisible —
// anyone reading the checklist concluded the input side was covered.
//
// WHAT THIS LAYER IS, STATED HONESTLY. It runs in the browser, so a crafted
// PostgREST call bypasses it (Standing Rule 5: a gate the client evaluates is a
// suggestion). It is hygiene on the honest path.
//
// The actual security boundary is that no renderer builds markup from this text:
// React escapes by default, and the one `innerHTML` sink was closed in U-028 and
// is swept by `mapPopupInjection.test.js`. The unbypassable version of THIS
// layer is a Postgres BEFORE INSERT/UPDATE trigger, which is a migration and
// owner-gated under O-004.
describe("A-120 listing text is sanitized on write", () => {
  it("strips tag-shaped content from the fields an owner types", () => {
    // The behaviour, not the wiring: prove the helper actually neutralises the
    // payload class that reached innerHTML in U-028.
    expect(stripAllTags('<img src=x onerror="alert(1)">Warehouse')).not.toContain("<");
    expect(stripAllTags("<script>alert(1)</script>BGC Office")).not.toContain("<");
    expect(stripAllTags("Clean Title")).toBe("Clean Title");
  });

  it("is applied to title, location and description at the write", () => {
    const code = readCode(CONTEXT);
    expect(code).toContain("title: stripAllTags(listing.title)");
    expect(code).toContain("location: stripAllTags(listing.location)");
    expect(code).toContain("description: stripAllTags(listing.description)");
  });

  it("imports the helper it calls", () => {
    expect(readCode(CONTEXT)).toMatch(/import \{ stripAllTags \} from ['"]\.\.\/lib\/sanitize['"]/);
  });

  it("no longer carries an orphaned sanitizer import", () => {
    // An imported-but-uncalled sanitizer is worse than none: it reads as
    // coverage in review and in the security checklist, and provides nothing.
    const owner = readCode(OWNER);
    expect(owner).not.toContain("sanitizeObject");
  });

  it("does not sanitize structured data along with the free text", () => {
    // `details` carries photo URLs and geocode output. Running a tag-stripper
    // across it is a wider blast radius than this item needs, and a URL is not
    // free text the owner typed into a prose field.
    const code = readCode(CONTEXT);
    expect(code).not.toContain("details: stripAllTags(");
    expect(code).not.toContain("sanitizeObject(listing)");
  });
});
