import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = path.join(root, "src", "lib", "pilotCohortRegistry.js");
const actions = path.join(root, "src", "app", "dashboard", "operations", "actions.js");
const forms = path.join(root, "src", "app", "dashboard", "operations", "PilotCohortRegistryForms.js");
const page = path.join(root, "src", "app", "dashboard", "operations", "page.js");

test("pilot enrollment uses an existing opaque Auth UUID and stores no email", async () => {
  const [source, ui] = await Promise.all([readFile(registry, "utf8"), readFile(forms, "utf8")]);
  assert.match(source, /UUID_PATTERN/);
  assert.match(source, /auth\.admin\.getUserById\(normalized\.userId\)/);
  assert.ok(source.indexOf("getUserById(normalized.userId)") < source.indexOf('.from("pilot_participants").insert'));
  assert.doesNotMatch(source, /email_hash|email_address|invited_email|\.email\b/);
  assert.match(ui, /never enter or store their temporary email here/i);
  assert.doesNotMatch(ui, /name="email"/);
});

test("pilot lifecycle fails closed around offboarding, cohort closure, and deletion evidence", async () => {
  const source = await readFile(registry, "utf8");
  assert.match(source, /Offboard every active tester before closing the cohort/);
  assert.match(source, /Offboard the tester before confirming account deletion/);
  assert.match(source, /The Supabase Auth account still exists; deletion cannot be confirmed/);
  assert.match(source, /isExplicitUserNotFound/);
  assert.match(source, /Auth deletion state could not be proven/);
  assert.doesNotMatch(source, /auth\.admin\.deleteUser/);
});

test("every cohort mutation is Super Admin, exact-confirmation, and strict-audit controlled", async () => {
  const [actionSource, registrySource, pageSource] = await Promise.all([
    readFile(actions, "utf8"), readFile(registry, "utf8"), readFile(page, "utf8"),
  ]);
  for (const name of ["createPilotCohort", "enrollPilotParticipant", "changePilotCohortStatus", "offboardPilotParticipant", "confirmPilotAccountDeletion"]) {
    assert.match(actionSource, new RegExp(`export async function ${name}\\(`));
  }
  assert.match(actionSource, /assertTier\(staff, TIERS\.SUPER_ADMIN\)/);
  assert.match(actionSource, /logActionStrict\(\{ staff, action: `\$\{action\}\.intent`/);
  assert.match(actionSource, /action: `\$\{action\}\.complete`/);
  assert.match(actionSource, /action: `\$\{action\}\.failed`/);
  for (const phrase of ["CREATE PILOT COHORT", "ENROLL PILOT TESTER", "ACTIVATE PILOT COHORT", "CLOSE PILOT COHORT", "OFFBOARD PILOT TESTER", "CONFIRM TESTER ACCOUNT DELETED"]) {
    assert.ok(registrySource.includes(phrase));
  }
  assert.match(pageSource, /pilotCohortStatus\?\.schema\?\.state === "applied"/);
  assert.match(pageSource, /PilotCohortRegistryForms/);
});

