import assert from "node:assert/strict";
import test from "node:test";

import { escapeAirtableFormulaString } from "../src/lib/airtableFormula.mjs";

test("escapes apostrophes inside Airtable formula string literals", () => {
  assert.equal(escapeAirtableFormulaString("owner's-suite"), "owner\\'s-suite");
});

test("escapes backslashes before apostrophes", () => {
  assert.equal(
    escapeAirtableFormulaString("district\\owner's-suite"),
    "district\\\\owner\\'s-suite"
  );
});

test("coerces non-string slug values without changing safe text", () => {
  assert.equal(escapeAirtableFormulaString(2048), "2048");
  assert.equal(escapeAirtableFormulaString("safe-slug"), "safe-slug");
});
