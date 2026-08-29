-- A-023 gap G4: demo Career History claims for EXAMPLE broker accounts only.
--
-- Same three structural safeguards as the metric seed:
--   1. Targets are selected through `is_example_account IS TRUE`; there is no
--      broker id literal to mistype, so a real broker cannot be seeded.
--   2. Every seeded claim is `verification_state = 'broker_declared'` — the
--      label that claims the least. Nothing here is marked ScoutIt-reviewed,
--      because nobody reviewed it.
--   3. `attested_at` is set explicitly, because the schema refuses to publish
--      an unattested claim. For a demo persona that attestation is part of the
--      fixture; for a real broker it can only come from the broker.
--
-- These figures are self-reported career history for invented advisors on
-- profiles the dossier labels "Example profile · illustrative data". They are
-- deliberately separate from, and never added to, the ScoutIt Record.

INSERT INTO public.broker_career_claims (
  broker_id, metric_key, value_numeric, value_text, unit, currency,
  coverage_start, coverage_end, source_note,
  attested_at, attested_by, verification_state, publish_state
)
SELECT
  up.id,
  seed.metric_key,
  seed.value_numeric,
  seed.value_text,
  seed.unit,
  seed.currency,
  seed.coverage_start::date,
  seed.coverage_end::date,
  seed.source_note,
  now(),
  up.id,
  'broker_declared',
  'published'
FROM public.user_profiles up
JOIN (
  VALUES
    ('Marco Villanueva', 'years_practicing',        15,   '', 'years',        '',
     '2010-01-01', '2025-01-01',
     'PRC licence issued 2010; continuous practice since.'),
    ('Marco Villanueva', 'historical_transactions', 180,  '', 'transactions', '',
     '2010-01-01', '2024-12-31',
     'Brokerage records from previous firm, Makati and BGC office leasing.'),
    ('Isabella Reyes',   'years_practicing',        7,    '', 'years',        '',
     '2018-01-01', '2025-01-01',
     'PRC licence issued 2018; residential and mixed-use practice.')
) AS seed(display_name, metric_key, value_numeric, value_text, unit, currency,
          coverage_start, coverage_end, source_note)
  ON seed.display_name = up.display_name
WHERE up.is_example_account IS TRUE
ON CONFLICT (broker_id, metric_key) DO NOTHING;
