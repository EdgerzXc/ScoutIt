BEGIN;

CREATE OR REPLACE FUNCTION public.property_pdf_review_facts(draft public.properties)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'title', draft.title,
    'location', draft.location,
    'type', draft.type,
    'space_category', draft.space_category,
    'price', draft.price,
    'description', draft.description,
    'media_link', draft.media_link,
    'floor_sqm', draft.details->'floor_sqm',
    'lot_sqm', draft.details->'lot_sqm',
    'beds', draft.details->'beds',
    'baths', draft.details->'baths',
    'parking', draft.details->'parking',
    'listing_details', CASE
      WHEN jsonb_typeof(draft.details) = 'object' THEN draft.details - ARRAY[
        'floor_sqm', 'lot_sqm', 'beds', 'baths', 'parking',
        'source_pdf', 'pdf_hash', 'filename', 'raw_text', 'storage_token',
        'temp_storage_path', 'pdf_deleted_at', 'queued_at', 'queue_priority',
        'process_attempts', 'last_attempt_at', 'processed_at',
        'pdf_verification_required', 'ai_confidence', 'ai_gaps',
        'quarantine_reason', 'quarantined_at', 'error'
      ]::text[]
      ELSE '{}'::jsonb
    END
  );
$$;

CREATE OR REPLACE FUNCTION public.read_property_pdf_review_facts(p_property_id uuid, p_source_path text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT public.property_pdf_review_facts(draft)
    FROM public.properties AS draft
   WHERE draft.id = p_property_id
     AND draft.creation_source = 'pdf_assisted'
     AND draft.pipeline_status = 'pending'
     AND draft.pdf_verified IS NOT TRUE
     AND draft.pdf_source_url = p_source_path;
$$;

CREATE OR REPLACE FUNCTION public.record_property_pdf_review(
  p_property_id uuid,
  p_source_path text,
  p_staff_id uuid,
  p_reviewed_draft jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_staff_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.properties AS draft
     SET pdf_verified = true
   WHERE draft.id = p_property_id
     AND draft.creation_source = 'pdf_assisted'
     AND draft.pipeline_status = 'pending'
     AND draft.pdf_verified IS NOT TRUE
     AND draft.pdf_source_url = p_source_path
     AND public.property_pdf_review_facts(draft) = p_reviewed_draft;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.audit_logs
    (action, table_name, record_id, user_id, resource_type, resource_id, metadata)
  VALUES
    ('PDF_DRAFT_VERIFIED', 'properties', p_property_id::text, p_staff_id::text,
     'properties', p_property_id::text, '{"source":"admin_console"}'::jsonb);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.property_pdf_review_facts(public.properties),
  public.read_property_pdf_review_facts(uuid, text),
  public.record_property_pdf_review(uuid, text, uuid, jsonb)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.property_pdf_review_facts(public.properties),
  public.read_property_pdf_review_facts(uuid, text),
  public.record_property_pdf_review(uuid, text, uuid, jsonb)
TO service_role;

COMMIT;
