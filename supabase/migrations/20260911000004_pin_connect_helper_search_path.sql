-- ═════════════════════════════════════════════════════════════════════════════
-- Pin search_path on the two Connect helper functions
-- Applied to the live database 2026-09-11 on owner consent.
--
-- 20260814000002 created `normalize_connect_role` and `get_role_connect_allowance`
-- without a pinned search_path, which the Supabase advisor flags (lint 0011).
-- Both only call pg_catalog functions (LOWER, btrim, COALESCE) and the
-- schema-qualified `public.normalize_connect_role`, so an empty path changes
-- nothing they return. Rehearsed before applying: 'Buyer' → seeker,
-- owner/cluster → 18, broker/universe → 50, unknown → 1, before and after.
-- ═════════════════════════════════════════════════════════════════════════════

ALTER FUNCTION public.normalize_connect_role(text) SET search_path = '';
ALTER FUNCTION public.get_role_connect_allowance(text, text) SET search_path = '';
