// ═══════════════════════════════════════════════════════════════
// ScoutIt Connects Wallet — Hybrid 3-bucket engine
//
// Locked rules (_SCOUTIT_BRAIN/06_MONETIZATION/CONNECTS_AND_BROKER_HANDSHAKE.md):
//   • 3 buckets:
//       1. Role Monthly Granted (expiring on calendar month rollover)
//       2. Account-wide Purchased (permanent, shared across all active roles)
//       3. Account-wide Earned/Reward (permanent, shared across all active roles)
//   • Spend order: granted first → purchased → earned
//   • Granted resets every calendar month; purchased + earned never expire
//   • Role allowances: seeker/buyer, owner, broker, photographer, researcher
//   • Cost: handshake = 1 · seeker→broker contact = 1 · commission pro = 2
// ═══════════════════════════════════════════════════════════════

import { monthlyAllowance } from "./entitlements";

const STORAGE_KEY = "scoutit_connects_wallet";

// Cost table — mirrors CONNECT_COSTS seeded in Airtable
export const CONNECT_COSTS = {
  handshake:    1,  // owner invites broker OR broker pitches owner
  brokerContact: 1, // seeker contacts a broker directly
  commissionPhotographer: 2,
  commissionResearcher:   2,
  commissionEventPlanner: 2,
};

export const SUPPORTED_CONNECT_ROLES = [
  "seeker",
  "owner",
  "broker",
  "photographer",
  "researcher",
];

// ── Role Normalization ────────────────────────────────────────

/**
 * Normalizes user-facing role names to the canonical Connects economy role keys.
 * Maps 'buyer' (the UI persona) to 'seeker' (the wallet/allowance key).
 * Returns null for unrecognized/empty roles to enforce fail-closed semantics.
 */
export function normalizeConnectRole(role) {
  if (!role || typeof role !== "string") return null;
  const r = role.trim().toLowerCase();
  if (r === "buyer") return "seeker";
  if (SUPPORTED_CONNECT_ROLES.includes(r)) return r;
  return null;
}

/**
 * Resolves role input:
 * - If role is omitted (null/undefined/empty), uses defaultRole ('seeker').
 * - If role is an explicit string, returns normalized canonical role or null if invalid.
 */
export function resolveConnectRole(role, defaultRole = "seeker") {
  if (role === null || role === undefined || (typeof role === "string" && role.trim() === "")) {
    return defaultRole;
  }
  return normalizeConnectRole(role);
}

// ── Internal helpers ─────────────────────────────────────────

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function readAllWallets() {
  if (typeof window === "undefined") {
    return { version: 2, roles: {}, account: { purchased: 0, earned: 0 } };
  }
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (
      raw &&
      typeof raw === "object" &&
      raw.roles &&
      typeof raw.roles === "object" &&
      raw.account &&
      typeof raw.account === "object"
    ) {
      const cleanRoles = {};
      for (const [k, v] of Object.entries(raw.roles)) {
        const normKey = normalizeConnectRole(k);
        if (normKey && v && typeof v === "object") {
          cleanRoles[normKey] = {
            granted: Number(v.granted) || 0,
            grantedMonth: String(v.grantedMonth || currentYearMonth()),
          };
        }
      }
      return {
        version: 2,
        roles: cleanRoles,
        account: {
          purchased: Math.max(0, Number(raw.account.purchased) || 0),
          earned: Math.max(0, Number(raw.account.earned) || 0),
        },
      };
    }

    // Version 1 / legacy flat format migration
    const roles = {};
    const purchasedValues = [];
    const earnedValues = [];

    if (raw && typeof raw === "object") {
      for (const [k, v] of Object.entries(raw)) {
        if (k === "_account" || k === "account") {
          if (v?.purchased) purchasedValues.push(Number(v.purchased) || 0);
          if (v?.earned) earnedValues.push(Number(v.earned) || 0);
        } else {
          const normKey = normalizeConnectRole(k);
          if (normKey && v && typeof v === "object") {
            roles[normKey] = {
              granted: Number(v.granted) || 0,
              grantedMonth: String(v.grantedMonth || currentYearMonth()),
            };
            if (v.purchased) purchasedValues.push(Number(v.purchased) || 0);
            if (v.earned) earnedValues.push(Number(v.earned) || 0);
          }
        }
      }
    }

    // Reconcile legacy values losslessly without Math.max conflict selection
    const uniquePurchased = Array.from(new Set(purchasedValues.filter((val) => val > 0)));
    const uniqueEarned = Array.from(new Set(earnedValues.filter((val) => val > 0)));

    let finalPurchased = 0;
    let finalEarned = 0;
    const conflicts = {};

    if (uniquePurchased.length === 1) {
      finalPurchased = uniquePurchased[0];
    } else if (uniquePurchased.length > 1) {
      conflicts.purchased = uniquePurchased;
      finalPurchased = 0; // Held non-spendable pending explicit resolution
    }

    if (uniqueEarned.length === 1) {
      finalEarned = uniqueEarned[0];
    } else if (uniqueEarned.length > 1) {
      conflicts.earned = uniqueEarned;
      finalEarned = 0; // Held non-spendable pending explicit resolution
    }

    return {
      version: 2,
      roles,
      account: { purchased: finalPurchased, earned: finalEarned },
      ...(Object.keys(conflicts).length > 0 ? { _conflicts: conflicts } : {}),
    };
  } catch {
    return { version: 2, roles: {}, account: { purchased: 0, earned: 0 } };
  }
}

function writeAllWallets(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureRoleWallet(state, roleKey, tier) {
  const thisMonth = currentYearMonth();
  let roleWallet = state.roles[roleKey];
  if (!roleWallet) {
    roleWallet = {
      granted: monthlyAllowance(roleKey, tier),
      grantedMonth: thisMonth,
    };
    state.roles[roleKey] = roleWallet;
  } else if (roleWallet.grantedMonth !== thisMonth) {
    roleWallet.granted = monthlyAllowance(roleKey, tier);
    roleWallet.grantedMonth = thisMonth;
    state.roles[roleKey] = roleWallet;
  }
  return roleWallet;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Get the wallet for a role, auto-creating and resetting granted if needed.
 * Fails closed on explicit invalid roles.
 */
export function getWallet(role, tier) {
  const key = resolveConnectRole(role, "seeker");
  if (!key) {
    return { granted: 0, purchased: 0, earned: 0, grantedMonth: "", error: "invalid_role" };
  }

  const state = readAllWallets();
  const roleWallet = ensureRoleWallet(state, key, tier);
  writeAllWallets(state);

  return {
    granted: roleWallet.granted,
    purchased: state.account.purchased || 0,
    earned: state.account.earned || 0,
    grantedMonth: roleWallet.grantedMonth,
  };
}

/**
 * Total spendable balance across all 3 buckets for the role.
 */
export function getBalance(role, tier) {
  const key = resolveConnectRole(role, "seeker");
  if (!key) return 0;
  const w = getWallet(key, tier);
  return w.granted + w.purchased + w.earned;
}

/**
 * Spend 'amount' Connects for a role.
 * Deducts from role granted first, then account-wide purchased, then account-wide earned.
 * Returns { success, remaining } — fails closed on invalid roles or insufficient balance.
 */
export function spendConnects(role, tier, amount = 1) {
  const key = resolveConnectRole(role, "seeker");
  if (!key) {
    return { success: false, remaining: 0, error: "invalid_role" };
  }

  if (amount === 0) {
    const w = getWallet(key, tier);
    return { success: true, remaining: w.granted + w.purchased + w.earned };
  }

  const state = readAllWallets();
  const roleWallet = ensureRoleWallet(state, key, tier);
  const total = roleWallet.granted + (state.account.purchased || 0) + (state.account.earned || 0);

  if (total < amount) {
    return { success: false, remaining: total };
  }

  let remaining = amount;

  // 1. Drain role granted first (it resets — use it before it's gone)
  const fromGranted = Math.min(roleWallet.granted, remaining);
  roleWallet.granted -= fromGranted;
  remaining -= fromGranted;

  // 2. Then account-wide purchased
  let purchased = state.account.purchased || 0;
  if (remaining > 0) {
    const fromPurchased = Math.min(purchased, remaining);
    purchased -= fromPurchased;
    remaining -= fromPurchased;
  }

  // 3. Finally account-wide earned
  let earned = state.account.earned || 0;
  if (remaining > 0) {
    const fromEarned = Math.min(earned, remaining);
    earned -= fromEarned;
    remaining -= fromEarned;
  }

  roleWallet.grantedMonth = currentYearMonth();
  state.roles[key] = roleWallet;
  state.account = { purchased, earned };
  writeAllWallets(state);

  const newTotal = roleWallet.granted + purchased + earned;
  return { success: true, remaining: newTotal };
}

/**
 * Add purchased Connects (from a pack buy). Account-wide permanent balance.
 */
export function addPurchasedConnects(role, tier, amount) {
  const key = resolveConnectRole(role, "seeker");
  if (!key) return 0;
  if (!amount || amount <= 0) return getBalance(key, tier);

  const state = readAllWallets();
  ensureRoleWallet(state, key, tier);
  state.account.purchased = (state.account.purchased || 0) + amount;
  writeAllWallets(state);
  return getBalance(key, tier);
}

/**
 * Add earned Connects (bounty payout). Account-wide permanent balance.
 */
export function addEarnedConnects(role, tier, amount) {
  const key = resolveConnectRole(role, "seeker");
  if (!key) return 0;
  if (!amount || amount <= 0) return getBalance(key, tier);

  const state = readAllWallets();
  ensureRoleWallet(state, key, tier);
  state.account.earned = (state.account.earned || 0) + amount;
  writeAllWallets(state);
  return getBalance(key, tier);
}

/**
 * Seed the wallet for a role if it doesn't exist yet (e.g. on first login).
 * Safe to call multiple times — won't overwrite an existing wallet.
 */
export function initWalletIfEmpty(role, tier) {
  const key = resolveConnectRole(role, "seeker");
  if (!key) return;
  getWallet(key, tier);
}

/**
 * Server-authoritative Connect spend executing atomic hybrid wallet deduction.
 * Spends in exact locked order:
 *   1. Role monthly granted balance (expiring)
 *   2. Account-wide purchased balance (permanent)
 *   3. Account-wide reward balance (permanent)
 */
export async function spendConnectsServer({
  supabaseAdmin,
  userId,
  role = "seeker",
  tier = "starry",
  amount = 1,
  source = "spend",
  reason = null,
  referenceId = null,
}) {
  if (!supabaseAdmin || !userId) {
    return { success: false, remaining: 0, reason: "authentication_required" };
  }

  const normalizedRole = normalizeConnectRole(role);
  if (!normalizedRole) {
    return { success: false, remaining: 0, reason: "invalid_role" };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("spend_connects_atomic", {
      p_user_id: userId,
      p_role: normalizedRole,
      p_amount: amount,
      p_tier: String(tier).toLowerCase(),
      p_source: source,
      p_reason: reason,
      p_reference_id: referenceId,
    });

    if (error || !data || data.length === 0) {
      return { success: false, remaining: 0, reason: error?.message || "wallet_error" };
    }

    const row = data[0];
    return {
      success: row.success === true,
      remaining: row.remaining_total ?? 0,
      spentGranted: row.spent_granted ?? 0,
      spentPurchased: row.spent_purchased ?? 0,
      spentReward: row.spent_reward ?? 0,
    };
  } catch (err) {
    return { success: false, remaining: 0, reason: err.message || "wallet_exception" };
  }
}
