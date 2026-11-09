-- ============================================================================
-- 20261109000001 — Pioneer Charters, Numbered Seats, Mutual Exclusivity,
--                  Transferability & Account Incentives Engine (A-345)
-- ============================================================================

-- ── 1. Enhance user_badges with seat_number and transferability metadata ─────
ALTER TABLE public.user_badges
  ADD COLUMN IF NOT EXISTS seat_number INTEGER,
  ADD COLUMN IF NOT EXISTS is_transferable BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transfer_locked_until TIMESTAMPTZ;

-- Backfill seat_number sequentially for existing pioneer cohorts if missing
DO $$
DECLARE
  r RECORD;
  v_seq INTEGER;
  v_last_badge TEXT := '';
BEGIN
  v_seq := 0;
  FOR r IN 
    SELECT id, badge_id, earned_at 
    FROM public.user_badges 
    WHERE (badge_id LIKE 'PIONEER_%' OR badge_id = 'FOUNDING_SEEKER')
    ORDER BY badge_id, earned_at ASC
  LOOP
    IF r.badge_id <> v_last_badge THEN
      v_last_badge := r.badge_id;
      v_seq := 1;
    ELSE
      v_seq := v_seq + 1;
    END IF;
    
    UPDATE public.user_badges 
    SET seat_number = v_seq, is_transferable = TRUE 
    WHERE id = r.id AND seat_number IS NULL;
  END LOOP;
END $$;

-- ── 2. Dynamic badge catalog with JSONB perks ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  category TEXT NOT NULL DEFAULT 'achievement' CHECK (category IN ('achievement', 'pioneer_cohort', 'trust_seal', 'milestone', 'custom')),
  max_slots INTEGER,
  color TEXT,
  perks JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Ensure perks column exists if table was created in an earlier migration
ALTER TABLE public.badge_definitions
  ADD COLUMN IF NOT EXISTS perks JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Ensure category constraint supports pioneer_cohort and trust_seal
DO $$
BEGIN
  ALTER TABLE public.badge_definitions DROP CONSTRAINT IF EXISTS badge_definitions_category_check;
  ALTER TABLE public.badge_definitions ADD CONSTRAINT badge_definitions_category_check 
    CHECK (category = ANY (ARRAY['achievement'::text, 'pioneer_cohort'::text, 'trust_seal'::text, 'milestone'::text, 'custom'::text]));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read badge_definitions" ON public.badge_definitions;
CREATE POLICY "public read badge_definitions" ON public.badge_definitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "service role writes badge_definitions" ON public.badge_definitions;
CREATE POLICY "service role writes badge_definitions" ON public.badge_definitions FOR ALL USING (false) WITH CHECK (false);

-- Upsert canonical badge definitions with verified slot limits and approved perk suites
INSERT INTO public.badge_definitions (id, name, description, rarity, category, max_slots, color, perks)
VALUES
  (
    'PIONEER_BROKER',
    'Pioneer Advisor',
    'One of the first 25 verified luxury brokers on ScoutIt. Holds a permanent, transferable Founding Charter seat.',
    'legendary',
    'pioneer_cohort',
    25,
    'var(--intel-blue, var(--sapphire))',
    jsonb_build_object(
      'queue_priority', true,
      'discount_pct', 50,
      'priority_support', true,
      'monthly_connects', 50,
      'white_label_pdf', true,
      'charter_seal', true,
      'alpha_notes', true,
      'is_transferable', true
    )
  ),
  (
    'PIONEER_OWNER',
    'Pioneer Landlord',
    'One of the first 20 trophy asset developers and landlords on ScoutIt. Holds a permanent, transferable Founding Charter seat.',
    'legendary',
    'pioneer_cohort',
    20,
    'var(--green)',
    jsonb_build_object(
      'queue_priority', true,
      'discount_pct', 50,
      'priority_support', true,
      'monthly_connects', 50,
      'white_label_pdf', true,
      'charter_seal', true,
      'alpha_notes', true,
      'is_transferable', true
    )
  ),
  (
    'FOUNDING_SEEKER',
    'Founding Seeker',
    'One of the first 100 accredited luxury seekers and investors on ScoutIt. Holds permanent Spatial Vault privileges.',
    'legendary',
    'pioneer_cohort',
    100,
    'var(--accent)',
    jsonb_build_object(
      'free_vault_access', true,
      'priority_support', true,
      'monthly_connects', 25,
      'alpha_notes', true,
      'is_transferable', true
    )
  ),
  (
    'PIONEER_CREATOR',
    'Pioneer Creator',
    'One of the first 15 premier architectural visual architects and spatial photographers on ScoutIt.',
    'legendary',
    'pioneer_cohort',
    15,
    'var(--tier-platinum)',
    jsonb_build_object(
      'priority_bounties', true,
      'priority_support', true,
      'monthly_connects', 25,
      'alpha_notes', true,
      'is_transferable', true
    )
  ),
  (
    'ALPHA_CARTOGRAPHER',
    'Alpha Cartographer',
    'Mapped the very first 50 properties into the ScoutIt engine before public launch.',
    'legendary',
    'achievement',
    5,
    'var(--red)',
    jsonb_build_object('admin_access', true, 'charter_seal', true)
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  max_slots = EXCLUDED.max_slots,
  perks = EXCLUDED.perks,
  updated_at = now();

-- ── 3. Immutable Badge Transfer Ledger ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badge_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'rejected')),
  notes TEXT,
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.badge_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own transfers" ON public.badge_transfers;
CREATE POLICY "Users can read own transfers" ON public.badge_transfers
  FOR SELECT USING (from_user_id = ((SELECT auth.uid()))::text OR to_user_id = ((SELECT auth.uid()))::text);

-- ── 4. Charter Application Intake (Action-Qualified Dossier) ────────────────
CREATE TABLE IF NOT EXISTS public.charter_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  agency_name TEXT,
  territory TEXT,
  full_name TEXT,
  organization TEXT,
  license_number TEXT,
  statement TEXT,
  annual_volume_tier TEXT,
  proof_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.charter_applications
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS statement TEXT,
  ADD COLUMN IF NOT EXISTS agency_name TEXT,
  ADD COLUMN IF NOT EXISTS territory TEXT;

ALTER TABLE public.charter_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own charter applications" ON public.charter_applications;
CREATE POLICY "Users can view own charter applications" ON public.charter_applications
  FOR SELECT USING (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can create own charter application" ON public.charter_applications;
CREATE POLICY "Users can create own charter application" ON public.charter_applications
  FOR INSERT WITH CHECK (user_id = ((SELECT auth.uid()))::text);

-- ── 5. Enhanced Atomic Pioneer Minting RPC with Mutual Exclusivity & Seats ────
CREATE OR REPLACE FUNCTION public.mint_pioneer_badge_atomic(
  p_user_id TEXT,
  p_badge_id TEXT,
  p_max_slots INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  error_code TEXT,
  badge_record JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
  v_seat_number INTEGER;
  v_new_row RECORD;
BEGIN
  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RETURN QUERY SELECT FALSE, 'UNAUTHORIZED'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- Transactional advisory lock per badge type to serialize concurrent mints
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:badge:' || p_badge_id, 0));

  -- 1. Check if user already holds this specific badge
  IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN QUERY SELECT FALSE, 'ALREADY_CLAIMED'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- 2. Enforce Strict "One Pioneer Badge Per Account" Mutual Exclusivity
  IF (p_badge_id LIKE 'PIONEER_%' OR p_badge_id = 'FOUNDING_SEEKER') AND
     EXISTS (
       SELECT 1 FROM public.user_badges 
       WHERE user_id = p_user_id 
         AND (badge_id LIKE 'PIONEER_%' OR badge_id = 'FOUNDING_SEEKER')
     ) THEN
    RETURN QUERY SELECT FALSE, 'ONE_PIONEER_PER_ACCOUNT'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- 3. Check Real Scarcity Slot Limits
  SELECT COUNT(*) INTO v_count
  FROM public.user_badges
  WHERE badge_id = p_badge_id;

  IF v_count >= p_max_slots THEN
    RETURN QUERY SELECT FALSE, 'SOLD_OUT'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- 4. Calculate Sequential Numbered Seat
  v_seat_number := v_count + 1;

  -- 5. Insert Atomic Mint with Transferability Flag
  INSERT INTO public.user_badges (
    user_id,
    badge_id,
    granted_by,
    seat_number,
    is_transferable,
    transfer_locked_until,
    earned_at
  )
  VALUES (
    p_user_id,
    p_badge_id,
    'charter_mint',
    v_seat_number,
    TRUE,
    now() + interval '180 days',
    now()
  )
  RETURNING * INTO v_new_row;

  RETURN QUERY SELECT TRUE, NULL::TEXT, to_jsonb(v_new_row);
END;
$$;

REVOKE ALL ON FUNCTION public.mint_pioneer_badge_atomic(TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mint_pioneer_badge_atomic(TEXT, TEXT, INTEGER) TO service_role;

-- ── 6. Atomic Pioneer Charter Transfer RPC ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.transfer_pioneer_badge_atomic(
  p_from_user_id TEXT,
  p_to_user_id TEXT,
  p_badge_id TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  error_code TEXT,
  badge_record JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_badge_row RECORD;
  v_updated_row RECORD;
BEGIN
  IF p_from_user_id IS NULL OR p_to_user_id IS NULL OR btrim(p_from_user_id) = '' OR btrim(p_to_user_id) = '' THEN
    RETURN QUERY SELECT FALSE, 'INVALID_PARTIES'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  IF p_from_user_id = p_to_user_id THEN
    RETURN QUERY SELECT FALSE, 'CANNOT_TRANSFER_TO_SELF'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- Lock badge type across transfer
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:badge_transfer:' || p_badge_id, 0));

  -- 1. Verify that sender owns the badge and retrieve seat number
  SELECT * INTO v_badge_row
  FROM public.user_badges
  WHERE user_id = p_from_user_id AND badge_id = p_badge_id
  FOR UPDATE;

  IF v_badge_row.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'NOT_BADGE_OWNER'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- 2. Verify transferability
  IF NOT COALESCE(v_badge_row.is_transferable, FALSE) THEN
    RETURN QUERY SELECT FALSE, 'BADGE_NOT_TRANSFERABLE'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- 3. Verify transfer lock vesting
  IF v_badge_row.transfer_locked_until IS NOT NULL AND v_badge_row.transfer_locked_until > now() THEN
    RETURN QUERY SELECT FALSE, 'TRANSFER_LOCKED'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- 4. Verify recipient does not already hold ANY Pioneer badge
  IF EXISTS (
    SELECT 1 FROM public.user_badges
    WHERE user_id = p_to_user_id
      AND (badge_id LIKE 'PIONEER_%' OR badge_id = 'FOUNDING_SEEKER')
  ) THEN
    RETURN QUERY SELECT FALSE, 'RECIPIENT_ALREADY_HAS_PIONEER'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- 5. Reassign user_badges record to recipient and reset 90-day cooldown
  UPDATE public.user_badges
  SET user_id = p_to_user_id,
      granted_by = 'transfer_from_' || p_from_user_id,
      transfer_locked_until = now() + interval '90 days'
  WHERE id = v_badge_row.id
  RETURNING * INTO v_updated_row;

  -- 6. Record immutable transfer audit entry
  INSERT INTO public.badge_transfers (
    badge_id,
    seat_number,
    from_user_id,
    to_user_id,
    status,
    notes,
    transferred_at
  )
  VALUES (
    p_badge_id,
    COALESCE(v_badge_row.seat_number, 1),
    p_from_user_id,
    p_to_user_id,
    'completed',
    p_notes,
    now()
  );

  RETURN QUERY SELECT TRUE, NULL::TEXT, to_jsonb(v_updated_row);
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_pioneer_badge_atomic(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_pioneer_badge_atomic(TEXT, TEXT, TEXT, TEXT) TO service_role;
