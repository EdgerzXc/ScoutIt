BEGIN;

CREATE FUNCTION public.reconcile_property_publication(
  p_property_id uuid,
  p_actor_id uuid,
  p_decision text,
  p_record_id text,
  p_slug text,
  p_expected jsonb,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  listing public.properties%ROWTYPE;
  review_snapshot jsonb;
  decision_reason text := NULLIF(btrim(p_reason), '');
  operation text;
BEGIN
  IF p_decision IS NULL OR p_decision NOT IN ('bind_record', 'restore_live')
     OR p_slug IS NULL OR p_slug !~ '^[a-z0-9][a-z0-9_-]{0,219}$'
     OR p_record_id IS NULL OR p_record_id !~ '^rec[A-Za-z0-9]+$'
     OR COALESCE(char_length(decision_reason), 0) NOT BETWEEN 12 AND 500 THEN
    RETURN jsonb_build_object('state', 'invalid');
  END IF;

  PERFORM 1 FROM public.admin_users
    WHERE id = p_actor_id AND active IS TRUE AND tier >= 3 FOR SHARE;
  IF NOT FOUND THEN RETURN jsonb_build_object('state', 'denied'); END IF;

  SELECT * INTO listing FROM public.properties WHERE id = p_property_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('state', 'changed'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_slug, 0));

  review_snapshot := jsonb_build_object(
    'id', listing.id, 'slug', listing.slug, 'canonical_slug', listing.canonical_slug,
    'canonical_slug_locked_at', listing.canonical_slug_locked_at, 'title', listing.title,
    'location', listing.location, 'owner_id', listing.owner_id,
    'publication_external_record_id', listing.publication_external_record_id,
    'publication_sync_state', listing.publication_sync_state, 'lifecycle_state', listing.lifecycle_state,
    'pipeline_status', listing.pipeline_status, 'moderation_status', listing.moderation_status,
    'published_at', listing.published_at, 'archived_at', listing.archived_at, 'withdrawn_at', listing.withdrawn_at,
    'permanently_removed_at', listing.permanently_removed_at, 'quietly_open_to_offers', listing.quietly_open_to_offers
  );
  IF p_expected IS DISTINCT FROM review_snapshot OR listing.canonical_slug IS DISTINCT FROM p_slug
     OR listing.pipeline_status IS DISTINCT FROM 'approved'
     OR COALESCE(listing.moderation_status, '') NOT IN ('approved', 'pending')
     OR COALESCE(btrim(listing.owner_id), '') = '' OR listing.published_at IS NULL
     OR listing.canonical_slug_locked_at IS NULL OR listing.publication_sync_state IS NOT NULL
     OR listing.archived_at IS NOT NULL OR listing.withdrawn_at IS NOT NULL
     OR listing.permanently_removed_at IS NOT NULL OR listing.quietly_open_to_offers IS DISTINCT FROM false
     OR COALESCE(listing.lifecycle_state, '') NOT IN ('live', 'draft') THEN
    RETURN jsonb_build_object('state', 'changed');
  END IF;

  IF EXISTS (SELECT 1 FROM public.properties other WHERE other.id <> listing.id AND
      (lower(btrim(other.slug)) = p_slug OR lower(btrim(other.canonical_slug)) = p_slug OR other.publication_external_record_id = p_record_id))
     OR EXISTS (SELECT 1 FROM public.property_slug_history h WHERE lower(btrim(h.old_slug)) = p_slug)
     OR EXISTS (SELECT 1 FROM public.property_slug_redirects r WHERE lower(btrim(r.old_slug)) = p_slug)
     OR NOT EXISTS (SELECT 1 FROM public.get_property_lead_recipients(listing.id, NULL::text)) THEN
    RETURN jsonb_build_object('state', 'conflict');
  END IF;

  IF p_decision = 'bind_record' AND listing.lifecycle_state = 'live'
      AND listing.publication_external_record_id IS NULL
      AND COALESCE(btrim(listing.title), '') <> '' AND COALESCE(btrim(listing.location), '') <> '' THEN
    UPDATE public.properties SET publication_external_record_id = p_record_id WHERE id = listing.id;
  ELSIF p_decision = 'restore_live' AND listing.lifecycle_state = 'draft'
      AND listing.publication_external_record_id = p_record_id THEN
    UPDATE public.properties SET lifecycle_state = 'live' WHERE id = listing.id;
  ELSE
    RETURN jsonb_build_object('state', 'changed');
  END IF;

  operation := 'mc-public-reconcile:' || p_decision || ':' || listing.id::text || ':' || p_record_id;
  INSERT INTO public.property_lifecycle_events
    (property_id, operation_key, from_state, to_state, actor_id, reason, metadata)
  VALUES (listing.id, operation, listing.lifecycle_state, 'live', p_actor_id::text, decision_reason,
    jsonb_build_object('airtable_record_id', p_record_id, 'public_slug', p_slug, 'decision', p_decision,
      'source', 'property.public_lifecycle_reconciliation.v1'));

  RETURN jsonb_build_object('state', 'saved', 'propertyId', listing.id, 'recordId', p_record_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reconcile_property_publication(uuid, uuid, text, text, text, jsonb, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_property_publication(uuid, uuid, text, text, text, jsonb, text)
  TO service_role;

COMMIT;
