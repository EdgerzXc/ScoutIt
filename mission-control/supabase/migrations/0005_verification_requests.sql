-- Trust & Verification Center — the queue that turns "claimed" into "verified".
-- ADDITIVE ONLY. Creates one table + indexes; touches no existing rows.
-- Idempotent (IF NOT EXISTS guards). Service-role only (RLS on, no policies),
-- matching every other Mission Control table — the staff console and any
-- server worker reach it through the service-role client; anon/authenticated
-- get no access.

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),

  -- what is being verified
  kind text not null default 'prc_license',
    -- prc_license | price_verification | identity | business
  subject_type text not null default 'broker',
    -- broker | owner | property
  subject_id text,               -- user_id (usr-…) or property id/slug
  subject_name text,             -- denormalized label for the queue UI

  -- the claim + its evidence
  details jsonb not null default '{}'::jsonb,
    -- e.g. { "prc_license_no": "…", "prc_expiry": "…", "claimed_price": 0 }
  evidence_path text,            -- private storage path (served via signed URL only)

  -- workflow
  status text not null default 'pending',
    -- pending | approved | rejected
  priority text not null default 'normal',
    -- low | normal | high
  reviewer_id uuid,              -- admin_users.id that decided
  review_notes text,
  decided_at timestamptz,

  submitted_by text,             -- who filed it (user_id or staff email)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.verification_requests enable row level security;
-- No policies on purpose: service-role only (staff console).

create index if not exists idx_verification_status
  on public.verification_requests (status, created_at);
create index if not exists idx_verification_kind
  on public.verification_requests (kind);
create index if not exists idx_verification_subject
  on public.verification_requests (subject_type, subject_id);
