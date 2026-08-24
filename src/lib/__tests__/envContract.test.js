import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// A-015 — .env.example documented 12 keys while src/ read 44. A variable that is
// required but undocumented gets missed on a deploy, and most of this codebase
// degrades SILENTLY when one is absent: /api/reactions returned { ok: true }
// while writing nothing, and a broken AIRTABLE_API_KEY once served mock data on
// both Vercel projects without anyone noticing.
//
// This test derives the truth from the source so the two cannot drift again.
// It reads NAMES only and never touches .env.local or any real value.

const FRAMEWORK_PROVIDED = new Set([
  "NODE_ENV",
  "NEXT_RUNTIME",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
]);

function envNamesReadBySource(dir = "src", found = new Set()) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === "node_modules" || entry === "__tests__") continue;
      envNamesReadBySource(path, found);
      continue;
    }
    if (!entry.endsWith(".js")) continue;
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      found.add(match[1]);
    }
  }
  return found;
}

// Sentry and the Next instrumentation hooks live at the repository root, not in
// src/. They are application code and their variables belong in the contract, so
// the scan must reach them or the "orphaned" check produces a false positive.
const ROOT_APP_FILES = [
  "instrumentation.js",
  "instrumentation-client.js",
  "sentry.server.config.js",
  "sentry.edge.config.js",
];

function envNamesReadByRootConfigs(found = new Set()) {
  for (const file of ROOT_APP_FILES) {
    let source;
    try {
      source = readFileSync(file, "utf8");
    } catch {
      continue; // a config that does not exist cannot require a variable
    }
    for (const match of source.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      found.add(match[1]);
    }
  }
  return found;
}

function allEnvNamesRead() {
  return envNamesReadByRootConfigs(envNamesReadBySource());
}

function documentedNames() {
  const names = new Set();
  for (const line of readFileSync(".env.example", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (!trimmed.includes("=")) continue;
    names.add(trimmed.split("=", 1)[0].trim());
  }
  return names;
}

describe("the environment contract matches the code", () => {
  it("documents every variable the application reads", () => {
    const used = allEnvNamesRead();
    const documented = documentedNames();

    const undocumented = [...used]
      .filter((name) => !documented.has(name) && !FRAMEWORK_PROVIDED.has(name))
      .sort();

    expect(undocumented).toEqual([]);
  });

  it("does not document variables the application never reads", () => {
    const used = allEnvNamesRead();
    const documented = documentedNames();

    const orphaned = [...documented]
      .filter((name) => !used.has(name) && !FRAMEWORK_PROVIDED.has(name))
      .sort();

    expect(orphaned).toEqual([]);
  });

  it("carries no real secret values — it is a template, not a vault", () => {
    const body = readFileSync(".env.example", "utf8");

    // Real Supabase/Resend/Airtable/Mapbox credentials have recognisable shapes.
    // A placeholder must not look like any of them.
    expect(body).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/); // JWT (service role / anon)
    expect(body).not.toMatch(/re_[A-Za-z0-9]{20,}/); // Resend
    expect(body).not.toMatch(/\bpat[A-Za-z0-9]{14,}/); // Airtable PAT
    expect(body).not.toMatch(/sk\.[A-Za-z0-9_-]{40,}/); // Mapbox secret token
  });

  it("explains what each variable is for", () => {
    // A bare list of names would satisfy the drift check while teaching nobody
    // anything. Every documented key must sit under a comment line.
    const lines = readFileSync(".env.example", "utf8").split("\n");
    const undescribed = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
      const name = trimmed.split("=", 1)[0].trim();

      // Walk back to the nearest non-blank line; it must be a comment.
      let cursor = index - 1;
      while (cursor >= 0 && lines[cursor].trim() === "") cursor -= 1;
      if (cursor < 0 || !lines[cursor].trim().startsWith("#")) undescribed.push(name);
    });

    expect(undescribed).toEqual([]);
  });
});
