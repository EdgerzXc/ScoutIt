-- A-144: Connect Rules v1 — blocks, receiver gates, enterprise free inquiry, reveal audit.
--
-- STATUS: PREPARED, NOT APPLIED. Application is owner-gated (O-004): each
-- migration is shown with its rehearsal and applied on its own go. Do NOT
-- apply by editing code or running db push in this turn.
--
-- What this adds (all additive, all RLS-enabled, service-role writes only):
--   1. public.connect_blocks(blocker_id, blocked_id) — invariant #6.
--   2. user_profiles.accepting_connects (default true) + max_pending_connects
--      (default NULL = no cap) — receiver controls §8. Columns are additive;
--      app code treats missing columns as allow (see src/lib/connectGates.js).
--   3. public.enterprise_inquiry_forms + public.enterprise_inquiries — §13.
--   4. public.identity_reveal_events — §14 audit (minimal columns only).
--
-- Rule 8: no SECURITY DEFINER functions are created here, so no EXECUTE
-- grants are needed. All tables deny anon/authenticated writes; reads are
-- owner-scoped (own blocks, own inquiries) or service-role only.

-- 1. Connect blocks ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connect_blocks (
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT connect_blocks_pkey PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT connect_blocks_no_self CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS connect_blocks_blocked_idx
  ON public.connect_blocks (blocked_id, blocker_id);

ALTER TABLE public.connect_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own blocks" ON public.connect_blocks;
CREATE POLICY "Users read own blocks"
  ON public.connect_blocks FOR SELECT
  USING (auth.uid()::text = blocker_id);
-- No INSERT/UPDATE/DELETE policies: writes go through service-role routes only.

-- 2. Receiver gates (additive columns) ---------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS accepting_connects BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS max_pending_connects INTEGER DEFAULT NULL;
-- Guard the cap when present: negative caps are meaningless.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_pending_cap_nonneg'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_pending_cap_nonneg
      CHECK (max_pending_connects IS NULL OR max_pending_connects >= 0);
  END IF;
END $$;

-- 3. Enterprise free inquiry --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enterprise_inquiry_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  field_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  routing_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enterprise_inquiry_forms_enterprise_idx
  ON public.enterprise_inquiry_forms (enterprise_id, enabled);

CREATE TABLE IF NOT EXISTS public.enterprise_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id TEXT NOT NULL,
  form_id UUID REFERENCES public.enterprise_inquiry_forms(id) ON DELETE SET NULL,
  sender_id TEXT NOT NULL,
  identity_mode TEXT NOT NULL DEFAULT 'public',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  assigned_team TEXT,
  assigned_user TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enterprise_inquiries_enterprise_idx
  ON public.enterprise_inquiries (enterprise_id, created_at DESC);
CREATE INDEX IF NOT EXISTS enterprise_inquiries_sender_idx
  ON public.enterprise_inquiries (sender_id, created_at DESC);

ALTER TABLE public.enterprise_inquiry_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_inquiries ENABLE ROW LEVEL SECURITY;
-- Reads: enterprise members read their own org's rows via service role; no
-- direct anon/authenticated policies (service-role routes only).

-- 4. Identity reveal audit (minimal) ------------------------------------------
CREATE TABLE IF NOT EXISTS public.identity_reveal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  reveal_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS identity_reveal_events_thread_idx
  ON public.identity_reveal_events (thread_id, created_at);

ALTER TABLE public.identity_reveal_events ENABLE ROW LEVEL SECURITY;
-- No direct client policies; service-role routes only.

COMMENT ON TABLE public.connect_blocks IS
  'A-144 invariant #6: blocker prevents future Connect sends from blocked_id. Checked before spend; blocked sends fail with 0 spend.';
COMMENT ON TABLE public.enterprise_inquiries IS
  'A-144 §13: zero-Connect inbound inquiries on Enterprise-configured forms only. UI must label entry points Free Inquiry.';
