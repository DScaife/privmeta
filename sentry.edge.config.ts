// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b64c08759fb6813e9374cb8417d7c621@o4511427214442496.ingest.de.sentry.io/4511427264446544",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,

  // Logs stay local: console output can contain user file names, which must never leave the device.
  enableLogs: false,

  // Drop console breadcrumbs for the same reason - they would attach recent console
  // messages (potentially including file names) to any captured error event.
  beforeBreadcrumb(breadcrumb) {
    return breadcrumb.category === "console" ? null : breadcrumb;
  },

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
