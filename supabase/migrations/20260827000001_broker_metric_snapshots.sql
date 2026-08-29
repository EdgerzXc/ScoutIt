-- A-023 phase 5: reproducible broker metric snapshots.
--
-- There is deliberately NO separate event ledger. `deal_handshakes`,
-- `deals`, `deal_messages` and `deal_disputes` already are the audited event
-- sources; duplicating them into a parallel ledger would create two versions
-- of the truth and a reconciliation problem that does not need to exist.
-- A snapshot is a cached aggregate, always reproducible by re-running the
-- function against those tables.
--
-- `source` makes a row self-declaring: 'computed' is derived from real events,
-- 'example_seed' is demo scaffolding attached to an is_example_account broker
-- so the surface can be exercised before real deals exist. The public
-- projection carries this through; it is never presented as earned activity.

CREATE TABLE IF NOT EXISTS public.broker_metric_snapshots (
  broker_id TEXT PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE RESTRICT,

  completed_transactions INTEGER NOT NULL DEFAULT 0 CHECK (completed_transactions >= 0),
  response_rate_numerator INTEGER NOT NULL DEFAULT 0 CHECK (response_rate_numerator >= 0),
  response_rate_denominator INTEGER NOT NULL DEFAULT 0 CHECK (response_rate_denominator >= 0),
  median_response_minutes NUMERIC CHECK (median_response_minutes IS NULL OR median_response_minutes >= 0),
  response_sample INTEGER NOT NULL DEFAULT 0 CHECK (response_sample >= 0),
  last_transaction_at TIMESTAMPTZ,

  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  policy_version TEXT NOT NULL DEFAULT 'v1',
  source TEXT NOT NULL DEFAULT 'computed'
    CHECK (source IN ('computed', 'example_seed')),

  -- A rate can never exceed its own denominator.
  CONSTRAINT broker_metric_snapshots_rate_within_denominator
    CHECK (response_rate_numerator <= response_rate_denominator)
);

ALTER TABLE public.broker_metric_snapshots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.broker_metric_snapshots FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.broker_metric_snapshots TO service_role;

-- Recompute one broker's snapshot from the authoritative deal tables.
--
-- Qualification rules, all of them positive checks:
--   * transaction_handshake only  - representation acceptance never counts
--   * status = 'completed'
--   * BOTH parties signed          - a unilateral click is not a handshake
--   * party_a <> party_b           - self-dealing excluded
--   * no live dispute on the deal  - anything not 'dismissed' suppresses it
--   * DISTINCT deal_id             - a retried handshake cannot double-count
CREATE OR REPLACE FUNCTION public.recompute_broker_metric_snapshot(p_broker_id TEXT)
RETURNS public.broker_metric_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.broker_metric_snapshots;
  v_completed INTEGER;
  v_last_txn TIMESTAMPTZ;
  v_denominator INTEGER;
  v_numerator INTEGER;
  v_median NUMERIC;
  v_sample INTEGER;
  v_window_hours CONSTANT INTEGER := 24;
BEGIN
  -- Example seeds are demo fixtures, not derived data. Recomputing one would
  -- silently zero the demo surface, so it is left exactly as seeded.
  SELECT * INTO result FROM public.broker_metric_snapshots WHERE broker_id = p_broker_id;
  IF FOUND AND result.source = 'example_seed' THEN
    RETURN result;
  END IF;

  SELECT count(DISTINCT h.deal_id), max(GREATEST(h.party_a_signed_at, h.party_b_signed_at))
    INTO v_completed, v_last_txn
  FROM public.deal_handshakes h
  WHERE h.handshake_type = 'transaction_handshake'
    AND h.status = 'completed'
    AND h.party_a_signed_at IS NOT NULL
    AND h.party_b_signed_at IS NOT NULL
    AND h.party_a_id IS DISTINCT FROM h.party_b_id
    AND (h.party_a_id = p_broker_id OR h.party_b_id = p_broker_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.deal_disputes d
      WHERE d.deal_id = h.deal_id AND d.status <> 'dismissed'
    );

  -- Eligible inquiries: this broker's deals whose response window has closed.
  SELECT count(*) INTO v_denominator
  FROM public.deals dl
  WHERE dl.broker_id = p_broker_id
    AND dl.archived_at IS NULL
    AND dl.created_at < now() - make_interval(hours => v_window_hours);

  -- Answered: a broker message exists inside the window.
  SELECT count(*) INTO v_numerator
  FROM public.deals dl
  WHERE dl.broker_id = p_broker_id
    AND dl.archived_at IS NULL
    AND dl.created_at < now() - make_interval(hours => v_window_hours)
    AND EXISTS (
      SELECT 1 FROM public.deal_messages m
      WHERE m.deal_id = dl.id
        AND m.sender_id = p_broker_id
        AND m.created_at <= dl.created_at + make_interval(hours => v_window_hours)
    );

  -- Median first-response minutes across answered deals.
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY t.minutes), count(*)
    INTO v_median, v_sample
  FROM (
    SELECT EXTRACT(EPOCH FROM (MIN(m.created_at) - dl.created_at)) / 60 AS minutes
    FROM public.deals dl
    JOIN public.deal_messages m
      ON m.deal_id = dl.id AND m.sender_id = p_broker_id
    WHERE dl.broker_id = p_broker_id
      AND dl.archived_at IS NULL
    GROUP BY dl.id, dl.created_at
    HAVING MIN(m.created_at) >= dl.created_at
  ) t;

  INSERT INTO public.broker_metric_snapshots AS s (
    broker_id, completed_transactions, response_rate_numerator,
    response_rate_denominator, median_response_minutes, response_sample,
    last_transaction_at, calculated_at, policy_version, source
  ) VALUES (
    p_broker_id, COALESCE(v_completed, 0), COALESCE(v_numerator, 0),
    COALESCE(v_denominator, 0), v_median, COALESCE(v_sample, 0),
    v_last_txn, now(), 'v1', 'computed'
  )
  ON CONFLICT (broker_id) DO UPDATE SET
    completed_transactions = EXCLUDED.completed_transactions,
    response_rate_numerator = EXCLUDED.response_rate_numerator,
    response_rate_denominator = EXCLUDED.response_rate_denominator,
    median_response_minutes = EXCLUDED.median_response_minutes,
    response_sample = EXCLUDED.response_sample,
    last_transaction_at = EXCLUDED.last_transaction_at,
    calculated_at = EXCLUDED.calculated_at,
    policy_version = EXCLUDED.policy_version,
    source = 'computed'
  RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_broker_metric_snapshot(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_broker_metric_snapshot(TEXT) TO service_role;
