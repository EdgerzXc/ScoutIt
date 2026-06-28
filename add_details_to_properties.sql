-- ==============================================================================
-- ADD DETAILS JSONB TO PROPERTIES
-- ==============================================================================

-- We add a JSONB column to hold category-specific fields dynamically
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
