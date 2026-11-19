BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-documents-temp', 'property-documents-temp', false, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Property queue documents require server access" ON storage.objects;
CREATE POLICY "Property queue documents require server access"
ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (bucket_id <> 'property-documents-temp')
WITH CHECK (bucket_id <> 'property-documents-temp');

COMMIT;
