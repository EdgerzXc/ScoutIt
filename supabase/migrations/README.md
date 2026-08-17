# ScoutIt migration authority

Owner decision recorded 2026-08-14: tracked Supabase migrations are ScoutIt's
database source of truth. This does not mean that every historical file should
be applied. Production has drifted from the folder, so each migration requires a
fresh live preflight and explicit apply approval.

Canonical audit:
`_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12.md`

## Superseded migrations

- `20260803000001_production_security_rls.sql` is retained for history and marked
  `SUPERSEDED - DO NOT APPLY`. Its old policies and function overload conflict
  with stricter controls already live.
- `20260809000001_security_telemetry_retention.sql` is intentionally absent and
  must not be recreated. Its partial uniqueness, old upsert behavior, and
  hard-delete retention design conflict with the live total-counter invariant
  and the owner-approved compress-not-delete policy.

Superseded files are historical evidence, not pending database work.

## Standing apply gate

Before every live migration:

1. Confirm a current recoverable backup or point-in-time recovery window.
2. Read the live schema, policies, grants, functions, row counts, and migration
   history for every object the SQL touches.
3. Compare the exact tracked SQL checksum with the reviewed copy.
4. Apply only one migration, through the audited Mission Control path.
5. Run its post-apply verification and affected product smoke tests.
6. Stop immediately on any mismatch; never bulk-apply a backlog.
