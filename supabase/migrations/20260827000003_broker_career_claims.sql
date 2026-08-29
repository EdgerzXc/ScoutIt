-- A-023 gap G4: Career History — the SECONDARY, broker-declared template.
--
-- Physically separate from `broker_metric_snapshots` on purpose. A-023 requires
-- the two templates to stay isolated in storage, projection, UI, ranking and
-- rating; two tables with no join and no shared function is the cheapest way to
-- make "never merged" a property of the schema rather than a promise.
--
-- Rule 7 applies twice here, and both defaults are deliberately absent:
--   * `attested_at` has NO default. Attestation is the broker stating a figure
--     is accurate; defaulting it would record a statement nobody made.
--   * `verification_state` defaults to 'broker_declared', the label that claims
--     the least. Only a named staff review may move it to 'scoutit_reviewed'.
--
-- Withdrawal retains the row (`withdrawn_at`) rather than deleting it, so the
-- history of what was once claimed survives.

CREATE TABLE IF NOT EXISTS public.broker_career_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,

  metric_key TEXT NOT NULL CHECK (metric_key IN (
    'years_practicing',
    'historical_transactions',
    'historical_volume',
    'markets_served',
    'property_types'
  )),

  value_numeric NUMERIC CHECK (value_numeric IS NULL OR value_numeric >= 0),
  value_text TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL CHECK (length(unit) BETWEEN 1 AND 40),
  currency TEXT NOT NULL DEFAULT '',

  -- A historical figure without its span is unfalsifiable, so both are required.
  coverage_start DATE NOT NULL,
  coverage_end DATE NOT NULL,

  source_note TEXT NOT NULL CHECK (length(source_note) BETWEEN 1 AND 400),

  attested_at TIMESTAMPTZ,
  attested_by TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,

  verification_state TEXT NOT NULL DEFAULT 'broker_declared'
    CHECK (verification_state IN ('broker_declared', 'scoutit_reviewed')),
  reviewed_by TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  publish_state TEXT NOT NULL DEFAULT 'draft'
    CHECK (publish_state IN ('draft', 'published')),
  withdrawn_at TIMESTAMPTZ,
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision >= 1),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT broker_career_claims_period_ordered
    CHECK (coverage_end >= coverage_start),

  -- Publication requires attestation. Enforced here so no route can bypass it.
  CONSTRAINT broker_career_claims_published_is_attested
    CHECK (publish_state <> 'published' OR attested_at IS NOT NULL),

  -- A reviewed claim must name its reviewer and date.
  CONSTRAINT broker_career_claims_review_is_named
    CHECK (verification_state <> 'scoutit_reviewed'
           OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),

  -- Either a number or text, never neither.
  CONSTRAINT broker_career_claims_has_a_value
    CHECK (value_numeric IS NOT NULL OR length(value_text) > 0),

  -- One live claim per metric per broker.
  CONSTRAINT broker_career_claims_unique_metric UNIQUE (broker_id, metric_key)
);

CREATE INDEX IF NOT EXISTS broker_career_claims_public_idx
  ON public.broker_career_claims (broker_id, metric_key)
  WHERE publish_state = 'published' AND withdrawn_at IS NULL;

ALTER TABLE public.broker_career_claims ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.broker_career_claims FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.broker_career_claims TO service_role;
