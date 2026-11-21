BEGIN;

ALTER TABLE public.property_claim_documents
  ADD COLUMN malware_scan_engine text,
  ADD COLUMN malware_scan_object_version text,
  ADD COLUMN malware_scan_lease uuid,
  ADD COLUMN malware_scan_available_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX claim_documents_scan_queue_idx
  ON public.property_claim_documents (malware_scan_available_at, id)
  WHERE malware_scan_status IN ('pending', 'scanning');

CREATE INDEX claim_documents_storage_path_idx ON public.property_claim_documents (private_storage_path);

UPDATE public.property_claim_documents SET malware_scan_status = 'pending', checksum = NULL
  WHERE malware_scan_status = 'clean' AND malware_scan_engine IS NULL;

CREATE TABLE public.claim_document_submission_marks (
  path_digest text PRIMARY KEY CHECK (path_digest ~ '^[0-9a-f]{64}$')
);
ALTER TABLE public.claim_document_submission_marks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.claim_document_submission_marks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.claim_document_submission_marks TO service_role;

INSERT INTO public.claim_document_submission_marks (path_digest)
  SELECT DISTINCT encode(sha256(convert_to(doc.private_storage_path, 'UTF8')), 'hex')
  FROM public.property_claim_documents doc JOIN public.property_claims claim ON claim.id = doc.claim_id
  WHERE claim.status <> 'draft';

CREATE POLICY "Claim evidence only through ScoutIt server"
  ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (bucket_id <> 'claim-documents') WITH CHECK (bucket_id <> 'claim-documents');

CREATE FUNCTION public.guard_fresh_claim_document()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects obj
    JOIN storage.buckets bucket ON bucket.id = obj.bucket_id AND bucket.public IS FALSE
    JOIN public.property_claims claim ON claim.id = NEW.claim_id
    JOIN public.properties listing ON listing.id = claim.property_id
    WHERE obj.bucket_id = 'claim-documents' AND obj.name = NEW.private_storage_path
      AND obj.archived_at IS NULL AND obj.is_delete_marker IS NOT TRUE
      AND obj.created_at > now() - interval '24 hours'
      AND split_part(obj.name, '/', 1) = claim.claimant_user_id::text
      AND split_part(obj.name, '/', 2) IN (listing.id::text, listing.slug, listing.canonical_slug)
      AND array_length(string_to_array(obj.name, '/'), 1) = 3
  ) THEN
    RAISE EXCEPTION 'claim attachment is unavailable' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (SELECT 1 FROM public.property_claims WHERE id = NEW.claim_id AND status <> 'draft') THEN
    INSERT INTO public.claim_document_submission_marks (path_digest)
    VALUES (encode(sha256(convert_to(NEW.private_storage_path, 'UTF8')), 'hex')) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_fresh_claim_document BEFORE INSERT ON public.property_claim_documents
  FOR EACH ROW EXECUTE FUNCTION public.guard_fresh_claim_document();

CREATE FUNCTION public.mark_submitted_claim_documents()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
    INSERT INTO public.claim_document_submission_marks (path_digest)
    SELECT encode(sha256(convert_to(private_storage_path, 'UTF8')), 'hex')
    FROM public.property_claim_documents WHERE claim_id = NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mark_submitted_claim_documents AFTER UPDATE OF status ON public.property_claims
  FOR EACH ROW EXECUTE FUNCTION public.mark_submitted_claim_documents();

CREATE FUNCTION public.lease_claim_document_scans(p_batch integer)
RETURNS TABLE (document_id uuid, lease uuid, object_path text, declared_mime text, byte_count bigint,
  claimant_id uuid, property_id uuid, slug text, canonical_slug text)
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  WITH pending AS (
    SELECT doc.id, claim.claimant_user_id, listing.id AS property_id, listing.slug, listing.canonical_slug
    FROM public.property_claim_documents doc
    JOIN public.property_claims claim ON claim.id = doc.claim_id
    JOIN public.properties listing ON listing.id = claim.property_id
    WHERE doc.malware_scan_status IN ('pending', 'scanning') AND doc.malware_scan_available_at <= now()
      AND claim.status IN ('submitted', 'technical_review', 'needs_information', 'human_review', 'disputed')
    ORDER BY doc.malware_scan_available_at, doc.id LIMIT LEAST(GREATEST(COALESCE(p_batch, 1), 1), 5)
    FOR UPDATE OF doc SKIP LOCKED
  )
  UPDATE public.property_claim_documents doc
  SET malware_scan_status = 'scanning', malware_scan_lease = gen_random_uuid(),
    malware_scan_available_at = now() + interval '5 minutes'
  FROM pending
  WHERE doc.id = pending.id
  RETURNING doc.id, doc.malware_scan_lease, doc.private_storage_path, doc.mime_type,
    doc.file_size_bytes, pending.claimant_user_id, pending.property_id, pending.slug, pending.canonical_slug;
$$;

CREATE FUNCTION public.finish_claim_document_scan(
  p_document uuid, p_lease uuid, p_status text, p_checksum text, p_version text
)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('pending', 'blocked', 'clean') THEN RETURN false; END IF;
  IF p_status = 'clean' AND (p_checksum IS NULL OR p_checksum !~ '^[0-9a-f]{64}$' OR COALESCE(p_version, '') = '') THEN
    RETURN false;
  END IF;
  UPDATE public.property_claim_documents doc
  SET malware_scan_status = p_status, malware_scan_lease = NULL,
    malware_scan_available_at = now() + interval '15 minutes',
    checksum = CASE WHEN p_status = 'clean' THEN p_checksum END,
    malware_scan_engine = CASE WHEN p_status = 'clean' THEN 'clamd-local-v1' END,
    malware_scan_object_version = CASE WHEN p_status = 'clean' THEN p_version END
  WHERE doc.id = p_document AND doc.malware_scan_lease = p_lease AND doc.malware_scan_status = 'scanning'
    AND doc.malware_scan_available_at > now()
    AND (p_status <> 'clean' OR EXISTS (
      SELECT 1 FROM storage.objects obj JOIN storage.buckets bucket ON bucket.id = obj.bucket_id
      WHERE obj.bucket_id = 'claim-documents' AND bucket.public IS FALSE AND obj.name = doc.private_storage_path
        AND obj.version = p_version AND obj.archived_at IS NULL AND obj.is_delete_marker IS NOT TRUE
    ));
  RETURN FOUND;
END;
$$;

CREATE FUNCTION public.guard_verified_claim_document_decision()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.decision_reason_code = 'documents_verified'
    AND ROW(OLD.status, OLD.decision_reason_code) IS DISTINCT FROM ROW(NEW.status, NEW.decision_reason_code)
    AND NOT EXISTS (
      SELECT 1 FROM public.property_claim_documents doc
      JOIN storage.objects obj ON obj.name = doc.private_storage_path AND obj.bucket_id = 'claim-documents'
      JOIN storage.buckets bucket ON bucket.id = obj.bucket_id AND bucket.public IS FALSE
      WHERE doc.claim_id = NEW.id AND doc.malware_scan_status = 'clean'
        AND doc.malware_scan_engine = 'clamd-local-v1' AND doc.checksum ~ '^[0-9a-f]{64}$'
        AND doc.malware_scan_object_version = obj.version AND obj.archived_at IS NULL AND obj.is_delete_marker IS NOT TRUE
    ) THEN
    RAISE EXCEPTION 'current verified claim evidence is required' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_verified_claim_document_decision BEFORE UPDATE OF status, decision_reason_code
  ON public.property_claims FOR EACH ROW EXECUTE FUNCTION public.guard_verified_claim_document_decision();

CREATE FUNCTION public.list_expired_claim_uploads()
RETURNS TABLE (object_path text, object_version text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT obj.name, obj.version
  FROM storage.objects obj JOIN storage.buckets bucket ON bucket.id = obj.bucket_id
  WHERE obj.bucket_id = 'claim-documents' AND bucket.public IS FALSE AND obj.created_at < now() - interval '48 hours'
    AND obj.archived_at IS NULL AND obj.is_delete_marker IS NOT TRUE AND COALESCE(obj.version, '') <> ''
    AND obj.name ~* '^([0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/){2}[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}_[a-z0-9._-]{1,180}$'
    AND NOT EXISTS (SELECT 1 FROM public.property_claim_documents doc WHERE doc.private_storage_path = obj.name)
    AND NOT EXISTS (SELECT 1 FROM public.claim_document_submission_marks mark
      WHERE mark.path_digest = encode(sha256(convert_to(obj.name, 'UTF8')), 'hex'))
  ORDER BY obj.created_at, obj.name LIMIT 25;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_fresh_claim_document(), public.guard_verified_claim_document_decision(),
  public.mark_submitted_claim_documents(),
  public.lease_claim_document_scans(integer), public.finish_claim_document_scan(uuid, uuid, text, text, text),
  public.list_expired_claim_uploads() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lease_claim_document_scans(integer),
  public.finish_claim_document_scan(uuid, uuid, text, text, text), public.list_expired_claim_uploads() TO service_role;

COMMIT;
