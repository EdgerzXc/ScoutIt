-- A-023 ROLLBACK PROPOSAL — reverses every migration applied for the broker dossier.
--
-- Lives in supabase/rollback-proposals/ because supabase/migrations/ must contain
-- forward versions only; a rollback sitting in the migrations directory is one
-- `supabase db push` away from dropping production tables. An existing repo test
-- enforces that boundary and caught this file in the wrong place.
--
-- NOT a migration. This file is deliberately named so it cannot be picked up
-- by `supabase db push` (no timestamp prefix). It is run by hand, by the
-- owner, and only on purpose.
--
-- Reverses, in dependency order:
--   20260827000002_seed_example_broker_metrics
--   20260827000001_broker_metric_snapshots
--   20260826000002_broker_recommendations_contributions
--   20260826000001_broker_dossier_drafts
--
-- ⚠️ DATA LOSS. These tables hold broker-authored drafts, client
-- recommendations and their consent records, and the append-only audit trails
-- for both. Dropping them destroys consent evidence, which is the one thing
-- that cannot be reconstructed. Export before running:
--
--   \copy (SELECT * FROM public.broker_recommendations)            TO 'rec.csv'  CSV HEADER
--   \copy (SELECT * FROM public.broker_social_proof_audit_events)  TO 'spa.csv'  CSV HEADER
--   \copy (SELECT * FROM public.broker_dossier_drafts)             TO 'draft.csv' CSV HEADER
--   \copy (SELECT * FROM public.broker_dossier_audit_events)       TO 'audit.csv' CSV HEADER
--
-- The application degrades honestly without these tables: every reader is
-- fail-closed, so each dossier section renders its read-failure state
-- ("could not be loaded just now… not a statement that none exist") rather
-- than claiming the broker has no representations, recommendations or record.
-- Verified in production before the tables existed.

BEGIN;

-- ── Step 1: partial rollback of the demo seed only ──────────────────────
-- Run this alone to remove example scaffolding while KEEPING the schema and
-- any real computed snapshots. This is the reversible half and is usually all
-- that is wanted.
DELETE FROM public.broker_metric_snapshots WHERE source = 'example_seed';

-- ── Step 2: functions ───────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.recompute_broker_metric_snapshot(TEXT);
DROP FUNCTION IF EXISTS public.mark_broker_dossier_published(TEXT, TEXT, BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.save_broker_dossier_draft(TEXT, TEXT, BIGINT, JSONB);

-- ── Step 3: tables, children before parents ─────────────────────────────
-- broker_social_proof_audit_events references both recommendations and
-- contributions with ON DELETE RESTRICT, so it must go first.
DROP TABLE IF EXISTS public.broker_social_proof_audit_events;
DROP TABLE IF EXISTS public.broker_recommendations;
DROP TABLE IF EXISTS public.broker_contributions;
DROP TABLE IF EXISTS public.broker_metric_snapshots;
DROP TABLE IF EXISTS public.broker_dossier_audit_events;
DROP TABLE IF EXISTS public.broker_dossier_drafts;

-- Nothing outside A-023 is touched: no existing table is altered, and
-- user_profiles / deals / deal_handshakes / deal_messages / deal_disputes are
-- only ever READ by the dropped objects.

COMMIT;

-- POST-ROLLBACK VERIFICATION QUERIES (expect 0 rows):
--   SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname='public' AND c.relname LIKE 'broker_dossier%'
--      OR c.relname IN ('broker_recommendations','broker_contributions',
--                       'broker_metric_snapshots','broker_social_proof_audit_events');
