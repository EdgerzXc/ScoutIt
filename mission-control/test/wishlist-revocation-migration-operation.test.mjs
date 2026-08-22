import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonical = path.join(root, "..", "supabase", "migrations", "20260811000001_wishlist_share_revocation.sql");
const bundled = path.join(root, "src", "lib", "migrations", "sql", "20260811000001_wishlist_share_revocation.sql");
const operation = path.join(root, "src", "lib", "wishlistRevocationMigrationOperation.js");
const action = path.join(root, "src", "app", "dashboard", "operations", "actions.js");

test("bundled wishlist revocation migration is byte-identical and checksum locked", async () => {
  const [canonicalBytes, bundledBytes, source] = await Promise.all([readFile(canonical), readFile(bundled), readFile(operation, "utf8")]);
  assert.deepEqual(bundledBytes, canonicalBytes);
  const embedded = source.match(/const MIGRATION_SQL = String\.raw`([\s\S]*?)`;/);
  assert.ok(embedded);
  assert.deepEqual(Buffer.from(embedded[1], "utf8"), canonicalBytes);
  assert.equal(createHash("sha256").update(bundledBytes).digest("hex").toUpperCase(), "3EADAA2D4CA84CAAEE940D24CC5EAFDFDE9CC4C426D7EF59969998124207E10B");
});

test("wishlist migration is fixed, guarded, backup checked, and not a SQL console", async () => {
  const source = await readFile(operation, "utf8");
  assert.match(source, /applyFixedWishlistRevocationMigration\(\)/);
  assert.match(source, /pg_advisory_xact_lock/);
  assert.match(source, /read_only: false/);
  assert.match(source, /backup\.ready/);
  assert.doesNotMatch(source, /export\s+(?:async\s+)?function\s+(?:run|execute|query).*sql/i);
});

test("wishlist migration action is Super Admin gated and strictly audited", async () => {
  const source = await readFile(action, "utf8");
  assert.match(source, /applyWishlistRevocationMigration/);
  assert.match(source, /database\.wishlist_revocation_migration\.intent/);
  assert.match(source, /database\.wishlist_revocation_migration\.complete/);
  assert.match(source, /database\.wishlist_revocation_migration\.failed/);
});
