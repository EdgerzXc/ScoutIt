-- PROPOSAL ONLY - NOT APPLIED TO LIVE DATABASE.
CREATE TABLE IF NOT EXISTS public.faq_block_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  faq_id UUID REFERENCES public.property_faqs(id) ON DELETE CASCADE,
  preflight_key TEXT,
  rule_code TEXT NOT NULL CHECK (rule_code IN ('email','ph_mobile','ph_landline','long_digit_run','messaging_handle','social_handle','external_link','bypass_solicitation')),
  block_context TEXT NOT NULL CHECK (block_context IN ('public_question','public_answer','owner_preflight_answer')),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((block_context = 'public_answer') = (faq_id IS NOT NULL)),
  CHECK ((block_context = 'owner_preflight_answer') = (preflight_key IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public.faq_block_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL UNIQUE REFERENCES public.faq_block_evidence(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  faq_id UUID REFERENCES public.property_faqs(id) ON DELETE SET NULL,
  preflight_key TEXT,
  rule_code TEXT NOT NULL,
  block_context TEXT NOT NULL,
  explanation TEXT NOT NULL CHECK (char_length(explanation) BETWEEN 10 AND 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','rejected')),
  reviewer_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewer_notes TEXT CHECK (reviewer_notes IS NULL OR char_length(reviewer_notes) <= 500),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_faq_appeals_user_status ON public.faq_block_appeals(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faq_appeals_review ON public.faq_block_appeals(status, created_at);
ALTER TABLE public.faq_block_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_block_appeals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can submit appeals" ON public.faq_block_appeals;
DROP POLICY IF EXISTS "Users can view own appeals" ON public.faq_block_appeals;
CREATE POLICY "Users can view own appeals" ON public.faq_block_appeals FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);
REVOKE ALL ON TABLE public.faq_block_evidence, public.faq_block_appeals FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.faq_block_appeals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.faq_block_evidence, public.faq_block_appeals TO service_role;

CREATE OR REPLACE FUNCTION public.submit_faq_block_appeal(p_evidence_id UUID, p_user_id TEXT, p_explanation TEXT)
RETURNS TABLE(appeal_id UUID, appeal_status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_evidence public.faq_block_evidence%ROWTYPE; v_appeal_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('faq-appeal:' || p_user_id, 0));
  SELECT * INTO v_evidence FROM public.faq_block_evidence WHERE id = p_evidence_id FOR UPDATE;
  IF NOT FOUND OR v_evidence.user_id IS DISTINCT FROM p_user_id OR v_evidence.used_at IS NOT NULL OR v_evidence.expires_at <= now() THEN
    RAISE EXCEPTION 'EVIDENCE_INVALID' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(*) FROM public.faq_block_appeals WHERE user_id = p_user_id AND status IN ('pending','under_review')) >= 3 THEN
    RAISE EXCEPTION 'APPEAL_LIMIT' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.faq_block_appeals(evidence_id,user_id,property_id,faq_id,preflight_key,rule_code,block_context,explanation)
  VALUES(v_evidence.id,v_evidence.user_id,v_evidence.property_id,v_evidence.faq_id,v_evidence.preflight_key,v_evidence.rule_code,v_evidence.block_context,p_explanation)
  RETURNING id INTO v_appeal_id;
  UPDATE public.faq_block_evidence SET used_at = now() WHERE id = v_evidence.id;
  RETURN QUERY SELECT v_appeal_id, 'pending'::TEXT;
END; $$;

CREATE OR REPLACE FUNCTION public.review_faq_block_appeal(p_appeal_id UUID,p_reviewer_id TEXT,p_expected_status TEXT,p_action TEXT,p_reviewer_notes TEXT DEFAULT NULL)
RETURNS TABLE(appeal_status TEXT, reviewed_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_next TEXT; v_now TIMESTAMPTZ := now();
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('faq-review:' || p_appeal_id::text, 0));
  v_next := CASE WHEN p_action='start_review' AND p_expected_status='pending' THEN 'under_review'
                 WHEN p_action='approve' AND p_expected_status='under_review' THEN 'approved'
                 WHEN p_action='reject' AND p_expected_status IN ('pending','under_review') THEN 'rejected' END;
  IF v_next IS NULL THEN RAISE EXCEPTION 'APPEAL_CONFLICT' USING ERRCODE='P0001'; END IF;
  UPDATE public.faq_block_appeals SET status=v_next, reviewer_id=p_reviewer_id, reviewer_notes=p_reviewer_notes,
    reviewed_at=CASE WHEN v_next IN ('approved','rejected') THEN v_now ELSE NULL END, updated_at=v_now
  WHERE id=p_appeal_id AND status=p_expected_status;
  IF NOT FOUND THEN RAISE EXCEPTION 'APPEAL_CONFLICT' USING ERRCODE='P0001'; END IF;
  RETURN QUERY SELECT v_next, CASE WHEN v_next IN ('approved','rejected') THEN v_now ELSE NULL END;
END; $$;
REVOKE ALL ON FUNCTION public.submit_faq_block_appeal(UUID,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.review_faq_block_appeal(UUID,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_faq_block_appeal(UUID,TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_faq_block_appeal(UUID,TEXT,TEXT,TEXT,TEXT) TO service_role;