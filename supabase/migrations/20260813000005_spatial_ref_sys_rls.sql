-- PREPARED, NOT APPLIED. Applying to production needs owner approval.
-- Audit: Task 7 (spatial_ref_sys), 2026-08-13.
--
-- spatial_ref_sys is the only object in the audit with RLS fully disabled, so
-- it has no policy gate at all. Its contents are PostGIS reference data
-- (coordinate system definitions) and are the same in every PostGIS install on
-- earth, so the real risk is close to zero and this is housekeeping.
--
-- CAUTION, and the reason this is owner-approval-only: spatial_ref_sys is owned
-- by the postgis extension, not by the app. On a managed Supabase instance
-- ALTER TABLE on an extension-owned table can fail on ownership, and enabling
-- RLS on it will break any spatial query path that reads srid definitions as a
-- non-superuser role if the read policy below is wrong. Apply this one on its
-- own and re-run a map/radius search immediately afterwards.

ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Reference data: everyone reads, nobody writes. Writes fall through to
-- deny-by-default because no INSERT/UPDATE/DELETE policy exists.
CREATE POLICY "Reference data is world readable"
  ON public.spatial_ref_sys FOR SELECT TO anon, authenticated
  USING (true);
