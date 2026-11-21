BEGIN;

REVOKE INSERT (
  canonical_slug, canonical_slug_locked_at, published_at, archived_at, withdrawn_at,
  quietly_open_to_offers, permanently_removed_at, publication_sync_state,
  publication_sync_attempt_id, publication_sync_started_at, publication_external_record_id,
  publication_external_slug, publication_sync_error
), UPDATE (
  slug, canonical_slug, canonical_slug_locked_at, published_at, archived_at, withdrawn_at,
  quietly_open_to_offers, permanently_removed_at, pipeline_status, publication_sync_state,
  publication_sync_attempt_id, publication_sync_started_at, publication_external_record_id,
  publication_external_slug, publication_sync_error
) ON public.properties FROM PUBLIC, anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.property_slug_history FROM PUBLIC, anon, authenticated;

CREATE UNIQUE INDEX properties_publication_external_record_id_idx
ON public.properties (publication_external_record_id)
WHERE publication_external_record_id IS NOT NULL;

COMMIT;
