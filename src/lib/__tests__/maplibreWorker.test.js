import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const packagePath = require.resolve("maplibre-gl/package.json");
const installed = require(packagePath);
const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name);
  if (entry.name === "__tests__") return [];
  return entry.isDirectory() ? files(path) : path.endsWith(".js") ? [path] : [];
});

describe("A-132 MapLibre worker integration", () => {
  it("copies the matching worker and its relative shared import together", () => {
    const destination = mkdtempSync(join(tmpdir(), "scoutit-maplibre-"));
    try {
      execFileSync(process.execPath, [resolve(root, "scripts/copy-maplibre-worker.mjs")], { cwd: destination });
      for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
        expect(readFileSync(join(destination, "public/maplibre", installed.version, file))).toEqual(
          readFileSync(join(dirname(packagePath), "dist", file)),
        );
      }
      expect(readFileSync(join(destination, "public/maplibre", installed.version, "maplibre-gl-worker.mjs"), "utf8"))
        .toContain("./maplibre-gl-shared.mjs");
    } finally {
      rmSync(destination, { recursive: true, force: true });
    }
  });

  it("every engine consumer uses the configured shared entry", () => {
    const imports = files(resolve(root, "src")).filter((file) => /from ["']maplibre-gl["']/.test(readFileSync(file, "utf8")));
    expect(imports.map((file) => file.replaceAll("\\", "/"))).toEqual([
      resolve(root, "src/lib/maplibre.js").replaceAll("\\", "/"),
    ]);
    expect(read("src/lib/maplibre.js")).toContain("maplibregl.setWorkerUrl(`/maplibre/${maplibrePackage.version}/maplibre-gl-worker.mjs`)");
  });

  it("generates worker assets for regular and offline development/builds", () => {
    const { scripts, dependencies } = JSON.parse(read("package.json"));
    for (const hook of ["predev", "prebuild", "predev:offline", "prebuild:offline"]) {
      expect(scripts[hook]).toBe("node scripts/copy-maplibre-worker.mjs");
    }
    expect(dependencies["maplibre-gl"]).toBe(installed.version);
    expect(Number(installed.version.split(".")[0])).toBeGreaterThanOrEqual(6);
  });
});
