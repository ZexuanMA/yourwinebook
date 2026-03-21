import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  initialScope: {
    tags: { platform: "web", component: "client" },
  },
  ignoreErrors: [
    // Browser extensions and crawlers
    "ResizeObserver loop",
    "Non-Error promise rejection",
    /Loading chunk [\d]+ failed/,
  ],
  beforeSend(event) {
    // Don't report errors from browser extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
      (f) => f.filename?.includes("chrome-extension://")
    )) {
      return null;
    }
    return event;
  },
});
