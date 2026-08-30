import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { MAIN_SITE_HOSTS, RETIRED_ENV_VARS } from "../src/lib/crossAppPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");

async function allSourceFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await allSourceFiles(full)));
    else if (/\.(js|mjs|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = await allSourceFiles(srcDir);
const sources = new Map(
  await Promise.all(files.map(async (f) => [path.relative(root, f), await readFile(f, "utf8")])),
);

/** The policy file documents the hosts, so it is allowed to name them. */
const POLICY_FILE = path.join("src", "lib", "crossAppPolicy.mjs");

// ── The decision, enforced ───────────────────────────────────────────────────
// A rule nothing checks is a preference. These fail the build if the long way
// round comes back.

test("nothing in Mission Control calls the main site's API", () => {
  const offenders = [];
  for (const [file, text] of sources) {
    if (file === POLICY_FILE) continue;
    for (const host of MAIN_SITE_HOSTS) {
      // A plain link for a human to click is fine; a fetch is not.
      const fetchToHost = new RegExp(`fetch\\(\\s*[\`"'][^\`"']*${host.replace(/\./g, "\\.")}`);
      if (fetchToHost.test(text)) offenders.push(`${file} → ${host}`);
    }
    if (/fetch\(\s*[`"'][^`"']*\/api\/admin\//.test(text)) {
      offenders.push(`${file} → the main site's /api/admin/*`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "Mission Control reaches Supabase and Airtable directly under its own RBAC — " +
      "see src/lib/crossAppPolicy.mjs for why a forwarded token and a shared " +
      "service secret were both rejected",
  );
});

test("the retired cross-app environment variable is not read again", () => {
  const offenders = [];
  for (const [file, text] of sources) {
    if (file === POLICY_FILE) continue;
    for (const name of RETIRED_ENV_VARS) {
      if (text.includes(`process.env.${name}`)) offenders.push(`${file} → ${name}`);
    }
  }
  assert.deepEqual(offenders, [], "reintroducing this variable is how the broken page came back");
});

// ── The capability that replaced it ──────────────────────────────────────────

const actions = sources.get(path.join("src", "app", "dashboard", "osint", "actions.js"));
const component = sources.get(path.join("src", "components", "osint", "OSINTControlCenter.js"));

test("the OSINT actions exist as server actions in this app", () => {
  assert.ok(actions, "no OSINT actions module");
  assert.match(actions, /^"use server";/);
  for (const fn of [
    "loadOsintWorkspace",
    "addOsintSignal",
    "generateOsintPrompt",
    "publishOsintBriefing",
  ]) {
    assert.match(actions, new RegExp(`export async function ${fn}\\(`), `${fn} is missing`);
  }
});

test("every OSINT action checks the tier before it touches data", () => {
  const bodies = actions.split("export async function ").slice(1);
  for (const body of bodies) {
    const name = body.slice(0, body.indexOf("("));
    const guard = body.indexOf("assertTier(staff,");
    const firstUse = body.search(/await admin\b|createAdminClient\(\)/);
    assert.notEqual(guard, -1, `${name} never enforces a tier`);
    assert.ok(guard < firstUse || firstUse === -1, `${name} touches data before enforcing the tier`);
  }
});

test("publishing an article is Ops Manager, not Agent", () => {
  const body = actions.slice(actions.indexOf("export async function publishOsintBriefing"));
  assert.match(body.slice(0, 1200), /assertTier\(staff, TIERS\.OPS_MANAGER\)/);
});

test("publishing writes an audit entry and a system event", () => {
  const body = actions.slice(actions.indexOf("export async function publishOsintBriefing"));
  assert.match(body, /action: "osint\.briefing\.publish"/);
  assert.match(body, /recordSystemEvent/);
  assert.match(body, /EVENTS\.AIRTABLE_PUBLISH_FAILED/);
});

test("the published flag is never set without a real Airtable record id", () => {
  // publishedMarkers throws without one; nothing may set the column directly.
  assert.match(actions, /publishedMarkers\(recordId\)/);
  assert.doesNotMatch(
    actions,
    /published_to_airtable:\s*true/,
    "a schema must never certify something that did not happen",
  );
  assert.match(actions, /published_to_airtable: false/, "a briefing must land as a draft");
});

test("the result says what actually happened, not what was intended", () => {
  // The old component reported "published live & synced to 3D Map" whatever the
  // Airtable hop did, including when it failed.
  assert.doesNotMatch(component, /published live & synced/);
  assert.match(component, /data\.airtable\?\.status === "published"/);
});

test("an unreadable queue is shown, not logged to a console nobody reads", () => {
  assert.match(component, /Could not read the OSINT queue/);
});

// ── The vendored bridge ──────────────────────────────────────────────────────

test("the vendored intel bridge keeps the main app's field mapping", async () => {
  const mine = await readFile(path.join(root, "src", "lib", "intelPublish.js"), "utf8");
  const theirs = await readFile(path.join(root, "..", "src", "lib", "intelPublish.js"), "utf8");

  const fieldsOf = (text) => {
    const start = text.indexOf("export function buildIntelFields");
    assert.notEqual(start, -1, "buildIntelFields missing");
    const body = text.slice(start, text.indexOf("export ", start + 1));
    return [...body.matchAll(/^\s{4}([A-Z][A-Za-z0-9_]*):/gm)].map((m) => m[1]).sort();
  };

  assert.deepEqual(
    fieldsOf(mine),
    fieldsOf(theirs),
    "the two copies publish different article shapes depending on which app pressed the button",
  );
});
