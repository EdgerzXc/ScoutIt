-- A-023 phase 4: client recommendations and ScoutIt contributions.
-- PREPARED ONLY. W-003 requires owner approval before live application.
--
-- Design notes that are load-bearing, not commentary:
--
--  * `attribution_mode` is NOT NULL with no default. Rule 7: a schema default
--    must never manufacture a claim, and defaulting this would publish a name
--    under an attribution the author never chose.
--  * `consent_granted` is likewise NOT NULL with no default. A NULL is never
--    an assertion (Rule 14); consent has to be recorded, not assumed.
--  * `moderation_state` defaults to 'pending', the state that publishes
--    nothing. The safe default is the one that shows nothing.
--  * `evidence_url` lives on the row but is never selected by the public
--    reader. It is moderation proof, not presentation.

CREATE TABLE IF NOT EXISTS public.broker_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,

  -- Author identity and the attribution they consented to.
  author_user_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  author_display_name TEXT NOT NULL DEFAULT '',
  attribution_mode TEXT NOT NULL
    CHECK (attribution_mode IN ('full_name', 'initials', 'role_only', 'anonymous')),
  relationship_type TEXT NOT NULL DEFAULT '',

  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),

  -- Consent, moderation, withdrawal, dispute.
  consent_granted BOOLEAN NOT NULL,
  consent_recorded_at TIMESTAMPTZ,
  consent_version TEXT NOT NULL DEFAULT 'v1',
  moderation_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_state IN ('pending', 'approved', 'rejected')),
  moderated_by TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT NOT NULL DEFAULT '',
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT NOT NULL DEFAULT '',
  disputed_at TIMESTAMPTZ,
  dispute_reason TEXT NOT NULL DEFAULT '',
  redacted_at TIMESTAMPTZ,

  -- Private moderation evidence. Never selected by the public projection.
  evidence_url TEXT NOT NULL DEFAULT '',

  -- The ONLY thing that earns "Verified ScoutIt connection".
  qualifying_handshake_id UUID,

  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A broker cannot recommend themselves. A-023 excludes self-dealing before
  -- aggregation; the cheapest place to enforce it is the row itself.
  CONSTRAINT broker_recommendations_no_self_dealing
    CHECK (author_user_id IS NULL OR author_user_id IS DISTINCT FROM broker_id),

  -- Consent must carry its timestamp when granted.
  CONSTRAINT broker_recommendations_consent_is_dated
    CHECK (consent_granted IS FALSE OR consent_recorded_at IS NOT NULL)
);

-- One author may recommend one broker once per qualifying connection.
-- Prevents the duplicate/collusive inflation A-023 excludes.
CREATE UNIQUE INDEX IF NOT EXISTS broker_recommendations_unique_author_handshake
  ON public.broker_recommendations (broker_id, author_user_id, qualifying_handshake_id)
  WHERE author_user_id IS NOT NULL AND qualifying_handshake_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS broker_recommendations_public_idx
  ON public.broker_recommendations (broker_id, submitted_at DESC)
  WHERE moderation_state = 'approved'
    AND consent_granted IS TRUE
    AND withdrawn_at IS NULL
    AND disputed_at IS NULL;

CREATE TABLE IF NOT EXISTS public.broker_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL
    CHECK (kind IN ('question', 'correction', 'briefing', 'intel')),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 300),

  -- A site-internal absolute path. The CHECK mirrors the application guard so
  -- an off-site or protocol-relative href cannot be stored at all: A-023
  -- requires every contribution to open its own ScoutIt artifact.
  artifact_path TEXT NOT NULL
    CHECK (artifact_path LIKE '/%' AND artifact_path NOT LIKE '//%'),

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'retracted')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT broker_contributions_published_is_dated
    CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS broker_contributions_public_idx
  ON public.broker_contributions (broker_id, published_at DESC)
  WHERE status = 'published';

-- Append-only audit for consent, moderation, withdrawal, and dispute events.
CREATE TABLE IF NOT EXISTS public.broker_social_proof_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES public.broker_recommendations(id) ON DELETE RESTRICT,
  contribution_id UUID REFERENCES public.broker_contributions(id) ON DELETE RESTRICT,
  actor_user_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'recommendation_submitted',
      'recommendation_consent_granted',
      'recommendation_consent_revoked',
      'recommendation_approved',
      'recommendation_rejected',
      'recommendation_withdrawn',
      'recommendation_disputed',
      'recommendation_redacted',
      'contribution_published',
      'contribution_retracted'
    )),
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT broker_social_proof_audit_targets_one_row
    CHECK (num_nonnulls(recommendation_id, contribution_id) = 1)
);

CREATE INDEX IF NOT EXISTS broker_social_proof_audit_recommendation_idx
  ON public.broker_social_proof_audit_events (recommendation_id, created_at DESC, id);

ALTER TABLE public.broker_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_social_proof_audit_events ENABLE ROW LEVEL SECURITY;

-- No policies are created. RLS on with zero policies denies everything to
-- anon/authenticated; the server reads through the service role only. Adding a
-- policy here would be the moment a consent record or private evidence URL
-- became reachable from a browser (Rule 5).
REVOKE ALL ON TABLE public.broker_recommendations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.broker_contributions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.broker_social_proof_audit_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.broker_recommendations TO service_role;
GRANT ALL ON TABLE public.broker_contributions TO service_role;
GRANT ALL ON TABLE public.broker_social_proof_audit_events TO service_role;
