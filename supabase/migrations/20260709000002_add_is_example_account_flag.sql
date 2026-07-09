-- Demo/seed data flag (2026-07-09). Seeded example provider accounts
-- (broker/researcher/photographer demo profiles) carry this = true, and every
-- public surface that renders a profile shows a visible "Example Profile"
-- badge off it — seed data is never allowed to pass as real.
-- Applied to the live database on 2026-07-09 via the Supabase MCP migration
-- `add_is_example_account_flag`; this file keeps the repo's migration
-- history in sync.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_example_account BOOLEAN NOT NULL DEFAULT false;
