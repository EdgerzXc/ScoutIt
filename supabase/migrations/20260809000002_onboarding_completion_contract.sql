-- ONBOARDING COMPLETION CONTRACT
-- Prepared 2026-08-09. Owner-gated: apply only through ScoutIt's approved,
-- audited Mission Control migration operation. Do not paste ad hoc into SQL.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS primary_mode TEXT,
  ADD COLUMN IF NOT EXISTS location_focus TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_primary_mode_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_primary_mode_check
  CHECK (primary_mode IS NULL OR primary_mode IN ('buyer', 'owner', 'broker'));

COMMENT ON COLUMN public.user_profiles.primary_mode IS
  'Initial dashboard mode. buyer is the UI alias for the legacy seeker role. Signup permits exactly buyer, owner, or broker; additional roles are activated later.';
COMMENT ON COLUMN public.user_profiles.location_focus IS
  'Private optional scouting-area preference collected during buyer/seeker onboarding. Never expose through public_profiles or the public CMS.';
COMMENT ON COLUMN public.user_profiles.onboarding_completed_at IS
  'Set only after the profile and Connect wallet are successfully provisioned. NULL means the authenticated account must finish onboarding.';

-- Derive existing users without inventing new capabilities. active_roles wins
-- because founder/admin and multi-role accounts cannot be represented safely by
-- the legacy role column alone. Buyer/seeker is preferred when already present.
UPDATE public.user_profiles
SET primary_mode = CASE
  WHEN active_roles && ARRAY['buyer', 'seeker']::TEXT[] THEN 'buyer'
  WHEN active_roles @> ARRAY['owner']::TEXT[] THEN 'owner'
  WHEN active_roles @> ARRAY['broker']::TEXT[] THEN 'broker'
  WHEN role IN ('buyer', 'seeker') THEN 'buyer'
  WHEN role = 'owner' THEN 'owner'
  WHEN role = 'broker' THEN 'broker'
  ELSE NULL
END
WHERE primary_mode IS NULL;

-- Mark only accounts whose role can be derived and whose age state is allowed.
-- Explicit underage is always excluded. The fixed date matches AGE_GATE_CUTOFF
-- in src/lib/adultEligibility.js and must never move forward.
UPDATE public.user_profiles
SET onboarding_completed_at = COALESCE(onboarding_completed_at, NOW())
WHERE primary_mode IS NOT NULL
  AND adult_eligibility_status <> 'underage'
  AND (
    adult_eligibility_status IN ('declared_adult', 'verified_adult')
    OR created_at < TIMESTAMPTZ '2026-08-06T00:00:00.000Z'
    OR is_example_account IS TRUE
  );
