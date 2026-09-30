// A-170 inventory: how many raw colour literals still sit in JS, and where.
// Comment blocks are stripped first — a hex inside a note is not a rendered
// colour, and counting those inflated earlier estimates. This is a measurement,
// not a gate: literals inside canvas/WebGL/MapLibre palettes are deliberate, so
// read the top of the list before calling any of it debt.
//   node scripts/inventory-design-debt.mjs [--top=15]
import fs from "node:fs";
import path from "node:path";

const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
const RGBA = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;
const roots = ["src/app", "src/components", "src/lib"];
const rows = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/__tests__|node_modules|\.next/.test(full)) walk(full);
      continue;
    }
    if (!/\.js$/.test(entry.name) || /\.test\.js$/.test(entry.name)) continue;
    const text = fs.readFileSync(full, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const hex = (text.match(HEX) || []).length;
    const rgb = (text.match(RGBA) || []).length;
    if (hex + rgb) rows.push({ hex, rgb, file: full.replace(/\\/g, "/").replace(/^.*?ScoutIt\//, "") });
  }
}
roots.forEach(walk);
rows.sort((a, b) => (b.hex + b.rgb) - (a.hex + a.rgb));

const top = Number(/top=(\d+)/.exec(process.argv.join(" "))?.[1] ?? 15);
const hexTotal = rows.reduce((s, r) => s + r.hex, 0);
const rgbTotal = rows.reduce((s, r) => s + r.rgb, 0);
console.log(`hex literals: ${hexTotal} | rgb()/rgba() literals: ${rgbTotal} | files: ${rows.length}`);
console.log(`top ${top}:`);
for (const r of rows.slice(0, top)) {
  console.log(`  ${String(r.hex).padStart(4)} hex  ${String(r.rgb).padStart(4)} rgb  ${r.file}`);
}
