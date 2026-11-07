import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const packagePath = require.resolve("maplibre-gl/package.json");
const { version } = require(packagePath);
const dist = join(dirname(packagePath), "dist");
const baseMaplibreDir = join(process.cwd(), "public", "maplibre");
const destination = join(baseMaplibreDir, version);

mkdirSync(destination, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, file), join(destination, file));
}

// Prune stale version directories to prevent accumulation of multi-version artifacts
if (existsSync(baseMaplibreDir)) {
  for (const entry of readdirSync(baseMaplibreDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== version) {
      rmSync(join(baseMaplibreDir, entry.name), { recursive: true, force: true });
    }
  }
}
