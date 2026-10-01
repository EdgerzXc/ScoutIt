import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const packagePath = require.resolve("maplibre-gl/package.json");
const { version } = require(packagePath);
const dist = join(dirname(packagePath), "dist");
const destination = join(process.cwd(), "public", "maplibre", version);

mkdirSync(destination, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, file), join(destination, file));
}
