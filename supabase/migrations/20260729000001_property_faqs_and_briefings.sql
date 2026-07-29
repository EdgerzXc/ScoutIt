-- ═══════════════════════════════════════════════════════════════════════
-- 3-TIER PROPERTY FAQ SYSTEM  (NEW_IDEAS.md §4 + §12)
-- Applied to the live ScoutIT Supabase project on 2026-07-29.
--
-- property_id is TEXT and holds the Airtable-canonical SLUG (the value in
-- /property/[id]). Airtable is the single source of slug truth per AGENTS.md
-- §2, so there is no FK to public.properties -- published listings live in
-- Airtable, not Supabase.
--
-- author_id / asked_by_user_id are TEXT to match public.user_profiles.id
-- (which is TEXT, not UUID, in this project). RLS compares auth.uid()::text.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.property_faqs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     TEXT NOT NULL,
    question_text   TEXT NOT NULL CHECK (char_length(question_text) BETWEEN 5 AND 500),
    asked_by_user_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_faq_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id      UUID NOT NULL REFERENCES public.property_faqs(id) ON DELETE CASCADE,
    author_id   TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('resident', 'advisor', 'owner', 'system')),
    answer_tier TEXT NOT NULL CHECK (answer_tier IN ('gold', 'silver', 'bronze')),
    answer_text TEXT NOT NULL CHECK (char_length(answer_text) BETWEEN 2 AND 2000),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_faq_tier UNIQUE (faq_id, answer_tier)
);

CREATE TABLE IF NOT EXISTS public.broker_briefing_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_user_id TEXT REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    property_id    TEXT NOT NULL,
    generated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_faqs_property   ON public.property_faqs (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_faqs_asker      ON public.property_faqs (asked_by_user_id);
CREATE INDEX IF NOT EXISTS idx_faq_answers_faq          ON public.property_faq_answers (faq_id);
CREATE INDEX IF NOT EXISTS idx_faq_answers_author       ON public.property_faq_answers (author_id);
CREATE INDEX IF NOT EXISTS idx_briefing_logs_broker     ON public.broker_briefing_logs (broker_user_id, generated_at DESC);

-- ── updated_at trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_faq_answer_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger functions never need to be callable over PostgREST. Without these
-- revokes, SECURITY DEFINER + the default PUBLIC grant exposes the function
-- at /rest/v1/rpc/touch_faq_answer_updated_at. The trigger is unaffected --
-- triggers run as the table owner, not as the caller.
REVOKE EXECUTE ON FUNCTION public.touch_faq_answer_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_faq_answer_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.touch_faq_answer_updated_at() FROM authenticated;

DROP TRIGGER IF EXISTS trg_faq_answer_touch ON public.property_faq_answers;
CREATE TRIGGER trg_faq_answer_touch
  BEFORE UPDATE ON public.property_faq_answers
  FOR EACH ROW EXECUTE FUNCTION public.touch_faq_answer_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.property_faqs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_faq_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_briefing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read visible property_faqs"  ON public.property_faqs;
CREATE POLICY "Public read visible property_faqs"
  ON public.property_faqs FOR SELECT
  TO anon, authenticated
  USING (is_hidden = FALSE);

DROP POLICY IF EXISTS "Authenticated users ask questions" ON public.property_faqs;
CREATE POLICY "Authenticated users ask questions"
  ON public.property_faqs FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = asked_by_user_id);

DROP POLICY IF EXISTS "Askers hide own questions" ON public.property_faqs;
CREATE POLICY "Askers hide own questions"
  ON public.property_faqs FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid())::text = asked_by_user_id)
  WITH CHECK ((SELECT auth.uid())::text = asked_by_user_id);

DROP POLICY IF EXISTS "Public read visible faq answers" ON public.property_faq_answers;
CREATE POLICY "Public read visible faq answers"
  ON public.property_faq_answers FOR SELECT
  TO anon, authenticated
  USING (is_hidden = FALSE);

DROP POLICY IF EXISTS "Authenticated users post answers" ON public.property_faq_answers;
CREATE POLICY "Authenticated users post answers"
  ON public.property_faq_answers FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = author_id);

DROP POLICY IF EXISTS "Authors update own answers" ON public.property_faq_answers;
CREATE POLICY "Authors update own answers"
  ON public.property_faq_answers FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid())::text = author_id)
  WITH CHECK ((SELECT auth.uid())::text = author_id);

DROP POLICY IF EXISTS "Brokers read own briefing logs" ON public.broker_briefing_logs;
CREATE POLICY "Brokers read own briefing logs"
  ON public.broker_briefing_logs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid())::text = broker_user_id);

DROP POLICY IF EXISTS "Brokers log own briefings" ON public.broker_briefing_logs;
CREATE POLICY "Brokers log own briefings"
  ON public.broker_briefing_logs FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = broker_user_id);

COMMENT ON TABLE public.property_faqs IS
  'Per-property public Q&A. property_id = Airtable-canonical slug (see AGENTS.md 2). Writes go through /api/faqs, which runs the contact-leak regex filter.';
COMMENT ON TABLE public.property_faq_answers IS
  '3-tier authority answers. gold=owner/manager, silver=verified advisor, bronze=resident/tenant. One answer per tier per question (unique_faq_tier).';
