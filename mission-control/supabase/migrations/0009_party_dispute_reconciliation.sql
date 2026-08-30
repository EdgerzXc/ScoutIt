-- A-061 — Reconcile the two dispute pipelines.
--
-- A party files from the main site into `deal_disputes`, and filing is what
-- places the chat-retention hold the nightly purge reads. Mission Control's
-- Disputes Hub reads `disputes` and had never heard of `deal_disputes`, so a
-- dispute a real user raised was invisible to the only surface built to
-- resolve it.
--
-- The two tables are NOT folded, deliberately. `deal_disputes` is load-bearing
-- for retention: it carries the FK to `deals` and the hold vocabulary
-- (`open_hold` / `under_review`) that `/api/cron/purge-chat-messages` exempts.
-- Moving that behind a table with a different status vocabulary would put the
-- evidence hold one silent string mismatch away from destroying the evidence.
--
-- Instead the console adopts a party filing: it creates a mirror `disputes`
-- row so the mediation thread, assignment and closure workflow apply
-- unchanged, and every status change is written through to `deal_disputes`,
-- which stays the authority for the hold.
--
-- ADDITIVE ONLY, idempotent, service-role only like every other Mission
-- Control table.

alter table public.disputes
  add column if not exists deal_dispute_id uuid;

alter table public.disputes
  add column if not exists source text not null default 'staff';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'disputes_source_check'
  ) then
    alter table public.disputes
      add constraint disputes_source_check check (source in ('staff', 'party'));
  end if;
end $$;

-- One mirror per party filing. Without this, two staff members adopting the
-- same filing at the same time produce two mediation threads for one dispute
-- and two writers for one hold.
create unique index if not exists idx_disputes_deal_dispute_unique
  on public.disputes (deal_dispute_id)
  where deal_dispute_id is not null;
