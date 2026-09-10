import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTE = "src/app/api/dashboard/representation/revoke/route.js";
const path = () => resolve(process.cwd(), ROUTE);
// Comments are stripped before asserting, so a rule described in prose can
// never satisfy a check the CODE is supposed to satisfy (the A-080 trap).
const readCode = () =>
  readFileSync(path(), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("A-131 — the owner's exit route exists and is owner-only", () => {
  it("the route file exists at the path the dashboard will call", () => {
    expect(existsSync(path()), `${ROUTE} must exist`).toBe(true);
  });

  it("refuses anyone who is not the property owner", () => {
    const code = readCode();
    // Deliberately NOT "any party". A broker ending their own representation
    // through this route would record the owner as having done it — the same
    // defect the `withdrawn` sender-check in /api/deals/[id] exists to prevent.
    expect(code).toContain("property.owner_id !== userId");
    expect(code).toMatch(/status:\s*403/);
    // and it authenticates at all
    expect(code).toContain("auth.getUser(token)");
    expect(code).toMatch(/status:\s*401/);
  });

  it("decides through the shared rule instead of re-deriving it", () => {
    const code = readCode();
    expect(code).toContain("revokePlanFor(");
    expect(code).toContain("REVOKED_STATUS");
    // A literal "closed" would drift the day the constant changes.
    expect(code).not.toMatch(/status:\s*"closed"/);
  });

  it("ends the representation, not just the conversations", () => {
    const code = readCode();
    expect(code).toContain("REPRESENTATION_STATES.ENDED");
    expect(code).toContain("representationStatusUpdate(");
    expect(code).toContain("property_broker_representations");
  });

  it("ends the representation BEFORE closing deals, so a partial failure fails closed", () => {
    // If the deal close fails after the roster removal, the broker is already
    // off the roster and stops receiving routed leads. The reverse order would
    // leave a broker collecting new enquiries into closed threads.
    //
    // Imports are stripped first: both names appear in the import block at the
    // top, in whatever order the import happens to list them, which satisfied
    // this assertion without saying anything about execution order. Same class
    // of trap as a comment satisfying a check about code.
    const body = readCode().replace(/^import[\s\S]*?from\s+"[^"]+";\s*$/gm, "");
    const repUpdate = body.indexOf("representationStatusUpdate(");
    const dealClose = body.indexOf("REVOKED_STATUS");
    expect(repUpdate, "representationStatusUpdate must be called in the body").toBeGreaterThan(-1);
    expect(dealClose, "REVOKED_STATUS must be used in the body").toBeGreaterThan(-1);
    expect(repUpdate, "representation must be ended first").toBeLessThan(dealClose);
  });

  it("never reports plain success when only half the write landed", () => {
    const code = readCode();
    // The partial-failure branch must say so and stay retryable.
    expect(code).toContain("representationEnded: true");
    expect(code).toContain("retryable: true");
  });

  it("records WHY those conversations closed", () => {
    // `deals` has no close-reason column (O-004 gates adding one), so the
    // activity row is the only record. Without it a revoke is
    // indistinguishable from everyone closing their chats the same afternoon.
    //
    // Found vacuous by mutation on 2026-09-10: a bare
    // `expect(code).toContain("REVOKE_ACTIVITY")` passed even after the
    // logActivity call was switched to "status_change", because the constant
    // still appeared in the import line and in the notification below. The
    // assertion has to look inside the logActivity call itself.
    const code = readCode();
    const at = code.indexOf("logActivity(");
    expect(at, "the route must log the revoke").toBeGreaterThan(-1);
    const open = code.indexOf("{", code.indexOf("supabaseAdmin,", at));
    let depth = 0;
    let call = "";
    for (let i = open; i < code.length; i += 1) {
      if (code[i] === "{") depth += 1;
      if (code[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          call = code.slice(open, i + 1);
          break;
        }
      }
    }
    expect(call, "could not isolate the logActivity payload").not.toBe("");
    expect(call).toMatch(/activityType:\s*REVOKE_ACTIVITY/);
    expect(call).not.toMatch(/activityType:\s*"/);
    expect(call).toContain("buyerThreadsClosed");
  });

  it("warns the broker, and a failed warning does not fail the revoke", () => {
    const code = readCode();
    // Owner decision: "instantly, but they still get warned."
    expect(code).toContain("notifyUser(");
    // The notify call is wrapped, so a mail failure cannot block an owner from
    // leaving. An owner's exit must not depend on a notification row.
    const notifyAt = code.indexOf("notifyUser(");
    const before = code.slice(0, notifyAt);
    expect(before.lastIndexOf("try {")).toBeGreaterThan(before.lastIndexOf("return NextResponse"));
  });

  it("hands back the buyer-facing sentence rather than letting callers invent one", () => {
    expect(readCode()).toContain("revokedThreadNotice()");
  });

  it("posts the reason INTO the buyer threads, so a close is never an unexplained gap", () => {
    const code = readCode();
    // The buyer did nothing wrong and gets no refund. Closing was authorised;
    // closing silently was not. A system message is used rather than a new
    // column because `deals` has no close-reason field and adding one is
    // owner-gated (O-004).
    expect(code).toContain("deal_messages");
    expect(code).toMatch(/\[SYSTEM\]/);
    // Buyer threads ONLY — posting into the broker's own delegation row would
    // narrate the broker to themselves in the third person.
    expect(code).toContain("plan.buyerDealIds.map(");
    expect(code).not.toContain("plan.allDealIds.map(");
  });

  it("a failed buyer notice does not undo or block the revoke", () => {
    const code = readCode();
    // The revoke has already happened by then. An owner must not be trapped in
    // an arrangement because a message row would not insert.
    const at = code.indexOf("Buyer notice insert failed");
    expect(at, "the failure must be handled explicitly").toBeGreaterThan(-1);
    const after = code.slice(at, at + 400);
    expect(after).not.toMatch(/return NextResponse\.json\(\s*\{\s*error/);
  });

  it("treats an already-ended representation as done, not as an error", () => {
    const code = readCode();
    expect(code).toContain("alreadyEnded: true");
  });

  it("accepts a dealId so the UI never needs a counterparty's user id", () => {
    const code = readCode();
    // OwnerMode renders deals, not identities. Handing the client a broker
    // UUID purely to enable a button would widen what the API discloses for
    // no reason.
    expect(code).toContain("parsed.data.dealId");
    expect(code).toContain("sourceDeal.broker_id");
  });

  it("resolves dealId BEFORE the ownership check, never after", () => {
    // Resolving after would authorise one property and then act on another —
    // a confused-deputy bug that reads as correct in a diff.
    const body = readCode().replace(/^import[\s\S]*?from\s+"[^"]+";\s*$/gm, "");
    const resolve = body.indexOf("parsed.data.dealId");
    const ownerCheck = body.indexOf("property.owner_id !== userId");
    expect(resolve).toBeGreaterThan(-1);
    expect(ownerCheck).toBeGreaterThan(-1);
    expect(resolve, "dealId must resolve first").toBeLessThan(ownerCheck);
  });

  it("refuses a buyer inquiry rather than pretending to end a representation", () => {
    const code = readCode();
    // A deal with no broker_id is a buyer thread. Running a revoke on one
    // would be a no-op dressed as an action.
    expect(code).toContain("sourceDeal?.broker_id");
    expect(code).toMatch(/not a broker representation/i);
  });
});
