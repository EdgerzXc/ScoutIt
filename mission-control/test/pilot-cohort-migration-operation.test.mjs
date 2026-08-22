import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonical = path.join(root, "..", "supabase", "migrations", "20260811000002_pilot_cohort_registry.sql");
const bundled = path.join(root, "src", "lib", "migrations", "sql", "20260811000002_pilot_cohort_registry.sql");
const operation = path.join(root, "src", "lib", "pilotCohortMigrationOperation.js");
const action = path.join(root, "src", "app", "dashboard", "operations", "actions.js");

test("pilot cohort migration is byte-identical and checksum locked", async () => {
  const [canonicalBytes, bundledBytes, source] = await Promise.all([
    readFile(canonical), readFile(bundled), readFile(operation, "utf8"),
  ]);
  assert.deepEqual(bundledBytes, canonicalBytes);
  const embedded = source.match(/const MIGRATION_SQL = String\.raw`([\s\S]*?)`;/);
  assert.ok(embedded);
  assert.deepEqual(Buffer.from(embedded[1], "utf8"), canonicalBytes);
  assert.equal(createHash("sha256").update(bundledBytes).digest("hex").toUpperCase(),
    "A6B33FFE65B919B8AE1FBA7C1F05CF8120764072F30BFB595FECFB0BB82FB674");
});

test("pilot identity stays private, relational, and independent of product tables", async () => {
  const sql = await readFile(canonical, "utf8");
  assert.match(sql, /enable row level security/g);
  assert.match(sql, /revoke all on table public\.pilot_cohorts from anon, authenticated/);
  assert.match(sql, /revoke all on table public\.pilot_participants from anon, authenticated/);
  assert.match(sql, /user_id uuid not null/);
  assert.match(sql, /where offboarded_at is null/);
  assert.match(sql, /Rows survive account deletion/);
  assert.doesNotMatch(sql, /email\s+text/i);
  assert.doesNotMatch(sql, /alter table public\.(properties|user_profiles|deals|inquiries)/i);
});

test("pilot registry apply path is fixed, guarded, backup-gated, and audited", async () => {
  const [source, actionSource] = await Promise.all([readFile(operation, "utf8"), readFile(action, "utf8")]);
  assert.match(source, /applyFixedPilotCohortMigration\(\)/);
  assert.match(source, /pg_advisory_xact_lock/);
  assert.match(source, /backup\.ready/);
  assert.match(source, /read_only: false/);
  assert.doesNotMatch(source, /export\s+(?:async\s+)?function\s+(?:run|execute|query).*sql/i);
  assert.match(actionSource, /database\.pilot_cohort_migration\.intent/);
  assert.match(actionSource, /database\.pilot_cohort_migration\.complete/);
  assert.match(actionSource, /database\.pilot_cohort_migration\.failed/);
});

