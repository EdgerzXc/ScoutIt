import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const operationPath = path.join(root, "src", "lib", "propertyLifecycleReconciliation.js");
const actionsPath = path.join(root, "src", "app", "dashboard", "operations", "actions.js");

test("reconciliation reads every Airtable-public slug and refuses to invent missing rows", async () => {
  const source = await readFile(operationPath, "utf8");
  assert.match(source, /Approved_For_ScoutIt === true/);
  assert.match(source, /state = "missing_supabase"/);
  assert.match(source, /state = "canonical_conflict"/);
  assert.match(source, /state = "permanently_removed"/);
  assert.match(source, /state = "staff_suspended"/);
  assert.doesNotMatch(source, /\.from\("properties"\)\.insert/);
});

test("restore requires a fresh restorable hash, canonical/routing evidence, lifecycle event, and post-verification", async () => {
  const source = await readFile(operationPath, "utf8");
  assert.match(source, /candidate\.state !== "restorable" \|\| candidate\.reviewHash !== expectedReviewHash/);
  assert.match(source, /canonical_slug: candidate\.slug/);
  assert.match(source, /lifecycle_state: "live"/);
  assert.match(source, /property_lifecycle_events/);
  assert.match(source, /operation_key: operationKey/);
  assert.match(source, /verified\?\.state !== "ready"/);
});

test("unpublish is the only resolution for blocked drift and verifies removal from public discovery", async () => {
  const source = await readFile(operationPath, "utf8");
  assert.match(source, /candidate\.state === "ready" \|\| candidate\.reviewHash !== expectedReviewHash/);
  assert.match(source, /Approved_For_ScoutIt: false/);
  assert.match(source, /drifted record remains public/);
  assert.doesNotMatch(source, /delete|destroy/i);
});

test("reconciliation Server Action is Super-Admin-only and strictly audited", async () => {
  const source = await readFile(actionsPath, "utf8");
  const start = source.indexOf("export async function reconcileLifecycleCandidate");
  assert.ok(start >= 0);
  const body = source.slice(start);
  assert.ok(body.indexOf("await getCurrentStaff()") >= 0);
  assert.ok(body.indexOf("assertTier(staff, TIERS.SUPER_ADMIN)") > body.indexOf("await getCurrentStaff()"));
  assert.match(body, /logActionStrict/);
  assert.match(body, /\.intent/);
  assert.match(body, /\.complete/);
  assert.match(body, /\.failed/);
});
