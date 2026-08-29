-- A-023 phase 5: demo metric snapshots for EXAMPLE broker accounts only.
--
-- Purpose: exercise the ScoutIt Record surface before any real deal exists, so
-- the pipeline is proven end-to-end and ready the day real handshakes land.
--
-- Three safety properties, all structural rather than procedural:
--
--  1. The INSERT is driven by a SELECT over user_profiles filtered on
--     `is_example_account IS TRUE`. There is no broker id literal to mistype,
--     so a real broker cannot be seeded even by accident.
--  2. Every seeded row carries `source = 'example_seed'`, making it
--     self-declaring in the database rather than indistinguishable from
--     computed data.
--  3. `recompute_broker_metric_snapshot` returns an example_seed row
--     untouched, so a later recompute cannot silently convert demo numbers
--     into apparently-earned ones.
--
-- The public dossier labels example accounts, so these figures are never
-- presented as a real broker's earned record.
--
-- The three personas are deliberately given DIFFERENT states so every branch
-- of the projection is exercised by real data:
--   Marco Villanueva - fully qualified, all three metrics publishable
--   Isabella Reyes   - transactions publishable, response sample below the
--                      minimum so suppression is visible on a live page
--   Daniel Ocampo    - no row at all, so "Building a ScoutIt record" renders
--                      from the genuine no-snapshot path

INSERT INTO public.broker_metric_snapshots (
  broker_id, completed_transactions, response_rate_numerator,
  response_rate_denominator, median_response_minutes, response_sample,
  last_transaction_at, calculated_at, policy_version, source
)
SELECT
  up.id,
  seed.completed,
  seed.numerator,
  seed.denominator,
  seed.median_minutes,
  seed.sample,
  now() - make_interval(days => seed.days_since_txn),
  now(),
  'v1',
  'example_seed'
FROM public.user_profiles up
JOIN (
  VALUES
    ('Marco Villanueva',  6, 17, 19, 38.0, 19, 17),
    ('Isabella Reyes',    1,  2,  3, 95.0,  3, 46)
) AS seed(display_name, completed, numerator, denominator, median_minutes, sample, days_since_txn)
  ON seed.display_name = up.display_name
WHERE up.is_example_account IS TRUE
ON CONFLICT (broker_id) DO UPDATE SET
  completed_transactions = EXCLUDED.completed_transactions,
  response_rate_numerator = EXCLUDED.response_rate_numerator,
  response_rate_denominator = EXCLUDED.response_rate_denominator,
  median_response_minutes = EXCLUDED.median_response_minutes,
  response_sample = EXCLUDED.response_sample,
  last_transaction_at = EXCLUDED.last_transaction_at,
  calculated_at = EXCLUDED.calculated_at,
  source = 'example_seed';
