import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(root, "..");
const operationPath = path.join(root, "src", "lib", "demoAuthorityTransferOperation.js");
const actionsPath = path.join(root, "src", "app", "dashboard", "operations", "actions.js");
const formPath = path.join(root, "src", "app", "dashboard", "operations", "DemoAuthorityTransferForm.js");
const pagePath = path.join(root, "src", "app", "dashboard", "operations", "page.js");
const migrationPath = path.join(repoRoot, "supabase", "migrations", "20260824000001_demo_authority_transfer.sql");

test("dry-run resolves a unique Auth email and inventories eligible, blocked, and retained references", async () => {
  const source = await readFile(operationPath, "utf8");
  assert.match(source, /auth\.admin\.listUsers/);
  assert.match(source, /matches\.length !== 1/);
  assert.match(source, /properties.*owner_id/s);
  assert.match(source, /deal_routing_recipients.*recipient_id/s);
  for (const table of [
    "property_units", "deals", "property_broker_representations", "crm_tasks",
    "calendar_events", "calendar_connections", "user_connect_wallets",
    "connect_wallet_ledger", "crm_activity_log", "audit_logs",
  ]) assert.match(source, new RegExp(table));
  assert.match(source, /planHash/);
  assert.doesNotMatch(source, /jerzelguerra26@gmail\.com/i);
});

test("execute delegates one reviewed plan to an atomic RPC and post-verifies ownership", async () => {
  const source = await readFile(operationPath, "utf8");
  assert.match(source, /expectedPlanHash/);
  assert.match(source, /transfer_demo_authority_atomic/);
  assert.match(source, /verifyTransferredAuthority/);
  assert.doesNotMatch(source, /\.from\("properties"\)\.update/);

  const migration = await readFile(migrationPath, "utf8");
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /auth\.users/);
  assert.match(migration, /UPDATE public\.properties/);
  assert.match(migration, /EXECUTE 'SELECT count\(\*\) FROM public\.deal_routing_recipients source/);
  assert.match(migration, /EXECUTE 'UPDATE public\.deal_routing_recipients/);
  assert.match(migration, /deal_routing_recipients/);
  assert.match(migration, /request\.jwt\.claim\.role/);
  assert.doesNotMatch(migration, /IF current_user NOT IN/);
  assert.match(migration, /REVOKE ALL ON FUNCTION/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION.*service_role/s);
  assert.match(migration, /RAISE EXCEPTION 'TRANSFER_PLAN_CHANGED'/);
  assert.match(migration, /RAISE EXCEPTION 'BLOCKED_AUTHORITY_REFERENCE'/);
});

test("Mission Control exposes only a Super-Admin audited preview/execute workflow", async () => {
  const [actions, form, page] = await Promise.all([
    readFile(actionsPath, "utf8"), readFile(formPath, "utf8"), readFile(pagePath, "utf8"),
  ]);
  const start = actions.indexOf("export async function runDemoAuthorityTransfer");
  assert.ok(start >= 0);
  const body = actions.slice(start);
  assert.match(body, /assertTier\(staff, TIERS\.SUPER_ADMIN\)/);
  assert.match(body, /demo\.authority_transfer\.preview/);
  assert.match(body, /demo\.authority_transfer\.execute\.intent/);
  assert.match(body, /demo\.authority_transfer\.execute\.complete/);
  assert.match(body, /demo\.authority_transfer\.execute\.failed/);
  assert.match(body, /logActionStrict/);
  assert.match(form, /name="targetEmail"/);
  assert.match(form, /name="planHash"/);
  assert.match(form, /TRANSFER DEMO AUTHORITY/);
  assert.match(form, /Eligible to transfer/);
  assert.match(form, /Blocked authority/);
  assert.match(form, /Retained history/);
  assert.match(page, /DemoAuthorityTransferForm/);
});
