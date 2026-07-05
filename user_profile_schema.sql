-- ═══════════════════════════════════════════════════════════
-- SCOUTIT — USER PROFILE SYSTEM SCHEMA
-- Run this in the Supabase SQL Editor (project: zytsuaimziyxnzrwrqs)
-- ═══════════════════════════════════════════════════════════
--
-- NOTE: auth.users FK is intentionally omitted.
-- The current auth system is localStorage-based. User IDs are
-- string keys like 'usr-1234567890'. FK enforcement moves to
-- the application layer until Supabase Auth is wired in.
--
-- Role names match the existing codebase: buyer, owner, broker, provider
-- (spec names: seeker → buyer, photographer/researcher → provider + provider_type)
-- Hunter role is omitted from this sprint — table reserved for future build.
-- ═══════════════════════════════════════════════════════════

-- 1. USER PROFILES — core identity table
create table if not exists public.user_profiles (
  id text primary key,                           -- localStorage user ID
  display_name text,
  avatar_url text,
  location text,
  headline text,
  bio text,
  firm text,                                     -- broker firm/affiliation
  service text,                                  -- provider services description
  prc_license text,                              -- broker PRC license number
  provider_type text,                            -- photographer / researcher / designer
  provider_availability boolean default true,
  member_since timestamp with time zone default now(),
  subscription_tier text default 'starry',       -- starry / solar / cluster / universe
  connects_balance integer default 0,
  active_roles text[],                           -- buyer, owner, broker, provider, exploring
  is_profile_public boolean default false,
  badges jsonb default '[]'::jsonb,              -- badge objects: [{ id, minted_at }]
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. PRIVACY SETTINGS
create table if not exists public.privacy_settings (
  user_id text primary key references public.user_profiles(id) on delete cascade,
  anonymous_browsing boolean default false,      -- seeker: property views not logged
  anonymous_byline boolean default false,        -- researcher: articles show as "Verified Researcher"
  public_roles text[],                           -- which roles appear on public profile
  connects_balance_visible boolean default false -- ALWAYS false — never shown publicly
);

-- 3. BROKER PROFILES — public-facing metrics
create table if not exists public.broker_profiles (
  user_id text primary key references public.user_profiles(id) on delete cascade,
  scout_rating numeric(3,2) default 0,
  active_retentions_score numeric(5,2) default 0,
  continuity_score numeric(5,2) default 0,
  stewardship_velocity numeric(5,2) default 0,
  verified_closures integer default 0,
  active_listings_count integer default 0,
  profile_views_this_month integer default 0,
  specializations text[]
);

-- 4. RESEARCHER PROFILES — for provider_type = 'researcher'
create table if not exists public.researcher_profiles (
  user_id text primary key references public.user_profiles(id) on delete cascade,
  intel_submissions integer default 0,
  accepted_submissions integer default 0,
  credibility_score numeric(5,2) default 0,
  connects_earned_from_research integer default 0
);

-- ── HUNTER PROFILES — RESERVED FOR FUTURE BUILD ──────────────
-- create table if not exists public.hunter_profiles (
--   user_id text primary key references public.user_profiles(id) on delete cascade,
--   hunter_rank text,           -- Bronze / Silver / Gold / Platinum
--   hunter_class text,          -- Field Scout / Lens Operator / Data Analyst
--   guild_affiliations text[],
--   bounties_completed integer default 0,
--   connects_earned integer default 0,
--   is_anonymous_on_board boolean default false,
--   guild_identity_verified boolean default false
-- );
-- ─────────────────────────────────────────────────────────────

-- Enable Row Level Security
alter table public.user_profiles enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.broker_profiles enable row level security;
alter table public.researcher_profiles enable row level security;

-- RLS Policies
-- Pragmatic open policies matching existing table pattern.
-- Application layer enforces privacy (public view never queries connects_balance,
-- privacy_settings, seeker data, or owner data).

create policy "Allow public read on user_profiles"
  on public.user_profiles for select using (true);
create policy "Allow insert on user_profiles"
  on public.user_profiles for insert with check (true);
create policy "Allow update on user_profiles"
  on public.user_profiles for update using (true);

create policy "Allow read on privacy_settings"
  on public.privacy_settings for select using (true);
create policy "Allow insert on privacy_settings"
  on public.privacy_settings for insert with check (true);
create policy "Allow update on privacy_settings"
  on public.privacy_settings for update using (true);

create policy "Allow public read on broker_profiles"
  on public.broker_profiles for select using (true);
create policy "Allow insert on broker_profiles"
  on public.broker_profiles for insert with check (true);
create policy "Allow update on broker_profiles"
  on public.broker_profiles for update using (true);

create policy "Allow public read on researcher_profiles"
  on public.researcher_profiles for select using (true);
create policy "Allow insert on researcher_profiles"
  on public.researcher_profiles for insert with check (true);
create policy "Allow update on researcher_profiles"
  on public.researcher_profiles for update using (true);
