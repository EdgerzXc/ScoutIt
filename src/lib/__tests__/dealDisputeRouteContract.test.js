import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTE = "src/app/api/deals/[id]/dispute/route.js";
const path = () => resolve(process.cwd(), ROUTE);
const read = () => readFileSync(path(), "utf8");
// Comments are stripped before asserting, so a rule described in prose can
// never satisfy a check that the code is supposed to satisfy.
const readCode = () =>
  read()
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");


// Extract just the object literal passed to .insert({ ... }) by matching
// braces. Slicing to end-of-file instead lets text that appears LATER in the
// file satisfy an assertion about the insert — which is how the missing
// hold_placed_at mutation survived the first time.
function insertObject() {
  const code = readCode();
  const start = code.indexOf(".insert({");
  if (start === -1) return null;
  const open = code.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < code.length; i += 1) {
    if (code[i] === "{") depth += 1;
    if (code[i] === "}") {
      depth -= 1;
      if (depth === 0) return code.slice(open, i + 1);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// A-041. `deal_disputes` and the purge exemption both existed, correctly, and
// nothing in the application could write a dispute row — so no hold was ever
// placed and every closed thread's message bodies were replaced seven days
// after close, unconditionally. A party with evidence of fraud or harassment
// had no way to stop the only record of it being overwritten.
//
// The load-bearing property is not "a dispute can be filed". It is that
// FILING PLACES THE HOLD, in the same write. A hold applied afterwards, by a
// separate call or a later staff action, can lose a race with the nightly
// purge — and the thing it was protecting is exactly what it loses.
// ─────────────────────────────────────────────────────────────────────────

describe("A-041 dispute filing route", () => {
  it("exists at all", () => {
    // Guards every assertion below: each reads the file, and a missing route
    // must fail loudly here rather than making the rest throw obscurely.
    expect(existsSync(path())).toBe(true);
  });

  it("takes the reporter from the session, never from the body", () => {
    const code = readCode();
    expect(code).toContain("resolveUserId(request)");
    expect(code).toContain("reporter_id: userId");
    expect(code).not.toMatch(/reporter_id:\s*(?:body|validated|payload)\./);
  });

  it("refuses an unauthenticated caller before touching the database", () => {
    const code = readCode();
    expect(code).toMatch(/if \(!userId\)[\s\S]{0,120}401/);
  });

  it("admits only a party to the deal", () => {
    const code = readCode();
    // Same party test the close route uses, including the routed recipient —
    // a second definition of "party" is a second thing that can drift.
    expect(code).toContain("isRoutedDealRecipient");
    expect(code).toContain("buyer_id");
    expect(code).toContain("broker_id");
    expect(code).toContain("owner_id");
    expect(code).toMatch(/if \(!isParty\)[\s\S]{0,120}403/);
  });

  it("places the hold in the same insert that files the dispute", () => {
    // The insert object is extracted by brace-matching rather than sliced to
    // end-of-file. A slice to EOF also contains the audit metadata, which
    // mentions hold_placed_at too — so deleting it from the insert still
    // "passed". That mutation was watched surviving before this was fixed.
    const insert = insertObject();
    expect(insert).not.toBeNull();
    expect(insert).toContain("hold_placed_at");
    // The status is the shared constant, deliberately not a literal: a second
    // literal here is free to drift away from the purge job's exemption list.
    expect(insert).toContain("status: INITIAL_DISPUTE_STATUS");
    expect(insert).not.toMatch(/status:\s*["']/);
  });

  it("never accepts the status or the hold timestamp from the caller", () => {
    const code = readCode();
    // A caller who can set status could file a dispute that is already
    // resolved, placing no hold while appearing to have filed one.
    expect(code).not.toMatch(/status:\s*(?:body|validated|payload)\./);
    expect(code).not.toMatch(/hold_placed_at:\s*(?:body|validated|payload)\./);
  });

  it("requires a reason and bounds the free text", () => {
    const code = readCode();
    // Assert the guard itself, not merely that the constants are imported.
    // Replacing the condition with `if (false)` left both names present and
    // the earlier version of this test passed — watched surviving before fix.
    expect(code).toMatch(
      /if \(!DISPUTE_REASONS\.includes\(reason\)\)[\s\S]{0,200}status:\s*400/,
    );
    expect(code).toMatch(
      /if \(details\.length > MAX_DISPUTE_DETAILS\)[\s\S]{0,200}status:\s*400/,
    );
  });

  it("audits the filing", () => {
    const code = readCode();
    expect(code).toContain("writeAuditLog");
    expect(code).toContain("deal_dispute_filed");
  });

  it("does not leak internal error detail", () => {
    expect(readCode()).toContain("sanitizeError");
  });
});

describe("A-041 hold semantics are shared, not restated", () => {
  it("the purge job and the filing route agree on what a hold is", () => {
    // Both import the same frozen list. If someone adds a status to one side
    // only, a dispute could sit in a state the purge job does not honour and
    // the evidence would be destroyed mid-review.
    const purge = readFileSync(
      resolve(process.cwd(), "src/app/api/cron/purge-chat-messages/route.js"),
      "utf8",
    );
    expect(purge).toContain("DISPUTE_HOLD_STATUSES");
    expect(readCode()).toContain("DISPUTE_HOLD_STATUSES");
  });

  it("the status a dispute is filed with is one the purge job exempts", async () => {
    // Asserted against the real values, not against the source text. This is
    // the regression that actually destroys evidence: a dispute filed as
    // "open" while the purge exempts only "open_hold" reads correctly in both
    // files, places a hold that protects nothing, and the thread purges on
    // schedule mid-review.
    const { INITIAL_DISPUTE_STATUS, DISPUTE_HOLD_STATUSES } = await import(
      "@/lib/chatRetention"
    );
    expect(DISPUTE_HOLD_STATUSES).toContain(INITIAL_DISPUTE_STATUS);
  });
});
