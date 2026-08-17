---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: review
review-state: changes-requested
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-1-2026-08-14
tags: [review, changes-requested, connects, migration, cutover, data-reconciliation]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1]]", "[[ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1]]", "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2]]"]
---

# Codex Review - Connect Ledger Role Scope Correction 1

## Verdict

`changes-requested`. Correction 1 fixes the five-argument refund signature, ledger CHECK upgrade,
role normalizer, account-level permanent-balance table, and Master Action Plan comment marker. It
still does not provide a safe single-authority cutover or lossless reconciliation, so the migration
must remain unapplied.

## Findings

### P1 - Onboarding ignores canonical write failures

`complete-onboarding/route.js` awaits two Supabase upserts but discards both `{ error }` results.
Supabase query failures normally resolve rather than throw. The route then treats thrown failures as
non-fatal and can mark onboarding complete after only the legacy `connect_balances` write succeeds.
This directly contradicts the claimed canonical write authority.

Evidence: `src/app/api/auth/complete-onboarding/route.js` lines 107-150.

### P1 - The admin read path is legacy-first, contrary to the report

The GET route queries `connect_balances` and `connect_transactions` first. It queries canonical
tables only when the legacy balance is missing. During the proposed transition, onboarding creates
a legacy row for every user, so staff will normally see the legacy mirror even when canonical state
has diverged. The report's "canonical first with legacy fallback" statement is factually incorrect.

Evidence: `src/app/api/admin/connects-refund/route.js` lines 46-103.

### P1 - Existing canonical permanent balances are stranded

The earlier LR-03 migration already stores `purchased_balance` and `reward_balance` on
`user_connect_wallets`. Correction 1 creates `user_connect_accounts` and backfills it only from
legacy `connect_balances`. It neither migrates nor reconciles the existing canonical columns, while
the replacement spend function stops reading them. Any balance present only there becomes
unspendable. If both old stores mirror the same value, blindly combining them would duplicate value;
conflicts therefore require a preflight and explicit hold path.

Evidence: `20260802000003_connects_wallet_and_tiers.sql` lines 4-14 and proposed migration lines
499-515.

### P1 - Backfill can revive expired grants and does not create an actionable hold

The backfill copies legacy `granted_balance` into the current month regardless of
`last_granted_reset`, and substitutes `1` when the legacy value is null. That can revive a stale
prior-month allowance or fabricate value. Rows without role evidence only increment a counter; no
user ID and reason are retained or returned for reconciliation.

Evidence: proposed migration lines 470-568, especially 492, 540-553.

### P1 - Rollback is not complete

The rollback comment restores only the old refund body and drops helpers. It does not restore the
prior `spend_connects_atomic`/`spend_connects` bodies, previous CHECK constraint, policies, or route
read/write behavior. It therefore cannot reverse the functional cutover it claims to cover.

Evidence: proposed migration lines 51-77 versus definitions beginning at lines 169 and 201.

### P2 - Client wallet migration and initialization can lose state

Legacy flat localStorage wallets collapse per-role permanent balances using `Math.max`, which is
safe only if the old values were duplicated mirrors; it loses value if they were independently
earned. Unknown role keys are retained by using the original key as the normalizer fallback. Also,
`addPurchasedConnects` and `addEarnedConnects` read state before `getWallet` creates the role, then
write the stale earlier state, erasing that newly created role entry. Existing tests initialize the
role first and miss this path.

Evidence: `src/lib/connectsWallet.js` lines 65-100 and 212-230.

### P2 - Passing tests do not exercise the new route behavior

The focused suite passes, but `completeOnboardingApi.test.js` has no canonical-table mocks. Those
lookups throw and are swallowed by the route, so the success test accidentally proves the defect.
There is no admin refund route test. Most migration checks assert text presence and cannot prove
executable backfill, rerun, constraint, or rollback behavior.

### P2 - Balance-total semantics are ambiguous

The refund function and admin GET sum monthly grants across every role plus the account pool. A user
cannot spend another role's grant from the active role, so that portfolio sum is not the active
role's spendable balance. The response must name and test either account permanent total,
role-specific spendable total, or an explicitly documented portfolio total.

## Independent verification

- Focused tests: PASS - 3 files, 36/36 tests.
- Scoped `git diff --check`: PASS.
- Master Action Plan historical comment marker is repaired and the Connect item remains open.
- No live migration or production data mutation was performed.

## Required outcome

Execute `TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2.md`. Do not apply SQL, mark the item complete,
or claim a canonical cutover until reconciliation, failure behavior, route read order, rollback, and
behavioral tests pass independent review.
