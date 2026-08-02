-- LR-01: explicit property lifecycle, immutable URL reservation, and retained removal.
-- Additive only. Review and apply through the approved Supabase migration workflow;
-- this file is not executed by the application or by tests.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS lifecycle_state TEXT,
  ADD COLUMN IF NOT EXISTS canonical_slug TEXT,
  ADD COLUMN IF NOT EXISTS canonical_slug_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quietly_open_to_offers BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS permanently_removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS permanently_removed_by TEXT,
  ADD COLUMN IF NOT EXISTS permanently_removed_reason TEXT;

ALTER TABLE public.properties
  ALTER COLUMN lifecycle_state SET DEFAULT 'draft';

UPDATE public.properties
SET lifecycle_state = CASE
  WHEN pipeline_status = 'approved' THEN 'live'
  WHEN pipeline_status IN ('archived', 'off_market') THEN 'off_market'
  WHEN pipeline_status = 'ai_drafting' THEN 'pdf_verification'
  WHEN pipeline_status = 'permanently_removed' THEN 'permanently_removed'
  ELSE 'draft'
END
WHERE lifecycle_state IS NULL;

UPDATE public.properties
SET canonical_slug = slug,
    canonical_slug_locked_at = COALESCE(canonical_slug_locked_at, created_at),
    published_at = COALESCE(published_at, created_at)
WHERE canonical_slug IS NULL
  AND slug IS NOT NULL
  AND pipeline_status IN ('approved', 'archived', 'off_market', 'permanently_removed');

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_lifecycle_state_check;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_lifecycle_state_check
  CHECK (lifecycle_state IN ('draft', 'pdf_verification', 'live', 'off_market', 'staff_suspended', 'permanently_removed'));

CREATE UNIQUE INDEX IF NOT EXISTS properties_canonical_slug_reserved_idx
  ON public.properties (canonical_slug)
  WHERE canonical_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS properties_lifecycle_state_idx
  ON public.properties (lifecycle_state, withdrawn_at);

CREATE TABLE IF NOT EXISTS public.property_slug_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  old_slug TEXT NOT NULL UNIQUE,
  current_slug TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'staff_controlled_migration',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_slug_redirects_property_idx
  ON public.property_slug_redirects (property_id);

CREATE TABLE IF NOT EXISTS public.property_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  from_state TEXT,
  to_state TEXT NOT NULL,
  actor_id TEXT,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_lifecycle_events_property_idx
  ON public.property_lifecycle_events (property_id, created_at DESC);

COMMENT ON COLUMN public.properties.canonical_slug IS
  'First-publication canonical URL. Airtable remains the source of the initial computed slug; application updates never replace this value.';
COMMENT ON COLUMN public.properties.lifecycle_state IS
  'Market lifecycle authority: draft, pdf_verification, live, off_market, staff_suspended, or permanently_removed. Freshness/moderation remain separate concerns.';
COMMENT ON TABLE public.property_slug_redirects IS
  'Reserved historical slugs for staff-controlled migrations. Old slugs are never recycled.';
COMMENT ON TABLE public.property_lifecycle_events IS
  'Append-only audit trail for owner/staff lifecycle transitions and reconciliation.';
