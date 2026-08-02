# Supabase Operational SQL

This folder contains tracked SQL scripts that were previously loose at the
repository root. They are grouped by purpose so they are not confused with the
ordered, repeatable migrations in `../migrations/`.

These files are historical baselines or manual one-off operations. Do not run
an entire folder against a live project. Before applying any script, compare it
with the live schema and the migration history, then record what was applied.

## Folders

- `baseline/` — early schema bootstrap material. In particular,
  `supabase_schema.sql` contains permissive development policies and is not a
  production hardening script.
- `features/` — additive feature schemas for property details, deals/chat,
  scheduling, and OSINT Intel.
- `compliance/` — regulatory schema additions.
- `security/` — audit, RLS, advisor, and telemetry hardening scripts. Some were
  written at different points in the authentication migration and overlap;
  never combine or rerun them without a statement-level review.

For deployable database history, use `../migrations/`. Mission Control has its
own migration history under `../../mission-control/supabase/migrations/`.

