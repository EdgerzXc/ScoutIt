-- LR-02: property-scoped broker representation and deterministic lead routing.
-- Additive only. This migration is intentionally not applied to a live database
-- by the implementation agent.

CREATE TABLE IF NOT EXISTS public.property_broker_representations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  broker_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'locked', 'suspended', 'unavailable', 'ended', 'declined')),
  visible_to_public BOOLEAN NOT NULL DEFAULT TRUE,
  contactable BOOLEAN NOT NULL DEFAULT TRUE,
  account_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  inventory_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'owner_invite',
  accepted_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  unavailable_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, broker_id)
);

CREATE INDEX IF NOT EXISTS property_broker_representations_property_idx
  ON public.property_broker_representations (property_id, status, priority DESC, created_at, id);
CREATE INDEX IF NOT EXISTS property_broker_representations_broker_idx
  ON public.property_broker_representations (broker_id, status);

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS routing_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.deal_routing_recipients (
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  recipient_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('owner', 'broker')),
  representation_id UUID REFERENCES public.property_broker_representations(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (deal_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS deal_routing_recipients_recipient_idx
  ON public.deal_routing_recipients (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS deal_routing_recipients_property_idx
  ON public.deal_routing_recipients (property_id, created_at DESC);

ALTER TABLE public.property_broker_representations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_routing_recipients ENABLE ROW LEVEL SECURITY;

-- The service-role routes own these reads/writes. No public policy is added.

CREATE OR REPLACE FUNCTION public.get_property_lead_recipients(
  p_property_id UUID,
  p_preferred_broker_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  recipient_id TEXT,
  recipient_type TEXT,
  representation_id UUID,
  sort_rank INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_recipient TEXT;
  active_count INTEGER;
BEGIN
  SELECT p.owner_id::text INTO owner_recipient
  FROM public.properties p
  WHERE p.id = p_property_id;

  IF owner_recipient IS NULL THEN
    RAISE EXCEPTION 'PROPERTY_NOT_FOUND';
  END IF;

  SELECT count(*) INTO active_count
  FROM public.property_broker_representations r
  WHERE r.property_id = p_property_id
    AND r.status = 'active'
    AND r.visible_to_public
    AND r.contactable
    AND r.account_eligible
    AND r.inventory_eligible
    AND (p_preferred_broker_id IS NULL OR r.broker_id = p_preferred_broker_id);

  IF p_preferred_broker_id IS NOT NULL AND active_count = 0 THEN
    RAISE EXCEPTION 'BROKER_NOT_CONTACTABLE';
  END IF;

  IF active_count > 0 THEN
    RETURN QUERY
    SELECT r.broker_id, 'broker'::text, r.id,
      row_number() OVER (ORDER BY r.priority DESC, r.accepted_at NULLS LAST, r.created_at, r.id)::integer
    FROM public.property_broker_representations r
    WHERE r.property_id = p_property_id
      AND r.status = 'active'
      AND r.visible_to_public
      AND r.contactable
      AND r.account_eligible
      AND r.inventory_eligible
      AND (p_preferred_broker_id IS NULL OR r.broker_id = p_preferred_broker_id)
    ORDER BY r.priority DESC, r.accepted_at NULLS LAST, r.created_at, r.id;
  ELSE
    RETURN QUERY SELECT owner_recipient, 'owner'::text, NULL::uuid, 1;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_routed_buyer_deal(
  p_property_id UUID,
  p_buyer_id TEXT,
  p_message TEXT,
  p_expires_at TIMESTAMPTZ,
  p_unit_id UUID DEFAULT NULL,
  p_preferred_broker_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  deal_id UUID,
  recipient_ids TEXT[],
  routed_to_roster BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_owner TEXT;
  new_deal_id UUID;
  recipients TEXT[];
  primary_broker TEXT;
  routed BOOLEAN;
  snapshot JSONB;
  rep RECORD;
BEGIN
  -- Every representation mutation and every routed lead uses this same lock.
  -- This makes the recipient snapshot deterministic under concurrent requests.
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:roster:' || p_property_id::text, 0));

  SELECT p.owner_id::text INTO property_owner
  FROM public.properties p
  WHERE p.id = p_property_id;
  IF property_owner IS NULL THEN RAISE EXCEPTION 'PROPERTY_NOT_FOUND'; END IF;

  SELECT array_agg(r.broker_id ORDER BY r.priority DESC, r.accepted_at NULLS LAST, r.created_at, r.id)
    INTO recipients
  FROM public.property_broker_representations r
  WHERE r.property_id = p_property_id
    AND r.status = 'active'
    AND r.visible_to_public
    AND r.contactable
    AND r.account_eligible
    AND r.inventory_eligible
    AND (p_preferred_broker_id IS NULL OR r.broker_id = p_preferred_broker_id);

  IF p_preferred_broker_id IS NOT NULL AND (recipients IS NULL OR cardinality(recipients) = 0) THEN
    RAISE EXCEPTION 'BROKER_NOT_CONTACTABLE';
  END IF;

  IF recipients IS NULL OR cardinality(recipients) = 0 THEN
    recipients := ARRAY[property_owner];
    routed := FALSE;
    primary_broker := NULL;
  ELSE
    routed := TRUE;
    primary_broker := recipients[1];
  END IF;

  snapshot := jsonb_build_object(
    'recipient_ids', to_jsonb(recipients),
    'recipient_type', CASE WHEN routed THEN 'broker_roster' ELSE 'owner_lister' END,
    'captured_at', now()
  );

  INSERT INTO public.deals (
    property_id, buyer_id, broker_id, unit_id, status, expires_at, pitch_message, routing_snapshot
  ) VALUES (
    p_property_id, p_buyer_id, primary_broker, p_unit_id, 'connected', p_expires_at, p_message, snapshot
  ) RETURNING id INTO new_deal_id;

  IF routed THEN
    FOR rep IN
      SELECT r.id, r.broker_id
      FROM public.property_broker_representations r
      WHERE r.property_id = p_property_id
        AND r.status = 'active'
        AND r.visible_to_public
        AND r.contactable
        AND r.account_eligible
        AND r.inventory_eligible
        AND (p_preferred_broker_id IS NULL OR r.broker_id = p_preferred_broker_id)
      ORDER BY r.priority DESC, r.accepted_at NULLS LAST, r.created_at, r.id
    LOOP
      INSERT INTO public.deal_routing_recipients
        (deal_id, property_id, recipient_id, recipient_type, representation_id)
      VALUES (new_deal_id, p_property_id, rep.broker_id, 'broker', rep.id);
    END LOOP;
  ELSE
    INSERT INTO public.deal_routing_recipients
      (deal_id, property_id, recipient_id, recipient_type)
    VALUES (new_deal_id, p_property_id, property_owner, 'owner');
  END IF;

  RETURN QUERY SELECT new_deal_id, recipients, routed;
END;
$$;

REVOKE ALL ON FUNCTION public.get_property_lead_recipients(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_routed_buyer_deal(UUID, TEXT, TEXT, TIMESTAMPTZ, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_property_lead_recipients(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_routed_buyer_deal(UUID, TEXT, TEXT, TIMESTAMPTZ, UUID, TEXT) TO service_role;
