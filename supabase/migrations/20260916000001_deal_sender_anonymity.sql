-- ⚠️ PREPARED, NOT APPLIED. This file does not authorize a live database change.
-- A-148 (owner spec S2): persist a sender's per-request anonymity choice on
-- the deal so the recipient sees "Anonymous" while the request is unanswered.
-- Owner-gated under O-004 like every migration: backup, exact-plan review,
-- rollback review, live read-back, one at a time.
--
-- Fail-closed contract (already in code before this runs): writes mention
-- `sender_anonymous` only when anonymity was requested — a missing column
-- then fails only anonymous sends (503, no phantom deal), never ordinary
-- ones. Reads fall back to the base field list on 42703, treating rows as
-- not anonymously sent. No RLS change: a column inherits its table's
-- policies, and this stores a boolean choice, never identity.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS sender_anonymous BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.deals.sender_anonymous IS
  'A-148: true when the sender chose anonymity for this request. The recipient sees "Anonymous" until acceptance; acceptance still reveals per the identity rule. Default false preserves existing rows.';
