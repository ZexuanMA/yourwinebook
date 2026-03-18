import PostHog from "posthog-react-native";

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || "";
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let client: PostHog | null = null;

export function getPostHog(): PostHog | null {
  if (!POSTHOG_KEY) return null;

  if (!client) {
    client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      enableSessionReplay: false,
    });
  }

  return client;
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  const ph = getPostHog();
  if (ph) ph.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  const ph = getPostHog();
  if (ph) ph.identify(userId, traits);
}

export function resetUser() {
  const ph = getPostHog();
  if (ph) ph.reset();
}
