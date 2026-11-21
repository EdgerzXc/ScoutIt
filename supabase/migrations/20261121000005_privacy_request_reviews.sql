BEGIN;

CREATE TABLE public.privacy_request_reviews (
  contact_id uuid PRIMARY KEY REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('under_review', 'fulfilled', 'rejected')),
  verified_subject_id uuid,
  revision integer NOT NULL CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.privacy_request_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.privacy_request_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.privacy_request_reviews TO service_role;

CREATE FUNCTION public.privacy_request_kind(p_subject text, p_message text)
RETURNS text LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT CASE
    WHEN value !~ '\m(privacy|data subject|erase|erasure|delete|deletion|rectif[[:alpha:]]*|ra[[:space:]]*10173|dpa|gdpr|personal data|right to access|data portability)\M'
      THEN NULL
    WHEN value ~ '\m(erase|erasure|delete|deletion|blocking)\M' THEN 'erasure'
    WHEN value ~ '\m(correct|rectif[[:alpha:]]*|update details)\M' THEN 'rectification'
    WHEN value ~ '\m(data portability|transfer my data)\M' THEN 'portability'
    WHEN value ~ '\m(access|copy of data|export)\M' THEN 'access'
    ELSE 'privacy_inquiry'
  END FROM (SELECT lower(concat_ws(' ', p_subject, p_message)) AS value) AS text_input;
$$;

CREATE FUNCTION public.list_privacy_requests()
RETURNS TABLE (id uuid, name text, email text, subject text, message text, created_at timestamptz,
  request_kind text, review_status text, revision integer, signed_in boolean, subject_verified boolean)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT contact.id, contact.name, contact.email, contact.subject, contact.message, contact.created_at,
    kind.value, COALESCE(review.status, 'pending'), COALESCE(review.revision, 0),
    contact.user_id IS NOT NULL, review.verified_subject_id IS NOT NULL
  FROM public.contact_messages contact
  LEFT JOIN public.privacy_request_reviews review ON review.contact_id = contact.id
  CROSS JOIN LATERAL (SELECT public.privacy_request_kind(contact.subject, contact.message) AS value) kind
  WHERE contact.status <> 'spam' AND kind.value IS NOT NULL
  ORDER BY CASE WHEN review.status IN ('fulfilled', 'rejected') THEN 1 ELSE 0 END, contact.created_at, contact.id
  LIMIT 150;
$$;

CREATE FUNCTION public.review_privacy_request(p_request uuid, p_actor uuid, p_revision integer, p_status text,
  p_notes text, p_verify_subject boolean DEFAULT false, p_closed_account_event uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  staff_tier smallint;
  contact public.contact_messages%ROWTYPE;
  previous public.privacy_request_reviews%ROWTYPE;
  request_kind text;
  subject uuid;
  verified_subject uuid;
  notes text := NULLIF(btrim(p_notes), '');
  next_revision integer;
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('under_review', 'fulfilled', 'rejected')
    OR COALESCE(char_length(notes), 0) NOT BETWEEN 10 AND 1000 OR COALESCE(p_revision, -1) < 0 THEN
    RETURN jsonb_build_object('state', 'invalid');
  END IF;

  SELECT tier INTO staff_tier FROM public.admin_users WHERE id = p_actor AND active IS TRUE FOR SHARE;
  IF NOT FOUND OR COALESCE(staff_tier, 0) < 2 THEN RETURN jsonb_build_object('state', 'denied'); END IF;

  SELECT * INTO contact FROM public.contact_messages WHERE id = p_request AND status <> 'spam' FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('state', 'unavailable'); END IF;
  request_kind := public.privacy_request_kind(contact.subject, contact.message);
  IF request_kind IS NULL THEN RETURN jsonb_build_object('state', 'unavailable'); END IF;

  SELECT * INTO previous FROM public.privacy_request_reviews WHERE contact_id = p_request FOR UPDATE;
  IF COALESCE(previous.revision, 0) <> p_revision OR previous.status IN ('fulfilled', 'rejected') THEN
    RETURN jsonb_build_object('state', 'changed');
  END IF;

  subject := previous.verified_subject_id;
  IF p_verify_subject THEN
    IF p_closed_account_event IS NULL THEN
      verified_subject := contact.user_id;
    ELSIF staff_tier >= 3 AND contact.user_id IS NULL THEN
      SELECT record_id::uuid INTO verified_subject FROM public.audit_logs
      WHERE id = p_closed_account_event AND action = 'ACCOUNT_DELETED_RIGHT_TO_ERASURE'
        AND metadata->'auth_user_removed' = 'true'::jsonb
        AND record_id ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$';
    END IF;
    IF p_status <> 'under_review' OR verified_subject IS NULL
      OR (subject IS NOT NULL AND subject <> verified_subject) THEN
      RETURN jsonb_build_object('state', 'identity_unavailable');
    END IF;
    subject := verified_subject;
  END IF;

  IF p_status = 'fulfilled' AND request_kind = 'erasure' THEN
    RETURN jsonb_build_object('state', 'erasure_evidence_required');
  END IF;
  IF p_status = 'fulfilled' AND request_kind <> 'privacy_inquiry' AND subject IS NULL THEN
    RETURN jsonb_build_object('state', 'identity_required');
  END IF;

  next_revision := p_revision + 1;
  INSERT INTO public.privacy_request_reviews (contact_id, status, verified_subject_id, revision)
  VALUES (p_request, p_status, subject, next_revision)
  ON CONFLICT (contact_id) DO UPDATE SET
    status = EXCLUDED.status, verified_subject_id = EXCLUDED.verified_subject_id,
    revision = EXCLUDED.revision, updated_at = clock_timestamp();

  INSERT INTO public.mission_control_actions (actor_id, actor_tier, action, target_table, target_id, reason, metadata)
  VALUES (p_actor, staff_tier, 'privacy.dsr_' || p_status, 'contact_messages', p_request::text, notes,
    jsonb_build_object('from_status', COALESCE(previous.status, 'pending'), 'status', p_status,
      'request_kind', request_kind, 'revision', next_revision, 'subject_verified', subject IS NOT NULL,
      'closure_audit_id', CASE WHEN p_verify_subject THEN p_closed_account_event END));
  RETURN jsonb_build_object('state', 'saved', 'status', p_status, 'revision', next_revision,
    'subjectVerified', subject IS NOT NULL);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.privacy_request_kind(text, text), public.list_privacy_requests(),
  public.review_privacy_request(uuid, uuid, integer, text, text, boolean, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.privacy_request_kind(text, text), public.list_privacy_requests(),
  public.review_privacy_request(uuid, uuid, integer, text, text, boolean, uuid) TO service_role;

COMMIT;
