import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("A-330: MapLibre Worker Stale Version Prune Loop & Script Syntax Lint Gate", () => {
  it("scripts/copy-maplibre-worker.mjs contains a stale version pruning loop", () => {
    const scriptSrc = read("scripts/copy-maplibre-worker.mjs");
    expect(scriptSrc).toContain("rmSync");
    expect(scriptSrc).toContain("entry.isDirectory()");
    expect(scriptSrc).toContain("entry.name !== version");
  });

  it("scripts/lint-scripts.mjs exists and validates scripts with exit code 0", () => {
    expect(existsSync("scripts/lint-scripts.mjs")).toBe(true);
    const stdout = execFileSync(process.execPath, ["scripts/lint-scripts.mjs"], { encoding: "utf8" });
    expect(stdout).toContain("Script syntax audit passed");
  });

  it("package.json registers the lint:scripts command", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts["lint:scripts"]).toBe("node scripts/lint-scripts.mjs");
  });
});
