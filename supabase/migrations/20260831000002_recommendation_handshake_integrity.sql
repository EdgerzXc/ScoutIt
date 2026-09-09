-- A-064: `qualifying_handshake_id` carries the only claim that earns
-- "Verified ScoutIt connection", and nothing enforced it.
--
-- PREPARED ONLY. Apply through Mission Control under W-003 after backup,
-- exact-plan review, rollback review, and live read-back.
--
-- Found 2026-08-31: two approved, publicly visible recommendations pointed at
-- `11111111-1111-4111-8111-111111111111` and `22222222-2222-4222-8222-222222222222`.
-- Neither exists in `deal_handshakes` — which held zero rows — so both were
-- publishing a verified-connection badge that nothing backed.
--
-- The application no longer trusts the column (it resolves each id against the
-- authority on read), but a defensive read is not the same as an invariant.
-- This makes the database refuse the state in the first place.

BEGIN;

-- Step 1 — clear the dangling claims. This must happen before the constraint,
-- because the constraint cannot be added while they exist.
--
-- The rows are NOT deleted. They carry consent records and real written words;
-- only the unsubstantiated claim is removed, which is the same thing the read
-- path now does in memory. After this the two seeded entries read
-- "Client-submitted · unverified", which is what they always were.
UPDATE public.broker_recommendations r
SET qualifying_handshake_id = NULL,
    updated_at = now()
WHERE r.qualifying_handshake_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.deal_handshakes h WHERE h.id = r.qualifying_handshake_id
  );

-- Step 2 — the invariant.
--
-- ON DELETE RESTRICT, not SET NULL: a handshake that a published recommendation
-- depends on must not be deletable out from under it. Losing the handshake
-- would silently downgrade a genuinely verified entry, and the deletion should
-- be refused and looked at by a person instead.
ALTER TABLE public.broker_recommendations
  DROP CONSTRAINT IF EXISTS broker_recommendations_qualifying_handshake_fkey;

ALTER TABLE public.broker_recommendations
  ADD CONSTRAINT broker_recommendations_qualifying_handshake_fkey
  FOREIGN KEY (qualifying_handshake_id)
  REFERENCES public.deal_handshakes(id)
  ON DELETE RESTRICT;

COMMENT ON COLUMN public.broker_recommendations.qualifying_handshake_id IS
  'A-023/A-038: the completed two-sided handshake that earns "Verified ScoutIt connection". NULL means client-submitted and unverified. FK-enforced since A-064 — it may not name a handshake that does not exist.';

COMMIT;

-- Rollback:
--   ALTER TABLE public.broker_recommendations
--     DROP CONSTRAINT broker_recommendations_qualifying_handshake_fkey;
-- The Step 1 UPDATE is not reversible by a rollback script; the cleared values
-- were placeholders naming no real handshake, and the pre-change values are
-- recorded in this file and in the A-064 Done entry.
