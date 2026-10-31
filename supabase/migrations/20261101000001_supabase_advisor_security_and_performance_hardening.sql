-- ============================================================================
-- 20261101000001_supabase_advisor_security_and_performance_hardening.sql
-- Remediates Supabase Security & Performance Advisor findings:
--   1. Security ERROR: public.public_profiles security_definer_view
--   2. Performance WARN: 21 auth_rls_initplan policies
--   3. Performance WARN: 8 multiple_permissive_policies tables
--   4. Performance INFO: public.open_gate_role_listings primary key
--   5. Performance INFO: 48 unindexed_foreign_keys covering indexes
-- ============================================================================

-- 1. Security ERROR: Convert public.public_profiles to security_invoker = true
--    backed by a non-exposed private schema helper so anonymous visitors can
--    still read public profiles without exposing private user_profiles columns
--    or auto-updatable SECURITY DEFINER view surfaces.
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.get_public_profiles()
RETURNS TABLE (
  id text,
  display_name text,
  avatar_url text,
  location text,
  headline text,
  bio text,
  firm text,
  service text,
  member_since timestamp with time zone,
  subscription_tier text,
  active_roles text[],
  provider_type text,
  provider_availability boolean,
  is_profile_public boolean,
  is_example_account boolean,
  prc_license text,
  prc_verified boolean,
  prc_expiry date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.display_name,
    u.avatar_url,
    u.location,
    u.headline,
    u.bio,
    u.firm,
    u.service,
    u.member_since,
    u.subscription_tier,
    u.active_roles,
    u.provider_type,
    u.provider_availability,
    u.is_profile_public,
    u.is_example_account,
    CASE
      WHEN ((u.prc_verified IS TRUE) AND ((u.prc_expiry IS NULL) OR (u.prc_expiry >= CURRENT_DATE))) THEN u.prc_license
      ELSE NULL::text
    END AS prc_license,
    u.prc_verified,
    CASE
      WHEN ((u.prc_verified IS TRUE) AND ((u.prc_expiry IS NULL) OR (u.prc_expiry >= CURRENT_DATE))) THEN u.prc_expiry
      ELSE NULL::date
    END AS prc_expiry
  FROM public.user_profiles u
  WHERE ((u.is_profile_public = true) AND (COALESCE(u.is_shadowbanned, false) = false) AND (u.archived_at IS NULL));
$$;

REVOKE ALL ON FUNCTION app_private.get_public_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.get_public_profiles() TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  display_name,
  avatar_url,
  location,
  headline,
  bio,
  firm,
  service,
  member_since,
  subscription_tier,
  active_roles,
  provider_type,
  provider_availability,
  is_profile_public,
  is_example_account,
  prc_license,
  prc_verified,
  prc_expiry
FROM app_private.get_public_profiles();

REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

-- 2. Performance WARN: Rewrite 21 auth_rls_initplan policies to use (SELECT auth.uid()) / (SELECT auth.role())
ALTER POLICY "calendar_connections_select_own" ON public.calendar_connections
  USING (owner_user_id = ((SELECT auth.uid()))::text);

ALTER POLICY "calendar_events_delete_own" ON public.calendar_events
  USING (owner_user_id = ((SELECT auth.uid()))::text);

ALTER POLICY "calendar_events_insert_own" ON public.calendar_events
  WITH CHECK (owner_user_id = ((SELECT auth.uid()))::text);

ALTER POLICY "calendar_events_select_own" ON public.calendar_events
  USING (owner_user_id = ((SELECT auth.uid()))::text);

ALTER POLICY "calendar_events_update_own" ON public.calendar_events
  USING (owner_user_id = ((SELECT auth.uid()))::text);

ALTER POLICY "Users read own blocks" ON public.connect_blocks
  USING (((SELECT auth.uid()))::text = blocker_id);

ALTER POLICY "Authenticated users can insert error reports" ON public.error_reports
  WITH CHECK ((SELECT auth.role()) = 'authenticated'::text);

ALTER POLICY "Users can read their own notifications" ON public.private_notifications
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own notifications" ON public.private_notifications
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Claimants upload own documents" ON public.property_claim_documents
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.property_claims c
    WHERE c.id = property_claim_documents.claim_id
      AND c.claimant_user_id = (SELECT auth.uid())
  ));

ALTER POLICY "Claimants view own documents" ON public.property_claim_documents
  USING (EXISTS (
    SELECT 1
    FROM public.property_claims c
    WHERE c.id = property_claim_documents.claim_id
      AND c.claimant_user_id = (SELECT auth.uid())
  ));

ALTER POLICY "Claimants insert own claims" ON public.property_claims
  WITH CHECK ((SELECT auth.uid()) = claimant_user_id);

ALTER POLICY "Claimants view own claims" ON public.property_claims
  USING ((SELECT auth.uid()) = claimant_user_id);

ALTER POLICY "Controllers view their own assignments" ON public.property_control_assignments
  USING ((SELECT auth.uid()) = controller_user_id);

ALTER POLICY "Users can update own availability" ON public.user_availability
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can read their own behavioral metrics" ON public.user_behavioral_metrics
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can read their own or unlocked reviews" ON public.user_behavioral_reviews
  USING (((SELECT auth.uid()) = reviewer_id) OR (((SELECT auth.uid()) = target_user_id) AND (is_double_blind_locked = false) AND (is_disputed = false)));

ALTER POLICY "Users can submit their own review" ON public.user_behavioral_reviews
  WITH CHECK ((SELECT auth.uid()) = reviewer_id);

ALTER POLICY "Guests can insert appointments" ON public.viewing_appointments
  WITH CHECK ((SELECT auth.uid()) = guest_id);

ALTER POLICY "Parties can read their appointments" ON public.viewing_appointments
  USING (((SELECT auth.uid()) = host_id) OR ((SELECT auth.uid()) = guest_id));

ALTER POLICY "Parties can update appointments" ON public.viewing_appointments
  USING (((SELECT auth.uid()) = host_id) OR ((SELECT auth.uid()) = guest_id));

-- 3. Performance WARN: Consolidate overlapping multiple_permissive_policies
ALTER POLICY "No one can read audit logs except Service Role" ON public.audit_logs TO service_role;
ALTER POLICY "service role only writes" ON public.badge_definitions TO service_role;
ALTER POLICY "Users cannot modify balances" ON public.connect_balances TO service_role;
ALTER POLICY "Users cannot insert transactions" ON public.connect_transactions TO service_role;
ALTER POLICY "user_availability_select_own" ON public.user_availability TO service_role;

ALTER POLICY "crm_tasks_assignee_read" ON public.crm_tasks
  USING ((owner_user_id = ((SELECT auth.uid()))::text) OR (assignee_user_id = ((SELECT auth.uid()))::text));
ALTER POLICY "crm_tasks_owner_all" ON public.crm_tasks TO service_role;

ALTER POLICY "Public can read projects" ON public.projects
  USING ((status = 'active'::text) OR (status = 'showcase'::text) OR (provider_id = ((SELECT auth.uid()))::text));
ALTER POLICY "Users can read their own projects" ON public.projects TO service_role;

ALTER POLICY "Public can read live properties" ON public.properties
  USING ((lifecycle_state = 'live'::text) OR (owner_id = ((SELECT auth.uid()))::text));
ALTER POLICY "Users can read their own properties" ON public.properties TO service_role;

-- 4. Performance INFO: Add primary key to public.open_gate_role_listings
ALTER TABLE public.open_gate_role_listings
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.open_gate_role_listings
  ADD CONSTRAINT open_gate_role_listings_pkey PRIMARY KEY (id);

-- 5. Performance INFO: Add covering indexes for all 48 unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_admin_users_invited_by ON public.admin_users (invited_by);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_created_by ON public.badge_definitions (created_by);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_updated_by ON public.badge_definitions (updated_by);
CREATE INDEX IF NOT EXISTS idx_blocked_access_blocked_by ON public.blocked_access (blocked_by);
CREATE INDEX IF NOT EXISTS idx_brain_chunks_document_id ON public.brain_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_broker_career_claims_attested_by ON public.broker_career_claims (attested_by);
CREATE INDEX IF NOT EXISTS idx_broker_career_claims_reviewed_by ON public.broker_career_claims (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_broker_dossier_audit_events_actor_user_id ON public.broker_dossier_audit_events (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_recommendations_author_user_id ON public.broker_recommendations (author_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_recommendations_moderated_by ON public.broker_recommendations (moderated_by);
CREATE INDEX IF NOT EXISTS idx_broker_recommendations_qualifying_handshake_id ON public.broker_recommendations (qualifying_handshake_id);
CREATE INDEX IF NOT EXISTS idx_broker_social_proof_audit_events_actor_user_id ON public.broker_social_proof_audit_events (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_broker_social_proof_audit_events_contribution_id ON public.broker_social_proof_audit_events (contribution_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_handled_by ON public.contact_messages (handled_by);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.contact_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_deal_id ON public.crm_tasks (deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_handshakes_property_id ON public.deal_handshakes (property_id);
CREATE INDEX IF NOT EXISTS idx_deal_routing_recipients_representation_id ON public.deal_routing_recipients (representation_id);
CREATE INDEX IF NOT EXISTS idx_deals_unit_id ON public.deals (unit_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_inquiries_form_id ON public.enterprise_inquiries (form_id);
CREATE INDEX IF NOT EXISTS idx_faq_block_appeals_faq_id ON public.faq_block_appeals (faq_id);
CREATE INDEX IF NOT EXISTS idx_faq_block_appeals_reviewer_id ON public.faq_block_appeals (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_faq_block_evidence_faq_id ON public.faq_block_evidence (faq_id);
CREATE INDEX IF NOT EXISTS idx_faq_block_evidence_user_id ON public.faq_block_evidence (user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_updated_by ON public.feature_flags (updated_by);
CREATE INDEX IF NOT EXISTS idx_intel_briefings_source_id ON public.intel_briefings (source_id);
CREATE INDEX IF NOT EXISTS idx_mission_control_actions_actor_id ON public.mission_control_actions (actor_id);
CREATE INDEX IF NOT EXISTS idx_open_gate_role_listings_recipient_id ON public.open_gate_role_listings (recipient_id);
CREATE INDEX IF NOT EXISTS idx_open_gate_role_listings_unit_id ON public.open_gate_role_listings (unit_id);
CREATE INDEX IF NOT EXISTS idx_private_notifications_created_by ON public.private_notifications (created_by);
CREATE INDEX IF NOT EXISTS idx_private_notifications_user_id ON public.private_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_property_claim_documents_claim_id ON public.property_claim_documents (claim_id);
CREATE INDEX IF NOT EXISTS idx_property_claim_events_actor_id ON public.property_claim_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_property_claim_events_claim_id ON public.property_claim_events (claim_id);
CREATE INDEX IF NOT EXISTS idx_property_claims_claimant_user_id ON public.property_claims (claimant_user_id);
CREATE INDEX IF NOT EXISTS idx_property_claims_reviewer_id ON public.property_claims (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_property_control_assignments_assigned_by_staff_id ON public.property_control_assignments (assigned_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_property_control_assignments_claim_id ON public.property_control_assignments (claim_id);
CREATE INDEX IF NOT EXISTS idx_property_control_assignments_controller_user_id ON public.property_control_assignments (controller_user_id);
CREATE INDEX IF NOT EXISTS idx_property_slug_history_replaced_by_staff_id ON public.property_slug_history (replaced_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_saved_intel_property_id ON public.saved_intel (property_id);
CREATE INDEX IF NOT EXISTS idx_user_behavioral_reviews_reviewer_id ON public.user_behavioral_reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_via_attributions_share_link_id ON public.via_attributions (share_link_id);
CREATE INDEX IF NOT EXISTS idx_via_attributions_user_id ON public.via_attributions (user_id);
CREATE INDEX IF NOT EXISTS idx_via_routing_decisions_attribution_id ON public.via_routing_decisions (attribution_id);
CREATE INDEX IF NOT EXISTS idx_via_share_links_representation_id ON public.via_share_links (representation_id);
CREATE INDEX IF NOT EXISTS idx_viewing_appointments_deal_id ON public.viewing_appointments (deal_id);
CREATE INDEX IF NOT EXISTS idx_viewing_appointments_property_id ON public.viewing_appointments (property_id);
