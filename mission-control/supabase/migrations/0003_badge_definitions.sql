-- ═══════════════════════════════════════════════════════════
-- MISSION CONTROL — Dynamic badge catalog
--
-- Context: ScoutIt currently has TWO hardcoded badge registries in the
-- main app's source code:
--   - src/lib/badges.js          BADGE_REGISTRY (5 achievement badges)
--   - src/lib/BadgeEngine.js     BADGE_DEFINITIONS (5 slot-limited cohorts)
-- Actual grants live in a real table, `user_badges` (user_id uuid,
-- badge_id text, granted_by text, earned_at) — that table already
-- exists in production (used by /api/badges/claim) and this migration
-- does NOT touch it.
--
-- This migration adds `badge_definitions` so NEW badge types can be
-- created from Mission Control without a code deploy, and seeds it
-- with the 10 badges that already exist in code so nothing currently
-- live is orphaned.
--
-- IMPORTANT — this table is not wired up to the public site yet.
-- src/lib/badges.js and src/lib/BadgeEngine.js still need to be
-- changed to read from this table (or Mission Control needs to write
-- back out to them) for a badge created here to actually show up or
-- function on scoutit.ph. That's a main-app change, out of scope for
-- this migration — see MISSION_CONTROL_SPEC.md.
-- ═══════════════════════════════════════════════════════════

create table if not exists badge_definitions (
  id text primary key,               -- matches existing ids, e.g. 'pioneer', 'PIONEER_BROKER'
  name text not null,
  description text,
  rarity text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary')),
  category text not null default 'achievement' check (category in ('achievement', 'pioneer_cohort', 'custom')),
  max_slots integer,                 -- null = unlimited (achievement-style badges)
  color text,                        -- hex, e.g. '#E8AE3C'
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id)
);

comment on table badge_definitions is
  'Dynamic badge catalog. Seeded from the hardcoded registries in badges.js / BadgeEngine.js. '
  'Public-readable; only Mission Control (service role) writes. NOT yet read by the main app — '
  'see the header comment in this file before assuming a new badge is live on the public site.';

alter table badge_definitions enable row level security;

drop policy if exists "public read" on badge_definitions;
create policy "public read" on badge_definitions for select using (true);
drop policy if exists "service role only writes" on badge_definitions;
create policy "service role only writes" on badge_definitions for all using (false) with check (false);

insert into badge_definitions (id, name, description, rarity, category, max_slots, color) values
  ('pioneer', 'The Pioneer', 'Joined ScoutIt during the Early Access phase.', 'legendary', 'achievement', null, '#E8AE3C'),
  ('master_scout', 'Master Scout', 'Built an extensive library of spatial intelligence.', 'epic', 'achievement', null, null),
  ('guildmaster', 'The Guildmaster', 'Master of logistics and service delegation.', 'rare', 'achievement', null, null),
  ('spatial_analyst', 'Spatial Analyst', 'Contributed critical ground truth data to the ecosystem.', 'rare', 'achievement', null, null),
  ('dealmaker', 'Dealmaker', 'Successfully navigated the market and closed a deal.', 'epic', 'achievement', null, null),
  ('PIONEER_BROKER', 'Pioneer Advisor', 'One of the first 20 brokers to join ScoutIt. Lifetime discount on Cluster Strategist tier.', 'legendary', 'pioneer_cohort', 20, '#60A5FA'),
  ('PIONEER_OWNER', 'Pioneer Landlord', 'One of the first 20 owners/developers on the platform. Accelerated 3D map generation.', 'legendary', 'pioneer_cohort', 20, '#34D399'),
  ('PIONEER_CREATOR', 'Pioneer Creator', 'One of the first 20 visual architects to capture spaces for ScoutIt.', 'legendary', 'pioneer_cohort', 20, '#C084FC'),
  ('FOUNDING_SEEKER', 'Founding Seeker', 'Original beta testers. Free lifetime access to the Spatial Vault.', 'legendary', 'pioneer_cohort', 100, '#E8AE3C'),
  ('ALPHA_CARTOGRAPHER', 'Alpha Cartographer', 'Mapped the first 50 properties into the ScoutIt engine before public launch.', 'legendary', 'pioneer_cohort', 5, '#F87171')
on conflict (id) do nothing;
