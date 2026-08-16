-- Contact surface intake — the way a stranger reaches ScoutIt.
--
-- WHY THIS TABLE EXISTS
-- ---------------------
-- Until now the only contact affordance on the site was two
-- `mailto:hello@scoutit.space` links in the footer. `scoutit.space` has no MX
-- records, so mail to that address has nowhere to land: every visitor who used
-- the site's own Contact link reached nobody, and got no indication of it.
--
-- This backs /api/contact, which is the logged-out path. Authenticated users
-- with a property in mind still go through /api/inquiries or /api/deals/initiate;
-- this is for the person who has not signed up and has a question.
--
-- SECURITY POSTURE
-- ----------------
-- RLS enabled with NO policies, deliberately — deny-all, service-role only,
-- matching every other intake table in this schema (verification_requests,
-- file_scans, deal_disputes). The rows contain a stranger's name, email and
-- free text; a permissive read policy here would be a disclosure bug, and
-- Standing Rule 5 applies: a gate the client evaluates is a suggestion.
--
-- Reads happen through Mission Control on the service role. Nothing in the
-- public app selects from this table.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Supplied by the sender. Name and email are required to reply at all;
  -- everything else is optional so the form stays short.
  name text not null,
  email text not null,
  subject text,
  message text not null,

  -- Set server-side only. Never accepted from the request body: a client-set
  -- status would let a spammer file their own message as already handled.
  status text not null default 'new',

  -- Operational context, all server-derived.
  -- ip_hash is the salted hash from the existing masked-IP helper, never a raw
  -- IP — the same rule security_access_logs follows.
  ip_hash text,
  user_agent text,

  -- Set when a signed-in user happens to use the form, so staff can see they
  -- already have an account. Null is the normal case and is NOT an assertion
  -- of anything (Standing Rule 14).
  user_id uuid references auth.users(id) on delete set null,

  handled_at timestamptz,
  handled_by uuid references auth.users(id) on delete set null,
  staff_notes text,

  constraint contact_messages_status_check
    check (status in ('new', 'in_progress', 'resolved', 'spam'))
);

comment on table public.contact_messages is
  'RLS deny-all BY DESIGN. Service-role only via /api/contact (write) and Mission Control (read). Contains stranger PII: name, email, free text.';

-- Staff triage reads newest-first, filtered by status. Partial index because
-- resolved rows are the majority over time and are never the working set.
create index if not exists contact_messages_triage_idx
  on public.contact_messages (created_at desc)
  where status in ('new', 'in_progress');

alter table public.contact_messages enable row level security;

-- No policies. This is the deny-all posture described above, not an omission.
-- If a future feature needs a client read, it must come with a written reason
-- and a column allowlist — never `using (true)`.

revoke all on public.contact_messages from anon, authenticated;
