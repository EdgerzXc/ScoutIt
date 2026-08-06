-- ═══════════════════════════════════════════════════════════════════════
-- LISTER RELATIONSHIP DECLARATION (RESA RA 9646)
-- NEW_IDEAS.md §34.3 · NEW_IDEAS_2.md §50
-- ═══════════════════════════════════════════════════════════════════════
--
-- ✅ APPLIED TO PRODUCTION 2026-08-06.
--
-- WHY: RESA Law RA 9646 exists to eliminate colorum agents — unlicensed or
-- unauthorised people listing property without the owner's consent. Before
-- this, a broker could list any building on ScoutIt and the real title holder
-- would never know. The declaration is what makes §37's "Claim This Property"
-- flow meaningful: a broker's listing is PROVISIONAL until the owner asserts.
--
-- ⚠️ INTERNAL ONLY. Never on a public directory card, never in the /api/cms
-- proxy, never in a broker-facing briefing. Internal uses only: Mission
-- Control CRM, dispute resolution, and deciding whether to offer the claim CTA.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS lister_relationship TEXT;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_lister_relationship_check;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_lister_relationship_check
  CHECK (lister_relationship IS NULL OR lister_relationship IN
    ('owner', 'property_manager', 'authorized_broker'));

-- ⚠️ JSONB, NOT A BOOLEAN — §34.3 is explicit, and the reason is evidentiary.
--
-- A boolean tells you they agreed. A timestamped record tells you WHEN and
-- WHICH VERSION of the disclaimer they saw. In a RESA dispute the second is
-- evidence; the first is an assertion. Shape:
--   { "agreed": true, "timestamp": "ISO8601", "disclaimer_version": "v1" }
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_claim_agreed JSONB;

CREATE INDEX IF NOT EXISTS properties_lister_relationship_idx
  ON public.properties (lister_relationship)
  WHERE lister_relationship IS DISTINCT FROM 'owner';

-- ═══════════════════════════════════════════════════════════════════════
-- NULL IS DELIBERATE AND MEANS "NEVER ASKED"
-- ═══════════════════════════════════════════════════════════════════════
-- Every listing created before today has lister_relationship = NULL. They are
-- NOT backfilled to 'owner'.
--
-- `isClaimable()` treats NULL as CLAIMABLE, not as owner-declared. Those are
-- precisely the listings most likely to need claiming, because nobody was ever
-- asked about them. Assuming ownership from silence is the exact failure this
-- feature exists to prevent — the same reasoning as §47.2's refusal to default
-- adult_eligibility_status to 'declared_adult'.
--
-- Enforced at PUBLISH, not at draft creation: a draft harms nobody, and
-- demanding a legal declaration before someone has decided to list is friction
-- in the wrong place. Publication is the moment the claim becomes public.
