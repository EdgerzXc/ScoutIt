BEGIN;

CREATE INDEX IF NOT EXISTS deal_chat_retention_candidates_idx
  ON public.deals (closed_at, id)
  WHERE status IN ('closed', 'declined', 'withdrawn', 'expired');

CREATE OR REPLACE FUNCTION public.lock_deal_for_chat_hold()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM 1 FROM public.deals WHERE id = NEW.deal_id FOR UPDATE;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.lock_deal_for_chat_hold() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER lock_deal_for_chat_hold
  BEFORE INSERT OR UPDATE OF deal_id, status, resolved_at, updated_at ON public.deal_disputes
  FOR EACH ROW EXECUTE FUNCTION public.lock_deal_for_chat_hold();

CREATE OR REPLACE FUNCTION public.purge_retained_chat_batch(
  p_terminal_statuses text[],
  p_hold_statuses text[],
  p_cutoff timestamptz,
  p_grace_cutoff timestamptz,
  p_purged_body text
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE
SET search_path = ''
AS $$
DECLARE
  candidate_ids uuid[];
  purged_messages bigint;
  purged_deals bigint;
BEGIN
  SELECT ARRAY(
    SELECT d.id FROM public.deals AS d
    WHERE d.status = ANY(p_terminal_statuses)
      AND d.closed_at <= p_cutoff
      AND EXISTS (
        SELECT 1 FROM public.deal_messages AS m
        WHERE m.deal_id = d.id AND m.body <> p_purged_body
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.deal_disputes AS h WHERE h.deal_id = d.id
          AND (h.status = ANY(p_hold_statuses)
            OR (h.status IN ('resolved', 'dismissed')
              AND coalesce(h.resolved_at, h.updated_at) > p_grace_cutoff))
      )
    ORDER BY d.closed_at, d.id
    LIMIT 500
    FOR UPDATE OF d SKIP LOCKED
  ) INTO candidate_ids;

  WITH changed AS (
    UPDATE public.deal_messages AS m SET body = p_purged_body
    WHERE m.deal_id = ANY(candidate_ids) AND m.body <> p_purged_body
      AND NOT EXISTS (
        SELECT 1 FROM public.deal_disputes AS h WHERE h.deal_id = m.deal_id
          AND (h.status = ANY(p_hold_statuses)
            OR (h.status IN ('resolved', 'dismissed')
              AND coalesce(h.resolved_at, h.updated_at) > p_grace_cutoff))
      )
    RETURNING m.deal_id
  )
  SELECT count(*), count(DISTINCT deal_id) INTO purged_messages, purged_deals FROM changed;

  RETURN jsonb_build_object(
    'purged', purged_messages,
    'eligibleDeals', purged_deals,
    'batchCapped', cardinality(candidate_ids) = 500
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_retained_chat_batch(text[],text[],timestamptz,timestamptz,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_retained_chat_batch(text[],text[],timestamptz,timestamptz,text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.file_deal_dispute_hold(
  p_deal_id uuid,
  p_reporter_id text,
  p_reason text,
  p_details text,
  p_status text,
  p_hold_statuses text[],
  p_purged_body text
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE
SET search_path = ''
AS $$
DECLARE
  dispute_id uuid;
  held_at timestamptz;
  already_held boolean;
  history_purged boolean;
BEGIN
  PERFORM 1 FROM public.deals WHERE id = p_deal_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT id, hold_placed_at INTO dispute_id, held_at FROM public.deal_disputes
    WHERE deal_id = p_deal_id AND status = ANY(p_hold_statuses)
    ORDER BY created_at, id LIMIT 1;
  already_held := FOUND;

  IF NOT already_held THEN
    INSERT INTO public.deal_disputes (deal_id, reporter_id, reason, details, status)
    VALUES (p_deal_id, p_reporter_id, p_reason, p_details, p_status)
    RETURNING id, hold_placed_at INTO dispute_id, held_at;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.deal_messages WHERE deal_id = p_deal_id AND body = p_purged_body
  ) INTO history_purged;
  RETURN jsonb_build_object(
    'id', dispute_id,
    'heldAt', held_at,
    'alreadyHeld', already_held,
    'historyPurged', history_purged
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.file_deal_dispute_hold(uuid,text,text,text,text,text[],text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.file_deal_dispute_hold(uuid,text,text,text,text,text[],text)
  TO service_role;

COMMIT;
