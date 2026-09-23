-- A-130 Open Gate. Prepared for O-004 review; do not apply without its
-- separate rehearsal and owner go. A gate is a broker's inbound entitlement,
-- never an account-wide exemption from paying to initiate.
CREATE TABLE IF NOT EXISTS public.open_gate_entitlements (
  broker_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  granted_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.open_gate_listings (
  property_id UUID NOT NULL,
  broker_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (property_id, broker_id),
  FOREIGN KEY (property_id, broker_id)
    REFERENCES public.property_broker_representations(property_id, broker_id)
    ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS open_gate_listings_broker_idx
  ON public.open_gate_listings (broker_id, enabled);
ALTER TABLE public.open_gate_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_gate_listings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.open_gate_entitlements, public.open_gate_listings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.open_gate_entitlements, public.open_gate_listings TO service_role;
COMMENT ON TABLE public.open_gate_entitlements IS
  'A-130 staff-granted, time-bounded broker entitlement after external subscription handling.';
COMMENT ON TABLE public.open_gate_listings IS
  'A-130 broker-controlled inbound-only free contact switch per active represented property.';
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS open_gate_inbound BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN public.deals.open_gate_inbound IS
  'A-130: server-verified zero-Connect inbound broker request; contact exchange is waived after acceptance.';
