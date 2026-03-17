// Supported locales
export const LOCALES = ["zh-HK", "en"] as const;
export type Locale = (typeof LOCALES)[number];

// Dashboard language (alias for Locale, used in admin UI)
export type DashboardLang = Locale;

// Auth roles for dashboard
export const USER_ROLES = ["admin", "merchant"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Account status (used in mock-auth for dashboard accounts)
export const ACCOUNT_STATUSES = ["active", "inactive", "pending"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
