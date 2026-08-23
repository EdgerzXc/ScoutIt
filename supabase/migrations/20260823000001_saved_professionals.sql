-- F-010: private, revocable interest in a public professional profile.
-- Public counts are intentionally not exposed. Runtime access goes through
-- /api/professionals/saved, which derives user_id from a verified session.
create table if not exists public.saved_professionals (
  user_id uuid not null references auth.users(id) on delete cascade,
  professional_key text not null check (char_length(professional_key) between 1 and 240),
  category text not null check (category in ('broker', 'photographer', 'researcher', 'event_planner')),
  source text not null check (source in ('airtable', 'supabase')),
  created_at timestamptz not null default now(),
  primary key (user_id, professional_key)
);

alter table public.saved_professionals enable row level security;
revoke all on table public.saved_professionals from anon, authenticated;

create index if not exists saved_professionals_user_created_idx
  on public.saved_professionals (user_id, created_at desc);
