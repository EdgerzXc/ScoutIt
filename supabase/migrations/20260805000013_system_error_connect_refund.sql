-- ═══════════════════════════════════════════════════════════════════════
-- SYSTEM-ERROR CONNECT REFUND — the only legitimate refund path
-- NEW_IDEAS.md §38.3 / §40.16
-- ═══════════════════════════════════════════════════════════════════════
--
-- ✅ APPLIED TO PRODUCTION 2026-08-05.
--
-- §38.3 locked the refund policy: no refunds on decline, non-response or
-- withdrawal. The single exception is a verifiable ScoutIt system error —
-- a failed write that never delivered the request, a double charge, a
-- deduction with no conversation created.
--
-- That exception was policy with no mechanism. Until this existed, issuing
-- one meant hand-writing an UPDATE against connect_balances, which produces
-- a credit with NO ledger row — the balance moves and nothing records why,
-- who, or for which incident. That is worse than no refund path at all.
--
-- DESIGN
-- ------
-- 1. Credits the PURCHASED bucket, not granted. Granted Connects expire on
--    the monthly reset; refunding into a bucket that evaporates on the 1st
--    hands back something worth less than what was taken.
--
-- 2. Balance update and ledger insert are one indivisible block. A credit
--    cannot exist without its audit row. This is the whole reason to route
--    refunds through a function instead of ad-hoc SQL.
--
-- 3. Reason and staff id are REQUIRED, enforced in the function rather than
--    by convention. A refund with no stated cause is indistinguishable from
--    someone topping up a friend's wallet.
--
-- 4. EXECUTE is revoked from anon/authenticated and granted only to
--    service_role — so it is reachable exclusively from a server route that
--    has already checked staff identity, never from a browser.

CREATE OR REPLACE FUNCTION public.refund_connects_system_error(
  p_user_id text,
  p_amount integer,
  p_reason text,
  p_staff_id text,
  p_ref_id text DEFAULT NULL
)
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
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'REFUND_REASON_REQUIRED';
  END IF;
  IF p_staff_id IS NULL OR btrim(p_staff_id) = '' THEN
    RAISE EXCEPTION 'REFUND_STAFF_ID_REQUIRED';
  END IF;

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
    p_user_id, 'refund', 'purchased', p_amount,
    'SYSTEM ERROR REFUND by ' || p_staff_id || ': ' || p_reason,
    'system_error_refund', p_ref_id
  )
  RETURNING id INTO txn_id;

  RETURN QUERY SELECT new_total, txn_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.refund_connects_system_error(text, integer, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_connects_system_error(text, integer, text, text, text) TO service_role;
