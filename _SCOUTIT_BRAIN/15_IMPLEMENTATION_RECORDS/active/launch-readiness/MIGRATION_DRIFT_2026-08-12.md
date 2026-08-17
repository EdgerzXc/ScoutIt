---
section: "15_IMPLEMENTATION_RECORDS/active/launch-readiness"
status: active
tags: [migration-drift, supabase, schema, risk, blocker, launch-readiness]
updated: 2026-08-14
related:
  - "[[CRITICAL_LOGIC_SECURITY_1_0B_2026-08-12]]"
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN]]"
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS]]"
---

## Owner decision and live reconciliation - 2026-08-14

The owner approved tracked Supabase migrations as ScoutIt's database source of
truth. This is authority to annotate and audit, not authority to mutate the live
database. The audit below was read-only; **nothing was applied**.

Production migration history now includes the five 2026-08-12 critical fixes and
the first two 2026-08-13 security fixes. Six tracked files remain unapplied.

| Migration | Live finding | Decision |
|---|---|---|
| `20260809000002_onboarding_completion_contract.sql` | Three columns and the check constraint are absent. The fixed backfill would complete 5 of 15 legacy/sample profiles. | **READY CONDITIONALLY.** Reconfirm the 5/15 impact immediately before apply. |
| `20260811000001_wishlist_share_revocation.sql` | Table is absent; application code already expects it. The design is service-role-only. | **READY.** Apply and verify RLS/grants before testing issue/revoke. |
| `20260811000002_pilot_cohort_registry.sql` | Both registry tables are absent; application and Mission Control expect them. | **READY.** Apply schema only; do not enroll users in the migration. |
| `20260813000003_rls_initplan_wrap_auth_calls.sql` | All 17 target policies exist and still use bare `auth.uid()` calls. | **READY.** Behavior-preserving RLS performance fix; verify access semantics afterward. |
| `20260813000004_revoke_st_estimatedextent.sql` | All three function signatures exist and anon/authenticated can execute them; no runtime caller was found. | **READY.** Revoke public execution, retain service role, then smoke-test map/radius search. |
| `20260813000005_spatial_ref_sys_rls.sql` | PostGIS owns the 8,500-row public reference table; RLS is off and public SELECT is expected. | **HOLD - DO NOT APPLY AS WRITTEN.** No staging exists, breakage risk is high, and this is not user data. |

Two conflicting historical migrations are superseded:

- `20260803000001_production_security_rls.sql` is retained with an in-file
  `SUPERSEDED - DO NOT APPLY` warning. It would weaken live policy behavior and
  create an obsolete function overload.
- `20260809000001_security_telemetry_retention.sql` is deliberately absent and
  documented in `supabase/migrations/README.md`. Recreating it would regress the
  telemetry counter and compress-not-delete decisions.

### Proposed controlled apply order - not yet authorized

1. `20260809000002_onboarding_completion_contract.sql`
2. `20260811000001_wishlist_share_revocation.sql`
3. `20260811000002_pilot_cohort_registry.sql`
4. `20260813000003_rls_initplan_wrap_auth_calls.sql`
5. `20260813000004_revoke_st_estimatedextent.sql`
6. Hold `20260813000005_spatial_ref_sys_rls.sql`.

For each ready migration: require a current recoverable backup/PITR window,
repeat the live preflight, compare the exact reviewed checksum, apply only that
one migration through Mission Control, run its verification and product smoke
test, and stop on any mismatch.

The remainder of this note is the historical 2026-08-12 discovery snapshot.
Where it conflicts with this section, this 2026-08-14 reconciliation wins.


# ⚠️ MIGRATION DRIFT — the repo and the live database disagree

**Discovered:** 2026-08-12, while pre-flighting the §1.0B security migration.
**Project:** `yyixsuaimdzyiocswcgc` (ScoutIT) — the only Supabase project.

## What this is

`supabase/migrations/` is not a record of what is in production. Several
migration files in the repository were **never applied** to the live database,
and several objects that *do* exist in the live database were applied outside
the tracked migration history (via the SQL editor).

This was found the honest way: by querying the live schema before applying a
migration, rather than trusting the files. Had the §1.0B migration been applied
on the assumption that the files were accurate, it would have **failed
mid-way** — or, worse in one case, **silently created a permissive policy
alongside the one it meant to replace**, appearing to succeed while restricting
nothing.

## Evidence

Supabase's tracked migration history ends at `20260806112254`
(`fix_scout_wrap_property_id_cast`) and uses different version numbers and names
than the repo filenames — two parallel histories.

### Repo migrations confirmed NOT applied

| Repo file | Proof it did not run |
|---|---|
| `20260803000001_production_security_rls.sql` | Live policies are `"Public can read published properties"` / `"Users can update their own properties"`, not the names this file creates. `deals` has no UPDATE policy. |
| `20260809000001_security_telemetry_retention.sql` | No `uq_security_pageview_identity_route` index, no `record_security_pageview()` function, no `city`/`country`/`latitude`/`longitude` columns, and 130 duplicate pageview rows that the index would have prevented. |
| `20260809000002_onboarding_completion_contract.sql` | Dated after the last tracked migration. |
| `20260811000001_wishlist_share_revocation.sql` | " |
| `20260811000002_pilot_cohort_registry.sql` | " |

### Applied outside the tracked history

`20260802000004_handshakes_and_chat_lifecycle.sql` does not appear in Supabase's
migration list, yet `deal_handshakes` and `complete_transaction_handshake()`
both exist in the live database. It was run manually.

### Objects that exist with no clear owning migration

- `public.saved_intel` — real table, real RLS policies, defined in no migration
  file.
- `public.clean_old_security_logs()` — exists, though the migration that creates
  it was never applied (an earlier `supabase/operations/security/` script).

## Why this is a launch-readiness problem, not a tidiness problem

1. **Security fixes can be silently inert.** The §1.0B property SELECT fix is
   the concrete example: `DROP POLICY IF EXISTS` on a name that does not exist
   is a no-op, and because RLS SELECT policies are OR'd, the new restrictive
   policy would have sat *next to* the old permissive one and changed nothing.
   The migration would have reported success.
2. **An audit against the repo is an audit of fiction.** Any finding derived
   from reading `supabase/migrations/` — including several in the 2026-08-12
   audit — may describe a database that does not exist. One §1.0B finding
   ("add `WITH CHECK` to the deals UPDATE policy") was actively *wrong* for the
   live database: there is no such policy, and creating one would have granted
   access that is currently denied.
3. **It compounds.** Every new migration written against the files inherits the
   same false assumptions, and each one that half-applies leaves the database in
   a state no file describes.
4. **There is no staging.** One project, no branch, so there is nowhere to
   rehearse. Pre-flight querying is currently the only safety net.

## What was done about it now

The §1.0B migration (`20260812000001`) was rewritten to be **self-sufficient**:
it asserts nothing about prior migrations, adds the columns it needs if absent,
deduplicates before indexing, drops both the live and the aspirational policy
names, and skips blocks whose tables are missing. It can be applied to this
database regardless of what else has or has not run.

## What still needs deciding — owner

Recorded in [[../../../08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS]] §1.12.

1. **Reconcile, do not bulk-apply.** Do **not** run the unapplied migrations in
   sequence to "catch up". At least two of them would now conflict with
   `20260812000001` — notably `20260809000001`, which recreates the *partial*
   telemetry index that `20260812000001` deliberately replaces with a total one,
   and redefines `record_security_pageview` with the old conflict predicate.
   Applying it afterwards would regress the storage-exhaustion fix.
2. **Mark superseded files.** `20260803000001` and `20260809000001` are now
   partly superseded. They should be annotated as such in-file so a future
   session does not apply them.
3. **Audit the remaining three** (`20260809000002`, `20260811000001`,
   `20260811000002`) individually against the live schema and apply what is
   still needed and still correct.
4. **Adopt one history.** Either drive everything through the Supabase CLI /
   tracked migrations, or declare the SQL editor authoritative and stop keeping
   migration files that imply otherwise. The current split is the root cause.
5. **Pre-flight becomes standing practice.** Before any future migration:
   query the live schema for the objects it touches, and measure the row impact
   of every destructive statement. This session found four real bugs that way.

## Standing rule proposed

> Never write a migration from the migration folder alone. Read the live schema
> first. The files describe intent; only the database describes reality.
