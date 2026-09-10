import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const BRAIN = "src/lib/brain.js";
// The main app lives one level up. Read-only, and only in a test — the build
// itself must never reach outside this root (the 2026-08-30 Sentry outage).
const MAIN_APP_MODEL = "../src/lib/geminiModel.js";

// ── A-124 — the two Gemini models have opposite requirements ────────────────
//
// GENERATION rots if pinned. A hardcoded `gemini-2.5-flash` broke every AI route
// in the main app in July 2026 when Google retired it for new keys; the fix was
// a `-latest` alias in src/lib/geminiModel.js. Mission Control kept a hardcoded
// `gemini-2.0-flash` and never received that fix — and because the Brain has
// never been run (both tables hold 0 rows), nobody would have found out until
// the first person tried to use it.
//
// EMBEDDING breaks if it floats. `brain_chunks.embedding` is `vector(768)`;
// another model can emit another width, and vectors from two models are not
// comparable at all — mixing them makes similarity meaningless without erroring.

test("the generation model floats and cannot rot", () => {
  const src = stripComments(read(BRAIN));
  assert.match(
    src,
    /GEN_MODEL = `models\/\$\{process\.env\.GEMINI_MODEL \|\| "gemini-flash-latest"\}`/,
    "generation model must use the -latest alias with a GEMINI_MODEL override"
  );
  // The specific pins that have already bitten this project.
  assert.doesNotMatch(src, /gemini-2\.0-flash/, "gemini-2.0-flash is a pin that will rot");
  assert.doesNotMatch(src, /gemini-2\.5-flash/, "gemini-2.5-flash is the pin that already rotted");
});

test("the generation alias matches the main app, which learned this the hard way", () => {
  // Two apps, one lesson. They are separate files because this app must build
  // standalone, so a drift check is the only thing keeping them honest.
  const mainApp = stripComments(read(MAIN_APP_MODEL));
  const alias = mainApp.match(/"([a-z0-9.-]*latest)"/);
  assert.ok(alias, "the main app still uses a -latest alias");
  assert.ok(
    stripComments(read(BRAIN)).includes(`"${alias[1]}"`),
    `Mission Control must use the same alias as the main app (${alias?.[1]})`
  );
});

test("the embedding model is pinned, and says why", () => {
  const src = read(BRAIN);
  const code = stripComments(src);
  assert.match(
    code,
    /EMBED_MODEL = `models\/\$\{process\.env\.GEMINI_EMBED_MODEL \|\| "gemini-embedding-001"\}`/,
    "embedding model must stay pinned with an explicit override for a planned migration"
  );
  // A pin without a recorded reason is indistinguishable from the bug above,
  // and the next reader would 'fix' it into a -latest alias.
  assert.match(src, /re-embedding/i, "the pin must record that changing it re-embeds the corpus");
  assert.doesNotMatch(code, /EMBED_MODEL = .*latest/, "the embedding model must not float");
  // Corrected 2026-09-10, before the first ingestion: the previous pin,
  // text-embedding-004, returns 404 for this project's key. Named here so the
  // rotted pin cannot come back, and so the width is REQUESTED from the model
  // rather than trimmed after the fact.
  assert.doesNotMatch(code, /text-embedding-004/, 'the retired embedding pin must not return');
  assert.match(code, /outputDimensionality: EMBED_DIMENSIONS/, 'width must be requested, not trimmed');
});

test("embed() refuses a vector the column cannot hold", () => {
  const code = stripComments(read(BRAIN));
  assert.match(code, /export const EMBED_DIMENSIONS = 768/, "the width contract is declared");
  assert.match(
    code,
    /values\.length !== EMBED_DIMENSIONS/,
    "embed() must reject a mismatched width rather than let Postgres fail on insert"
  );
  // It must refuse, not truncate or pad — either would silently corrupt recall.
  assert.doesNotMatch(code, /values\.slice\(0, EMBED_DIMENSIONS\)/, "must not truncate to fit");
});
