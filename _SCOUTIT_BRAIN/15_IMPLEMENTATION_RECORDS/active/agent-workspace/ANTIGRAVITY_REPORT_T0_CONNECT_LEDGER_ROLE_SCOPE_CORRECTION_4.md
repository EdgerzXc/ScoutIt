---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: devlog
report-state: ready-for-review
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-4-2026-08-14
tags: [devlog, agent-workspace, antigravity-report, correction, connects, hybrid-wallet, cutover, migration-proposal]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4]]", "[[CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3]]", "[[TASK_T0_AGENT_SAFE_HARDENING_BATCH_1]]"]
---

# Antigravity Report — Connect Ledger Role Scope Correction 4

## Task identity

- **Task ID:** `T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-4-2026-08-14`
- **Starting state:** `ready`
- **Final state:** `ready-for-review`

---

## 1. Executive Summary of Corrections

In response to `CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3.md` and `TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4.md`, all eight required corrections have been executed and verified:

1. **Server-Only, Opt-In, Default-False Schema Capability Gate:**
   - [connectsSchemaGate.js](file:///c:/Users/jerze/ScoutIt/src/lib/connectsSchemaGate.js) now reads `process.env.CONNECTS_CANONICAL_ACTIVE`.
   - Returns true only when exact string `"true"`. Defaults to `false` (legacy mode) when unset, empty, or any other value.
   - Both [complete-onboarding/route.js](file:///c:/Users/jerze/ScoutIt/src/app/api/auth/complete-onboarding/route.js) and [connects-refund/route.js](file:///c:/Users/jerze/ScoutIt/src/app/api/admin/connects-refund/route.js) adhere to `isCanonicalConnectWalletActive()`.
   - In pre-migration legacy mode, admin GET and onboarding never touch absent canonical or hold tables.
2. **Relocation of Manual Rollback Script:**
   - Relocated manual rollback proposal to [supabase/rollback-proposals/20260814000002_connect_wallets_role_scope_unification_rollback.sql](file:///c:/Users/jerze/ScoutIt/supabase/rollback-proposals/20260814000002_connect_wallets_role_scope_unification_rollback.sql).
   - Removed rollback file from `supabase/migrations/`.
   - Automated test enforces that `supabase/migrations/` contains only valid forward migrations and no rollback files.
3. **Pairwise 3-Store Permanent Balance Reconciliation:**
   - In `backfill_legacy_connect_balances()`, performs complete pairwise comparisons:
     - Legacy vs Old Canonical (`v_leg_p_val` vs `v_can_p_val`).
     - Legacy vs Account (`v_leg_p_val` vs `v_acct_p_val`).
     - Old Canonical vs Account (`v_can_p_val` vs `v_acct_p_val`).
     - Intra-canonical role differences (`v_can_p_distinct_count > 1` or `v_can_r_distinct_count > 1`), storing all distinct per-role data in `canonical_data`.
   - Conflicting values route to `connect_backfill_holds` with `resolved = FALSE`.
4. **Grant Conservation & Typed Rollover:**
   - Preserves verified current canonical wallets without resetting spent balances.
   - If canonical wallet is current and legacy is stale/missing: canonical grant is preserved.
   - If both legacy and canonical have current month evidence with differing values: routes to hold `GRANT_BALANCE_CONFLICT`.
   - Missing subscription tier routes to `MISSING_SUBSCRIPTION_TIER` (zero `COALESCE` to starry).
   - Ambiguous multiple active roles route to `AMBIGUOUS_ROLE_ALLOCATION`.
5. **Safe Rollback Strategy with Existing Refunds:**
   - Rollback script ensures `connect_wallet_ledger` CHECK constraint safely permits existing `'refund'` audit rows without constraint validation failure.
6. **Refund Requires Established Wallet with Truthful Semantics:**
   - `refund_connects_system_error` validates user existence across established wallets/accounts/balances:
     `IF NOT EXISTS (SELECT 1 FROM user_connect_accounts WHERE user_id = p_user_id) AND NOT EXISTS (SELECT 1 FROM user_connect_wallets WHERE user_id = p_user_id) AND NOT EXISTS (SELECT 1 FROM connect_balances WHERE user_id = p_user_id) THEN RAISE EXCEPTION 'WALLET_NOT_FOUND...';`
   - Profile-only users without wallets raise `WALLET_NOT_FOUND` and map to `404 Not Found`.
   - Returns structured `accountPermanentBalance` and `transactionId`.
7. **Multiple Holds & Active Roles Handling:**
   - Admin GET queries `connect_backfill_holds` as an array with `.eq("resolved", false)`, preventing `maybeSingle()` errors when multiple holds exist.
   - Portfolio total calculation filters current grants by normalized `active_roles`.
8. **Client LocalStorage Multi-Role Conflict Preservation:**
   - In [connectsWallet.js](file:///c:/Users/jerze/ScoutIt/src/lib/connectsWallet.js), multi-role conflicts in legacy flat storage are preserved in `_conflicts` property as non-spendable evidence until resolved. Zero `Math.max` guessing.

---

## 2. Verification Summary

- **Focused Unit Tests:** 5 test files, 61/61 tests passed (2.11s).
- **Directory Boundary Scan:** Verified unique timestamp prefixes and 0 rollback files in `supabase/migrations/`.
- **Live Supabase State:** Zero migrations applied, zero production data modified.

## Batch 1 Correction 1 addendum (2026-08-14)

The refund cutover now uses distinct RPC names: the default-false runtime calls the unchanged legacy
`refund_connects_system_error`, while explicit canonical activation calls
`refund_connects_system_error_canonical`. Missing/invalid reset evidence and genuinely ambiguous
role evidence create unresolved holds; a current canonical grant remains untouched so a rerun cannot
restore already-spent allowance. The manual rollback drops the canonical RPC and restores the legacy
contract. This remains an unapplied local proposal in `ready-for-review` state.