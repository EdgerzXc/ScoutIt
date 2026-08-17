import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  userConnectAccountsMaybeSingle: vi.fn(),
  userConnectWalletsSelect: vi.fn(),
  connectWalletLedgerLimit: vi.fn(),
  userProfilesMaybeSingle: vi.fn(),
  connectBackfillHoldsSelect: vi.fn(),
  legacyBalancesMaybeSingle: vi.fn(),
  legacyTransactionsLimit: vi.fn(),
  refundRpc: vi.fn(),
}));

vi.mock("@/lib/adminGuard", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "user_connect_accounts") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mocks.userConnectAccountsMaybeSingle }),
          }),
        };
      }
      if (table === "user_connect_wallets") {
        return {
          select: () => ({
            eq: mocks.userConnectWalletsSelect,
          }),
        };
      }
      if (table === "connect_wallet_ledger") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: mocks.connectWalletLedgerLimit,
              }),
            }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mocks.userProfilesMaybeSingle }),
          }),
        };
      }
      if (table === "connect_backfill_holds") {
        return {
          select: () => ({
            eq: () => ({
              eq: mocks.connectBackfillHoldsSelect,
            }),
          }),
        };
      }
      if (table === "connect_balances") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: mocks.legacyBalancesMaybeSingle }),
          }),
        };
      }
      if (table === "connect_transactions") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: mocks.legacyTransactionsLimit,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table in test: ${table}`);
    },
    rpc: mocks.refundRpc,
  },
}));

import { GET, POST } from "@/app/api/admin/connects-refund/route";

function createGetRequest(userId) {
  return new Request(`https://scoutit.space/api/admin/connects-refund?userId=${encodeURIComponent(userId)}`, {
    method: "GET",
  });
}

function createPostRequest(body) {
  return new Request("https://scoutit.space/api/admin/connects-refund", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("admin connects refund API", () => {
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const origEnv = process.env.CONNECTS_CANONICAL_ACTIVE;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ userId: "staff-adm-1", error: null });
    mocks.connectBackfillHoldsSelect.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    if (origEnv !== undefined) {
      process.env.CONNECTS_CANONICAL_ACTIVE = origEnv;
    } else {
      delete process.env.CONNECTS_CANONICAL_ACTIVE;
    }
  });

  describe("Pre-migration default (CONNECTS_CANONICAL_ACTIVE unset / false)", () => {
    it("queries ONLY legacy tables and does not touch canonical or hold tables", async () => {
      delete process.env.CONNECTS_CANONICAL_ACTIVE;

      mocks.legacyBalancesMaybeSingle.mockResolvedValue({
        data: {
          user_id: "usr-legacy-1",
          granted_balance: 1,
          purchased_balance: 2,
          earned_balance: 0,
          total_balance: 3,
        },
        error: null,
      });
      mocks.legacyTransactionsLimit.mockResolvedValue({ data: [], error: null });

      const response = await GET(createGetRequest("usr-legacy-1"));
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.balance.authority).toBe("legacy");
      expect(json.balance.total_balance).toBe(3);
      expect(json.balance.hasActiveHold).toBe(false);
      expect(json.balance.activeHolds).toEqual([]);

      // Canonical tables must NOT be queried
      expect(mocks.userConnectAccountsMaybeSingle).not.toHaveBeenCalled();
      expect(mocks.userConnectWalletsSelect).not.toHaveBeenCalled();
      expect(mocks.connectBackfillHoldsSelect).not.toHaveBeenCalled();
    });
  });

  describe("Post-migration canonical mode (CONNECTS_CANONICAL_ACTIVE = 'true')", () => {
    beforeEach(() => {
      process.env.CONNECTS_CANONICAL_ACTIVE = "true";
    });

    it("returns canonical authority state with accurate current-month grant semantics", async () => {
      mocks.userConnectAccountsMaybeSingle.mockResolvedValue({
        data: { user_id: "usr-can-1", purchased_balance: 10, reward_balance: 5, updated_at: "2026-08-14T00:00:00Z" },
        error: null,
      });
      mocks.userConnectWalletsSelect.mockResolvedValue({
        data: [
          { id: "w-1", role: "seeker", granted_balance: 6, granted_month: currentMonth },
          { id: "w-2", role: "owner", granted_balance: 18, granted_month: currentMonth },
        ],
        error: null,
      });
      mocks.connectWalletLedgerLimit.mockResolvedValue({
        data: [
          {
            id: "ledg-1",
            role: "seeker",
            amount: 5,
            transaction_type: "refund",
            source: "system_error_refund",
            reason: "System refund",
            reference_id: "ref-123",
            created_at: "2026-08-14T01:00:00Z",
          },
        ],
        error: null,
      });
      mocks.userProfilesMaybeSingle.mockResolvedValue({
        data: { id: "usr-can-1", primary_mode: "seeker", role: "seeker", active_roles: ["seeker", "owner"], subscription_tier: "cluster" },
        error: null,
      });

      const response = await GET(createGetRequest("usr-can-1"));
      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.balance.authority).toBe("canonical");
      expect(json.balance.purchasedBalance).toBe(10);
      expect(json.balance.rewardBalance).toBe(5);
      expect(json.balance.accountPermanentBalance).toBe(15);
      expect(json.balance.primaryRoleGrantedBalance).toBe(6);
      expect(json.balance.primaryRoleSpendableBalance).toBe(21);
      expect(json.balance.portfolioTotalBalance).toBe(39);
      expect(json.balance.hasActiveHold).toBe(false);
      expect(json.priorRefunds).toBe(1);
    });

    it("surfaces multiple active reconciliation holds as an array without single-row crash", async () => {
      mocks.userConnectAccountsMaybeSingle.mockResolvedValue({ data: null, error: null });
      mocks.userConnectWalletsSelect.mockResolvedValue({ data: [], error: null });
      mocks.connectWalletLedgerLimit.mockResolvedValue({ data: [], error: null });
      mocks.userProfilesMaybeSingle.mockResolvedValue({ data: { id: "usr-multi-held", role: "seeker" }, error: null });
      mocks.connectBackfillHoldsSelect.mockResolvedValue({
        data: [
          { id: "h-1", hold_reason: "PERMANENT_BALANCE_CONFLICT", created_at: "2026-08-14T00:00:00Z" },
          { id: "h-2", hold_reason: "MISSING_SUBSCRIPTION_TIER", created_at: "2026-08-14T00:00:00Z" },
        ],
        error: null,
      });

      const response = await GET(createGetRequest("usr-multi-held"));
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.balance.hasActiveHold).toBe(true);
      expect(json.balance.activeHolds).toHaveLength(2);
      expect(json.balance.activeHold.hold_reason).toBe("PERMANENT_BALANCE_CONFLICT");
    });
  });

  describe("POST /api/admin/connects-refund", () => {
    it("uses the legacy refund RPC while the canonical gate is false", async () => {
      mocks.refundRpc.mockResolvedValue({
        data: [{ total_balance: 15, transaction_id: "tx-uuid-1" }],
        error: null,
      });

      const response = await POST(createPostRequest({
        userId: "usr-ref-1",
        amount: 5,
        reason: "Duplicate billing charge refund",
        refId: "bill-987",
      }));

      expect(response.status).toBe(200);
      expect(mocks.refundRpc).toHaveBeenCalledWith("refund_connects_system_error", {
        p_user_id: "usr-ref-1",
        p_amount: 5,
        p_reason: "Duplicate billing charge refund",
        p_staff_id: "staff-adm-1",
        p_ref_id: "bill-987",
      });
      const json = await response.json();
      expect(json.balanceAuthority).toBe("legacy_spendable");
      expect(json.legacySpendableBalance).toBe(15);
      expect(json.transactionId).toBe("tx-uuid-1");
    });

    it("returns 404 when RPC raises WALLET_NOT_FOUND (user without established wallet)", async () => {
      mocks.refundRpc.mockResolvedValue({
        data: null,
        error: { message: "WALLET_NOT_FOUND: user usr-profile-only does not have an established wallet" },
      });

      const response = await POST(createPostRequest({
        userId: "usr-profile-only",
        amount: 5,
        reason: "Profile only refund attempt",
      }));

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe("No wallet found for that user.");
    });

    it("returns 409 when user has an active unresolved reconciliation hold", async () => {
      mocks.refundRpc.mockResolvedValue({
        data: null,
        error: { message: "WALLET_HOLD_ACTIVE: user balance is held pending reconciliation resolution" },
      });

      const response = await POST(createPostRequest({
        userId: "usr-held-1",
        amount: 5,
        reason: "Held user refund attempt",
      }));

      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json.error).toBe("Refund blocked: user balance is held pending reconciliation resolution.");
    });
    it("uses only the canonical refund RPC after explicit activation", async () => {
      process.env.CONNECTS_CANONICAL_ACTIVE = "true";
      mocks.refundRpc.mockResolvedValue({ data: [{ total_balance: 22, transaction_id: "tx-can-1" }], error: null });
      const response = await POST(createPostRequest({ userId: "usr-ref-1", amount: 5, reason: "Verified duplicate charge" }));
      expect(response.status).toBe(200);
      expect(mocks.refundRpc).toHaveBeenCalledWith("refund_connects_system_error_canonical", expect.any(Object));
      const json = await response.json();
      expect(json.balanceAuthority).toBe("canonical_account_permanent");
      expect(json.accountPermanentBalance).toBe(22);
      expect(json.legacySpendableBalance).toBeUndefined();
    });
  });
});
