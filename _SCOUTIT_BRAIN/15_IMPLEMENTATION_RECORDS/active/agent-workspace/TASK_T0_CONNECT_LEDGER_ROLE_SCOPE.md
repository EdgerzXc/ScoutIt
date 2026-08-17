---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: ready-for-review
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-2026-08-14
priority: "T0"
tags: [task, antigravity, connects, role-scope, migration-proposal]
updated: 2026-08-14
ai-first: true
related: ["[[WORKFLOW_STATUS]]", "[[00_MASTER_ACTION_PLAN]]", "[[DATA_DICTIONARY]]"]
---

# Antigravity Task — Connect Ledger Role Scope

## Authority

- State: `ready-for-review`
- Local audit, focused tests, a reviewable migration proposal, and surgical documentation: authorized
- Live Supabase changes, migration application, credentials, commit, push, deployment, DNS, or provider changes: not authorized

## Outcome

Determine whether legacy `connect_balances` and `connect_transactions` still require role scoping
alongside the role-scoped `user_connect_wallets` and `connect_ledger_events`. Prepare the smallest
safe migration proposal only if runtime evidence proves it is needed. Do not apply it.

## Required reading

1. Repository `AGENTS.md`
2. `_SCOUTIT_BRAIN/00_START_HERE.md`, `00_SOP.md`, and `00_MASTER_SYNC.md`
3. Master Action Plan section 1.0D
4. `DATA_DICTIONARY.md`
5. Relevant installed Next.js documentation if runtime JavaScript changes
6. All Connect-related migrations, RPCs, API routes, runtime callers, and tests found by search

Run `git status --short` before editing and preserve every unrelated change.

## Included

- Map every reference to `connect_balances`, `connect_transactions`, `user_connect_wallets`, and `connect_ledger_events`.
- Establish which tables are canonical, which remain active, and whether the backlog item is stale, partially true, or fully true.
- Document the backfill and buyer-versus-seeker normalization contract without fabricating historical roles.
- If justified, create one additive, idempotent migration proposal with preflight, rollback notes, and focused static/SQL contract tests.
- Reconcile the Master Action Plan item only after evidence supports the conclusion.
- Create `ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE.md` with exact evidence.

## Excluded

- Applying a migration or mutating production
- Changing Connect allowances, refund policy, tier policy, UI, or the locked hybrid-wallet spend order
- Unrelated cleanup, commit, push, deployment, credential access, or external changes

## Invariants

- Monthly Connect allowances are role-scoped.
- Purchased and reward balances follow the locked hybrid-wallet contract.
- Historical audit rows must not be deleted or assigned a guessed role.
- Buyer/seeker normalization must follow existing runtime behavior.
- Migration history is drift-sensitive; a proposal is not permission to apply.

## Acceptance criteria

- [x] Every legacy and canonical Connect table, RPC, and caller is mapped with evidence.
- [x] The conclusion is explicit: stale item, documentation-only correction, or migration required.
- [x] Any proposal is additive, idempotent, history-preserving, and includes preflight/backfill/rollback notes.
- [x] Focused tests prove the selected role-normalization contract without live mutation.
- [x] The relevant Master Action Plan item is reconciled only if supported by evidence.
- [x] No live/external or unrelated change occurs.

## Verification

- Focused Connect wallet/migration contract tests
- ESLint for every changed JavaScript file
- Scoped `git diff --check` and scoped diff review
- Full unit suite only if shared runtime behavior changes
- Exact confirmation that no migration was applied

## Stop conditions

Stop and report instead of guessing if live schema access is required but unavailable, historical
rows cannot be mapped without an owner rule, runtime callers contradict the locked wallet contract,
or the smallest correct solution would broaden this task.
