import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  REVOCABLE_STATUSES,
  REVOKED_STATUS,
  REVOKE_ACTIVITY,
  REVOKE_CLOSES_BUYER_THREADS,
  REVOKE_REFUNDS_CONNECTS,
  BROKER_KEEPS_STALE_CARD,
  isDelegationRow,
  revokePlanFor,
  staleCardNotice,
  revokedThreadNotice,
} from "@/lib/deals/delegationRevoke";
import { isKnownActivityType } from "@/lib/crm/activityRegistry";

const read = (p) => readFileSync(p, "utf8");
// A comment quoting a rule satisfies a guard that requires it (the A-080 trap),
// so every source assertion runs on comment-stripped text.
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const B = "broker-1";
const deal = (over) => ({ id: "d", broker_id: B, buyer_id: null, status: "accepted", ...over });

// The owner's four answers, 2026-09-10: conversations close, instantly but the
// broker is warned, no refunds, and the broker keeps a stale card while the
// public listing stops naming them.
describe("delegation revoke — the owner's exit exists and is total", () => {
  it("closes the broker's own delegation rows", () => {
    const plan = revokePlanFor({ deals: [deal({ id: "a" }), deal({ id: "b" })], brokerId: B });
    expect(plan.delegationDealIds).toEqual(["a", "b"]);
    expect(plan.total).toBe(2);
  });

  it("closes the buyer conversations the broker was handling, and keeps them separate", () => {
    // Separate, because they close for the same reason but are TOLD different
    // things. Folding them into one bucket is how a buyer gets a message meant
    // for a broker.
    const plan = revokePlanFor({
      deals: [deal({ id: "own" }), deal({ id: "buy", buyer_id: "buyer-9" })],
      brokerId: B,
    });
    expect(plan.delegationDealIds).toEqual(["own"]);
    expect(plan.buyerDealIds).toEqual(["buy"]);
    expect(plan.allDealIds).toHaveLength(2);
  });

  it("never touches another broker's rows", () => {
    const plan = revokePlanFor({
      deals: [deal({ id: "mine" }), deal({ id: "theirs", broker_id: "broker-2" })],
      brokerId: B,
    });
    expect(plan.allDealIds).toEqual(["mine"]);
  });

  it("revokes a legacy `connected` delegation, not only a modern `accepted` one", () => {
    // `create_routed_buyer_deal` wrote `connected` until 2026-08-05 and rows
    // were never backfilled. Matching only `accepted` would make an older
    // delegation impossible to end, and an empty result set looks exactly like
    // "nothing to revoke".
    expect(REVOCABLE_STATUSES).toContain("connected");
    const plan = revokePlanFor({ deals: [deal({ id: "old", status: "connected" })], brokerId: B });
    expect(plan.allDealIds).toEqual(["old"]);
  });

  it("leaves already-terminal rows alone", () => {
    for (const status of ["closed", "declined", "withdrawn", "reported"]) {
      const plan = revokePlanFor({ deals: [deal({ id: "x", status })], brokerId: B });
      expect(plan.total, `${status} must not be re-closed`).toBe(0);
    }
  });

  it("degrades safely on missing input rather than throwing", () => {
    expect(revokePlanFor().total).toBe(0);
    expect(revokePlanFor({ deals: null, brokerId: B }).total).toBe(0);
    expect(revokePlanFor({ deals: [null, undefined], brokerId: B }).total).toBe(0);
  });
});

describe("delegation revoke — the owner's decisions are encoded, not re-derived", () => {
  it("buyer threads close, and a refund is not automatic", () => {
    expect(REVOKE_CLOSES_BUYER_THREADS).toBe(true);
    expect(REVOKE_REFUNDS_CONNECTS).toBe(false);
  });

  it("closes to a terminal status so `closed_at` is stamped", () => {
    expect(REVOKED_STATUS).toBe("closed");
  });

  it("a delegation row is the broker's own, a buyer row is not", () => {
    expect(isDelegationRow(deal({}), B)).toBe(true);
    expect(isDelegationRow(deal({ buyer_id: "buyer-9" }), B)).toBe(false);
    expect(isDelegationRow(deal({ broker_id: "other" }), B)).toBe(false);
    expect(isDelegationRow(null, B)).toBe(false);
  });
});

describe("delegation revoke — closing is allowed, closing SILENTLY is not", () => {
  it("tells the buyer why their conversation ended", () => {
    // The buyer is the one party who did nothing wrong and gets no refund. A
    // thread that vanishes unexplained reads as a bug or a snub.
    const notice = revokedThreadNotice();
    expect(notice).toMatch(/closed/i);
    expect(notice).toMatch(/owner/i);
    expect(notice).toMatch(/broker/i);
  });

  it("states on the broker's stale card that they are no longer connected", () => {
    expect(BROKER_KEEPS_STALE_CARD).toBe(true);
    expect(staleCardNotice("One Ayala")).toContain("One Ayala");
    expect(staleCardNotice("One Ayala")).toMatch(/no longer connected/i);
    // A missing title must not render a card that says nothing.
    expect(staleCardNotice("")).toMatch(/^This property/);
    expect(staleCardNotice(undefined)).toMatch(/no longer connected/i);
  });

  it("registers the activity type, so the reason is recorded rather than warned about", () => {
    // `logActivity` accepts an unregistered type and only console.warns — the
    // row would still be written but the timeline would render it bare.
    expect(isKnownActivityType(REVOKE_ACTIVITY)).toBe(true);
    expect(REVOKE_ACTIVITY).toBe("delegation_revoked");
  });

  it("the registry sentence names the buyer cost rather than hiding it", () => {
    const registry = stripComments(read("src/lib/crm/activityRegistry.js"));
    expect(registry).toContain("delegation_revoked");
    expect(registry).toMatch(/buyerThreadsClosed/);
  });
});
