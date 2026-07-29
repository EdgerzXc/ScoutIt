-- Owner pre-flight checklist support. Applied live 2026-07-29.
--
-- A pre-flight question is authored by ScoutIt (a standard buyer question for
-- that space category), not asked by a user -- so asked_by_user_id is NULL and
-- source distinguishes it from an organic public question.
--
-- We seed the QUESTIONS only, never the answers. An answer on a listing is a
-- representation of fact about that property; ScoutIt generating one would
-- break the Honest Data Doctrine and undermine the neutral-technology-provider
-- position under RA 9646. Only the owner can fill these in.
--
-- preflight_key is the stable id from src/lib/faqPreflight.js. The unique
-- constraint makes the owner's save idempotent: re-saving the checklist
-- updates the same rows instead of duplicating the wall.
--
-- NOTE: this must be a FULL unique constraint, not a partial index. Postgres
-- cannot infer a partial unique index from `ON CONFLICT (property_id,
-- preflight_key)` unless the statement repeats the index predicate, and
-- supabase-js's .upsert({ onConflict }) has no way to emit that WHERE clause
-- -- so a partial index makes every checklist save throw. A full constraint
-- is safe here because Postgres treats NULLs as distinct in unique indexes,
-- so a property can still carry unlimited public questions (preflight_key
-- IS NULL) without collisions. Verified against the live database.

ALTER TABLE public.property_faqs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'public'
    CHECK (source IN ('public', 'preflight'));

ALTER TABLE public.property_faqs
  ADD COLUMN IF NOT EXISTS preflight_key TEXT;

ALTER TABLE public.property_faqs
  DROP CONSTRAINT IF EXISTS uniq_faq_property_preflight_key;

ALTER TABLE public.property_faqs
  ADD CONSTRAINT uniq_faq_property_preflight_key
  UNIQUE (property_id, preflight_key);

COMMENT ON COLUMN public.property_faqs.source IS
  'public = asked by a signed-in user on the listing. preflight = ScoutIt-authored standard buyer question for the space category, answered by the owner before publish.';
COMMENT ON COLUMN public.property_faqs.preflight_key IS
  'Stable key from src/lib/faqPreflight.js. Makes the owner checklist save idempotent.';
