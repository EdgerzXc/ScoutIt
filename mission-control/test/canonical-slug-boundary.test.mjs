import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  canonicalSlugFor,
  hasLockedCanonicalUrl,
  titleChangeWouldDriftCanonicalUrl,
} from "../src/lib/canonicalSlugPolicy.mjs";
import { approvePropertyPublication } from "../src/lib/propertyPublication.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("draft titles remain editable before first publication", () => {
  const draft = { title: "Draft A", lifecycle_state: "draft", pipeline_status: "pending" };
  assert.equal(hasLockedCanonicalUrl(draft), false);
  assert.equal(titleChangeWouldDriftCanonicalUrl(draft, "Draft B"), false);
});

test("live and legacy-approved titles are locked", () => {
  assert.equal(
    titleChangeWouldDriftCanonicalUrl(
      { title: "Live A", lifecycle_state: "live", canonical_slug: "live-a" },
      "Live B"
    ),
    true
  );
  assert.equal(
    titleChangeWouldDriftCanonicalUrl(
      { title: "Legacy A", pipeline_status: "approved", slug: "legacy-a" },
      "Legacy B"
    ),
    true
  );
});

test("an unchanged live title and non-title edits are allowed", () => {
  const live = { title: "Live A", lifecycle_state: "live", canonical_slug: "live-a" };
  assert.equal(titleChangeWouldDriftCanonicalUrl(live, "Live A"), false);
  assert.equal(titleChangeWouldDriftCanonicalUrl(live, undefined), false);
  assert.equal(canonicalSlugFor(live), "live-a");
});

test("the staff property route rejects title drift before any update or Airtable publish", async () => {
  const source = await readFile(path.join(root, "src", "app", "api", "property", "route.js"), "utf8");
  const guard = source.indexOf("titleChangeWouldDriftCanonicalUrl(current, text.title)");
  const update = source.indexOf(".update(patch)");
  const publish = source.indexOf("await editBoundProperty(binding,");

  assert.ok(guard >= 0, "Expected the canonical-title guard");
  assert.ok(guard < update, "The title guard must run before the Supabase update");
  assert.ok(guard < publish, "The title guard must run before the Airtable publish");
  assert.doesNotMatch(source, /publicationProvider\.activate|publishPropertyToAirtable/);
  assert.match(source, /CANONICAL_SLUG_LOCKED/);
  assert.doesNotMatch(
    source,
    /update\(\{\s*slug:\s*result\.slug\s*\}\)/,
    "Ordinary staff edits must never overwrite the stored slug from Airtable"
  );
});

function publicationFixture(overrides = {}) {
  const property = {
    id: "property-1", owner_id: "owner-1", title: "Listing", pipeline_status: "pending",
    lifecycle_state: "draft", moderation_status: "pending", publication_external_record_id: null,
    ...overrides,
  };
  const binding = { slug: "canonical-address", recordId: "recBound" };
  const calls = [];
  const saved = { confirmed: true, current: property };
  const query = {
    is: () => query,
    eq: () => query,
    select: () => ({ maybeSingle: async () => ({ data: saved.confirmed ? { id: property.id } : null }) }),
  };
  const admin = {
    from: () => ({
      update: (patch) => { calls.push(["save", patch]); return query; },
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: saved.current }) }) }),
    }),
  };
  const args = {
    admin, property, now: "2026-11-21T00:00:00.000Z",
    recordIntent: async () => { calls.push(["audit"]); },
    isReserved: async (_client, slug) => { calls.push(["reserved", slug]); return false; },
    provider: {
      stage: async () => { calls.push(["stage"]); return binding; },
      activate: async (reference) => { calls.push(["activate", reference]); },
      withdraw: async (id) => { calls.push(["withdraw", id]); },
      removeDraft: async (id) => { calls.push(["remove", id]); },
      refresh: async (withdrawn = []) => { calls.push(["refresh", withdrawn]); return { purged: true }; },
    },
  };
  return { args, binding, calls, saved };
}

test("staff approval waits for the audit and exact provider result before saving the lifecycle", async () => {
  const { args, binding, calls } = publicationFixture();
  const result = await approvePropertyPublication(args);
  assert.deepEqual(result, { ...binding, success: true, publicCachePending: false });
  assert.deepEqual(calls.map(([name]) => name), ["audit", "stage", "reserved", "activate", "save", "refresh"]);
  assert.equal(calls[4][1].publication_external_record_id, binding.recordId);
  assert.equal(calls[4][1].canonical_slug, binding.slug);
  assert.equal(calls[4][1].pipeline_status, "approved");
  assert.equal(Object.hasOwn(calls[4][1], "updated_at"), false);
});

test("a concierge draft marked ready for review can proceed through ordinary approval", async () => {
  const { args } = publicationFixture({ pipeline_status: "draft_ready_for_review" });
  assert.equal((await approvePropertyPublication(args)).success, true);
});

test("staff approval blocks unbound history and protected records without an Airtable write", async () => {
  for (const property of [{ canonical_slug: "legacy" }, { lifecycle_state: "staff_suspended" }]) {
    const { args, calls } = publicationFixture(property);
    assert.ok((await approvePropertyPublication(args)).error);
    assert.deepEqual(calls, []);
  }
});

test("a failed Supabase commit unpublishes only the new record and does not report success", async () => {
  const { args, binding, calls, saved } = publicationFixture();
  saved.confirmed = false;
  const result = await approvePropertyPublication(args);
  assert.equal(result.recovered, true);
  assert.equal(result.success, undefined);
  assert.deepEqual(calls.slice(-3), [
    ["withdraw", binding.recordId], ["refresh", [binding]], ["remove", binding.recordId],
  ]);
});

test("a concurrent successful approval of the same binding is not rolled back", async () => {
  const { args, binding, calls, saved } = publicationFixture({ canonical_slug: "canonical-address", publication_external_record_id: "recBound" });
  saved.confirmed = false;
  saved.current = { ...args.property, pipeline_status: "approved", lifecycle_state: "live" };
  assert.equal((await approvePropertyPublication(args)).success, true);
  assert.deepEqual(calls, [["audit"], ["activate", binding], calls[2], ["refresh", []]]);
  assert.equal(calls[2][0], "save");
});

test("historical property URLs use a permanent redirect", async () => {
  const page = await readFile(
    path.join(root, "..", "src", "app", "property", "[id]", "page.js"),
    "utf8"
  );
  assert.match(page, /import \{ notFound, permanentRedirect \} from "next\/navigation"/);
  assert.match(page, /permanentRedirect\(`\/property\/\$\{redirectSlug\}`\)/);
});

test("the unapplied lifecycle migration has a complete sync-state constraint", async () => {
  const sql = await readFile(
    path.join(root, "..", "supabase", "migrations", "20260802000007_property_lifecycle_safety_guards.sql"),
    "utf8"
  );
  assert.match(
    sql,
    /'reconciliation_required'\s*\)\s*\);\s*ALTER TABLE public\.property_lifecycle_events/
  );
});
