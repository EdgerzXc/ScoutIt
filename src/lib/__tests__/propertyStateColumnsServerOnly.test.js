import fs from "node:fs";
import { describe, expect, it } from "vitest";

// U-015 — the browser cannot name a property's trust-state columns.
//
// ── WHY THE CODE CHANGE COMES FIRST ──────────────────────────────────
// U-015's real fix is a database grant: `properties` INSERT/UPDATE scoped to
// the columns a client may legitimately write, excluding `lifecycle_state`,
// `verified`, `moderation_status` and `pdf_verified`. But a column-level grant
// rejects an INSERT that *names* a forbidden column, even when the value is
// harmless — and `DashboardContext.js` named `verified` on every listing
// creation. Granting first would have broken listing creation for everyone.
//
// So the client stopped sending it, and only then was the grant applied.
// Removing it changed no behaviour: the column defaults to `false` and the
// wizard only ever sent `false` (`DeepIntelligenceStudio.js:26`,
// `LiveEditorWorkspace.js:28` both initialise it that way, and no control sets
// it true). The value is now the default rather than a client assertion —
// which is Standing Rule 7's shape: a schema default must not manufacture a
// claim, and neither should a browser.
//
// ── WHAT THIS ASSERTS ────────────────────────────────────────────────
// Behaviour cannot be exercised here — this is a client component the test
// runner cannot render, and the real enforcement lives in the database. So the
// assertion is that no browser-side Supabase write NAMES one of the four
// columns. That is exactly the condition the grant enforces, checked at the
// only layer a unit test can see it.

const CONTEXT = "src/context/DashboardContext.js";
const source = fs.readFileSync(CONTEXT, "utf8");

/** Source with comments removed. See proxyBanGuardRetired for why `$` is absent. */
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split(/\r?\n/)
  .map((line) => line.replace(/(^|\s)\/\/.*/, "$1"))
  .join("\n");

/** Every `supabase.from('properties').insert([{ … }])` payload in the file. */
function propertyInsertPayloads(src) {
  const payloads = [];
  const marker = "from('properties').insert([{";
  let at = src.indexOf(marker);
  while (at !== -1) {
    const start = at + marker.length;
    const end = src.indexOf("}])", start);
    expect(end).toBeGreaterThan(start);
    payloads.push(src.slice(start, end));
    at = src.indexOf(marker, end);
  }
  return payloads;
}

describe("U-015 · the browser never names a property trust-state column", () => {
  it("finds the listing-creation inserts it is meant to be checking", () => {
    // Guards the guard: if the marker stops matching, every assertion below
    // would pass over an empty list.
    expect(propertyInsertPayloads(code).length).toBe(2);
  });

  it("sends none of the four state columns on any insert", () => {
    for (const payload of propertyInsertPayloads(code)) {
      for (const column of ["verified", "lifecycle_state", "moderation_status", "pdf_verified"]) {
        expect(payload).not.toMatch(new RegExp(`(^|[\\s,{])${column}\\s*:`));
      }
    }
  });

  it("still sends the fields a draft legitimately carries", () => {
    // The fix must not have removed more than the one field. `pipeline_status`
    // is deliberately still client-set: it is not one of the four, and the
    // wizard writes 'pending' / 'ai_drafting' as a workflow marker.
    const [wizard] = propertyInsertPayloads(code);
    for (const kept of ["owner_id", "title", "slug", "location", "details", "pipeline_status"]) {
      // `slug` and `coordinates` are written as ES shorthand (`slug,`), so a
      // colon-only match reports them missing. Accept either form.
      expect(wizard).toMatch(new RegExp(`(^|[\\s,{])${kept}\\s*[:,]`));
    }
  });

  it("does not update or delete properties from the browser at all", () => {
    // If either ever appears, the grant list has to be revisited before it
    // ships — a client UPDATE naming a state column would be refused at the
    // database and fail silently in the UI.
    expect(code).not.toContain("from('properties').update(");
    expect(code).not.toContain("from('properties').delete(");
  });
});
