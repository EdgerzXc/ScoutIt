-- ═══════════════════════════════════════════════════════════════════════
-- RLS AUDIT — public profile column exposure, buyer deal access,
--             and the deny-all decision recorded
-- NEW_IDEAS.md §25.2 · §35 Layer 1 · §43
-- ═══════════════════════════════════════════════════════════════════════
--
-- ✅ APPLIED TO PRODUCTION 2026-08-06 (three migrations, reproduced here
--    as one reviewable file).
--
-- FINDING 1 — 🔴 public profiles leaked every column
-- --------------------------------------------------
-- RLS is ROW level, not column level. The policy
--     "Public can read public profiles" USING (is_profile_public = true)
-- let ANY browser select ANY column of ANY public profile:
--   · connects_balance   — wallet balance of every public user
--   · moderation_note    — internal staff commentary about the user
--   · is_shadowbanned    — the entire point of a shadowban is that they
--                          cannot tell; this let them check
--   · role               — reveals which accounts are admins
--
-- The app was disciplined: loadPublicProfile listed only safe columns, with a
-- comment claiming this was "enforced at query level". A query is not
-- enforcement. Anyone with a browser console could ask for the rest — the
-- exact §25.1 lesson ("treat client-side gating as cosmetic") applied to RLS.
--
-- FIX: a public-safe VIEW becomes the only browser path to another user's
-- profile, and the blanket public-read policy is dropped so the base table is
-- own-row only.
--
-- FINDING 2 — the deals policy omitted the buyer
-- ----------------------------------------------
-- SELECT allowed broker_id or the property owner. The BUYER — who spent the
-- Connect and is unambiguously a party — could not read their own deals from
-- the browser. It failed closed so nothing leaked, but every seeker reading
-- deals client-side got an empty list. Server routes use the service role,
-- which is why it went unnoticed.
--
-- FINDING 3 — 19 deny-all tables, not the 10 §25.2 listed
-- -------------------------------------------------------
-- Audited: every one is reached ONLY from server routes holding the service
-- role, which bypasses RLS. Deny-all is CORRECT, not an oversight. Writing
-- owner-scoped policies would widen the surface to browsers for no gain.
-- The decision is recorded via COMMENT ON TABLE so it lives in the schema.

-- ── 1. Public-safe profile view ────────────────────────────────────────
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id, display_name, avatar_url, location, headline, bio, firm, service,
  member_since, subscription_tier, active_roles, provider_type,
  provider_availability, is_profile_public, is_example_account,
  prc_license, prc_verified, prc_expiry, dhsud_number
FROM public.user_profiles
WHERE is_profile_public = true
  AND COALESCE(is_shadowbanned, false) = false
  AND archived_at IS NULL;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Dropping this is what actually closes the hole. The view keeps public
-- profile pages working.
DROP POLICY IF EXISTS "Public can read public profiles" ON public.user_profiles;

-- ── 2. Buyers can read their own deals ─────────────────────────────────
DROP POLICY IF EXISTS "Users can read their own deals" ON public.deals;

CREATE POLICY "Users can read their own deals"
  ON public.deals FOR SELECT
  USING (
    buyer_id = (SELECT auth.uid())::text
    OR broker_id = (SELECT auth.uid())::text
    OR property_id IN (
      SELECT properties.id FROM public.properties
      WHERE properties.owner_id = (SELECT auth.uid())::text
    )
  );

-- ── 3. Deny-all tables documented (COMMENT ON TABLE ×19) ───────────────
-- Applied separately; see migration `document_service_role_only_tables`.
-- Every comment states "RLS deny-all BY DESIGN. Service-role only." plus the
-- specific reason a browser must never read that table.

-- ═══════════════════════════════════════════════════════════════════════
-- ⚠️ IF PUBLIC PROFILES EVER BREAK
-- ═══════════════════════════════════════════════════════════════════════
-- The base table is now own-row only. Anything in the browser needing another
-- user's profile MUST read `public_profiles`. Do NOT restore the old blanket
-- policy — add the column to the view instead, and only if it is genuinely
-- safe for an anonymous visitor to see.
