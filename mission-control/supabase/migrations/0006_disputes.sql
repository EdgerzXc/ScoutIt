-- Disputes Hub — mediation workflow for broker-vs-broker slot conflicts and
-- broker-vs-owner authority claims. ADDITIVE ONLY, idempotent, service-role
-- only (RLS on, no policies) like every other Mission Control table.

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),

  kind text not null default 'other',
    -- broker_vs_broker | broker_vs_owner | listing_conflict | other
  title text not null,
  description text,

  property_ref text,             -- property slug/id the dispute is about
  complainant text,              -- who raised it (user_id / name)
  respondent text,               -- the other party

  priority text not null default 'normal',
    -- low | normal | high | critical
  status text not null default 'open',
    -- open | investigating | resolved | dismissed

  assignee_id uuid,              -- admin_users.id mediating
  resolution text,               -- summary written on resolve/dismiss
  resolved_at timestamptz,

  opened_by text,                -- staff email / user_id that logged it
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.disputes enable row level security;

create index if not exists idx_disputes_status on public.disputes (status, priority, created_at);
create index if not exists idx_disputes_kind on public.disputes (kind);

-- Mediation thread — an append-only trail of notes / status changes /
-- assignments / the final resolution, per dispute.
create table if not exists public.dispute_events (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes (id) on delete cascade,
  author_id uuid,               -- admin_users.id
  author_email text,
  event_type text not null default 'note',
    -- note | status_change | assignment | resolution
  body text,
  created_at timestamptz not null default now()
);

alter table public.dispute_events enable row level security;

create index if not exists idx_dispute_events_dispute
  on public.dispute_events (dispute_id, created_at);
