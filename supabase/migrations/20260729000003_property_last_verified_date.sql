-- Property Freshness Engine (NEW_IDEAS.md §21). Applied live 2026-07-29.
--
-- Airtable's Last_Verified_Date remains the source of truth for PUBLIC
-- listings (AGENTS.md §2) — it's what /api/cron/check-stale-listings already
-- reads. This column mirrors it on the Supabase side so the dashboard can
-- compute freshness without a round trip to Airtable on every render, and so
-- unpublished drafts have a verification date at all.
--
-- Defaults to NULL, NOT now(). A listing that has never been verified must
-- read as "unverified", never as "fresh" — defaulting to now() would silently
-- mark the entire existing portfolio fresh and defeat the whole feature.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS last_verified_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_properties_last_verified
  ON public.properties (last_verified_date NULLS FIRST);

COMMENT ON COLUMN public.properties.last_verified_date IS
  'Owner re-confirmed this listing accurate at this time. NULL = never verified (renders as "unverified", never "fresh"). Airtable Last_Verified_Date is the source of truth for published listings; this mirrors it. Written by /api/dashboard/verify-freshness.';
