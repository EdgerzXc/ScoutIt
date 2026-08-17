---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: review
review-state: changes-requested
task-id: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-3-2026-08-14
tags: [review, changes-requested, connects, migration, feature-gate, rollback]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3]]", "[[ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3]]", "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4]]"]
---

# Codex Review - Connect Ledger Role Scope Correction 3

## Verdict

`changes-requested`. Correction 3 adds useful union candidate coverage, hold checks, a runtime gate,
orphan checks, and an executable rollback body. Several implementation details contradict the
claimed safety properties and can still break pre-migration production or alter balances.

## Findings

### P1 - The default-safe gate defaults to canonical ON

`isCanonicalConnectWalletActive()` returns true unless the public environment variable is exactly
`false`. The migration is explicitly unapplied, so deploying this code without a new variable would
immediately query/write `user_connect_accounts` and `connect_backfill_holds`. A safe cutover gate
must be server-only and opt-in: canonical mode only when the value is exactly `true`.

The admin refund route does not use the gate at all. Its GET always queries new canonical and hold
tables, so pre-migration mode still fails even if onboarding is forced to legacy.

Evidence: `src/lib/connectsSchemaGate.js` lines 9-20; `connects-refund/route.js` lines 43-90.

### P1 - The manual rollback is placed in the automatic migration directory

`20260814000002_connect_wallets_role_scope_unification_rollback.sql` is under
`supabase/migrations` and reuses the forward migration timestamp. A comment saying "do not run" does
not change migration discovery. This can create a duplicate version error or cause tooling to treat
the rollback as another tracked migration. A manual rollback artifact must live outside the
automatic migration directory and must have a source-scan test enforcing that boundary.

### P1 - Three-way conflict detection still misses one pair

The conflict expression compares legacy-to-old-canonical and account-to-legacy, but never directly
compares account-to-old-canonical. For legacy `0`, old canonical `5`, and account `10`, no conflict
is recorded and `GREATEST()` silently chooses `10`. The hold also records only maxima, not the full
distinct role-row values needed to resolve an intra-canonical conflict.

Evidence: proposed migration lines 558-608.

### P1 - Current canonical grants can be reset and spent value restored

Grant reconciliation derives reset evidence only from the legacy row. For an old-canonical-only
user, or when legacy is stale but the canonical role wallet is already current, the procedure
calculates a fresh full allowance and overwrites the existing current-month balance. That can restore
Connects already spent. It must preserve a verified current canonical wallet or hold conflicting
current evidence.

The same block still maps a missing tier to `starry` via `COALESCE`, contrary to the report, and
chooses the first supported `active_roles` entry when multiple roles make the legacy grant
allocation ambiguous.

Evidence: proposed migration lines 627-701, especially 637-645 and 688-701.

### P1 - Rollback CHECK restoration fails after a real refund

The rollback preserves ledger history but attempts to add a validated CHECK that excludes
`refund`. Once any canonical refund row exists, adding that constraint fails. The rollback must
either retain the expanded historical CHECK or use an explicitly safe constraint strategy that
allows existing refund history while preventing incompatible future writes.

Evidence: rollback lines 230-240.

### P2 - The refund validation and result semantics remain inaccurate

The refund RPC treats a profile alone as sufficient wallet existence, then creates a new account.
The task required an established wallet/account, so a profile with no wallet should still return
`WALLET_NOT_FOUND`. The RPC returns all role grants plus permanent balance as `total_balance`, while
the route labels that same number `accountPermanentBalance`. Those values are not equivalent.

Evidence: forward migration lines 415-455; refund route lines 240-249.

### P2 - Admin hold and portfolio handling are incomplete

The hold table permits multiple unresolved reasons per user, but GET uses `maybeSingle()`. A user
with both a permanent conflict and invalid-tier/no-role hold can produce a multiple-row error rather
than a useful review response. Portfolio calculation includes every current-month wallet even when
the role is no longer active, despite the Correction 3 requirement to exclude or label inactive
grants.

Evidence: refund route lines 73-78 and 108-112.

### P2 - Client conflict migration still uses `Math.max`

When legacy flat storage has multiple distinct permanent values, the code still picks
`Math.max(...)` and stores it as spendable. No conflict payload is retained. This directly
contradicts the report and can discard the other values without evidence.

Evidence: `src/lib/connectsWallet.js` lines 104-151.

### P2 - Tests omit the failure modes above

There is no direct schema-gate test, no pre-migration admin route test, no multiple-hold test, and no
account-vs-old-canonical conflict fixture. Static checks accept the rollback inside the migration
directory and do not model a ledger containing `refund` during rollback.

## Independent verification

- Focused Connect/onboarding/refund/anonymity suite: PASS - 5 files, 64/64 tests.
- Scoped ESLint: PASS - zero reported findings.
- No live migration, deployment, commit, or production mutation was performed.

## Required outcome

Execute `TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4.md`. Keep canonical activation false and the
Master Action Plan item open until the gate, migration boundary, three-way conflicts, grant
conservation, refund semantics, multi-hold handling, and rollback-with-refund behavior pass review.
