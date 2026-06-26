-- video_upload_queue
-- Tracks raw video uploads from owners waiting for Luma AI processing by admin.
-- After admin processes and gets the Luma embed URL, they update media_link on the property
-- and delete the temp video from Supabase Storage.

create table if not exists video_upload_queue (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            text not null,
  property_id         uuid references properties(id) on delete set null,
  storage_path        text not null,
  original_filename   text not null,
  file_size_bytes     bigint,
  status              text not null default 'pending_luma',
  -- status values: pending_luma | processing | done | failed
  luma_embed_url      text,
  admin_notes         text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table video_upload_queue enable row level security;

-- Owners can see their own queue items
create policy "owner_read_own" on video_upload_queue
  for select using (owner_id = auth.uid()::text);

-- Only service role (admin/Edge Functions) can insert and update
-- Client uploads go through /api/storage/upload which uses service role

-- Index for admin Mission Control queue view
create index on video_upload_queue (status, created_at desc);
