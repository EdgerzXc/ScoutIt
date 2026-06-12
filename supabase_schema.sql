-- Enable PostGIS for Spatial Intelligence (Radius Search)
create extension if not exists postgis;

-- 1. PROPERTIES (The Dossier Table)
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid, -- Would link to auth.users in production
  title text not null default 'New Property File',
  type text not null, -- 'House', 'Lot', 'Condo', 'Commercial', 'Other'
  location text not null,
  price numeric,
  description text,
  media_link text,
  verified boolean default false,
  completeness_score integer default 0,
  
  -- Spatial Column for the "Invisible Circle" Radius Search
  coordinates geography(Point, 4326) 
);

-- 2. DEALS (Broker Opportunity Workspaces)
create table public.deals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  broker_id uuid,
  property_id uuid references public.properties(id) on delete cascade,
  status text not null default 'pitching', -- 'pitching', 'active', 'closed', 'declined'
  private_notes text, -- Broker's CRM scratchpad
  pitch_message text
);

-- 3. PROJECTS (Service Provider Dossiers)
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  provider_id uuid,
  title text not null,
  client_name text,
  scope text,
  deliverables text[],
  status text default 'active', -- 'active', 'completed', 'showcase'
  cover_image text,
  media_link text
);

-- 4. SAVED INTEL (Buyer/Scout Intelligence Archives)
create table public.saved_intel (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid,
  property_id uuid references public.properties(id) on delete cascade
);

-- Set Row Level Security (RLS) to open for development
-- WARNING: In production, you must restrict these!
alter table public.properties enable row level security;
alter table public.deals enable row level security;
alter table public.projects enable row level security;
alter table public.saved_intel enable row level security;

create policy "Allow public read access on properties" on public.properties for select using (true);
create policy "Allow public insert on properties" on public.properties for insert with check (true);
create policy "Allow public update on properties" on public.properties for update using (true);
create policy "Allow public delete on properties" on public.properties for delete using (true);

create policy "Allow public read access on deals" on public.deals for select using (true);
create policy "Allow public insert on deals" on public.deals for insert with check (true);
create policy "Allow public update on deals" on public.deals for update using (true);

create policy "Allow public read access on projects" on public.projects for select using (true);
create policy "Allow public insert on projects" on public.projects for insert with check (true);
create policy "Allow public update on projects" on public.projects for update using (true);

create policy "Allow public read access on saved_intel" on public.saved_intel for select using (true);
create policy "Allow public insert on saved_intel" on public.saved_intel for insert with check (true);
create policy "Allow public delete on saved_intel" on public.saved_intel for delete using (true);
