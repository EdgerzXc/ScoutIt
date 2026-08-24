-- A-021: one fixed, service-role-only atomic transfer for private demo-owner authority.
-- Target identity is resolved by Mission Control from Supabase Auth email; this
-- function receives the verified UUID and never accepts email as authorization.
CREATE OR REPLACE FUNCTION public.transfer_demo_authority_atomic(
  p_source_id text,
  p_target_user_id uuid,
  p_property_ids uuid[],
  p_expected_route_count integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  actual_ids uuid[];
  actual_route_count integer := 0;
  blocked_count integer := 0;
  collision_count integer := 0;
  spec record;
  count_sql text;
  transferred_properties integer := 0;
  transferred_routes integer := 0;
BEGIN
  -- current_user is the function owner under SECURITY DEFINER, so caller
  -- authority must come from the request claim or the direct session role.
  IF coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     AND session_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    RAISE EXCEPTION 'SERVICE_ROLE_REQUIRED';
  END IF;
  IF p_source_id IS NULL OR btrim(p_source_id) = '' OR p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TRANSFER_IDENTITY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'TARGET_AUTH_USER_NOT_FOUND';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:demo-authority:' || p_source_id, 0));

  SELECT coalesce(array_agg(id ORDER BY id), ARRAY[]::uuid[]) INTO actual_ids
  FROM public.properties WHERE owner_id = p_source_id;
  IF actual_ids IS DISTINCT FROM coalesce(p_property_ids, ARRAY[]::uuid[]) THEN
    RAISE EXCEPTION 'TRANSFER_PLAN_CHANGED';
  END IF;
  IF cardinality(actual_ids) = 0 THEN RAISE EXCEPTION 'NO_ELIGIBLE_PROPERTIES'; END IF;

  -- Any active identity in a buyer, broker, operator, private-workspace,
  -- wallet, or OAuth role must be reviewed separately. Missing optional tables
  -- are skipped because they cannot contain live references.
  FOR spec IN SELECT * FROM (VALUES
    ('property_units', 'operator_id'),
    ('deals', 'buyer_id'),
    ('deals', 'broker_id'),
    ('property_broker_representations', 'broker_id'),
    ('crm_tasks', 'owner_user_id'),
    ('calendar_events', 'owner_user_id'),
    ('calendar_connections', 'owner_user_id'),
    ('connect_balances', 'user_id'),
    ('user_connect_wallets', 'user_id'),
    ('user_connect_accounts', 'user_id')
  ) AS refs(table_name, column_name)
  LOOP
    IF to_regclass('public.' || spec.table_name) IS NOT NULL THEN
      count_sql := format('SELECT count(*) FROM public.%I WHERE %I::text = $1', spec.table_name, spec.column_name);
      EXECUTE count_sql INTO blocked_count USING p_source_id;
      IF blocked_count > 0 THEN
        RAISE EXCEPTION 'BLOCKED_AUTHORITY_REFERENCE'
          USING DETAIL = format('%s.%s has %s active row(s)', spec.table_name, spec.column_name, blocked_count);
      END IF;
    END IF;
  END LOOP;

  IF to_regclass('public.deal_routing_recipients') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.deal_routing_recipients WHERE recipient_id = $1 AND recipient_type = ''owner'' AND representation_id IS NULL AND property_id = ANY($2)'
      INTO actual_route_count USING p_source_id, actual_ids;
    IF actual_route_count <> p_expected_route_count THEN RAISE EXCEPTION 'TRANSFER_PLAN_CHANGED'; END IF;
    EXECUTE 'SELECT count(*) FROM public.deal_routing_recipients source JOIN public.deal_routing_recipients target ON target.deal_id = source.deal_id AND target.recipient_id = $1 WHERE source.recipient_id = $2 AND source.recipient_type = ''owner'' AND source.property_id = ANY($3)'
      INTO collision_count USING p_target_user_id::text, p_source_id, actual_ids;
    IF collision_count > 0 THEN RAISE EXCEPTION 'TARGET_ROUTING_COLLISION'; END IF;
  ELSIF p_expected_route_count <> 0 THEN
    RAISE EXCEPTION 'TRANSFER_PLAN_CHANGED';
  END IF;

  UPDATE public.properties SET owner_id = p_target_user_id::text
  WHERE owner_id = p_source_id AND id = ANY(actual_ids);
  GET DIAGNOSTICS transferred_properties = ROW_COUNT;
  IF transferred_properties <> cardinality(actual_ids) THEN RAISE EXCEPTION 'PROPERTY_TRANSFER_INCOMPLETE'; END IF;

  IF to_regclass('public.deal_routing_recipients') IS NOT NULL THEN
    EXECUTE 'UPDATE public.deal_routing_recipients SET recipient_id = $1 WHERE recipient_id = $2 AND recipient_type = ''owner'' AND representation_id IS NULL AND property_id = ANY($3)'
      USING p_target_user_id::text, p_source_id, actual_ids;
    GET DIAGNOSTICS transferred_routes = ROW_COUNT;
    IF transferred_routes <> p_expected_route_count THEN RAISE EXCEPTION 'ROUTING_TRANSFER_INCOMPLETE'; END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM public.properties WHERE owner_id = p_source_id AND id = ANY(actual_ids)) THEN
    RAISE EXCEPTION 'PROPERTY_POSTCHECK_FAILED';
  END IF;
  RETURN jsonb_build_object(
    'source_id', p_source_id,
    'target_user_id', p_target_user_id,
    'properties_transferred', transferred_properties,
    'owner_routes_transferred', transferred_routes
  );
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_demo_authority_atomic(text, uuid, uuid[], integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_demo_authority_atomic(text, uuid, uuid[], integer) TO service_role;
