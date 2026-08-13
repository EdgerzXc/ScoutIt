// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Keep local development and its expected hot-reload/socket disconnects out of the live project.
  enabled: process.env.NODE_ENV === "production"
    && process.env.NEXT_PUBLIC_SCOUTIT_E2E !== "1",

  // Human-pilot policy: collect errors and a small performance sample, but do
  // not record DOM/session replays. Pilot feedback is observation notes only;
  // ScoutIt does not retain interaction recordings without a later explicit
  // privacy decision and consent flow.
  integrations: [],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  sendDefaultPii: false,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
