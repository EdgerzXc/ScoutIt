BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-videos-temp',
  'property-videos-temp',
  false,
  52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
