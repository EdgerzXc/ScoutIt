import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const {
  JEV_INTENTS,
  classifyIntent,
  parsePolicyQuestion,
  compileSupabaseQuery,
  compileAirtableFormula,
  compileSpatialFilter,
  compileConciergePreflight,
  lintResaCompliance,
  processJevQuery,
} = await import(pathToFileURL(resolve(import.meta.dirname, "../src/lib/jevEngine.js")).href);

test("Jev Engine (Mission Control): classifies internal policy intent", () => {
  assert.equal(classifyIntent("What is the dual-cms policy?"), JEV_INTENTS.INTERNAL_POLICY_RULE);
  assert.equal(classifyIntent("Explain honest blank rule"), JEV_INTENTS.INTERNAL_POLICY_RULE);
});

test("Jev Engine (Mission Control): answers policy questions with verbatim citations", () => {
  const ans = parsePolicyQuestion("What is the dual-cms separation rule?");
  assert.equal(ans.answered, true);
  assert.equal(ans.policyId, "DUAL_CMS_INVARIANT");
  assert.match(ans.verbatim, /AIRTABLE = Public Read-Only Content/);
  assert.match(ans.verbatim, /SUPABASE = Private User Data/);
});

test("Jev Engine (Mission Control): compiles Supabase queries with zero data egress", () => {
  const query = compileSupabaseQuery("Find accepted deals in the system");
  assert.equal(query.target, "supabase");
  assert.equal(query.table, "deals");
  assert.equal(query.zeroEgress, true);
});

test("Jev Engine (Mission Control): compiles Airtable formulas deterministically", () => {
  const query = compileAirtableFormula("Commercial spaces in BGC with at least 200 sqm");
  assert.equal(query.target, "airtable");
  assert.match(query.formula, /\{SpaceCategory\} = 'Commercial'/);
  assert.match(query.formula, /\{Floor_Area_SQM\} >= 200/);
});

test("Jev Engine (Mission Control): lints RESA RA 9646 compliance", () => {
  const pass = lintResaCompliance({ prcLicense: "12345678", brokerage: "Real Estate Corp" });
  assert.equal(pass.compliant, true);

  const fail = lintResaCompliance({ prcLicense: "99", brokerage: "Real Estate Corp" });
  assert.equal(fail.compliant, false);
});

test("Jev Engine (Mission Control): processJevQuery orchestrates cleanly", () => {
  const outcome = processJevQuery("What is rule AGENTS §1 dark mode dna?");
  assert.equal(outcome.intent, JEV_INTENTS.INTERNAL_POLICY_RULE);
  assert.equal(outcome.result.answered, true);
});
