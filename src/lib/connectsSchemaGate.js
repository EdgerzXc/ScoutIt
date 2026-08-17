// ═══════════════════════════════════════════════════════════════
// ScoutIt Connects Schema Gate
//
// Governs runtime transition between legacy single-wallet tables
// (connect_balances) and canonical role-scoped architecture
// (user_connect_wallets + user_connect_accounts).
//
// Default-safe, opt-in rule:
// Canonical mode is active ONLY when CONNECTS_CANONICAL_ACTIVE === "true".
// Defaults to false (legacy mode) whenever unset, empty, or any other value.
// ═══════════════════════════════════════════════════════════════

/**
 * Returns true only if the canonical role-scoped wallet architecture is explicitly enabled.
 * Server-only, default-false gate.
 */
export function isCanonicalConnectWalletActive() {
  return process.env.CONNECTS_CANONICAL_ACTIVE === "true";
}
