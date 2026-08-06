-- ═══════════════════════════════════════════════════════════════
-- URL-02: Immutable Canonical Slug & Slug History Schema
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.property_slug_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL,
    old_slug TEXT NOT NULL,
    canonical_slug TEXT NOT NULL,
    replaced_at TIMESTAMPTZ DEFAULT NOW(),
    replaced_by_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_property_slug_history_old_slug ON public.property_slug_history(old_slug);
CREATE INDEX IF NOT EXISTS idx_property_slug_history_property_id ON public.property_slug_history(property_id);

ALTER TABLE public.property_slug_history ENABLE ROW LEVEL SECURITY;

-- Anyone can query historical slugs to resolve 301 redirects
CREATE POLICY "Public read property_slug_history" 
    ON public.property_slug_history 
    FOR SELECT 
    USING (true);

-- Authenticated staff can insert migration records
CREATE POLICY "Authenticated insert property_slug_history" 
    ON public.property_slug_history 
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);
