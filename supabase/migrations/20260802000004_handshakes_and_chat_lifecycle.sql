-- LR-04: Two distinct handshakes, chat closure, 7-day retention/purge, dispute holds, and audit logging.
-- Additive only. Review and apply through the approved Supabase migration workflow.

CREATE TABLE IF NOT EXISTS public.deal_handshakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE RESTRICT,
  handshake_type TEXT NOT NULL CHECK (handshake_type IN ('representation_handshake', 'transaction_handshake')),
  party_a_id TEXT NOT NULL,
  party_a_signed_at TIMESTAMPTZ,
  party_b_id TEXT NOT NULL,
  party_b_signed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined', 'expired')),
  rating_incremented BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_handshakes_deal_idx ON public.deal_handshakes(deal_id, handshake_type);

CREATE TABLE IF NOT EXISTS public.deal_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open_hold' CHECK (status IN ('open_hold', 'under_review', 'resolved', 'dismissed')),
  hold_placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_disputes_deal_status_idx ON public.deal_disputes(deal_id, status);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'system',
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure user_id, resource_type, resource_id exist if table pre-existed
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'system';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS audit_logs_user_action_idx ON public.audit_logs(user_id, action, created_at DESC);

ALTER TABLE public.deal_handshakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Complete Handshake #2 (Transaction Handshake) — ONLY this handshake increments Scout Rating
CREATE OR REPLACE FUNCTION public.complete_transaction_handshake(
  p_deal_id UUID,
  p_user_id TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  rating_updated BOOLEAN,
  handshake_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_handshake RECORD;
  v_broker_id TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:handshake:' || p_deal_id::text, 0));

  SELECT * INTO v_handshake
  FROM public.deal_handshakes
  WHERE deal_id = p_deal_id AND handshake_type = 'transaction_handshake'
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.deal_handshakes (
      deal_id, handshake_type, party_a_id, party_a_signed_at, party_b_id, party_b_signed_at, status
    )
    SELECT d.id, 'transaction_handshake', d.buyer_id, now(), d.broker_id, NULL, 'pending'
    FROM public.deals d WHERE d.id = p_deal_id
    RETURNING * INTO v_handshake;
  END IF;

  IF p_user_id = v_handshake.party_a_id AND v_handshake.party_a_signed_at IS NULL THEN
    UPDATE public.deal_handshakes SET party_a_signed_at = now(), updated_at = now() WHERE id = v_handshake.id;
  ELSIF p_user_id = v_handshake.party_b_id AND v_handshake.party_b_signed_at IS NULL THEN
    UPDATE public.deal_handshakes SET party_b_signed_at = now(), updated_at = now() WHERE id = v_handshake.id;
  END IF;

  SELECT * INTO v_handshake FROM public.deal_handshakes WHERE id = v_handshake.id;

  IF v_handshake.party_a_signed_at IS NOT NULL AND v_handshake.party_b_signed_at IS NOT NULL THEN
    UPDATE public.deal_handshakes
    SET status = 'completed', rating_incremented = TRUE, updated_at = now()
    WHERE id = v_handshake.id;

    -- Increment broker rating ONLY on Handshake #2 completion
    v_broker_id := v_handshake.party_b_id;
    IF v_broker_id IS NOT NULL THEN
      UPDATE public.user_profiles
      SET scout_rating = COALESCE(scout_rating, 0) + 1
      WHERE id = v_broker_id;
    END IF;

    RETURN QUERY SELECT TRUE, TRUE, 'completed'::text;
  ELSE
    RETURN QUERY SELECT TRUE, FALSE, 'pending'::text;
  END IF;
END;
$$;

-- Purge chat message body contents after 7 days for closed deals without active dispute holds
CREATE OR REPLACE FUNCTION public.purge_expired_chat_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Clear content of messages older than 7 days on closed deals without an active dispute hold
  WITH eligible_deals AS (
    SELECT d.id
    FROM public.deals d
    WHERE d.status = 'closed'
      AND d.closed_at <= now() - INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.deal_disputes disp
        WHERE disp.deal_id = d.id AND disp.status IN ('open_hold', 'under_review')
      )
  )
  UPDATE public.deal_messages m
  SET content = '[Purged after 7 days retention policy]'
  WHERE m.deal_id IN (SELECT id FROM eligible_deals)
    AND m.content <> '[Purged after 7 days retention policy]';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_transaction_handshake(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_expired_chat_messages() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_transaction_handshake(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_expired_chat_messages() TO service_role;
