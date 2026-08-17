import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  normalizeConnectRole,
  resolveConnectRole,
  getWallet,
  getBalance,
  spendConnects,
  addPurchasedConnects,
  addEarnedConnects,
  initWalletIfEmpty,
  spendConnectsServer,
  SUPPORTED_CONNECT_ROLES,
} from "../connectsWallet.js";
import {
  monthlyAllowance,
  canUseAnonymityShield,
  anonymityShieldDefaultsOn,
} from "../entitlements.js";
import { isCanonicalConnectWalletActive } from "../connectsSchemaGate.js";

describe("Connects Role Scope, Schema Gate & Cutover Safety Contract", () => {
  describe("1. Schema Capability Gate (Default-False Opt-In)", () => {
    const origEnv = process.env.CONNECTS_CANONICAL_ACTIVE;

    afterEach(() => {
      if (origEnv !== undefined) {
        process.env.CONNECTS_CANONICAL_ACTIVE = origEnv;
      } else {
        delete process.env.CONNECTS_CANONICAL_ACTIVE;
      }
    });

    it("defaults to false (legacy mode) when environment variable is unset", () => {
      delete process.env.CONNECTS_CANONICAL_ACTIVE;
      expect(isCanonicalConnectWalletActive()).toBe(false);
    });

    it("returns false for any non-exact value ('false', '0', 'TRUE', '1', 'true-ish')", () => {
      process.env.CONNECTS_CANONICAL_ACTIVE = "false";
      expect(isCanonicalConnectWalletActive()).toBe(false);
      process.env.CONNECTS_CANONICAL_ACTIVE = "0";
      expect(isCanonicalConnectWalletActive()).toBe(false);
      process.env.CONNECTS_CANONICAL_ACTIVE = "TRUE";
      expect(isCanonicalConnectWalletActive()).toBe(false);
      process.env.CONNECTS_CANONICAL_ACTIVE = "1";
      expect(isCanonicalConnectWalletActive()).toBe(false);
      process.env.CONNECTS_CANONICAL_ACTIVE = " true ";
      expect(isCanonicalConnectWalletActive()).toBe(false);
    });

    it("returns true only for exact string 'true'", () => {
      process.env.CONNECTS_CANONICAL_ACTIVE = "true";
      expect(isCanonicalConnectWalletActive()).toBe(true);
    });
  });

  describe("2. Role Normalization Semantics (Fail-Closed)", () => {
    it("normalizes 'buyer' (case-insensitive and trimmed) to 'seeker'", () => {
      expect(normalizeConnectRole("buyer")).toBe("seeker");
      expect(normalizeConnectRole("BUYER")).toBe("seeker");
      expect(normalizeConnectRole("  buyer  ")).toBe("seeker");
      expect(normalizeConnectRole("Buyer")).toBe("seeker");
    });

    it("preserves canonical supported roles exactly", () => {
      for (const role of SUPPORTED_CONNECT_ROLES) {
        expect(normalizeConnectRole(role)).toBe(role);
        expect(normalizeConnectRole(role.toUpperCase())).toBe(role);
      }
    });

    it("fails closed (returns null) on null, undefined, empty, or unknown role strings", () => {
      expect(normalizeConnectRole(null)).toBeNull();
      expect(normalizeConnectRole(undefined)).toBeNull();
      expect(normalizeConnectRole("")).toBeNull();
      expect(normalizeConnectRole("   ")).toBeNull();
      expect(normalizeConnectRole("admin")).toBeNull();
      expect(normalizeConnectRole("superadmin")).toBeNull();
      expect(normalizeConnectRole("unknown_persona")).toBeNull();
      expect(normalizeConnectRole(123)).toBeNull();
    });

    it("resolveConnectRole provides explicit default only when role is omitted", () => {
      expect(resolveConnectRole(null, "seeker")).toBe("seeker");
      expect(resolveConnectRole(undefined, "seeker")).toBe("seeker");
      expect(resolveConnectRole("", "seeker")).toBe("seeker");
      expect(resolveConnectRole("   ", "seeker")).toBe("seeker");

      expect(resolveConnectRole("buyer", "seeker")).toBe("seeker");
      expect(resolveConnectRole("broker", "seeker")).toBe("broker");

      expect(resolveConnectRole("invalid_role", "seeker")).toBeNull();
      expect(resolveConnectRole("admin", "seeker")).toBeNull();
    });
  });

  describe("3. Client Wallet Public Operations Fail-Closed on Invalid Roles", () => {
    let store = {};

    beforeEach(() => {
      store = {};
      global.window = {};
      global.localStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
      };
    });

    afterEach(() => {
      delete global.window;
      delete global.localStorage;
    });

    it("getWallet fails closed on explicit invalid role without creating storage", () => {
      const wallet = getWallet("unsupported_role", "solar");
      expect(wallet.error).toBe("invalid_role");
      expect(wallet.granted).toBe(0);
      expect(wallet.purchased).toBe(0);
      expect(store.scoutit_connects_wallet).toBeUndefined();
    });

    it("getBalance returns 0 on explicit invalid role", () => {
      expect(getBalance("unsupported_role", "solar")).toBe(0);
    });

    it("spendConnects fails closed on explicit invalid role", () => {
      const res = spendConnects("unsupported_role", "solar", 1);
      expect(res.success).toBe(false);
      expect(res.error).toBe("invalid_role");
    });

    it("addPurchasedConnects and addEarnedConnects fail closed on explicit invalid role", () => {
      expect(addPurchasedConnects("unsupported_role", "solar", 10)).toBe(0);
      expect(addEarnedConnects("unsupported_role", "solar", 10)).toBe(0);
      expect(store.scoutit_connects_wallet).toBeUndefined();
    });

    it("initWalletIfEmpty does nothing on explicit invalid role", () => {
      initWalletIfEmpty("unsupported_role", "solar");
      expect(store.scoutit_connects_wallet).toBeUndefined();
    });

    it("omitted role uses documented seeker default", () => {
      const wallet = getWallet(null, "solar");
      expect(wallet.granted).toBe(6);
      expect(wallet.purchased).toBe(0);
      expect(store.scoutit_connects_wallet).toBeDefined();
    });
  });

  describe("4. Hybrid Wallet Engine & Local Storage Conflict Preservation", () => {
    let store = {};

    beforeEach(() => {
      store = {};
      global.window = {};
      global.localStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
      };
    });

    afterEach(() => {
      delete global.window;
      delete global.localStorage;
    });

    it("direct addPurchasedConnects on empty storage initializes role wallet and account pool without erasure", () => {
      const total = addPurchasedConnects("broker", "solar", 10);
      expect(total).toBe(18); // 8 solar broker grant + 10 purchased

      const wallet = getWallet("broker", "solar");
      expect(wallet.granted).toBe(8);
      expect(wallet.purchased).toBe(10);
      expect(wallet.earned).toBe(0);

      const raw = JSON.parse(store.scoutit_connects_wallet);
      expect(raw.version).toBe(2);
      expect(raw.roles.broker).toBeDefined();
      expect(raw.roles.broker.granted).toBe(8);
      expect(raw.account.purchased).toBe(10);
    });

    it("preserves legacy flat storage multi-role conflicts in _conflicts without Math.max guessing", () => {
      // Legacy flat storage with conflicting purchased values between seeker (5) and owner (15)
      store.scoutit_connects_wallet = JSON.stringify({
        seeker: { granted: 6, purchased: 5, earned: 0, grantedMonth: "2026-08" },
        owner: { granted: 6, purchased: 15, earned: 0, grantedMonth: "2026-08" },
      });

      const wallet = getWallet("seeker", "solar");
      // Conflicting purchased values are held non-spendable pending resolution
      expect(wallet.purchased).toBe(0);

      const raw = JSON.parse(store.scoutit_connects_wallet);
      expect(raw.version).toBe(2);
      expect(raw._conflicts).toBeDefined();
      expect(raw._conflicts.purchased).toEqual([5, 15]);
      expect(raw.account.purchased).toBe(0);
    });

    it("shares purchased and reward balances across multiple roles of the same user without duplication", () => {
      const seekerWallet = getWallet("seeker", "solar");
      expect(seekerWallet.granted).toBe(6);
      expect(seekerWallet.purchased).toBe(0);

      addPurchasedConnects("seeker", "solar", 10);
      expect(getBalance("seeker", "solar")).toBe(16);

      const ownerWallet = getWallet("owner", "solar");
      expect(ownerWallet.granted).toBe(6);
      expect(ownerWallet.purchased).toBe(10);
      expect(getBalance("owner", "solar")).toBe(16);

      const ownerSpendRes = spendConnects("owner", "solar", 8);
      expect(ownerSpendRes.success).toBe(true);
      expect(ownerSpendRes.remaining).toBe(8);

      const updatedSeekerWallet = getWallet("seeker", "solar");
      expect(updatedSeekerWallet.granted).toBe(6);
      expect(updatedSeekerWallet.purchased).toBe(8);
      expect(getBalance("seeker", "solar")).toBe(14);
    });

    it("spendConnectsServer validates role and passes normalized 'seeker' role to RPC", async () => {
      const mockSupabaseAdmin = {
        rpc: vi.fn().mockResolvedValue({
          data: [{ success: true, remaining_total: 5, spent_granted: 1, spent_purchased: 0, spent_reward: 0 }],
          error: null,
        }),
      };

      const res = await spendConnectsServer({
        supabaseAdmin: mockSupabaseAdmin,
        userId: "usr_buyer_456",
        role: "buyer",
        tier: "solar",
        amount: 1,
        source: "initiate_chat",
      });

      expect(res.success).toBe(true);
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith("spend_connects_atomic", {
        p_user_id: "usr_buyer_456",
        p_role: "seeker",
        p_amount: 1,
        p_tier: "solar",
        p_source: "initiate_chat",
        p_reason: null,
        p_reference_id: null,
      });
    });

    it("spendConnectsServer fails closed without invoking RPC when role is invalid", async () => {
      const mockSupabaseAdmin = { rpc: vi.fn() };

      const res = await spendConnectsServer({
        supabaseAdmin: mockSupabaseAdmin,
        userId: "usr_invalid_789",
        role: "unauthorized_role",
        tier: "solar",
        amount: 1,
      });

      expect(res.success).toBe(false);
      expect(res.reason).toBe("invalid_role");
      expect(mockSupabaseAdmin.rpc).not.toHaveBeenCalled();
    });
  });

  describe("5. Entitlements & Anonymity Shield", () => {
    it("gives 'buyer' identical monthly allowances to 'seeker' across all Cosmic tiers", () => {
      expect(monthlyAllowance("buyer", "starry")).toBe(1);
      expect(monthlyAllowance("buyer", "solar")).toBe(6);
      expect(monthlyAllowance("buyer", "cluster")).toBe(15);
      expect(monthlyAllowance("buyer", "universe")).toBe(40);
    });

    it("evaluates privacy/anonymity shield for 'buyer' role correctly and denies for non-shield roles", () => {
      expect(canUseAnonymityShield("buyer")).toBe(true);
      expect(canUseAnonymityShield("seeker")).toBe(true);
      expect(canUseAnonymityShield("owner")).toBe(true);
      expect(canUseAnonymityShield("broker")).toBe(false);
      expect(canUseAnonymityShield("invalid_role")).toBe(false);

      expect(anonymityShieldDefaultsOn("cluster", "buyer")).toBe(true);
      expect(anonymityShieldDefaultsOn("universe", "buyer")).toBe(true);
      expect(anonymityShieldDefaultsOn("solar", "buyer")).toBe(false);
      expect(anonymityShieldDefaultsOn("cluster", "broker")).toBe(false);
    });
  });

  describe("6. Migration Proposal Structural & Directory Boundary Scan", () => {
    const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
    const rollbackDir = path.resolve(process.cwd(), "supabase/rollback-proposals");
    const migrationPath = path.resolve(migrationsDir, "20260814000002_connect_wallets_role_scope_unification.sql");
    const rollbackPath = path.resolve(rollbackDir, "20260814000002_connect_wallets_role_scope_unification_rollback.sql");

    it("proves supabase/migrations contains valid forward versions and NO rollback files", () => {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

      // Every migration must start with a 14-digit timestamp prefix
      for (const file of files) {
        expect(file).toMatch(/^\d{14}_/);
        // Zero rollback files allowed in migrations directory
        expect(file.toLowerCase()).not.toContain("rollback");
      }
    });

    it("proves manual rollback artifact exists only in supabase/rollback-proposals/", () => {
      expect(fs.existsSync(rollbackPath)).toBe(true);
      const rollbackContent = fs.readFileSync(rollbackPath, "utf-8");
      expect(rollbackContent).toContain("CREATE OR REPLACE FUNCTION public.spend_connects_atomic");
      expect(rollbackContent).toContain("CREATE OR REPLACE FUNCTION public.spend_connects");
      expect(rollbackContent).toContain("CREATE OR REPLACE FUNCTION public.refund_connects_system_error");
      expect(rollbackContent).toContain("connect_wallet_ledger_transaction_type_check");
      expect(rollbackContent).toContain("POST-ROLLBACK VERIFICATION QUERIES");

      // Verify no placeholder comments stand in for executable bodies
      expect(rollbackContent).not.toContain("-- (Original body from");
      expect(rollbackContent).not.toContain("TODO");
    });

    it("verifies forward migration proposal enforces pairwise conflict checks and grant conservation", () => {
      const content = fs.readFileSync(migrationPath, "utf-8");
      expect(content).toContain("STATUS: PROPOSAL ONLY — NOT APPLIED TO LIVE DATABASE");
      expect(content).toContain("T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-4-2026-08-14");

      // Pairwise checks
      expect(content).toContain("can_purchased_max");
      expect(content).toContain("roles_detail");
      expect(content).toContain("v_can_p_val <> v_acct_p_val"); // account vs old-canonical check!
      expect(content).toContain("GRANT_BALANCE_CONFLICT");
      expect(content).toContain("MISSING_SUBSCRIPTION_TIER");
      expect(content).toContain("AMBIGUOUS_ROLE_ALLOCATION");
      expect(content).toContain("MISSING_OR_INVALID_RESET_EVIDENCE");
      expect(content).toContain("r_cur_ucw.granted_month = v_current_month");
      expect(content).toContain("CREATE OR REPLACE FUNCTION public.refund_connects_system_error_canonical");
      expect(content).not.toContain("CREATE OR REPLACE FUNCTION public.refund_connects_system_error(");

      // Explicit backfill invocation
      expect(content).toContain("SELECT * FROM public.backfill_legacy_connect_balances();");
    });
  });
});
