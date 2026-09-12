-- Record the live Row Level Security posture so the repo stops lying about it.
--
-- WHY
-- ---
-- Counted 2026-09-12: supabase/migrations holds 70 `CREATE POLICY` statements.
-- The live database has 92 policies. Roughly a dozen were created by hand in
-- the Supabase dashboard and exist in NO file - audit_logs, badge_definitions,
-- bounty_claims, calendar_events, calendar_connections, connect_balances,
-- crm_tasks, projects, user_profiles, waitlist and others.
--
-- Three consequences, all of which were true until this file existed:
--   1. A database rebuilt from these migrations would have a DIFFERENT
--      security posture than production, and nothing would say which rules
--      went missing.
--   2. No code review could ever catch a bad policy, because reviewing the
--      code did not show it.
--   3. No history said who added a rule, when, or why.
--
-- WHAT THIS IS, AND IS NOT
-- ------------------------
-- This INVENTS NOTHING. Every statement below was read out of pg_policies on
-- the live database and written down verbatim. Applying it to that same
-- database is a no-op: each policy is dropped and recreated identically.
--
-- It is NOT a security review. Several of these are permissive and some of
-- them should probably be tighter - `badge_definitions :: public read` and
-- `property_slug_history :: Public read` both read USING (true), i.e. anyone
-- with the anon key reads the whole table. That is fine for a badge catalogue
-- and a slug redirect map; it would not be fine for anything with a person in
-- it. Judging each one is a separate pass and a product decision, not a
-- transcription.
--
-- 34 further tables run RLS with ZERO policies. That is deny-all - service
-- role only - and it is deliberate; see the COMMENT ON TABLE entries that say
-- "RLS deny-all BY DESIGN". They need no policy and none is invented here.
-- The ALTER ... ENABLE statements below cover them so a rebuilt database is
-- locked the same way.
--
-- Re-run the dump and update this file after any deliberate policy change.

BEGIN;

-- ── RLS enabled, deny-all (no policies, service role only, by design) ──────
ALTER TABLE public.brain_chunks                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_documents                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_career_claims             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_contributions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_dossier_audit_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_dossier_drafts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_metric_snapshots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_recommendations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_social_proof_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_backfill_holds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_disputes                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_handshakes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_routing_recipients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_events                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_block_evidence               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_scans                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_scout_wraps              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_cohorts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_participants               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_broker_representations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_claim_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_lifecycle_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_slug_redirects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_units                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_professionals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_acceptances                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_upload_queue               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_share_revocations       ENABLE ROW LEVEL SECURITY;

-- ── RLS enabled, with policies ────────────────────────────────────────────
ALTER TABLE public.admin_users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_access                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_claims                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_briefing_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_connections           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_balances               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_wallet_ledger          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activity_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_reports                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_block_appeals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_briefings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_sources                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_export_audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_control_actions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_claim_documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_claims                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_control_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_faq_answers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_faqs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_slug_history          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_intel                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_access_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_availability              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connect_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connect_wallets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist                       ENABLE ROW LEVEL SECURITY;

-- ── admin_users ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "no client access" ON public.admin_users;
CREATE POLICY "no client access" ON public.admin_users AS PERMISSIVE FOR ALL TO public USING (false);

-- ── audit_logs  (DASHBOARD-ONLY until now) ────────────────────────────────
DROP POLICY IF EXISTS "No one can mutate audit logs" ON public.audit_logs;
CREATE POLICY "No one can mutate audit logs" ON public.audit_logs AS PERMISSIVE FOR ALL TO public USING (false);

DROP POLICY IF EXISTS "No one can read audit logs except Service Role" ON public.audit_logs;
CREATE POLICY "No one can read audit logs except Service Role" ON public.audit_logs AS PERMISSIVE FOR SELECT TO public USING (false);

-- ── badge_definitions  (DASHBOARD-ONLY until now) ─────────────────────────
DROP POLICY IF EXISTS "public read" ON public.badge_definitions;
CREATE POLICY "public read" ON public.badge_definitions AS PERMISSIVE FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "service role only writes" ON public.badge_definitions;
CREATE POLICY "service role only writes" ON public.badge_definitions AS PERMISSIVE FOR ALL TO public USING (false) WITH CHECK (false);

-- ── blocked_access ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "no client access" ON public.blocked_access;
CREATE POLICY "no client access" ON public.blocked_access AS PERMISSIVE FOR ALL TO public USING (false);

-- ── bounty_claims  (DASHBOARD-ONLY until now) ─────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own bounty claims" ON public.bounty_claims;
CREATE POLICY "Users can insert their own bounty claims" ON public.bounty_claims AS PERMISSIVE FOR INSERT TO public WITH CHECK (researcher_user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can read their own bounty claims" ON public.bounty_claims;
CREATE POLICY "Users can read their own bounty claims" ON public.bounty_claims AS PERMISSIVE FOR SELECT TO public USING (researcher_user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can update their own bounty claims" ON public.bounty_claims;
CREATE POLICY "Users can update their own bounty claims" ON public.bounty_claims AS PERMISSIVE FOR UPDATE TO public USING (researcher_user_id = ((SELECT auth.uid()))::text);

-- ── broker_briefing_logs ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Brokers log own briefings" ON public.broker_briefing_logs;
CREATE POLICY "Brokers log own briefings" ON public.broker_briefing_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()))::text = broker_user_id);

DROP POLICY IF EXISTS "Brokers read own briefing logs" ON public.broker_briefing_logs;
CREATE POLICY "Brokers read own briefing logs" ON public.broker_briefing_logs AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()))::text = broker_user_id);

-- ── broker_profiles ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read on broker_profiles" ON public.broker_profiles;
CREATE POLICY "Allow public read on broker_profiles" ON public.broker_profiles AS PERMISSIVE FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert their own broker profile" ON public.broker_profiles;
CREATE POLICY "Users can insert their own broker profile" ON public.broker_profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can update their own broker profile" ON public.broker_profiles;
CREATE POLICY "Users can update their own broker profile" ON public.broker_profiles AS PERMISSIVE FOR UPDATE TO public USING (user_id = ((SELECT auth.uid()))::text);

-- ── calendar_connections  (DASHBOARD-ONLY until now) ──────────────────────
DROP POLICY IF EXISTS calendar_connections_select_own ON public.calendar_connections;
CREATE POLICY calendar_connections_select_own ON public.calendar_connections AS PERMISSIVE FOR SELECT TO public USING (owner_user_id = (auth.uid())::text);

-- ── calendar_events  (DASHBOARD-ONLY until now) ───────────────────────────
DROP POLICY IF EXISTS calendar_events_delete_own ON public.calendar_events;
CREATE POLICY calendar_events_delete_own ON public.calendar_events AS PERMISSIVE FOR DELETE TO public USING (owner_user_id = (auth.uid())::text);

DROP POLICY IF EXISTS calendar_events_insert_own ON public.calendar_events;
CREATE POLICY calendar_events_insert_own ON public.calendar_events AS PERMISSIVE FOR INSERT TO public WITH CHECK (owner_user_id = (auth.uid())::text);

DROP POLICY IF EXISTS calendar_events_select_own ON public.calendar_events;
CREATE POLICY calendar_events_select_own ON public.calendar_events AS PERMISSIVE FOR SELECT TO public USING (owner_user_id = (auth.uid())::text);

DROP POLICY IF EXISTS calendar_events_update_own ON public.calendar_events;
CREATE POLICY calendar_events_update_own ON public.calendar_events AS PERMISSIVE FOR UPDATE TO public USING (owner_user_id = (auth.uid())::text);

-- ── connect_backfill_holds ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own holds" ON public.connect_backfill_holds;
CREATE POLICY "Users can view own holds" ON public.connect_backfill_holds AS PERMISSIVE FOR SELECT TO public USING (((SELECT auth.uid()))::text = user_id);

-- ── connect_balances  (DASHBOARD-ONLY until now) ──────────────────────────
DROP POLICY IF EXISTS "Users can read their own balances" ON public.connect_balances;
CREATE POLICY "Users can read their own balances" ON public.connect_balances AS PERMISSIVE FOR SELECT TO public USING (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users cannot modify balances" ON public.connect_balances;
CREATE POLICY "Users cannot modify balances" ON public.connect_balances AS PERMISSIVE FOR ALL TO public USING (false);

-- ── connect_transactions ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read their own transactions" ON public.connect_transactions;
CREATE POLICY "Users can read their own transactions" ON public.connect_transactions AS PERMISSIVE FOR SELECT TO public USING (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users cannot insert transactions" ON public.connect_transactions;
CREATE POLICY "Users cannot insert transactions" ON public.connect_transactions AS PERMISSIVE FOR ALL TO public USING (false);

-- ── connect_wallet_ledger ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own wallet ledger" ON public.connect_wallet_ledger;
CREATE POLICY "Users can view own wallet ledger" ON public.connect_wallet_ledger AS PERMISSIVE FOR SELECT TO public USING (((SELECT auth.uid()))::text = user_id);

-- ── crm_activity_log ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS crm_activity_read_party ON public.crm_activity_log;
CREATE POLICY crm_activity_read_party ON public.crm_activity_log AS PERMISSIVE FOR SELECT TO public USING (
  (actor_id = ((SELECT auth.uid()))::text)
  OR EXISTS (SELECT 1 FROM deals d WHERE d.id = crm_activity_log.deal_id
             AND (d.buyer_id = ((SELECT auth.uid()))::text OR d.broker_id = ((SELECT auth.uid()))::text))
  OR EXISTS (SELECT 1 FROM properties p WHERE p.id = crm_activity_log.property_id
             AND p.owner_id = ((SELECT auth.uid()))::text)
);

-- ── crm_tasks  (DASHBOARD-ONLY until now) ─────────────────────────────────
DROP POLICY IF EXISTS crm_tasks_assignee_read ON public.crm_tasks;
CREATE POLICY crm_tasks_assignee_read ON public.crm_tasks AS PERMISSIVE FOR SELECT TO public USING (assignee_user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS crm_tasks_owner_all ON public.crm_tasks;
CREATE POLICY crm_tasks_owner_all ON public.crm_tasks AS PERMISSIVE FOR ALL TO public USING (owner_user_id = ((SELECT auth.uid()))::text) WITH CHECK (owner_user_id = ((SELECT auth.uid()))::text);

-- ── deals ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read their own deals" ON public.deals;
CREATE POLICY "Users can read their own deals" ON public.deals AS PERMISSIVE FOR SELECT TO public USING (
  buyer_id = ((SELECT auth.uid()))::text
  OR broker_id = ((SELECT auth.uid()))::text
  OR property_id IN (SELECT properties.id FROM properties WHERE properties.owner_id = ((SELECT auth.uid()))::text)
);

DROP POLICY IF EXISTS "Users cannot insert deals directly" ON public.deals;
CREATE POLICY "Users cannot insert deals directly" ON public.deals AS PERMISSIVE FOR INSERT TO public WITH CHECK (false);

-- ── error_reports ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert error reports" ON public.error_reports;
CREATE POLICY "Authenticated users can insert error reports" ON public.error_reports AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.role() = 'authenticated'::text);

-- ── faq_block_appeals ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own appeals" ON public.faq_block_appeals;
CREATE POLICY "Users can view own appeals" ON public.faq_block_appeals AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()))::text = user_id);

-- ── feature_flags ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
CREATE POLICY "Anyone can read feature flags" ON public.feature_flags AS PERMISSIVE FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "no client access for delete" ON public.feature_flags;
CREATE POLICY "no client access for delete" ON public.feature_flags AS PERMISSIVE FOR DELETE TO public USING (false);

DROP POLICY IF EXISTS "no client access for update" ON public.feature_flags;
CREATE POLICY "no client access for update" ON public.feature_flags AS PERMISSIVE FOR UPDATE TO public USING (false);

DROP POLICY IF EXISTS "no client access for write" ON public.feature_flags;
CREATE POLICY "no client access for write" ON public.feature_flags AS PERMISSIVE FOR INSERT TO public WITH CHECK (false);

-- ── intel_briefings ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users view intel_briefings" ON public.intel_briefings;
CREATE POLICY "Authenticated users view intel_briefings" ON public.intel_briefings AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full access on intel_briefings" ON public.intel_briefings;
CREATE POLICY "Service role full access on intel_briefings" ON public.intel_briefings AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── intel_sources ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users view intel_sources" ON public.intel_sources;
CREATE POLICY "Authenticated users view intel_sources" ON public.intel_sources AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full access on intel_sources" ON public.intel_sources;
CREATE POLICY "Service role full access on intel_sources" ON public.intel_sources AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── lead_export_audit_log ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own export audits" ON public.lead_export_audit_log;
CREATE POLICY "Users can view own export audits" ON public.lead_export_audit_log AS PERMISSIVE FOR SELECT TO authenticated USING (((SELECT auth.uid()))::text = actor_id);

-- ── mission_control_actions ───────────────────────────────────────────────
DROP POLICY IF EXISTS "no client access" ON public.mission_control_actions;
CREATE POLICY "no client access" ON public.mission_control_actions AS PERMISSIVE FOR ALL TO public USING (false);

-- ── privacy_settings ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can insert their own privacy settings" ON public.privacy_settings AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can read their own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can read their own privacy settings" ON public.privacy_settings AS PERMISSIVE FOR SELECT TO public USING (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can update their own privacy settings" ON public.privacy_settings AS PERMISSIVE FOR UPDATE TO public USING (user_id = ((SELECT auth.uid()))::text);

-- ── private_notifications ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.private_notifications;
CREATE POLICY "Users can read their own notifications" ON public.private_notifications AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.private_notifications;
CREATE POLICY "Users can update their own notifications" ON public.private_notifications AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "no client access for delete" ON public.private_notifications;
CREATE POLICY "no client access for delete" ON public.private_notifications AS PERMISSIVE FOR DELETE TO public USING (false);

DROP POLICY IF EXISTS "no client access for insert" ON public.private_notifications;
CREATE POLICY "no client access for insert" ON public.private_notifications AS PERMISSIVE FOR INSERT TO public WITH CHECK (false);

-- ── projects  (DASHBOARD-ONLY until now) ──────────────────────────────────
DROP POLICY IF EXISTS "Public can read projects" ON public.projects;
CREATE POLICY "Public can read projects" ON public.projects AS PERMISSIVE FOR SELECT TO public USING (status = 'active'::text OR status = 'showcase'::text);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects AS PERMISSIVE FOR DELETE TO public USING (provider_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects" ON public.projects AS PERMISSIVE FOR INSERT TO public WITH CHECK (provider_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can read their own projects" ON public.projects;
CREATE POLICY "Users can read their own projects" ON public.projects AS PERMISSIVE FOR SELECT TO public USING (provider_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects AS PERMISSIVE FOR UPDATE TO public USING (provider_id = ((SELECT auth.uid()))::text);

-- ── properties ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can read live properties" ON public.properties;
CREATE POLICY "Public can read live properties" ON public.properties AS PERMISSIVE FOR SELECT TO public USING (lifecycle_state = 'live'::text);

DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;
CREATE POLICY "Users can delete their own properties" ON public.properties AS PERMISSIVE FOR DELETE TO public USING (owner_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
CREATE POLICY "Users can insert their own properties" ON public.properties AS PERMISSIVE FOR INSERT TO public WITH CHECK (owner_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can read their own properties" ON public.properties;
CREATE POLICY "Users can read their own properties" ON public.properties AS PERMISSIVE FOR SELECT TO public USING (owner_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
CREATE POLICY "Users can update their own properties" ON public.properties AS PERMISSIVE FOR UPDATE TO public USING (owner_id = ((SELECT auth.uid()))::text) WITH CHECK (owner_id = ((SELECT auth.uid()))::text);

-- ── property_claim_documents ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Claimants upload own documents" ON public.property_claim_documents;
CREATE POLICY "Claimants upload own documents" ON public.property_claim_documents AS PERMISSIVE FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM property_claims c WHERE c.id = property_claim_documents.claim_id AND c.claimant_user_id = auth.uid()));

DROP POLICY IF EXISTS "Claimants view own documents" ON public.property_claim_documents;
CREATE POLICY "Claimants view own documents" ON public.property_claim_documents AS PERMISSIVE FOR SELECT TO public USING (EXISTS (SELECT 1 FROM property_claims c WHERE c.id = property_claim_documents.claim_id AND c.claimant_user_id = auth.uid()));

-- ── property_claims ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Claimants insert own claims" ON public.property_claims;
CREATE POLICY "Claimants insert own claims" ON public.property_claims AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.uid() = claimant_user_id);

DROP POLICY IF EXISTS "Claimants view own claims" ON public.property_claims;
CREATE POLICY "Claimants view own claims" ON public.property_claims AS PERMISSIVE FOR SELECT TO public USING (auth.uid() = claimant_user_id);

-- ── property_control_assignments ──────────────────────────────────────────
DROP POLICY IF EXISTS "Controllers view their own assignments" ON public.property_control_assignments;
CREATE POLICY "Controllers view their own assignments" ON public.property_control_assignments AS PERMISSIVE FOR SELECT TO public USING (auth.uid() = controller_user_id);

-- ── property_faq_answers ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users post answers" ON public.property_faq_answers;
CREATE POLICY "Authenticated users post answers" ON public.property_faq_answers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()))::text = author_id);

DROP POLICY IF EXISTS "Authors update own answers" ON public.property_faq_answers;
CREATE POLICY "Authors update own answers" ON public.property_faq_answers AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()))::text = author_id) WITH CHECK (((SELECT auth.uid()))::text = author_id);

DROP POLICY IF EXISTS "Public read visible faq answers" ON public.property_faq_answers;
CREATE POLICY "Public read visible faq answers" ON public.property_faq_answers AS PERMISSIVE FOR SELECT TO anon, authenticated USING (is_hidden = false);

-- ── property_faqs ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Askers hide own questions" ON public.property_faqs;
CREATE POLICY "Askers hide own questions" ON public.property_faqs AS PERMISSIVE FOR UPDATE TO authenticated USING (((SELECT auth.uid()))::text = asked_by_user_id) WITH CHECK (((SELECT auth.uid()))::text = asked_by_user_id);

DROP POLICY IF EXISTS "Authenticated users ask questions" ON public.property_faqs;
CREATE POLICY "Authenticated users ask questions" ON public.property_faqs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((SELECT auth.uid()))::text = asked_by_user_id);

DROP POLICY IF EXISTS "Public read visible property_faqs" ON public.property_faqs;
CREATE POLICY "Public read visible property_faqs" ON public.property_faqs AS PERMISSIVE FOR SELECT TO anon, authenticated USING (is_hidden = false);

-- ── property_slug_history ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read property_slug_history" ON public.property_slug_history;
CREATE POLICY "Public read property_slug_history" ON public.property_slug_history AS PERMISSIVE FOR SELECT TO public USING (true);

-- ── researcher_profiles ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read on researcher_profiles" ON public.researcher_profiles;
CREATE POLICY "Allow public read on researcher_profiles" ON public.researcher_profiles AS PERMISSIVE FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert their own researcher profile" ON public.researcher_profiles;
CREATE POLICY "Users can insert their own researcher profile" ON public.researcher_profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can update their own researcher profile" ON public.researcher_profiles;
CREATE POLICY "Users can update their own researcher profile" ON public.researcher_profiles AS PERMISSIVE FOR UPDATE TO public USING (user_id = ((SELECT auth.uid()))::text);

-- ── saved_intel ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete their own saved intel" ON public.saved_intel;
CREATE POLICY "Users can delete their own saved intel" ON public.saved_intel AS PERMISSIVE FOR DELETE TO public USING (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can insert their own saved intel" ON public.saved_intel;
CREATE POLICY "Users can insert their own saved intel" ON public.saved_intel AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can read their own saved intel" ON public.saved_intel;
CREATE POLICY "Users can read their own saved intel" ON public.saved_intel AS PERMISSIVE FOR SELECT TO public USING (user_id = ((SELECT auth.uid()))::text);

-- ── security_access_logs ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "no client access" ON public.security_access_logs;
CREATE POLICY "no client access" ON public.security_access_logs AS PERMISSIVE FOR ALL TO public USING (false) WITH CHECK (false);

-- ── user_availability ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own availability" ON public.user_availability;
CREATE POLICY "Users can update own availability" ON public.user_availability AS PERMISSIVE FOR ALL TO public USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_availability_select_own ON public.user_availability;
CREATE POLICY user_availability_select_own ON public.user_availability AS PERMISSIVE FOR SELECT TO public USING (user_id = (SELECT auth.uid()));

-- ── user_badges ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read their own badges" ON public.user_badges;
CREATE POLICY "Users can read their own badges" ON public.user_badges AS PERMISSIVE FOR SELECT TO public USING (user_id = ((SELECT auth.uid()))::text);

-- ── user_connect_accounts ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own connect accounts" ON public.user_connect_accounts;
CREATE POLICY "Users can view own connect accounts" ON public.user_connect_accounts AS PERMISSIVE FOR SELECT TO public USING (((SELECT auth.uid()))::text = user_id);

-- ── user_connect_wallets ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_connect_wallets;
CREATE POLICY "Users can view own wallets" ON public.user_connect_wallets AS PERMISSIVE FOR SELECT TO public USING (((SELECT auth.uid()))::text = user_id);

-- ── user_notifications ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.user_notifications;
CREATE POLICY "Users can read their own notifications" ON public.user_notifications AS PERMISSIVE FOR SELECT TO public USING (user_id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
CREATE POLICY "Users can update their own notifications" ON public.user_notifications AS PERMISSIVE FOR UPDATE TO public USING (user_id = ((SELECT auth.uid()))::text);

-- ── user_profiles  (DASHBOARD-ONLY until now) ─────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK (id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can read their own profile" ON public.user_profiles;
CREATE POLICY "Users can read their own profile" ON public.user_profiles AS PERMISSIVE FOR SELECT TO public USING (id = ((SELECT auth.uid()))::text);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles AS PERMISSIVE FOR UPDATE TO public USING (id = ((SELECT auth.uid()))::text);

-- ── viewing_appointments ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Guests can insert appointments" ON public.viewing_appointments;
CREATE POLICY "Guests can insert appointments" ON public.viewing_appointments AS PERMISSIVE FOR INSERT TO public WITH CHECK (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Parties can read their appointments" ON public.viewing_appointments;
CREATE POLICY "Parties can read their appointments" ON public.viewing_appointments AS PERMISSIVE FOR SELECT TO public USING (auth.uid() = host_id OR auth.uid() = guest_id);

DROP POLICY IF EXISTS "Parties can update appointments" ON public.viewing_appointments;
CREATE POLICY "Parties can update appointments" ON public.viewing_appointments AS PERMISSIVE FOR UPDATE TO public USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- ── waitlist  (DASHBOARD-ONLY until now) ──────────────────────────────────
DROP POLICY IF EXISTS "Clients cannot access waitlist directly" ON public.waitlist;
CREATE POLICY "Clients cannot access waitlist directly" ON public.waitlist AS PERMISSIVE FOR ALL TO public USING (false);

COMMIT;
