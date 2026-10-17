-- ═══════════════════════════════════════════════════════════════════════
-- A-206: ENHANCED MONTHLY SCOUT WRAP & CONNECTS TOKEN ROLLOVER SWEEP
-- ═══════════════════════════════════════════════════════════════════════
--
-- PURPOSE:
-- 1. Widens entity_type check constraint on public.monthly_scout_wraps
--    to include 'user' and 'seeker'.
-- 2. Upgrades `public.generate_monthly_scout_wrap` to compute Spotify-style
--    wrapped aggregations:
--    - For `owner_portfolio`: computes top engaged properties, top inquired
--      properties, total portfolio views, saves, and inquiries.
--    - For `broker`: computes hosted viewing tours, deal pipeline volume, and
--      top active deal properties.
--    - For `user` / `seeker`: computes spaces explored, spaces saved, inquiries
--      sent, viewings scheduled, and top explored spaces.
--    - For `property`: preserves granular listing engagement telemetry.
-- 3. Adds `public.sweep_monthly_token_rollover(p_month text)` to provide
--    authoritative scheduled month rollover sweeping in PostgreSQL for
--    active user Connects wallets.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Widen entity_type constraint on monthly_scout_wraps
ALTER TABLE public.monthly_scout_wraps
  DROP CONSTRAINT IF EXISTS monthly_scout_wraps_entity_type_check;

ALTER TABLE public.monthly_scout_wraps
  ADD CONSTRAINT monthly_scout_wraps_entity_type_check
    CHECK (entity_type IN ('owner_portfolio', 'property', 'broker', 'user', 'seeker'));

-- 2. Enhanced generate_monthly_scout_wrap RPC
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
  v_canonical_type TEXT;
  v_report JSONB;
  v_unique_eyes INTEGER := 0;
  v_total_views INTEGER := 0;
  v_saves INTEGER := 0;
  v_new_contacts INTEGER := 0;
  v_viewing_requests INTEGER := 0;
  v_top_engaged JSONB := '[]'::jsonb;
  v_top_inquired JSONB := '[]'::jsonb;
  v_top_explored JSONB := '[]'::jsonb;
  v_top_pitched JSONB := '[]'::jsonb;
BEGIN
  v_canonical_type := CASE LOWER(TRIM(p_entity_type))
    WHEN 'seeker' THEN 'user'
    ELSE LOWER(TRIM(p_entity_type))
  END;

  v_start_time := (p_period_month || '-01 00:00:00+08')::TIMESTAMPTZ;
  v_end_time := (v_start_time + INTERVAL '1 month');

  IF v_canonical_type = 'property' THEN
    SELECT COUNT(DISTINCT viewer_key), COUNT(*)
    INTO v_unique_eyes, v_total_views
    FROM public.analytics_events
    WHERE property_id::text = p_entity_id
      AND event_type = 'property_view'
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_saves
    FROM public.analytics_events
    WHERE property_id::text = p_entity_id
      AND event_type = 'property_save'
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_new_contacts
    FROM public.deals
    WHERE property_id::text = p_entity_id
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_viewing_requests
    FROM public.viewing_appointments
    WHERE property_id::text = p_entity_id
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

  ELSIF v_canonical_type = 'owner_portfolio' THEN
    -- 1. Unique and total views across portfolio
    SELECT COUNT(DISTINCT e.viewer_key), COUNT(e.id)
    INTO v_unique_eyes, v_total_views
    FROM public.analytics_events e
    JOIN public.properties p ON p.id::text = e.property_id::text
    WHERE p.owner_id::text = p_entity_id
      AND e.event_type = 'property_view'
      AND e.created_at >= v_start_time AND e.created_at < v_end_time;

    -- 2. Portfolio saves
    SELECT COUNT(e.id) INTO v_saves
    FROM public.analytics_events e
    JOIN public.properties p ON p.id::text = e.property_id::text
    WHERE p.owner_id::text = p_entity_id
      AND e.event_type = 'property_save'
      AND e.created_at >= v_start_time AND e.created_at < v_end_time;

    -- 3. Inquiries & viewing requests
    SELECT COUNT(d.id) INTO v_new_contacts
    FROM public.deals d
    JOIN public.properties p ON p.id::text = d.property_id::text
    WHERE p.owner_id::text = p_entity_id
      AND d.created_at >= v_start_time AND d.created_at < v_end_time;

    SELECT COUNT(va.id) INTO v_viewing_requests
    FROM public.viewing_appointments va
    JOIN public.properties p ON p.id::text = va.property_id::text
    WHERE p.owner_id::text = p_entity_id
      AND va.created_at >= v_start_time AND va.created_at < v_end_time;

    -- 4. Top engaged properties (Spotify-style ranking by views & saves)
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
    INTO v_top_engaged
    FROM (
      SELECT
        p.id AS property_id,
        COALESCE(p.title, 'Listing ' || substr(p.id::text, 1, 8)) AS title,
        COUNT(e.id) AS views,
        COUNT(DISTINCT e.viewer_key) AS unique_eyes,
        COUNT(CASE WHEN e.event_type = 'property_save' THEN 1 END) AS saves
      FROM public.properties p
      JOIN public.analytics_events e
        ON e.property_id::text = p.id::text
        AND e.created_at >= v_start_time AND e.created_at < v_end_time
      WHERE p.owner_id::text = p_entity_id
      GROUP BY p.id, p.title
      ORDER BY views DESC, unique_eyes DESC
      LIMIT 3
    ) sub;

    -- 5. Top inquired properties (Spotify-style ranking by inquiries & viewing appointments)
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
    INTO v_top_inquired
    FROM (
      SELECT
        p.id AS property_id,
        COALESCE(p.title, 'Listing ' || substr(p.id::text, 1, 8)) AS title,
        COUNT(DISTINCT d.id) AS inquiries,
        COUNT(DISTINCT va.id) AS viewing_requests
      FROM public.properties p
      LEFT JOIN public.deals d
        ON d.property_id::text = p.id::text
        AND d.created_at >= v_start_time AND d.created_at < v_end_time
      LEFT JOIN public.viewing_appointments va
        ON va.property_id::text = p.id::text
        AND va.created_at >= v_start_time AND va.created_at < v_end_time
      WHERE p.owner_id::text = p_entity_id
      GROUP BY p.id, p.title
      HAVING (COUNT(d.id) + COUNT(va.id)) > 0
      ORDER BY (COUNT(d.id) + COUNT(va.id)) DESC
      LIMIT 3
    ) sub;

    v_report := jsonb_build_object(
      'period_month', p_period_month,
      'owner_id', p_entity_id,
      'unique_portfolio_eyes', COALESCE(v_unique_eyes, 0),
      'total_portfolio_views', COALESCE(v_total_views, 0),
      'total_portfolio_saves', COALESCE(v_saves, 0),
      'total_portfolio_inquiries', COALESCE(v_new_contacts, 0),
      'total_viewing_requests', COALESCE(v_viewing_requests, 0),
      'top_engaged_properties', v_top_engaged,
      'top_inquired_properties', v_top_inquired
    );

  ELSIF v_canonical_type = 'broker' THEN
    SELECT COUNT(*) INTO v_new_contacts
    FROM public.deals
    WHERE broker_id::text = p_entity_id
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_viewing_requests
    FROM public.viewing_appointments
    WHERE host_id::text = p_entity_id
      AND scheduled_at >= v_start_time AND scheduled_at < v_end_time;

    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
    INTO v_top_pitched
    FROM (
      SELECT
        p.id AS property_id,
        COALESCE(p.title, 'Listing ' || substr(p.id::text, 1, 8)) AS title,
        COUNT(d.id) AS deals_count
      FROM public.deals d
      JOIN public.properties p ON p.id::text = d.property_id::text
      WHERE d.broker_id::text = p_entity_id
        AND d.created_at >= v_start_time AND d.created_at < v_end_time
      GROUP BY p.id, p.title
      ORDER BY deals_count DESC
      LIMIT 3
    ) sub;

    v_report := jsonb_build_object(
      'period_month', p_period_month,
      'broker_id', p_entity_id,
      'new_routed_leads', COALESCE(v_new_contacts, 0),
      'viewing_tours_hosted', COALESCE(v_viewing_requests, 0),
      'top_active_properties', v_top_pitched
    );

  ELSIF v_canonical_type = 'user' THEN
    SELECT COUNT(DISTINCT property_id) INTO v_total_views
    FROM public.analytics_events
    WHERE user_id::text = p_entity_id
      AND event_type = 'property_view'
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(DISTINCT property_id) INTO v_saves
    FROM public.analytics_events
    WHERE user_id::text = p_entity_id
      AND event_type = 'property_save'
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_new_contacts
    FROM public.deals
    WHERE buyer_id::text = p_entity_id
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COUNT(*) INTO v_viewing_requests
    FROM public.viewing_appointments
    WHERE guest_id::text = p_entity_id
      AND created_at >= v_start_time AND created_at < v_end_time;

    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
    INTO v_top_explored
    FROM (
      SELECT
        p.id AS property_id,
        COALESCE(p.title, 'Listing ' || substr(p.id::text, 1, 8)) AS title,
        COUNT(e.id) AS view_count
      FROM public.analytics_events e
      JOIN public.properties p ON p.id::text = e.property_id::text
      WHERE e.user_id::text = p_entity_id
        AND e.event_type = 'property_view'
        AND e.created_at >= v_start_time AND e.created_at < v_end_time
      GROUP BY p.id, p.title
      ORDER BY view_count DESC
      LIMIT 3
    ) sub;

    v_report := jsonb_build_object(
      'period_month', p_period_month,
      'user_id', p_entity_id,
      'spaces_explored', COALESCE(v_total_views, 0),
      'spaces_saved', COALESCE(v_saves, 0),
      'inquiries_sent', COALESCE(v_new_contacts, 0),
      'viewings_scheduled', COALESCE(v_viewing_requests, 0),
      'top_explored_spaces', v_top_explored
    );
  END IF;

  INSERT INTO public.monthly_scout_wraps (
    entity_type, entity_id, period_month, report_data, generated_at
  )
  VALUES (v_canonical_type, p_entity_id, p_period_month, v_report, now())
  ON CONFLICT (entity_type, entity_id, period_month)
  DO UPDATE SET report_data = EXCLUDED.report_data, generated_at = now();

  RETURN v_report;
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.generate_monthly_scout_wrap(text, text, text) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. MONTHLY CONNECTS TOKEN ROLLOVER SWEEPER
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sweep_monthly_token_rollover(
  p_month text DEFAULT NULL
)
RETURNS TABLE (
  rolled_over_count INTEGER,
  target_month TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_month TEXT;
  v_count INTEGER := 0;
BEGIN
  v_month := COALESCE(p_month, to_char(now(), 'YYYY-MM'));

  WITH updated AS (
    UPDATE public.user_connect_wallets w
    SET
      granted_balance = public.get_role_connect_allowance(
        w.role,
        COALESCE(u.subscription_tier, 'starry')
      ),
      granted_month = v_month,
      updated_at = now()
    FROM public.user_profiles u
    WHERE u.id = w.user_id
      AND w.granted_month <> v_month
    RETURNING w.id
  )
  SELECT COUNT(*) INTO v_count FROM updated;

  RETURN QUERY SELECT v_count, v_month;
END;
$function$;

REVOKE ALL ON FUNCTION public.sweep_monthly_token_rollover(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sweep_monthly_token_rollover(text) FROM anon;
REVOKE ALL ON FUNCTION public.sweep_monthly_token_rollover(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sweep_monthly_token_rollover(text) TO service_role;
