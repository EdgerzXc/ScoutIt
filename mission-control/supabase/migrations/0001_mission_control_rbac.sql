-- ═══════════════════════════════════════════════════════════
-- MISSION CONTROL — RBAC core + moderation columns
-- Additive only. Does not rename or drop any existing table/column.
-- Run in the SAME Supabase project as the main ScoutIt app
-- (Mission Control is a separate deployment, not a separate database).
--
-- Apply via: `supabase db push` from this app, or paste into the
-- Supabase SQL Editor. Do NOT run against production without a
-- staging pass first — this touches `user_profiles` and `properties`,
-- both live tables used by the public ScoutIt site.
-- ═══════════════════════════════════════════════════════════

-- ── 1. Staff identity + tier ──────────────────────────────────
-- Keyed to real Supabase Auth (auth.users). This is intentionally a
-- DIFFERENT identity system from `user_profiles`, which is the public
-- site's own localStorage-keyed user system (text ids, no auth.users FK).
-- Staff are not "users" of the app; they authenticate as themselves.
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  tier smallint not null check (tier in (1, 2, 3)),  -- 1 Agent, 2 Ops Manager, 3 Super Admin
  is_finance boolean not null default false,          -- scoped capability, not a 4th tier
  active boolean not null default true,               -- flip false to revoke access instantly
  invited_by uuid references admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table admin_users is
  'Mission Control staff directory + RBAC tier. Not the same identity system as user_profiles.';

-- ── 2. Immutable action log ───────────────────────────────────
-- Every mutating action taken through Mission Control. Written in the
-- same request as the mutation itself. Never updated or deleted.
create table if not exists mission_control_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references admin_users(id),
  actor_tier smallint not null,
  action text not null,
    -- expected values: 'user.edit' | 'user.block' | 'user.unblock' | 'user.archive' | 'user.unarchive'
    -- | 'property.approve' | 'property.reject' | 'property.archive'
    -- | 'feature_gate.toggle' | 'staff.invite' | 'staff.tier_change' | 'staff.deactivate'
  target_table text not null,
  target_id text not null,
  reason text,          -- required (enforced in the server action) for reject/block/archive
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mc_actions_actor on mission_control_actions(actor_id);
create index if not exists idx_mc_actions_target on mission_control_actions(target_table, target_id);
create index if not exists idx_mc_actions_created on mission_control_actions(created_at desc);

comment on table mission_control_actions is
  'Immutable audit trail for every Mission Control staff action. Service-role write only.';

-- ── 3. Lock both tables down completely at the RLS layer ─────
-- No client-side policy grants access at all, in either direction.
-- Every read and write happens server-side with the service-role key,
-- gated by the tier check in lib/rbac.js. RLS here is a hard stop,
-- not a filter to relax later.
alter table admin_users enable row level security;
alter table mission_control_actions enable row level security;

drop policy if exists "no client access" on admin_users;
create policy "no client access" on admin_users for all using (false) with check (false);

drop policy if exists "no client access" on mission_control_actions;
create policy "no client access" on mission_control_actions for all using (false) with check (false);

-- ── 4. Moderation columns — additive, defaulted, non-breaking ─
alter table user_profiles add column if not exists is_shadowbanned boolean not null default false;
alter table user_profiles add column if not exists archived_at timestamptz;
alter table user_profiles add column if not exists moderation_note text;

alter table properties add column if not exists moderation_status text not null default 'pending';
alter table properties add column if not exists rejection_reason text;
alter table properties add column if not exists archived_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'properties_moderation_status_check'
  ) then
    alter table properties
      add constraint properties_moderation_status_check
      check (moderation_status in ('pending', 'approved', 'rejected', 'archived'));
  end if;
end $$;

create index if not exists idx_properties_moderation_status on properties(moderation_status);
create index if not exists idx_user_profiles_shadowbanned on user_profiles(is_shadowbanned) where is_shadowbanned;

-- ═══════════════════════════════════════════════════════════
-- MANUAL STEP AFTER RUNNING THIS FILE:
-- Bootstrap the first Tier 3 Super Admin by hand (every account after
-- this one is created through Staff IAM, invited by an existing Tier 3):
--
--   insert into admin_users (id, email, display_name, tier)
--   values ('<your-supabase-auth-user-uuid>', 'you@scoutit.ph', 'Your Name', 3);
--
-- Find your auth user id in Supabase Dashboard → Authentication → Users,
-- after signing into Mission Control once via the magic link (this
-- creates the auth.users row even before an admin_users row exists —
-- you just won't get past the dashboard layout's tier check until you
-- run the insert above).
-- ═══════════════════════════════════════════════════════════
