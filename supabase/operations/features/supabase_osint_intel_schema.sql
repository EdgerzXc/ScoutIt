-- ============================================================================
-- SCOUTIT SPATIAL INTEL PLATFORM — OSINT WORKFLOW DATABASE SCHEMA
-- Purpose: Raw OSINT Ingestion, 1-Click Master Prompt Formatting, Staging & Airtable Sync
-- Created: 2026-07-31 (Fixed string escaping for Supabase SQL Editor)
-- ============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLE: intel_sources (Raw OSINT Database Repository)
-- Stores raw scrapers, news items, government gazettes, and public filings.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.intel_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- OSINT Provenance & Source Metadata
    source_name TEXT NOT NULL,                  -- E.g. "PSE EDGE", "DENR Gazette", "Makati LGU"
    source_url TEXT,                            -- E.g. "https://edge.pse.com.ph/openData..."
    raw_title TEXT NOT NULL,                    -- Raw headline from scraper / filing
    raw_content TEXT NOT NULL,                  -- Full raw text body or PDF extract
    
    -- Spatial Geotagging
    city TEXT DEFAULT 'Metro Manila',           -- E.g. "BGC, Taguig", "Makati CBD", "Siargao"
    region TEXT DEFAULT 'Philippines',         -- E.g. "Metro Manila", "MIMAROPA", "Visayas"
    lat NUMERIC(10,6) DEFAULT 14.554700,
    lng NUMERIC(10,6) DEFAULT 121.024400,
    
    -- Workflow Status Management
    status TEXT NOT NULL DEFAULT 'pending',     -- 'pending' | 'prompt_copied' | 'processed' | 'published' | 'archived'
    
    -- Helper metadata
    tags TEXT[] DEFAULT '{}',
    notes TEXT
);

-- Index for fast lookup by city, status, and creation date
CREATE INDEX IF NOT EXISTS idx_intel_sources_city ON public.intel_sources(city);
CREATE INDEX IF NOT EXISTS idx_intel_sources_status ON public.intel_sources(status);
CREATE INDEX IF NOT EXISTS idx_intel_sources_created_at ON public.intel_sources(created_at DESC);


-- ----------------------------------------------------------------------------
-- 2. TABLE: intel_briefings (AI Output Staging & Airtable Sync Queue)
-- Stores the synthesized "Our Take" AI result before publishing to the live site.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.intel_briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.intel_sources(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Article Core Fields
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'MARKET INTEL', -- 'MARKET INTEL' | 'COMMERCIAL SIGNAL' | 'AREA GUIDE' | 'INSIGHT' | 'BRIEFING'
    excerpt TEXT,
    lead TEXT,
    our_take TEXT,                               -- Synthesized key takeaways callout
    cover_image_url TEXT,                        -- Unsplash or primary asset image
    
    -- Block Schema JSON (Full Paragraphs, Stat Grids, Quotes, Callouts)
    body_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Geotag & Provenance (Passed to Website & 3D Map)
    city TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'Philippines',
    lat NUMERIC(10,6) NOT NULL DEFAULT 14.554700,
    lng NUMERIC(10,6) NOT NULL DEFAULT 121.024400,
    source_name TEXT,
    source_url TEXT,
    
    -- Sync Status to Airtable (Dual-CMS Golden Rule)
    published_to_airtable BOOLEAN NOT NULL DEFAULT FALSE,
    airtable_record_id TEXT,
    published_at TIMESTAMPTZ
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_intel_briefings_slug ON public.intel_briefings(slug);
CREATE INDEX IF NOT EXISTS idx_intel_briefings_city ON public.intel_briefings(city);
CREATE INDEX IF NOT EXISTS idx_intel_briefings_published ON public.intel_briefings(published_to_airtable);


-- ----------------------------------------------------------------------------
-- 3. SQL FUNCTION: generate_osint_master_prompt
-- Combines 1 or more raw OSINT rows from intel_sources into a 1-click Master AI Prompt
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_osint_master_prompt(source_ids UUID[])
RETURNS TEXT AS $$
DECLARE
    prompt_text TEXT := '';
    rec RECORD;
    i INT := 1;
BEGIN
    prompt_text := 'ROLE: You are ScoutIt Senior Spatial Intelligence Analyst.' || E'\n' ||
                   'TASK: Synthesize the following raw OSINT filing(s) into 1 publication-ready ScoutIt Briefing with "Our Take".' || E'\n\n' ||
                   '==================== RAW OSINT DATA PAYLOAD ====================' || E'\n\n';

    FOR rec IN 
        SELECT id, source_name, source_url, raw_title, raw_content, city, region, lat, lng 
        FROM public.intel_sources 
        WHERE id = ANY(source_ids)
    LOOP
        prompt_text := prompt_text || '--- ARTICLE #' || i || ' ---' || E'\n' ||
                       'Source: ' || COALESCE(rec.source_name, 'OSINT Public Filing') || E'\n' ||
                       'URL: ' || COALESCE(rec.source_url, 'N/A') || E'\n' ||
                       'Headline: ' || rec.raw_title || E'\n' ||
                       'Location: ' || COALESCE(rec.city, 'Metro Manila') || ', ' || COALESCE(rec.region, 'Philippines') || E'\n' ||
                       'Coordinates: Lat ' || rec.lat || ', Lng ' || rec.lng || E'\n' ||
                       'Raw Content:' || E'\n' || rec.raw_content || E'\n\n';
        i := i + 1;
    END LOOP;

    prompt_text := prompt_text || '==================== OUTPUT REQUIREMENTS ====================' || E'\n' ||
                   'Please return the output in valid JSON format with the following keys:' || E'\n' ||
                   '1. "title": High-impact, uppercase-styled commercial headline.' || E'\n' ||
                   '2. "category": Choose one of ["MARKET INTEL", "COMMERCIAL SIGNAL", "AREA GUIDE", "INSIGHT", "BRIEFING"].' || E'\n' ||
                   '3. "excerpt": 2-sentence executive summary.' || E'\n' ||
                   '4. "lead": 1 paragraph contextual intro.' || E'\n' ||
                   '5. "our_take": 3 bullet points detailing ScoutIt strategic assessment for property investors.' || E'\n' ||
                   '6. "city": City name (e.g. "BGC, Taguig").' || E'\n' ||
                   '7. "region": Region name.' || E'\n' ||
                   '8. "lat" & "lng": Geotag coordinates.' || E'\n' ||
                   '9. "sourceName" & "sourceUrl": Primary source link.' || E'\n' ||
                   '10. "body_json": Array of block objects [ParagraphBlock, CalloutBlock, StatGridBlock].';

    -- Mark sources as 'prompt_copied'
    UPDATE public.intel_sources SET status = 'prompt_copied', updated_at = NOW() WHERE id = ANY(source_ids);

    RETURN prompt_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Service Role has full access. Dashboard/Admin authenticated users can read/write.
-- ----------------------------------------------------------------------------
ALTER TABLE public.intel_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_briefings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running script to avoid duplicate policy error
DROP POLICY IF EXISTS "Service role full access on intel_sources" ON public.intel_sources;
DROP POLICY IF EXISTS "Service role full access on intel_briefings" ON public.intel_briefings;
DROP POLICY IF EXISTS "Authenticated users view intel_sources" ON public.intel_sources;
DROP POLICY IF EXISTS "Authenticated users insert intel_sources" ON public.intel_sources;
DROP POLICY IF EXISTS "Authenticated users update intel_sources" ON public.intel_sources;
DROP POLICY IF EXISTS "Authenticated users view intel_briefings" ON public.intel_briefings;
DROP POLICY IF EXISTS "Authenticated users insert intel_briefings" ON public.intel_briefings;
DROP POLICY IF EXISTS "Authenticated users update intel_briefings" ON public.intel_briefings;

-- Allow service role full access
CREATE POLICY "Service role full access on intel_sources" ON public.intel_sources FOR ALL USING (true);
CREATE POLICY "Service role full access on intel_briefings" ON public.intel_briefings FOR ALL USING (true);

-- Allow authenticated admin users access
CREATE POLICY "Authenticated users view intel_sources" ON public.intel_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users insert intel_sources" ON public.intel_sources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users update intel_sources" ON public.intel_sources FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users view intel_briefings" ON public.intel_briefings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users insert intel_briefings" ON public.intel_briefings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users update intel_briefings" ON public.intel_briefings FOR UPDATE TO authenticated USING (true);
