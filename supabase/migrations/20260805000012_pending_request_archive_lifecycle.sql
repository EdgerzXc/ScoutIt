-- ═══════════════════════════════════════════════════════════════════════
-- PENDING REQUEST LIFECYCLE — 7-DAY ARCHIVE, 30-DAY DELETE, RESETTABLE
-- NEW_IDEAS.md §40.15
-- ═══════════════════════════════════════════════════════════════════════
--
-- THE RULE (owner directive 2026-08-05)
-- ------------------------------------
--   Connect sent  →  7 days unanswered  →  ARCHIVED (still acceptable)
--                 →  30 days unanswered →  DELETED
--   Unarchiving before day 30 RESETS both clocks back to zero.
--
-- This is NOT the 72-hour expiry returning. The distinction is the whole
-- point: archiving hides a request, it does not kill it. An owner who opens
-- their archive on day 20 can still accept and the conversation proceeds
-- normally. Only genuine, month-long silence ends it.
--
-- WHY ONE COLUMN DRIVES BOTH CLOCKS
-- ---------------------------------
-- `pending_clock_reset_at` is the single origin both deadlines measure from.
-- Two independent timestamps (one for archive, one for delete) would drift
-- the moment anyone reset only one of them — and "unarchive resets it" is
-- exactly the operation that would expose that bug. One origin cannot drift.
--
-- Defaults to created_at for existing rows, so nothing is retroactively aged.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS pending_clock_reset_at TIMESTAMPTZ;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Backfill: a request's clock has always run from when it was sent.
UPDATE public.deals
   SET pending_clock_reset_at = created_at
 WHERE pending_clock_reset_at IS NULL;

COMMENT ON COLUMN public.deals.pending_clock_reset_at IS
  'Origin both pending deadlines measure from: +7d archives, +30d deletes. '
  'Unarchiving sets this to now(), restarting both. See NEW_IDEAS.md 40.15.';

COMMENT ON COLUMN public.deals.archived_at IS
  'When a pending request was auto-archived (7d unanswered). NULL = not '
  'archived. An archived request is still fully acceptable - archiving hides, '
  'it does not cancel. Cleared on unarchive.';

-- Drives the daily sweep. Partial index: only pending rows are ever swept,
-- and that is a small slice of the table.
CREATE INDEX IF NOT EXISTS deals_pending_clock_idx
  ON public.deals (pending_clock_reset_at)
  WHERE status = 'pending';

-- ═══════════════════════════════════════════════════════════════════════
-- NOTES
-- ═══════════════════════════════════════════════════════════════════════
--
-- 1. "DELETED" IS A SOFT DELETE. The sweep sets status='deleted' and blanks
--    pitch_message, so the request is genuinely gone from both users' views.
--    The ROW survives, because deals.id is referenced by connect_transactions
--    (the money ledger), deal_routing_recipients, and the CRM activity log.
--    Hard-deleting it would orphan a real financial record to tidy a UI.
--    If a true purge is ever required for RA 10173, it must cascade through
--    those tables deliberately — not as a side-effect of an inbox timer.
--
-- 2. THE 30-DAY CLOCK IS MEASURED FROM THE RESET POINT, NOT FROM ARCHIVING.
--    So an untouched request is archived on day 7 and deleted on day 30 —
--    23 days sitting in the archive where the owner can still act on it.
--
-- 3. ONLY status='pending' IS EVER SWEPT. An accepted conversation is never
--    archived or deleted by this mechanism, however quiet it goes.
-- ═══════════════════════════════════════════════════════════════════════
