-- ═══════════════════════════════════════════════════════════════════════
-- ROUTED BUYER DEALS MUST START 'pending', NOT 'connected'
-- NEW_IDEAS.md §38.3 / §40.9
-- ═══════════════════════════════════════════════════════════════════════
--
-- ✅ APPLIED TO PRODUCTION 2026-08-05, on explicit owner approval.
--    Verified after apply: RPC writes 'pending'; the 9 pre-existing rows were
--    untouched (connected 7 / invited 1 / accepted 1). See the notes at the
--    bottom for what this switched on.
--
-- THE BUG
-- -------
-- `create_routed_buyer_deal` inserts the new deal with status 'connected'.
-- `/api/deals/initiate` returns `status: "pending"` to the caller. Both have
-- been true since the routing RPC shipped, and they contradict each other.
--
-- The consequence is not cosmetic. §38.3 State 1 says a Connect request waits
-- for the recipient to accept before the conversation opens. Because the row
-- is written 'connected', every real request lands directly in the ACTIVE tab
-- with the chat already open:
--
--   * The recipient never consents. Accept/Decline is never shown to them.
--   * The sender's identity is exposed on arrival, which is precisely what
--     §35 (Buyer Data Fortress) promises buyers will not happen.
--   * The WAITING tab has never held a real row. Verified against production
--     2026-08-05: 9 deals, distribution connected=7 / invited=1 / accepted=1,
--     pending=0.
--
-- So the UI gate built in §40.2 is correct but unreachable until this lands.
--
-- THE FIX
-- -------
-- One word in the INSERT. Everything else in the function is unchanged and is
-- reproduced verbatim so this file is a complete, reviewable definition
-- rather than a diff someone has to reconstruct.

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
    property_id, buyer_id, broker_id, unit_id, status, expires_at, pitch_message, routing_snapshot
  ) VALUES (
    -- CHANGED: 'connected' -> 'pending'. The recipient has not agreed to
    -- anything yet; the Connect has been delivered, not accepted.
    p_property_id, p_buyer_id, primary_broker, p_unit_id, 'pending', p_expires_at, p_message, snapshot
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

-- ═══════════════════════════════════════════════════════════════════════
-- ⚠️ READ BEFORE APPLYING — THIS IS A BEHAVIOUR CHANGE ON LIVE DATA
-- ═══════════════════════════════════════════════════════════════════════
--
-- 1. THERE IS NO DEV DATABASE. NEW_IDEAS.md §11 is still open: dev and
--    production are the same Supabase project, holding real users and real
--    listings. This runs against them. There is no undo.
--
-- 2. EXISTING ROWS ARE DELIBERATELY NOT MIGRATED. This changes only what NEW
--    deals get. The 7 live 'connected' rows stay where they are, in ACTIVE,
--    with their conversations open.
--
--    Backfilling them to 'pending' would be actively harmful: those threads
--    are already open, both parties can already see each other, and some have
--    message history. Retroactively slamming them shut would strand real
--    conversations behind an Accept button for a request the recipient has
--    already been answering for days. The inconsistency is the lesser harm.
--
-- 3. AFTER APPLYING, VERIFY:
--      - Send a Connect from a test account -> lands in WAITING, not ACTIVE.
--      - The recipient sees a request card with a role label, NOT a name.
--      - Accept -> both move to ACTIVE. Decline -> both move to CLOSED.
--      - The 7 pre-existing 'connected' threads still open normally.
--
-- 4. THE EXPIRY CRON STARTS BITING. /api/cron/expire-pending-connects only
--    touches status='pending' rows, so it is inert today. Once this lands,
--    unanswered requests begin expiring (72h nominal, up to 96h on the Hobby
--    plan's daily cron ceiling). That is the intended design — just know it
--    switches on with this migration and not before.
-- ═══════════════════════════════════════════════════════════════════════
