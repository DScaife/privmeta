// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b64c08759fb6813e9374cb8417d7c621@o4511427214442496.ingest.de.sentry.io/4511427264446544",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  ignoreErrors: [
    "Java bridge method invocation error",
    "TypeError: can't access dead object",
    /NotFoundError: Failed to execute '(removeChild|insertBefore)' on 'Node'/,
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    "Non-Error exception captured",
  ],
});
