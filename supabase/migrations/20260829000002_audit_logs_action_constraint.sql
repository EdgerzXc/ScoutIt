-- A-046 — application audit writes have never succeeded.
--
-- public.audit_logs carried CHECK (action IN ('INSERT','UPDATE','DELETE')),
-- which only ever described what the `audit_record_changes` TRIGGER writes.
-- Every application-level action name — deal_close, deal_dispute_filed,
-- deal_conversation_exported, PROPERTY_VERIFIED,
-- ACCOUNT_DELETED_RIGHT_TO_ERASURE — falls outside that set, so all five
-- writeAuditLog call sites failed at the database. Verified on the live
-- database 2026-08-29: 717 rows, three distinct actions, none from app code.
--
-- The fix is deliberately NOT a wider allow-list. Enumerating today's five
-- names re-arms the same trap for the sixth: a new action would fail exactly
-- as silently. The column is free-form by design, so the constraint now
-- checks SHAPE (present, non-blank, bounded) rather than membership.

ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_action_check
  CHECK (action IS NOT NULL AND length(btrim(action)) BETWEEN 1 AND 120);

COMMENT ON CONSTRAINT audit_logs_action_check ON public.audit_logs IS
  'Shape only. An allow-list here silently rejected every application audit write until 2026-08-29 (A-046); do not reintroduce one.';
