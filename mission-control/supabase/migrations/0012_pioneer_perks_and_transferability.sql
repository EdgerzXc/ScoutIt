-- ============================================================================
-- 0012 — Pioneer Charters, Dynamic Perks & Transferability Schema
-- ============================================================================

-- 1. Enhance user_badges with seat_number and transferability metadata
ALTER TABLE public.user_badges
  ADD COLUMN IF NOT EXISTS seat_number INTEGER,
  ADD COLUMN IF NOT EXISTS is_transferable BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transfer_locked_until TIMESTAMPTZ;

-- 2. Dynamic badge catalog with JSONB perks
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

ALTER TABLE public.badge_definitions
  ADD COLUMN IF NOT EXISTS perks JSONB NOT NULL DEFAULT '{}'::jsonb;

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

-- 3. Immutable Badge Transfer Ledger
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

-- 4. Charter Application Intake (Action-Qualified Dossier)
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
