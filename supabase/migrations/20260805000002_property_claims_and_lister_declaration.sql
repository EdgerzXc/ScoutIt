-- ═══════════════════════════════════════════════════════════════
-- OWN-01: Property Claims & Lister Relationship Declaration Schema
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.property_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL,
    claimant_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    claimed_relationship TEXT NOT NULL CHECK (claimed_relationship IN ('direct_owner', 'authorized_manager', 'authorized_broker')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'technical_review', 'needs_information', 'human_review', 'approved', 'rejected', 'disputed', 'withdrawn', 'closed')),
    declaration_version TEXT NOT NULL DEFAULT 'v1',
    triage_summary JSONB DEFAULT '{}'::jsonb,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    decision_reason_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_claim_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES public.property_claims(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    private_storage_path TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT,
    file_size_bytes BIGINT,
    checksum TEXT,
    malware_scan_status TEXT DEFAULT 'pending',
    ocr_status TEXT DEFAULT 'pending',
    upload_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_control_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL,
    controller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES public.property_claims(id) ON DELETE SET NULL,
    relationship_type TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.property_claim_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES public.property_claims(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Security
ALTER TABLE public.property_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_control_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_claim_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Claimants view own claims" ON public.property_claims
    FOR SELECT USING (auth.uid() = claimant_user_id);

CREATE POLICY "Claimants insert own claims" ON public.property_claims
    FOR INSERT WITH CHECK (auth.uid() = claimant_user_id);

CREATE POLICY "Claimants view own documents" ON public.property_claim_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.property_claims c
            WHERE c.id = property_claim_documents.claim_id
            AND c.claimant_user_id = auth.uid()
        )
    );

CREATE POLICY "Claimants upload own documents" ON public.property_claim_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.property_claims c
            WHERE c.id = property_claim_documents.claim_id
            AND c.claimant_user_id = auth.uid()
        )
    );

CREATE POLICY "Public view active control assignments" ON public.property_control_assignments
    FOR SELECT USING (is_active = TRUE);
