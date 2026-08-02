-- LR-06 & LR-07: Privacy-Safe Analytics Events and Monthly Scout Wrap Engine.
-- Additive only. Review and apply through the approved Supabase migration workflow.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('property_view', 'engaged_dwell', 'property_save', 'lead_routed', 'viewing_requested', 'viewing_status_change')),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_key TEXT NOT NULL,
  user_id TEXT,
  broker_id TEXT,
  chapter_id TEXT,
  dwell_seconds INTEGER DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_prop_month_idx ON public.analytics_events(property_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_viewer_key_idx ON public.analytics_events(viewer_key, property_id);

CREATE TABLE IF NOT EXISTS public.monthly_scout_wraps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('owner_portfolio', 'property', 'broker')),
  entity_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT monthly_scout_wraps_unique_period UNIQUE (entity_type, entity_id, period_month)
);

CREATE INDEX IF NOT EXISTS monthly_scout_wraps_entity_idx ON public.monthly_scout_wraps(entity_id, period_month DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_scout_wraps ENABLE ROW LEVEL SECURITY;

-- Generate / Update Monthly Scout Wrap RPC
CREATE OR REPLACE FUNCTION public.generate_monthly_scout_wrap(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_period_month TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  INSERT INTO public.monthly_scout_wraps (entity_type, entity_id, period_month, report_data, generated_at)
  VALUES (p_entity_type, p_entity_id, p_period_month, v_report, now())
  ON CONFLICT (entity_type, entity_id, period_month)
  DO UPDATE SET report_data = EXCLUDED.report_data, generated_at = now();

  RETURN v_report;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_monthly_scout_wrap(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_monthly_scout_wrap(TEXT, TEXT, TEXT) TO service_role;
