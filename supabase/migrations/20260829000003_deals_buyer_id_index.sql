-- deals.buyer_id had no index.
--
-- /api/deals resolves party membership with four queries, one of which is
-- `.eq("buyer_id", userId)`. broker_id and property_id are both indexed;
-- buyer_id was not, so that query plans as a sequential scan. Verified against
-- the live database on 2026-08-29:
--
--   Seq Scan on deals  (cost=0.00..1.11 rows=1 ...)
--     Filter: (buyer_id = '...'::text)
--
-- It costs nothing today because the table is empty, and it runs on every
-- dashboard, Inbox and CRM load for every signed-in user. This is the one
-- query in that route that does not scale.
--
-- Note the column is text, not uuid, matching broker_id — the id columns on
-- deals are plain text with no FK to a users table.

CREATE INDEX IF NOT EXISTS idx_deals_buyer_id ON public.deals USING btree (buyer_id);
