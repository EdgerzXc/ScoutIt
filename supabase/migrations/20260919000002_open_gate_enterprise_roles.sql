-- A-130 correction (owner decision 2026-09-19): Enterprise owner and
-- delegated operator Open Gate targets. Prepared for O-004, not applied.
-- Broker tables remain in migration 20260919000001 until a consolidated
-- rehearsal replaces both with the final approved schema.
CREATE TABLE IF NOT EXISTS public.open_gate_role_entitlements (
  account_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'operator')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  granted_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, role)
);
CREATE TABLE IF NOT EXISTS public.open_gate_role_listings (
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.property_units(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'operator')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((role = 'owner' AND unit_id IS NULL) OR (role = 'operator' AND unit_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS open_gate_role_listings_unique
  ON public.open_gate_role_listings (property_id, recipient_id, role, (COALESCE(unit_id, '00000000-0000-0000-0000-000000000000'::uuid)));
ALTER TABLE public.open_gate_role_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_gate_role_listings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.open_gate_role_entitlements, public.open_gate_role_listings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.open_gate_role_entitlements, public.open_gate_role_listings TO service_role;

ALTER TABLE public.deal_routing_recipients
  DROP CONSTRAINT IF EXISTS deal_routing_recipients_recipient_type_check;
ALTER TABLE public.deal_routing_recipients
  ADD CONSTRAINT deal_routing_recipients_recipient_type_check
  CHECK (recipient_type IN ('owner', 'broker', 'operator'));

-- Only service-role callers can create a directed operator request. This
-- function checks the unit and current delegate; free requests also check both gate rows inside
-- one transaction before writing a single directed recipient snapshot.
CREATE OR REPLACE FUNCTION public.create_routed_operator_deal(
  p_property_id uuid,
  p_unit_id uuid,
  p_buyer_id text,
  p_message text,
  p_expires_at timestamptz,
  p_open_gate boolean
)
RETURNS TABLE(deal_id uuid, recipient_ids text[], routed_to_roster boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_operator text;
  v_deal uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:roster:' || p_property_id::text, 0));
  SELECT u.operator_id INTO v_operator
  FROM public.property_units u
  WHERE u.id = p_unit_id AND u.property_id = p_property_id
  FOR SHARE;
  IF v_operator IS NULL THEN RAISE EXCEPTION 'OPERATOR_NOT_CONTACTABLE'; END IF;
  IF p_open_gate THEN
  PERFORM 1 FROM public.open_gate_role_entitlements e
  WHERE e.account_id = v_operator AND e.role = 'operator'
    AND e.enabled AND e.expires_at > now() FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'OPEN_GATE_CLOSED'; END IF;
  PERFORM 1 FROM public.open_gate_role_listings l
  WHERE l.property_id = p_property_id AND l.unit_id = p_unit_id
    AND l.recipient_id = v_operator AND l.role = 'operator' AND l.enabled FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'OPEN_GATE_CLOSED'; END IF;
  END IF;
  INSERT INTO public.deals
    (property_id, buyer_id, unit_id, status, expires_at, pitch_message,
     routing_snapshot, connects_spent, open_gate_inbound)
  VALUES
    (p_property_id, p_buyer_id, p_unit_id, 'pending', p_expires_at, p_message,
     jsonb_build_object('recipient_ids', jsonb_build_array(v_operator),
       'recipient_type', 'operator', 'captured_at', now()), CASE WHEN p_open_gate THEN 0 ELSE NULL END, p_open_gate)
  RETURNING id INTO v_deal;
  INSERT INTO public.deal_routing_recipients
    (deal_id, property_id, recipient_id, recipient_type)
  VALUES (v_deal, p_property_id, v_operator, 'operator');
  RETURN QUERY SELECT v_deal, ARRAY[v_operator], false;
END;
$function$;
REVOKE ALL ON FUNCTION public.create_routed_operator_deal(uuid, uuid, text, text, timestamptz, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_routed_operator_deal(uuid, uuid, text, text, timestamptz, boolean) TO service_role;

-- Open Gate abuse budget: at most ten new free requests per sender in a
-- rolling hour. The per-sender advisory lock makes simultaneous submissions
-- observe the same counter. Requires O-004 row 5 (connect_blocks) at runtime.
CREATE OR REPLACE FUNCTION public.admit_open_gate_free_deal(
  p_deal_id uuid, p_buyer_id text
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:open-gate:buyer:' || p_buyer_id, 0));
  IF NOT EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = p_deal_id AND d.buyer_id = p_buyer_id AND d.status = 'pending'
  ) THEN RETURN false; END IF;
  SELECT count(*) INTO v_count FROM public.deals d
  WHERE d.buyer_id = p_buyer_id AND d.id <> p_deal_id
    AND d.open_gate_inbound IS TRUE
    AND d.created_at >= now() - interval '1 hour';
  IF v_count >= 10 THEN RETURN false; END IF;
  UPDATE public.deals SET open_gate_inbound = true, connects_spent = 0
  WHERE id = p_deal_id AND buyer_id = p_buyer_id AND status = 'pending';
  RETURN FOUND;
END;
$function$;
REVOKE ALL ON FUNCTION public.admit_open_gate_free_deal(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admit_open_gate_free_deal(uuid, text) TO service_role;
