-- ==============================================================================
-- A-182: User Behavioral Reviews, Double-Blind Retaliation Shield & Resident Passport
-- Migration: 20261006000002_user_behavioral_scoring_and_double_blind_reviews.sql
-- Status: PREPARED FOR O-004 REVIEW (Do not execute without explicit owner go)
-- ==============================================================================

-- 1. Create table for private user behavioral reviews
CREATE TABLE IF NOT EXISTS public.user_behavioral_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qualifying_handshake_id UUID NOT NULL,
    property_id TEXT,
    listing_slug TEXT,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lease_type TEXT DEFAULT 'Residential Lease',
    duration_months INTEGER DEFAULT 12,
    vectors JSONB NOT NULL,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    is_double_blind_locked BOOLEAN DEFAULT true,
    is_disputed BOOLEAN DEFAULT false,
    disputed_at TIMESTAMPTZ,
    dispute_reason TEXT,
    dispute_resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    CONSTRAINT no_self_dealing CHECK (reviewer_id <> target_user_id),
    CONSTRAINT unique_reviewer_per_handshake UNIQUE (qualifying_handshake_id, reviewer_id)
);

-- 2. Create table for cached user behavioral metrics (Honest Blank Rule by default)
CREATE TABLE IF NOT EXISTS public.user_behavioral_metrics (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'TIER_HONEST_BLANK',
    display_badge TEXT NOT NULL DEFAULT '[First-Time Verified Seeker]',
    composite_score NUMERIC(5,2),
    eligible_review_count INTEGER DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    vector_averages JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.user_behavioral_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavioral_metrics ENABLE ROW LEVEL SECURITY;

-- Deny all to anon
REVOKE ALL ON public.user_behavioral_reviews FROM anon;
REVOKE ALL ON public.user_behavioral_metrics FROM anon;

-- Authenticated policy for reviews:
-- A user can read their own authored review OR an unlocked review where they are the target
CREATE POLICY "Users can read their own or unlocked reviews"
    ON public.user_behavioral_reviews
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = reviewer_id OR
        (auth.uid() = target_user_id AND is_double_blind_locked = false AND is_disputed = false)
    );

-- A user can insert their review if they are the reviewer
CREATE POLICY "Users can submit their own review"
    ON public.user_behavioral_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reviewer_id);

-- Metrics policy:
-- A user can read their own behavioral metrics
CREATE POLICY "Users can read their own behavioral metrics"
    ON public.user_behavioral_metrics
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_behavioral_reviews_target ON public.user_behavioral_reviews(target_user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_reviews_handshake ON public.user_behavioral_reviews(qualifying_handshake_id);
