BEGIN;

CREATE FUNCTION app_private.has_workspace_assurance()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN auth.jwt() ->> 'aal' = 'aal2' THEN true
    WHEN auth.jwt() ->> 'aal' = 'aal1' THEN NOT EXISTS (
      SELECT 1
      FROM auth.mfa_factors AS factor
      WHERE factor.user_id = auth.uid() AND factor.status = 'verified'
    )
    ELSE false
  END;
$function$;

REVOKE ALL ON FUNCTION app_private.has_workspace_assurance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.has_workspace_assurance() TO authenticated;

DO $policies$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'badge_transfers', 'bounty_claims', 'broker_briefing_logs',
    'calendar_connections', 'calendar_events', 'charter_applications',
    'connect_balances', 'connect_blocks', 'connect_transactions',
    'connect_wallet_ledger', 'crm_activity_log', 'crm_contacts', 'crm_deal_notes',
    'crm_tasks', 'deals', 'faq_block_appeals', 'intel_briefings', 'intel_sources',
    'lead_export_audit_log', 'privacy_settings', 'private_notifications',
    'properties', 'property_claim_documents', 'property_claims',
    'property_control_assignments', 'property_spatial_requests', 'saved_intel',
    'user_availability', 'user_badges', 'user_behavioral_metrics',
    'user_behavioral_reviews', 'user_notifications', 'user_profiles',
    'viewing_appointments'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY workspace_assurance ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING ((SELECT app_private.has_workspace_assurance()))
       WITH CHECK ((SELECT app_private.has_workspace_assurance()))',
      table_name
    );
  END LOOP;

  FOREACH table_name IN ARRAY ARRAY[
    'broker_profiles', 'researcher_profiles', 'projects', 'property_faqs', 'property_faq_answers'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY workspace_assurance_insert ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated
       WITH CHECK ((SELECT app_private.has_workspace_assurance()))',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY workspace_assurance_update ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
       USING ((SELECT app_private.has_workspace_assurance()))
       WITH CHECK ((SELECT app_private.has_workspace_assurance()))',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY workspace_assurance_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
       USING ((SELECT app_private.has_workspace_assurance()))',
      table_name
    );
  END LOOP;
END;
$policies$;

CREATE POLICY workspace_assurance_read ON public.projects AS RESTRICTIVE FOR SELECT TO authenticated
  USING (status IN ('active', 'showcase') OR (SELECT app_private.has_workspace_assurance()));

CREATE POLICY workspace_assurance ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT app_private.has_workspace_assurance()))
  WITH CHECK ((SELECT app_private.has_workspace_assurance()));

COMMIT;
