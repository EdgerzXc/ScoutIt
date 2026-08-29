-- A-023 phase 3: private broker narrative drafts and append-only audit events.
-- PREPARED ONLY. W-003 requires owner approval before live application.

CREATE TABLE IF NOT EXISTS public.broker_dossier_drafts (
  broker_id TEXT PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  portrait_url TEXT NOT NULL DEFAULT '',
  biography TEXT NOT NULL DEFAULT '',
  firm TEXT NOT NULL DEFAULT '',
  markets TEXT[] NOT NULL DEFAULT '{}',
  categories TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{}',
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  working_style TEXT NOT NULL DEFAULT '',
  availability TEXT NOT NULL DEFAULT 'not_set'
    CHECK (availability IN ('not_set', 'available', 'limited', 'unavailable')),
  intro_media_url TEXT NOT NULL DEFAULT '',
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
  published_revision BIGINT CHECK (published_revision IS NULL OR published_revision >= 0),
  publish_state TEXT NOT NULL DEFAULT 'draft'
    CHECK (publish_state IN ('draft', 'published')),
  airtable_record_id TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.broker_dossier_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  actor_user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('broker_dossier_saved', 'broker_dossier_published')),
  draft_revision BIGINT NOT NULL CHECK (draft_revision >= 0),
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS broker_dossier_audit_events_broker_idx
  ON public.broker_dossier_audit_events (broker_id, created_at DESC, id);

ALTER TABLE public.broker_dossier_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_dossier_audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.broker_dossier_drafts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.broker_dossier_audit_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.broker_dossier_drafts TO service_role;
GRANT ALL ON TABLE public.broker_dossier_audit_events TO service_role;

CREATE OR REPLACE FUNCTION public.save_broker_dossier_draft(
  p_broker_id TEXT,
  p_actor_id TEXT,
  p_expected_revision BIGINT,
  p_draft JSONB
)
RETURNS public.broker_dossier_drafts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  saved public.broker_dossier_drafts;
BEGIN
  IF p_actor_id IS DISTINCT FROM p_broker_id THEN
    RAISE EXCEPTION 'BROKER_DOSSIER_FORBIDDEN';
  END IF;
  IF jsonb_typeof(p_draft) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'INVALID_DRAFT';
  END IF;
  IF (p_draft - ARRAY[
    'portraitUrl', 'biography', 'firm', 'markets', 'categories',
    'languages', 'serviceAreas', 'workingStyle', 'availability', 'introMediaUrl'
  ]) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'UNKNOWN_DRAFT_FIELD';
  END IF;

  INSERT INTO public.broker_dossier_drafts (
    broker_id, portrait_url, biography, firm, markets, categories, languages,
    service_areas, working_style, availability, intro_media_url, revision,
    publish_state, updated_at
  ) VALUES (
    p_broker_id,
    COALESCE(p_draft->>'portraitUrl', ''),
    COALESCE(p_draft->>'biography', ''),
    COALESCE(p_draft->>'firm', ''),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_draft->'markets', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_draft->'categories', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_draft->'languages', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_draft->'serviceAreas', '[]'::jsonb))),
    COALESCE(p_draft->>'workingStyle', ''),
    COALESCE(p_draft->>'availability', 'not_set'),
    COALESCE(p_draft->>'introMediaUrl', ''),
    1,
    'draft',
    now()
  )
  ON CONFLICT (broker_id) DO UPDATE SET
    portrait_url = EXCLUDED.portrait_url,
    biography = EXCLUDED.biography,
    firm = EXCLUDED.firm,
    markets = EXCLUDED.markets,
    categories = EXCLUDED.categories,
    languages = EXCLUDED.languages,
    service_areas = EXCLUDED.service_areas,
    working_style = EXCLUDED.working_style,
    availability = EXCLUDED.availability,
    intro_media_url = EXCLUDED.intro_media_url,
    revision = public.broker_dossier_drafts.revision + 1,
    publish_state = 'draft',
    updated_at = now()
  WHERE public.broker_dossier_drafts.revision = p_expected_revision
  RETURNING * INTO saved;

  IF saved.broker_id IS NULL THEN
    RAISE EXCEPTION 'STALE_DRAFT_REVISION';
  END IF;
  IF saved.revision = 1 AND COALESCE(p_expected_revision, 0) <> 0 THEN
    RAISE EXCEPTION 'STALE_DRAFT_REVISION';
  END IF;

  INSERT INTO public.broker_dossier_audit_events (
    broker_id, actor_user_id, event_type, draft_revision
  ) VALUES (
    p_broker_id, p_actor_id, 'broker_dossier_saved', saved.revision
  );

  RETURN saved;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_broker_dossier_published(
  p_broker_id TEXT,
  p_actor_id TEXT,
  p_expected_revision BIGINT,
  p_airtable_record_id TEXT
)
RETURNS public.broker_dossier_drafts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  published public.broker_dossier_drafts;
BEGIN
  IF p_actor_id IS DISTINCT FROM p_broker_id THEN
    RAISE EXCEPTION 'BROKER_DOSSIER_FORBIDDEN';
  END IF;
  IF NULLIF(btrim(p_airtable_record_id), '') IS NULL THEN
    RAISE EXCEPTION 'AIRTABLE_RECORD_REQUIRED';
  END IF;

  UPDATE public.broker_dossier_drafts
  SET published_revision = revision,
      publish_state = 'published',
      airtable_record_id = p_airtable_record_id,
      published_at = now(),
      updated_at = now()
  WHERE broker_id = p_broker_id
    AND revision = p_expected_revision
  RETURNING * INTO published;

  IF published.broker_id IS NULL THEN
    RAISE EXCEPTION 'STALE_DRAFT_REVISION';
  END IF;

  INSERT INTO public.broker_dossier_audit_events (
    broker_id, actor_user_id, event_type, draft_revision,
    event_payload
  ) VALUES (
    p_broker_id, p_actor_id, 'broker_dossier_published', published.revision,
    jsonb_build_object('airtable_record_id', p_airtable_record_id)
  );

  RETURN published;
END;
$$;

REVOKE ALL ON FUNCTION public.save_broker_dossier_draft(TEXT, TEXT, BIGINT, JSONB)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_broker_dossier_published(TEXT, TEXT, BIGINT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_broker_dossier_draft(TEXT, TEXT, BIGINT, JSONB)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_broker_dossier_published(TEXT, TEXT, BIGINT, TEXT)
  TO service_role;
