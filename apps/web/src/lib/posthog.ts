import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (initialized) return;
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // We handle pageviews manually via PageTracker
    capture_pageleave: true,
    autocapture: false,
  });

  initialized = true;
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.reset();
}

export { posthog };
