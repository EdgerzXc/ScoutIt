-- A-152 — email-fallback preference for notification settings.
--
-- PREPARED, NOT APPLIED. Owner-gated under O-004 (one-go discipline): show in
-- plain language, rehearse inside a rolled-back transaction, apply on its own
-- go, then read back grants. Queued as O-004 item 7.
--
-- What it does: adds one additive boolean to privacy_settings. TRUE (the
-- default) keeps today's behavior — a time-sensitive inbox item may chase the
-- user by email after 24h away. FALSE opts out; the dashboard inbox (the
-- system of record) is unaffected.
--
-- Until this is applied, the privacy-settings route and the email fallback
-- degrade gracefully: the route reports emailAlertsStored:false and the
-- fallback behaves as today (no stored preference exists to honor).

alter table public.privacy_settings
  add column if not exists email_alerts boolean default true;

-- Read-back (run after apply):
--   select column_name, data_type, column_default
--     from information_schema.columns
--    where table_name = 'privacy_settings' and column_name = 'email_alerts';
-- Rollback:
--   alter table public.privacy_settings drop column if exists email_alerts;
