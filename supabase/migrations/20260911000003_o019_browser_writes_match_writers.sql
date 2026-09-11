-- ═════════════════════════════════════════════════════════════════════════════
-- O-019 — browser write grants cut down to what browser code actually writes
--
-- Owner approved O-019 in the 2026-09-10 decision sweep; this stage was consented
-- separately on a plain-language description before it was applied.
--
-- THE PROBLEM
-- ~55 older tables let `anon` and `authenticated` INSERT/UPDATE/DELETE/TRUNCATE.
-- Row-level security was the only control, so a table was one loose policy away
-- from being writable by anyone with the public key (U-015 – U-019, U-022 and,
-- today, U-031 were all this shape).
--
-- WHAT THIS DOES
-- Read from the code on 2026-09-11 (Standing Rule 26), browser code writes to
-- exactly six tables — every other write goes through a server route or a
-- Mission Control action using the service role, which this does not touch:
--   user_profiles        UPDATE (10 columns, column-scoped since U-022)
--   privacy_settings     INSERT + UPSERT              profileClient.js
--   saved_intel          INSERT + DELETE              DashboardContext.js
--   properties           INSERT (30 columns, column-scoped since U-015)
--   broker_profiles      INSERT (user_id only)        profileClient.js
--   researcher_profiles  INSERT (user_id only)        profileClient.js
-- So:
--   1. The 47 tables with NO browser writer lose all browser write grants.
--   2. The browser-writer tables keep exactly what their writer uses.
--   3. TRUNCATE goes everywhere. (Supabase's public API has no truncate
--      operation; this is hygiene, not a closed exploit.)
--
-- WHAT IT DELIBERATELY DOES NOT DO
-- - No table-level REVOKE of INSERT/UPDATE on user_profiles, properties,
--   broker_profiles or researcher_profiles: a table-level REVOKE also strips
--   column-level grants, which would break the column-scoped browser writes.
-- - SELECT is untouched everywhere; reads are governed by RLS policies.
-- - spatial_ref_sys, geometry_columns and geography_columns are owned by
--   supabase_admin and cannot be changed from here (`must be owner`). They need
--   Supabase support — tracked under O-019.
--
-- ROLLBACK: supabase/rollback-proposals/20260911000003_o019_browser_writes_match_writers_rollback.sql
-- restores the exact 110 table-level grants read from the live database first.
-- ═════════════════════════════════════════════════════════════════════════════

-- 1. No browser writer — browser roles lose every write privilege.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.admin_users, public.analytics_events, public.audit_logs,
  public.badge_definitions, public.blocked_access, public.brain_chunks,
  public.brain_documents, public.broker_briefing_logs, public.calendar_connections,
  public.calendar_events, public.crm_activity_log, public.crm_tasks,
  public.deal_disputes, public.deal_handshakes, public.deal_messages,
  public.deal_routing_recipients, public.deals, public.dispute_events,
  public.disputes, public.error_reports, public.feature_flags, public.file_scans,
  public.intel_briefings, public.intel_sources, public.mission_control_actions,
  public.monthly_scout_wraps, public.private_notifications, public.projects,
  public.property_broker_representations, public.property_claim_documents,
  public.property_claim_events, public.property_claims,
  public.property_control_assignments, public.property_faq_answers,
  public.property_faqs, public.property_lifecycle_events,
  public.property_slug_redirects, public.property_units,
  public.security_access_logs, public.system_events, public.user_availability,
  public.user_badges, public.user_notifications, public.verification_requests,
  public.video_upload_queue, public.viewing_appointments, public.waitlist
FROM anon, authenticated;

-- 2. Browser writers keep exactly what they use.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.privacy_settings, public.saved_intel FROM anon;
REVOKE DELETE, TRUNCATE ON public.privacy_settings FROM authenticated;   -- keeps INSERT + UPDATE (upsert)
REVOKE UPDATE, TRUNCATE ON public.saved_intel FROM authenticated;        -- keeps INSERT + DELETE
REVOKE DELETE, TRUNCATE ON public.properties FROM anon, authenticated;   -- column-scoped INSERT/UPDATE untouched

-- 3. TRUNCATE on the rest.
REVOKE TRUNCATE ON
  public.user_profiles, public.broker_profiles, public.researcher_profiles,
  public.bounty_claims, public.property_slug_history
FROM anon, authenticated;
