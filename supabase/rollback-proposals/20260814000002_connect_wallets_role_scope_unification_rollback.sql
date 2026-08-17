-- ═════════════════════════════════════════════════════════════════════════════
-- SCOUTIT OPERATIONAL ROLLBACK: Connect Wallet Role Scope & Unification
--
-- STATUS: DEDICATED MANUAL ROLLBACK SCRIPT — DO NOT RUN AUTOMATICALLY
-- LOCATION: supabase/rollback-proposals/ (outside automatic migration discovery)
-- CORRESPONDS TO: 20260814000002_connect_wallets_role_scope_unification.sql
-- REVIEWED UNDER: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-4-2026-08-14
-- ═════════════════════════════════════════════════════════════════════════════
--
-- PURPOSE:
-- 1. Restores the exact prior LR-03 spend functions (`spend_connects_atomic`, `spend_connects`).
-- 2. Restores the exact prior legacy single-wallet `refund_connects_system_error` function body.
-- 3. Safely manages `connect_wallet_ledger` CHECK constraint so existing 'refund' audit rows
--    are preserved without causing constraint validation failures.
-- 4. Cleans up helper functions while preserving all tables and historical audit rows.
-- 5. Provides post-rollback verification queries.
--
-- ═════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.refund_connects_system_error_canonical(TEXT, INTEGER, TEXT, TEXT, TEXT);

-- STEP 1: RESTORE EXACT PRIOR spend_connects_atomic FUNCTION BODY (LR-03 / 20260802000003)
CREATE OR REPLACE FUNCTION public.spend_connects_atomic(
  p_user_id TEXT,
  p_role TEXT,
  p_amount INTEGER,
  p_tier TEXT DEFAULT 'starry',
  p_source TEXT DEFAULT 'spend',
  p_reason TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  remaining_total INTEGER,
  spent_granted INTEGER,
  spent_purchased INTEGER,
  spent_reward INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 0;
    RETURN;
  END IF;

  v_month := to_char(now(), 'YYYY-MM');

  -- Lock the specific role wallet for this user
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:wallet:' || p_user_id || ':' || p_role, 0));

  -- Get monthly allowance for this role & tier
  SELECT CASE p_role
    WHEN 'seeker' THEN
      CASE p_tier WHEN 'universe' THEN 40 WHEN 'cluster' THEN 15 WHEN 'solar' THEN 6 ELSE 1 END
    WHEN 'buyer' THEN
      CASE p_tier WHEN 'universe' THEN 40 WHEN 'cluster' THEN 15 WHEN 'solar' THEN 6 ELSE 1 END
    WHEN 'owner' THEN
      CASE p_tier WHEN 'universe' THEN 40 WHEN 'cluster' THEN 18 WHEN 'solar' THEN 6 ELSE 1 END
    WHEN 'broker' THEN
      CASE p_tier WHEN 'universe' THEN 50 WHEN 'cluster' THEN 20 WHEN 'solar' THEN 8 ELSE 1 END
    WHEN 'photographer' THEN
      CASE p_tier WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    WHEN 'researcher' THEN
      CASE p_tier WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    ELSE 1
  END INTO v_allowance;

  -- Ensure wallet row exists and granted is reset if month rolled over
  SELECT * INTO v_wallet
  FROM public.user_connect_wallets
  WHERE user_id = p_user_id AND role = p_role;

  IF NOT FOUND THEN
    INSERT INTO public.user_connect_wallets (user_id, role, granted_balance, granted_month)
    VALUES (p_user_id, p_role, v_allowance, v_month)
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

  -- 1. Drain granted first (resets monthly)
  IF v_rem > 0 AND v_wallet.granted_balance > 0 THEN
    v_drain_g := LEAST(v_wallet.granted_balance, v_rem);
    v_rem := v_rem - v_drain_g;
  END IF;

  -- 2. Drain purchased second (permanent)
  IF v_rem > 0 AND v_wallet.purchased_balance > 0 THEN
    v_drain_p := LEAST(v_wallet.purchased_balance, v_rem);
    v_rem := v_rem - v_drain_p;
  END IF;

  -- 3. Drain reward third (permanent)
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
    p_user_id, p_role, p_amount, 'spend', p_source, p_reason, p_reference_id,
    jsonb_build_object('granted', v_drain_g, 'purchased', v_drain_p, 'reward', v_drain_r),
    v_wallet.granted_balance, v_new_g,
    v_wallet.purchased_balance, v_new_p,
    v_wallet.reward_balance, v_new_r,
    FALSE
  );

  RETURN QUERY SELECT TRUE, (v_new_g + v_new_p + v_new_r), v_drain_g, v_drain_p, v_drain_r;
END;
$$;

-- STEP 2: RESTORE EXACT PRIOR spend_connects WRAPPER (LR-03)
CREATE OR REPLACE FUNCTION public.spend_connects(
  p_user_id TEXT,
  p_role TEXT DEFAULT 'seeker',
  p_amount INTEGER DEFAULT 1,
  p_tier TEXT DEFAULT 'starry',
  p_source TEXT DEFAULT 'spend',
  p_reason TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  remaining_total INTEGER,
  spent_granted INTEGER,
  spent_purchased INTEGER,
  spent_reward INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.spend_connects_atomic(
    p_user_id, p_role, p_amount, p_tier, p_source, p_reason, p_reference_id
  );
END;
$$;

-- STEP 3: RESTORE EXACT PRIOR refund_connects_system_error FUNCTION BODY (20260805000013)
CREATE OR REPLACE FUNCTION public.refund_connects_system_error(
  p_user_id TEXT,
  p_amount INTEGER,
  p_reason TEXT,
  p_staff_id TEXT,
  p_ref_id TEXT DEFAULT NULL
)
RETURNS TABLE(total_balance INTEGER, transaction_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total INTEGER;
  v_txn_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'REFUND_AMOUNT_MUST_BE_POSITIVE';
  END IF;
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'REFUND_REASON_REQUIRED';
  END IF;
  IF p_staff_id IS NULL OR btrim(p_staff_id) = '' THEN
    RAISE EXCEPTION 'REFUND_STAFF_ID_REQUIRED';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:wallet:' || p_user_id, 0));

  IF NOT EXISTS (SELECT 1 FROM public.connect_balances WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  UPDATE public.connect_balances
  SET purchased_balance = purchased_balance + p_amount,
      total_balance = total_balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING total_balance INTO v_new_total;

  INSERT INTO public.connect_transactions (
    user_id, kind, bucket, amount, reason, ref_type, ref_id
  ) VALUES (
    p_user_id, 'refund', 'purchased', p_amount,
    'SYSTEM ERROR REFUND by ' || p_staff_id || ': ' || p_reason,
    'system_error_refund', p_ref_id
  )
  RETURNING id INTO v_txn_id;

  RETURN QUERY SELECT v_new_total, v_txn_id;
END;
$$;

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

-- STEP 6: RESTORE PERMISSIONS
REVOKE ALL ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.spend_connects(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_connects(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.refund_connects_system_error(TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_connects_system_error(TEXT, INTEGER, TEXT, TEXT, TEXT) TO service_role;

-- ═════════════════════════════════════════════════════════════════════════════
-- POST-ROLLBACK VERIFICATION QUERIES:
-- ═════════════════════════════════════════════════════════════════════════════
--
-- 1. Check legacy balance counts:
--    SELECT count(*) FROM public.connect_balances;
--
-- 2. Check connect_wallet_ledger transaction types:
--    SELECT DISTINCT transaction_type FROM public.connect_wallet_ledger;
--
-- 3. Verify function signatures:
--    SELECT proname, proargnames FROM pg_proc WHERE proname IN ('spend_connects_atomic', 'refund_connects_system_error');
--
