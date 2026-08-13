-- PREPARED, NOT APPLIED. Applying to production needs owner approval.
-- Audit: Task 4B, 2026-08-13.
--
-- FINDING
-- The policies named "Service role full access on intel_briefings" and
-- "... on intel_sources" are not scoped to service_role at all. Both are
--   FOR ALL TO public USING (true)
-- and the Postgres `public` role includes `anon`. Because permissive policies
-- combine with OR, that single policy overrides every other policy on those
-- tables and opens them to anonymous SELECT / INSERT / UPDATE / DELETE.
--
-- Proven on the live database inside a rolled-back transaction:
--   set local role anon;
--   insert into intel_briefings (slug, title, city) values (...);   -- 1 row
-- Both tables are empty today, so nothing has leaked; the live risk is an
-- anonymous injection path into whatever renders on /intel.
--
-- service_role has BYPASSRLS, so these policies were never load-bearing. They
-- are recreated scoped rather than dropped so the original intent stays legible.

DROP POLICY IF EXISTS "Service role full access on intel_briefings" ON public.intel_briefings;
CREATE POLICY "Service role full access on intel_briefings"
  ON public.intel_briefings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on intel_sources" ON public.intel_sources;
CREATE POLICY "Service role full access on intel_sources"
  ON public.intel_sources FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- OWNER DECISION, deliberately NOT included above.
-- Once the policies above are scoped, `authenticated` still holds
--   SELECT / INSERT / UPDATE  USING (true)
-- on both tables — i.e. any signed-in user can read, create and rewrite ANY
-- intel briefing. Nothing in the app needs that: every write goes through
-- src/app/api/admin/osint/route.js and src/app/api/cron/osint-scraper/route.js,
-- both of which use the service-role client (supabaseAdmin). If /intel is
-- editorial content rather than user-generated, these should go too:
--
--   DROP POLICY "Authenticated users insert intel_briefings" ON public.intel_briefings;
--   DROP POLICY "Authenticated users update intel_briefings" ON public.intel_briefings;
--   DROP POLICY "Authenticated users insert intel_sources"   ON public.intel_sources;
--   DROP POLICY "Authenticated users update intel_sources"   ON public.intel_sources;
--
-- Keep the two "view" policies if signed-in users are meant to read briefings.
