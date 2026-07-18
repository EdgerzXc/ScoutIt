-- Calendar Sync — Phase 2: encrypted OAuth connection store (2026-07-18).
--
-- One row per (user, provider) holding that user's Google/Calendly connection.
-- Access + refresh tokens are stored ENCRYPTED (AES-256-GCM via
-- src/lib/calendar/tokenCrypto.js) — the plaintext never touches the DB, and
-- the token columns are never returned to the client.
--
-- Applied to the live DB deliberately. owner_user_id is TEXT to match the
-- calendar_events / crm_tasks convention.

CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     TEXT NOT NULL,
  provider          TEXT NOT NULL,                       -- 'google' | 'calendly'
  account_email     TEXT,                                -- the connected account (display only)

  access_token_enc  TEXT,                                -- AES-256-GCM ciphertext
  refresh_token_enc TEXT,                                -- AES-256-GCM ciphertext
  token_expires_at  TIMESTAMPTZ,
  scope             TEXT,

  status            TEXT NOT NULL DEFAULT 'active',      -- active | error | revoked
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (owner_user_id, provider)
);

CREATE INDEX IF NOT EXISTS calendar_connections_owner_idx
  ON public.calendar_connections (owner_user_id);

DROP TRIGGER IF EXISTS calendar_connections_touch_updated_at ON public.calendar_connections;
CREATE TRIGGER calendar_connections_touch_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_calendar_events_updated_at();

-- RLS: only the owner may read their own connection metadata. Writes happen via
-- the service-role client in the OAuth routes (which bypasses RLS and scopes by
-- resolveUserId). The token columns are never selected by client-facing code.
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_connections_select_own ON public.calendar_connections;
CREATE POLICY calendar_connections_select_own ON public.calendar_connections
  FOR SELECT USING (owner_user_id = auth.uid()::text);
