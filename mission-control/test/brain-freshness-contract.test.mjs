import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  VAULT_SOURCE_PREFIX,
  STALE_AFTER_DAYS,
  formatVaultSource,
  parseVaultSource,
  describeAge,
  buildCitation,
  citationLine,
} from "../src/lib/brainCitation.js";
import { chunkText } from "../src/lib/brain.js";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
// A comment quoting a defect satisfies the guard that forbids it (the A-080
// trap). Every source assertion below runs on comment-stripped text.
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const ACTIONS = "src/app/dashboard/brain/actions.js";
const SEARCH_UI = "src/app/dashboard/brain/BrainSearch.js";
const BRAIN = "src/lib/brain.js";

// A fixed instant, so nothing here drifts with the calendar (Rule 11).
const NOW = new Date("2026-09-10T12:00:00Z");

// ── A-124 — the freshness contract ─────────────────────────────────────────
//
// A stale Brain is worse than no Brain. Embedded as it stood, the vault would
// have answered that owner titles are sanitized before storage, because a
// document said so and it was false until 2026-09-10. Before embedding, a
// wrong claim costs someone opening a file. After, it is served as an answer.
//
// The citation is the whole mitigation: an answer whose source is three months
// old must LOOK three months old.

test("a vault source round-trips path and date through the one free-text column", () => {
  const source = formatVaultSource("_SCOUTIT_BRAIN/09_SECURITY/X.md", "2026-06-24");
  assert.equal(source, `${VAULT_SOURCE_PREFIX}_SCOUTIT_BRAIN/09_SECURITY/X.md@2026-06-24`);
  assert.deepEqual(parseVaultSource(source), {
    path: "_SCOUTIT_BRAIN/09_SECURITY/X.md",
    updated: "2026-06-24",
  });
});

test("an undated document is recorded as undated, never given a substitute date", () => {
  const source = formatVaultSource("_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PLAN.md", null);
  assert.equal(source, `${VAULT_SOURCE_PREFIX}_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PLAN.md`);
  assert.deepEqual(parseVaultSource(source), {
    path: "_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/PLAN.md",
    updated: null,
  });
});

test("a manually typed document is never given a vault path it does not have", () => {
  assert.deepEqual(parseVaultSource("manual"), { path: null, updated: null });
  assert.deepEqual(parseVaultSource(undefined), { path: null, updated: null });
});

test("THE TRAP: the row's own timestamp is never presented as the document's date", () => {
  // The vault file says June. The row was written today. Citing the row would
  // stamp "updated today" on a two-and-a-half-month-old claim.
  const cite = buildCitation(
    {
      title: "Security features",
      source: formatVaultSource("_SCOUTIT_BRAIN/09_SECURITY/S.md", "2026-06-24"),
      rowUpdatedAt: "2026-09-10T09:00:00Z",
    },
    NOW
  );
  assert.equal(cite.date, "2026-06-24");
  assert.equal(cite.dateKind, "vault");
  assert.equal(cite.ageDays, 78);
  assert.equal(cite.isStale, false);
  assert.match(citationLine(cite), /updated 2026-06-24/);
  assert.doesNotMatch(citationLine(cite), /2026-09-10/);
});

test("a document older than the staleness window is marked, not just dated", () => {
  const cite = buildCitation(
    { title: "Old plan", source: formatVaultSource("a/b.md", "2026-05-01") },
    NOW
  );
  assert.ok(cite.ageDays > STALE_AFTER_DAYS);
  assert.equal(cite.isStale, true);
  assert.equal(cite.ageLabel, "4 months ago");
});

test("no date at all counts as stale, because unknown freshness is not freshness", () => {
  const cite = buildCitation({ title: "Untitled note" }, NOW);
  assert.equal(cite.dateKind, "unknown");
  assert.equal(cite.date, null);
  assert.equal(cite.isStale, true);
  assert.match(citationLine(cite), /date unknown/);
});

test("a row with no vault date says recorded, not updated - different fact, different word", () => {
  const cite = buildCitation(
    { title: "Staff note", source: "manual", rowUpdatedAt: "2026-09-09T10:00:00Z" },
    NOW
  );
  assert.equal(cite.dateKind, "recorded");
  assert.equal(cite.date, "2026-09-09");
  assert.match(citationLine(cite), /recorded 2026-09-09/);
  assert.doesNotMatch(citationLine(cite), /updated/);
});

test("age reads in plain language at every scale", () => {
  assert.equal(describeAge(0), "today");
  assert.equal(describeAge(1), "yesterday");
  assert.equal(describeAge(12), "12 days ago");
  assert.equal(describeAge(31), "1 month ago");
  assert.equal(describeAge(120), "4 months ago");
  assert.equal(describeAge(400), "1 year ago");
  assert.equal(describeAge(null), null);
});

test("the answer path reads provenance from the database, not just titles", () => {
  const src = stripComments(read(ACTIONS));
  assert.match(src, /select\("id, title, category, source, updated_at"\)/);
  assert.match(src, /buildCitation\(/);
});

test("every returned source carries a citation, unconditionally", () => {
  const src = stripComments(read(ACTIONS));
  // Not `citation: something && ...` and not inside a branch: a source without
  // provenance is the failure this item exists to prevent.
  assert.match(src, /\n\s*citation,\n/);
  assert.match(src, /citation: citationLine\(citation\)/);
});

test("the model is told the dates and told to say when it leans on an old one", () => {
  const src = stripComments(read(BRAIN));
  assert.match(src, /c\.citation \|\| c\.title/);
  assert.match(src, /Each source header carries the date/);
  assert.match(src, /never state a date that does not appear in a source header/);
});

test("the console shows the date beside every source, and flags a stale one", () => {
  const src = stripComments(read(SEARCH_UI));
  assert.match(src, /citation=\{s\.citation\}/);
  assert.match(src, /date unknown/);
  assert.match(src, /citation\.isStale/);
  assert.match(src, /citation\.date/);
});

test("the ingester excludes the corpora that must never enter the Brain", () => {
  const src = stripComments(read("scripts/ingest-vault.mjs"));
  for (const excluded of [
    "_ARCHIVE",
    "INBOX",
    "12_EXTERNAL_TOOLS",
    "13_EXTERNAL_INPUTS",
    "15_IMPLEMENTATION_RECORDS",
  ]) {
    assert.match(src, new RegExp(`"${excluded}"`), `${excluded} must be excluded`);
  }
});

test("the ingester refuses a vector the embedding column cannot compare", () => {
  const src = stripComments(read("scripts/ingest-vault.mjs"));
  assert.match(src, /values\.length !== EMBED_DIMENSIONS/);
  assert.match(src, /const EMBED_DIMENSIONS = 768/);
});

test("the ingester and the console embed with the SAME model and width", () => {
  // They are separate files by necessity -- the ingester is an operator script
  // run from the repository root, the console is deployed standalone. Vectors
  // written by one are compared against query vectors built by the other. Two
  // models, or two widths, produce an index whose similarity scores are
  // meaningless, and nothing errors.
  const ingester = stripComments(read("scripts/ingest-vault.mjs"));
  const brain = stripComments(read(BRAIN));
  const modelOf = (src) => src.match(/GEMINI_EMBED_MODEL \|\| "([a-z0-9.-]+)"/)?.[1];
  assert.ok(modelOf(brain), "the console declares an embedding model");
  assert.equal(modelOf(ingester), modelOf(brain), "the two embedders must agree");
  for (const src of [ingester, brain]) {
    assert.match(src, /outputDimensionality: EMBED_DIMENSIONS/);
    assert.doesNotMatch(src, /text-embedding-004/);
  }
});

test("the chunker never cuts an astral character in half", () => {
  // Real failure, found by bisecting 00_START_HERE.md: the vault is full of
  // emoji, the hard split counted UTF-16 code units, and a pair severed at the
  // boundary produced a lone surrogate. That is not valid UTF-8, so PostgREST
  // rejected the whole insert batch as "Empty or invalid json" -- a mojibake
  // failure wearing a parse error's message, 500 documents into a run.
  const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

  // One unbroken paragraph of emoji, so the hard-split branch is the one under
  // test rather than the paragraph splitter.
  const emoji = "\u{1F6F8}\u{1F4C4}\u{1F195}";
  const text = emoji.repeat(600);
  const pieces = chunkText(text, 80);

  assert.ok(pieces.length > 1, "the input must actually be hard-split");
  for (const piece of pieces) {
    assert.doesNotMatch(piece, lone, "a chunk contains half of a surrogate pair");
    assert.doesNotThrow(() => JSON.parse(JSON.stringify({ content: piece })));
  }
  assert.equal(pieces.join(""), text, "splitting must lose nothing");
});

test("both chunkers carry the unicode flag, not just one", () => {
  // A whitespace-normalised includes(), not a regex: a pattern that matches a
  // pattern is two escaping layers deep, and the first version of this guard
  // lost one and asserted against a string that never appears (Rule 27).
  const unicodeFlag = ', "gu")';
  const unitFlag = ', "g")';
  for (const path of [BRAIN, "scripts/ingest-vault.mjs"]) {
    const src = stripComments(read(path));
    assert.ok(src.includes(unicodeFlag), path + " must split on code points, not UTF-16 units");
    assert.ok(!src.includes(unitFlag), path + " still has a unit-counting split");
  }
});
