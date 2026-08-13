-- PREPARED, NOT APPLIED. Applying to production needs owner approval.
-- Audit: Task 7 (st_estimatedextent), 2026-08-13.
--
-- One PostGIS function counted six times by the linter: three signatures x the
-- anon and authenticated roles. It is reachable as
-- /rest/v1/rpc/st_estimatedextent and returns table extent ESTIMATES from
-- planner statistics, not rows — so this closes an information trickle, not a
-- data leak. Nothing in src/ or mission-control/src/ calls it.

REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon, authenticated;
