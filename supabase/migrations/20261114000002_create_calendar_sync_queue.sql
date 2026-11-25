-- =============================================================================
-- Migration: 20261114000002_create_calendar_sync_queue.sql
-- Task: A-361 — Make Google Calendar retry work recoverable
-- Purpose:
--   Creates public.calendar_sync_queue for bounded asynchronous reconciliation
--   of viewing appointment Google Calendar / Meet operations (create,
--   reschedule, cancel) when external provider calls or local binding writes
--   fail transiently.
--
-- Rollback:
--   BEGIN;
--   DROP TABLE IF EXISTS public.calendar_sync_queue;
--   COMMIT;
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.calendar_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.viewing_appointments(id) ON DELETE CASCADE,
  host_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  google_event_id text,
  operation text NOT NULL CHECK (operation IN ('create', 'reschedule', 'cancel')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed_permanent', 'superseded')
  ),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0 AND attempt_count <= 10),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts >= 1 AND max_attempts <= 10),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_attempted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_sync_queue_pending_idx
  ON public.calendar_sync_queue (next_attempt_at, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS calendar_sync_queue_appointment_idx
  ON public.calendar_sync_queue (appointment_id, created_at DESC);

ALTER TABLE public.calendar_sync_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.calendar_sync_queue FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.calendar_sync_queue TO service_role;

COMMIT;
