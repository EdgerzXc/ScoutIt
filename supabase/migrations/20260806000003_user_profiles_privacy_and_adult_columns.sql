-- ═══════════════════════════════════════════════════════════════════════
-- COLUMNS PRIV-02 / SET-01 WERE WRITTEN AGAINST BUT NEVER CREATED
-- NEW_IDEAS.md §47
-- ═══════════════════════════════════════════════════════════════════════
--
-- ✅ APPLIED TO PRODUCTION 2026-08-06.
--
-- `/api/user/privacy-settings` selected four columns from user_profiles.
-- THREE OF THEM DID NOT EXIST. Every GET and POST returned a 500. The feature
-- shipped 2026-08-05 marked "CODE COMPLETE" and had never worked once.
--
-- `assertAdultEligibility()` (PRIV-02, the RA 10173 / legal-capacity gate) hit
-- the same missing column — and failed OPEN. On error `profile` was null, and
-- `profile?.adult_eligibility_status !== "underage"` evaluated `undefined !==
-- "underage"` → TRUE. The age gate passed everyone, every time.
--
-- Same shape as §40: ticked as done, the migration never written.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS telemetry_opt_out BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_out BOOLEAN NOT NULL DEFAULT false;

-- ⚠️ DEFAULT IS 'unknown', NOT 'declared_adult'.
--
-- Defaulting to 'declared_adult' would have silently recorded that all 40
-- existing users attested to being over 18 — a legal-capacity claim (Civil
-- Code; RA 8792) none of them ever made. 'unknown' records the truth: not
-- asked yet. The gate decides what to do about that; the schema must not
-- invent an attestation.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS adult_eligibility_status TEXT NOT NULL DEFAULT 'unknown';

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_adult_eligibility_status_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_adult_eligibility_status_check
  CHECK (adult_eligibility_status IN ('unknown', 'declared_adult', 'underage', 'verified_adult'));

COMMENT ON COLUMN public.user_profiles.adult_eligibility_status IS
  'Legal capacity attestation (Civil Code 18+, RA 8792). unknown = never asked - do NOT treat as adult. declared_adult = user attested. verified_adult = staff/document checked. underage = blocked. See NEW_IDEAS.md 34.2 and 47.';

COMMENT ON COLUMN public.user_profiles.telemetry_opt_out IS
  'RA 10173 - user opted out of behavioural telemetry (deviceTracker).';

COMMENT ON COLUMN public.user_profiles.marketing_opt_out IS
  'RA 10173 - user opted out of marketing contact.';

-- ═══════════════════════════════════════════════════════════════════════
-- AFTER APPLYING
-- ═══════════════════════════════════════════════════════════════════════
-- 1. ✅ /api/user/privacy-settings works — verified against production.
-- 2. ✅ assertAdultEligibility() rewritten to fail CLOSED and to test for a
--       POSITIVE attestation, not merely the absence of 'underage'.
-- 3. ⬜ assertAdultEligibility() still has NO CALLERS. Nothing is age-gated.
--       See NEW_IDEAS.md §47.3 — wiring it is a product decision, because all
--       40 existing users are 'unknown' and would be blocked on day one.
-- ═══════════════════════════════════════════════════════════════════════
