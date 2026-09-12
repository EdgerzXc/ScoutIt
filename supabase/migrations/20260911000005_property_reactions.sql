-- A-142 (was O-010): anonymous property reactions get a real home.
--
-- /api/reactions has written to an Airtable table that never existed, so every
-- reaction tap since launch was lost (O-010, checked 2026-09-11). Owner decision
-- the same day: keep the reactions, because they feed listing metrics, and keep
-- them anonymous — "it's their own data".
--
-- Supabase, not Airtable: Airtable is the public read-only content store
-- (AGENTS.md §2); a visitor's tap is a submission, which belongs here.
--
-- ANONYMOUS BY DESIGN. There is deliberately no user id, no IP, no device or
-- viewer key. A row says "someone reacted this way to this listing", nothing
-- about who. The route rate-limits per IP in memory and never stores it.
--
-- Server-only: the browser never reads or writes this table. /api/reactions
-- inserts with the service role. New public tables inherit Supabase's default
-- grants to anon/authenticated, so they are revoked explicitly below.

BEGIN;

CREATE TABLE IF NOT EXISTS public.property_reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The listing as the public page knows it: an Airtable record id or a slug.
  -- Not an FK — most public listings live in Airtable, not in `properties`.
  property_ref  text NOT NULL
                CHECK (property_ref ~ '^[A-Za-z0-9_-]{1,64}$'),
  reaction_type text NOT NULL
                CHECK (reaction_type IN ('Save', 'Inspired Me', 'Potential Fit', 'Interested')),
  city          text NOT NULL DEFAULT '' CHECK (length(city) <= 120),
  category      text NOT NULL DEFAULT '' CHECK (length(category) <= 120),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_reactions_property_idx
  ON public.property_reactions (property_ref, created_at);

ALTER TABLE public.property_reactions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.property_reactions FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.property_reactions IS
  'A-142: anonymous reaction taps from public listing pages. No user id, IP or device key by design. Written only by /api/reactions (service role).';

COMMIT;

-- Verify (after apply):
--   SELECT has_table_privilege('anon', 'public.property_reactions', 'INSERT'),
--          has_table_privilege('anon', 'public.property_reactions', 'SELECT'),
--          has_table_privilege('authenticated', 'public.property_reactions', 'INSERT'),
--          has_table_privilege('authenticated', 'public.property_reactions', 'SELECT');
--   -- all four must be false
--
-- Rollback:
--   DROP TABLE IF EXISTS public.property_reactions;
