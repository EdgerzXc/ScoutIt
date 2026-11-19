BEGIN;

REVOKE INSERT (pdf_source_url), UPDATE (pdf_source_url)
ON TABLE public.properties FROM PUBLIC, anon, authenticated;

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

  UPDATE public.properties
     SET pdf_verified = true
   WHERE id = p_property_id
     AND creation_source = 'pdf_assisted'
     AND pipeline_status = 'pending'
     AND pdf_verified IS NOT TRUE
     AND pdf_source_url = p_source_path
     AND jsonb_build_object(
       'title', title, 'location', location, 'space_category', space_category,
       'price', price, 'description', description, 'media_link', media_link,
       'floor_sqm', details->'floor_sqm', 'lot_sqm', details->'lot_sqm',
       'beds', details->'beds', 'baths', details->'baths', 'parking', details->'parking'
     ) = p_reviewed_draft;

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

REVOKE ALL ON FUNCTION public.record_property_pdf_review(uuid, text, uuid, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_property_pdf_review(uuid, text, uuid, jsonb) TO service_role;

COMMIT;
