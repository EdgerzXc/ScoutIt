-- ═══════════════════════════════════════════════════════════
-- MISSION CONTROL — Feature Gates + Global Banners
-- Additive. Same Supabase project as 0001_mission_control_rbac.sql.
--
-- Unlike admin_users / mission_control_actions, these two tables ARE
-- meant to be read by the public ScoutIt site (that's the whole point
-- of a feature gate) — so they get a public SELECT policy. Writes still
-- only ever happen through Mission Control's service-role client.
-- ═══════════════════════════════════════════════════════════

create table if not exists feature_gates (
  key text primary key,
  label text not null,
  description text,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id)
);

comment on table feature_gates is
  'Site-wide feature toggles. Public site reads `enabled` by `key`; only Mission Control writes.';

create table if not exists site_banners (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references admin_users(id)
);

comment on table site_banners is
  'Global site banners. Public site reads the row(s) where is_active = true.';

create index if not exists idx_site_banners_active on site_banners(is_active) where is_active;

alter table feature_gates enable row level security;
alter table site_banners enable row level security;

drop policy if exists "public read" on feature_gates;
create policy "public read" on feature_gates for select using (true);
drop policy if exists "service role only writes" on feature_gates;
create policy "service role only writes" on feature_gates for all using (false) with check (false);

drop policy if exists "public read" on site_banners;
create policy "public read" on site_banners for select using (true);
drop policy if exists "service role only writes" on site_banners;
create policy "service role only writes" on site_banners for all using (false) with check (false);

-- Seed a reasonable starting set — safe to re-run, won't overwrite an
-- existing gate's current enabled state.
insert into feature_gates (key, label, description, enabled) values
  ('map_view', 'Map View', 'Interactive map search on the public site.', true),
  ('ai_search', 'AI Search', 'Natural-language property search.', false),
  ('matterport_uploads', 'Matterport Uploads', 'Owners can attach 3D tour URLs.', true),
  ('bounties', 'Bounties', 'QuestIT bounty task board.', false),
  ('broker_handshake', 'Broker Handshake', 'Property-broker pitch/handshake flow.', true)
on conflict (key) do nothing;
