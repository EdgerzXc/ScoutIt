---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: ready-for-review
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-3-2026-08-14
priority: "T0"
tags: [task, correction, antigravity, connects, migration-proposal, reconciliation]
updated: 2026-08-14
ai-first: true
related: ["[[CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2]]", "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2]]"]
---

# Antigravity Correction 3 - Enforceable Connect Cutover

## Authority

- State: `ready-for-review`.
- Local proposal/runtime/test/workflow changes are authorized only within this packet.
- Do not query or mutate live data, apply SQL, change credentials/providers, commit, push, deploy,
  or broaden the task.

## Required corrections

1. **Reconcile a union of all three permanent-balance stores.** Build candidates from legacy
   `connect_balances`, every old `user_connect_wallets` row, and existing `user_connect_accounts`,
   including users absent from either other source. Treat an existing zero account row as data to
   reconcile, not an automatic skip. Distinguish equal mirrors, one-sided values, conflicting
   source values, and differing non-zero values across old role rows. Never hide conflicts with
   `MAX()`.
2. **Make unresolved holds enforceable.** `spend_connects_atomic`, refund, and relevant admin output
   must fail closed when a user has an unresolved balance hold. They must not auto-create a zero
   account that bypasses the hold. Define and test the safe behavior after a hold is explicitly
   resolved.
3. **Make the cutover sequence operationally enforceable.** Because the live migration is not yet
   applied, add an explicit default-safe runtime feature/schema gate or an equivalent deterministic
   mechanism. Provide ordered artifacts for: schema/functions, reconciliation execution, hold and
   conservation verification, canonical runtime activation, and later legacy retirement. Correct
   the report: merely defining the procedure does not run it.
4. **Prevent orphan refunds.** Refund only an existing, eligible ScoutIt user with an established
   wallet/account under the active authority. A missing or mistyped user ID must produce
   `WALLET_NOT_FOUND` without inserting an account or ledger row. Preserve the exact five-argument
   RPC contract and test the route's 404 mapping.
5. **Reconcile grants with typed, valid evidence.** Confirm or safely cast the actual
   `last_granted_reset` type. Missing/invalid dates, unknown tiers, ambiguous multiple roles, and
   conflicting existing role-wallet state must hold rather than fabricate a current allowance.
   Current and stale cases must account for existing canonical role rows, not simply skip them.
6. **Supply executable rollback.** Put complete reviewable rollback SQL in a dedicated non-auto-run
   rollback artifact. Include exact prior spend/refund/wrapper bodies, CHECK constraint,
   policies/permissions, feature-gate reversal, safe order, and verification queries. No placeholder
   comments may stand in for executable bodies.
7. **Finish client fail-closed migration.** Omitted roles may use the documented seeker default;
   explicit unsupported roles must fail without creating or spending a seeker wallet. For legacy
   flat localStorage, consolidate permanent balances only when one-sided or demonstrably equal;
   otherwise preserve a versioned conflict/hold payload without spending it. Remove the ambiguous
   `Math.max` rule.
8. **Make admin semantics current and truthful.** Handle `profileErr`; normalize the primary role
   with the shared role contract; exclude or clearly label expired and inactive grants. Do not call
   a stored prior-month portfolio sum currently spendable. Name the refund POST balance result with
   the same documented semantics.

## Required tests

- Reconciliation candidate coverage: legacy-only, old-canonical-only, account-only, zero-account
  plus legacy value, equal three-way mirror, cross-source conflict, and differing old role rows.
- Unresolved hold blocks spend/refund/account auto-creation; resolved hold follows the documented
  path.
- Reconciliation is explicitly executed in the staged artifact and rerun is idempotent with balance
  conservation evidence.
- Missing refund user returns `WALLET_NOT_FOUND`/404 and creates nothing.
- Typed date cases, missing/invalid reset, invalid tier, ambiguous roles, existing stale/current
  wallet, and no fabricated allowance.
- Explicit invalid roles fail in every client wallet public operation; omitted-role compatibility
  remains deliberate. Legacy equal/one-sided/conflicting localStorage cases preserve value.
- Admin profile error, buyer normalization, expired/inactive grants, canonical-first/fallback, and
  precisely named refund balance response.
- Tests must exercise production helpers or a disposable SQL runtime where available. Do not claim a
  test-local imitation proves SQL. Strengthen structural checks so they reject an uncalled backfill
  and placeholder rollback.
- Run focused tests, scoped ESLint, full unit suite, scoped `git diff --check`, and source scans.

## Deliverables

- Corrected staged migration proposal/artifacts and dedicated rollback SQL.
- Smallest necessary runtime and behavioral test changes.
- Updated task state, `WORKFLOW_STATUS.md`, and open Master Action Plan note.
- `ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3.md` with exact evidence and explicit
  confirmation that no live action occurred.

## Stop conditions

Stop with `owner-action-required` if exact live column types or real balance relationships are needed
and cannot be established without an authorized read-only schema/data check. Do not guess a source,
balance, tier, role, or cutover state. Never apply, deploy, commit, or push.
