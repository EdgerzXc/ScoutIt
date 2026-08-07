-- ═══════════════════════════════════════════════════════════════════════
-- ONE VOCABULARY FOR "RELATIONSHIP TO A PROPERTY"
-- NEW_IDEAS_2.md §55 · WORK ORDER W8
-- ═══════════════════════════════════════════════════════════════════════
--
-- ⚠️ NOT YET APPLIED. Apply this BEFORE deploying the W8 claim UI, or the
-- claim insert will violate the old CHECK constraint and 500. See C27.
--
-- ── THE PROBLEM ────────────────────────────────────────────────────────
-- The codebase had TWO spellings for the same three concepts:
--
--   properties.lister_relationship   'owner'        'property_manager'      'authorized_broker'
--   property_claims.claimed_relationship
--                                    'direct_owner' 'authorized_manager'    'authorized_broker'
--
-- Only the third one matched. `src/lib/listerRelationship.js` — the module the
-- publish flow, `isClaimable()` and the UI all read — knows the first row.
-- `/api/property/claim` hardcoded the second.
--
-- Nothing broke yet only because the claim endpoint has never had a caller
-- (§51). The moment W8 shipped a UI, a claim asserting ownership would have
-- been stored as 'direct_owner' while the listing's own declaration said
-- 'owner', and any comparison between them — "does this claim contradict the
-- declaration?", exactly the question a RESA dispute turns on — would have
-- silently found no match.
--
-- This is Standing Rule 4 with the roles reversed. There, a new status value
-- made a filter show nothing. Here, two vocabularies would make a comparison
-- find nothing. Both fail by returning an empty result that looks like a fact.
--
-- ── WHY CHANGE THE CLAIMS TABLE, NOT THE PROPERTIES ONE ────────────────
-- 1. `properties.lister_relationship` is load-bearing TODAY: the publish gate
--    writes it, `isClaimable()` reads it, and the §50 migration constrains it.
-- 2. `property_claims` has ZERO ROWS (verified against the live database
--    2026-08-06, not inferred), because the endpoint has no caller.
--
-- So one side is in production use and the other has never been written to.
-- The empty table moves.
--
-- The UPDATE below is written to handle rows anyway. "It should be empty" is
-- how data gets silently dropped; a migration that only works on the state you
-- expect is not a migration.

-- ── property_claims.claimed_relationship ───────────────────────────────
ALTER TABLE public.property_claims
  DROP CONSTRAINT IF EXISTS property_claims_claimed_relationship_check;

UPDATE public.property_claims
   SET claimed_relationship = CASE claimed_relationship
         WHEN 'direct_owner'       THEN 'owner'
         WHEN 'authorized_manager' THEN 'property_manager'
         ELSE claimed_relationship
       END
 WHERE claimed_relationship IN ('direct_owner', 'authorized_manager');

ALTER TABLE public.property_claims
  ADD CONSTRAINT property_claims_claimed_relationship_check
  CHECK (claimed_relationship IN ('owner', 'property_manager', 'authorized_broker'));

COMMENT ON COLUMN public.property_claims.claimed_relationship IS
  'Canonical vocabulary, shared with properties.lister_relationship and '
  'src/lib/listerRelationship.js: owner | property_manager | authorized_broker. '
  'Do not introduce a fourth spelling — see NEW_IDEAS_2.md §55.';

-- ── property_control_assignments.relationship_type ─────────────────────
-- Unconstrained TEXT until now, so it was free to acquire a THIRD spelling.
-- Same vocabulary, same constraint, same reason.
ALTER TABLE public.property_control_assignments
  DROP CONSTRAINT IF EXISTS property_control_assignments_relationship_type_check;

UPDATE public.property_control_assignments
   SET relationship_type = CASE relationship_type
         WHEN 'direct_owner'       THEN 'owner'
         WHEN 'authorized_manager' THEN 'property_manager'
         ELSE relationship_type
       END
 WHERE relationship_type IN ('direct_owner', 'authorized_manager');

ALTER TABLE public.property_control_assignments
  ADD CONSTRAINT property_control_assignments_relationship_type_check
  CHECK (relationship_type IN ('owner', 'property_manager', 'authorized_broker'));

-- ── property_claim_events had RLS ON and NO POLICIES ───────────────────
-- That denies everything to normal users, which is the safe direction and is
-- what we want — the audit trail is written by the service role and read by
-- Mission Control. Stated explicitly here so a future reader doesn't "fix" the
-- missing policy by adding a permissive one. The absence is deliberate.
COMMENT ON TABLE public.property_claim_events IS
  'Append-only claim audit trail. RLS is enabled with NO policies ON PURPOSE: '
  'service-role access only. Do not add a permissive policy — a claimant being '
  'able to read the review trail on their own disputed claim is a disclosure '
  'problem, not a feature.';

-- ── A claimant may not claim their own listing ─────────────────────────
-- Cheap integrity guard the endpoint did not have. Claiming a property you
-- already control is not a claim, and letting it through would create a
-- self-approving path through the dispute process.
CREATE UNIQUE INDEX IF NOT EXISTS property_claims_one_active_per_user_idx
  ON public.property_claims (property_id, claimant_user_id)
  WHERE status NOT IN ('rejected', 'withdrawn', 'closed');

-- ═══════════════════════════════════════════════════════════════════════
-- 🔴 property_control_assignments WAS WORLD-READABLE
-- ═══════════════════════════════════════════════════════════════════════
-- The original policy:
--
--   CREATE POLICY "Public view active control assignments"
--     ON public.property_control_assignments
--     FOR SELECT USING (is_active = TRUE);
--
-- `is_active = TRUE` is not an authorisation check. It selects rows, and every
-- selected row carries `controller_user_id` — so any anonymous visitor could
-- read the mapping from property to the PERSON who controls it, plus the
-- `claim_id` that produced it.
--
-- That contradicts §46's boundary directly: a tier buys property DATA, never
-- access to a PERSON. Here it wasn't even a tier — it was free to everyone
-- with the anon key, which ships in the browser.
--
-- Same shape as §43: a policy written to answer "which rows are live?" being
-- used to answer "who may read this?". Those are different questions and the
-- first one always says yes.
--
-- Nothing breaks by removing it: the table has no callers (§51), and the one
-- legitimate public need — "is this property claimable?" — is answered by
-- /api/property/claim from `properties.lister_relationship`, without naming
-- anybody.
DROP POLICY IF EXISTS "Public view active control assignments"
  ON public.property_control_assignments;

CREATE POLICY "Controllers view their own assignments"
  ON public.property_control_assignments
  FOR SELECT USING (auth.uid() = controller_user_id);

COMMENT ON TABLE public.property_control_assignments IS
  'Who controls which property. controller_user_id is PERSONAL DATA — never '
  'expose this table publicly. Public claimability is answered from '
  'properties.lister_relationship instead. See NEW_IDEAS_2.md §55.';
