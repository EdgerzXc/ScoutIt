-- A-154 Pillar 2 — child-space identity columns on property_units.
--
-- PREPARED, NOT APPLIED. Owner-gated under O-004 (one-go discipline): show in
-- plain language, rehearse inside a rolled-back transaction, apply on its own
-- go, then read back. Queued as O-004 item 8.
--
-- What it does: lets each unit carry its own commercial identity
-- (unit_category) and transaction intent (listing_purpose), independent of
-- the parent building's single SpaceCategory. A residential condo building
-- can therefore hold STR units that STR searches can find. Additive only:
-- both columns are NULL-able with no default, so every existing row reads
-- "uncategorized" rather than a fabricated identity (Standing Rule 7 — a
-- schema default must never manufacture a claim; Standing Rule 14 — NULL is
-- never an assertion).
--
-- Constrained by CHECK, not by trust: the application vocabulary lives in
-- src/lib/unitCategory.js and this constraint mirrors it, so a typo'd
-- category fails at the database instead of silently vanishing from filters.

alter table public.property_units
  add column if not exists unit_category text
    check (unit_category is null or unit_category in (
      'residential_lease', 'residential_sale', 'str', 'commercial_flex'
    )),
  add column if not exists listing_purpose text
    check (listing_purpose is null or listing_purpose in (
      'lease', 'sale', 'short_stay', 'flex'
    ));

-- Read-back (run after apply):
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_name = 'property_units'
--      and column_name in ('unit_category', 'listing_purpose');
-- Rollback:
--   alter table public.property_units
--     drop column if exists listing_purpose,
--     drop column if exists unit_category;
