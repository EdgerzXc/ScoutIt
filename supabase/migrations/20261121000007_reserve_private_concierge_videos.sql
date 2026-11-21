BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-videos-temp', 'property-videos-temp', false, 52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska']
)
ON CONFLICT (id) DO UPDATE SET
  public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY concierge_videos_require_signed_access
  ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (bucket_id <> 'property-videos-temp')
  WITH CHECK (bucket_id <> 'property-videos-temp');

CREATE TABLE public.concierge_video_uploads (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL,
  property_id uuid NOT NULL,
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  declared_mime text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes BETWEEN 12 AND 52428800),
  style_preset text NOT NULL CHECK (style_preset IN ('minimalist_organic', 'modern_executive', 'tropical_luxury')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '1 day',
  completed_at timestamptz
);
ALTER TABLE public.concierge_video_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.concierge_video_uploads FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_video_uploads TO service_role;
CREATE INDEX concierge_video_owner_activity ON public.concierge_video_uploads (owner_id, created_at);
CREATE INDEX concierge_video_expiry ON public.concierge_video_uploads (expires_at) WHERE completed_at IS NULL;

ALTER TABLE public.video_upload_queue ADD COLUMN style_preset text;

CREATE FUNCTION public.reserve_concierge_video_upload(
  p_id uuid, p_owner text, p_property uuid, p_style text, p_filename text,
  p_size bigint, p_extension text, p_mime text
) RETURNS jsonb
LANGUAGE plpgsql SET search_path = pg_catalog, public
AS $$
DECLARE
  existing public.concierge_video_uploads%ROWTYPE;
  object_path text;
BEGIN
  IF p_owner IS NULL OR p_owner !~ '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' OR
     p_extension IS NULL OR p_mime IS NULL OR
     (p_extension, p_mime) NOT IN (('mp4', 'video/mp4'), ('mov', 'video/quicktime'),
       ('webm', 'video/webm'), ('mkv', 'video/x-matroska')) OR
     p_filename IS NULL OR char_length(p_filename) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Invalid video metadata' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('concierge_video:' || p_owner, 0));
  IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = p_property AND owner_id = p_owner) THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  object_path := p_owner || '/' || p_id::text || '.' || p_extension;
  SELECT * INTO existing FROM public.concierge_video_uploads WHERE id = p_id;
  IF FOUND THEN
    IF (existing.owner_id, existing.property_id, existing.style_preset, existing.original_filename,
        existing.size_bytes, existing.declared_mime, existing.storage_path)
        IS DISTINCT FROM (p_owner, p_property, p_style, p_filename, p_size, p_mime, object_path) THEN
      RETURN jsonb_build_object('status', 'conflict');
    END IF;
    IF existing.completed_at IS NOT NULL THEN
      RETURN jsonb_build_object('status', 'completed');
    END IF;
    -- Allow enough time for the provider's two-hour upload capability to expire before cleanup.
    IF existing.expires_at <= clock_timestamp() + interval '2 hours 10 minutes' THEN
      RETURN jsonb_build_object('status', 'expired');
    END IF;
    RETURN jsonb_build_object('status', 'reserved', 'path', existing.storage_path);
  END IF;

  IF (SELECT count(*) FROM public.concierge_video_uploads
      WHERE owner_id = p_owner AND created_at > now() - interval '1 day') >= 3 THEN
    RETURN jsonb_build_object('status', 'limit');
  END IF;
  INSERT INTO public.concierge_video_uploads
    (id, owner_id, property_id, storage_path, original_filename, declared_mime, size_bytes, style_preset)
  VALUES (p_id, p_owner, p_property, object_path, p_filename, p_mime, p_size, p_style)
  ON CONFLICT (id) DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'conflict'); END IF;
  RETURN jsonb_build_object('status', 'reserved', 'path', object_path);
END;
$$;

CREATE FUNCTION public.complete_concierge_video_upload(
  p_id uuid, p_owner text, p_version text, p_detected_mime text
) RETURNS text
LANGUAGE plpgsql SET search_path = pg_catalog, public
AS $$
DECLARE
  upload public.concierge_video_uploads%ROWTYPE;
BEGIN
  SELECT * INTO upload FROM public.concierge_video_uploads
    WHERE id = p_id AND owner_id = p_owner FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF upload.completed_at IS NOT NULL THEN RETURN 'completed'; END IF;
  IF upload.expires_at <= clock_timestamp() THEN RETURN 'expired'; END IF;

  PERFORM 1 FROM public.properties WHERE id = upload.property_id AND owner_id = p_owner FOR SHARE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF p_detected_mime IS DISTINCT FROM (CASE WHEN upload.declared_mime IN ('video/quicktime', 'video/mp4')
       THEN 'video/mp4' ELSE 'video/webm' END) THEN
    RETURN 'changed';
  END IF;
  PERFORM 1 FROM storage.objects obj
    WHERE obj.bucket_id = 'property-videos-temp' AND obj.name = upload.storage_path
      AND obj.archived_at IS NULL AND obj.is_delete_marker IS NOT TRUE
      AND obj.version = NULLIF(p_version, '')
      AND obj.metadata->>'size' = upload.size_bytes::text
      AND obj.metadata->>'mimetype' = upload.declared_mime
    FOR SHARE;
  IF NOT FOUND THEN RETURN 'changed'; END IF;

  INSERT INTO public.file_scans
    (bucket, storage_path, uploader_id, property_id, original_filename,
     declared_mime, detected_mime, size_bytes, scan_status)
  VALUES ('property-videos-temp', upload.storage_path, p_owner, upload.property_id::text,
    upload.original_filename, upload.declared_mime, p_detected_mime, upload.size_bytes, 'pending_scan');

  INSERT INTO public.video_upload_queue
    (id, owner_id, property_id, storage_path, original_filename, file_size_bytes, status, style_preset)
  VALUES (p_id, p_owner, upload.property_id::text, upload.storage_path, upload.original_filename,
    upload.size_bytes, 'pending_luma', upload.style_preset);

  UPDATE public.concierge_video_uploads SET completed_at = now() WHERE id = p_id;
  RETURN 'completed';
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_concierge_video_upload(uuid, text, uuid, text, text, bigint, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_concierge_video_upload(uuid, text, uuid, text, text, bigint, text, text)
  TO service_role;
REVOKE ALL ON FUNCTION public.complete_concierge_video_upload(uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_concierge_video_upload(uuid, text, text, text)
  TO service_role;

COMMIT;
