-- SUPERSEDED - DO NOT APPLY.
-- Retained only as historical intent. Live production now has stricter lifecycle,
-- deal-update, and atomic Connect-spend controls established by the 2026-08-12
-- critical fixes. Applying this file would weaken those controls and create an
-- obsolete spend_connects overload.
-- Authority decision and audit:
-- _SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12.md

-- Production Security RLS & Permission Hardening
-- Drops legacy dev_all_* policies and enforces strict authenticated owner RLS rules.

-- 1. PROPERTIES
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_all_properties" ON public.properties;
DROP POLICY IF EXISTS "dev_all_properties_select" ON public.properties;
DROP POLICY IF EXISTS "Public read for properties" ON public.properties;
DROP POLICY IF EXISTS "Owners manage own properties" ON public.properties;

CREATE POLICY "Public read for live properties"
  ON public.properties FOR SELECT
  USING (
    pipeline_status = 'approved' OR
    (auth.uid() IS NOT NULL AND owner_id = auth.uid()::text)
  );

CREATE POLICY "Owners insert own properties"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid()::text);

CREATE POLICY "Owners update own properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() IS NOT NULL AND owner_id = auth.uid()::text)
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid()::text);

CREATE POLICY "Owners delete own properties"
  ON public.properties FOR DELETE
  USING (auth.uid() IS NOT NULL AND owner_id = auth.uid()::text);

-- 2. USER PROFILES
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_all_user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;

CREATE POLICY "Users view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. DEALS
ALTER TABLE IF EXISTS public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_all_deals" ON public.deals;
DROP POLICY IF EXISTS "Parties view own deals" ON public.deals;
DROP POLICY IF EXISTS "Parties update own deals" ON public.deals;

CREATE POLICY "Parties view own deals"
  ON public.deals FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      buyer_id = auth.uid()::text OR
      broker_id = auth.uid()::text
    )
  );

CREATE POLICY "Parties update own deals"
  ON public.deals FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      buyer_id = auth.uid()::text OR
      broker_id = auth.uid()::text
    )
  );

-- 4. CONNECTS SPEND RPC ALIAS
CREATE OR REPLACE FUNCTION public.spend_connects(
  p_user_id TEXT,
  p_role TEXT,
  p_amount INTEGER,
  p_tier TEXT DEFAULT 'starry',
  p_source TEXT DEFAULT 'spend',
  p_reason TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  remaining_total INTEGER,
  spent_granted INTEGER,
  spent_purchased INTEGER,
  spent_reward INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.spend_connects_atomic(
    p_user_id, p_role, p_amount, p_tier, p_source, p_reason, p_reference_id
  );
END;
$$;
