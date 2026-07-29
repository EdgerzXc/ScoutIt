-- Automated Google Meet generation (NEW_IDEAS.md §20.1). Applied live 2026-07-29.
--
-- When a viewing is booked, ScoutIt asks Google Calendar to mint a Meet room
-- on the HOST's calendar and stores the link here so both parties can join
-- from the appointment without anyone sending a URL by hand.
--
-- Both columns are NULLABLE and stay NULL when the host hasn't connected
-- Google. Meet generation is strictly best-effort: a viewing booking must
-- never fail because a video link couldn't be created.

ALTER TABLE public.viewing_appointments
  ADD COLUMN IF NOT EXISTS meet_link TEXT;

ALTER TABLE public.viewing_appointments
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

COMMENT ON COLUMN public.viewing_appointments.meet_link IS
  'Google Meet URL auto-generated on the host''s calendar at booking time. NULL when the host has no Google connection — the appointment is still valid, it just has no video room.';
COMMENT ON COLUMN public.viewing_appointments.google_event_id IS
  'Google Calendar event id backing this appointment, so a reschedule or cancellation can patch/delete the same event instead of orphaning it.';
