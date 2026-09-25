-- A-145 P1 — community signal posting, feed, relevance and saves.
--
-- WHAT THIS ADDS (all additive, all service-role writes only):
--   stratosphere_signals  — one row per member post (demand, supply intent,
--     opportunity, observation, promotion, expansion). Samples never touch
--     these tables; every row here is a real account's post.
--   signal_locations      — the spatial anchor (city/district + optional
--     coordinates + precision level). A post without a meaningful scope is
--     refused by the API, not stored and hidden.
--   signal_requirements   — structured intent (transaction, space type,
--     budget/size ranges, timing, must-haves). Nullable throughout: a post
--     carries what its author stated, never a default identity (Rules 7/14).
--   signal_relevance      — Relevant-to-Me taps, one per account per signal
--     (UNIQUE). Relevance needs an account so one person cannot stuff the
--     count; anonymous visitors browse only.
--   signal_saves          — private bookmarks, one per account per signal.
--
-- WHAT IT DOES NOT ADD (later phases, separate migrations):
--   reports/moderation queues (P2), AI review rows (P3), Scout ID column on
--   user_profiles (the API derives a deterministic per-account Scout ID in
--   code instead — no user-table change needed).
--
-- SECURITY POSTURE (matches the seven broker tables): RLS enabled with zero
-- policies (deny-all), browser grants revoked explicitly below. Reads and
-- writes go through /api/community/* with the service role. The public feed
-- route serves LIVE rows only; expired/closed/removed rows never leave the
-- server. No SECURITY DEFINER function is created here.
--
-- STATUS: PREPARED, NOT APPLIED. Queued as O-004 row 11. Every /api/community
-- route fails closed (503 + honest message) until this lands.

BEGIN;

CREATE TABLE IF NOT EXISTS public.stratosphere_signals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The account behind the post. Never exposed publicly; the public face is
  -- scout_id_snapshot (anonymous) or the profile display name (public mode).
  author_account_id  text NOT NULL,
  -- Deterministic per-account pseudonym (see scoutIdFor in
  -- src/lib/communityPosting.js). Snapshot at write time so a later display
  -- rule change cannot rewrite history.
  scout_id_snapshot  text NOT NULL CHECK (scout_id_snapshot ~ '^SCOUT-[0-9]{4}$'),
  public_identity_mode text NOT NULL DEFAULT 'anonymous'
    CHECK (public_identity_mode IN ('anonymous', 'public', 'organization')),
  -- Locked launch set (spec §5). Promotion is a flag on the same set, never
  -- a ranking boost.
  signal_type        text NOT NULL
    CHECK (signal_type IN (
      'LOOKING_FOR', 'REPRESENTING_CLIENT', 'UPCOMING_SUPPLY',
      'BUSINESS_EXPANSION', 'OPPORTUNITY', 'MARKET_OBSERVATION',
      'COMMERCIAL_PROMOTION', 'SCOUTIT_INTELLIGENCE')),
  commercial_flag    boolean NOT NULL DEFAULT false,
  status             text NOT NULL DEFAULT 'live'
    CHECK (status IN (
      'live', 'needs_edit', 'limited', 'under_review',
      'removed', 'closed', 'expired')),
  title              text NOT NULL
    CHECK (length(title) BETWEEN 1 AND 140),
  body               text NOT NULL
    CHECK (length(body) BETWEEN 1 AND 2000),
  relevant_count     integer NOT NULL DEFAULT 0 CHECK (relevant_count >= 0),
  saved_count        integer NOT NULL DEFAULT 0 CHECK (saved_count >= 0),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  last_confirmed_at  timestamptz NOT NULL DEFAULT now(),
  closed_at          timestamptz NULL
);

CREATE TABLE IF NOT EXISTS public.signal_locations (
  signal_id       uuid PRIMARY KEY REFERENCES public.stratosphere_signals(id) ON DELETE CASCADE,
  country         text NOT NULL DEFAULT 'Philippines' CHECK (length(country) <= 80),
  region          text NOT NULL DEFAULT '' CHECK (length(region) <= 120),
  city            text NOT NULL DEFAULT '' CHECK (length(city) <= 120),
  district        text NOT NULL DEFAULT '' CHECK (length(district) <= 120),
  building_name   text NOT NULL DEFAULT '' CHECK (length(building_name) <= 160),
  -- How precise the anchor is: city/district/exact. Never force exact
  -- coordinates for a city-level post; never invent a pin.
  precision_level text NOT NULL DEFAULT 'district'
    CHECK (precision_level IN ('city', 'district', 'exact')),
  lat             numeric NULL CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90)),
  lng             numeric NULL CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180))
);

CREATE TABLE IF NOT EXISTS public.signal_requirements (
  signal_id        uuid PRIMARY KEY REFERENCES public.stratosphere_signals(id) ON DELETE CASCADE,
  transaction_type text NOT NULL DEFAULT '' CHECK (length(transaction_type) <= 40),
  space_type       text NOT NULL DEFAULT '' CHECK (length(space_type) <= 80),
  budget_min       numeric NULL CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max       numeric NULL CHECK (budget_max IS NULL OR budget_max >= 0),
  size_min_sqm     numeric NULL CHECK (size_min_sqm IS NULL OR size_min_sqm >= 0),
  size_max_sqm     numeric NULL CHECK (size_max_sqm IS NULL OR size_max_sqm >= 0),
  timing           text NOT NULL DEFAULT '' CHECK (length(timing) <= 120),
  must_have        text[] NOT NULL DEFAULT '{}',
  preferred        text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.signal_relevance (
  signal_id  uuid NOT NULL REFERENCES public.stratosphere_signals(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (signal_id, account_id)
);

CREATE TABLE IF NOT EXISTS public.signal_saves (
  signal_id  uuid NOT NULL REFERENCES public.stratosphere_signals(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (signal_id, account_id)
);

CREATE INDEX IF NOT EXISTS stratosphere_signals_author_active_idx
  ON public.stratosphere_signals (author_account_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS stratosphere_signals_feed_idx
  ON public.stratosphere_signals (status, created_at DESC);
CREATE INDEX IF NOT EXISTS signal_locations_district_idx
  ON public.signal_locations (district, city);

ALTER TABLE public.stratosphere_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_relevance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_saves ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.stratosphere_signals FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.signal_locations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.signal_requirements FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.signal_relevance FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.signal_saves FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.stratosphere_signals IS
  'A-145 P1: real member-posted community signals. Samples never land here. Service-role writes only via /api/community/*; public reads serve live rows through the feed route. O-004 row 11, NOT APPLIED.';

COMMIT;

-- Verify (after apply, Rule 20 — live schema, not this file):
--   SELECT has_table_privilege('anon', 'public.stratosphere_signals', 'SELECT'),
--          has_table_privilege('authenticated', 'public.stratosphere_signals', 'INSERT');
--   -- both must be false; RLS enabled with zero policies.
--
-- Rollback (rehearsal only):
--   DROP TABLE IF EXISTS public.signal_saves;
--   DROP TABLE IF EXISTS public.signal_relevance;
--   DROP TABLE IF EXISTS public.signal_requirements;
--   DROP TABLE IF EXISTS public.signal_locations;
--   DROP TABLE IF EXISTS public.stratosphere_signals;
