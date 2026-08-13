-- Private registry for invited human-testing cohorts.
-- This is operational metadata only: public sample inventory remains identified
-- by Airtable Is_Sample, while product writes are traced by the participant's
-- existing user_id. Raw temporary email addresses are deliberately not stored.

create table public.pilot_cohorts (
  id uuid primary key default gen_random_uuid(),
  cohort_key text not null unique,
  name text not null,
  status text not null default 'planned',
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint pilot_cohorts_key_check
    check (cohort_key ~ '^[a-z0-9][a-z0-9_-]{2,47}$'),
  constraint pilot_cohorts_name_check
    check (char_length(btrim(name)) between 3 and 80),
  constraint pilot_cohorts_status_check
    check (status in ('planned', 'active', 'closed', 'archived')),
  constraint pilot_cohorts_window_check
    check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint pilot_cohorts_closed_check
    check ((status in ('closed', 'archived')) = (closed_at is not null))
);

create table public.pilot_participants (
  cohort_id uuid not null references public.pilot_cohorts(id) on delete restrict,
  user_id uuid not null,
  roles text[] not null,
  enrolled_by uuid not null,
  enrolled_at timestamptz not null default now(),
  offboarded_by uuid,
  offboarded_at timestamptz,
  account_deleted_at timestamptz,
  cleanup_note text,
  primary key (cohort_id, user_id),
  constraint pilot_participants_roles_check
    check (cardinality(roles) between 1 and 4
      and roles <@ array['owner', 'seeker', 'broker', 'provider']::text[]),
  constraint pilot_participants_offboard_check
    check ((offboarded_at is null) = (offboarded_by is null)),
  constraint pilot_participants_delete_check
    check (account_deleted_at is null or offboarded_at is not null),
  constraint pilot_participants_cleanup_note_check
    check (cleanup_note is null or char_length(cleanup_note) <= 500)
);

create unique index pilot_participants_one_active_cohort_idx
  on public.pilot_participants(user_id)
  where offboarded_at is null;

create index pilot_participants_user_history_idx
  on public.pilot_participants(user_id, enrolled_at desc);

alter table public.pilot_cohorts enable row level security;
alter table public.pilot_participants enable row level security;

revoke all on table public.pilot_cohorts from anon, authenticated;
revoke all on table public.pilot_participants from anon, authenticated;

comment on table public.pilot_cohorts is
  'Service-role-only registry for time-bounded invited human-testing cohorts.';
comment on table public.pilot_participants is
  'Service-role-only cohort membership. Rows survive account deletion as cleanup evidence; never store raw temporary email addresses.';
comment on column public.pilot_participants.user_id is
  'Existing authenticated tester ID used to trace related private writes without adding pilot flags to product tables.';
