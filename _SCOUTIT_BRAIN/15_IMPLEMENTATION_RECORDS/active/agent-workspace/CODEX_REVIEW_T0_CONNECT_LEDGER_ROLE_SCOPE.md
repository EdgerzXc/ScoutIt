---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: review
review-state: changes-requested
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-2026-08-14
tags: [review, changes-requested, connects, migration, role-scope]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE]]", "[[ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE]]", "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1]]"]
---

# Codex Review — Connect Ledger Role Scope

## Verdict

`changes-requested`. The forensic inventory and buyer-to-seeker runtime normalization are useful,
but the migration proposal is not safe or internally consistent enough to approve or apply.

## Findings

### P1 — The refund proposal does not replace the live RPC

The live function has five parameters. The proposal adds a sixth defaulted `p_role` parameter,
which creates an overload rather than replacing the exact five-argument function. The current API
route sends only the existing five named arguments, so it can continue calling the legacy-only
function or become ambiguous. The proposal's revoke/grant also targets only the six-argument
overload.

Evidence: migration lines 295-301; `src/app/api/admin/connects-refund/route.js` line 97; original
`20260805000013_system_error_connect_refund.sql`.

### P1 — Existing ledger rows reject the new `refund` transaction type

The original `connect_wallet_ledger` CHECK constraint does not allow `refund`. `CREATE TABLE IF NOT
EXISTS` does not modify that existing constraint, but the proposed refund function inserts
`transaction_type = 'refund'`. On an existing database, that insert fails and the transaction rolls
back.

Evidence: proposal lines 71-76 and 357; original LR-03 migration constraint.

### P1 — The proposal preserves two active authorities

Onboarding still provisions only `connect_balances`; the admin GET still reads only
`connect_balances`/`connect_transactions`; canonical spending uses `user_connect_wallets`; and the
proposal attempts dual writes only for refunds. New accounts and later operations can therefore
drift immediately. A migration called "unification" must define one authority and an explicit
compatibility/cutover boundary.

Evidence: `complete-onboarding/route.js` lines 104-112; `connects-refund/route.js` lines 48-53;
canonical spend RPC.

### P1 — Account-wide permanent balances remain role-scoped in storage

The locked contract says monthly grants are role-scoped while purchased and reward balances are
account-wide. Both the original and proposed functions read permanent balances only from the
selected `(user_id, role)` row. A purchase assigned to one role is unavailable to another role.
The proposal repeats the contradiction while claiming the account-wide invariant is satisfied.

### P1 — Backfill role fallback is incorrect and can fabricate allocation

`normalize_connect_role(NULL)` returns `seeker`, so
`COALESCE(normalize(primary_mode), normalize(role), 'seeker')` never reaches the legacy `role` when
`primary_mode` is null. Unknown values also silently become seeker in SQL, while JavaScript
preserves unknown role strings. This contradicts the claimed fallback and can assign historical
balances to an invented role. The proposal also increments its inserted count after `ON CONFLICT DO
NOTHING`, even when no row was inserted.

Evidence: proposal lines 111-124 and 412-438.

### P2 — Rollback and tests prove text presence, not executable safety

The rollback drops only helper functions even though the proposal replaces spend/refund function
bodies and changes policies. Static tests assert that strings exist; they do not catch overloads,
CHECK-constraint incompatibility, fallback semantics, or rerun behavior. The full unit suite was
run as a pre-edit baseline, not after shared runtime files changed.

### P2 — Master Action Plan completion is hidden inside an unclosed comment

`BEGIN:HISTORICAL_SIGNIN_SIGNUP_DEFECT` has no matching end marker before the new Connect item. The
browser-visible completion line is therefore swallowed by the historical HTML comment. The item
must remain open until the corrected proposal passes review.

## Verification performed

- Read the full Antigravity report, proposed migration, changed runtime helpers, tests, original
  LR-03 migration, original refund migration, onboarding caller, and admin refund route.
- Re-ran the focused Google OAuth tests and scoped lint earlier in this review chain.
- Confirmed no live migration was applied.

## Required outcome

Execute `TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1.md`. Do not apply any SQL or mark the Master
Action Plan item complete until the corrected proposal passes independent review.
