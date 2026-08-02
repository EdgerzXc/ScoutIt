-- LR-03: Hybrid Connect wallet, role-scoped monthly allowances, spend order, and audit ledger.
-- Additive only. Review and apply through the approved Supabase migration workflow.

CREATE TABLE IF NOT EXISTS public.user_connect_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'seeker',
  granted_balance INTEGER NOT NULL DEFAULT 0,
  granted_month TEXT NOT NULL, -- YYYY-MM
  purchased_balance INTEGER NOT NULL DEFAULT 0,
  reward_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS user_connect_wallets_user_role_idx
  ON public.user_connect_wallets (user_id, role);

CREATE TABLE IF NOT EXISTS public.connect_wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('grant', 'purchase', 'reward', 'spend', 'staff_correction')),
  source TEXT NOT NULL,
  reason TEXT,
  reference_id TEXT,
  spend_order JSONB NOT NULL DEFAULT '{}'::jsonb,
  before_granted INTEGER NOT NULL,
  after_granted INTEGER NOT NULL,
  before_purchased INTEGER NOT NULL,
  after_purchased INTEGER NOT NULL,
  before_reward INTEGER NOT NULL,
  after_reward INTEGER NOT NULL,
  is_refundable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS connect_wallet_ledger_user_idx
  ON public.connect_wallet_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS connect_wallet_ledger_reference_idx
  ON public.connect_wallet_ledger (reference_id);

ALTER TABLE public.user_connect_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_wallet_ledger ENABLE ROW LEVEL SECURITY;

-- Service role owns wallet writes. Users can view their own ledger entries.
DROP POLICY IF EXISTS "Users can view own wallet ledger" ON public.connect_wallet_ledger;
CREATE POLICY "Users can view own wallet ledger"
  ON public.connect_wallet_ledger FOR SELECT
  USING (auth.uid()::text = user_id);

-- Stored procedure for thread-safe spend with exact priority:
-- 1. Monthly granted (role-scoped) -> 2. Purchased (account-wide) -> 3. Reward (account-wide)
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
  -- Lock user wallet transaction
  PERFORM pg_advisory_xact_lock(hashtextextended('scoutit:wallet:' || p_user_id || ':' || LOWER(p_role), 0));
  
  v_month := to_char(now(), 'YYYY-MM');

  -- Role monthly allowance ladder
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
    -- Monthly reset on calendar rollover
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

  -- 1. Drain granted first
  IF v_rem > 0 AND v_wallet.granted_balance > 0 THEN
    v_drain_g := LEAST(v_wallet.granted_balance, v_rem);
    v_rem := v_rem - v_drain_g;
  END IF;

  -- 2. Drain purchased second
  IF v_rem > 0 AND v_wallet.purchased_balance > 0 THEN
    v_drain_p := LEAST(v_wallet.purchased_balance, v_rem);
    v_rem := v_rem - v_drain_p;
  END IF;

  -- 3. Drain reward third
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
$$;

REVOKE ALL ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_connects_atomic(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

COMMENT ON TABLE public.user_connect_wallets IS
  'Role-scoped Connect wallets. Monthly granted balance resets on calendar month rollover; purchased and reward balances are permanent.';
COMMENT ON TABLE public.connect_wallet_ledger IS
  'Append-only auditable ledger for Connect grants, spends, purchases, rewards, and staff corrections.';
