import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPPORTED_CONNECT_ROLES,
  SPENDABLE_CONNECT_COSTS,
  CONNECT_COSTS,
  normalizeConnectRole,
  getBalance,
} from "@/lib/connectsWallet";
import { CONNECTS_ALLOWANCE, monthlyAllowance } from "@/lib/entitlements";

// Comments quoting a defect must not satisfy the guard that forbids it — the
// A-080 trap, which caught three assertions in this session alone. Strip them.
const readCode = (file) =>
  readFileSync(resolve(process.cwd(), file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

// ── A-114 — every shipped profession resolves, and no price is a fiction ────
//
// `designer` ships a HUD and `event-planner` ships a public directory, but
// neither was in SUPPORTED_CONNECT_ROLES. `normalizeConnectRole` fails closed to
// null, so both got `{ error: "invalid_role" }` and a balance of 0 — and because
// CONNECTS_ALLOWANCE had no row either, adding them naively would have handed
// both the SEEKER ladder by silent fallback.
const SHIPPED_PROFESSIONS = ["photographer", "researcher", "designer", "event-planner"];

describe("A-114 Connects role contract", () => {
  it("every shipped profession resolves to a non-null role", () => {
    for (const role of SHIPPED_PROFESSIONS) {
      expect(normalizeConnectRole(role), `${role} resolves`).toBe(role);
    }
    expect(normalizeConnectRole("buyer")).toBe("seeker");
    // Fail-closed semantics must survive the widening.
    expect(normalizeConnectRole("astronaut")).toBeNull();
    expect(normalizeConnectRole("")).toBeNull();
  });

  it("every shipped profession has an explicit allowance row, not a fallback", () => {
    for (const role of SHIPPED_PROFESSIONS) {
      expect(
        Object.prototype.hasOwnProperty.call(CONNECTS_ALLOWANCE, role),
        `${role} has its own ladder rather than inheriting seeker's`
      ).toBe(true);
    }
  });

  it("no profession silently draws the seeker ladder", () => {
    // The specific defect: an omitted row resolves to CONNECTS_ALLOWANCE.seeker,
    // so a provider would quietly receive a seeker's larger allowance.
    for (const role of SHIPPED_PROFESSIONS) {
      for (const tier of ["starry", "solar", "cluster", "universe"]) {
        expect(
          monthlyAllowance(role, tier),
          `${role}/${tier} must not equal the seeker allowance by accident`
        ).toBe(CONNECTS_ALLOWANCE[role][tier]);
      }
    }
    expect(monthlyAllowance("designer", "cluster")).not.toBe(CONNECTS_ALLOWANCE.seeker.cluster);
  });

  it("the two role lists cannot drift apart again", () => {
    // connectsWallet.SUPPORTED_CONNECT_ROLES and entitlements.normalizeRole each
    // carry their own list. They disagreed, and the disagreement was invisible.
    const entitlements = readCode("src/lib/entitlements.js");
    const listed = entitlements.match(/\[([^\]]*?"researcher"[^\]]*?)\]/);
    expect(listed, "entitlements still carries a role allowlist").not.toBeNull();
    for (const role of SUPPORTED_CONNECT_ROLES) {
      expect(listed[1], `entitlements.normalizeRole accepts ${role}`).toContain(`"${role}"`);
    }
  });

  it("a shipped profession can actually hold a wallet", () => {
    // The user-visible consequence of the old omission.
    expect(getBalance("designer", "solar")).toBeGreaterThan(0);
    expect(getBalance("event-planner", "solar")).toBeGreaterThan(0);
  });

  it("every priced cost key is either spendable or declared unreachable", () => {
    const unreachable = Object.keys(CONNECT_COSTS).filter(
      (key) => !SPENDABLE_CONNECT_COSTS.includes(key)
    );
    // These are real prices with no purchase behind them. They stay, and stay
    // labelled, until O-022 decides whether providers are commissioned at all.
    expect(unreachable.sort()).toEqual([
      "commissionEventPlanner",
      "commissionPhotographer",
      "commissionResearcher",
    ]);
    for (const key of SPENDABLE_CONNECT_COSTS) {
      expect(CONNECT_COSTS[key], `${key} is priced`).toBeGreaterThan(0);
    }
  });
});

// ── A-110 — the refund receipt reads a key the route returns ────────────────
describe("A-110 refund receipt", () => {
  const panel = readCode("src/components/admin/ConnectsRefundPanel.js");
  const route = readCode("src/app/api/admin/connects-refund/route.js");

  it("does not read the key the route has never returned", () => {
    expect(panel).not.toContain("newBalance");
    expect(route).not.toContain("newBalance");
  });

  it("reads whichever balance key the route actually returned", () => {
    for (const key of ["balanceAuthority", "accountPermanentBalance", "legacySpendableBalance"]) {
      expect(route, `route returns ${key}`).toContain(key);
      expect(panel, `panel reads ${key}`).toContain(key);
    }
  });

  it("distinguishes the two balances instead of printing one label", () => {
    // They answer different questions; collapsing them would manufacture a
    // claim about which wallet moved.
    expect(panel).toContain("canonical_account_permanent");
    expect(panel).toContain("Account permanent balance");
    expect(panel).toContain("Legacy spendable balance");
  });

  it("never renders a non-number as the balance", () => {
    expect(panel).toContain('typeof balance === "number"');
    expect(panel).toContain("Balance could not be read back");
  });
});
