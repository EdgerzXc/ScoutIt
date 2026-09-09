import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// O-019 (#11): only brokers (own row, allowed columns) and staff/service
// paths may edit broker profiles. Verified 2026-09-09: no client UPDATE or
// UPSERT to `broker_profiles` / `researcher_profiles` exists anywhere in
// shipped code — the sole browser writer is the { user_id } auto-create
// INSERT, and live grants were revoked from anon/authenticated under U-016.
// Metric fields are therefore writable by nobody via the app (anti-gaming by
// design, not a missing feature); identity fields flow through the owner's
// own column-scoped row. This test pins that boundary so a future
// client-side writer cannot slip in silently.

const ROOT = process.cwd();
const WRITE_RE = /\.(update|upsert)\s*\(/;
const TARGET_RE = /['"]?(broker_profiles|researcher_profiles)['"]?/;

function clientWritesIn(source) {
  const hits = [];
  const lines = source.split(/\r?\n/);
  let inTargetBlock = false;
  let blockStart = 0;
  lines.forEach((line, i) => {
    const code = line.replace(/(^|\s)\/\/.*/, "$1");
    if (TARGET_RE.test(code) && /\.from\s*\(/.test(code)) {
      inTargetBlock = true;
      blockStart = i + 1;
    }
    if (inTargetBlock && WRITE_RE.test(code)) {
      hits.push({ line: i + 1, from: blockStart });
      inTargetBlock = false;
    }
    if (/;\s*$/.test(code) && !/await|return/.test(code)) inTargetBlock = false;
  });
  return hits;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      walk(full, out);
    } else if (full.endsWith(".js")) out.push(full);
  }
  return out;
}

describe("broker profile edit boundary — scanner", () => {
  it("flags a client update to the metric tables", () => {
    const bad = `const r = await supabase\n  .from('broker_profiles')\n  .update({ bio: x })\n  .eq('id', y);`;
    expect(clientWritesIn(bad)).toHaveLength(1);
  });

  it("ignores the auto-create insert and plain reads", () => {
    const good = `const r = await supabase\n  .from('broker_profiles')\n  .insert({ user_id: u })\n  .select()\n  .single();`;
    expect(clientWritesIn(good)).toHaveLength(0);
    const read = `await supabaseAdmin.from("broker_profiles").select("user_id").in("user_id", ids);`;
    expect(clientWritesIn(read)).toHaveLength(0);
  });
});

describe("broker profile edit boundary — shipped code", () => {
  it("contains no client UPDATE/UPSERT to broker or researcher profiles", () => {
    const offenders = [];
    for (const file of walk(path.join(ROOT, "src"))) {
      const hits = clientWritesIn(fs.readFileSync(file, "utf8"));
      if (hits.length) offenders.push(`${path.relative(ROOT, file)}:${hits[0].line}`);
    }
    expect(offenders).toEqual([]);
  });
});
