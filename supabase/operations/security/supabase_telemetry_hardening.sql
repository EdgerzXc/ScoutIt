-- ============================================================================
-- SCOUTIT TELEMETRY & SPATIAL ANALYTICS HARDENING MIGRATION
-- Apply against Supabase Project: yyixsuaimdzyiocswcgc
-- ============================================================================

-- 1. Ensure security_access_logs table & columns exist
CREATE TABLE IF NOT EXISTS public.security_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  masked_ip TEXT NOT NULL,
  route_accessed TEXT NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  city TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC
);

-- 2. Performance Indexes for 30-Day Filtering & Fast IP Lookup
CREATE INDEX IF NOT EXISTS idx_sec_logs_masked_ip ON public.security_access_logs(masked_ip);
CREATE INDEX IF NOT EXISTS idx_sec_logs_last_request_at ON public.security_access_logs(last_request_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_logs_flagged ON public.security_access_logs(is_flagged) WHERE is_flagged;

-- 3. Row Level Security (RLS) Policy — Locked to Service-Role Admin Client Only
ALTER TABLE public.security_access_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no client access" ON public.security_access_logs;
CREATE POLICY "no client access" ON public.security_access_logs FOR ALL USING (false) WITH CHECK (false);

-- 4. Automated 30-Day Rolling Cleanup Stored Function
CREATE OR REPLACE FUNCTION public.clean_old_security_logs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.security_access_logs
  WHERE last_request_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
