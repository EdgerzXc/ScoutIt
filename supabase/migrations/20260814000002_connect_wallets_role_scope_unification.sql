-- ═════════════════════════════════════════════════════════════════════════════
-- SCOUTIT MIGRATION PROPOSAL: Connect Wallet Role Scope & Authority Unification
--
-- STATUS: PROPOSAL ONLY — NOT APPLIED TO LIVE DATABASE
-- REVIEWED UNDER: T0-1.0D-CONNECT-LEDGER-ROLE-SCOPE-CORRECTION-4-2026-08-14
-- ═════════════════════════════════════════════════════════════════════════════
--
-- PURPOSE:
-- 1. Establishes ONE canonical wallet authority:
--      • `user_connect_wallets`: Role-scoped monthly granted allowances (resets monthly).
--      • `user_connect_accounts`: Account-wide permanent balances (purchased & reward, shared across roles).
--      • `connect_wallet_ledger`: Append-only immutable audit ledger with updated CHECK constraint.
--      • `connect_backfill_holds`: Durable hold table for unallocated/conflicting legacy balances.
-- 2. Strictly enforces the locked hybrid spend priority:
--      (1) Role Monthly Granted (expiring on calendar month rollover)
--      (2) Account-wide Purchased (permanent, shared across all active roles)
--      (3) Account-wide Reward (permanent, shared across all active roles)
-- 3. Enforces unresolved holds across `spend_connects_atomic`, `refund_connects_system_error`, and admin tools.
-- 4. Prevents orphan refunds (`WALLET_NOT_FOUND`) on mistyped user IDs or users without established wallets.
-- 5. Reconciles a 3-store UNION across `connect_balances`, `user_connect_wallets`, and `user_connect_accounts`
--    with full pairwise conflict checking and intra-canonical role value capture.
-- 6. Conserves current canonical grants without resetting spent balances, and holds missing tier/role evidence.
-- 7. Executes `backfill_legacy_connect_balances()` within this proposal.
--
-- ═════════════════════════════════════════════════════════════════════════════
-- PREFLIGHT INSTRUCTIONS (Run in read-only SQL before applying):
-- ═════════════════════════════════════════════════════════════════════════════
--
-- 1. Inspect existing table presence:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--      AND table_name IN ('connect_balances', 'connect_transactions', 'user_connect_wallets', 'user_connect_accounts', 'connect_wallet_ledger', 'connect_backfill_holds');
--
-- 2. Dedicated Rollback Script:
--    Located outside automatic migrations at `supabase/rollback-proposals/20260814000002_connect_wallets_role_scope_unification_rollback.sql`.
--
-- ═════════════════════════════════════════════════════════════════════════════

-- 1. ROLE NORMALIZATION FUNCTION (STRICT & FAIL-CLOSED)
CREATE OR REPLACE FUNCTION public.normalize_connect_role(p_role TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE LOWER(btrim(COALESCE(p_role, '')))
    WHEN 'buyer' THEN 'seeker'
    WHEN 'seeker' THEN 'seeker'
    WHEN 'owner' THEN 'owner'
    WHEN 'broker' THEN 'broker'
    WHEN 'photographer' THEN 'photographer'
    WHEN 'researcher' THEN 'researcher'
    ELSE NULL
  END;
$$;

-- 2. MONTHLY ALLOWANCE LOOKUP FUNCTION
CREATE OR REPLACE FUNCTION public.get_role_connect_allowance(p_role TEXT, p_tier TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE public.normalize_connect_role(p_role)
    WHEN 'seeker' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 40 WHEN 'cluster' THEN 15 WHEN 'solar' THEN 6 ELSE 1 END
    WHEN 'owner' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 40 WHEN 'cluster' THEN 18 WHEN 'solar' THEN 6 ELSE 1 END
    WHEN 'broker' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 50 WHEN 'cluster' THEN 20 WHEN 'solar' THEN 8 ELSE 1 END
    WHEN 'photographer' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    WHEN 'researcher' THEN
      CASE LOWER(COALESCE(p_tier, 'starry')) WHEN 'universe' THEN 25 WHEN 'cluster' THEN 12 WHEN 'solar' THEN 5 ELSE 1 END
    ELSE 1
  END;
$$;

-- 3. CANONICAL ROLE-SCOPED WALLET TABLE (MONTHLY GRANTED)
CREATE TABLE IF NOT EXISTS public.user_connect_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  granted_balance INTEGER NOT NULL DEFAULT 0,
  granted_month TEXT NOT NULL, -- YYYY-MM
  purchased_balance INTEGER NOT NULL DEFAULT 0, -- retained for lossless historical migration
  reward_balance INTEGER NOT NULL DEFAULT 0,    -- retained for lossless historical migration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS user_connect_wallets_user_role_idx
  ON public.user_connect_wallets (user_id, role);

-- 4. CANONICAL ACCOUNT-LEVEL PERMANENT BALANCE TABLE (PURCHASED & REWARD)
CREATE TABLE IF NOT EXISTS public.user_connect_accounts (
  user_id TEXT PRIMARY KEY,
  purchased_balance INTEGER NOT NULL DEFAULT 0,
  reward_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. DURABLE RECONCILIATION HOLD TABLE
CREATE TABLE IF NOT EXISTS public.connect_backfill_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  hold_reason TEXT NOT NULL,
  legacy_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  canonical_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hold_reason)
);

CREATE INDEX IF NOT EXISTS connect_backfill_holds_user_idx
  ON public.connect_backfill_holds (user_id);

-- 6. CANONICAL AUDIT LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.connect_wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('grant', 'purchase', 'reward', 'spend', 'refund', 'staff_correction')),
  source TEXT NOT NULL,
  reason TEXT,
  reference_id TEXT,
  spend_order JSONB NOT NULL DEFAULT '{}'::jsonb,
  before_granted INTEGER NOT NULL DEFAULT 0,
  after_granted INTEGER NOT NULL DEFAULT 0,
  before_purchased INTEGER NOT NULL DEFAULT 0,
  after_purchased INTEGER NOT NULL DEFAULT 0,
  before_reward INTEGER NOT NULL DEFAULT 0,
  after_reward INTEGER NOT NULL DEFAULT 0,
  is_refundable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS connect_wallet_ledger_user_idx
  ON public.connect_wallet_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS connect_wallet_ledger_reference_idx
  ON public.connect_wallet_ledger (reference_id);

-- Safely reconcile CHECK constraint if connect_wallet_ledger already exists
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

-- Enable RLS
ALTER TABLE public.user_connect_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_backfill_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_connect_wallets;
CREATE POLICY "Users can view own wallets"
  ON public.user_connect_wallets FOR SELECT
  USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can view own connect accounts" ON public.user_connect_accounts;
CREATE POLICY "Users can view own connect accounts"
  ON public.user_connect_accounts FOR SELECT
  USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can view own wallet ledger" ON public.connect_wallet_ledger;
CREATE POLICY "Users can view own wallet ledger"
  ON public.connect_wallet_ledger FOR SELECT
  USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can view own holds" ON public.connect_backfill_holds;
CREATE POLICY "Users can view own holds"
  ON public.connect_backfill_holds FOR SELECT
  USING ((SELECT auth.uid())::text = user_id);

-- 7. ATOMIC SPEND PROCEDURE (HYBRID WALLET: ROLE GRANTED + ACCOUNT-WIDE PERMANENT)
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
  v_norm_role TEXT;
  v_month TEXT;
  v_wallet RECORD;
  v_acct RECORD;
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
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 0;
    RETURN;
  END IF;

  v_norm_role := public.normalize_connect_role(p_role);
  IF v_norm_role IS NULL THEN
    -- Fail-closed on unsupported / invalid role
    RETURN QUERY SELECT FALSE, 0, 0, 0, 0;
    RETURN;
  END IF;

  -- Lock user account across all roles
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:wallet:' || p_user_id, 0));

  -- ENFORCE UNRESOLVED HOLDS: fail closed without auto-creating zero accounts
  IF EXISTS (
    SELECT 1 FROM public.connect_backfill_holds
    WHERE user_id = p_user_id AND resolved = FALSE
  ) THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 0;
    RETURN;
  END IF;

  v_month := to_char(now(), 'YYYY-MM');
  v_allowance := public.get_role_connect_allowance(v_norm_role, p_tier);

  -- 1. Ensure role-scoped granted wallet exists and is reset for current month
  SELECT * INTO v_wallet
  FROM public.user_connect_wallets
  WHERE user_id = p_user_id AND role = v_norm_role;

  IF NOT FOUND THEN
    INSERT INTO public.user_connect_wallets (user_id, role, granted_balance, granted_month)
    VALUES (p_user_id, v_norm_role, v_allowance, v_month)
    RETURNING * INTO v_wallet;
  ELSIF v_wallet.granted_month <> v_month THEN
    UPDATE public.user_connect_wallets
    SET granted_balance = v_allowance, granted_month = v_month, updated_at = now()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;
  END IF;

  -- 2. Ensure account-level permanent pool exists
  SELECT * INTO v_acct
  FROM public.user_connect_accounts
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_connect_accounts (user_id, purchased_balance, reward_balance)
    VALUES (p_user_id, 0, 0)
    RETURNING * INTO v_acct;
  END IF;

  v_total := v_wallet.granted_balance + v_acct.purchased_balance + v_acct.reward_balance;
  IF v_total < p_amount THEN
    RETURN QUERY SELECT FALSE, v_total, 0, 0, 0;
    RETURN;
  END IF;

  v_rem := p_amount;

  -- 1. Drain role granted first (expiring monthly)
  IF v_rem > 0 AND v_wallet.granted_balance > 0 THEN
    v_drain_g := LEAST(v_wallet.granted_balance, v_rem);
    v_rem := v_rem - v_drain_g;
  END IF;

  -- 2. Drain account-wide purchased second (permanent)
  IF v_rem > 0 AND v_acct.purchased_balance > 0 THEN
    v_drain_p := LEAST(v_acct.purchased_balance, v_rem);
    v_rem := v_rem - v_drain_p;
  END IF;

  -- 3. Drain account-wide reward third (permanent)
  IF v_rem > 0 AND v_acct.reward_balance > 0 THEN
    v_drain_r := LEAST(v_acct.reward_balance, v_rem);
    v_rem := v_rem - v_drain_r;
  END IF;

  v_new_g := v_wallet.granted_balance - v_drain_g;
  v_new_p := v_acct.purchased_balance - v_drain_p;
  v_new_r := v_acct.reward_balance - v_drain_r;

  UPDATE public.user_connect_wallets
  SET granted_balance = v_new_g, updated_at = now()
  WHERE id = v_wallet.id;

  UPDATE public.user_connect_accounts
  SET purchased_balance = v_new_p, reward_balance = v_new_r, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.connect_wallet_ledger (
    user_id, role, amount, transaction_type, source, reason, reference_id,
    spend_order, before_granted, after_granted, before_purchased, after_purchased,
    before_reward, after_reward, is_refundable
  ) VALUES (
    p_user_id, v_norm_role, p_amount, 'spend', p_source, p_reason, p_reference_id,
    jsonb_build_object('granted', v_drain_g, 'purchased', v_drain_p, 'reward', v_drain_r),
    v_wallet.granted_balance, v_new_g,
    v_acct.purchased_balance, v_new_p,
    v_acct.reward_balance, v_new_r,
    FALSE
  );

  RETURN QUERY SELECT TRUE, (v_new_g + v_new_p + v_new_r), v_drain_g, v_drain_p, v_drain_r;
END;
$$;

-- 8. SPEND CONNECTS WRAPPER ALIAS
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

-- 9. CANONICAL SYSTEM ERROR REFUND (separate from the live legacy RPC)
DROP FUNCTION IF EXISTS public.refund_connects_system_error_canonical(TEXT, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.refund_connects_system_error_canonical(
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
  v_acct RECORD;
  v_new_purchased INTEGER;
  v_txn_id UUID;
  v_role TEXT := 'seeker';
  v_wallet_exists BOOLEAN := FALSE;
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

  -- Lock user account
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:wallet:' || p_user_id, 0));

  -- ENFORCE UNRESOLVED HOLDS
  IF EXISTS (
    SELECT 1 FROM public.connect_backfill_holds
    WHERE user_id = p_user_id AND resolved = FALSE
  ) THEN
    RAISE EXCEPTION 'WALLET_HOLD_ACTIVE: user balance is held pending reconciliation resolution';
  END IF;

  -- PREVENT ORPHAN REFUNDS: Validate that user has an established wallet/account
  SELECT EXISTS (
    SELECT 1 FROM public.user_connect_accounts WHERE user_id = p_user_id
    UNION SELECT 1 FROM public.user_connect_wallets WHERE user_id = p_user_id
    UNION SELECT 1 FROM public.connect_balances WHERE user_id = p_user_id
  ) INTO v_wallet_exists;

  IF NOT v_wallet_exists THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND: user % does not have an established wallet', p_user_id;
  END IF;

  -- Credits the account-wide purchased balance (permanent across all roles)
  SELECT * INTO v_acct
  FROM public.user_connect_accounts
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_connect_accounts (user_id, purchased_balance, reward_balance)
    VALUES (p_user_id, p_amount, 0)
    RETURNING * INTO v_acct;
  ELSE
    UPDATE public.user_connect_accounts
    SET purchased_balance = purchased_balance + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_acct;
  END IF;

  v_new_purchased := v_acct.purchased_balance;

  -- Check primary role if available for audit trail attribution
  SELECT COALESCE(public.normalize_connect_role(primary_mode), public.normalize_connect_role(role), 'account')
  INTO v_role
  FROM public.user_profiles
  WHERE id = p_user_id;
  IF v_role IS NULL THEN v_role := 'account'; END IF;

  -- 1. Insert into canonical connect_wallet_ledger
  INSERT INTO public.connect_wallet_ledger (
    user_id, role, amount, transaction_type, source, reason, reference_id,
    spend_order, before_granted, after_granted, before_purchased, after_purchased,
    before_reward, after_reward, is_refundable
  ) VALUES (
    p_user_id, v_role, p_amount, 'refund', 'system_error_refund',
    'SYSTEM ERROR REFUND by ' || p_staff_id || ': ' || p_reason, p_ref_id,
    jsonb_build_object('purchased_credit', p_amount),
    0, 0,
    v_new_purchased - p_amount, v_new_purchased,
    v_acct.reward_balance, v_acct.reward_balance,
    FALSE
  )
  RETURNING id INTO v_txn_id;

  -- 2. Maintain legacy connect_balances / connect_transactions sync during transition
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connect_balances') THEN
    UPDATE public.connect_balances
    SET purchased_balance = purchased_balance + p_amount,
        total_balance = total_balance + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connect_transactions') THEN
    INSERT INTO public.connect_transactions (user_id, kind, bucket, amount, reason, ref_type, ref_id)
    VALUES (
      p_user_id, 'refund', 'purchased', p_amount,
      'SYSTEM ERROR REFUND by ' || p_staff_id || ': ' || p_reason,
      'system_error_refund', p_ref_id
    );
  END IF;

  RETURN QUERY SELECT v_new_purchased, v_txn_id;
END;
$$;

-- 10. RECONCILIATION & BACKFILL PROCEDURE (PAIRWISE 3-STORE CONFLICT DETECTION & GRANT CONSERVATION)
CREATE OR REPLACE FUNCTION public.backfill_legacy_connect_balances()
RETURNS TABLE (
  reconciled_accounts INTEGER,
  reconciled_wallets INTEGER,
  skipped_unchanged INTEGER,
  held_conflicts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u RECORD;
  r_cb RECORD;
  r_uca RECORD;
  r_prof RECORD;
  r_cur_ucw RECORD;
  v_norm_role TEXT;
  v_tier TEXT;
  v_current_month TEXT;
  v_reset_month TEXT;
  v_can_p_distinct_count INTEGER := 0;
  v_can_r_distinct_count INTEGER := 0;
  v_can_p_val INTEGER := 0;
  v_can_r_val INTEGER := 0;
  v_can_role_data JSONB := '{}'::jsonb;
  v_leg_p_val INTEGER := 0;
  v_leg_r_val INTEGER := 0;
  v_acct_p_val INTEGER := 0;
  v_acct_r_val INTEGER := 0;
  v_final_p INTEGER := 0;
  v_final_r INTEGER := 0;
  v_grant_to_set INTEGER;
  v_a_ins INTEGER := 0;
  v_w_ins INTEGER := 0;
  v_skip INTEGER := 0;
  v_held INTEGER := 0;
  v_has_conflict BOOLEAN := FALSE;
  v_supported_role_count INTEGER := 0;
BEGIN
  v_current_month := to_char(now(), 'YYYY-MM');

  -- Build candidate set across all 3 stores
  FOR u IN
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM public.connect_balances
      UNION
      SELECT user_id FROM public.user_connect_wallets
      UNION
      SELECT user_id FROM public.user_connect_accounts
    ) s
  LOOP
    v_has_conflict := FALSE;

    -- ─────────────────────────────────────────────────────────────
    -- Phase A: Pairwise Permanent Account Balance Reconciliation
    -- ─────────────────────────────────────────────────────────────

    -- 1. Query legacy single-wallet values
    SELECT * INTO r_cb FROM public.connect_balances WHERE user_id = u.user_id;
    v_leg_p_val := COALESCE(r_cb.purchased_balance, 0);
    v_leg_r_val := COALESCE(r_cb.earned_balance, 0);

    -- 2. Query old canonical role wallet values (detecting differing non-zero values across roles)
    SELECT
      COUNT(DISTINCT purchased_balance) FILTER (WHERE purchased_balance > 0),
      COUNT(DISTINCT reward_balance) FILTER (WHERE reward_balance > 0),
      COALESCE(MAX(purchased_balance), 0),
      COALESCE(MAX(reward_balance), 0),
      COALESCE(jsonb_object_agg(role, jsonb_build_object('purchased', purchased_balance, 'reward', reward_balance)), '{}'::jsonb)
    INTO v_can_p_distinct_count, v_can_r_distinct_count, v_can_p_val, v_can_r_val, v_can_role_data
    FROM public.user_connect_wallets
    WHERE user_id = u.user_id;

    -- 3. Query existing canonical account row
    SELECT * INTO r_uca FROM public.user_connect_accounts WHERE user_id = u.user_id;
    v_acct_p_val := COALESCE(r_uca.purchased_balance, 0);
    v_acct_r_val := COALESCE(r_uca.reward_balance, 0);

    -- Check for intra-canonical role differences
    IF v_can_p_distinct_count > 1 OR v_can_r_distinct_count > 1 THEN
      v_has_conflict := TRUE;
      INSERT INTO public.connect_backfill_holds (user_id, hold_reason, legacy_data, canonical_data, resolved)
      VALUES (
        u.user_id,
        'CANONICAL_ROLE_BALANCE_CONFLICT',
        jsonb_build_object('purchased_balance', v_leg_p_val, 'earned_balance', v_leg_r_val),
        jsonb_build_object('roles_detail', v_can_role_data, 'can_purchased_max', v_can_p_val, 'can_reward_max', v_can_r_val),
        FALSE
      )
      ON CONFLICT (user_id, hold_reason) DO UPDATE SET
        canonical_data = EXCLUDED.canonical_data,
        resolved = FALSE;
      v_held := v_held + 1;
    -- Full pairwise check: legacy vs old-canonical, legacy vs account, old-canonical vs account
    ELSIF (v_leg_p_val > 0 AND v_can_p_val > 0 AND v_leg_p_val <> v_can_p_val)
       OR (v_leg_r_val > 0 AND v_can_r_val > 0 AND v_leg_r_val <> v_can_r_val)
       OR (v_leg_p_val > 0 AND v_acct_p_val > 0 AND v_leg_p_val <> v_acct_p_val)
       OR (v_leg_r_val > 0 AND v_acct_r_val > 0 AND v_leg_r_val <> v_acct_r_val)
       OR (v_can_p_val > 0 AND v_acct_p_val > 0 AND v_can_p_val <> v_acct_p_val)
       OR (v_can_r_val > 0 AND v_acct_r_val > 0 AND v_can_r_val <> v_acct_r_val) THEN
      v_has_conflict := TRUE;
      INSERT INTO public.connect_backfill_holds (user_id, hold_reason, legacy_data, canonical_data, resolved)
      VALUES (
        u.user_id,
        'PERMANENT_BALANCE_CONFLICT',
        jsonb_build_object('purchased_balance', v_leg_p_val, 'earned_balance', v_leg_r_val),
        jsonb_build_object('can_purchased', v_can_p_val, 'can_reward', v_can_r_val, 'acct_purchased', v_acct_p_val, 'acct_reward', v_acct_r_val),
        FALSE
      )
      ON CONFLICT (user_id, hold_reason) DO UPDATE SET
        legacy_data = EXCLUDED.legacy_data,
        canonical_data = EXCLUDED.canonical_data,
        resolved = FALSE;
      v_held := v_held + 1;
    ELSE
      -- Consolidated lossless permanent balance: all non-zero sources are proven equal
      v_final_p := GREATEST(v_leg_p_val, v_can_p_val, v_acct_p_val);
      v_final_r := GREATEST(v_leg_r_val, v_can_r_val, v_acct_r_val);

      IF r_uca IS NULL THEN
        INSERT INTO public.user_connect_accounts (user_id, purchased_balance, reward_balance, created_at, updated_at)
        VALUES (u.user_id, v_final_p, v_final_r, now(), now());
        v_a_ins := v_a_ins + 1;
      ELSIF r_uca.purchased_balance <> v_final_p OR r_uca.reward_balance <> v_final_r THEN
        UPDATE public.user_connect_accounts
        SET purchased_balance = v_final_p, reward_balance = v_final_r, updated_at = now()
        WHERE user_id = u.user_id;
        v_a_ins := v_a_ins + 1;
      ELSE
        v_skip := v_skip + 1;
      END IF;
    END IF;

    -- ─────────────────────────────────────────────────────────────
    -- Phase B: Role-Scoped Monthly Grant Reconciliation & Conservation
    -- ─────────────────────────────────────────────────────────────
    SELECT * INTO r_prof FROM public.user_profiles WHERE id = u.user_id;

    v_norm_role := NULL;
    v_tier := NULL;
    v_supported_role_count := 0;

    IF FOUND THEN
      v_norm_role := public.normalize_connect_role(r_prof.primary_mode);
      IF v_norm_role IS NULL THEN
        v_norm_role := public.normalize_connect_role(r_prof.role);
      END IF;

      -- Check active_roles for ambiguity if primary role was not uniquely determined
      IF r_prof.active_roles IS NOT NULL THEN
        FOR i IN 1..COALESCE(array_length(r_prof.active_roles, 1), 0) LOOP
          IF public.normalize_connect_role(r_prof.active_roles[i]) IS NOT NULL THEN
            v_supported_role_count := v_supported_role_count + 1;
            IF v_norm_role IS NULL THEN
              v_norm_role := public.normalize_connect_role(r_prof.active_roles[i]);
            END IF;
          END IF;
        END LOOP;
      END IF;

      -- Tier validation without defaulting/coalescing to starry
      IF r_prof.subscription_tier IS NOT NULL THEN
        v_tier := LOWER(btrim(r_prof.subscription_tier));
        IF v_tier NOT IN ('starry', 'solar', 'cluster', 'universe') THEN
          v_tier := NULL;
        END IF;
      END IF;
    END IF;

    IF v_norm_role IS NULL THEN
      -- No verifiable role evidence
      INSERT INTO public.connect_backfill_holds (user_id, hold_reason, legacy_data, canonical_data, resolved)
      VALUES (
        u.user_id,
        'NO_ROLE_EVIDENCE',
        jsonb_build_object('granted_balance', r_cb.granted_balance, 'last_granted_reset', r_cb.last_granted_reset),
        '{}'::jsonb,
        FALSE
      )
      ON CONFLICT (user_id, hold_reason) DO UPDATE SET
        legacy_data = EXCLUDED.legacy_data,
        resolved = FALSE;
      v_held := v_held + 1;
    ELSIF v_tier IS NULL THEN
      -- Missing or invalid subscription tier: hold rather than fabricate starry
      INSERT INTO public.connect_backfill_holds (user_id, hold_reason, legacy_data, canonical_data, resolved)
      VALUES (
        u.user_id,
        'MISSING_SUBSCRIPTION_TIER',
        jsonb_build_object('raw_tier', r_prof.subscription_tier),
        '{}'::jsonb,
        FALSE
      )
      ON CONFLICT (user_id, hold_reason) DO UPDATE SET
        legacy_data = EXCLUDED.legacy_data,
        resolved = FALSE;
      v_held := v_held + 1;
    ELSIF v_supported_role_count > 1 AND (
      (public.normalize_connect_role(r_prof.primary_mode) IS NULL AND public.normalize_connect_role(r_prof.role) IS NULL)
      OR (public.normalize_connect_role(r_prof.primary_mode) IS NOT NULL AND public.normalize_connect_role(r_prof.role) IS NOT NULL
          AND public.normalize_connect_role(r_prof.primary_mode) <> public.normalize_connect_role(r_prof.role))
    ) THEN
      -- Ambiguous role allocation across multiple active roles
      INSERT INTO public.connect_backfill_holds (user_id, hold_reason, legacy_data, canonical_data, resolved)
      VALUES (
        u.user_id,
        'AMBIGUOUS_ROLE_ALLOCATION',
        jsonb_build_object('active_roles', r_prof.active_roles),
        '{}'::jsonb,
        FALSE
      )
      ON CONFLICT (user_id, hold_reason) DO UPDATE SET
        legacy_data = EXCLUDED.legacy_data,
        resolved = FALSE;
      v_held := v_held + 1;
    ELSE
      -- Check existing canonical wallet to conserve already-spent current grants
      SELECT * INTO r_cur_ucw
      FROM public.user_connect_wallets
      WHERE user_id = u.user_id AND role = v_norm_role;

      -- Safely parse legacy reset month
      v_reset_month := NULL;
      IF r_cb.last_granted_reset IS NOT NULL THEN
        BEGIN
          v_reset_month := to_char(r_cb.last_granted_reset::timestamptz, 'YYYY-MM');
        EXCEPTION WHEN OTHERS THEN
          BEGIN
            v_reset_month := to_char(to_date(r_cb.last_granted_reset::text, 'YYYY-MM-DD'), 'YYYY-MM');
          EXCEPTION WHEN OTHERS THEN
            v_reset_month := NULL;
          END;
        END;
      END IF;

      -- GRANT CONSERVATION LOGIC:
      -- 1. If canonical wallet already exists for current month: conserve its current balance!
      IF r_cur_ucw IS NOT NULL AND r_cur_ucw.granted_month = v_current_month THEN
        IF v_reset_month = v_current_month AND r_cb.granted_balance IS NOT NULL AND r_cb.granted_balance <> r_cur_ucw.granted_balance THEN
          -- Conflicting current month evidence between legacy and canonical
          INSERT INTO public.connect_backfill_holds (user_id, hold_reason, legacy_data, canonical_data, resolved)
          VALUES (
            u.user_id,
            'GRANT_BALANCE_CONFLICT',
            jsonb_build_object('legacy_granted', r_cb.granted_balance, 'reset_month', v_reset_month),
            jsonb_build_object('canonical_granted', r_cur_ucw.granted_balance, 'granted_month', r_cur_ucw.granted_month),
            FALSE
          )
          ON CONFLICT (user_id, hold_reason) DO UPDATE SET
            legacy_data = EXCLUDED.legacy_data,
            canonical_data = EXCLUDED.canonical_data,
            resolved = FALSE;
          v_held := v_held + 1;
        ELSE
          -- Canonical grant is current and unconflicted: leave completely untouched
          v_skip := v_skip + 1;
        END IF;
      -- 2. If canonical wallet is absent or stale, missing/invalid reset evidence must hold.
      ELSE
        IF v_reset_month IS NULL THEN
          INSERT INTO public.connect_backfill_holds (user_id, hold_reason, legacy_data, canonical_data, resolved)
          VALUES (
            u.user_id,
            'MISSING_OR_INVALID_RESET_EVIDENCE',
            jsonb_build_object('granted_balance', r_cb.granted_balance, 'last_granted_reset', r_cb.last_granted_reset),
            jsonb_build_object('canonical_granted', r_cur_ucw.granted_balance, 'canonical_month', r_cur_ucw.granted_month),
            FALSE
          )
          ON CONFLICT (user_id, hold_reason) DO UPDATE SET
            legacy_data = EXCLUDED.legacy_data,
            canonical_data = EXCLUDED.canonical_data,
            resolved = FALSE;
          v_held := v_held + 1;
        ELSE
          IF v_reset_month = v_current_month AND r_cb.granted_balance IS NOT NULL THEN
            v_grant_to_set := r_cb.granted_balance;
          ELSE
            v_grant_to_set := public.get_role_connect_allowance(v_norm_role, v_tier);
          END IF;

          IF r_cur_ucw IS NOT NULL THEN
            UPDATE public.user_connect_wallets
            SET granted_balance = v_grant_to_set, granted_month = v_current_month, updated_at = now()
            WHERE id = r_cur_ucw.id;
            v_w_ins := v_w_ins + 1;
          ELSE
            INSERT INTO public.user_connect_wallets (user_id, role, granted_balance, granted_month, created_at, updated_at)
            VALUES (u.user_id, v_norm_role, v_grant_to_set, v_current_month, now(), now())
            ON CONFLICT (user_id, role) DO NOTHING;
            IF FOUND THEN v_w_ins := v_w_ins + 1; ELSE v_skip := v_skip + 1; END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_a_ins, v_w_ins, v_skip, v_held;
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.spend_connects(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_connects(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.refund_connects_system_error_canonical(TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_connects_system_error_canonical(TEXT, INTEGER, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.backfill_legacy_connect_balances() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_legacy_connect_balances() TO service_role;

-- 11. EXPLICIT MIGRATION EXECUTION INVOCATION
SELECT * FROM public.backfill_legacy_connect_balances();
