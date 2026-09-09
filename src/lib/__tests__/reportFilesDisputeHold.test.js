import fs from "node:fs";
import { describe, expect, it } from "vitest";

// A-103 — Report & Unmatch must file a dispute hold at report time, never
// just stamp `reported`. The old path wrote only the status: no
// `deal_disputes` row, so the thread was invisible to the staff queue the
// dispute-modal path feeds — retained + invisible. The fix wires Report to
// the A-041 producer first (hold placed immediately, fail-closed), then
// marks the thread.
//
// Source assertion: the property is call order inside one handler — the
// dispute POST precedes the reported PATCH, with the `other` ground stated
// (Report offers no ground picker; inventing a specific ground would be a
// claim nobody made). Comments stripped before matching per precedent.

const source = fs.readFileSync(
  "src/components/dashboard/ChatBox.js",
  "utf8",
);
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split(/\r?\n/)
  .map((line) => line.replace(/(^|\s)\/\/.*/, "$1"))
  .join("\n");

function handlerBody() {
  const start = code.indexOf("const handleReportConversation = async () => {");
  if (start === -1) return "";
  // The handler ends at the first "\n  };" after its start at this indent.
  const end = code.indexOf("\n  };", start);
  return code.slice(start, end);
}

describe("A-103 · Report & Unmatch files the hold, not just the status", () => {
  it("guards the guard — the handler exists and is wired to the control", () => {
    expect(handlerBody().length).toBeGreaterThan(500);
    expect(code).toContain("onClick={handleReportConversation}");
  });

  it("POSTs the A-041 dispute producer with the honest ground", () => {
    const body = handlerBody();
    // Exact route template — a prefix match once let `/dispute-MUTATED`
    // pass, so the guard names the full string including backticks.
    expect(body).toContain("`/api/deals/${deal.id}/dispute`");
    expect(body).toContain('method: "POST"');
    expect(body).toContain('reason: "other"');
  });

  it("files the hold BEFORE marking the thread reported", () => {
    const body = handlerBody();
    const filing = body.indexOf("/dispute");
    const marking = body.indexOf('status: "reported"');
    expect(filing).toBeGreaterThan(-1);
    expect(marking).toBeGreaterThan(-1);
    expect(filing).toBeLessThan(marking);
  });

  it("fails closed — a hold that cannot be placed never becomes a bare reported mark", () => {
    const body = handlerBody();
    // The PATCH lives after the filing's ok-check, and a filing failure
    // throws before it is reached.
    expect(body).toMatch(/if \(!filing\.ok\)[\s\S]{0,200}throw/);
  });
});
