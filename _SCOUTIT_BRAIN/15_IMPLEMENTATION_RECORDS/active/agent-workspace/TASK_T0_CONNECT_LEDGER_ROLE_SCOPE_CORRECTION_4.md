---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: ready
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-4-2026-08-14
priority: "T0"
tags: [task, correction, antigravity, connects, migration-proposal, cutover]
updated: 2026-08-14
ai-first: true
related: ["[[CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3]]", "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3]]"]
---

# Antigravity Correction 4 - Final Connect Cutover Safety Pass

## Authority

- State: `ready`.
- Local proposal/runtime/test/workflow changes are authorized only within this packet.
- Do not query or mutate live data, apply SQL, change environment/provider settings, commit, push,
  deploy, or broaden the task.

## Required corrections

1. **Make canonical activation server-only, opt-in, and universal.** Use a server environment key
   such as `CONNECTS_CANONICAL_ACTIVE`; return true only for the exact value `true`, otherwise legacy
   mode. Apply the same gate to onboarding and admin refund GET/response semantics. Pre-migration
   legacy mode must never query absent canonical/hold tables. Document the owner action needed only
   after migration, reconciliation, and zero-unresolved-hold verification.
2. **Move rollback outside automatic migrations.** Relocate the manual rollback proposal to a
   clearly non-auto-run folder such as `supabase/rollback-proposals/`. Ensure every file under
   `supabase/migrations` has a unique valid forward version and add a test/source scan rejecting
   rollback artifacts there.
3. **Complete pairwise three-source reconciliation.** Compare every non-zero pair: legacy versus
   old canonical, legacy versus account, and old canonical versus account, independently for
   purchased and reward. Store all distinct per-role values in actionable hold data. When a conflict
   is rediscovered, set the hold unresolved again unless source correction is proven.
4. **Conserve role grants using both legacy and canonical evidence.** Preserve a current canonical
   wallet's remaining grant. If current legacy and canonical values disagree, hold rather than reset.
   A stale legacy row must not overwrite a current canonical wallet. Missing/invalid dates, missing
   tiers, and ambiguous multiple supported active roles must hold; do not `COALESCE` a missing tier
   to `starry`. Prove no first-run or rerun restores already-spent grants.
5. **Make rollback safe after canonical refunds.** Preserve refund ledger history without attempting
   to add a validated constraint that rejects existing rows. Use an evidence-backed constraint
   strategy and test a ledger containing `refund`. Keep complete prior function bodies and
   permissions in the manual artifact.
6. **Require an established wallet for refunds and return truthful fields.** A profile alone is not
   a wallet. Missing wallet/account state must raise `WALLET_NOT_FOUND` and create nothing. Define
   whether the RPC/route result is account permanent balance, primary-role spendable, or portfolio
   total; label it accordingly and never assign portfolio total to `accountPermanentBalance`.
7. **Support multiple holds and active roles.** Admin GET must return an array of unresolved holds
   without `maybeSingle()` failure. Filter portfolio grants using normalized `active_roles`, or label
   non-active current wallets separately. Keep expired grants excluded.
8. **Preserve client conflicts without choosing `Math.max`.** Equal/one-sided legacy values may
   consolidate. Multiple distinct values must remain in a versioned non-spendable conflict payload
   until explicitly resolved; public wallet methods must not expose them as account balance.

## Required tests

- Gate unset/false/true; unset defaults legacy. Both onboarding and admin GET avoid canonical tables
  when legacy is active and use canonical tables only when explicitly enabled.
- Migration-directory scan proves unique forward versions and no rollback file; manual rollback is
  found only in the non-auto-run folder.
- Pairwise account-vs-old-canonical conflict with legacy zero, plus all prior three-source cases and
  full distinct-value hold evidence.
- Current canonical grant with stale/missing legacy evidence remains unchanged; conflicting current
  values, missing tier, invalid date, and ambiguous roles hold; rerun conserves balance.
- Rollback reasoning/structural test includes an existing refund ledger row and cannot fail its
  restored constraint.
- Profile-only refund returns 404/WALLET_NOT_FOUND and creates no account or ledger; returned balance
  field semantics are exact.
- Multiple unresolved holds return successfully as an array; inactive/expired grants are excluded or
  distinctly labeled.
- Legacy localStorage equal, one-sided, and conflict cases prove conflicts are preserved but not
  spendable; no `Math.max` conflict selection remains.
- Run focused tests, scoped ESLint, full unit suite, scoped `git diff --check`, and source scans.

## Deliverables

- Corrected forward proposal, manual rollback artifact outside migrations, runtime gates, and tests.
- Updated task state, `WORKFLOW_STATUS.md`, and open Master Action Plan note.
- `ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4.md` with exact evidence and explicit
  confirmation that no live action occurred.

## Stop conditions

Stop with `owner-action-required` if exact live schema/data evidence is necessary and unavailable
without an authorized read-only check. Do not guess or activate canonical mode. Never apply, change
environment settings, deploy, commit, or push.
