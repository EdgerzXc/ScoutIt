-- ═══════════════════════════════════════════════════════════════════════
-- property_lifecycle_events.operation_key — THE IDEMPOTENCY KEY THAT WAS
-- NEVER CREATED
-- NEW_IDEAS_2.md §58 · C28
-- ═══════════════════════════════════════════════════════════════════════
--
-- ── THE PROBLEM ────────────────────────────────────────────────────────
-- Three routes write a lifecycle audit event keyed on `operation_key`:
--
--   /api/dashboard/delete:25    upsert(..., { onConflict: "operation_key" })
--   /api/dashboard/delete:130   insert({ operation_key: ... })
--   /api/dashboard/archive:90   upsert(..., { onConflict: "operation_key" })
--
-- The column does not exist. Verified against the live database 2026-08-06:
-- `property_lifecycle_events` is (id, property_id, from_state, to_state,
-- actor_id, reason, metadata, created_at), and its only indexes are the pkey
-- and (property_id, created_at DESC).
--
-- So every one of those writes failed. Unlike most of the C28 findings this
-- one is NOT silent, and that is worse for the user: both routes check the
-- audit error and return 500 *after* having already mutated `properties`.
--
--   Owner clicks "remove listing"
--     → properties row IS updated to permanently_removed  (committed)
--     → audit insert fails on the missing column
--     → 500 "Listing was retained and removed from market access, but audit
--        evidence needs reconciliation", retryable: true
--
-- The listing is gone, the owner is told it failed, and the retry fails
-- identically forever. Same shape for withdraw/off-market via archive.
--
-- ── WHY ADD THE COLUMN RATHER THAN STRIP THE KEY ───────────────────────
-- The key is doing real work. These are audit events for irreversible
-- lifecycle transitions, and the value is derived from the transition's own
-- timestamp (`remove:<id>:<permanently_removed_at>`), so a retried request
-- produces the SAME key. That is what makes the retry safe rather than
-- duplicate-generating. Deleting the key would remove the idempotency the
-- routes were designed around and let a double-click write two conflicting
-- audit rows for one event. The column is the missing half of a correct
-- design, not decoration.
--
-- ── WHY A FULL UNIQUE CONSTRAINT, NOT A PARTIAL INDEX ──────────────────
-- This is BF1, exactly. Postgres cannot infer a PARTIAL unique index from
-- `ON CONFLICT (operation_key)` unless the statement repeats the index
-- predicate, and supabase-js `.upsert({ onConflict })` has no way to emit a
-- WHERE clause. A partial index here would make every upsert 500 — trading
-- this bug for an identical-looking one.
--
-- A full UNIQUE is safe for the existing rows precisely because Postgres
-- treats NULLs as distinct: the 0 legacy rows (and any future write that
-- omits the key) stack freely rather than colliding on a single NULL.

ALTER TABLE public.property_lifecycle_events
  ADD COLUMN IF NOT EXISTS operation_key text;

-- Full, not partial. See BF1.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'property_lifecycle_events_operation_key_key'
       AND conrelid = 'public.property_lifecycle_events'::regclass
  ) THEN
    ALTER TABLE public.property_lifecycle_events
      ADD CONSTRAINT property_lifecycle_events_operation_key_key
      UNIQUE (operation_key);
  END IF;
END $$;

COMMENT ON COLUMN public.property_lifecycle_events.operation_key IS
  'Idempotency key for irreversible lifecycle transitions, e.g. '
  '"remove:<property_id>:<permanently_removed_at>". Derived from the '
  'transition timestamp so a retried request reproduces the same key. '
  'UNIQUE must stay FULL, never partial - supabase-js .upsert({onConflict}) '
  'cannot emit an index predicate (see BF1). NULL is allowed and NULLs are '
  'distinct, so legacy rows without a key do not collide.';
