BEGIN;

DROP POLICY IF EXISTS via_share_links_public_read ON public.via_share_links;
REVOKE ALL PRIVILEGES ON TABLE public.via_share_links FROM PUBLIC, anon, authenticated;

DO $privileges$
BEGIN
  IF has_any_column_privilege('anon', 'public.via_share_links', 'SELECT, INSERT, UPDATE, REFERENCES')
    OR has_any_column_privilege('authenticated', 'public.via_share_links', 'SELECT, INSERT, UPDATE, REFERENCES')
    OR has_table_privilege('anon', 'public.via_share_links', 'DELETE, TRUNCATE, TRIGGER')
    OR has_table_privilege('authenticated', 'public.via_share_links', 'DELETE, TRUNCATE, TRIGGER') THEN
    RAISE EXCEPTION 'Browser database roles still have privileges on VIA share links';
  END IF;

  IF NOT (has_table_privilege('service_role', 'public.via_share_links', 'SELECT')
    AND has_table_privilege('service_role', 'public.via_share_links', 'INSERT')
    AND has_table_privilege('service_role', 'public.via_share_links', 'UPDATE')
    AND has_table_privilege('service_role', 'public.via_share_links', 'DELETE')) THEN
    RAISE EXCEPTION 'Service role must retain lifecycle access to VIA share links';
  END IF;
END;
$privileges$;

COMMIT;
