-- A-063 — a log of what the system does on its own.
--
-- `mission_control_actions` is an accountability trail: every row is a named
-- staff member who pressed a button, and `revertAction` can undo one. That is a
-- different kind of record from "the nightly cron ran", "the CMS bundle was
-- rebuilt from Redis rather than Airtable", or "an Airtable sync failed", and
-- mixing the two makes both harder to read: the human log stops being a list of
-- decisions somebody is answerable for, and the machine events are buried among
-- them.
--
-- So this is a SEPARATE table, deliberately. It has no actor and no revert. It
-- is what you read when a pin moves on its own or a listing quietly stops
-- refreshing — the question A-060's fix would otherwise be invisible to.
--
-- Written by BOTH apps: Mission Control and the main site, each with the
-- service-role key. Service-role only, like every other table here.

create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),

  -- Dotted and hierarchical so a family can be filtered with a prefix:
  -- 'airtable.sync.failed', 'cms.bundle.rebuilt', 'cron.purge_chat.completed',
  -- 'cache.catalogue.purged', 'geocode.resolved'.
  event text not null,

  -- Which deployment emitted it. Without this, a failure in the main site's
  -- cron and one in the console's publish loop look identical in the list.
  source text not null,

  severity text not null default 'info',

  -- What the event was about, when there is a subject. Free text rather than a
  -- foreign key: events outlive the rows they describe, and an event that
  -- vanished when its property was deleted would be missing exactly when
  -- somebody is asking what happened to that property.
  subject_table text,
  subject_id text,

  -- Human-readable one-liner. Present so the log is legible without a reader
  -- having to interpret `detail` for every row.
  summary text,

  detail jsonb not null default '{}'::jsonb,

  -- Kept distinct from created_at: a cron reporting a run that finished at
  -- 02:00 may not write until its request ends, and a batch importer may
  -- backfill events for work done earlier.
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'system_events_severity_check'
  ) then
    alter table public.system_events
      add constraint system_events_severity_check
      check (severity in ('info', 'warning', 'error'));
  end if;
end $$;

-- The default view is "newest first".
create index if not exists idx_system_events_occurred
  on public.system_events (occurred_at desc);

-- "Show me only what went wrong" must stay fast as the info rows accumulate,
-- so the partial index carries the two severities anyone pages through.
create index if not exists idx_system_events_problems
  on public.system_events (occurred_at desc)
  where severity in ('warning', 'error');

create index if not exists idx_system_events_event
  on public.system_events (event, occurred_at desc);

create index if not exists idx_system_events_subject
  on public.system_events (subject_table, subject_id, occurred_at desc);

-- No policy is created, in either direction. Every read and write happens
-- server-side with the service-role key, which bypasses RLS; enabling it with
-- zero policies means anon and authenticated clients get nothing.
alter table public.system_events enable row level security;

comment on table public.system_events is
  'A-063. What the system did on its own: crons, CMS rebuilds, cache purges, '
  'Airtable syncs, geocoding. Distinct from mission_control_actions, which is '
  'the human accountability log. No actor, no revert. Service-role only. '
  'Unbounded by design for now — retention is a decision, not a default.';
