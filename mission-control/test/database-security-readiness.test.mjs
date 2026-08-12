import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src", "lib", "databaseSecurityReadiness.js");

test("database readiness is a fixed read-only Management API operation", async () => {
  const source = await readFile(sourcePath, "utf8");
  assert.match(source, /const SECURITY_QUERY/);
  assert.match(source, /read_only: true/);
  assert.match(source, /SUPABASE_ACCESS_TOKEN/);
  assert.doesNotMatch(source, /read_only: false|method:\s*"(?:PATCH|PUT|DELETE)"/);
});

test("database readiness covers storage uploads, RLS, dev policies, and replacement migrations", async () => {
  const source = await readFile(sourcePath, "utf8");
  assert.match(source, /storage.*objects/s);
  assert.match(source, /property_photos/);
  assert.match(source, /dev_all/);
  assert.match(source, /20260803000001/);
  assert.match(source, /20260806000001/);
  for (const table of ["properties", "user_profiles", "deals", "saved_intel", "connect_balances", "connect_transactions", "projects", "waitlist"]) assert.match(source, new RegExp(table));
});
