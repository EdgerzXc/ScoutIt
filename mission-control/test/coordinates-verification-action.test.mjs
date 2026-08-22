import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(
  path.join(root, "src", "app", "dashboard", "coordinates", "actions.js"),
  "utf8",
);

// The admin client is a `const`, so any use ahead of its declaration inside the
// same function body throws at call time and never at build time. This asserts
// the ordering the temporal dead zone would otherwise punish silently.
function bodyOf(name) {
  const start = source.indexOf(`export async function ${name}(`);
  assert.notEqual(start, -1, `${name} is not exported`);
  const next = source.indexOf("export async function ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

for (const name of ["setVerifiedCoordinates", "loadFlaggedCoordinates"]) {
  test(`${name} creates the admin client before it queries with it`, () => {
    const body = bodyOf(name);
    const declared = body.indexOf("const supabase = createAdminClient();");
    assert.notEqual(declared, -1, `${name} never creates an admin client`);
    const firstUse = body.indexOf("await supabase");
    assert.notEqual(firstUse, -1, `${name} never queries`);
    assert.ok(declared < firstUse, `${name} uses supabase before declaring it`);
  });

  test(`${name} refuses non-staff and sub-agent callers`, () => {
    const body = bodyOf(name);
    assert.match(body, /await getCurrentStaff\(\)/);
    assert.match(body, /assertTier\(staff, TIERS\.AGENT\)/);
    const guard = body.indexOf("assertTier(staff, TIERS.AGENT)");
    const firstUse = body.indexOf("await supabase");
    assert.ok(guard < firstUse, `${name} queries before enforcing tier`);
  });
}

test("the flagged-coordinates read selects the real pipeline_status column", () => {
  assert.match(bodyOf("loadFlaggedCoordinates"), /pipeline_status/);
});
