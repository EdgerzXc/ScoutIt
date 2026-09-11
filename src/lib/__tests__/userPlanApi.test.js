import { beforeEach, describe, expect, it, vi } from "vitest";

// A-135 — /api/user/plan reports the account's own plan, never the free-mode
// "universe" access tier and never a guessed balance.

const state = { userId: "user-1", tier: "cluster", profileError: null, wallet: { total_balance: 17 }, walletError: null, freeMode: true, canonical: false };

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => state.userId }));
vi.mock("@/lib/featureFlags", () => ({ isPreLaunchFreeMode: async () => state.freeMode }));
vi.mock("@/lib/connectsSchemaGate", () => ({ isCanonicalConnectWalletActive: () => state.canonical }));
vi.mock("@/lib/sanitizeError", () => ({ sanitizeError: (_e, fallback) => fallback }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === "user_profiles") {
              return { data: state.tier === undefined ? null : { subscription_tier: state.tier }, error: state.profileError };
            }
            if (table === "connect_balances") return { data: state.wallet, error: state.walletError };
            throw new Error(`unexpected table ${table}`);
          },
        }),
      }),
    }),
  },
}));

const { GET } = await import("@/app/api/user/plan/route");
const call = async () => {
  const res = await GET(new Request("http://localhost/api/user/plan"));
  return { status: res.status, body: await res.json(), headers: res.headers };
};

beforeEach(() => {
  Object.assign(state, { userId: "user-1", tier: "cluster", profileError: null, wallet: { total_balance: 17 }, walletError: null, freeMode: true, canonical: false });
});

describe("A-135 · /api/user/plan", () => {
  it("refuses a signed-out request", async () => {
    state.userId = null;
    expect((await call()).status).toBe(401);
  });

  it("reports the account's own plan even while free mode unlocks everything", async () => {
    const { status, body, headers } = await call();
    expect(status).toBe(200);
    expect(body.plan).toEqual({ tier: "cluster", label: "Cluster" });
    expect(body.freeMode).toBe(true);
    expect(headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("never rounds an unknown or missing plan to a real tier", async () => {
    state.tier = "platinum";
    expect((await call()).body.plan).toEqual({ tier: null, label: null });
    state.tier = undefined;
    expect((await call()).body.plan).toEqual({ tier: null, label: null });
  });

  it("reports the legacy wallet balance, and says so when there is no wallet", async () => {
    expect((await call()).body.connects).toEqual({ balance: 17, hasWallet: true });
    state.wallet = null;
    expect((await call()).body.connects).toEqual({ balance: 0, hasWallet: false });
  });

  it("reports the balance as unknown rather than guessing", async () => {
    state.walletError = { message: "down" };
    expect((await call()).body.connects.balance).toBeNull();
    state.walletError = null;
    state.canonical = true;
    expect((await call()).body.connects.balance).toBeNull();
  });

  it("fails honestly when the plan cannot be read", async () => {
    state.profileError = { message: "down" };
    expect((await call()).status).toBe(500);
  });
});
