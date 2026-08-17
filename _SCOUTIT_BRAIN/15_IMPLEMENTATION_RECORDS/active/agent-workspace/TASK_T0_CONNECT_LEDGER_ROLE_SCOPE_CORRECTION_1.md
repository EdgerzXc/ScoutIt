---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: ready-for-review
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-1-2026-08-14
priority: "T0"
tags: [task, correction, antigravity, connects, migration-proposal]
updated: 2026-08-14
ai-first: true
related: ["[[CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE]]", "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE]]"]
---

# Antigravity Correction 1 — Connect Ledger Role Scope

## Authority

- State: `ready-for-review`
- Local code/proposal/test/document correction is authorized only within this packet.
- Live database reads beyond already available read-only metadata, migration application, data
  mutation, credentials, commit, push, deployment, DNS, or provider settings are not authorized.

## Required corrections

1. **Establish one wallet authority.** The corrected design must make the role-scoped canonical
   wallet/ledger the write authority and explicitly define what happens to legacy onboarding,
   admin reads, refunds, and Mission Control consumers. Do not leave ordinary operations split
   across two authorities with refund-only dual sync.
2. **Honor the locked hybrid contract.** Monthly granted balance is per role. Purchased and reward
   balances are account-wide and must be spendable from every active role without duplication.
   Use an explicit account-level storage design or prove an equally safe alternative; do not merely
   label role-row columns "account-wide."
3. **Replace, do not overload, the refund RPC.** Preserve the exact five-argument signature used by
   the API unless the scoped callers and tests are deliberately migrated together. Drop obsolete
   overloads explicitly in the proposal and prove grants target the callable signature.
4. **Reconcile the ledger constraint.** The migration must safely update or reuse the existing
   transaction-type contract before inserting a refund type. `CREATE TABLE IF NOT EXISTS` is not a
   schema migration for an existing CHECK constraint.
5. **Fix role normalization/backfill.** JavaScript and SQL must share the same supported-role
   semantics. `primary_mode` may fall back to legacy `role` only when genuinely absent or invalid;
   never let a normalizer's default make the fallback unreachable. Do not fabricate a historical
   allocation where evidence is absent—route such rows to an explicit preflight/hold result.
6. **Make backfill counts truthful.** Count only rows actually inserted and prove repeat execution
   is a no-op.
7. **Provide real rollback.** Record how each replaced function, policy, constraint, and compatibility
   caller returns to its prior definition without dropping wallet history.
8. **Repair the Master Action Plan comment marker** and keep the Connect item open as
   `changes-requested` until Codex accepts the corrected proposal.

## Required tests

- Exact refund RPC signature and no ambiguous/defaulted overload.
- Existing-table CHECK constraint upgrade and accepted refund ledger insert.
- Buyer→seeker plus every supported role; unknown/unsupported roles fail closed or enter an
  explicit hold path consistently in JavaScript and SQL.
- `primary_mode` absent with valid legacy `role` uses that role.
- Ambiguous/no-evidence historical role is not silently assigned.
- Account-wide purchased/reward spend across two roles without duplication.
- Backfill first run and second idempotent run with truthful counts.
- New-user onboarding/canonical-wallet authority and admin refund/read behavior are consistent.
- Focused tests, scoped ESLint, post-edit full unit suite, scoped `git diff --check`, and source scans.

Static `toContain` checks alone are insufficient. Use executable tests where locally possible and
precise structural assertions for SQL that cannot be run locally.

## Deliverables

- Corrected migration proposal or an evidence-backed conclusion that a different staged migration
  set is required.
- Any smallest necessary scoped runtime/test changes.
- Corrected Master Action Plan markup/state.
- `ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_1.md` with exact commands/results.

## Stop conditions

Stop and report `owner-action-required` if the locked account-wide balance contract cannot be
implemented without a new product decision. Stop if live data shape is required to choose a safe
backfill and cannot be established read-only. Never guess, apply, deploy, commit, or push.
