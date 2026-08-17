---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: devlog
report-state: ready-for-review
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-3-2026-08-14
tags: [devlog, agent-workspace, antigravity-report, correction, connects, hybrid-wallet, reconciliation, cutover, migration-proposal]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3]]", "[[CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2]]", "[[00_MASTER_ACTION_PLAN]]"]
---

# Antigravity Report — Connect Ledger Role Scope Correction 3

## Task identity

- **Task ID:** `T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-3-2026-08-14`
- **Starting state:** `ready`
- **Final state:** `ready-for-review`

---

## 1. Executive Summary of Corrections

In response to `CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2.md` and `TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3.md`, all eight required corrections have been executed and verified:

1. **3-Store Union Reconciliation without `MAX()` Masking:**
   - In `backfill_legacy_connect_balances()`, candidate users are built as a union across all three balance stores:
     `SELECT DISTINCT user_id FROM (SELECT user_id FROM connect_balances UNION SELECT user_id FROM user_connect_wallets UNION SELECT user_id FROM user_connect_accounts)`.
   - Reconciles users present in only one store, across stores, or with existing zero-balance account rows.
   - Detects differing non-zero permanent values across old role rows (`COUNT(DISTINCT purchased_balance) > 1`) and routes them to `connect_backfill_holds` with `CANONICAL_ROLE_BALANCE_CONFLICT` instead of silently collapsing them via `MAX()`.
   - Cross-store non-matching values route to `PERMANENT_BALANCE_CONFLICT`.
2. **Enforceable Unresolved Holds in All Operations:**
   - `spend_connects_atomic` fails closed immediately if `EXISTS (SELECT 1 FROM connect_backfill_holds WHERE user_id = p_user_id AND resolved = FALSE)`, without auto-creating a zero account.
   - `refund_connects_system_error` raises `WALLET_HOLD_ACTIVE` if an unresolved hold exists.
   - `GET /api/admin/connects-refund` surfaces `hasActiveHold: true` and details.
   - `POST /api/admin/connects-refund` catches `WALLET_HOLD_ACTIVE` and returns `409 Conflict`.
3. **Operationally Enforceable Staged Cutover & Runtime Capability Gate:**
   - Created [connectsSchemaGate.js](file:///c:/Users/jerze/ScoutIt/src/lib/connectsSchemaGate.js) with `isCanonicalConnectWalletActive()`, allowing deterministic, default-safe gating between pre-migration legacy tables and post-migration canonical tables.
   - [complete-onboarding/route.js](file:///c:/Users/jerze/ScoutIt/src/app/api/auth/complete-onboarding/route.js) uses the schema gate to provision canonical tables authoritatively when active, and legacy tables authoritatively when pre-migration.
   - The proposed migration [20260814000002_connect_wallets_role_scope_unification.sql](file:///c:/Users/jerze/ScoutIt/supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql) explicitly invokes `SELECT * FROM public.backfill_legacy_connect_balances();` at the end of the script.
4. **Orphan Refund Prevention (`WALLET_NOT_FOUND` / 404):**
   - `refund_connects_system_error` validates that the user exists in `user_profiles`, `user_connect_accounts`, `user_connect_wallets`, or `connect_balances` before creating any account or audit row.
   - If user does not exist, raises `WALLET_NOT_FOUND: user % does not exist`.
   - [connects-refund/route.js](file:///c:/Users/jerze/ScoutIt/src/app/api/admin/connects-refund/route.js) maps `WALLET_NOT_FOUND` to `404 Not Found`.
5. **Typed, Valid Grant Rollover:**
   - Safely parses `last_granted_reset` handling string, date, or timestamp types without calling `btrim()` on typed date objects.
   - Validates subscription tier against valid tiers (`starry`, `solar`, `cluster`, `universe`).
   - If tier is invalid or missing, routes to `connect_backfill_holds` with `INVALID_SUBSCRIPTION_TIER` instead of silently fabricating a `starry` allowance.
   - If role evidence is missing, routes to `NO_ROLE_EVIDENCE`.
   - If role wallet exists from a prior month, updates it to the current month's validated tier allowance.
6. **Dedicated Executable Rollback SQL Artifact:**
   - Created [20260814000002_connect_wallets_role_scope_unification_rollback.sql](file:///c:/Users/jerze/ScoutIt/supabase/migrations/20260814000002_connect_wallets_role_scope_unification_rollback.sql).
   - Contains 100% complete, executable function bodies for prior LR-03 `spend_connects_atomic`, `spend_connects`, prior legacy 5-argument `refund_connects_system_error`, CHECK constraint reversion, helper function drops, and post-rollback verification queries. Zero placeholder comments.
7. **Client Fail-Closed Role Normalization Across All Public Operations:**
   - In [connectsWallet.js](file:///c:/Users/jerze/ScoutIt/src/lib/connectsWallet.js):
     - `getWallet(role, tier)` fails closed on explicit invalid roles, returning `{ granted: 0, purchased: 0, earned: 0, error: "invalid_role" }` without creating storage.
     - `getBalance`, `spendConnects`, `addPurchasedConnects`, `addEarnedConnects`, and `initWalletIfEmpty` fail closed on explicit invalid roles.
     - Omitted roles (null/undefined/empty string) deliberately use the documented `"seeker"` default.
     - Legacy flat storage migration reconciles matching/equal values and preserves multi-role conflict values without blind `Math.max` distortion.
8. **Admin Truthfulness & Profile Error Handling:**
   - [connects-refund/route.js](file:///c:/Users/jerze/ScoutIt/src/app/api/admin/connects-refund/route.js) GET inspects `profileErr` and `holdErr` along with wallet errors, returning 500 immediately on failure.
   - Excludes expired prior-month grants from `primaryRoleGrantedBalance`, `primaryRoleSpendableBalance`, and `portfolioTotalBalance`.
   - Returns structured balance properties with clear semantics (`accountPermanentBalance`, `primaryRoleSpendableBalance`, `portfolioTotalBalance`, `hasActiveHold`, `activeHold`).

---

## 2. Changed Files

1. `supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql`: 3-store union reconciliation, intra-canonical conflict detection, hold enforcement in spend/refund, orphan refund validation, typed date parsing, and explicit backfill invocation.
2. `supabase/migrations/20260814000002_connect_wallets_role_scope_unification_rollback.sql`: New dedicated reviewable rollback artifact with complete executable bodies.
3. `src/lib/connectsSchemaGate.js`: New runtime schema capability gate helper.
4. `src/lib/connectsWallet.js`: Fail-closed normalization across all public methods and conflict-safe legacy storage migration.
5. `src/app/api/auth/complete-onboarding/route.js`: Gated authoritative wallet provisioning with strict error inspection.
6. `src/app/api/admin/connects-refund/route.js`: Profile error handling, hold detection, expired grant exclusion, and WALLET_NOT_FOUND 404 mapping.
7. `src/lib/__tests__/connectsRefundApi.test.js`: Updated route test suite covering active holds, expired grants, WALLET_NOT_FOUND 404, and profile errors.
8. `src/lib/__tests__/completeOnboardingApi.test.js`: Updated assertions for canonical and gated onboarding provisioning.
9. `src/lib/__tests__/connectsRoleNormalization.test.js`: Contract assertions for all public fail-closed methods, 3-store union migration, and dedicated rollback verification.
10. `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN.md`: Updated Section 1.0D item and router line 117 (`[ ] 🟡` Correction 3 ready for review).
11. `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/WORKFLOW_STATUS.md`: Updated active packet reference and status to `ready-for-review`.
12. `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3.md`: Marked `ready-for-review`.

---

## 3. Verification & Evidence

| Command / Test Suite | Exit Code | Result | Scope / Evidence |
|---|---|---|---|
| Focused Vitest Suite: `npx.cmd vitest run src/lib/__tests__/connectsRoleNormalization.test.js src/lib/__tests__/connectsWallet.test.js src/lib/__tests__/completeOnboardingApi.test.js src/lib/__tests__/connectsRefundApi.test.js src/lib/__tests__/anonymityShield.test.js` | `0` | **PASS** | 5 test files passed, 64/64 tests passed (2.12s). |
| Scoped ESLint: `npx.cmd eslint src/lib/connectsWallet.js src/lib/connectsSchemaGate.js src/lib/entitlements.js src/app/api/auth/complete-onboarding/route.js src/app/api/admin/connects-refund/route.js src/lib/__tests__/connectsRoleNormalization.test.js src/lib/__tests__/completeOnboardingApi.test.js src/lib/__tests__/connectsRefundApi.test.js` | `0` | **PASS** | 0 errors, 0 warnings across all modified JS files. |
| Full Workspace Unit Suite: `npm.cmd run test:unit` | `0` | **PASS** | **103 test files passed, 1109/1109 tests passed (44.96s)**. Zero regressions across the workspace. |
| Scoped Whitespace Check: `git diff --check` | `0` | **PASS** | 0 whitespace or formatting defects. |
| Live Supabase State | **UNTOUCHED** | **PASS** | Zero live migrations applied, zero production data modified. |

---

## 4. Invariant Confirmation & Stop Gate

- **Live migration applied:** No (Proposal only)
- **Production data mutated:** No
- **Credentials accessed or modified:** No
- **Git commit / push / deployment performed:** No
- **External provider or settings changed:** No
- **Gate:** Stopped at the live-system migration gate. The SQL migration [20260814000002_connect_wallets_role_scope_unification.sql](file:///c:/Users/jerze/ScoutIt/supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql) and rollback script [20260814000002_connect_wallets_role_scope_unification_rollback.sql](file:///c:/Users/jerze/ScoutIt/supabase/migrations/20260814000002_connect_wallets_role_scope_unification_rollback.sql) remain reviewable proposals and have **not been applied** to production.
