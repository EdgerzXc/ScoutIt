-- Calendar Sync — Phase 3: link a ScoutIt event to its Google counterpart.
--
-- One column: the Google event id for the row (null until it has been pushed to
-- / pulled from Google). This is how outbound updates/deletes find the remote
-- event, and how inbound pulls dedupe against an already-synced local row.
-- content_hash / last_synced_hash already exist (added in the Phase 1 table).

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Fast lookup "does this user already have the Google event X locally?"
CREATE INDEX IF NOT EXISTS calendar_events_google_id_idx
  ON public.calendar_events (owner_user_id, google_event_id)
  WHERE google_event_id IS NOT NULL;
