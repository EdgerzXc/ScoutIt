-- ═══════════════════════════════════════════════════════════
-- MISSION CONTROL — Pioneer perks and transferability columns
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.badge_definitions
  ADD COLUMN IF NOT EXISTS perks JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.user_badges
  ADD COLUMN IF NOT EXISTS seat_number INTEGER,
  ADD COLUMN IF NOT EXISTS is_transferable BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transfer_locked_until TIMESTAMPTZ;

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

CREATE TABLE IF NOT EXISTS public.charter_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  agency_name TEXT NOT NULL,
  territory TEXT NOT NULL,
  annual_volume_tier TEXT,
  proof_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
