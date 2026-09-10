import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const OWNER_MODE = "src/components/dashboard/OwnerMode.js";
// Comments are stripped before asserting, so prose describing a rule can never
// satisfy a check that the CODE is supposed to satisfy (the A-080 trap).
const code = () =>
  readFileSync(resolve(process.cwd(), OWNER_MODE), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

// A-131. The owner has NO veto over how a broker runs a delegated listing —
// that boundary is deliberate ("we don't transact") and it holds ONLY because
// leaving is a real, findable action. A route with no button is not an exit.
describe("A-131 — an owner can actually find and use the exit", () => {
  it("renders a control that calls the revoke route", () => {
    const src = code();
    expect(src).toContain("/api/dashboard/representation/revoke");
    expect(src).toContain("handleRemoveBroker");
  });

  it("uses the owner's own words, not the internal jargon", () => {
    // The owner did not know what "end this representation" meant, which is
    // proof no property owner would. They chose "Remove this broker".
    const src = code();
    expect(src).toContain("Remove this broker");
    expect(src).not.toMatch(/End this representation/i);
  });

  it("sends only a dealId, never a counterparty's user id", () => {
    // OwnerMode renders deals, not identities. Passing a broker UUID from the
    // client would widen what /api/deals must disclose, for a button.
    const src = code();
    const call = src.slice(src.indexOf("representation/revoke"));
    expect(call).toContain("dealId: pitch.id");
    expect(call.slice(0, 600)).not.toMatch(/brokerId:/);
  });

  it("warns about all three consequences BEFORE acting", () => {
    // Buyer threads closing and the non-refund are the parts an owner would
    // not expect. Discovering them afterwards is how a support ticket and a
    // dispute get created at the same time.
    const src = code();
    const at = src.indexOf("window.confirm");
    expect(at, "removal must be confirmed").toBeGreaterThan(-1);
    const confirmText = src.slice(at, at + 700);
    expect(confirmText).toMatch(/enquir/i);
    expect(confirmText).toMatch(/buyer/i);
    expect(confirmText).toMatch(/not refunded/i);
  });

  it("does not offer the control on a buyer inquiry", () => {
    // A buyer thread has no representation to end. Offering it would present
    // an action the route correctly refuses.
    const src = code();
    // Anchored by walking BACK from the button to its nearest enclosing
    // condition, rather than guessing a character window — the JSX between
    // them is long enough that any fixed window is either too tight to pass or
    // too loose to mean anything.
    const btn = src.indexOf("Remove this broker");
    expect(btn, "the control must exist").toBeGreaterThan(-1);
    const guard = src.lastIndexOf("pitch.status === 'accepted'", btn);
    expect(guard, "the control must sit behind a status guard").toBeGreaterThan(-1);
    const condition = src.slice(guard, src.indexOf("&& (", guard) + 4);
    expect(condition).toContain("pitch.otherPartyRole === 'Broker'");
  });

  it("surfaces the server's own error rather than a generic failure", () => {
    // The partial-write case ("the broker was removed, but…") is the one an
    // owner most needs to see and retry. A blanket message would bury it.
    const src = code();
    expect(src).toMatch(/data\?\.error \|\|/);
  });
});
