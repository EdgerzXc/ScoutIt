-- A-038: authoritative four-level post-handshake satisfaction signal.
-- PREPARED ONLY. Apply through Mission Control under W-003 after backup,
-- exact-plan review, rollback review, and live read-back.

BEGIN;

ALTER TABLE public.broker_recommendations
  ADD COLUMN IF NOT EXISTS satisfaction_level TEXT;

-- Existing recommendation rows predate the signal and remain NULL. A NULL is
-- historical absence, never silently converted into a positive or negative
-- response. New submissions require a level in the application boundary.
ALTER TABLE public.broker_recommendations
  DROP CONSTRAINT IF EXISTS broker_recommendations_satisfaction_level_check;

ALTER TABLE public.broker_recommendations
  ADD CONSTRAINT broker_recommendations_satisfaction_level_check
  CHECK (
    satisfaction_level IS NULL
    OR satisfaction_level IN ('angry', 'sad', 'smile', 'happy')
  );

-- The owner settled the written comment as optional. Keep body NOT NULL so
-- every row has one unambiguous representation: empty string means no comment.
ALTER TABLE public.broker_recommendations
  ALTER COLUMN body SET DEFAULT '';

ALTER TABLE public.broker_recommendations
  DROP CONSTRAINT IF EXISTS broker_recommendations_body_check;

ALTER TABLE public.broker_recommendations
  ADD CONSTRAINT broker_recommendations_body_check
  CHECK (length(body) BETWEEN 0 AND 2000);

CREATE INDEX IF NOT EXISTS broker_recommendations_satisfaction_public_idx
  ON public.broker_recommendations (broker_id, satisfaction_level)
  WHERE moderation_state = 'approved'
    AND consent_granted IS TRUE
    AND withdrawn_at IS NULL
    AND disputed_at IS NULL
    AND qualifying_handshake_id IS NOT NULL
    AND satisfaction_level IS NOT NULL;

COMMENT ON COLUMN public.broker_recommendations.satisfaction_level IS
  'A-038 ordered client satisfaction response: angry, sad, smile, or happy. NULL means the legacy row predates this signal.';

COMMIT;
