-- ============================================================================
-- 20261028000001 — Role Activation and Next of Kin Asset Protection Schema
--
-- Enables streamlined, win-win role activation across ScoutIt:
-- 1. Property Owner & Developer: Next of Kin / Co-Manager emergency attestation
--    for asset continuity and reachable emergency contact.
-- 2. Real Estate Salesperson: Supervising Broker & Accreditation (R.A. 9646 §31).
-- 3. Co-Operator: Operating entity, managed complex, escalation desk.
-- 4. Spatial Photographer & Event Designer: Gear, specialty, and portfolio links.
--
-- Owner-gated under O-004. Nullable / default values ensure backwards compatibility.
-- ============================================================================

-- Owner & Developer Next of Kin / Emergency Contact
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS owner_entity_type TEXT DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT,
  ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT,
  ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT;

COMMENT ON COLUMN public.user_profiles.owner_entity_type IS
  'Owner structure: individual (private/family asset) vs corporate (developer / asset firm).';

COMMENT ON COLUMN public.user_profiles.next_of_kin_name IS
  'Next of Kin or Co-Manager name for asset continuity and emergency verification.';

COMMENT ON COLUMN public.user_profiles.next_of_kin_relationship IS
  'Relationship of next of kin (e.g. Co-Owner, Spouse, Managing Partner, Heir, Legal Counsel).';

COMMENT ON COLUMN public.user_profiles.next_of_kin_phone IS
  'Emergency phone / WhatsApp for asset escalation if primary owner is unreachable.';

-- Real Estate Salesperson under R.A. 9646
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS supervising_broker_name TEXT,
  ADD COLUMN IF NOT EXISTS supervising_broker_prc TEXT,
  ADD COLUMN IF NOT EXISTS salesperson_accreditation TEXT;

COMMENT ON COLUMN public.user_profiles.supervising_broker_name IS
  'Name of the accredited PRC supervising broker or firm.';

COMMENT ON COLUMN public.user_profiles.supervising_broker_prc IS
  'PRC license number of the supervising broker.';

COMMENT ON COLUMN public.user_profiles.salesperson_accreditation IS
  'PRC / DTI salesperson accreditation number.';

-- Co-Operator & Facilities
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS operating_entity TEXT,
  ADD COLUMN IF NOT EXISTS managed_complex TEXT,
  ADD COLUMN IF NOT EXISTS escalation_phone TEXT;

COMMENT ON COLUMN public.user_profiles.operating_entity IS
  'Corporate operating entity or hospitality management company.';

COMMENT ON COLUMN public.user_profiles.managed_complex IS
  'Primary managed building, compound, or commercial complex.';

COMMENT ON COLUMN public.user_profiles.escalation_phone IS
  'Operations desk or 24/7 facilities escalation phone.';

-- Spatial Photographer
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS gear_description TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS location_coverage TEXT;

COMMENT ON COLUMN public.user_profiles.gear_description IS
  'Camera, drone, and spatial staging gear description.';

COMMENT ON COLUMN public.user_profiles.portfolio_url IS
  'Portfolio, showcase website, or verified Instagram handle.';

COMMENT ON COLUMN public.user_profiles.location_coverage IS
  'Primary geographic coverage (e.g. Metro Manila, Cebu, Siargao).';

-- Event & Concept Designer
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS design_specialty TEXT,
  ADD COLUMN IF NOT EXISTS lookbook_url TEXT,
  ADD COLUMN IF NOT EXISTS studio_name TEXT;

COMMENT ON COLUMN public.user_profiles.design_specialty IS
  'Spatial styling specialty (e.g. Pop-up retail, Brand Activations, Luxury Weddings).';

COMMENT ON COLUMN public.user_profiles.lookbook_url IS
  'Lookbook or digital portfolio URL.';

COMMENT ON COLUMN public.user_profiles.studio_name IS
  'Design studio or brand trade name.';
