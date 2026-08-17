---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: devlog
report-state: ready-for-review
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-2-2026-08-14
tags: [devlog, agent-workspace, antigravity-report, correction, connects, hybrid-wallet, cutover, migration-proposal]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2]]", "[[CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1]]", "[[00_MASTER_ACTION_PLAN]]"]
---

# Antigravity Report — Connect Ledger Role Scope Correction 2

## Task identity

- **Task ID:** `T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-2-2026-08-14`
- **Starting state:** `ready`
- **Final state:** `ready-for-review`

---

## 1. Executive Summary of Corrections

In response to `CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1.md` and `TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2.md`, all ten required corrections have been executed and verified:

1. **Authoritative Canonical Onboarding:**
   - [complete-onboarding/route.js](file:///c:/Users/jerze/ScoutIt/src/app/api/auth/complete-onboarding/route.js) now explicitly inspects `{ error: canonicalWalletError }` and `{ error: canonicalAcctError }`.
   - If either canonical write fails, the route immediately returns `500` and prevents the `onboarding_completed_at` marker from being written.
   - Legacy `connect_balances` write is treated strictly as a non-authoritative transitional mirror.
   - Tested in `src/lib/__tests__/completeOnboardingApi.test.js` (including negative test cases for canonical role wallet and account balance failures).
2. **Canonical-First Admin Reads with Error Surfacing:**
   - [connects-refund/route.js](file:///c:/Users/jerze/ScoutIt/src/app/api/admin/connects-refund/route.js) GET queries canonical `user_connect_accounts`, `user_connect_wallets`, and `connect_wallet_ledger` first.
   - Explicit database errors on canonical reads return `500` immediately rather than silently falling back to stale legacy data.
   - Legacy `connect_balances` and `connect_transactions` are queried only when canonical state is genuinely absent (unmigrated legacy users).
   - Tested in `src/lib/__tests__/connectsRefundApi.test.js`.
3. **Staged Single-Authority Cutover Plan:**
   - Defined the 5-phase migration cutover lifecycle in the proposal and documentation:
     1. *Phase 1:* Apply migration (creates `user_connect_accounts`, updates ledger CHECK constraint, creates durable hold table, runs lossless reconciliation).
     2. *Phase 2:* Inspect `public.connect_backfill_holds` to verify zero unaddressed conflicts.
     3. *Phase 3:* Authoritative runtime routes (`complete-onboarding`, `connects-refund`, `spend_connects_atomic`) operate directly against canonical tables.
     4. *Phase 4:* Legacy `connect_balances` mirror operates as non-authoritative read compatibility.
     5. *Phase 5:* Deprecate and drop legacy tables.
4. **Lossless Permanent Balance Reconciliation Across All Stores:**
   - In `backfill_legacy_connect_balances()`, reconciles both legacy `connect_balances` (`purchased_balance`, `earned_balance`) and existing canonical `user_connect_wallets` columns (`purchased_balance`, `reward_balance`).
   - *Matching values:* Populates `user_connect_accounts` with verified balance without duplicate summing.
   - *One-sided values:* Copies active balance losslessly.
   - *Conflicting non-zero values:* Routes to durable hold table `public.connect_backfill_holds` with reason `PERMANENT_BALANCE_CONFLICT`.
5. **Grant Rollover Using Date and Tier Evidence:**
   - Inspects `last_granted_reset` against `current_month`:
     - If in current month: preserves verified active `granted_balance`.
     - If in prior month: grant is expired; calculates fresh current month tier allowance based on user's verified `subscription_tier`.
     - If no profile or tier evidence: routes to hold table with reason `NO_ROLE_EVIDENCE`.
6. **Durable, Actionable Hold Table:**
   - Created `public.connect_backfill_holds` table (`user_id`, `hold_reason`, `legacy_data`, `canonical_data`, `resolved`, `created_at`, `UNIQUE(user_id, hold_reason)`).
   - Backfill procedure returns `(reconciled_accounts, reconciled_wallets, skipped_unchanged, held_conflicts)`.
   - Repeat execution is completely idempotent (`reconciled = 0, skipped = total`).
7. **Complete Functional Rollback Plan:**
   - Documented exact step-by-step SQL to restore previous 5-argument `refund_connects_system_error` body, restore LR-03 `spend_connects_atomic`, revert CHECK constraints, drop helper functions, and preserve all table history.
8. **Client Wallet State Management Fixed:**
   - [connectsWallet.js](file:///c:/Users/jerze/ScoutIt/src/lib/connectsWallet.js) refactored with versioned state format (`version: 2`).
   - `addPurchasedConnects` and `addEarnedConnects` atomically load state, ensure role wallet entry, update account pool, and write unified state in one operation.
   - Tested direct addition on completely uninitialized / empty localStorage.
9. **Precise Balance Semantics:**
   - Clearly separated and labeled:
     - `accountPermanentBalance`: `purchased + reward` (account-wide, permanent, spendable from any active role).
     - `primaryRoleSpendableBalance`: `primaryRole.granted + accountPermanentBalance` (total spendable right now when acting in primary role).
     - `portfolioTotalBalance`: `SUM(all active role grants) + accountPermanentBalance` (platform asset summary across all roles).
10. **Master Action Plan Reconciliation:**
    - Updated [00_MASTER_ACTION_PLAN.md](file:///c:/Users/jerze/ScoutIt/_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN.md) line 859 and router line 117 to keep the item open as `[ ] 🟡` (Correction 2 ready for review).

---

## 2. Changed Files

1. `supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql`: Lossless reconciliation, conflict hold table, exact 5-argument refund RPC, CHECK constraint upgrade, and rollback instructions.
2. `src/lib/connectsWallet.js`: Versioned state management, atomic role/account initialization, and strict fail-closed role normalization.
3. `src/lib/entitlements.js`: Aligned role normalizer with strict fail-closed semantics and safe seeker persona defaults for anonymity shield.
4. `src/app/api/auth/complete-onboarding/route.js`: Authoritative canonical wallet and account provisioning with strict `{ error }` checks.
5. `src/app/api/admin/connects-refund/route.js`: Canonical-first GET with explicit balance semantics and legacy fallback; exact 5-argument POST.
6. `src/lib/__tests__/completeOnboardingApi.test.js`: Mock assertions for canonical role wallet and account upserts, plus failure handling tests.
7. `src/lib/__tests__/connectsRefundApi.test.js`: New comprehensive test suite for admin connects-refund GET (canonical-first, error surfacing, legacy fallback, 404) and POST (exact 5-arg RPC call).
8. `src/lib/__tests__/connectsRoleNormalization.test.js`: Executable test suite covering normalization, hybrid engine, direct initialization on empty storage, reconciliation fixtures (Cases 1-7), and static SQL contract assertions.
9. `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN.md`: Updated Section 1.0D item and router line 117.
10. `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/WORKFLOW_STATUS.md`: Updated active packet reference and status.
11. `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2.md`: Marked `ready-for-review`.

---

## 3. Verification & Evidence

| Command / Test Suite | Exit Code | Result | Scope / Evidence |
|---|---|---|---|
| Focused Vitest Suite: `npx.cmd vitest run src/lib/__tests__/connectsRoleNormalization.test.js src/lib/__tests__/connectsWallet.test.js src/lib/__tests__/completeOnboardingApi.test.js src/lib/__tests__/connectsRefundApi.test.js src/lib/__tests__/anonymityShield.test.js` | `0` | **PASS** | 5 test files passed, 64/64 tests passed (2.20s). |
| Scoped ESLint: `npx.cmd eslint src/lib/connectsWallet.js src/lib/entitlements.js src/app/api/auth/complete-onboarding/route.js src/app/api/admin/connects-refund/route.js src/lib/__tests__/connectsRoleNormalization.test.js src/lib/__tests__/completeOnboardingApi.test.js src/lib/__tests__/connectsRefundApi.test.js` | `0` | **PASS** | 0 errors, 0 warnings across all modified JS files. |
| Full Workspace Unit Suite: `npm.cmd run test:unit` | `0` | **PASS** | **103 test files passed, 1109/1109 tests passed (40.12s)**. Zero regressions across the workspace. |
| Scoped Whitespace Check: `git diff --check` | `0` | **PASS** | 0 whitespace or formatting defects. |
| Live Supabase State | **UNTOUCHED** | **PASS** | Zero live migrations applied, zero production data modified. |

---

## 4. Invariant Confirmation & Stop Gate

- **Live migration applied:** No (Proposal only)
- **Production data mutated:** No
- **Credentials accessed or modified:** No
- **Git commit / push / deployment performed:** No
- **External provider or settings changed:** No
- **Gate:** Stopped at the live-system migration gate. The SQL migration [20260814000002_connect_wallets_role_scope_unification.sql](file:///c:/Users/jerze/ScoutIt/supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql) remains a reviewable proposal and has **not been applied** to production.
