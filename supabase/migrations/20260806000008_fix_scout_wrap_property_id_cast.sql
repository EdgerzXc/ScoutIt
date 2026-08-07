-- ═══════════════════════════════════════════════════════════════════════
-- generate_monthly_scout_wrap: ONE BAD CAST MADE THE WHOLE RPC THROW
-- NEW_IDEAS_2.md §58 · W9 pre-flight (Standing Rule 15)
-- ═══════════════════════════════════════════════════════════════════════
--
-- W9 is the last item built on an endpoint that had never been called, so
-- Rule 15 said run it before building a UI. Running it:
--
--   select public.generate_monthly_scout_wrap('property', '<real uuid>', '2026-07');
--
--   ERROR 42883: operator does not exist: text = uuid
--   QUERY: SELECT COUNT(*) FROM public.viewing_appointments
--          WHERE property_id = p_entity_id::UUID
--   CONTEXT: PL/pgSQL function generate_monthly_scout_wrap(text,text,text) line 34
--
-- So `/api/wrap?entityType=property` has returned 500 "Could not generate
-- Monthly Scout Wrap" for every call since it shipped. A UI built on it would
-- have shown an error on first click.
--
-- ── WHY ONLY ONE OF THE FOUR CASTS IS WRONG ────────────────────────────
-- `property_id` is not one type in this schema. Verified against the live
-- database 2026-08-06:
--
--   analytics_events.property_id      uuid   → p_entity_id::UUID  correct
--   deals.property_id                 uuid   → p_entity_id::UUID  correct
--   viewing_appointments.property_id  TEXT   → p_entity_id::UUID  WRONG
--
-- The function was written as though the column were uniformly uuid. Three
-- copies of the same line were right and the fourth was wrong, which is why
-- reading the function does not reveal it — you have to know the column types,
-- or run it. This is the `coerce_user_ref_columns_to_text` legacy showing
-- through.
--
-- ── THE FIX ────────────────────────────────────────────────────────────
-- Compare text to text for the one text column. NOT changing the column's type:
-- `viewing_appointments.property_id` is written by live code paths, and
-- retyping a column that other routes filter on is a much larger change than
-- the bug requires. The inconsistency itself is recorded in §58 as a follow-up.
--
-- Everything else in the function checked out and is preserved verbatim:
--   • properties.owner_id is text, and `p.owner_id = p_entity_id` is correct
--   • deals.broker_id is text, and `broker_id = p_entity_id` is correct
--   • ON CONFLICT (entity_type, entity_id, period_month) matches the real
--     UNIQUE constraint `monthly_scout_wraps_unique_period`
--   • EXECUTE is granted only to postgres and service_role — Rule 8 already
--     satisfied, so this migration must not widen it. CREATE OR REPLACE
--     preserves the existing ACL.

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
    WHERE property_id = p_entity_id::UUID      -- uuid column
      AND event_type = 'property_view'
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_saves
    FROM public.analytics_events
    WHERE property_id = p_entity_id::UUID      -- uuid column
      AND event_type = 'property_save'
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_new_contacts
    FROM public.deals
    WHERE property_id = p_entity_id::UUID      -- uuid column
      AND created_at >= v_start_time AND created_at < v_end_time;

    -- ⚠️ THE FIX: viewing_appointments.property_id is TEXT, not uuid.
    -- `p_entity_id::UUID` here raised 42883 and aborted the whole function.
    SELECT COUNT(*) INTO v_viewing_requests
    FROM public.viewing_appointments
    WHERE property_id = p_entity_id            -- TEXT column
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
    WHERE p.owner_id = p_entity_id             -- properties.owner_id is TEXT
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
    WHERE broker_id = p_entity_id              -- deals.broker_id is TEXT
      AND created_at >= v_start_time AND created_at < v_end_time;

    v_report := jsonb_build_object(
      'period_month', p_period_month,
      'broker_id', p_entity_id,
      'new_routed_leads', COALESCE(v_new_contacts, 0)
    );
  END IF;

  INSERT INTO public.monthly_scout_wraps (entity_type, entity_id, period_month, report_data, generated_at)
  VALUES (p_entity_type, p_entity_id, p_period_month, v_report, now())
  ON CONFLICT (entity_type, entity_id, period_month)
  DO UPDATE SET report_data = EXCLUDED.report_data, generated_at = now();

  RETURN v_report;
END;
$function$;

-- Rule 8. CREATE OR REPLACE keeps the prior ACL, but state the intent
-- explicitly so a future rewrite that uses CREATE (not REPLACE) cannot
-- silently inherit Postgres' default PUBLIC grant.
REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) TO service_role;
