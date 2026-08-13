// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  isExpectedNodeRequestAbort,
  shouldEnableSentry,
} from "./src/lib/sentryEventPolicy";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Keep local development and its expected hot-reload/socket disconnects out of the live project.
  enabled: shouldEnableSentry(),

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event, hint) {
    return isExpectedNodeRequestAbort(event, hint) ? null : event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
