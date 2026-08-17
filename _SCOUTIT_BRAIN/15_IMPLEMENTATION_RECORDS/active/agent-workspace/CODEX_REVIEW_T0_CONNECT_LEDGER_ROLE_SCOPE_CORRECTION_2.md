---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: review
review-state: changes-requested
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-2-2026-08-14
tags: [review, changes-requested, connects, migration, reconciliation, rollback]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2]]", "[[ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2]]", "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3]]"]
---

# Codex Review - Connect Ledger Role Scope Correction 2

## Verdict

`changes-requested`. Correction 2 correctly checks canonical onboarding errors, makes the admin GET
canonical-first, adds route tests, fixes the empty-storage write bug, and introduces durable holds.
The proposal still cannot safely reconcile or cut over production balances, so it must remain
unapplied.

## Findings

### P1 - Reconciliation does not cover all users or all three stores

`backfill_legacy_connect_balances()` iterates only `connect_balances`. A user present only in the old
canonical `user_connect_wallets` table is never visited, despite the report claiming the
old-canonical-only case is covered. If `user_connect_accounts` already contains any row, including a
zero row created by onboarding or a partial rollout, the procedure skips permanent reconciliation
without comparing it to either older source. Existing account values are therefore not treated as a
third authority candidate.

The procedure also takes `MAX()` across old role rows. Different non-zero permanent values on two
role rows are silently collapsed instead of being identified as an intra-canonical conflict.

Evidence: proposed migration lines 543-592.

### P1 - Holds do not prevent balance loss or bypass

When permanent values conflict, the procedure writes a hold but no canonical account. The spend RPC
then auto-creates an empty `user_connect_accounts` row and proceeds; the refund RPC also creates an
account when none exists. Neither function checks unresolved holds. A held user can therefore bypass
the reconciliation gate and strand the historical permanent balance.

Evidence: proposed migration lines 309-318, 438-453, and 560-575.

### P1 - The stated cutover is not executable

The migration defines `backfill_legacy_connect_balances()` but never invokes it. The report says
Phase 1 "runs lossless reconciliation," which is not true. Runtime code now requires
`user_connect_accounts`, yet there is no explicit pre-migration runtime feature/schema gate. A code
deployment before the owner-gated migration would make onboarding and canonical admin reads fail.
Conversely, switching runtime before reconciliation/hold verification can expose empty canonical
state. The repository needs an enforceable staged order, not only prose.

### P1 - Rollback is still a placeholder

The rollback says to restore the LR-03 spend functions but replaces the body with a comment. It does
not provide the prior wrapper body, prior CHECK restoration, policy/permission restoration, runtime
feature-gate reversal, or post-rollback behavioral checks. This is not executable rollback SQL.

Evidence: proposed migration lines 57-94.

### P1 - Refund can create money for an unknown user

`refund_connects_system_error` inserts a new canonical account whenever none exists. The API accepts
any non-empty text user ID, and the ledger has no user foreign key. A staff typo can create an orphan
account and refund entry instead of returning `WALLET_NOT_FOUND`. The route already contains a 404
mapping that the new function can no longer reach for this condition.

Evidence: proposed migration lines 438-453 and `connects-refund/route.js` POST validation/error
mapping.

### P2 - Grant reconciliation still fabricates evidence and may be type-unsafe

The recorded legacy schema describes `last_granted_reset` as text/date, but SQL calls `btrim()` and
`to_date()` without an explicit cast; a date-typed column is not safely handled by `btrim(date)`. A
missing or invalid reset is treated as expired, and a null/unknown subscription tier is silently
converted to `starry` rather than held. Existing role-wallet rows are skipped without reconciling
their month/value. These behaviors do not satisfy the valid-date/valid-tier evidence rule.

Evidence: proposed migration lines 632-670.

### P2 - Client fail-closed and legacy migration requirements remain unmet

Server spending fails closed, but `getWallet`, `spendConnects`, `addPurchasedConnects`, and
`addEarnedConnects` still resolve an explicit invalid role to `seeker`. The legacy flat-wallet
migration still uses `Math.max` across role balances without proving they are mirrors or retaining a
conflict hold. Adding `version: 2` does not resolve the ambiguous values.

Evidence: `src/lib/connectsWallet.js` lines 100-126 and 160-257.

### P2 - Admin canonical display ignores one query error and stale role months

The route requests the profile but does not include `profileErr` in its error check. On profile
failure it silently defaults the primary role to seeker. It also counts every stored grant without
checking `granted_month` or active roles, so `primaryRoleSpendableBalance` and
`portfolioTotalBalance` can include expired/inactive grants.

Evidence: `src/app/api/admin/connects-refund/route.js` lines 46-104.

### P2 - Reconciliation tests do not execute production reconciliation

The seven "executable" fixtures call a JavaScript function declared inside the test file. Production
does not call that function, and its old-canonical-only case passes even though the SQL loop cannot
visit such a user. Static string checks also accept the rollback placeholder. The tests therefore
overstate SQL and rollback coverage.

## Independent verification

- Focused Connect/onboarding/refund/anonymity suite: PASS - 5 files, 64/64 tests.
- Scoped ESLint: PASS - zero reported findings.
- No live migration or production data mutation was performed.

## Required outcome

Execute `TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3.md`. Keep the Master Action Plan item open and
do not apply the proposal until three-source reconciliation, unresolved-hold enforcement, staged
runtime gating, refund identity validation, and executable rollback pass review.
