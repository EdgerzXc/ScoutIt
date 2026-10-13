-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: CRM Contacts & Account-Scoped Deal Notes (A-200 / O-004)
-- Description: Declares public.crm_contacts and public.crm_deal_notes
-- tables with indexes, constraints, and Row Level Security.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  contact_type TEXT NOT NULL DEFAULT 'prospective_tenant'
    CHECK (contact_type IN ('prospective_tenant', 'buyer', 'broker_partner', 'event_organizer', 'investor', 'other')),
  source TEXT NOT NULL DEFAULT 'scoutit_inquiry'
    CHECK (source IN ('scoutit_inquiry', 'csv_import', 'manual_entry', 'referral', 'open_gate')),
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_contacts_owner_idx ON public.crm_contacts(owner_user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_owner_email_unique ON public.crm_contacts(owner_user_id, lower(email)) WHERE email IS NOT NULL;

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_contacts_owner_manage" ON public.crm_contacts
  FOR ALL
  USING (auth.uid()::text = owner_user_id)
  WITH CHECK (auth.uid()::text = owner_user_id);

CREATE TABLE IF NOT EXISTS public.crm_deal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT crm_deal_notes_user_deal_unique UNIQUE (deal_id, user_id)
);

CREATE INDEX IF NOT EXISTS crm_deal_notes_deal_idx ON public.crm_deal_notes(deal_id);
CREATE INDEX IF NOT EXISTS crm_deal_notes_user_idx ON public.crm_deal_notes(user_id);

ALTER TABLE public.crm_deal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_deal_notes_user_manage" ON public.crm_deal_notes
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
