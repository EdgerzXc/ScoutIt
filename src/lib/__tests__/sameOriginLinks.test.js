import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const APP_ROOT = resolve(process.cwd(), "src/app");
const SRC_ROOT = resolve(process.cwd(), "src");

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:js|jsx|mjs)$/.test(entry.name) ? [path] : [];
  });
}

function routeHasPage(pathname) {
  if (pathname === "/") return existsSync(join(APP_ROOT, "page.js"));
  const segments = pathname.split("/").filter(Boolean);
  let candidates = [APP_ROOT];

  for (const segment of segments) {
    candidates = candidates.flatMap((directory) => {
      if (!existsSync(directory)) return [];
      return readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => entry.name === segment || /^\[\[?\.{0,3}[^\]]+\]\]?$/.test(entry.name))
        .map((entry) => join(directory, entry.name));
    });
  }

  return candidates.some((directory) => existsSync(join(directory, "page.js")));
}

describe("same-origin navigation contracts", () => {
  const sources = sourceFiles(SRC_ROOT);

  it("points every literal page link at an App Router page", () => {
    const broken = [];
    const hrefPattern = /\bhref\s*(?:=|:)\s*["'](\/[^"'?#]*)["']/g;

    for (const file of sources) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(hrefPattern)) {
        const pathname = match[1].replace(/\/$/, "") || "/";
        if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) continue;
        if (!routeHasPage(pathname)) {
          broken.push(`${relative(process.cwd(), file)} -> ${pathname}`);
        }
      }
    }

    expect(broken).toEqual([]);
  }, 25000);

  it("does not hardcode deep Intel slugs that can drift from Airtable", () => {
    const offenders = [];
    const intelPattern = /["']\/intel\/[^"'${}?#]+["']/g;

    for (const file of sources) {
      const source = readFileSync(file, "utf8");
      if (intelPattern.test(source)) offenders.push(relative(process.cwd(), file));
    }

    expect(offenders).toEqual([]);
  });
});
