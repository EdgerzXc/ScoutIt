---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: ready-for-review
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-2-2026-08-14
priority: "T0"
tags: [task, correction, antigravity, connects, migration-proposal, cutover]
updated: 2026-08-14
ai-first: true
related: ["[[CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1]]", "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1]]"]
---

# Antigravity Correction 2 - Connect Ledger Cutover and Reconciliation

## Authority

- State: `ready-for-review`.
- Local code, migration proposal, tests, and workflow-document correction are authorized only within
  this packet.
- Do not apply migrations, query or mutate live data, change credentials/providers, commit, push,
  deploy, or broaden the task.

## Required corrections

1. **Make canonical onboarding authoritative.** Inspect Supabase `{ data, error }` results. After the
   migration/cutover gate, any canonical wallet/account failure must prevent the completion marker.
   Do not use a blanket non-fatal catch. If pre-migration compatibility is necessary, implement and
   document an explicit feature/schema gate with deterministic behavior; do not infer availability
   from swallowed errors.
2. **Make admin reads canonical-first.** Read canonical account, role wallets, and canonical ledger
   first. Use legacy only when canonical state is genuinely absent under the documented transition.
   Surface canonical query errors rather than silently displaying stale legacy data.
3. **Provide a staged single-authority cutover.** Document migration/reconciliation, verification,
   code switch, compatibility mirror, and retirement order. Ordinary writes must have one authority.
   Any temporary legacy mirror must be derived atomically from canonical state or be explicitly
   non-authoritative; onboarding must not perform independent best-effort dual writes.
4. **Reconcile every permanent-balance source without loss or duplication.** Preflight and migrate
   the existing `user_connect_wallets.purchased_balance`/`reward_balance` columns as well as legacy
   `connect_balances`. Define equality, one-sided, and conflicting-source cases. Never sum mirrored
   duplicates. Put conflicts into an actionable hold result with `user_id`, source values, and
   machine-readable reason. Do not drop/deprecate old columns until verified reconciliation is
   complete.
5. **Handle monthly grants using date and tier evidence.** Do not assign the current month to a
   legacy grant without checking `last_granted_reset`. Do not fabricate `1` with `COALESCE`. Either
   preserve a provably current grant, reset from the user's valid current tier/role, or hold the row
   with a reason.
6. **Make every hold actionable and rerunnable.** Provide a durable hold table or a reviewable
   preflight/result set that identifies affected user IDs and reasons. Prove first-run and second-run
   behavior and show that unresolved holds are neither allocated nor lost.
7. **Provide functional rollback.** Restore the prior spend wrappers, refund function, constraint,
   policies/permissions, route feature gate/read order, and legacy operational path without deleting
   canonical history. Include the safe rollback order and post-rollback verification queries.
8. **Fix the local wallet defects.** Initialize/update role and account state in one coherent state
   object. Add direct tests for purchased/earned additions without a prior `getWallet`. Replace the
   ambiguous flat-wallet `Math.max` conversion with a versioned, evidence-backed rule or an explicit
   non-destructive hold/compatibility path. Unknown role keys must not become active canonical roles.
9. **Define returned balance semantics.** Name and test whether admin/refund results are an active
   role spendable balance, account permanent balance, or portfolio summary. Do not label a sum of
   mutually role-scoped grants as a single spendable balance.
10. **Correct documentation claims.** The report must match actual route order and failure behavior.
    Keep the Master Action Plan item open until Codex accepts the proposal.

## Required behavioral tests

- Onboarding canonical wallet error and canonical account error each prevent completion after the
  cutover gate; the intended pre-migration gate path is also tested if retained.
- Admin GET uses canonical data when both canonical and legacy rows exist, falls back only when the
  documented absence condition is met, and fails safely on canonical query errors.
- Admin POST calls the exact five-argument RPC and maps its result/error behavior.
- Direct `addPurchasedConnects`/`addEarnedConnects` on empty storage preserves the created role and
  account balance; unknown explicit roles fail closed.
- Reconciliation fixtures cover old-canonical-only, legacy-only, equal mirrored values, conflicting
  values, stale grants, missing role evidence, first run, and rerun.
- Precise structural SQL assertions cover staged cutover and full rollback. If a disposable local
  Postgres/Supabase runtime is already available, execute the migration tests there; do not install,
  start, or connect to live infrastructure without authorization.
- Run focused tests, scoped ESLint, post-edit full unit suite, scoped `git diff --check`, and source
  scans. Report exact commands and results.

## Deliverables

- Corrected migration proposal (or a safely ordered proposal set if staging requires more than one).
- Smallest necessary scoped runtime and test changes.
- Updated `WORKFLOW_STATUS.md`, task state, and open Master Action Plan note.
- `ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_2.md` with changed files, evidence,
  remaining risks, and explicit confirmation that no live change was made.

## Stop conditions

Stop with `owner-action-required` if a safe conflict rule requires actual live balance evidence or a
new product decision. Do not guess, silently choose a balance source, apply SQL, deploy, commit, or
push.
