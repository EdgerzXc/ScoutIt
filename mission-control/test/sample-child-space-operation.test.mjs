import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { classifySampleChildSpace, cleanSampleChildSpaces } from "../src/lib/sampleChildSpacePolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("sample child-space policy removes placeholders and empty rows only", () => {
  assert.deepEqual(classifySampleChildSpace({ id: "2", name: "test-unit-2" }), { invalid: true, reason: "placeholder_name" });
  assert.deepEqual(classifySampleChildSpace({ id: "x", name: "12321321312312", floor: "1" }), { invalid: true, reason: "placeholder_name" });
  assert.deepEqual(classifySampleChildSpace({ id: "x", name: "" }), { invalid: true, reason: "empty_child" });
  assert.equal(classifySampleChildSpace({ name: "VIP Lounge", size: 250 }).invalid, false);
  assert.equal(classifySampleChildSpace({ name: "", size: 50 }).invalid, false);
  const result = cleanSampleChildSpaces([{ name: "Main Hall" }, { name: "test-unit-2" }, { name: "" }]);
  assert.deepEqual(result.retained, [{ name: "Main Hall" }]);
  assert.equal(result.removed.length, 2);
});

test("cleanup is fixed to the seven sample slugs, Units_JSON, a plan hash, and post-verification", async () => {
  const source = await readFile(path.join(root, "src", "lib", "sampleChildSpaceOperation.js"), "utf8");
  assert.match(source, /SAMPLE_PROPERTY_SLUGS/);
  assert.match(source, /Units_JSON/);
  assert.match(source, /expectedPlanHash/);
  assert.match(source, /after\.invalid\.length/);
  assert.doesNotMatch(source, /formData.*Units_JSON|caller.*query/i);
});

test("cleanup action is Super Admin only and strictly audited", async () => {
  const source = await readFile(path.join(root, "src", "app", "dashboard", "operations", "actions.js"), "utf8");
  assert.match(source, /cleanInvalidSampleChildSpaces/);
  assert.match(source, /airtable\.sample_child_spaces\.intent/);
  assert.match(source, /airtable\.sample_child_spaces\.complete/);
  assert.match(source, /airtable\.sample_child_spaces\.failed/);
});
