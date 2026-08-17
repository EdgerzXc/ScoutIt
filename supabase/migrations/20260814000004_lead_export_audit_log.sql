-- PROPOSAL ONLY - NOT APPLIED TO LIVE DATABASE.
-- Immutable, privacy-safe receipts required before lead PII leaves ScoutIt.
CREATE TABLE IF NOT EXISTS public.lead_export_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  format TEXT NOT NULL CHECK (format IN ('csv', 'vcard', 'clipboard_copy')),
  lead_count INTEGER NOT NULL CHECK (lead_count BETWEEN 1 AND 500),
  property_count INTEGER NOT NULL CHECK (property_count BETWEEN 1 AND 500),
  lead_scope_hash TEXT NOT NULL CHECK (lead_scope_hash ~ '^[0-9a-f]{64}$'),
  property_scope_hash TEXT NOT NULL CHECK (property_scope_hash ~ '^[0-9a-f]{64}$'),
  purpose_code TEXT NOT NULL CHECK (purpose_code = 'crm_export'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_export_audit_actor_created ON public.lead_export_audit_log (actor_id, created_at DESC);
ALTER TABLE public.lead_export_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own export audits" ON public.lead_export_audit_log;
CREATE POLICY "Users can view own export audits" ON public.lead_export_audit_log FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = actor_id);
DROP POLICY IF EXISTS "Service role inserts export audits" ON public.lead_export_audit_log;
REVOKE ALL ON TABLE public.lead_export_audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.lead_export_audit_log TO authenticated;
GRANT SELECT, INSERT ON TABLE public.lead_export_audit_log TO service_role;
CREATE OR REPLACE FUNCTION public.reject_lead_export_audit_mutation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'lead export audit receipts are immutable' USING ERRCODE = '42501';
END;
$$;
DROP TRIGGER IF EXISTS lead_export_audit_immutable ON public.lead_export_audit_log;
CREATE TRIGGER lead_export_audit_immutable BEFORE UPDATE OR DELETE ON public.lead_export_audit_log
FOR EACH ROW EXECUTE FUNCTION public.reject_lead_export_audit_mutation();
REVOKE ALL ON FUNCTION public.reject_lead_export_audit_mutation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_lead_export_audit_mutation() TO service_role;