-- ═══════════════════════════════════════════════════════════
-- SCOUTIT — QUEST-IT B2B API SCHEMA
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. QUEST-IT API KEYS
-- Stores API keys for external companies using the B2B API
CREATE TABLE IF NOT EXISTS public.questit_api_keys (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  api_key_hash TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- 2. QUEST-IT COMPANY POLICIES (Side System Policy)
-- Stores the rules engine configuration for a company
CREATE TABLE IF NOT EXISTS public.questit_policies (
  user_id TEXT PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  policy_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. COMPANY QUESTS (Bounties raised via the API)
-- Tracks the specific tasks/bounties raised by the company
CREATE TABLE IF NOT EXISTS public.company_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  target_field TEXT NOT NULL, -- e.g., 'peza_status', 'floor_plan', 'photos'
  description TEXT,
  bounty_connects INTEGER NOT NULL,
  status TEXT DEFAULT 'open', -- open, claimed, verifying, verified, rejected
  claimed_by TEXT REFERENCES public.user_profiles(id),
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. RLS POLICIES FOR B2B API
ALTER TABLE public.questit_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questit_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_quests ENABLE ROW LEVEL SECURITY;

-- Companies can view their own API keys
CREATE POLICY "Users can view their own api keys"
ON public.questit_api_keys FOR SELECT
USING (user_id = auth.uid()::text);

-- Companies can view/update their own policies
CREATE POLICY "Users can view their own policies"
ON public.questit_policies FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own policies"
ON public.questit_policies FOR UPDATE
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Quests RLS
-- Anyone can view open quests (for the Quest board)
CREATE POLICY "Public can view open quests"
ON public.company_quests FOR SELECT
USING (status = 'open' OR company_id = auth.uid()::text OR claimed_by = auth.uid()::text);

-- Companies can insert their own quests
CREATE POLICY "Companies can insert quests"
ON public.company_quests FOR INSERT
WITH CHECK (company_id = auth.uid()::text);

-- Providers can update quests to claim them
CREATE POLICY "Providers can claim quests"
ON public.company_quests FOR UPDATE
USING (true); -- Fine-grained checks handled via API/Edge Functions
