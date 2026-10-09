-- A-186: ScoutIt VIA Contact Attribution & Priority Routing Engine
-- Additive only. Per AGENTS.md §7 / O-004, this migration is prepared locally
-- and executed in production only under explicit owner database release.

-- 1. VIA SHARE LINKS: Unique, promoter-scoped property distribution links
CREATE TABLE IF NOT EXISTS public.via_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  promoter_id TEXT NOT NULL,
  promoter_type TEXT NOT NULL DEFAULT 'broker'
    CHECK (promoter_type IN ('broker', 'owner')),
  representation_id UUID REFERENCES public.property_broker_representations(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'revoked')),
  clicks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, slug)
);

CREATE INDEX IF NOT EXISTS via_share_links_prop_promoter_idx
  ON public.via_share_links (property_id, promoter_id, status);
CREATE INDEX IF NOT EXISTS via_share_links_slug_idx
  ON public.via_share_links (slug, status);

-- 2. VIA ATTRIBUTIONS: Visitor session attribution with 30-day window
CREATE TABLE IF NOT EXISTS public.via_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  promoter_id TEXT NOT NULL,
  promoter_type TEXT NOT NULL DEFAULT 'broker'
    CHECK (promoter_type IN ('broker', 'owner')),
  share_link_id UUID REFERENCES public.via_share_links(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'invalidated', 'converted')),
  is_qualified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Section 15: First valid attribution locks the window for that property & visitor
  UNIQUE (property_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS via_attributions_lookup_idx
  ON public.via_attributions (property_id, visitor_id, status, expires_at);
CREATE INDEX IF NOT EXISTS via_attributions_promoter_idx
  ON public.via_attributions (promoter_id, created_at DESC);

-- 3. VIA ROUTING DECISIONS: Immutable audit log of every priority contact routing
CREATE TABLE IF NOT EXISTS public.via_routing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  selected_recipient_id TEXT NOT NULL,
  selected_recipient_type TEXT NOT NULL
    CHECK (selected_recipient_type IN ('owner', 'broker')),
  routing_reason TEXT NOT NULL
    CHECK (routing_reason IN ('USER_SELECTION', 'ACTIVE_RELATIONSHIP', 'VIA_ATTRIBUTION', 'SCOUTIT_RANKING', 'FALLBACK', 'ADMIN_OVERRIDE')),
  attribution_id UUID REFERENCES public.via_attributions(id) ON DELETE SET NULL,
  ranking_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS via_routing_decisions_prop_idx
  ON public.via_routing_decisions (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS via_routing_decisions_recipient_idx
  ON public.via_routing_decisions (selected_recipient_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.via_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.via_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.via_routing_decisions ENABLE ROW LEVEL SECURITY;

-- Security: Service role owns writes. Public can read active share links.
CREATE POLICY via_share_links_public_read
  ON public.via_share_links
  FOR SELECT
  USING (status = 'active');
