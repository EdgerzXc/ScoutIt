-- ============================================================================
-- 20261015000001 — Forensic Hardening Gap Fixes (A-210 Phase 3)
-- Resolves: GAP-04, GAP-12, GAP-24, GAP-27, GAP-29
-- ============================================================================

-- ── 1. GAP-04: Connect Roles (designer, event-planner) in PostgreSQL ───────────
CREATE OR REPLACE FUNCTION public.normalize_connect_role(p_role TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE LOWER(btrim(COALESCE(p_role, '')))
    WHEN 'buyer' THEN 'seeker'
    WHEN 'seeker' THEN 'seeker'
    WHEN 'owner' THEN 'owner'
    WHEN 'broker' THEN 'broker'
    WHEN 'photographer' THEN 'photographer'
    WHEN 'researcher' THEN 'researcher'
    WHEN 'designer' THEN 'designer'
    WHEN 'event-planner' THEN 'event-planner'
    WHEN 'event_planner' THEN 'event-planner'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_role_connect_allowance(p_role TEXT, p_tier TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE public.normalize_connect_role(p_role)
    WHEN 'seeker' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 40 WHEN 'cluster' THEN 15 WHEN 'solar' THEN 6 ELSE 1 END
    WHEN 'owner' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 40 WHEN 'cluster' THEN 18 WHEN 'solar' THEN 6 ELSE 1 END
    WHEN 'broker' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 50 WHEN 'cluster' THEN 20 WHEN 'solar' THEN 8 ELSE 1 END
    WHEN 'photographer' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    WHEN 'researcher' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    WHEN 'designer' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    WHEN 'event-planner' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    ELSE 1
  END;
$$;

-- ── 2. GAP-29: Default now() on deals.pending_clock_reset_at & deal creation RPCs
ALTER TABLE public.deals ALTER COLUMN pending_clock_reset_at SET DEFAULT now();
UPDATE public.deals SET pending_clock_reset_at = COALESCE(created_at, now()) WHERE pending_clock_reset_at IS NULL;

CREATE OR REPLACE FUNCTION public.create_routed_buyer_deal(
  p_property_id uuid,
  p_buyer_id text,
  p_message text,
  p_expires_at timestamp with time zone,
  p_unit_id uuid DEFAULT NULL::uuid,
  p_preferred_broker_id text DEFAULT NULL::text
)
RETURNS TABLE(deal_id uuid, recipient_ids text[], routed_to_roster boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  property_owner TEXT;
  new_deal_id UUID;
  recipients TEXT[];
  primary_broker TEXT;
  routed BOOLEAN;
  snapshot JSONB;
  rep RECORD;
BEGIN
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
    property_id, buyer_id, broker_id, unit_id, status, expires_at, pitch_message, routing_snapshot, pending_clock_reset_at
  ) VALUES (
    p_property_id, p_buyer_id, primary_broker, p_unit_id, 'pending', p_expires_at, p_message, snapshot, now()
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
$function$;

REVOKE ALL ON FUNCTION public.create_routed_buyer_deal(uuid, text, text, timestamptz, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_routed_buyer_deal(uuid, text, text, timestamptz, uuid, text) TO service_role;

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
     routing_snapshot, connects_spent, open_gate_inbound, pending_clock_reset_at)
  VALUES
    (p_property_id, p_buyer_id, p_unit_id, 'pending', p_expires_at, p_message,
     jsonb_build_object('recipient_ids', jsonb_build_array(v_operator),
       'recipient_type', 'operator', 'captured_at', now()), CASE WHEN p_open_gate THEN 0 ELSE NULL END, p_open_gate, now())
  RETURNING id INTO v_deal;
  INSERT INTO public.deal_routing_recipients
    (deal_id, property_id, recipient_id, recipient_type)
  VALUES (v_deal, p_property_id, v_operator, 'operator');
  RETURN QUERY SELECT v_deal, ARRAY[v_operator], false;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_routed_operator_deal(uuid, uuid, text, text, timestamptz, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_routed_operator_deal(uuid, uuid, text, text, timestamptz, boolean) TO service_role;

-- ── 3. GAP-24: Direct Owner Handshake without Broker ─────────────────────────
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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_handshake RECORD;
  v_broker_id TEXT;
  v_already_completed BOOLEAN := FALSE;
  v_closures_updated INTEGER := 0;
BEGIN
  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RAISE EXCEPTION 'handshake requires an identified caller'
      USING ERRCODE = '28000';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:handshake:' || p_deal_id::text, 0));

  SELECT * INTO v_handshake
  FROM public.deal_handshakes
  WHERE deal_id = p_deal_id AND handshake_type = 'transaction_handshake'
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.deal_handshakes (
      deal_id, property_id, handshake_type,
      party_a_id, party_a_signed_at,
      party_b_id, party_b_signed_at,
      status
    )
    SELECT d.id, d.property_id, 'transaction_handshake',
           d.buyer_id, NULL,
           COALESCE(d.broker_id, p.owner_id::text), NULL,
           'pending'
    FROM public.deals d
    LEFT JOIN public.properties p ON p.id = d.property_id
    WHERE d.id = p_deal_id
    RETURNING * INTO v_handshake;

    IF v_handshake.id IS NULL THEN
      RAISE EXCEPTION 'deal % does not exist', p_deal_id
        USING ERRCODE = '23503';
    END IF;
  ELSIF v_handshake.party_b_id IS NULL THEN
    -- Heal existing row if party_b_id was previously stored as NULL on direct owner deals
    UPDATE public.deal_handshakes dh
    SET party_b_id = COALESCE(d.broker_id, p.owner_id::text), updated_at = now()
    FROM public.deals d
    LEFT JOIN public.properties p ON p.id = d.property_id
    WHERE dh.id = v_handshake.id AND d.id = dh.deal_id
    RETURNING dh.* INTO v_handshake;
  END IF;

  -- Denial is the default: only the two named parties may sign.
  IF p_user_id IS DISTINCT FROM v_handshake.party_a_id
     AND p_user_id IS DISTINCT FROM v_handshake.party_b_id THEN
    RAISE EXCEPTION 'caller is not a party to this handshake'
      USING ERRCODE = '42501';
  END IF;

  IF v_handshake.status IN ('declined', 'expired') THEN
    RETURN QUERY SELECT FALSE, FALSE, v_handshake.status;
    RETURN;
  END IF;

  v_already_completed := (v_handshake.status = 'completed');

  IF p_user_id = v_handshake.party_a_id AND v_handshake.party_a_signed_at IS NULL THEN
    UPDATE public.deal_handshakes
    SET party_a_signed_at = now(), updated_at = now()
    WHERE id = v_handshake.id;
  ELSIF p_user_id = v_handshake.party_b_id AND v_handshake.party_b_signed_at IS NULL THEN
    UPDATE public.deal_handshakes
    SET party_b_signed_at = now(), updated_at = now()
    WHERE id = v_handshake.id;
  END IF;

  SELECT * INTO v_handshake FROM public.deal_handshakes WHERE id = v_handshake.id;

  IF v_handshake.party_a_signed_at IS NOT NULL
     AND v_handshake.party_b_signed_at IS NOT NULL
     AND NOT v_already_completed
     AND NOT v_handshake.rating_incremented THEN
    UPDATE public.deal_handshakes
    SET status = 'completed', rating_incremented = TRUE, updated_at = now()
    WHERE id = v_handshake.id;

    -- Credit the broker's verified closure count exactly once if party_b is a broker.
    v_broker_id := v_handshake.party_b_id;
    IF v_broker_id IS NOT NULL THEN
      UPDATE public.broker_profiles
      SET verified_closures = COALESCE(verified_closures, 0) + 1
      WHERE user_id = v_broker_id;
      GET DIAGNOSTICS v_closures_updated = ROW_COUNT;
    END IF;

    RETURN QUERY SELECT TRUE, (v_closures_updated > 0), 'completed'::text;
  ELSIF v_handshake.party_a_signed_at IS NOT NULL
        AND v_handshake.party_b_signed_at IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, FALSE, 'completed'::text;
  ELSE
    RETURN QUERY SELECT TRUE, FALSE, 'pending'::text;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_transaction_handshake(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_transaction_handshake(UUID, TEXT) TO service_role;

-- ── 4. GAP-27: Atomic Pioneer Badge Minting RPC ──────────────────────────────
CREATE OR REPLACE FUNCTION public.mint_pioneer_badge_atomic(
  p_user_id TEXT,
  p_badge_id TEXT,
  p_max_slots INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  error_code TEXT,
  badge_record JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
  v_new_row RECORD;
BEGIN
  IF p_user_id IS NULL OR btrim(p_user_id) = '' THEN
    RETURN QUERY SELECT FALSE, 'UNAUTHORIZED', NULL::JSONB;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:badge:' || p_badge_id, 0));

  IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN QUERY SELECT FALSE, 'ALREADY_CLAIMED', NULL::JSONB;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.user_badges
  WHERE badge_id = p_badge_id;

  IF v_count >= p_max_slots THEN
    RETURN QUERY SELECT FALSE, 'SOLD_OUT', NULL::JSONB;
    RETURN;
  END IF;

  INSERT INTO public.user_badges (user_id, badge_id, granted_by)
  VALUES (p_user_id, p_badge_id, 'self_claim')
  RETURNING * INTO v_new_row;

  RETURN QUERY SELECT TRUE, NULL::TEXT, to_jsonb(v_new_row);
END;
$$;

REVOKE ALL ON FUNCTION public.mint_pioneer_badge_atomic(TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mint_pioneer_badge_atomic(TEXT, TEXT, INTEGER) TO service_role;

-- ── 5. GAP-12: Add image/webp to property_photos bucket ──────────────────────
UPDATE storage.buckets
   SET allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf','video/mp4']
 WHERE id = 'property_photos';

-- ── 6. GAP-40 & GAP-49: Atomic Spend with Idempotent Upsert & Rollover Guard ─
CREATE OR REPLACE FUNCTION public.spend_connects_atomic(
  p_user_id TEXT,
  p_role TEXT,
  p_amount INTEGER,
  p_tier TEXT DEFAULT 'starry',
  p_source TEXT DEFAULT 'spend',
  p_reason TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  remaining_total INTEGER,
  spent_granted INTEGER,
  spent_purchased INTEGER,
  spent_reward INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_role TEXT;
  v_month TEXT;
  v_wallet RECORD;
  v_acct RECORD;
  v_allowance INTEGER;
  v_total INTEGER;
  v_rem INTEGER;
  v_drain_g INTEGER := 0;
  v_drain_p INTEGER := 0;
  v_drain_r INTEGER := 0;
  v_new_g INTEGER;
  v_new_p INTEGER;
  v_new_r INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 0;
    RETURN;
  END IF;

  v_norm_role := public.normalize_connect_role(p_role);
  IF v_norm_role IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 0;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:wallet:' || p_user_id, 0));

  IF EXISTS (
    SELECT 1 FROM public.connect_backfill_holds
    WHERE user_id = p_user_id AND resolved = FALSE
  ) THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 0;
    RETURN;
  END IF;

  v_month := to_char(now(), 'YYYY-MM');
  v_allowance := public.get_role_connect_allowance(v_norm_role, p_tier);

  -- 1. Idempotent upsert / lazy calendar-month rollover on role wallet (GAP-40, GAP-49)
  SELECT * INTO v_wallet
  FROM public.user_connect_wallets
  WHERE user_id = p_user_id AND role = v_norm_role
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_connect_wallets (user_id, role, granted_balance, granted_month)
    VALUES (p_user_id, v_norm_role, v_allowance, v_month)
    ON CONFLICT (user_id, role) DO UPDATE
      SET granted_balance = CASE
            WHEN public.user_connect_wallets.granted_month IS DISTINCT FROM EXCLUDED.granted_month
            THEN EXCLUDED.granted_balance
            ELSE public.user_connect_wallets.granted_balance
          END,
          granted_month = EXCLUDED.granted_month,
          updated_at = now()
    RETURNING * INTO v_wallet;
  ELSIF v_wallet.granted_month IS DISTINCT FROM v_month THEN
    UPDATE public.user_connect_wallets
    SET granted_balance = v_allowance, granted_month = v_month, updated_at = now()
    WHERE id = v_wallet.id AND granted_month IS DISTINCT FROM v_month
    RETURNING * INTO v_wallet;
  END IF;

  -- 2. Idempotent upsert on account-level permanent pool
  INSERT INTO public.user_connect_accounts (user_id, purchased_balance, reward_balance)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_acct
  FROM public.user_connect_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_total := v_wallet.granted_balance + v_acct.purchased_balance + v_acct.reward_balance;
  IF v_total < p_amount THEN
    RETURN QUERY SELECT FALSE, v_total, 0, 0, 0;
    RETURN;
  END IF;

  v_rem := p_amount;

  IF v_rem > 0 AND v_wallet.granted_balance > 0 THEN
    v_drain_g := LEAST(v_wallet.granted_balance, v_rem);
    v_rem := v_rem - v_drain_g;
  END IF;

  IF v_rem > 0 AND v_acct.purchased_balance > 0 THEN
    v_drain_p := LEAST(v_acct.purchased_balance, v_rem);
    v_rem := v_rem - v_drain_p;
  END IF;

  IF v_rem > 0 AND v_acct.reward_balance > 0 THEN
    v_drain_r := LEAST(v_acct.reward_balance, v_rem);
    v_rem := v_rem - v_drain_r;
  END IF;

  v_new_g := v_wallet.granted_balance - v_drain_g;
  v_new_p := v_acct.purchased_balance - v_drain_p;
  v_new_r := v_acct.reward_balance - v_drain_r;

  UPDATE public.user_connect_wallets
  SET granted_balance = v_new_g, updated_at = now()
  WHERE id = v_wallet.id;

  UPDATE public.user_connect_accounts
  SET purchased_balance = v_new_p, reward_balance = v_new_r, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.connect_wallet_ledger (
    user_id, role, amount, transaction_type, source, reason, reference_id,
    spend_order, before_granted, after_granted, before_purchased, after_purchased,
    before_reward, after_reward, is_refundable
  ) VALUES (
    p_user_id, v_norm_role, p_amount, 'spend', p_source, p_reason, p_reference_id,
    jsonb_build_object('granted', v_drain_g, 'purchased', v_drain_p, 'reward', v_drain_r),
    v_wallet.granted_balance, v_new_g,
    v_acct.purchased_balance, v_new_p,
    v_acct.reward_balance, v_new_r,
    FALSE
  );

  RETURN QUERY SELECT TRUE, (v_new_g + v_new_p + v_new_r), v_drain_g, v_drain_p, v_drain_r;
END;
$$;

REVOKE ALL ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

