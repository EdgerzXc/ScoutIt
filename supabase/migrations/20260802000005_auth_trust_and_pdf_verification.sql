-- LR-05: Auth, listing trust, PDF verification, PRC verification, and reproducible schema baseline.
-- Additive only. Review and apply through the approved Supabase migration workflow.

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS creation_source TEXT DEFAULT 'manual' CHECK (creation_source IN ('manual', 'advanced', 'csv', 'pdf_assisted'));
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS pdf_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS pdf_source_url TEXT;

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS prc_license TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS dhsud_number TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS prc_expiry DATE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS prc_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS prc_verified_at TIMESTAMPTZ;

-- RPC to verify PDF-assisted listing drafts against source document before initial publication
CREATE OR REPLACE FUNCTION public.verify_pdf_draft(
  p_property_id UUID,
  p_verifier_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET pdf_verified = TRUE, updated_at = now()
  WHERE id = p_property_id AND creation_source = 'pdf_assisted';

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_pdf_draft(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_pdf_draft(UUID, TEXT) TO service_role;
