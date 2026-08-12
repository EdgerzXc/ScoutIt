-- ═══════════════════════════════════════════════════════════════════════
-- 1.0B — CRITICAL LOGIC & SECURITY FLAWS (2026-08-12 audit)
-- ═══════════════════════════════════════════════════════════════════════
-- Closes the database half of Master Action Plan §1.0B.
--
-- ⚠️ WRITTEN AGAINST THE LIVE SCHEMA, NOT AGAINST THE REPO'S MIGRATION FILES.
-- A 2026-08-12 inspection of project `yyixsuaimdzyiocswcgc` found that several
-- repo migrations were never applied to production, so the live policy names
-- and columns differ from what `supabase/migrations/` implies. In particular:
--
--   * `20260803000001_production_security_rls.sql` was NOT applied. The live
--     SELECT policy is "Public can read published properties", not "Public read
--     for live properties". Dropping the repo's name would have been a no-op
--     and this migration would have ADDED a second, permissive SELECT policy
--     next to the old one — RLS SELECT policies are OR'd, so it would have
--     restricted nothing.
--   * `20260809000001_security_telemetry_retention.sql` was NOT applied. The
--     geo columns and the pageview uniqueness index do not exist, and 130
--     duplicate pageview rows are present — a unique index would have failed.
--   * `public.deals` has NO UPDATE policy at all. With RLS enabled that is
--     deny-all, which is STRONGER than the WITH CHECK the audit asked for.
--     Creating that policy would have GRANTED update rights that do not
--     currently exist. It is therefore deliberately not created here.
--   * `scout_rating` lives on `broker_profiles`, not `user_profiles`, and is
--     `numeric(3,2)` — a 0–5 rating, not a counter. See section 1.
--
-- Every statement is idempotent and safe to re-run.
--
-- Findings covered:
--   1. Transaction handshake forgery + wrong-table rating write
--   2. Decline authority (companion to the API ownership check)
--   3. Property self-approval (pipeline_status / lifecycle_state client writes)
--   4. Property UPDATE had no WITH CHECK (ownership transfer)
--   5. Deal hijacking (trigger; policy deliberately not created — see above)
--   6. saved_intel duplicate explosion (missing unique constraint)
--   7. Public read policy still keyed to pipeline_status
--   8. property_claims.property_id was TEXT with no referential integrity
--   9. Telemetry storage exhaustion (unbounded row growth)
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- 1. TRANSACTION HANDSHAKE FORGERY
-- ───────────────────────────────────────────────────────────────────────
-- The previous body created the handshake row with
--   party_a_signed_at = now()
-- regardless of who called it. A broker calling first therefore signed on
-- the buyer's behalf; a single subsequent broker signature completed the
-- handshake and incremented the broker's public standing with no buyer
-- consent at all.
--
-- Fix: the creating INSERT records NO signature. Each signature is written
-- only by the party it belongs to, and a caller who is not a party to the
-- deal is rejected outright instead of silently succeeding.
--
-- ── SECOND BUG FOUND WHILE FIXING THE FIRST ──
-- The old body ran:
--     UPDATE public.user_profiles SET scout_rating = ... + 1
-- `user_profiles` has no `scout_rating` column. That statement would have
-- raised at runtime the first time any handshake completed. It never fired
-- only because zero handshakes exist. `scout_rating` is on `broker_profiles`
-- and is `numeric(3,2)` — a 0–5 quality rating that OVERFLOWS at 10.00, so
-- incrementing it by 1 per closed deal was never right either.
--
-- This migration increments `broker_profiles.verified_closures` (integer,
-- and semantically exactly "a deal this broker closed"). How a closure should
-- influence the displayed 0–5 `scout_rating` is a product decision, not a
-- security fix, and is left to the owner.

CREATE OR REPLACE FUNCTION public.complete_transaction_handshake(
  p_deal_id UUID,
  p_user_id TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  rating_updated BOOLEAN,
  handshake_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_handshake RECORD;
  v_broker_id TEXT;
  v_already_completed BOOLEAN := FALSE;
  v_closures_updated INTEGER := 0;
BEGIN
  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RAISE EXCEPTION 'handshake requires an identified caller'
      USING ERRCODE = '28000';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:handshake:' || p_deal_id::text, 0));

  SELECT * INTO v_handshake
  FROM public.deal_handshakes
  WHERE deal_id = p_deal_id AND handshake_type = 'transaction_handshake'
  LIMIT 1;

  IF NOT FOUND THEN
    -- No signature is fabricated here. Both signature columns stay NULL
    -- until their own party signs.
    INSERT INTO public.deal_handshakes (
      deal_id, property_id, handshake_type,
      party_a_id, party_a_signed_at,
      party_b_id, party_b_signed_at,
      status
    )
    SELECT d.id, d.property_id, 'transaction_handshake',
           d.buyer_id, NULL,
           d.broker_id, NULL,
           'pending'
    FROM public.deals d
    WHERE d.id = p_deal_id
    RETURNING * INTO v_handshake;

    IF v_handshake.id IS NULL THEN
      RAISE EXCEPTION 'deal % does not exist', p_deal_id
        USING ERRCODE = '23503';
    END IF;
  END IF;

  -- Denial is the default: only the two named parties may sign.
  IF p_user_id IS DISTINCT FROM v_handshake.party_a_id
     AND p_user_id IS DISTINCT FROM v_handshake.party_b_id THEN
    RAISE EXCEPTION 'caller is not a party to this handshake'
      USING ERRCODE = '42501';
  END IF;

  IF v_handshake.status IN ('declined', 'expired') THEN
    RETURN QUERY SELECT FALSE, FALSE, v_handshake.status;
    RETURN;
  END IF;

  v_already_completed := (v_handshake.status = 'completed');

  IF p_user_id = v_handshake.party_a_id AND v_handshake.party_a_signed_at IS NULL THEN
    UPDATE public.deal_handshakes
    SET party_a_signed_at = now(), updated_at = now()
    WHERE id = v_handshake.id;
  ELSIF p_user_id = v_handshake.party_b_id AND v_handshake.party_b_signed_at IS NULL THEN
    UPDATE public.deal_handshakes
    SET party_b_signed_at = now(), updated_at = now()
    WHERE id = v_handshake.id;
  END IF;

  SELECT * INTO v_handshake FROM public.deal_handshakes WHERE id = v_handshake.id;

  IF v_handshake.party_a_signed_at IS NOT NULL
     AND v_handshake.party_b_signed_at IS NOT NULL
     AND NOT v_already_completed
     AND NOT v_handshake.rating_incremented THEN
    UPDATE public.deal_handshakes
    SET status = 'completed', rating_incremented = TRUE, updated_at = now()
    WHERE id = v_handshake.id;

    -- Credit the broker's verified closure count exactly once.
    -- Deliberately does NOT create a broker_profiles row that does not exist:
    -- a missing profile is a data problem to surface, not to paper over.
    v_broker_id := v_handshake.party_b_id;
    IF v_broker_id IS NOT NULL THEN
      UPDATE public.broker_profiles
      SET verified_closures = COALESCE(verified_closures, 0) + 1
      WHERE user_id = v_broker_id;
      GET DIAGNOSTICS v_closures_updated = ROW_COUNT;

      IF v_closures_updated = 0 THEN
        RAISE WARNING 'handshake % completed but broker_profiles row for % is missing; closure not credited',
          v_handshake.id, v_broker_id;
      END IF;
    END IF;

    RETURN QUERY SELECT TRUE, (v_closures_updated > 0), 'completed'::text;
  ELSIF v_handshake.party_a_signed_at IS NOT NULL
        AND v_handshake.party_b_signed_at IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, FALSE, 'completed'::text;
  ELSE
    RETURN QUERY SELECT TRUE, FALSE, 'pending'::text;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_transaction_handshake(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_transaction_handshake(UUID, TEXT) TO service_role;

COMMENT ON FUNCTION public.complete_transaction_handshake(UUID, TEXT) IS
  'Records one party''s transaction-handshake signature. Never fabricates the '
  'counterparty signature, rejects non-parties, and credits the broker''s '
  'verified_closures at most once per handshake.';


-- ───────────────────────────────────────────────────────────────────────
-- 2. DECLINE AUTHORITY (server-side companion to the API ownership check)
-- ───────────────────────────────────────────────────────────────────────
-- /api/deals/handshake previously declined by deal_id alone under the
-- service role. The route now verifies party membership; this gives the
-- database the same guarantee so no future caller can bypass it.

CREATE OR REPLACE FUNCTION public.decline_deal_handshake(
  p_deal_id UUID,
  p_user_id TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  handshake_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RAISE EXCEPTION 'decline requires an identified caller'
      USING ERRCODE = '28000';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:handshake:' || p_deal_id::text, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = p_deal_id
      AND (d.buyer_id = p_user_id OR d.broker_id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'caller is not a party to this deal'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.deal_handshakes
  SET status = 'declined', updated_at = now()
  WHERE deal_id = p_deal_id
    AND status = 'pending'
    AND (party_a_id = p_user_id OR party_b_id = p_user_id);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN QUERY SELECT (v_updated > 0),
    CASE WHEN v_updated > 0 THEN 'declined' ELSE 'unchanged' END;
END;
$$;

REVOKE ALL ON FUNCTION public.decline_deal_handshake(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_deal_handshake(UUID, TEXT) TO service_role;


-- ───────────────────────────────────────────────────────────────────────
-- 3. PROPERTY SELF-APPROVAL (privilege escalation)
-- ───────────────────────────────────────────────────────────────────────
-- The live UPDATE policy "Users can update their own properties" let an owner
-- set their own pipeline_status to 'approved' and lifecycle_state to 'live',
-- bypassing Mission Control review entirely. Column-level restriction needs a
-- trigger because Postgres RLS cannot express a per-column WITH CHECK.
--
-- Privilege is decided by `current_user`, which is what actually holds under
-- PostgREST: it issues SET LOCAL ROLE, so a service-key request runs as
-- `service_role` and a user session runs as `authenticated`/`anon`. JWT claim
-- lookups are not used — an absent claim must not read as privileged.

-- SECURITY INVOKER is REQUIRED here, not incidental. Inside a SECURITY DEFINER
-- function `current_user` is the function OWNER (postgres), so the privilege
-- check below would pass for everyone and the guard would be decorative.
-- As INVOKER, `current_user` is the effective PostgREST role — `authenticated`,
-- `anon`, or `service_role` — which is exactly the question being asked.
CREATE OR REPLACE FUNCTION public.enforce_property_moderation_authority()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- A client-created property may never arrive pre-approved or pre-live.
    -- Other submission states (pending, draft, ai_drafting) pass through
    -- untouched so the existing intake flows keep working.
    IF NEW.pipeline_status = 'approved' THEN
      NEW.pipeline_status := 'pending';
    END IF;
    IF NEW.lifecycle_state IN ('live', 'staff_suspended', 'permanently_removed') THEN
      NEW.lifecycle_state := 'draft';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.pipeline_status IS DISTINCT FROM OLD.pipeline_status THEN
    RAISE EXCEPTION 'pipeline_status is set by ScoutIt review, not by the lister'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.lifecycle_state IS DISTINCT FROM OLD.lifecycle_state THEN
    RAISE EXCEPTION 'lifecycle_state is set by ScoutIt review, not by the lister'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_property_moderation_authority() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_property_moderation_authority ON public.properties;
CREATE TRIGGER trg_enforce_property_moderation_authority
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_moderation_authority();

COMMENT ON FUNCTION public.enforce_property_moderation_authority() IS
  'Freezes pipeline_status and lifecycle_state against client sessions. Only '
  'the service role (Mission Control server) may move a property through review.';


-- ───────────────────────────────────────────────────────────────────────
-- 4. PROPERTY UPDATE HAD NO WITH CHECK (ownership transfer)
-- ───────────────────────────────────────────────────────────────────────
-- The live policy checked only the row being updated (USING), not the row
-- being written. An owner could therefore set owner_id to another user in the
-- same statement and hand away — or, combined with a guessed id, take over —
-- a listing. Recreated with a matching WITH CHECK.

DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners update own properties" ON public.properties;

CREATE POLICY "Users can update their own properties"
  ON public.properties FOR UPDATE
  USING (owner_id = (SELECT auth.uid())::text)
  WITH CHECK (owner_id = (SELECT auth.uid())::text);


-- ───────────────────────────────────────────────────────────────────────
-- 5. DEAL HIJACKING
-- ───────────────────────────────────────────────────────────────────────
-- The audit asked for a WITH CHECK on the deals UPDATE policy. On the live
-- database there is NO UPDATE policy on public.deals, and RLS is enabled —
-- which is deny-all, i.e. already stronger than the requested fix. Creating
-- the policy would GRANT client update rights that do not exist today, so it
-- is deliberately NOT created here. The application updates deals through the
-- service role, which bypasses RLS and is unaffected.
--
-- The trigger below is the durable half: whenever an UPDATE policy is
-- eventually added, party identity and subject property are already immutable
-- and a party still cannot close a deal unilaterally.

-- SECURITY INVOKER for the same reason as the property trigger above.
CREATE OR REPLACE FUNCTION public.enforce_deal_party_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.broker_id IS DISTINCT FROM OLD.broker_id
     OR NEW.property_id IS DISTINCT FROM OLD.property_id THEN
    RAISE EXCEPTION 'deal parties and subject property are immutable'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'closed' THEN
    RAISE EXCEPTION 'a deal is closed by ScoutIt after both handshakes, not by a party'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_deal_party_immutability() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_deal_party_immutability ON public.deals;
CREATE TRIGGER trg_enforce_deal_party_immutability
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_deal_party_immutability();


-- ───────────────────────────────────────────────────────────────────────
-- 6. saved_intel — unique(user_id, property_id)
-- ───────────────────────────────────────────────────────────────────────
-- /api/wishlist/merge is idempotent by read-then-insert, which is a race,
-- not a constraint. Enforce the invariant in the schema. Existing duplicates
-- are collapsed to the earliest row first so the index can be created.
-- (Verified 2026-08-12: 0 rows, 0 duplicates — this is a no-op today.)

DO $$
BEGIN
  IF to_regclass('public.saved_intel') IS NULL THEN
    RAISE NOTICE 'public.saved_intel not present; skipping unique constraint';
    RETURN;
  END IF;

  DELETE FROM public.saved_intel a
  USING public.saved_intel b
  WHERE a.user_id = b.user_id
    AND a.property_id = b.property_id
    AND a.ctid > b.ctid;

  CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_intel_user_property
    ON public.saved_intel (user_id, property_id);
END;
$$;


-- ───────────────────────────────────────────────────────────────────────
-- 7. PUBLIC READ POLICY — lifecycle_state is the authority
-- ───────────────────────────────────────────────────────────────────────
-- The LIVE policy name is "Public can read published properties" with
-- USING (pipeline_status = 'approved'), which kept approved-but-withdrawn,
-- off-market, and permanently-removed properties publicly readable.
--
-- Both the live name and the repo's aspirational name are dropped so this is
-- correct whichever state the database is in.
-- (Verified 2026-08-12: 10 approved, 10 live, 0 rows change visibility.)

DROP POLICY IF EXISTS "Public can read published properties" ON public.properties;
DROP POLICY IF EXISTS "Public read for live properties" ON public.properties;

CREATE POLICY "Public can read live properties"
  ON public.properties FOR SELECT
  USING (lifecycle_state = 'live');

-- "Users can read their own properties" already exists and is unchanged;
-- SELECT policies are OR'd, so an owner still sees their non-live listings.


-- ───────────────────────────────────────────────────────────────────────
-- 8. property_claims.property_id — TEXT → UUID with referential integrity
-- ───────────────────────────────────────────────────────────────────────
-- Guarded: only converts when every existing value is a valid UUID that
-- resolves to a properties row. Fails loudly otherwise rather than silently
-- discarding claims. (Verified 2026-08-12: 0 rows.)

DO $$
DECLARE
  v_type TEXT;
  v_bad  BIGINT;
BEGIN
  SELECT data_type INTO v_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'property_claims'
    AND column_name = 'property_id';

  IF v_type IS NULL OR v_type = 'uuid' THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_bad
  FROM public.property_claims c
  WHERE c.property_id IS NOT NULL
    AND (
      c.property_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR NOT EXISTS (SELECT 1 FROM public.properties p WHERE p.id = c.property_id::uuid)
    );

  IF v_bad > 0 THEN
    RAISE EXCEPTION
      'property_claims.property_id has % unresolvable value(s); reconcile them before converting to UUID', v_bad;
  END IF;

  DROP INDEX IF EXISTS public.property_claims_one_active_per_user_idx;

  ALTER TABLE public.property_claims
    ALTER COLUMN property_id TYPE UUID USING property_id::uuid;

  ALTER TABLE public.property_claims
    DROP CONSTRAINT IF EXISTS property_claims_property_id_fkey;

  ALTER TABLE public.property_claims
    ADD CONSTRAINT property_claims_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

  CREATE UNIQUE INDEX IF NOT EXISTS property_claims_one_active_per_user_idx
    ON public.property_claims (property_id, claimant_user_id)
    WHERE status NOT IN ('rejected', 'withdrawn', 'closed');
END;
$$;


-- ───────────────────────────────────────────────────────────────────────
-- 9. TELEMETRY STORAGE EXHAUSTION
-- ───────────────────────────────────────────────────────────────────────
-- /api/telemetry/device accepts unauthenticated POSTs and inserted one row
-- per request under the service role. The derived identity mixes in the
-- caller-controlled User-Agent, so a single client could mint unlimited
-- identities and therefore unlimited rows.
--
-- Fix: every telemetry row becomes a counter keyed by
-- (masked_ip, route_accessed), where the route key comes from a closed
-- allowlist. The table can then grow no faster than
-- distinct identities × known routes, and repeat events only increment.
--
-- This section is SELF-SUFFICIENT. It does not assume
-- 20260809000001_security_telemetry_retention.sql ran — verified 2026-08-12
-- that it did not: the geo columns were absent and 130 duplicate pageview
-- rows were present, either of which would have failed a unique index.

ALTER TABLE public.security_access_logs
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

DO $$
BEGIN
  IF to_regclass('public.security_access_logs') IS NULL THEN
    RAISE NOTICE 'public.security_access_logs not present; skipping telemetry bounding';
    RETURN;
  END IF;

  -- Collapse ALL historical duplicates into counters — pageview rows too,
  -- since the earlier partial index that was supposed to prevent them was
  -- never applied. Counts are summed so no observation is lost.
  WITH ranked AS (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY masked_ip, route_accessed
        ORDER BY last_request_at DESC NULLS LAST, id
      ) AS row_rank,
      sum(COALESCE(request_count, 1)) OVER (PARTITION BY masked_ip, route_accessed) AS merged_count,
      min(first_seen_at) OVER (PARTITION BY masked_ip, route_accessed) AS merged_first_seen,
      bool_or(COALESCE(is_flagged, FALSE)) OVER (PARTITION BY masked_ip, route_accessed) AS merged_flagged
    FROM public.security_access_logs
  )
  UPDATE public.security_access_logs AS log
  SET request_count = ranked.merged_count,
      first_seen_at = ranked.merged_first_seen,
      is_flagged    = ranked.merged_flagged
  FROM ranked
  WHERE log.id = ranked.id AND ranked.row_rank = 1;

  WITH ranked AS (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY masked_ip, route_accessed
        ORDER BY last_request_at DESC NULLS LAST, id
      ) AS row_rank
    FROM public.security_access_logs
  )
  DELETE FROM public.security_access_logs AS log
  USING ranked
  WHERE log.id = ranked.id AND ranked.row_rank > 1;

  -- The old partial index deliberately EXCLUDED FRICTION:/SEARCH: rows.
  -- That exclusion was the unbounded-growth path. Replace it with a total one.
  DROP INDEX IF EXISTS public.uq_security_pageview_identity_route;
  CREATE UNIQUE INDEX IF NOT EXISTS uq_security_event_identity_route
    ON public.security_access_logs (masked_ip, route_accessed);
END;
$$;

-- One upsert entry point for every telemetry event type.
CREATE OR REPLACE FUNCTION public.record_security_event(
  p_masked_ip TEXT,
  p_route_accessed TEXT,
  p_is_flagged BOOLEAN DEFAULT FALSE,
  p_flag_reason TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_last_request_at TIMESTAMPTZ DEFAULT now()
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.security_access_logs (
    masked_ip, route_accessed, request_count, is_flagged, flag_reason,
    city, country, latitude, longitude, last_request_at
  )
  VALUES (
    p_masked_ip, p_route_accessed, 1, COALESCE(p_is_flagged, FALSE), p_flag_reason,
    p_city, p_country, p_latitude, p_longitude, p_last_request_at
  )
  ON CONFLICT (masked_ip, route_accessed)
  DO UPDATE SET
    request_count   = public.security_access_logs.request_count + 1,
    is_flagged      = public.security_access_logs.is_flagged OR COALESCE(EXCLUDED.is_flagged, FALSE),
    flag_reason     = COALESCE(EXCLUDED.flag_reason, public.security_access_logs.flag_reason),
    city            = COALESCE(EXCLUDED.city, public.security_access_logs.city),
    country         = COALESCE(EXCLUDED.country, public.security_access_logs.country),
    latitude        = COALESCE(EXCLUDED.latitude, public.security_access_logs.latitude),
    longitude       = COALESCE(EXCLUDED.longitude, public.security_access_logs.longitude),
    last_request_at = EXCLUDED.last_request_at;
$$;

REVOKE ALL ON FUNCTION public.record_security_event(
  TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_security_event(
  TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ
) TO service_role;

-- Pageview entry point the route already calls, delegating to the same upsert.
CREATE OR REPLACE FUNCTION public.record_security_pageview(
  p_masked_ip TEXT,
  p_route_accessed TEXT,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_last_request_at TIMESTAMPTZ DEFAULT now()
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.record_security_event(
    p_masked_ip, p_route_accessed, FALSE, NULL,
    p_city, p_country, p_latitude, p_longitude, p_last_request_at
  );
$$;

REVOKE ALL ON FUNCTION public.record_security_pageview(
  TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_security_pageview(
  TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ
) TO service_role;

-- NOTE: the 30-day retention CRON from 20260809000001 is NOT included here.
-- pg_cron is available but not installed on this project, and installing an
-- extension is a separate owner decision. `clean_old_security_logs()` already
-- exists and can be called manually or from a Vercel cron in the meantime.
