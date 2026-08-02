-- ==============================================================================
-- SCOUTIT — BUYER LEADS & TEMPORARY CHATBOX SCHEMA
-- Run this in the Supabase SQL Editor to apply the new schema.
-- ==============================================================================

-- 1. Extend the existing `deals` table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS buyer_id text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2. Create the `deal_messages` table
CREATE TABLE IF NOT EXISTS public.deal_messages (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  sender_id text not null,                 -- user_id (text until Auth -> uuid fully enforced)
  sender_role text not null,               -- 'owner' | 'broker' | 'buyer'
  body text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_deal_messages_deal_id ON public.deal_messages (deal_id, created_at);

-- Enable RLS (Default to Dev Open, actual security enforced at API layer for now)
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dev open" ON public.deal_messages;
CREATE POLICY "dev open" ON public.deal_messages FOR ALL USING (true);

-- 3. Automated Lifecycle Function (Archiving & Deletion)
CREATE OR REPLACE FUNCTION public.enforce_chat_lifecycle()
RETURNS void AS $$
BEGIN
  -- 1. Hard Delete after 7 days of being closed
  -- Cascades to deal_messages automatically
  DELETE FROM public.deals 
  WHERE status = 'closed' AND closed_at < now() - interval '7 days';
  
  -- 2. Soft Close on Inactivity (72 hours)
  UPDATE public.deals 
  SET status = 'closed', closed_at = now() 
  WHERE status != 'closed' AND updated_at < now() - interval '72 hours';
  
  -- 3. Soft Close on Hard Expiration (14 days)
  UPDATE public.deals 
  SET status = 'closed', closed_at = now() 
  WHERE status != 'closed' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
