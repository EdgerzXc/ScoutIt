-- ═══════════════════════════════════════════════════════════
-- SCOUTIT — HARDENED RLS POLICIES
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- NOTE: Since User IDs are currently stored as text (localStorage-based),
-- these policies cast auth.uid() to text. Once Supabase Auth is fully wired,
-- owner_id and user_id should be changed to UUID referencing auth.users.

-- 1. PROPERTIES (Drafts & Listings)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

-- Owners can only view their own drafts
CREATE POLICY "Users can view their own properties"
ON public.properties FOR SELECT
USING (owner_id = auth.uid()::text);

-- Owners can insert their own drafts
CREATE POLICY "Users can insert their own properties"
ON public.properties FOR INSERT
WITH CHECK (owner_id = auth.uid()::text);

-- Owners can update their own drafts
CREATE POLICY "Users can update their own properties"
ON public.properties FOR UPDATE
USING (owner_id = auth.uid()::text)
WITH CHECK (owner_id = auth.uid()::text);

-- Owners can delete their own drafts
CREATE POLICY "Users can delete their own properties"
ON public.properties FOR DELETE
USING (owner_id = auth.uid()::text);

-- 2. DEALS (Inquiries / Pitches)
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view deals they are involved in" ON public.deals;
DROP POLICY IF EXISTS "Brokers can insert deals" ON public.deals;

-- Users can view deals if they are the broker OR the owner of the property
CREATE POLICY "Users can view deals they are involved in"
ON public.deals FOR SELECT
USING (
    broker_id = auth.uid()::text 
    OR 
    property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()::text
    )
);

-- Brokers can initiate a deal (e.g. pitch)
CREATE POLICY "Brokers can insert deals"
ON public.deals FOR INSERT
WITH CHECK (broker_id = auth.uid()::text);

-- Owners can update a deal (e.g. accept/decline)
CREATE POLICY "Owners can update deals"
ON public.deals FOR UPDATE
USING (
    property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()::text
    )
);

-- 3. CONNECTS LEDGER
ALTER TABLE public.connect_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own balances" ON public.connect_balances;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.connect_transactions;

CREATE POLICY "Users can view their own balances"
ON public.connect_balances FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own transactions"
ON public.connect_transactions FOR SELECT
USING (user_id = auth.uid()::text);

-- Important: No INSERT/UPDATE/DELETE policies for Connects on the client.
-- All Connect transactions (spending, granting) MUST be done via Edge Functions 
-- using the Supabase Service Role key to bypass RLS securely.
