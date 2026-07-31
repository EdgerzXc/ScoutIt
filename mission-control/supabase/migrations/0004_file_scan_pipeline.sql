-- B1/B5 — File-scan ("double security") pipeline + missing buckets.
-- ADDITIVE ONLY. Creates nothing destructive; touches no existing rows.
-- NOTE (Track C coordination): Cowork was also slated to create the quarantine
-- bucket + scan columns. This file is the single canonical version — apply it
-- ONCE (either agent), it is idempotent (IF NOT EXISTS / ON CONFLICT guards).

-- ── 1. Buckets ──────────────────────────────────────────────────────────────
-- quarantine: where ALL user uploads land first (private; service-role only).
-- property-videos-temp / chat_attachments: referenced by live code today but
-- missing (uploads error) — created PRIVATE, served via signed URLs only.
insert into storage.buckets (id, name, public)
values
  ('quarantine', 'quarantine', false),
  ('property-videos-temp', 'property-videos-temp', false),
  ('chat_attachments', 'chat_attachments', false)
on conflict (id) do nothing;
-- No storage.objects policies are added for these buckets on purpose:
-- with RLS enabled and no policy, anon/authenticated get NO access, and the
-- service-role (server) bypasses RLS. That is exactly the isolation we want.

-- ── 2. video_upload_queue ───────────────────────────────────────────────────
-- The main app's /api/storage/upload inserts here already (currently a silent
-- warn because the table never existed). Service-role access only.
create table if not exists public.video_upload_queue (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  property_id text,
  storage_path text not null,
  original_filename text,
  file_size_bytes bigint,
  status text not null default 'pending_luma',
  created_at timestamptz not null default now()
);
alter table public.video_upload_queue enable row level security;

-- ── 3. file_scans — one row per uploaded file moving through the pipeline ──
create table if not exists public.file_scans (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  storage_path text not null,
  uploader_id text,
  property_id text,
  original_filename text,
  declared_mime text,
  detected_mime text,
  size_bytes bigint,
  sha256 text,
  scan_status text not null default 'pending_scan',
    -- pending_scan → scanning → scanned
  scan_verdict text,
    -- clean | suspicious | infected  (only 'clean' is ever staff-visible/downloadable)
  scan_engine text,
    -- e.g. 'magic-bytes+heuristics', 'virustotal', 'magic-bytes+virustotal'
  scan_notes text,
  scanned_at timestamptz,
  download_count int not null default 0,
  last_downloaded_at timestamptz,
  last_downloaded_by text,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);
alter table public.file_scans enable row level security;
-- No policies: service-role only (staff console + scan worker).

create index if not exists idx_file_scans_status on public.file_scans (scan_status);
create index if not exists idx_file_scans_verdict on public.file_scans (scan_verdict);
