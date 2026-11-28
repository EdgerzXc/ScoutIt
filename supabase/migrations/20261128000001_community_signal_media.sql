BEGIN;

CREATE TABLE public.signal_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid NOT NULL REFERENCES public.stratosphere_signals(id) ON DELETE CASCADE,
  position smallint NOT NULL,
  kind text NOT NULL,
  state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved', 'review', 'approved', 'rejected')),
  locator text,
  alt_text text NOT NULL DEFAULT '' CHECK (length(alt_text) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  reviewed_at timestamptz,
  UNIQUE (signal_id, position),
  CHECK ((kind = 'photo' AND position BETWEEN 0 AND 2) OR (kind = 'video' AND position = 3)),
  CHECK (state = 'reserved' OR locator IS NOT NULL)
);

CREATE INDEX signal_media_review_idx ON public.signal_media (state, created_at);
ALTER TABLE public.signal_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.signal_media FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_media TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signal-photos', 'signal-photos', false, 819200, ARRAY['image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'signal-photos' AND public = false) THEN
    RAISE EXCEPTION 'Signal photos require a private storage bucket';
  END IF;
END $$;

COMMIT;
