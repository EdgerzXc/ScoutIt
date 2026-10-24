-- O-034 / A-240 — Staged migration: Signal Fulfilled State & Serving Deal Reference
-- Staged, NOT applied until explicit owner go (O-034)
-- Adds 'fulfilled' to stratosphere_signals.status CHECK constraint,
-- and adds fulfilled_at timestamptz and serving_deal_id referencing deals(id).

BEGIN;

ALTER TABLE public.stratosphere_signals
  DROP CONSTRAINT IF EXISTS stratosphere_signals_status_check;

ALTER TABLE public.stratosphere_signals
  ADD CONSTRAINT stratosphere_signals_status_check
  CHECK (status IN (
    'live', 'needs_edit', 'limited', 'under_review',
    'removed', 'closed', 'expired', 'fulfilled'
  ));

ALTER TABLE public.stratosphere_signals
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS serving_deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL DEFAULT NULL;

COMMIT;
