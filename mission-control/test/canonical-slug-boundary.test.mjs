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
  const guard = source.indexOf("titleChangeWouldDriftCanonicalUrl(current, body.title)");
  const update = source.indexOf(".update(patch)");
  const publish = source.indexOf("publishPropertyToAirtable(saved)");

  assert.ok(guard >= 0, "Expected the canonical-title guard");
  assert.ok(guard < update, "The title guard must run before the Supabase update");
  assert.ok(guard < publish, "The title guard must run before the Airtable publish");
  assert.match(source, /CANONICAL_SLUG_LOCKED/);
  assert.doesNotMatch(
    source,
    /update\(\{\s*slug:\s*result\.slug\s*\}\)/,
    "Ordinary staff edits must never overwrite the stored slug from Airtable"
  );
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
    path.join(root, "..", "supabase", "migrations", "20260802000003_property_lifecycle_safety_guards.sql"),
    "utf8"
  );
  assert.match(
    sql,
    /'reconciliation_required'\s*\)\s*\);\s*ALTER TABLE public\.property_lifecycle_events/
  );
});
