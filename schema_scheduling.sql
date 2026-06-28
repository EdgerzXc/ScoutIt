-- ScoutIt Scheduling System Schema

-- 1. User Availability Table (Stores JSON rules for broker schedules)
create table user_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  timezone text default 'Asia/Manila',
  weekly_schedule jsonb not null default '{
    "monday": { "active": true, "start": "09:00", "end": "17:00" },
    "tuesday": { "active": true, "start": "09:00", "end": "17:00" },
    "wednesday": { "active": true, "start": "09:00", "end": "17:00" },
    "thursday": { "active": true, "start": "09:00", "end": "17:00" },
    "friday": { "active": true, "start": "09:00", "end": "17:00" },
    "saturday": { "active": false, "start": "09:00", "end": "17:00" },
    "sunday": { "active": false, "start": "09:00", "end": "17:00" }
  }',
  date_overrides jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Ensure 1 availability config per user
create unique index on user_availability (user_id);

alter table user_availability enable row level security;
-- Only the user can update their availability, but anyone can read it to book a time
create policy "Public can read availability" on user_availability for select using (true);
create policy "Users can update own availability" on user_availability for all using (auth.uid() = user_id);

-- 2. Viewing Appointments Table
create type viewing_status as enum ('pending', 'confirmed', 'cancelled', 'completed');

create table viewing_appointments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  host_id uuid references auth.users(id) on delete cascade not null, -- The broker/owner
  guest_id uuid references auth.users(id) on delete cascade not null, -- The buyer
  property_id text not null, -- Store as text since it maps to Airtable or Supabase properties
  scheduled_at timestamptz not null,
  status viewing_status default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table viewing_appointments enable row level security;
-- Only host and guest can see the appointment
create policy "Parties can read their appointments" on viewing_appointments for select
  using (auth.uid() = host_id or auth.uid() = guest_id);

-- Only guest can insert (request a viewing)
create policy "Guests can insert appointments" on viewing_appointments for insert
  with check (auth.uid() = guest_id);

-- Host can update status (confirm/cancel). Guest can only cancel.
create policy "Parties can update appointments" on viewing_appointments for update
  using (auth.uid() = host_id or auth.uid() = guest_id);
