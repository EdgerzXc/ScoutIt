import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonical = path.join(root, "..", "supabase", "migrations", "20260809000002_onboarding_completion_contract.sql");
const bundled = path.join(root, "src", "lib", "migrations", "sql", "20260809000002_onboarding_completion_contract.sql");
const operation = path.join(root, "src", "lib", "onboardingMigrationOperation.js");
const action = path.join(root, "src", "app", "dashboard", "operations", "actions.js");

test("bundled onboarding migration is byte-identical to the canonical migration", async () => {
  const [canonicalBytes, bundledBytes] = await Promise.all([readFile(canonical), readFile(bundled)]);
  assert.deepEqual(bundledBytes, canonicalBytes);
  const operationSource = await readFile(operation, "utf8");
  const embedded = operationSource.match(/const ONBOARDING_MIGRATION_SQL = String\.raw`([\s\S]*?)`;/);
  assert.ok(embedded, "Expected a private embedded migration constant");
  assert.deepEqual(Buffer.from(embedded[1], "utf8"), canonicalBytes);
  assert.equal(
    createHash("sha256").update(bundledBytes).digest("hex").toUpperCase(),
    "CF7D01ED0B0F878EF8B88F6AA72139DE72B5A400C2B7FA774412CB985059F8D0"
  );
});

test("operation exposes no caller-provided or general SQL execution function", async () => {
  const source = await readFile(operation, "utf8");
  assert.doesNotMatch(source, /export\s+(?:async\s+)?function\s+(?:run|execute|query).*sql/i);
  assert.match(source, /applyFixedOnboardingMigration\(\)/);
  assert.match(source, /checksumMatches/);
  assert.match(source, /pg_advisory_xact_lock/);
  assert.match(source, /read_only:\s*false/);
});

test("migration action authorizes, records intent, and verifies completion", async () => {
  const source = await readFile(action, "utf8");
  const staff = source.indexOf("await getCurrentStaff()");
  const tier = source.indexOf("assertTier(staff, TIERS.SUPER_ADMIN)");
  const apply = source.indexOf("await applyFixedOnboardingMigration()");
  assert.ok(staff >= 0 && tier > staff && apply > tier);
  assert.match(source, /database\.migration\.intent/);
  assert.match(source, /database\.migration\.complete/);
  assert.match(source, /database\.migration\.failed/);
  assert.match(source, /verified\.schema\?\.state !== "applied"/);
});
