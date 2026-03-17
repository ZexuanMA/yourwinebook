export function normalizeDisplayName(
  value: unknown,
  email?: string | null,
  fallback = "User",
): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof email === "string" && email.trim()) {
    const [localPart] = email.trim().split("@");
    if (localPart) return localPart;
  }

  return fallback;
}

export function getDisplayInitial(value: unknown, fallback = "U"): string {
  if (typeof value !== "string") return fallback;

  const normalized = value.trim();
  if (!normalized) return fallback;

  return Array.from(normalized)[0] ?? fallback;
}
