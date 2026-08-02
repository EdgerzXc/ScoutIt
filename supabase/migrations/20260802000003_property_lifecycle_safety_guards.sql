-- LR-01 follow-up: database-enforced slug reservation and append-only lifecycle evidence.
-- Additive only. Do not apply to a live project without founder review and approval.

UPDATE public.properties
SET canonical_slug = lower(trim(canonical_slug))
WHERE canonical_slug IS NOT NULL
  AND canonical_slug IS DISTINCT FROM lower(trim(canonical_slug));

UPDATE public.property_slug_redirects
SET old_slug = lower(trim(old_slug)),
    current_slug = lower(trim(current_slug))
WHERE old_slug IS DISTINCT FROM lower(trim(old_slug))
   OR current_slug IS DISTINCT FROM lower(trim(current_slug));

ALTER TABLE public.properties
  ALTER COLUMN lifecycle_state SET NOT NULL;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_canonical_slug_normalized_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_canonical_slug_normalized_check
  CHECK (canonical_slug IS NULL OR canonical_slug = lower(trim(canonical_slug)));

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_quiet_offers_state_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_quiet_offers_state_check
  CHECK (quietly_open_to_offers = FALSE OR lifecycle_state = 'off_market');

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS publication_sync_state TEXT,
  ADD COLUMN IF NOT EXISTS publication_sync_attempt_id UUID,
  ADD COLUMN IF NOT EXISTS publication_sync_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publication_external_record_id TEXT,
  ADD COLUMN IF NOT EXISTS publication_external_slug TEXT,
  ADD COLUMN IF NOT EXISTS publication_sync_error TEXT;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_publication_sync_state_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_publication_sync_state_check
  CHECK (publication_sync_state IS NULL OR publication_sync_state IN (
    'pending',
    'external_applied',
    'reconciliation_required'

ALTER TABLE public.property_lifecycle_events
  ADD COLUMN IF NOT EXISTS operation_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS property_lifecycle_events_operation_key_idx
  ON public.property_lifecycle_events (operation_key)
  WHERE operation_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_property_lifecycle_safety()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.canonical_slug IS NOT NULL THEN
    NEW.canonical_slug := lower(trim(NEW.canonical_slug));
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.canonical_slug, 0));
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.canonical_slug IS NOT NULL
       AND NEW.canonical_slug IS DISTINCT FROM OLD.canonical_slug THEN
      RAISE EXCEPTION 'canonical_slug is immutable after first publication'
        USING ERRCODE = '23514';
    END IF;

    IF OLD.lifecycle_state = 'permanently_removed'
       AND NEW.lifecycle_state IS DISTINCT FROM OLD.lifecycle_state THEN
      RAISE EXCEPTION 'permanently removed properties cannot be reactivated'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.lifecycle_state = 'live' AND NEW.canonical_slug IS NULL THEN
    RAISE EXCEPTION 'live properties require a canonical_slug'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.quietly_open_to_offers = TRUE AND NEW.lifecycle_state <> 'off_market' THEN
    RAISE EXCEPTION 'quiet offers are only valid for off-market properties'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.canonical_slug IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.property_slug_redirects redirect
    WHERE redirect.old_slug = NEW.canonical_slug
  ) THEN
    RAISE EXCEPTION 'canonical slug % is permanently reserved by redirect history', NEW.canonical_slug
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_property_lifecycle_safety() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_property_lifecycle_safety ON public.properties;
CREATE TRIGGER trg_enforce_property_lifecycle_safety
  BEFORE INSERT OR UPDATE OF canonical_slug, lifecycle_state, quietly_open_to_offers
  ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_lifecycle_safety();

CREATE OR REPLACE FUNCTION public.enforce_property_slug_redirect_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  property_canonical_slug TEXT;
BEGIN
  NEW.old_slug := lower(trim(NEW.old_slug));
  NEW.current_slug := lower(trim(NEW.current_slug));
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.old_slug, 0));

  IF TG_OP = 'UPDATE' AND (
    NEW.property_id IS DISTINCT FROM OLD.property_id
    OR NEW.old_slug IS DISTINCT FROM OLD.old_slug
    OR NEW.current_slug IS DISTINCT FROM OLD.current_slug
  ) THEN
    RAISE EXCEPTION 'slug redirect identity and mapping are immutable'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.old_slug = NEW.current_slug THEN
    RAISE EXCEPTION 'redirect old_slug and current_slug must differ'
      USING ERRCODE = '23514';
  END IF;

  SELECT canonical_slug
  INTO property_canonical_slug
  FROM public.properties
  WHERE id = NEW.property_id;

  IF property_canonical_slug IS NULL OR NEW.current_slug <> property_canonical_slug THEN
    RAISE EXCEPTION 'redirect current_slug must match the property canonical_slug'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.properties property
    WHERE property.canonical_slug = NEW.old_slug
  ) THEN
    RAISE EXCEPTION 'old slug % is still assigned as a canonical property URL', NEW.old_slug
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_property_slug_redirect_reservation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_property_slug_redirect_reservation ON public.property_slug_redirects;
CREATE TRIGGER trg_enforce_property_slug_redirect_reservation
  BEFORE INSERT OR UPDATE ON public.property_slug_redirects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_slug_redirect_reservation();

CREATE OR REPLACE FUNCTION public.prevent_retained_lifecycle_evidence_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'retained lifecycle evidence is append-only'
    USING ERRCODE = '23514';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_retained_lifecycle_evidence_deletion() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_property_slug_redirect_delete ON public.property_slug_redirects;
CREATE TRIGGER trg_prevent_property_slug_redirect_delete
  BEFORE DELETE ON public.property_slug_redirects
  FOR EACH ROW EXECUTE FUNCTION public.prevent_retained_lifecycle_evidence_deletion();

DROP TRIGGER IF EXISTS trg_prevent_property_lifecycle_event_mutation ON public.property_lifecycle_events;
CREATE TRIGGER trg_prevent_property_lifecycle_event_mutation
  BEFORE UPDATE OR DELETE ON public.property_lifecycle_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_retained_lifecycle_evidence_deletion();

ALTER TABLE public.property_slug_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_lifecycle_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.property_slug_redirects FROM anon, authenticated;
REVOKE ALL ON TABLE public.property_lifecycle_events FROM anon, authenticated;

COMMENT ON COLUMN public.property_lifecycle_events.operation_key IS
  'Stable idempotency key for one lifecycle transition; retries do not duplicate audit evidence.';
COMMENT ON FUNCTION public.enforce_property_lifecycle_safety() IS
  'Freezes canonical slugs, prevents permanent-removal reactivation, and rejects reuse of redirect-reserved URLs.';
