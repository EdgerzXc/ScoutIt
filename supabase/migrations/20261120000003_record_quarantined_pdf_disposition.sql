BEGIN;

CREATE TABLE public.property_pdf_source_dispositions (
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  source_path text NOT NULL,
  staff_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (property_id, source_path)
);

ALTER TABLE public.property_pdf_source_dispositions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.property_pdf_source_dispositions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.property_pdf_source_dispositions TO service_role;

CREATE FUNCTION public.record_quarantined_property_pdf_disposition(
  p_property_id uuid,
  p_source_path text,
  p_staff_id uuid
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

  PERFORM 1 FROM public.properties
   WHERE id = p_property_id
     AND creation_source = 'pdf_assisted'
     AND pipeline_status = 'quarantined'
     AND pdf_verified IS NOT TRUE
     AND pdf_source_url = p_source_path
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.property_pdf_source_dispositions (property_id, source_path, staff_id)
  VALUES (p_property_id, p_source_path, p_staff_id)
  ON CONFLICT (property_id, source_path) DO NOTHING;

  IF FOUND THEN
    INSERT INTO public.audit_logs
      (action, table_name, record_id, user_id, resource_type, resource_id, metadata)
    VALUES
      ('PDF_QUARANTINE_DISCARD_APPROVED', 'properties', p_property_id::text, p_staff_id::text,
       'properties', p_property_id::text, '{"decision":"discard_unusable_source"}'::jsonb);
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_quarantined_property_pdf_disposition(uuid, text, uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_quarantined_property_pdf_disposition(uuid, text, uuid) TO service_role;

COMMIT;
