BEGIN;

CREATE FUNCTION public.guard_claim_publication_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.publication_sync_state IN ('pending', 'reconciliation_required')
     AND OLD.publication_sync_attempt_id IS NOT NULL
     AND OLD.publication_sync_attempt_id IS NOT DISTINCT FROM NEW.publication_sync_attempt_id
     AND ROW(OLD.owner_id, OLD.slug, OLD.title, OLD.canonical_slug, OLD.publication_external_record_id,
             OLD.pipeline_status, OLD.lifecycle_state, OLD.moderation_status, OLD.archived_at, OLD.permanently_removed_at,
             OLD.lister_relationship, OLD.verified, OLD.withdrawn_at, OLD.quietly_open_to_offers)
       IS DISTINCT FROM
         ROW(NEW.owner_id, NEW.slug, NEW.title, NEW.canonical_slug, NEW.publication_external_record_id,
             NEW.pipeline_status, NEW.lifecycle_state, NEW.moderation_status, NEW.archived_at, NEW.permanently_removed_at,
             NEW.lister_relationship, NEW.verified, NEW.withdrawn_at, NEW.quietly_open_to_offers) THEN
    RAISE EXCEPTION 'property publication reconciliation is in progress' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_claim_publication_sync() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_guard_claim_publication_sync
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.guard_claim_publication_sync();

CREATE FUNCTION public.review_property_claim(
  p_claim_id uuid,
  p_actor_id uuid,
  p_transition text,
  p_expected_updated_at timestamptz,
  p_reason text,
  p_note text,
  p_phase text DEFAULT 'decide',
  p_lease timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_staff public.admin_users%ROWTYPE;
  v_claim public.property_claims%ROWTYPE;
  v_property public.properties%ROWTYPE;
  v_profile public.user_profiles%ROWTYPE;
  v_now timestamptz;
  v_status text;
  v_approving boolean := p_transition = 'approve';
  v_own_hold boolean;
  v_roles text[];
  v_cap integer;
  v_transfer jsonb;
  v_metadata jsonb;
  v_withdraw boolean := false;
BEGIN
  IF p_transition IS NULL OR p_transition NOT IN ('take', 'request_information', 'reject', 'approve')
     OR p_phase IS NULL OR p_phase NOT IN ('decide', 'confirm', 'release')
     OR (p_phase <> 'decide' AND NOT v_approving) THEN
    RETURN jsonb_build_object('state', 'invalid');
  END IF;

  SELECT * INTO v_staff FROM public.admin_users WHERE id = p_actor_id AND active IS TRUE FOR SHARE;
  IF NOT FOUND OR COALESCE(v_staff.tier, 0) < (CASE WHEN v_approving THEN 3 ELSE 2 END) THEN
    RETURN jsonb_build_object('state', 'denied');
  END IF;

  SELECT * INTO v_claim FROM public.property_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND OR v_claim.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RETURN jsonb_build_object('state', 'changed');
  END IF;
  IF v_claim.status NOT IN ('submitted', 'technical_review', 'needs_information', 'human_review', 'disputed')
     OR (p_transition IN ('approve', 'reject') AND v_claim.status <> 'human_review')
     OR (p_transition = 'take' AND v_claim.status = 'human_review') THEN
    RETURN jsonb_build_object('state', 'changed');
  END IF;

  v_status := CASE p_transition WHEN 'take' THEN 'human_review'
    WHEN 'request_information' THEN 'needs_information' WHEN 'reject' THEN 'rejected' ELSE 'approved' END;
  p_note := NULLIF(btrim(p_note), '');
  IF p_transition = 'take' THEN
    p_reason := NULL;
  ELSIF p_note IS NULL OR char_length(p_note) < 20
    OR COALESCE(NOT CASE v_status
      WHEN 'needs_information' THEN p_reason IN ('documents_missing', 'documents_unreadable', 'identity_unconfirmed', 'relationship_unclear')
      WHEN 'rejected' THEN p_reason IN ('insufficient_evidence', 'documents_unreadable', 'contradicted_by_record', 'not_the_property_described', 'duplicate_of_existing_claim')
      WHEN 'approved' THEN p_reason IN ('documents_verified', 'lister_conceded', 'corroborated_by_record')
      ELSE false END, true) THEN
    RETURN jsonb_build_object('state', 'invalid');
  END IF;
  IF char_length(p_note) > 2000 THEN RETURN jsonb_build_object('state', 'invalid'); END IF;

  SELECT * INTO v_property FROM public.properties WHERE id = v_claim.property_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('state', 'property_missing'); END IF;
  v_own_hold := v_property.publication_sync_attempt_id IS NOT DISTINCT FROM v_claim.id
    AND COALESCE(v_property.publication_sync_state IN ('pending', 'reconciliation_required'), false);
  IF v_property.publication_sync_state IS NOT NULL AND (NOT v_own_hold OR NOT v_approving) THEN
    RETURN jsonb_build_object('state', 'publication_pending');
  END IF;
  v_now := clock_timestamp();

  IF p_phase <> 'decide' THEN
    IF NOT v_own_hold OR v_property.publication_sync_state <> 'pending' OR p_lease IS NULL
       OR v_property.publication_sync_started_at IS DISTINCT FROM p_lease THEN
      RETURN jsonb_build_object('state', 'changed');
    END IF;
    IF p_phase = 'release' THEN
      UPDATE public.properties SET publication_sync_state = 'reconciliation_required',
        publication_sync_started_at = NULL WHERE id = v_property.id;
      RETURN jsonb_build_object('state', 'retry');
    END IF;
    IF v_now >= p_lease + interval '90 seconds' THEN
      RETURN jsonb_build_object('state', 'retry');
    END IF;
    v_withdraw := true;
  END IF;

  IF v_approving THEN
    IF v_claim.claimant_user_id IS NULL OR v_property.owner_id IS NOT DISTINCT FROM v_claim.claimant_user_id::text
       OR v_property.verified IS TRUE OR v_property.lister_relationship = 'owner'
       OR v_property.permanently_removed_at IS NOT NULL OR v_property.archived_at IS NOT NULL
       OR v_property.pipeline_status IS NULL OR v_property.pipeline_status NOT IN ('approved', 'off_market')
       OR COALESCE(v_property.lifecycle_state IN ('staff_suspended', 'suspended', 'permanently_removed'), false)
       OR COALESCE(v_property.moderation_status IN ('staff_suspended', 'suspended', 'permanently_removed', 'archived'), false) THEN
      RETURN jsonb_build_object('state', 'property_changed');
    END IF;
    IF p_reason = 'documents_verified' AND NOT EXISTS (
      SELECT 1 FROM public.property_claim_documents document
      WHERE document.claim_id = v_claim.id
        AND document.malware_scan_status = 'clean' AND document.checksum ~* '^[0-9a-f]{64}$'
        AND split_part(document.private_storage_path, '/', 1) = v_claim.claimant_user_id::text
        AND split_part(document.private_storage_path, '/', 2) IN (v_property.id::text, v_property.slug, v_property.canonical_slug)
        AND split_part(document.private_storage_path, '/', 3) ~* '^([0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}|[0-9]{13})_[a-z0-9._-]{1,180}\.(pdf|jpe?g|png|webp)$'
        AND document.private_storage_path NOT LIKE '%..%'
        AND array_length(string_to_array(document.private_storage_path, '/'), 1) = 3
    ) THEN
      RETURN jsonb_build_object('state', 'scan_required');
    END IF;
    SELECT * INTO v_profile FROM public.user_profiles
      WHERE id = v_claim.claimant_user_id::text AND archived_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('state', 'profile_missing'); END IF;

    IF v_property.pipeline_status = 'approved' AND (
      COALESCE(v_property.canonical_slug, '') = '' OR
      COALESCE(v_property.publication_external_record_id, '') !~ '^rec[A-Za-z0-9]+$'
    ) THEN
      RETURN jsonb_build_object('state', 'binding_required');
    END IF;

    IF p_phase = 'decide' THEN
      IF v_own_hold AND v_property.publication_sync_state = 'pending' AND
          v_property.publication_sync_started_at > v_now - interval '90 seconds' THEN
        RETURN jsonb_build_object('state', 'busy');
      END IF;

      IF NOT v_own_hold AND v_property.pipeline_status = 'approved' THEN
        v_cap := CASE lower(btrim(COALESCE(v_profile.subscription_tier, 'starry')))
          WHEN 'universe' THEN NULL
          WHEN 'cluster' THEN CASE WHEN v_profile.role = 'broker' THEN 50 ELSE 20 END
          WHEN 'solar' THEN CASE WHEN v_profile.role = 'broker' THEN 15 ELSE 5 END
          ELSE CASE WHEN v_profile.role = 'broker' THEN 3 ELSE 1 END END;
        v_withdraw := v_cap IS NOT NULL AND v_cap <= (
          SELECT count(*) FROM public.properties
          WHERE owner_id = v_claim.claimant_user_id::text AND pipeline_status = 'approved' AND id <> v_property.id
        );
      END IF;

      IF v_own_hold OR v_withdraw THEN
        UPDATE public.properties SET publication_sync_state = 'pending',
          publication_sync_attempt_id = v_claim.id, publication_sync_started_at = v_now
        WHERE id = v_property.id;
        INSERT INTO public.mission_control_actions
          (actor_id, actor_tier, action, target_table, target_id, reason, metadata)
        VALUES (v_staff.id, v_staff.tier, 'claim.withdrawal_requested', 'property_claims', v_claim.id::text, p_note,
          jsonb_build_object('property_id', v_property.id, 'canonical_slug', v_property.canonical_slug,
            'record_id', v_property.publication_external_record_id, 'reason_code', p_reason));
        RETURN jsonb_build_object('state', 'withdraw', 'slug', v_property.canonical_slug,
          'recordId', v_property.publication_external_record_id, 'lease', v_now);
      END IF;
    END IF;

    v_transfer := jsonb_build_object(
      'from_owner_id', v_property.owner_id, 'from_lister_relationship', v_property.lister_relationship,
      'to_owner_id', v_claim.claimant_user_id, 'to_lister_relationship', v_claim.claimed_relationship,
      'slug', COALESCE(v_property.canonical_slug, v_property.slug), 'defaultedToOffMarket', v_withdraw);
    UPDATE public.properties SET
      owner_id = v_claim.claimant_user_id::text,
      lister_relationship = v_claim.claimed_relationship,
      verified = true,
      pipeline_status = CASE WHEN v_withdraw THEN 'off_market' ELSE pipeline_status END,
      lifecycle_state = CASE WHEN v_withdraw THEN 'off_market' ELSE lifecycle_state END,
      withdrawn_at = CASE WHEN v_withdraw THEN v_now ELSE withdrawn_at END,
      quietly_open_to_offers = false,
      publication_sync_state = NULL,
      publication_sync_attempt_id = NULL,
      publication_sync_started_at = NULL
    WHERE id = v_property.id;

    IF v_claim.claimed_relationship = 'owner' THEN
      v_roles := COALESCE(v_profile.active_roles, ARRAY[]::text[]);
      IF NOT ('owner' = ANY(v_roles)) THEN v_roles := array_append(v_roles, 'owner'); END IF;
      UPDATE public.user_profiles SET active_roles = v_roles,
        role = CASE WHEN role IS NULL OR role = 'seeker' THEN 'owner' ELSE role END
      WHERE id = v_profile.id;
    END IF;
    INSERT INTO public.system_events (event, source, severity, subject_table, subject_id, summary, detail)
    VALUES ('listing.ownership.transferred', 'mission-control', 'warning', 'properties', v_property.id::text,
      'Listing ownership transferred following staff review', v_transfer);
  END IF;

  UPDATE public.property_claims SET status = v_status, reviewer_id = v_staff.id,
    decision_reason_code = p_reason, updated_at = v_now WHERE id = v_claim.id;
  v_metadata := jsonb_build_object('from_status', v_claim.status, 'to_status', v_status,
    'reason_code', p_reason, 'note', p_note, 'property_id', v_property.id, 'transfer', v_transfer);
  INSERT INTO public.property_claim_events (claim_id, actor_id, event_type, payload)
  VALUES (v_claim.id, v_staff.id, 'CLAIM_' || upper(v_status), v_metadata);
  INSERT INTO public.mission_control_actions (actor_id, actor_tier, action, target_table, target_id, reason, metadata)
  VALUES (v_staff.id, v_staff.tier, 'claim.' || p_transition, 'property_claims', v_claim.id::text, p_note, v_metadata);

  RETURN jsonb_build_object('state', 'saved', 'status', v_status, 'updatedAt', v_now, 'transfer', v_transfer);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_property_claim(uuid, uuid, text, timestamptz, text, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_property_claim(uuid, uuid, text, timestamptz, text, text, text, timestamptz)
  TO service_role;

COMMIT;
