import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rbacPath = path.join(root, "src", "lib", "rbac.js");
const authenticatedReadActions = new Set([
  "src\\app\\dashboard\\brain\\actions.js#askBrain",
]);

async function loadTierPolicy() {
  const source = await readFile(rbacPath, "utf8");
  const tiers = source.match(/export const TIERS = (\{[\s\S]*?\n\});/);
  const labels = source.match(/export const TIER_LABELS = (\{[\s\S]*?\n\});/);
  const policy = source.match(
    /export function assertTier\(staff, minTier\) (\{[\s\S]*?\n\})\n\n\/\*\*/
  );
  assert.ok(tiers && labels && policy, "Expected the Mission Control tier policy");
  return Function(
    `const TIERS=${tiers[1]};const TIER_LABELS=${labels[1]};` +
      `const assertTier=function(staff,minTier)${policy[1]};` +
      "return {TIERS,assertTier};"
  )();
}

async function actionFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return actionFiles(target);
    return entry.isFile() && entry.name === "actions.js" ? [target] : [];
  }))).flat();
}

function functionSegment(source, start, nextStart = source.length) {
  const direct = source.slice(start, nextStart);
  if (direct.includes("await getCurrentStaff()")) return direct;
  const delegate = direct.match(/return\s+(\w+)\s*\(/)?.[1];
  if (!delegate) return direct;
  const helperStart = source.search(new RegExp(`async function ${delegate}\\s*\\(`));
  if (helperStart < 0) return direct;
  const helperEnd = source.slice(helperStart + 1).search(/\n(?:export )?async function\s+/);
  return source.slice(helperStart, helperEnd < 0 ? source.length : helperStart + 1 + helperEnd);
}

test("anonymous and inactive staff are denied", async () => {
  const { assertTier, TIERS } = await loadTierPolicy();
  assert.throws(() => assertTier(null, TIERS.AGENT), /Not authenticated/);
  assert.throws(
    () => assertTier({ active: false, tier: TIERS.SUPER_ADMIN }, TIERS.AGENT),
    /Not authenticated/
  );
});

test("wrong-tier staff are denied and valid-tier staff are allowed", async () => {
  const { assertTier, TIERS } = await loadTierPolicy();
  assert.throws(
    () => assertTier({ active: true, tier: TIERS.AGENT }, TIERS.OPS_MANAGER),
    /requires Ops Manager \(Tier 2\) or higher/
  );
  assert.doesNotThrow(() =>
    assertTier({ active: true, tier: TIERS.OPS_MANAGER }, TIERS.OPS_MANAGER)
  );
});

test("every exported dashboard Server Action authorizes before service-role access", async () => {
  const files = await actionFiles(path.join(root, "src", "app", "dashboard"));
  assert.ok(files.length > 0, "Expected Mission Control Server Action modules");

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const actions = [...source.matchAll(/export async function\s+(\w+)\s*\(/g)];
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index];
      const body = functionSegment(source, action.index, actions[index + 1]?.index);
      const staff = body.indexOf("await getCurrentStaff()");
      const tier = body.indexOf("assertTier(staff,");
      const denial = body.indexOf("if (!staff)");
      const admin = body.indexOf("createAdminClient()");
      const label = `${path.relative(root, file)}#${action[1]}`;

      assert.ok(staff >= 0, `${label} must resolve current staff`);
      if (authenticatedReadActions.has(label)) {
        assert.ok(denial > staff, `${label} must deny missing or inactive staff`);
      } else {
        assert.ok(tier > staff, `${label} must assert a minimum tier`);
      }
      assert.ok(
        admin < 0 || Math.max(tier, denial) < admin,
        `${label} must authorize before service-role access`
      );
    }
  }
});
