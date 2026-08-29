-- A-047 — CRM + calendar logic v2 (2026-08-29).
--
-- Brings viewing_appointments, user_availability, and crm_tasks up to the model
-- the new src/lib/calendar/slots.js and src/lib/crm/taskModel.js require.
--
-- SAFETY NOTE, verified against the live database on 2026-08-29 before writing
-- this file: every table touched here holds ZERO rows
--   viewing_appointments 0, user_availability 0, crm_tasks 0,
--   crm_activity_log 0, calendar_events 0, calendar_connections 0.
-- That is why the property_id retype in section 1 is safe. It is NOT safe to
-- re-run this migration against a populated viewing_appointments table without
-- first checking that every property_id parses as a uuid.
--
-- Everything is IF NOT EXISTS / guarded so a partial run can be repeated.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. viewing_appointments — a viewing is a time RANGE, not an instant.
--
--    Without an end time, two viewings could not be detected as overlapping and
--    a viewing could not block calendar time. This is the change the whole slot
--    engine rests on.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.viewing_appointments
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60;

DO $$ BEGIN
  ALTER TABLE public.viewing_appointments
    ADD CONSTRAINT viewing_appointments_duration_check
    CHECK (duration_minutes BETWEEN 5 AND 480);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Maintained by a BEFORE trigger, NOT a generated column.
--
-- The first version of this migration used
--   GENERATED ALWAYS AS (scheduled_at + make_interval(mins => duration_minutes))
-- and PostgreSQL rejected it with 42P17 "generation expression is not
-- immutable". `timestamptz + interval` is STABLE, not IMMUTABLE, because for
-- intervals carrying month/day components the result depends on the session
-- TimeZone. An epoch round-trip (to_timestamp(extract(epoch ...))) was tried
-- and rejected for the same reason. A generated column is therefore not
-- available for this expression at all.
--
-- A BEFORE INSERT OR UPDATE trigger gives the same guarantee that matters:
-- the application cannot store an end time that disagrees with its own start
-- and duration, because the trigger overwrites whatever was supplied. The
-- trigger runs before constraint evaluation, so the exclusion constraint below
-- always sees the recomputed value.
ALTER TABLE public.viewing_appointments
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.viewing_appointments_sync_ends_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.ends_at := NEW.scheduled_at + make_interval(mins => NEW.duration_minutes);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS viewing_appointments_sync_ends_at ON public.viewing_appointments;
CREATE TRIGGER viewing_appointments_sync_ends_at
  BEFORE INSERT OR UPDATE OF scheduled_at, duration_minutes, ends_at
  ON public.viewing_appointments
  FOR EACH ROW EXECUTE FUNCTION public.viewing_appointments_sync_ends_at();

-- Backfill any pre-existing row, then make the column mandatory so a row can
-- never carry a NULL range into the exclusion constraint.
UPDATE public.viewing_appointments
   SET ends_at = scheduled_at + make_interval(mins => duration_minutes)
 WHERE ends_at IS NULL;

ALTER TABLE public.viewing_appointments
  ALTER COLUMN ends_at SET NOT NULL;

-- The zone the guest actually saw when they picked the slot. Kept for display
-- and for support questions ("they booked 2pm — 2pm where?"); the stored
-- instant remains the single source of truth.
ALTER TABLE public.viewing_appointments
  ADD COLUMN IF NOT EXISTS booked_timezone TEXT;

-- property_id was TEXT while public.properties.id is UUID, so no foreign key
-- could exist and a typo could never be caught. Safe only because the table is
-- empty (see the header note).
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'viewing_appointments'
        AND column_name = 'property_id') = 'text'
  THEN
    IF EXISTS (SELECT 1 FROM public.viewing_appointments LIMIT 1) THEN
      RAISE EXCEPTION
        'viewing_appointments is not empty; retyping property_id needs a checked backfill first';
    END IF;

    ALTER TABLE public.viewing_appointments
      ALTER COLUMN property_id TYPE UUID USING property_id::uuid;

  END IF;
END $$;

-- Keep the FK repairable if a partial first run changed the type and stopped
-- before adding the constraint.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.viewing_appointments'::regclass
      AND conname = 'viewing_appointments_property_id_fkey'
  ) THEN
    ALTER TABLE public.viewing_appointments
      ADD CONSTRAINT viewing_appointments_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Application-side revalidation closes stale-picker requests, but two requests
-- can still race between their final read and insert. PostgreSQL is the last
-- authority: active ranges for one host may never overlap.
-- btree_gist supplies the uuid gist operator class the host_id equality half of
-- the exclusion constraint needs; it was NOT installed on this project. It goes
-- in `extensions` per Supabase convention, so the constraint DDL below must be
-- able to resolve an operator class living there.
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.viewing_appointments'::regclass
      AND conname = 'viewing_appointments_no_active_overlap'
  ) THEN
    ALTER TABLE public.viewing_appointments
      ADD CONSTRAINT viewing_appointments_no_active_overlap
      EXCLUDE USING gist (
        host_id WITH =,
        tstzrange(scheduled_at, ends_at, '[)') WITH &&
      )
      WHERE (status IN ('pending', 'confirmed'));
  END IF;
END $$;

-- The existing Scout Wrap RPC was deliberately changed to compare this column
-- as TEXT in 20260806000008. Retyping the column without updating the function
-- would restore its old 42883 (uuid = text) production failure.
CREATE OR REPLACE FUNCTION public.generate_monthly_scout_wrap(
  p_entity_type text,
  p_entity_id text,
  p_period_month text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_report JSONB;
  v_unique_eyes INTEGER := 0;
  v_total_views INTEGER := 0;
  v_saves INTEGER := 0;
  v_new_contacts INTEGER := 0;
  v_viewing_requests INTEGER := 0;
BEGIN
  v_start_time := (p_period_month || '-01 00:00:00+08')::TIMESTAMPTZ;
  v_end_time := (v_start_time + INTERVAL '1 month');

  IF p_entity_type = 'property' THEN
    SELECT COUNT(DISTINCT viewer_key), COUNT(*)
    INTO v_unique_eyes, v_total_views
    FROM public.analytics_events
    WHERE property_id = p_entity_id::UUID
      AND event_type = 'property_view'
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_saves
    FROM public.analytics_events
    WHERE property_id = p_entity_id::UUID
      AND event_type = 'property_save'
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_new_contacts
    FROM public.deals
    WHERE property_id = p_entity_id::UUID
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_viewing_requests
    FROM public.viewing_appointments
    WHERE property_id = p_entity_id::UUID
      AND created_at >= v_start_time AND created_at < v_end_time;

    v_report := jsonb_build_object(
      'period_month', p_period_month,
      'property_id', p_entity_id,
      'unique_monthly_eyes', COALESCE(v_unique_eyes, 0),
      'total_property_views', COALESCE(v_total_views, 0),
      'saves', COALESCE(v_saves, 0),
      'new_contacts', COALESCE(v_new_contacts, 0),
      'viewing_requests', COALESCE(v_viewing_requests, 0)
    );

  ELSIF p_entity_type = 'owner_portfolio' THEN
    SELECT COUNT(DISTINCT e.viewer_key) INTO v_unique_eyes
    FROM public.analytics_events e
    JOIN public.properties p ON p.id = e.property_id
    WHERE p.owner_id = p_entity_id
      AND e.event_type = 'property_view'
      AND e.created_at >= v_start_time AND e.created_at < v_end_time;

    v_report := jsonb_build_object(
      'period_month', p_period_month,
      'owner_id', p_entity_id,
      'unique_portfolio_eyes', COALESCE(v_unique_eyes, 0)
    );

  ELSIF p_entity_type = 'broker' THEN
    SELECT COUNT(*) INTO v_new_contacts
    FROM public.deals
    WHERE broker_id = p_entity_id
      AND created_at >= v_start_time AND created_at < v_end_time;

    v_report := jsonb_build_object(
      'period_month', p_period_month,
      'broker_id', p_entity_id,
      'new_routed_leads', COALESCE(v_new_contacts, 0)
    );
  END IF;

  INSERT INTO public.monthly_scout_wraps (
    entity_type, entity_id, period_month, report_data, generated_at
  )
  VALUES (p_entity_type, p_entity_id, p_period_month, v_report, now())
  ON CONFLICT (entity_type, entity_id, period_month)
  DO UPDATE SET report_data = EXCLUDED.report_data, generated_at = now();

  RETURN v_report;
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) TO service_role;

-- The slot engine's hot query: "everything on this host's calendar in a range".
CREATE INDEX IF NOT EXISTS viewing_appointments_host_time_idx
  ON public.viewing_appointments (host_id, scheduled_at);

CREATE INDEX IF NOT EXISTS viewing_appointments_guest_time_idx
  ON public.viewing_appointments (guest_id, scheduled_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. user_availability — the booking policy the slot engine reads.
--
--    Column defaults deliberately mirror AVAILABILITY_DEFAULTS in
--    src/lib/calendar/slots.js. If one changes, change both.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_availability
  ADD COLUMN IF NOT EXISTS default_duration_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS slot_interval_minutes    INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS buffer_before_minutes    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buffer_after_minutes     INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS minimum_notice_minutes   INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS max_bookings_per_day     INTEGER,
  ADD COLUMN IF NOT EXISTS created_at               TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.user_availability
    ADD CONSTRAINT user_availability_policy_check CHECK (
      default_duration_minutes BETWEEN 5 AND 480
      AND slot_interval_minutes  BETWEEN 5 AND 240
      AND buffer_before_minutes  BETWEEN 0 AND 240
      AND buffer_after_minutes   BETWEEN 0 AND 240
      AND minimum_notice_minutes BETWEEN 0 AND 43200
      AND (max_bookings_per_day IS NULL OR max_bookings_per_day BETWEEN 1 AND 50)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The old feature SQL allowed public reads of every host's complete policy.
-- Buyers now receive derived free slots through the deal-scoped API; only the
-- host needs direct access to the underlying hours and date overrides.
DROP POLICY IF EXISTS "Public can read availability" ON public.user_availability;
DO $$ BEGIN
  CREATE POLICY user_availability_select_own ON public.user_availability
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. crm_tasks — a task is a record with a lifecycle, not a boolean.
--
--    status/completed_at are kept consistent by the application in
--    src/lib/crm/taskModel.js toTaskRow(); the CHECK below makes the impossible
--    combination unrepresentable in the database as well.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.crm_tasks
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS priority         TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS description      TEXT,
  ADD COLUMN IF NOT EXISTS assignee_user_id TEXT,
  ADD COLUMN IF NOT EXISTS property_id      UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.crm_tasks
    ADD CONSTRAINT crm_tasks_status_check
    CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.crm_tasks
    ADD CONSTRAINT crm_tasks_priority_check
    CHECK (priority IN ('low', 'normal', 'high'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- "done" always carries a completion time; anything else never does.
DO $$ BEGIN
  ALTER TABLE public.crm_tasks
    ADD CONSTRAINT crm_tasks_completion_consistency_check
    CHECK ((status = 'done') = (completed_at IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The rail's query: this user's open work, soonest first.
CREATE INDEX IF NOT EXISTS crm_tasks_owner_status_idx
  ON public.crm_tasks (owner_user_id, status, due_at);

CREATE INDEX IF NOT EXISTS crm_tasks_assignee_idx
  ON public.crm_tasks (assignee_user_id, status, due_at);

CREATE INDEX IF NOT EXISTS crm_tasks_property_idx
  ON public.crm_tasks (property_id, created_at DESC);

-- A task assigned to someone else must still be readable by that person.
-- The existing crm_tasks_owner_all policy only covers owner_user_id.
DO $$ BEGIN
  CREATE POLICY crm_tasks_assignee_read ON public.crm_tasks
    FOR SELECT
    USING (assignee_user_id = (SELECT auth.uid())::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. crm_activity_log — cursor pagination support.
--
--    The merged feed previously ran two 50-row queries and sliced the result to
--    50, so a busy user's property rows could hide their deal rows entirely.
--    A keyset cursor needs a total order, and created_at alone is not one.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS crm_activity_created_idx
  ON public.crm_activity_log (created_at DESC, id DESC);

-- One Google event may map to only one local row per owner. The earlier
-- non-unique lookup index did not protect two concurrent sync requests from
-- inserting the same remote event twice.
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_owner_google_unique_idx
  ON public.calendar_events (owner_user_id, google_event_id)
  WHERE google_event_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. updated_at triggers. Both tables carry the column; neither maintained it.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_tasks_touch_updated_at ON public.crm_tasks;
CREATE TRIGGER crm_tasks_touch_updated_at
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS viewing_appointments_touch_updated_at ON public.viewing_appointments;
CREATE TRIGGER viewing_appointments_touch_updated_at
  BEFORE UPDATE ON public.viewing_appointments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS user_availability_touch_updated_at ON public.user_availability;
CREATE TRIGGER user_availability_touch_updated_at
  BEFORE UPDATE ON public.user_availability
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMENT ON COLUMN public.viewing_appointments.ends_at IS
  'Generated from scheduled_at + duration_minutes. Never written by the app.';
COMMENT ON COLUMN public.user_availability.minimum_notice_minutes IS
  'Mirrors AVAILABILITY_DEFAULTS in src/lib/calendar/slots.js - change both together.';
