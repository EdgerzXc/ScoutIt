-- A-156: pipeline supply input chain (PREPARED, NOT APPLIED).
--
-- Adds two nullable columns to intel_briefings so the OSINT publish flow
-- can carry supply lifecycle without touching ordinary intel: NULL/blank
-- means "not pipeline" everywhere downstream.
--
-- DO NOT APPLY without the owner go that O-004 requires for migrations.
-- Until applied, publishOsintBriefing detects the missing columns and
-- falls back to an ordinary draft with a staff-visible notice — publishing
-- never breaks, pipeline fields simply do not persist.
--
-- Rollback: ALTER TABLE public.intel_briefings
--   DROP COLUMN IF EXISTS lifecycle, DROP COLUMN IF EXISTS opening_date;
ALTER TABLE public.intel_briefings
  ADD COLUMN IF NOT EXISTS lifecycle TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS opening_date TEXT NOT NULL DEFAULT '';
