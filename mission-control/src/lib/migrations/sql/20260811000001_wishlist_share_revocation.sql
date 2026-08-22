-- C17: owner-controlled revocation watermark for public Board share links.
-- The service role is the only application actor that reads or writes this
-- table. A watermark invalidates every token issued at or before its time;
-- generating a newer token does not revive older links.

create table if not exists public.wishlist_share_revocations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revoked_before timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.wishlist_share_revocations enable row level security;

revoke all on table public.wishlist_share_revocations from anon, authenticated;

comment on table public.wishlist_share_revocations is
  'Service-role-only high-watermark used to revoke public wishlist share tokens without storing bearer credentials.';
