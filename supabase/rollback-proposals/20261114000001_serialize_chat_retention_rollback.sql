BEGIN;

DROP TRIGGER IF EXISTS lock_deal_for_chat_hold ON public.deal_disputes;
DROP FUNCTION IF EXISTS public.lock_deal_for_chat_hold();
DROP FUNCTION IF EXISTS public.purge_retained_chat_batch(text[],text[],timestamptz,timestamptz,text);
DROP FUNCTION IF EXISTS public.file_deal_dispute_hold(uuid,text,text,text,text,text[],text);
DROP INDEX IF EXISTS public.deal_chat_retention_candidates_idx;

COMMIT;
