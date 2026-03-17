import type { Locale } from "./common";

// User statuses
export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// User (stored, includes password)
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  status: UserStatus;
  preferredLang: Locale;
  joinDate: string;
  lastSeen: string;
  bookmarks: string[];
  merchantBookmarks: string[];
}

// User (public, no password)
export type PublicUser = Omit<StoredUser, "password">;
