BEGIN;

CREATE TABLE public.property_pdf_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  filename text NOT NULL CHECK (char_length(filename) BETWEEN 1 AND 100),
  size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 26214400),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 hours',
  property_id uuid
);

ALTER TABLE public.property_pdf_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.property_pdf_uploads FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.property_pdf_uploads TO service_role;
CREATE INDEX property_pdf_uploads_owner_pending_idx
  ON public.property_pdf_uploads (owner_id, expires_at) WHERE property_id IS NULL;
CREATE INDEX property_pdf_uploads_expiration_idx ON public.property_pdf_uploads (expires_at);

CREATE FUNCTION public.reserve_property_pdf_upload(p_owner_id uuid, p_filename text, p_size_bytes integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  upload_id uuid;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('property-pdf:' || p_owner_id::text, 0));

  IF (SELECT count(*) FROM public.properties WHERE owner_id = p_owner_id AND pipeline_status = 'ai_drafting')
     + (SELECT count(*) FROM public.property_pdf_uploads
        WHERE owner_id = p_owner_id AND property_id IS NULL AND expires_at > now()) >= 5 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.property_pdf_uploads (owner_id, filename, size_bytes)
  VALUES (p_owner_id, p_filename, p_size_bytes)
  RETURNING id INTO upload_id;
  RETURN upload_id;
END;
$$;

CREATE FUNCTION public.finalize_property_pdf_upload(
  p_upload_id uuid, p_owner_id uuid, p_pdf_hash text, p_priority boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  pending public.property_pdf_uploads%ROWTYPE;
  draft_id uuid;
  created boolean := false;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('property-pdf:' || p_owner_id::text, 0));

  SELECT * INTO pending FROM public.property_pdf_uploads
    WHERE id = p_upload_id AND owner_id = p_owner_id AND expires_at > now();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('state', 'expired');
  END IF;
  IF pending.property_id IS NOT NULL THEN
    RETURN jsonb_build_object('state', 'ready', 'propertyId', pending.property_id, 'created', false);
  END IF;

  SELECT id INTO draft_id FROM public.properties
    WHERE owner_id = p_owner_id AND pipeline_status = 'ai_drafting' AND creation_source = 'pdf_assisted'
      AND pdf_source_url IS NOT NULL AND details->>'pdf_hash' = p_pdf_hash
    ORDER BY created_at, id LIMIT 1;

  IF draft_id IS NULL THEN
    IF (SELECT count(*) FROM public.properties WHERE owner_id = p_owner_id AND pipeline_status = 'ai_drafting') >= 5 THEN
      RETURN jsonb_build_object('state', 'full');
    END IF;

    INSERT INTO public.properties
      (owner_id, title, type, space_category, slug, location, pipeline_status,
       creation_source, pdf_source_url, details)
    VALUES (
      p_owner_id, 'Drafting: ' || pending.filename, 'commercial', 'commercial',
      'pdf-draft-' || p_upload_id::text, 'Location Pending', 'ai_drafting',
      'pdf_assisted', 'source_queue_docs/' || p_owner_id::text || '/' || p_upload_id::text || '.pdf',
      jsonb_build_object('source_pdf', pending.filename, 'pdf_hash', p_pdf_hash,
                         'queued_at', now(), 'queue_priority', p_priority)
    ) RETURNING id INTO draft_id;
    created := true;
  END IF;

  UPDATE public.property_pdf_uploads SET property_id = draft_id WHERE id = p_upload_id;
  RETURN jsonb_build_object('state', 'ready', 'propertyId', draft_id, 'created', created);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_property_pdf_upload(uuid, text, integer),
  public.finalize_property_pdf_upload(uuid, uuid, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_property_pdf_upload(uuid, text, integer),
  public.finalize_property_pdf_upload(uuid, uuid, text, boolean) TO service_role;

COMMIT;
