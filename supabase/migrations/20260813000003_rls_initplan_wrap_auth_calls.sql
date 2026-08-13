-- PREPARED, NOT APPLIED. Applying to production needs owner approval.
-- Audit: Task 7 (auth_rls_initplan), 2026-08-13.
--
-- Bare auth.uid() / auth.jwt() inside an RLS expression is re-evaluated once
-- PER ROW. Wrapping it in a scalar subquery lets the planner hoist it to an
-- InitPlan evaluated once per query. Behaviour is identical; only the row-count
-- scaling changes. These are the queries that fall over first at 200 listings.
--
-- 17 policies across 9 tables. Generated from live pg_policies on project
-- yyixsuaimdzyiocswcgc, so each USING/WITH CHECK below is the current
-- expression verbatim with only the auth.* call wrapped.

ALTER POLICY calendar_connections_select_own ON public.calendar_connections
  USING ((owner_user_id = ((select auth.uid()))::text));
ALTER POLICY calendar_events_delete_own ON public.calendar_events
  USING ((owner_user_id = ((select auth.uid()))::text));
ALTER POLICY calendar_events_insert_own ON public.calendar_events
  WITH CHECK ((owner_user_id = ((select auth.uid()))::text));
ALTER POLICY calendar_events_select_own ON public.calendar_events
  USING ((owner_user_id = ((select auth.uid()))::text));
ALTER POLICY calendar_events_update_own ON public.calendar_events
  USING ((owner_user_id = ((select auth.uid()))::text));
ALTER POLICY "Users can read their own notifications" ON public.private_notifications
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own notifications" ON public.private_notifications
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Claimants upload own documents" ON public.property_claim_documents
  WITH CHECK ((EXISTS ( SELECT 1
   FROM property_claims c
  WHERE ((c.id = property_claim_documents.claim_id) AND (c.claimant_user_id = (select auth.uid()))))));
ALTER POLICY "Claimants view own documents" ON public.property_claim_documents
  USING ((EXISTS ( SELECT 1
   FROM property_claims c
  WHERE ((c.id = property_claim_documents.claim_id) AND (c.claimant_user_id = (select auth.uid()))))));
ALTER POLICY "Claimants insert own claims" ON public.property_claims
  WITH CHECK (((select auth.uid()) = claimant_user_id));
ALTER POLICY "Claimants view own claims" ON public.property_claims
  USING (((select auth.uid()) = claimant_user_id));
ALTER POLICY "Controllers view their own assignments" ON public.property_control_assignments
  USING (((select auth.uid()) = controller_user_id));
ALTER POLICY "Authenticated insert property_slug_history" ON public.property_slug_history
  WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Users can update own availability" ON public.user_availability
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Guests can insert appointments" ON public.viewing_appointments
  WITH CHECK (((select auth.uid()) = guest_id));
ALTER POLICY "Parties can read their appointments" ON public.viewing_appointments
  USING ((((select auth.uid()) = host_id) OR ((select auth.uid()) = guest_id)));
ALTER POLICY "Parties can update appointments" ON public.viewing_appointments
  USING ((((select auth.uid()) = host_id) OR ((select auth.uid()) = guest_id)));

-- Verification after applying: this must return zero rows.
--   select tablename, policyname from pg_policies
--   where schemaname='public'
--     and ((qual ~ 'auth\.(uid|jwt)\(\)' and qual !~ '\(\s*SELECT\s+auth\.')
--       or (with_check ~ 'auth\.(uid|jwt)\(\)' and with_check !~ '\(\s*SELECT\s+auth\.'));
