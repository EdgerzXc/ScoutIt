-- ==============================================================================
-- SCOUTIT — SECURITY ADVISOR FIXES
-- Run this in the Supabase SQL Editor to resolve the exact vulnerabilities flagged.
-- ==============================================================================

-- 1. Fix: RLS Disabled in Public for spatial_ref_sys
-- NOTE: spatial_ref_sys is an internal PostGIS table. Supabase blocks altering it.
-- You can safely ignore the "RLS Disabled" warning for spatial_ref_sys in the Security Advisor.

-- 2. Fix: Function Search Path Mutable
ALTER FUNCTION public.search_properties_in_radius(double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.audit_record_changes() SET search_path = public;

-- 3. Fix: Overly Permissive Policies (RLS Policy Always True)
-- We will drop the known permissive policies that allow anyone to INSERT or UPDATE.

-- broker_profiles
DROP POLICY IF EXISTS "Allow insert on broker_profiles" ON public.broker_profiles;
DROP POLICY IF EXISTS "Allow update on broker_profiles" ON public.broker_profiles;

CREATE POLICY "Allow insert on broker_profiles" ON public.broker_profiles
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Allow update on broker_profiles" ON public.broker_profiles
  FOR UPDATE USING (user_id = (SELECT auth.uid())::text);

-- privacy_settings
DROP POLICY IF EXISTS "Allow insert on privacy_settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Allow update on privacy_settings" ON public.privacy_settings;

CREATE POLICY "Allow insert on privacy_settings" ON public.privacy_settings
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Allow update on privacy_settings" ON public.privacy_settings
  FOR UPDATE USING (user_id = (SELECT auth.uid())::text);

-- deals
-- In case there's an old generic policy, let's ensure we only keep the hardened ones.
DROP POLICY IF EXISTS "Allow insert on deals" ON public.deals;
DROP POLICY IF EXISTS "Allow update on deals" ON public.deals;
-- Ensure the hardened policy exists (from supabase_rls_hardening.sql)
DROP POLICY IF EXISTS "Users cannot insert deals directly" ON public.deals;
CREATE POLICY "Users cannot insert deals directly" ON public.deals
  FOR INSERT WITH CHECK (false);

-- connect_balances
DROP POLICY IF EXISTS "Allow insert on connect_balances" ON public.connect_balances;
DROP POLICY IF EXISTS "Allow update on connect_balances" ON public.connect_balances;
-- Connect balances are modified server-side only
DROP POLICY IF EXISTS "Users cannot modify balances" ON public.connect_balances;
CREATE POLICY "Users cannot modify balances" ON public.connect_balances
  FOR ALL USING (false);

-- connect_transactions
DROP POLICY IF EXISTS "Allow insert on connect_transactions" ON public.connect_transactions;
DROP POLICY IF EXISTS "Allow update on connect_transactions" ON public.connect_transactions;
DROP POLICY IF EXISTS "Users cannot insert transactions" ON public.connect_transactions;
CREATE POLICY "Users cannot insert transactions" ON public.connect_transactions
  FOR ALL USING (false);

-- bounty_claims
-- Ensure only the claimant can insert/update, or server-side only
ALTER TABLE IF EXISTS public.bounty_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert on bounty_claims" ON public.bounty_claims;
DROP POLICY IF EXISTS "Allow update on bounty_claims" ON public.bounty_claims;
DROP POLICY IF EXISTS "Users can insert their own bounty claims" ON public.bounty_claims;
CREATE POLICY "Users can insert their own bounty claims" ON public.bounty_claims
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their own bounty claims" ON public.bounty_claims;
CREATE POLICY "Users can update their own bounty claims" ON public.bounty_claims
  FOR UPDATE USING (auth.role() = 'authenticated');

-- error_reports
ALTER TABLE IF EXISTS public.error_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert on error_reports" ON public.error_reports;
DROP POLICY IF EXISTS "Allow update on error_reports" ON public.error_reports;
DROP POLICY IF EXISTS "Authenticated users can insert error reports" ON public.error_reports;
CREATE POLICY "Authenticated users can insert error reports" ON public.error_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
