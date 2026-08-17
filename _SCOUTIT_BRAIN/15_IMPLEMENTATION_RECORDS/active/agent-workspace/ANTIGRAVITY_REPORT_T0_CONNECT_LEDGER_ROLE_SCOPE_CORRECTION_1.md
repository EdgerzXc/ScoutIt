---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: devlog
report-state: ready-for-review
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-1-2026-08-14
tags: [devlog, agent-workspace, antigravity-report, correction, connects, hybrid-wallet, migration-proposal]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1]]", "[[CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE]]", "[[00_MASTER_ACTION_PLAN]]"]
---

# Antigravity Report — Connect Ledger Role Scope Correction 1

## Task identity

- **Task ID:** `T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-1-2026-08-14`
- **Starting state:** `changes-requested`
- **Final state:** `ready-for-review`

---

## 1. Executive Summary of Corrections

In response to `CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE.md` and `TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1.md`, all eight required corrections have been executed and verified:

1. **Single Wallet Authority & Cutover Boundary:**
   - Declared `user_connect_wallets` + `user_connect_accounts` + `connect_wallet_ledger` as the single canonical write authority.
   - Updated `src/app/api/auth/complete-onboarding/route.js` to provision canonical role wallets and account balances for new signups while mirroring to `connect_balances` during the transitional period.
   - Updated `src/app/api/admin/connects-refund/route.js` (GET) to query canonical account and role wallet tables first, falling back to legacy tables for unmigrated profiles.
2. **Locked Hybrid Storage Architecture:**
   - Separated role-scoped monthly granted allowances (`user_connect_wallets`) from account-wide permanent balances (`user_connect_accounts`).
   - Purchased and reward Connects are stored once per user (`user_id` PK) and are spendable across all active roles of that user without duplication.
   - Thread-safe user-level advisory locking (`scoutit:wallet:<user_id>`) in `spend_connects_atomic` ensures concurrent multi-role spends never race.
3. **Exact 5-Argument Refund RPC Replacement:**
   - Dropped potential 6-argument overloads in SQL.
   - Replaced `refund_connects_system_error` using the exact 5-argument signature expected by the API (`p_user_id`, `p_amount`, `p_reason`, `p_staff_id`, `p_ref_id`).
   - Refunding credits the account-wide `purchased_balance` directly without requiring a role parameter.
   - Granted execution rights only on the exact 5-argument signature to `service_role`.
4. **`connect_wallet_ledger` CHECK Constraint Upgrade:**
   - Added an explicit `DO $$ ... ALTER TABLE public.connect_wallet_ledger DROP CONSTRAINT ... ADD CONSTRAINT ... CHECK (transaction_type IN ('grant', 'purchase', 'reward', 'spend', 'refund', 'staff_correction'))` block in the proposal so existing tables accept `'refund'` records without rollbacks.
5. **Strict Role Normalization & Backfill Fallback:**
   - Synchronized JavaScript and SQL normalizers: `buyer` -> `seeker`, canonical roles preserved, and unsupported/empty strings fail closed to `NULL`.
   - Backfill candidate resolution evaluates `primary_mode` first; falls back to legacy `role` only when `primary_mode` is missing or invalid; falls back to `active_roles`; and routes unresolvable historical rows to `held_unassigned` rather than inventing a role.
6. **Truthful Backfill Counting & Repeat Idempotency:**
   - Used `IF FOUND` checks in `backfill_legacy_connect_balances()` to count only actual database insertions.
   - Verified that rerun on already backfilled data produces `0` new inserts and counts skipped rows accurately.
7. **Complete Rollback Documentation:**
   - Provided exact SQL instructions to restore previous 5-argument `refund_connects_system_error` implementation, drop helper functions, and preserve all wallet/ledger historical data.
8. **Master Action Plan Comment Repair & Status:**
   - Repaired the broken HTML comment marker in `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN.md` (closed `HISTORICAL_SIGNIN_SIGNUP_DEFECT`).
   - Kept the Connect ledger role scope item open as `[ ] 🟡` (in progress / review).

---

## 2. Code & Migration Changes

### A. Corrected Migration Proposal
- **File:** `supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql`
- **Key Elements:**
  - `public.normalize_connect_role(p_role TEXT) RETURNS TEXT` (fail-closed, `ELSE NULL`).
  - `public.get_role_connect_allowance(p_role TEXT, p_tier TEXT) RETURNS INTEGER`.
  - `public.user_connect_wallets` (`user_id`, `role`, `granted_balance`, `granted_month`, `UNIQUE(user_id, role)`).
  - `public.user_connect_accounts` (`user_id PRIMARY KEY`, `purchased_balance`, `reward_balance`).
  - `public.connect_wallet_ledger` with upgraded `transaction_type` CHECK constraint allowing `'refund'`.
  - `public.spend_connects_atomic` implementing the 3-bucket spend priority with user-level advisory lock.
  - `public.spend_connects` wrapper alias.
  - `public.refund_connects_system_error(TEXT, INTEGER, TEXT, TEXT, TEXT)` replacing legacy RPC.
  - `public.backfill_legacy_connect_balances()` with truthful counts and unassigned hold path.

### B. JavaScript Runtime Updates
- **`src/lib/connectsWallet.js`:**
  - `SUPPORTED_CONNECT_ROLES` constant.
  - `normalizeConnectRole` returns `null` for unknown strings.
  - `resolveConnectRole` with explicit fallback.
  - Client storage engine refactored to support shared account-wide permanent pool across multiple active roles.
  - `spendConnectsServer` fails closed (`reason: 'invalid_role'`) on unrecognized roles without invoking RPC.
- **`src/lib/entitlements.js`:**
  - `normalizeRole` aligns with `normalizeConnectRole` fail-closed semantics.
  - `anonymityShieldDefaultsOn` and `canUseAnonymityShield` default safely to seeker persona when role is omitted.
- **`src/app/api/auth/complete-onboarding/route.js`:**
  - Provisions `user_connect_wallets` and `user_connect_accounts` on signup alongside `connect_balances`.
- **`src/app/api/admin/connects-refund/route.js`:**
  - GET reads canonical tables with fallback to legacy.
  - POST invokes the exact 5-argument `refund_connects_system_error`.

---

## 3. Test & Verification Evidence

| Command / Suite | Exit Code | Result | Scope / Evidence |
|---|---|---|---|
| Focused Vitest: `npx.cmd vitest run src/lib/__tests__/anonymityShield.test.js src/lib/__tests__/connectsRoleNormalization.test.js src/lib/__tests__/connectsWallet.test.js` | `0` | PASS | 3 test files passed, 43/43 tests passed (1.57s). |
| Scoped ESLint: `npx.cmd eslint src/lib/connectsWallet.js src/lib/entitlements.js src/app/api/auth/complete-onboarding/route.js src/app/api/admin/connects-refund/route.js src/lib/__tests__/connectsRoleNormalization.test.js` | `0` | PASS | 0 errors, 0 warnings across all touched JS files. |
| Full Workspace Unit Suite: `npm.cmd run test:unit` | `0` | PASS | **102 test files passed, 1093/1093 tests passed (39.53s)**. Zero regressions across the workspace. |
| Scoped Whitespace Check: `git diff --check` | `0` | PASS | 0 whitespace or formatting defects. |
| Live Supabase Check | `0` | PASS | Zero migrations applied, zero production data modified. |

---

## 4. Operational Invariant Confirmation

- **Live migration applied:** No (Proposal only)
- **Production data mutated:** No
- **Credentials accessed or modified:** No
- **Git commit / push / deployment performed:** No
- **External provider or settings changed:** No
