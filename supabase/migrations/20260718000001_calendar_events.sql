-- Calendar Sync — Phase 1: the canonical in-app event store (2026-07-18).
--
-- This is the single source of truth for user-created calendar events shown on
-- the dashboard Calendar page. Viewing appointments continue to live in their
-- own `viewing_appointments` table (read-only on the calendar) — this table is
-- ONLY for the free-form events a user creates/edits/deletes themselves.
--
-- IMPORTANT: NOT yet applied to the live database. Apply deliberately (Supabase
-- MCP migration or `supabase db push`) — schema changes to production are a
-- "tell before pushing" action per the project's working style.
--
-- Design notes:
--  * owner_user_id is TEXT (not a uuid FK) to match the deals / crm_tasks
--    convention — this lets dev-mock ids (e.g. `master-dev`) own events during
--    testing, exactly like crm_tasks.
--  * Deletes are TOMBSTONES (is_deleted = true), never hard deletes. Phase 3
--    (external sync) needs the row to survive so the deletion can propagate to
--    Google/Calendly; hard-deleting would resurrect the event on next pull.
--  * content_hash + external-sync columns are added now (cheap, nullable) so
--    Phase 3 doesn't require a second migration on a live table. They are unused
--    in Phase 1.

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL,

  title         TEXT NOT NULL,
  description   TEXT,
  location      TEXT,

  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  all_day       BOOLEAN NOT NULL DEFAULT false,

  -- 'confirmed' | 'tentative' | 'cancelled' — mirrors Google's event.status
  status        TEXT NOT NULL DEFAULT 'confirmed',
  -- one of the dashboard accent tokens (gold | blue | green | red | purple);
  -- purely presentational, validated app-side.
  color         TEXT NOT NULL DEFAULT 'gold',

  -- Soft-delete tombstone. Filtered out of every read; kept so external sync
  -- (Phase 3+) can propagate the deletion instead of the event reappearing.
  is_deleted    BOOLEAN NOT NULL DEFAULT false,

  -- Reserved for Phase 3 bidirectional sync (loop-guard + provider linkage).
  -- Nullable + unused in Phase 1 so we never have to ALTER a live table later.
  content_hash      TEXT,
  last_synced_hash  TEXT,
  source            TEXT NOT NULL DEFAULT 'scoutit',  -- scoutit | google | calendly

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Range queries are always "this user's events between A and B".
CREATE INDEX IF NOT EXISTS calendar_events_owner_range_idx
  ON public.calendar_events (owner_user_id, starts_at)
  WHERE is_deleted = false;

-- Keep updated_at honest on every write.
CREATE OR REPLACE FUNCTION public.touch_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calendar_events_touch_updated_at ON public.calendar_events;
CREATE TRIGGER calendar_events_touch_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_calendar_events_updated_at();

-- RLS: defense-in-depth. The API routes use the service-role client
-- (supabaseAdmin) which bypasses RLS and enforces ownership via resolveUserId,
-- so these policies guard against any future direct/anon access. They compare
-- against auth.uid()::text because owner_user_id is TEXT (dev-mock rows simply
-- won't match a real auth.uid(), which is correct for production).
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_events_select_own ON public.calendar_events;
CREATE POLICY calendar_events_select_own ON public.calendar_events
  FOR SELECT USING (owner_user_id = auth.uid()::text);

DROP POLICY IF EXISTS calendar_events_insert_own ON public.calendar_events;
CREATE POLICY calendar_events_insert_own ON public.calendar_events
  FOR INSERT WITH CHECK (owner_user_id = auth.uid()::text);

DROP POLICY IF EXISTS calendar_events_update_own ON public.calendar_events;
CREATE POLICY calendar_events_update_own ON public.calendar_events
  FOR UPDATE USING (owner_user_id = auth.uid()::text);

DROP POLICY IF EXISTS calendar_events_delete_own ON public.calendar_events;
CREATE POLICY calendar_events_delete_own ON public.calendar_events
  FOR DELETE USING (owner_user_id = auth.uid()::text);
