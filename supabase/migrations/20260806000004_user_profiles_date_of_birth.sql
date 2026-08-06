-- ═══════════════════════════════════════════════════════════════════════
-- DATE OF BIRTH — the 18+ legal capacity gate
-- NEW_IDEAS.md §34.2 · §48
-- ═══════════════════════════════════════════════════════════════════════
--
-- ✅ APPLIED TO PRODUCTION 2026-08-06.
--
-- Legal basis: Civil Code of the Philippines (capacity to contract requires
-- 18+), RA 8792 (E-Commerce Act — contracts need capacitated parties),
-- RA 10173 (a birth date is SENSITIVE personal information).
--
-- ⚠️ INTERNAL ONLY. Must never appear on a public profile, a directory card,
-- the /api/cms proxy, or the `public_profiles` view. It is absent from that
-- view's explicit column list by construction (migration 20260806000001), so
-- it cannot leak through the public profile path.
--
-- NULLABLE ON PURPOSE. Owner decision 2026-08-06: the 40 accounts that
-- existed before the gate are GRANDFATHERED and are never asked
-- retroactively. NULL records the truth for them — "not collected" — rather
-- than a fabricated value.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN public.user_profiles.date_of_birth IS
  'RA 10173 SENSITIVE. Internal only - never expose publicly. Collected at onboarding for the Civil Code 18+ capacity check. NULL = not collected (pre-2026-08-06 accounts, grandfathered). See NEW_IDEAS.md 34.2 and 48.';

-- ═══════════════════════════════════════════════════════════════════════
-- HOW THE GRANDFATHERING WORKS
-- ═══════════════════════════════════════════════════════════════════════
-- Not a flag on the row — a CUTOFF constant in src/lib/adultEligibility.js:
--
--   AGE_GATE_CUTOFF = 2026-08-06T00:00:00Z
--
--   created_at <  cutoff  →  'unknown' is allowed  (the 40)
--   created_at >= cutoff  →  'unknown' is DENIED
--
-- A blanket "allow unknown" would have left the hole open for every future
-- signup too. The cutoff closes on its own: the grandfathered set can only
-- ever shrink.
--
-- ⚠️ NEVER move this constant forward. Doing so would retroactively excuse
-- accounts created after the gate already existed.
