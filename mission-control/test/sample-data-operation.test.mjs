import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const operationPath = path.join(root, "src", "lib", "sampleDataOperation.js");
const actionsPath = path.join(root, "src", "app", "dashboard", "operations", "actions.js");

test("sample operation is fixed to one checkbox and seven known slugs", async () => {
  const source = await readFile(operationPath, "utf8");
  const expected = [
    "corner-unit-poblacion-strip", "cyber-sigma-tower-3", "one-ecom-center",
    "sea-breeze-loft-boracay-station-2", "the-foundry-warehouse-district-bgc",
    "the-meridian-hotel-cebu-it-park", "the-ridgeline-at-capitol-commons",
  ];
  for (const slug of expected) assert.match(source, new RegExp(`"${slug}"`));
  assert.equal((source.match(/^[ ]+"[a-z0-9-]+",$/gm) || []).length, 7);
  assert.match(source, /const FIELD_NAME = "Is_Sample"/);
  assert.match(source, /name: FIELD_NAME, type: "checkbox"/);
  assert.doesNotMatch(source, /formData|get\("record|delete|destroy/i);
});

test("sample operation fails closed on schema drift, missing records, and failed verification", async () => {
  const source = await readFile(operationPath, "utf8");
  assert.match(source, /fields\.length !== 1 \|\| fields\[0\]\.type !== "checkbox"/);
  assert.match(source, /!samples\.missing\.length && !samples\.duplicates\.length/);
  assert.match(source, /if \(!after\.samples\?\.allMarked\) throw new Error/);
  assert.match(source, /cache: "no-store"/);
});

test("both sample mutations require Super Admin and immutable intent/completion/failure audits", async () => {
  const source = await readFile(actionsPath, "utf8");
  for (const name of ["createSampleField", "markSampleListings"]) {
    const start = source.indexOf(`export async function ${name}`);
    assert.ok(start >= 0, `Expected ${name}`);
    const next = source.indexOf("export async function", start + 1);
    const body = source.slice(start, next < 0 ? source.length : next);
    assert.ok(body.indexOf("await getCurrentStaff()") >= 0);
    assert.ok(body.indexOf("assertTier(staff, TIERS.SUPER_ADMIN)") > body.indexOf("await getCurrentStaff()"));
    assert.match(body, /\.intent/);
    assert.match(body, /\.complete/);
    assert.match(body, /\.failed/);
  }
});
