-- Widens unit_category CHECK constraint on public.property_units to include
-- commercial, dining, and retail tenant categories.
-- Additive only: existing rows and columns are untouched.
-- Staged locally per AGENTS.md §7 / O-004.

ALTER TABLE public.property_units
  DROP CONSTRAINT IF EXISTS property_units_unit_category_check;

ALTER TABLE public.property_units
  ADD CONSTRAINT property_units_unit_category_check
    CHECK (unit_category IS NULL OR unit_category IN (
      'residential_lease', 'residential_sale', 'str', 'commercial_flex',
      'fastfood', 'restaurant', 'cafe', 'retail', 'kiosk', 'services', 'entertainment'
    ));
