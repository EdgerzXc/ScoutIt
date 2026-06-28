-- ==============================================================================
-- 1. ADD ATTACHMENTS COLUMN TO DEAL_MESSAGES
-- ==============================================================================

ALTER TABLE public.deal_messages
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- ==============================================================================
-- 2. CREATE CHAT_ATTACHMENTS STORAGE BUCKET
-- ==============================================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_attachments',
  'chat_attachments',
  false, -- Not public, requires signed URLs or RLS
  52428800, -- 50MB limit at the bucket level
  ARRAY['image/jpeg', 'image/png', 'application/pdf', 'video/mp4']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf', 'video/mp4']::text[];

-- ==============================================================================
-- 3. RLS POLICIES FOR STORAGE BUCKET
-- ==============================================================================

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Parties can read attachments for their deals" ON storage.objects;
DROP POLICY IF EXISTS "Parties can insert attachments for their deals" ON storage.objects;

-- Policy to SELECT (Read) files
CREATE POLICY "Parties can read attachments for their deals" 
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat_attachments' AND 
  EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id::text = (string_to_array(name, '/'))[1]
    AND (d.buyer_id = auth.uid() OR d.broker_id = auth.uid() OR d.property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()))
  )
);

-- Policy to INSERT (Upload) files
CREATE POLICY "Parties can insert attachments for their deals" 
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_attachments' AND 
  EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id::text = (string_to_array(name, '/'))[1]
    AND (d.buyer_id = auth.uid() OR d.broker_id = auth.uid() OR d.property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()))
  )
);
