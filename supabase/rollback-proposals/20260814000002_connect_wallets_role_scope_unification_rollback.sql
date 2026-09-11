-- ═════════════════════════════════════════════════════════════════════════════
-- SCOUTIT OPERATIONAL ROLLBACK: Connect Wallet Role Scope & Unification
--
-- STATUS: DEDICATED MANUAL ROLLBACK SCRIPT — DO NOT RUN AUTOMATICALLY
-- LOCATION: supabase/rollback-proposals/ (outside automatic migration discovery)
-- CORRESPONDS TO: 20260814000002_connect_wallets_role_scope_unification.sql
-- REVIEWED UNDER: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-4-2026-08-14
-- RECONCILED AGAINST THE LIVE DATABASE: 2026-09-11
-- ═════════════════════════════════════════════════════════════════════════════
--
-- WHY THIS WAS REWRITTEN ON 2026-09-11
-- The 2026-08-14 version restored the LR-03 body of `spend_connects_atomic`
-- (20260802000003). That is not what the live database runs: the applied
-- `connects_wallet_and_tiers` version lowercases the role and has no amount guard.
-- It also "restored" a 7-argument `spend_connects` that has never existed live —
-- so running it would have left the forward migration's new overload in place.
-- Every function body below was read from the live database with
-- pg_get_functiondef on 2026-09-11, before the forward migration was applied.
--
-- PURPOSE:
-- 1. Drops what the forward migration adds: the canonical refund, the 7-argument
--    `spend_connects` overload, and the helper functions.
-- 2. Restores the exact pre-migration live body of `spend_connects_atomic`.
-- 3. Re-asserts the exact live body of the legacy `refund_connects_system_error`
--    (the forward migration does not change it; restated so a partial run cannot
--    leave it altered).
-- 4. Keeps the `connect_wallet_ledger` CHECK constraint valid for existing rows.
-- 5. PRESERVES all tables and rows, including `user_connect_accounts` and
--    `connect_backfill_holds` — they hold balance and reconciliation history.
-- 6. Does NOT restore the pre-migration anon/authenticated EXECUTE grant on
--    `spend_connects_atomic`. That grant was a defect (U-030): a SECURITY DEFINER
--    function that spends any user's Connects was callable by anonymous visitors.
--
-- The legacy 5-argument `spend_connects(p_user_id, p_amount, p_reason, p_ref_type,
-- p_ref_id)` — the one every paid route calls — is untouched by both scripts.
-- ═════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.refund_connects_system_error_canonical(TEXT, INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.spend_connects(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT);

-- STEP 1: RESTORE THE EXACT PRE-MIGRATION LIVE spend_connects_atomic BODY
CREATE OR REPLACE FUNCTION public.spend_connects_atomic(p_user_id text, p_role text, p_amount integer, p_tier text DEFAULT 'starry'::text, p_source text DEFAULT 'spend'::text, p_reason text DEFAULT NULL::text, p_reference_id text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, remaining_total integer, spent_granted integer, spent_purchased integer, spent_reward integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_month TEXT;
  v_wallet RECORD;
  v_allowance INTEGER;
  v_total INTEGER;
  v_rem INTEGER;
  v_drain_g INTEGER := 0;
  v_drain_p INTEGER := 0;
  v_drain_r INTEGER := 0;
  v_new_g INTEGER;
  v_new_p INTEGER;
  v_new_r INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:wallet:' || p_user_id || ':' || LOWER(p_role), 0));

  v_month := to_char(now(), 'YYYY-MM');

  v_allowance := CASE LOWER(p_role)
    WHEN 'seeker' THEN CASE LOWER(p_tier) WHEN 'universe' THEN 40 WHEN 'cluster' THEN 15 WHEN 'solar' THEN 6 ELSE 1 END
    WHEN 'owner' THEN CASE LOWER(p_tier) WHEN 'universe' THEN 40 WHEN 'cluster' THEN 18 WHEN 'solar' THEN 6 ELSE 1 END
    WHEN 'broker' THEN CASE LOWER(p_tier) WHEN 'universe' THEN 50 WHEN 'cluster' THEN 20 WHEN 'solar' THEN 8 ELSE 1 END
    WHEN 'photographer' THEN CASE LOWER(p_tier) WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    WHEN 'researcher' THEN CASE LOWER(p_tier) WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    ELSE 1
  END;

  SELECT * INTO v_wallet
  FROM public.user_connect_wallets
  WHERE user_id = p_user_id AND role = LOWER(p_role);

  IF NOT FOUND THEN
    INSERT INTO public.user_connect_wallets (user_id, role, granted_balance, granted_month, purchased_balance, reward_balance)
    VALUES (p_user_id, LOWER(p_role), v_allowance, v_month, 0, 0)
    RETURNING * INTO v_wallet;
  ELSIF v_wallet.granted_month <> v_month THEN
    UPDATE public.user_connect_wallets
    SET granted_balance = v_allowance, granted_month = v_month, updated_at = now()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;
  END IF;

  v_total := v_wallet.granted_balance + v_wallet.purchased_balance + v_wallet.reward_balance;
  IF v_total < p_amount THEN
    RETURN QUERY SELECT FALSE, v_total, 0, 0, 0;
    RETURN;
  END IF;

  v_rem := p_amount;

  IF v_rem > 0 AND v_wallet.granted_balance > 0 THEN
    v_drain_g := LEAST(v_wallet.granted_balance, v_rem);
    v_rem := v_rem - v_drain_g;
  END IF;

  IF v_rem > 0 AND v_wallet.purchased_balance > 0 THEN
    v_drain_p := LEAST(v_wallet.purchased_balance, v_rem);
    v_rem := v_rem - v_drain_p;
  END IF;

  IF v_rem > 0 AND v_wallet.reward_balance > 0 THEN
    v_drain_r := LEAST(v_wallet.reward_balance, v_rem);
    v_rem := v_rem - v_drain_r;
  END IF;

  v_new_g := v_wallet.granted_balance - v_drain_g;
  v_new_p := v_wallet.purchased_balance - v_drain_p;
  v_new_r := v_wallet.reward_balance - v_drain_r;

  UPDATE public.user_connect_wallets
  SET granted_balance = v_new_g,
      purchased_balance = v_new_p,
      reward_balance = v_new_r,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.connect_wallet_ledger (
    user_id, role, amount, transaction_type, source, reason, reference_id,
    spend_order, before_granted, after_granted, before_purchased, after_purchased,
    before_reward, after_reward, is_refundable
  ) VALUES (
    p_user_id, LOWER(p_role), p_amount, 'spend', p_source, p_reason, p_reference_id,
    jsonb_build_object('granted', v_drain_g, 'purchased', v_drain_p, 'reward', v_drain_r),
    v_wallet.granted_balance, v_new_g,
    v_wallet.purchased_balance, v_new_p,
    v_wallet.reward_balance, v_new_r,
    FALSE
  );

  RETURN QUERY SELECT TRUE, (v_new_g + v_new_p + v_new_r), v_drain_g, v_drain_p, v_drain_r;
END;
$function$;

-- STEP 2: THE 7-ARGUMENT spend_connects WRAPPER IS DROPPED ABOVE, NOT RESTORED.
-- It never existed live before the forward migration; the legacy 5-argument
-- spend_connects is the one in use and neither script touches it.

-- STEP 3: RE-ASSERT THE EXACT LIVE refund_connects_system_error BODY
CREATE OR REPLACE FUNCTION public.refund_connects_system_error(p_user_id text, p_amount integer, p_reason text, p_staff_id text, p_ref_id text DEFAULT NULL::text)
 RETURNS TABLE(total_balance integer, transaction_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_total INTEGER;
  txn_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'REFUND_AMOUNT_MUST_BE_POSITIVE';
  END IF;
  -- A refund with no stated cause is indistinguishable from someone topping
  -- up a friend's wallet. The reason is the audit trail.
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'REFUND_REASON_REQUIRED';
  END IF;
  IF p_staff_id IS NULL OR btrim(p_staff_id) = '' THEN
    RAISE EXCEPTION 'REFUND_STAFF_ID_REQUIRED';
  END IF;

  -- Serialise concurrent credits to the same wallet.
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:wallet:' || p_user_id, 0));

  UPDATE public.connect_balances
     SET purchased_balance = purchased_balance + p_amount,
         total_balance     = total_balance + p_amount,
         updated_at        = now()
   WHERE user_id = p_user_id
  RETURNING connect_balances.total_balance INTO new_total;

  IF new_total IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  INSERT INTO public.connect_transactions (user_id, kind, bucket, amount, reason, ref_type, ref_id)
  VALUES (
    p_user_id,
    'refund',
    'purchased',
    p_amount,
    'SYSTEM ERROR REFUND by ' || p_staff_id || ': ' || p_reason,
    'system_error_refund',
    p_ref_id
  )
  RETURNING id INTO txn_id;

  RETURN QUERY SELECT new_total, txn_id;
END;
$function$;

-- STEP 4: SAFE CHECK CONSTRAINT MANAGEMENT ON connect_wallet_ledger
-- Ensures existing historical 'refund' rows do not break constraint validation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connect_wallet_ledger'
  ) THEN
    ALTER TABLE public.connect_wallet_ledger DROP CONSTRAINT IF EXISTS connect_wallet_ledger_transaction_type_check;
    ALTER TABLE public.connect_wallet_ledger ADD CONSTRAINT connect_wallet_ledger_transaction_type_check
      CHECK (transaction_type IN ('grant', 'purchase', 'reward', 'spend', 'refund', 'staff_correction'));
  END IF;
END $$;

-- STEP 5: CLEAN UP HELPER FUNCTIONS
DROP FUNCTION IF EXISTS public.backfill_legacy_connect_balances();
DROP FUNCTION IF EXISTS public.get_role_connect_allowance(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.normalize_connect_role(TEXT);

-- STEP 6: PERMISSIONS — service_role only. The pre-migration anon/authenticated
-- EXECUTE grant on spend_connects_atomic is deliberately NOT restored (U-030).
REVOKE ALL ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.refund_connects_system_error(TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_connects_system_error(TEXT, INTEGER, TEXT, TEXT, TEXT) TO service_role;

-- ═════════════════════════════════════════════════════════════════════════════
-- POST-ROLLBACK VERIFICATION QUERIES:
-- ═════════════════════════════════════════════════════════════════════════════
--
-- 1. Check legacy balance counts (must be unchanged by both scripts):
--    SELECT count(*) FROM public.connect_balances;
--
-- 2. Check connect_wallet_ledger transaction types:
--    SELECT DISTINCT transaction_type FROM public.connect_wallet_ledger;
--
-- 3. Exactly one spend_connects must remain, the legacy 5-argument one:
--    SELECT pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'spend_connects';
--
-- 4. Browser roles must hold no EXECUTE on the spend function:
--    SELECT has_function_privilege('anon', 'public.spend_connects_atomic(text,text,integer,text,text,text,text)', 'EXECUTE');
--
