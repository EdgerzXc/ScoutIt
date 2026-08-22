-- Versioned, server-recorded legal acceptance for invited-pilot onboarding.
-- Additive only. Existing profiles remain incomplete until they explicitly
-- accept the current published version through the authenticated server route.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

CREATE TABLE IF NOT EXISTS public.terms_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  terms_snapshot_hash TEXT NOT NULL CHECK (terms_snapshot_hash ~ '^[a-f0-9]{64}$'),
  acceptance_method TEXT NOT NULL,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, terms_version)
);

ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.terms_acceptances IS
  'Append-only evidence written by authenticated server routes via service_role; never by browsers.';

REVOKE ALL ON TABLE public.terms_acceptances FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.terms_acceptances TO service_role;

-- The profile projection is server-written. Browser roles keep whatever
-- existing user_profiles privileges production requires, while these columns
-- remain protected by the route contract and RLS.
REVOKE UPDATE (terms_accepted_at, terms_version)
  ON TABLE public.user_profiles
  FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user_time
  ON public.terms_acceptances (user_id, accepted_at DESC);
