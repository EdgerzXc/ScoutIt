-- A-196: ScoutIt Spatial Studio 3D Generation Queue & Fast-Track Revision Architecture
-- Additive migration declaring property_spatial_requests table and properties columns.
-- Per AGENTS.md §7 / O-004, staged locally and executed in production on owner authorization.

CREATE TABLE IF NOT EXISTS public.property_spatial_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text NOT NULL,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED', 'QUEUED', 'IN_PRODUCTION', 'REVISION_REQUESTED', 'LIVE')),
  style_preset text NOT NULL
    CHECK (style_preset IN ('minimalist_organic', 'modern_executive', 'tropical_luxury')),
  file_url text,
  notes text,
  is_express boolean DEFAULT false,
  material_config jsonb DEFAULT '{"flooring":"travertine","partitions":"fluted_glass","lighting":"daylight"}'::jsonb,
  target_sla_hours integer DEFAULT 48,
  connects_spent integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spatial_requests_property_id
  ON public.property_spatial_requests (property_id);

CREATE INDEX IF NOT EXISTS idx_spatial_requests_requester_id
  ON public.property_spatial_requests (requester_id);

CREATE INDEX IF NOT EXISTS idx_spatial_requests_status
  ON public.property_spatial_requests (status);

-- Add spatial status columns to properties if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'spatial_generation_status') THEN
      ALTER TABLE public.properties
        ADD COLUMN spatial_generation_status text DEFAULT 'NONE'
        CHECK (spatial_generation_status IN ('NONE', 'REQUESTED', 'QUEUED', 'IN_PRODUCTION', 'REVISION_REQUESTED', 'LIVE'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'spatial_style_preset') THEN
      ALTER TABLE public.properties
        ADD COLUMN spatial_style_preset text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'spatial_material_presets') THEN
      ALTER TABLE public.properties
        ADD COLUMN spatial_material_presets jsonb DEFAULT '{}'::jsonb;
    END IF;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.property_spatial_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spatial_requests_select_owner_or_requester"
  ON public.property_spatial_requests
  FOR SELECT
  TO authenticated
  USING (
    requester_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id::text = property_spatial_requests.property_id
        AND properties.owner_id = (select auth.uid())::text
    )
  );

CREATE POLICY "spatial_requests_insert_authenticated"
  ON public.property_spatial_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = (select auth.uid()));

CREATE POLICY "spatial_requests_update_owner_or_requester"
  ON public.property_spatial_requests
  FOR UPDATE
  TO authenticated
  USING (
    requester_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id::text = property_spatial_requests.property_id
        AND properties.owner_id = (select auth.uid())::text
    )
  )
  WITH CHECK (
    requester_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id::text = property_spatial_requests.property_id
        AND properties.owner_id = (select auth.uid())::text
    )
  );
