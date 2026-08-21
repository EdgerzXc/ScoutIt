import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repositoryRoot, "scripts", "approved-surfaces.json");

if (!existsSync(manifestPath)) {
  console.error("Owner-approved surface manifest is missing: scripts/approved-surfaces.json");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const failures = [];
const requiredSurfacePaths = [
  "src/components/board/ShowcaseStage.js",
  "src/app/layer/metropolis/page.js",
  "src/components/descent/BackgroundMetropolis.js",
];

for (const requiredPath of requiredSurfacePaths) {
  if (!manifest.surfaces?.some((surface) => surface.path === requiredPath)) {
    failures.push(`manifest: missing required lock for ${requiredPath}`);
  }
}

for (const surface of manifest.surfaces ?? []) {
  const absolutePath = path.join(repositoryRoot, surface.path);
  if (!existsSync(absolutePath)) {
    failures.push(`${surface.name}: missing ${surface.path}`);
    continue;
  }

  const normalizedSource = readFileSync(absolutePath, "utf8").replace(/\r\n/g, "\n");
  const actual = createHash("sha256").update(normalizedSource).digest("hex");
  if (actual !== surface.sha256) {
    failures.push(`${surface.name}: ${surface.path}\n  expected ${surface.sha256}\n  actual   ${actual}`);
  }
}

if (failures.length > 0) {
  console.error("\nOWNER-APPROVED SURFACE DRIFT DETECTED\n");
  console.error(failures.join("\n\n"));
  console.error("\nRestore the approved source, or obtain explicit owner approval before updating scripts/approved-surfaces.json. Never refresh these hashes as an automatic cleanup.\n");
  process.exit(1);
}

console.log(`Approved surface lock passed (${manifest.surfaces.length} surfaces).`);
