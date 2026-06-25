// ═══════════════════════════════════════════════════════════════
// ScoutIt Connects Wallet — 3-bucket engine (client-side, localStorage)
//
// Locked rules (CONNECTS_AND_BROKER_HANDSHAKE.md):
//   • 3 buckets per role: granted (monthly reset) | purchased | earned
//   • Spend order: granted first → purchased → earned
//   • Granted resets every calendar month; purchased + earned never expire
//   • Per-role wallets — seeker/owner/broker/photographer/researcher each
//     have their own independent pot
//   • Cost: handshake = 1 · seeker→broker contact = 1 · commission pro = 2
//
// ⚠️ This is client-side only (localStorage mock). The Supabase ledger +
//    Make.com sync is the hardening pass once payments are live.
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

// ── Internal helpers ─────────────────────────────────────────

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function emptyWallet(role, tier) {
  const allowance = monthlyAllowance(role, tier);
  return {
    granted:   allowance,
    purchased: 0,
    earned:    0,
    grantedMonth: currentYearMonth(), // tracks when granted was last reset
  };
}

function readAllWallets() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAllWallets(wallets) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

// ── Public API ───────────────────────────────────────────────

/**
 * Get the wallet for a role, auto-creating and resetting granted if needed.
 */
export function getWallet(role, tier) {
  const all = readAllWallets();
  const key = String(role || "seeker").toLowerCase();
  const wallet = all[key] || emptyWallet(key, tier);
  const thisMonth = currentYearMonth();

  // Reset granted if we've rolled into a new calendar month
  if (wallet.grantedMonth !== thisMonth) {
    wallet.granted = monthlyAllowance(key, tier);
    wallet.grantedMonth = thisMonth;
    all[key] = wallet;
    writeAllWallets(all);
  }

  return { ...wallet };
}

/**
 * Total spendable balance across all 3 buckets for the role.
 */
export function getBalance(role, tier) {
  const w = getWallet(role, tier);
  return w.granted + w.purchased + w.earned;
}

/**
 * Spend `amount` Connects for a role.
 * Deducts from granted first, then purchased, then earned.
 * Returns { success, remaining } — does NOT spend if insufficient.
 */
export function spendConnects(role, tier, amount = 1) {
  const all = readAllWallets();
  const key = String(role || "seeker").toLowerCase();
  const wallet = getWallet(key, tier); // ensures reset applied
  const total = wallet.granted + wallet.purchased + wallet.earned;

  if (total < amount) {
    return { success: false, remaining: total };
  }

  let remaining = amount;

  // 1. Drain granted first (it resets — use it before it's gone)
  const fromGranted = Math.min(wallet.granted, remaining);
  wallet.granted -= fromGranted;
  remaining -= fromGranted;

  // 2. Then purchased
  if (remaining > 0) {
    const fromPurchased = Math.min(wallet.purchased, remaining);
    wallet.purchased -= fromPurchased;
    remaining -= fromPurchased;
  }

  // 3. Finally earned
  if (remaining > 0) {
    const fromEarned = Math.min(wallet.earned, remaining);
    wallet.earned -= fromEarned;
  }

  wallet.grantedMonth = currentYearMonth();
  all[key] = wallet;
  writeAllWallets(all);

  const newTotal = wallet.granted + wallet.purchased + wallet.earned;
  return { success: true, remaining: newTotal };
}

/**
 * Add purchased Connects (from a pack buy). Never expire.
 */
export function addPurchasedConnects(role, tier, amount) {
  const all = readAllWallets();
  const key = String(role || "seeker").toLowerCase();
  const wallet = getWallet(key, tier);
  wallet.purchased += amount;
  all[key] = wallet;
  writeAllWallets(all);
  return getBalance(key, tier);
}

/**
 * Add earned Connects (bounty payout). Never expire.
 */
export function addEarnedConnects(role, tier, amount) {
  const all = readAllWallets();
  const key = String(role || "seeker").toLowerCase();
  const wallet = getWallet(key, tier);
  wallet.earned += amount;
  all[key] = wallet;
  writeAllWallets(all);
  return getBalance(key, tier);
}

/**
 * Seed the wallet for a role if it doesn't exist yet (e.g. on first login).
 * Safe to call multiple times — won't overwrite an existing wallet.
 */
export function initWalletIfEmpty(role, tier) {
  const all = readAllWallets();
  const key = String(role || "seeker").toLowerCase();
  if (!all[key]) {
    all[key] = emptyWallet(key, tier);
    writeAllWallets(all);
  }
}
