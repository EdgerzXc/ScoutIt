// Finds CSS custom properties that are USED but never DECLARED.
// NEW_IDEAS_2.md §63.5.
//
// Exists because an undeclared `var(--x)` with no fallback is invalid at
// computed-value time: the declaration is silently dropped, the element
// inherits, and there is NO error, NO warning and NO visible failure in the
// theme that happens to inherit something close enough. That is the same class
// of bug as mixing the `-rgb` and `-ch` channel forms (§61), and it shipped
// nine `color: var(--on-surface)` declarations — `on-surface` is a TAILWIND
// palette key, not a CSS variable, so nothing ever declared it.
//
//   node scripts/verify-tokens.mjs
//
// Exits non-zero if any used-but-undeclared token is found, so it can be wired
// into CI alongside verify-contrast.mjs.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".css")) out.push(p);
  }
  return out;
};

const files = walk("src");

const declared = new Set();
const used = new Map(); // token -> Set(file)

for (const f of files) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) declared.add(m[1]);
  // Only flag var() calls WITHOUT a fallback — `var(--x, #fff)` degrades safely.
  for (const m of s.matchAll(/var\((--[a-zA-Z0-9-]+)\s*(,)?/g)) {
    if (m[2]) continue;
    if (!used.has(m[1])) used.set(m[1], new Set());
    used.get(m[1]).add(f);
  }
}

// Declared outside CSS (Next injects these from next/font).
const EXTERNAL = new Set(["--font-geist-sans", "--font-geist-mono"]);

const missing = [...used.keys()]
  .filter((t) => !declared.has(t) && !EXTERNAL.has(t))
  .sort();

if (missing.length === 0) {
  console.log(`\n  ${files.length} CSS files · ${declared.size} tokens declared · no undeclared var() found.\n`);
  process.exit(0);
}

console.log("\n  USED BUT NEVER DECLARED — these declarations are silently dropped:\n");
for (const t of missing) {
  console.log(`  ${t}`);
  for (const f of [...used.get(t)].sort()) console.log(`      ${f}`);
}
console.log(`\n  ${missing.length} undeclared token(s).\n`);
process.exit(1);
