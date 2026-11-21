import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { publicationReviewSnapshot, reviewRecord } from "../src/lib/propertyLifecycleReview.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const operationPath = path.join(root, "src", "lib", "propertyLifecycleReconciliation.js");
const actionsPath = path.join(root, "src", "app", "dashboard", "operations", "actions.js");
const migrationPath = path.join(root, "..", "supabase", "migrations", "20261121000003_reconcile_property_publication.sql");

const record = {
  id: "recOne",
  createdTime: "2026-09-01T12:00:00.000Z",
  fields: { Slug: "fixture-one", Title: "Fixture One", Location: "San Juan", Approved_For_ScoutIt: true },
};
const listing = {
  id: "property-1", slug: "fixture-one", canonical_slug: "fixture-one", title: "Fixture One", location: "San Juan",
  owner_id: "staff-fixture-owner", publication_external_record_id: null, publication_sync_state: null,
  lifecycle_state: "live", pipeline_status: "approved", moderation_status: "pending",
  canonical_slug_locked_at: "2026-09-01T12:00:00Z", published_at: "2026-09-01T12:00:00Z",
  archived_at: null, withdrawn_at: null, permanently_removed_at: null, quietly_open_to_offers: false,
};
const inspect = (overrides) => reviewRecord({ record, properties: [listing], routing: "present", ...overrides });

test("historic public listing approval can receive a binding without promoting staff moderation", () => {
  const result = inspect();
  assert.equal(result.state, "unbound");
  assert.deepEqual(result.actions, ["bind_record"]);
  assert.equal(publicationReviewSnapshot(result.property).moderation_status, "pending");
});

test("duplicates, historical addresses and retained samples offer no write action", () => {
  for (const [fixture, expected] of [
    [{ duplicatePublicAddress: true }, "ambiguous"],
    [{ properties: [listing, { ...listing, id: "property-2" }] }, "ambiguous"],
    [{ historicalAddress: true }, "reserved_address"],
    [{ sample: true }, "sample"],
  ]) {
    const result = inspect(fixture);
    assert.equal(result.state, expected);
    assert.deepEqual(result.actions, []);
  }
});

test("binding requires matching address, listing details and recipient routing", () => {
  for (const [fixture, expected] of [
    [{ properties: [{ ...listing, canonical_slug: null }] }, "canonical_conflict"],
    [{ properties: [{ ...listing, publication_external_record_id: "recOther" }] }, "binding_conflict"],
    [{ properties: [{ ...listing, location: "Quezon City" }] }, "details_conflict"],
    [{ routing: "empty" }, "routing_unavailable"],
    [{ properties: [{ ...listing, publication_sync_state: "pending" }] }, "publication_pending"],
  ]) {
    const result = inspect(fixture);
    assert.equal(result.state, expected);
    assert.deepEqual(result.actions, []);
  }
});

test("restoration is restricted to the exact binding and respects staff holds", () => {
  const bound = { ...listing, publication_external_record_id: record.id };
  assert.equal(inspect({ properties: [bound] }).state, "ready");
  assert.deepEqual(inspect({ properties: [{ ...bound, lifecycle_state: "draft" }] }).actions, ["restore_live"]);
  assert.deepEqual(inspect({ properties: [{ ...bound, lifecycle_state: "off_market" }] }).actions, ["unpublish"]);
  assert.deepEqual(inspect({ properties: [{ ...bound, permanently_removed_at: "2026-11-01" }] }).actions, ["unpublish"]);
  assert.deepEqual(inspect({ properties: [{ ...listing, permanently_removed_at: "2026-11-01" }] }).actions, []);
});

test("only an established orphan can be reviewed for removal", () => {
  assert.deepEqual(inspect({ properties: [], now: Date.parse("2026-09-01T12:30:00.000Z") }).actions, ["unpublish"]);
  assert.deepEqual(inspect({ properties: [], now: Date.parse("2026-09-01T12:05:00.000Z") }).actions, []);
  assert.deepEqual(inspect({ properties: [], record: { ...record, createdTime: null } }).actions, []);
});

test("the operation rechecks the same record and fresh review before any mutation", async () => {
  const source = await readFile(operationPath, "utf8");
  assert.match(source, /Approved_For_ScoutIt === true/);
  assert.match(source, /candidate\.reviewHash !== expectedReviewHash \|\| !candidate\.actions\.includes\(decision\)/);
  assert.match(source, /await recordIntent\(candidate, table\.id\);\s*await readReviewedRecord\(table\.id, candidate, reviewed\.record\)/);
  assert.match(source, /Approved_For_ScoutIt: false/);
  assert.match(source, /confirmedWithdrawal\(await airtable\(endpoint\), candidate\)/);
  assert.doesNotMatch(source, /method: "DELETE"/);
});

test("database reconciliation is service-only and commits the lifecycle evidence with the review", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /p_expected IS DISTINCT FROM review_snapshot/);
  assert.match(sql, /get_property_lead_recipients/);
  assert.match(sql, /INSERT INTO public\.property_lifecycle_events/);
  assert.match(sql, /FROM PUBLIC, anon, authenticated;\s*GRANT EXECUTE/);
  assert.doesNotMatch(sql, /SET canonical_slug/);
});

test("review and catalogue retry check Super Admin and the original audit evidence", async () => {
  const source = await readFile(actionsPath, "utf8");
  const start = source.indexOf("export async function reconcileLifecycleCandidate");
  const end = source.indexOf("export async function cleanInvalidSampleChildSpaces", start);
  const body = source.slice(start, end);
  assert.equal([...body.matchAll(/assertTier\(staff, TIERS\.SUPER_ADMIN\)/g)].length, 2);
  assert.match(body, /logActionStrict/);
  assert.match(body, /\.intent/);
  assert.match(body, /\.complete/);
  assert.match(body, /\.failed/);
  assert.match(body, /WITHDRAWAL_AUDIT\.intent/);
  assert.match(body, /WITHDRAWAL_AUDIT\.refreshed/);
  assert.match(body, /verifyWithdrawnReview/);
});
