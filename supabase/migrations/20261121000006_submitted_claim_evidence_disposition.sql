BEGIN;

CREATE TABLE public.claim_evidence_dispositions (
  document_id uuid PRIMARY KEY,
  path_digest text NOT NULL CHECK (path_digest ~ '^[0-9a-f]{64}$'),
  claim_id uuid,
  subject_id uuid,
  property_id uuid,
  status text NOT NULL DEFAULT 'retained' CHECK (status IN ('retained','held','removing','erased')),
  revision integer NOT NULL DEFAULT 0,
  request_id uuid,
  lease uuid,
  leased_until timestamptz,
  removal_path text,
  removal_version text
);
CREATE INDEX claim_evidence_subject_idx ON public.claim_evidence_dispositions(subject_id, document_id);
CREATE INDEX claim_evidence_digest_idx ON public.claim_evidence_dispositions(path_digest);
CREATE INDEX claim_evidence_request_idx ON public.claim_evidence_dispositions(request_id) WHERE request_id IS NOT NULL;
ALTER TABLE public.claim_evidence_dispositions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.claim_evidence_dispositions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.claim_evidence_dispositions TO service_role;

INSERT INTO public.claim_evidence_dispositions(document_id,path_digest,claim_id,subject_id,property_id)
SELECT doc.id, encode(sha256(convert_to(doc.private_storage_path,'UTF8')),'hex'),
    claim.id, claim.claimant_user_id, claim.property_id
FROM public.property_claim_documents doc JOIN public.property_claims claim ON claim.id = doc.claim_id
WHERE claim.status <> 'draft';

CREATE FUNCTION public.record_claim_evidence_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE
  linked_claim public.property_claims%ROWTYPE;
BEGIN
  IF TG_TABLE_NAME = 'property_claim_documents' THEN
    SELECT * INTO linked_claim FROM public.property_claims WHERE id = NEW.claim_id FOR SHARE;
    IF linked_claim.status <> 'draft' THEN
      INSERT INTO public.claim_evidence_dispositions(document_id,path_digest,claim_id,subject_id,property_id)
      VALUES (NEW.id,encode(sha256(convert_to(NEW.private_storage_path,'UTF8')),'hex'),
        linked_claim.id,linked_claim.claimant_user_id,linked_claim.property_id)
      ON CONFLICT (document_id) DO NOTHING;
    END IF;
  ELSIF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
    INSERT INTO public.claim_evidence_dispositions(document_id,path_digest,claim_id,subject_id,property_id)
    SELECT id,encode(sha256(convert_to(private_storage_path,'UTF8')),'hex'),
      NEW.id,NEW.claimant_user_id,NEW.property_id
    FROM public.property_claim_documents WHERE claim_id = NEW.id
    ON CONFLICT (document_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_record_claim_evidence_identity AFTER INSERT ON public.property_claim_documents
  FOR EACH ROW EXECUTE FUNCTION public.record_claim_evidence_identity();
CREATE TRIGGER trg_record_submitted_evidence_identity AFTER UPDATE OF status ON public.property_claims
  FOR EACH ROW EXECUTE FUNCTION public.record_claim_evidence_identity();

CREATE FUNCTION public.guard_claim_evidence_reuse()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE
  digest text := encode(sha256(convert_to(NEW.private_storage_path,'UTF8')),'hex');
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF ROW(NEW.id,NEW.claim_id,NEW.private_storage_path) IS DISTINCT FROM ROW(OLD.id,OLD.claim_id,OLD.private_storage_path) THEN
      RAISE EXCEPTION 'claim evidence identity is immutable' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(digest,0));
  IF EXISTS (SELECT 1 FROM public.claim_evidence_dispositions e
    WHERE e.path_digest = digest OR e.document_id = NEW.id) OR EXISTS (
    SELECT 1 FROM public.property_claim_documents d
    WHERE d.private_storage_path = NEW.private_storage_path AND d.id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'claim evidence path is already in use' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_claim_evidence_reuse BEFORE INSERT OR UPDATE OF id,claim_id,private_storage_path
  ON public.property_claim_documents FOR EACH ROW EXECUTE FUNCTION public.guard_claim_evidence_reuse();

CREATE FUNCTION public.keep_pending_evidence_case_open()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF (TG_OP = 'DELETE' OR NEW.status <> 'under_review' OR NEW.verified_subject_id IS DISTINCT FROM OLD.verified_subject_id)
    AND EXISTS (SELECT 1 FROM public.claim_evidence_dispositions
      WHERE request_id=OLD.contact_id AND status='removing') THEN
    RAISE EXCEPTION 'claim evidence removal is awaiting confirmation' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_keep_pending_evidence_case_open BEFORE UPDATE OF status,verified_subject_id OR DELETE
  ON public.privacy_request_reviews FOR EACH ROW EXECUTE FUNCTION public.keep_pending_evidence_case_open();

CREATE FUNCTION public.keep_pending_evidence_contact_visible()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF (NEW.status = 'spam' OR public.privacy_request_kind(NEW.subject,NEW.message) IS DISTINCT FROM 'erasure')
    AND EXISTS (SELECT 1 FROM public.claim_evidence_dispositions
      WHERE request_id=OLD.id AND status='removing') THEN
    RAISE EXCEPTION 'claim evidence removal is awaiting confirmation' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_keep_pending_evidence_contact_visible BEFORE UPDATE OF status,subject,message
  ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.keep_pending_evidence_contact_visible();

CREATE FUNCTION public.list_claim_evidence_for_erasure(p_request uuid,p_actor uuid,p_after uuid DEFAULT NULL)
RETURNS TABLE(document_id uuid, claim_id uuid, property_id uuid, status text, revision integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT e.document_id,e.claim_id,e.property_id,e.status,e.revision
  FROM public.privacy_request_reviews review
  JOIN public.contact_messages contact ON contact.id = review.contact_id
  JOIN public.claim_evidence_dispositions e ON e.subject_id = review.verified_subject_id
    OR (e.request_id = review.contact_id AND e.status = 'erased')
  WHERE review.contact_id = p_request AND review.status = 'under_review' AND review.verified_subject_id IS NOT NULL
    AND contact.status <> 'spam' AND public.privacy_request_kind(contact.subject,contact.message) = 'erasure'
    AND (p_after IS NULL OR e.document_id > p_after)
    AND EXISTS (SELECT 1 FROM public.admin_users staff WHERE staff.id = p_actor AND staff.active AND staff.tier >= 3)
  ORDER BY e.document_id LIMIT 21;
$$;

CREATE FUNCTION public.review_claim_evidence_disposition(p_request uuid,p_document uuid,p_actor uuid,
  p_revision integer,p_action text,p_notes text,p_lease uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  staff_tier smallint;
  evidence public.claim_evidence_dispositions%ROWTYPE;
  subject uuid;
  path text;
  reviewed_version text;
  next_lease uuid;
  expires_at timestamptz;
  note text := NULLIF(btrim(p_notes),'');
BEGIN
  IF p_action IS NULL OR p_action NOT IN ('hold','release','remove','confirm','retry')
    OR COALESCE(char_length(note),0) NOT BETWEEN 12 AND 1000 THEN
    RETURN jsonb_build_object('state','invalid');
  END IF;
  SELECT tier INTO staff_tier FROM public.admin_users WHERE id=p_actor AND active IS TRUE FOR SHARE;
  IF NOT FOUND OR COALESCE(staff_tier,0) < 3 THEN RETURN jsonb_build_object('state','denied'); END IF;

  SELECT review.verified_subject_id INTO subject FROM public.privacy_request_reviews review
  JOIN public.contact_messages contact ON contact.id=review.contact_id
  WHERE review.contact_id=p_request AND review.status='under_review'
    AND (contact.status <> 'spam' OR p_action IN ('confirm','retry'))
    AND public.privacy_request_kind(contact.subject,contact.message)='erasure'
  FOR SHARE OF review,contact;
  IF subject IS NULL THEN RETURN jsonb_build_object('state','identity_required'); END IF;

  SELECT * INTO evidence FROM public.claim_evidence_dispositions WHERE document_id=p_document FOR UPDATE;
  IF NOT FOUND OR evidence.subject_id IS DISTINCT FROM subject THEN RETURN jsonb_build_object('state','unavailable'); END IF;
  IF evidence.revision IS DISTINCT FROM p_revision THEN RETURN jsonb_build_object('state','changed'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(evidence.path_digest,0));

  IF p_action IN ('hold','release') THEN
    IF (p_action='hold' AND evidence.status <> 'retained') OR (p_action='release' AND evidence.status <> 'held') THEN
      RETURN jsonb_build_object('state','changed');
    END IF;
    UPDATE public.claim_evidence_dispositions SET status=CASE WHEN p_action='hold' THEN 'held' ELSE 'retained' END,
      revision=revision+1 WHERE document_id=p_document;
  ELSIF p_action IN ('confirm','retry') THEN
    IF evidence.status <> 'removing' OR evidence.request_id IS DISTINCT FROM p_request OR p_lease IS NULL
      OR evidence.lease IS DISTINCT FROM p_lease THEN RETURN jsonb_build_object('state','changed'); END IF;
    IF p_action='retry' THEN
      UPDATE public.claim_evidence_dispositions SET leased_until=now()
        WHERE document_id=p_document;
      RETURN jsonb_build_object('state','retry');
    END IF;
    IF EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='claim-documents' AND name=evidence.removal_path) THEN
      RETURN jsonb_build_object('state','storage_unconfirmed');
    END IF;
    DELETE FROM public.property_claim_documents WHERE id=p_document
      AND encode(sha256(convert_to(private_storage_path,'UTF8')),'hex')=evidence.path_digest;
    UPDATE public.claim_evidence_dispositions SET status='erased',revision=revision+1,lease=NULL,leased_until=NULL,
      removal_path=NULL,removal_version=NULL,subject_id=NULL,property_id=NULL,claim_id=NULL
    WHERE document_id=p_document;
  ELSE
    IF evidence.status='held' THEN RETURN jsonb_build_object('state','held'); END IF;
    IF evidence.status='removing' AND (evidence.request_id IS DISTINCT FROM p_request OR evidence.leased_until > now()) THEN
      RETURN jsonb_build_object('state','busy');
    END IF;
    IF EXISTS (SELECT 1 FROM public.claim_evidence_dispositions other
      WHERE other.path_digest=evidence.path_digest AND other.document_id<>p_document) THEN
      RETURN jsonb_build_object('state','ambiguous');
    END IF;
    IF EXISTS (SELECT 1 FROM public.property_claims claim WHERE claim.property_id=evidence.property_id
      AND (claim.id=evidence.claim_id OR claim.status='disputed')
      AND COALESCE(claim.status,'') NOT IN ('approved','rejected','withdrawn','closed')) OR EXISTS (
      SELECT 1 FROM public.deal_disputes dispute JOIN public.deals deal ON deal.id=dispute.deal_id
      WHERE deal.property_id=evidence.property_id AND dispute.status IN ('open_hold','under_review')
    ) THEN RETURN jsonb_build_object('state','held'); END IF;
    IF NOT EXISTS (SELECT 1 FROM public.properties listing WHERE listing.id=evidence.property_id
      AND ((listing.pipeline_status='off_market' AND listing.withdrawn_at IS NOT NULL) OR
        (listing.pipeline_status='archived' AND listing.archived_at IS NOT NULL) OR
        (listing.pipeline_status='permanently_removed' AND listing.permanently_removed_at IS NOT NULL)))
       AND NOT EXISTS (SELECT 1 FROM public.audit_logs audit JOIN public.user_profiles profile ON profile.id=audit.record_id
        WHERE audit.record_id=subject::text AND audit.action='ACCOUNT_DELETED_RIGHT_TO_ERASURE'
          AND audit.metadata->'auth_user_removed'='true'::jsonb AND profile.archived_at IS NOT NULL) THEN
      RETURN jsonb_build_object('state','retention_required');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='claim-documents' AND public IS FALSE
      AND COALESCE(lower(versioning_status::text),'disabled')='disabled') THEN
      RETURN jsonb_build_object('state','storage_unconfirmed');
    END IF;
    IF evidence.status='retained' THEN
      SELECT obj.name,obj.version INTO path,reviewed_version FROM storage.objects obj
      WHERE obj.bucket_id='claim-documents' AND obj.name LIKE subject::text || '/%'
        AND encode(sha256(convert_to(obj.name,'UTF8')),'hex')=evidence.path_digest
        AND obj.archived_at IS NULL AND obj.is_versioned IS NOT TRUE AND obj.is_delete_marker IS NOT TRUE;
      IF NOT FOUND OR COALESCE(reviewed_version,'')='' THEN RETURN jsonb_build_object('state','storage_unconfirmed'); END IF;
    ELSE
      path:=evidence.removal_path;
      reviewed_version:=evidence.removal_version;
    END IF;
    IF path IS NULL OR reviewed_version IS NULL THEN RETURN jsonb_build_object('state','storage_unconfirmed'); END IF;
    IF EXISTS (SELECT 1 FROM storage.objects obj WHERE obj.bucket_id='claim-documents' AND obj.name=path
      AND (obj.version IS DISTINCT FROM reviewed_version OR obj.archived_at IS NOT NULL
        OR obj.is_versioned IS TRUE OR obj.is_delete_marker IS TRUE)) THEN
      RETURN jsonb_build_object('state','storage_unconfirmed');
    END IF;
    next_lease:=gen_random_uuid();
    expires_at:=now()+interval '2 minutes';
    UPDATE public.claim_evidence_dispositions SET status='removing',request_id=p_request,
      lease=next_lease,leased_until=expires_at,removal_path=path,removal_version=reviewed_version
    WHERE document_id=p_document;
  END IF;

  INSERT INTO public.mission_control_actions(actor_id,actor_tier,action,target_table,target_id,reason,metadata)
  VALUES (p_actor,staff_tier,'privacy.claim_evidence_' || p_action,'claim_evidence_dispositions',p_document::text,note,
    jsonb_build_object('request_id',p_request,'revision',p_revision));
  IF p_action='remove' THEN
    RETURN jsonb_build_object('state','reserved','path',path,'version',reviewed_version,'lease',next_lease,'expiresAt',expires_at);
  END IF;
  RETURN jsonb_build_object('state','saved');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_claim_evidence_identity(), public.guard_claim_evidence_reuse(),
  public.keep_pending_evidence_case_open(), public.keep_pending_evidence_contact_visible(),
  public.list_claim_evidence_for_erasure(uuid,uuid,uuid),
  public.review_claim_evidence_disposition(uuid,uuid,uuid,integer,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_claim_evidence_for_erasure(uuid,uuid,uuid),
  public.review_claim_evidence_disposition(uuid,uuid,uuid,integer,text,text,uuid) TO service_role;

COMMIT;
