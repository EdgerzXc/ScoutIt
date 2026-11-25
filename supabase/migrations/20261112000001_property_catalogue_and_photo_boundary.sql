BEGIN;

DROP POLICY IF EXISTS "Public can read live properties" ON public.properties;
ALTER POLICY "Users can read their own properties" ON public.properties TO authenticated;

DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
UPDATE storage.buckets
SET file_size_limit = 4194304,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'property_photos';

COMMIT;
