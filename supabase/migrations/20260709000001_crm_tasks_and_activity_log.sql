-- Professional CRM v1: tasks + activity timeline (2026-07-09).
-- NOTE: this migration was ALREADY APPLIED to the live database on 2026-07-09
-- (via the Supabase MCP migration `crm_tasks_and_activity_log`) — this file
-- back-fills the repo's migration history so it matches what is actually
-- deployed. It is a faithful capture of the live schema (columns, defaults,
-- FKs, indexes, RLS policies), introspected directly, not reconstructed
-- from memory. Everything is IF NOT EXISTS / idempotent-safe.
--
-- Design note: the originally-specced deal_notes table was deliberately NOT
-- created — per-deal notes already persist in deals.private_notes via
-- PATCH /api/deals/[id]/notes (built 2026-07-04); a second notes store would
-- fork that system.

-- 1. crm_tasks — the CRM "don't forget" engine. Per-user-private.
--    owner_user_id is TEXT (not a uuid FK) to match the deals table's
--    buyer_id/broker_id convention, which also allows dev-mock ids.
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_tasks_owner_idx
  ON public.crm_tasks (owner_user_id, completed_at, due_at);

-- 2. crm_activity_log — the CRM Timeline. One row per lifecycle event
--    (inquiry, deal_created, status_change, note_added, viewing_scheduled/
--    confirmed/cancelled/completed, delegation_accepted/declined,
--    operator_request). Written only by service-role API routes via
--    src/lib/crmActivity.js.
CREATE TABLE IF NOT EXISTS public.crm_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  actor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_activity_deal_idx
  ON public.crm_activity_log (deal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_activity_property_idx
  ON public.crm_activity_log (property_id, created_at DESC);

-- 3. RLS. Tasks are per-user-private; timeline rows are readable by deal
--    parties and property owners only. Both use the sub-select
--    (select auth.uid()) pattern, never a bare per-row auth.uid() call.
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY crm_tasks_owner_all ON public.crm_tasks
    FOR ALL
    USING (owner_user_id = (SELECT auth.uid())::text)
    WITH CHECK (owner_user_id = (SELECT auth.uid())::text);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY crm_activity_read_party ON public.crm_activity_log
    FOR SELECT
    USING (
      actor_id = (SELECT auth.uid())::text
      OR EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.id = crm_activity_log.deal_id
          AND (
            d.buyer_id = (SELECT auth.uid())::text
            OR d.broker_id = (SELECT auth.uid())::text
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = crm_activity_log.property_id
          AND p.owner_id = (SELECT auth.uid())::text
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
