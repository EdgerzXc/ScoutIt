-- ═══════════════════════════════════════════════════════════════════════
-- RECORD WHAT A CONVERSATION COST
-- NEW_IDEAS.md §40.14  (root cause of §40.1)
-- ═══════════════════════════════════════════════════════════════════════
--
-- ✅ APPLIED TO PRODUCTION 2026-08-05, on explicit owner approval.
--    Verified after apply: column exists, 0 non-NULL rows — no historical deal
--    was given a fabricated cost. All three read paths are now wired (below).
--
-- WHY
-- ---
-- `deals` has no record of the Connects spent to open it. The spend lives in
-- `connect_transactions` (ledger) and the balance in `connect_balances`, but
-- nothing ties an amount to the conversation it bought.
--
-- That gap is what produced §40.1. With no honest number available to render,
-- someone hardcoded `3 Connects Spent` into the chat header — on every deal,
-- while the ledger was charging 1. The UI now renders nothing rather than a
-- fabricated figure, which is correct but not satisfying: a user cannot audit
-- what a thread cost them, and §38.2's "visible, confirmable event" survives
-- only as long as the receipt modal stays open.
--
-- DESIGN
-- ------
-- NULL default, not 0. A NULL reads as "we don't know what this cost" and the
-- UI omits the badge. A 0 would read as "this was free", which is false for
-- every one of the 9 existing deals — they each cost a Connect, we simply
-- didn't write it down at the time. Defaulting to 0 would convert missing
-- data into a confident wrong answer, which is the §40.1 mistake again in
-- a different shape.
--
-- Backfill is deliberately NOT attempted here. It is reconstructible from
-- connect_transactions.ref_id, but that is a data-repair job that should be
-- run and eyeballed on its own, not smuggled into a schema migration.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS connects_spent INTEGER;

COMMENT ON COLUMN public.deals.connects_spent IS
  'Connects charged to open this conversation, written by /api/deals/initiate '
  'from the spend_connects RPC result. NULL means unrecorded (pre-2026-08-05 '
  'rows) — render nothing, never 0. See NEW_IDEAS.md §40.14.';

-- ═══════════════════════════════════════════════════════════════════════
-- AFTER APPLYING — ✅ ALL FOUR DONE 2026-08-05
-- ═══════════════════════════════════════════════════════════════════════
--
-- 1. ✅ `/api/deals/initiate` must write the value it already computes:
--       .update({ connects_spent: <amount charged> })   on the new deal row,
--    inside the same block that already reads `spendData`. It currently
--    returns that number to the client and then discards it.
--
-- 2. ✅ `/api/deals` (GET) must add `connects_spent` to DEAL_FIELDS and map it
--    onto the response object, and `toChatBoxDeal` in
--    src/app/dashboard/inbox/page.js must pass it through.
--
-- 3. ✅ ChatBox's badge then lights up on its own — it is already written as
--    `Number.isFinite(deal.connects_spent) && ...`, so it stays hidden for
--    the NULL backfill rows and appears only where the figure is real.
--
-- 4. ✅ The dev-mock path in /api/deals/initiate bypasses spend_connects
--    entirely (`isDevMock`). Leave connects_spent NULL there — writing a
--    number for a spend that never happened is exactly the class of bug this
--    column exists to prevent.
-- ═══════════════════════════════════════════════════════════════════════
