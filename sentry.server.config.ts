// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://fba5ae20404a85f7eacdd7577ed32895@o4510843868151808.ingest.de.sentry.io/4510849942028368",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Ignore known Next.js caching errors from stale form submissions
  beforeSend(event, hint) {
    // Ignore "Failed to find Server Action" errors - these occur when users have
    // cached forms from previous deployments trying to submit to non-existent actions
    if (
      event.exception &&
      event.exception.values &&
      event.exception.values[0] &&
      event.exception.values[0].value &&
      event.exception.values[0].value.includes('Failed to find Server Action')
    ) {
      return null; // Don't send to Sentry
    }
    return event;
  },
});
