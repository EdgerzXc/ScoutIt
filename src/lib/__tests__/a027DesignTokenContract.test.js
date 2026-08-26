import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("A-027 loading surfaces use ScoutIt design tokens", () => {
  it.each([
    "src/components/professionals/ProfessionalDirectorySkeleton.js",
    "src/app/property/page.js",
  ])("does not add raw hex colors to %s", (relativePath) => {
    const source = read(relativePath);
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("keeps the professional directory page background tokenized", () => {
    const source = read("src/components/professionals/professionalDirectory.module.css");
    const pageRule = source.match(/\.page\s*\{[^}]+\}/)?.[0] || "";

    expect(pageRule).toContain("background: var(--bg)");
    expect(pageRule).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
