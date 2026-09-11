-- ═════════════════════════════════════════════════════════════════════════════
-- ROLLBACK for 20260911000003_o019_browser_writes_match_writers.sql
-- MANUAL ONLY — DO NOT RUN AUTOMATICALLY.
--
-- Generated from the live database on 2026-09-11, BEFORE the forward migration
-- ran, by reading information_schema.role_table_grants for anon/authenticated on
-- every postgres-owned table in public. 110 statements. Running this restores the
-- exact prior table-level write grants — including the permissive ones — so run
-- it only to undo a breakage, and re-apply a corrected forward migration after.
--
-- Column-level grants are not listed because the forward migration does not
-- touch them.
-- ═════════════════════════════════════════════════════════════════════════════

GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_users TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_users TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.analytics_events TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.analytics_events TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.badge_definitions TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.badge_definitions TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.blocked_access TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.blocked_access TO authenticated;
GRANT TRUNCATE ON public.bounty_claims TO anon;
GRANT TRUNCATE ON public.bounty_claims TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.brain_chunks TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.brain_chunks TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.brain_documents TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.brain_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.broker_briefing_logs TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.broker_briefing_logs TO authenticated;
GRANT TRUNCATE ON public.broker_profiles TO anon;
GRANT TRUNCATE ON public.broker_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.calendar_connections TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.calendar_connections TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.calendar_events TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.calendar_events TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.crm_activity_log TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.crm_activity_log TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.crm_tasks TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.crm_tasks TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deal_disputes TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deal_disputes TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deal_handshakes TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deal_handshakes TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deal_messages TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deal_messages TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deal_routing_recipients TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deal_routing_recipients TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deals TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.deals TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.dispute_events TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.dispute_events TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.disputes TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.disputes TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.error_reports TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.error_reports TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.feature_flags TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.feature_flags TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.file_scans TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.file_scans TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.intel_briefings TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.intel_briefings TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.intel_sources TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.intel_sources TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.mission_control_actions TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.mission_control_actions TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.monthly_scout_wraps TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.monthly_scout_wraps TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.privacy_settings TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.privacy_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.private_notifications TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.private_notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.projects TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.projects TO authenticated;
GRANT DELETE, TRUNCATE ON public.properties TO anon;
GRANT DELETE, TRUNCATE ON public.properties TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_broker_representations TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_broker_representations TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_claim_documents TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_claim_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_claim_events TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_claim_events TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_claims TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_claims TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_control_assignments TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_control_assignments TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_faq_answers TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_faq_answers TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_faqs TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_faqs TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_lifecycle_events TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_lifecycle_events TO authenticated;
GRANT TRUNCATE ON public.property_slug_history TO anon;
GRANT TRUNCATE ON public.property_slug_history TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_slug_redirects TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_slug_redirects TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_units TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.property_units TO authenticated;
GRANT TRUNCATE ON public.researcher_profiles TO anon;
GRANT TRUNCATE ON public.researcher_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.saved_intel TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.saved_intel TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.security_access_logs TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.security_access_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.system_events TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.system_events TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.user_availability TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.user_availability TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.user_badges TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.user_badges TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.user_notifications TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.user_notifications TO authenticated;
GRANT TRUNCATE ON public.user_profiles TO anon;
GRANT TRUNCATE ON public.user_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.verification_requests TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.verification_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.video_upload_queue TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.video_upload_queue TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.viewing_appointments TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.viewing_appointments TO authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.waitlist TO anon;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.waitlist TO authenticated;
