/**
 * Supabase Auth layer — replaces mock-auth when USE_SUPABASE_AUTH=true.
 *
 * Role determination comes from `profiles.role`.
 * Merchant staff get their merchant info via `merchant_staff` join.
 */

import { createSupabaseServer } from "./supabase-server";

export const USE_SUPABASE_AUTH =
  process.env.USE_SUPABASE_AUTH === "true";

export type AuthRole = "admin" | "merchant_staff" | "user";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
  displayName: string;
  status: string;
  /** merchant_staff only */
  merchantId?: string;
  merchantSlug?: string;
}

// ── Helpers ──────────────────────────────────────────────────

async function enrichWithMerchant(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServer>>>,
  userId: string,
  base: AuthUser
): Promise<AuthUser> {
  if (base.role !== "merchant_staff") return base;

  const { data: staff } = await supabase
    .from("merchant_staff")
    .select("merchant_id, merchants(slug)")
    .eq("profile_id", userId)
    .single();

  if (staff) {
    base.merchantId = staff.merchant_id;
    // Supabase returns the joined relation as an object for single FK
    const m = staff.merchants as unknown as { slug: string } | null;
    base.merchantSlug = m?.slug;
  }
  return base;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Sign in with email + password. Returns AuthUser on success, null on failure.
 */
export async function supabaseSignIn(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, status")
    .eq("id", data.user.id)
    .single();

  if (!profile) return null;

  return enrichWithMerchant(supabase, data.user.id, {
    id: data.user.id,
    email: data.user.email!,
    role: profile.role as AuthRole,
    displayName: profile.display_name,
    status: profile.status,
  });
}

/**
 * Sign out the current user.
 */
export async function supabaseSignOut(): Promise<void> {
  const supabase = await createSupabaseServer();
  if (supabase) {
    await supabase.auth.signOut();
  }
}

/**
 * Get the currently signed-in user, or null.
 */
export async function supabaseGetUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, status")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return enrichWithMerchant(supabase, user.id, {
    id: user.id,
    email: user.email!,
    role: profile.role as AuthRole,
    displayName: profile.display_name,
    status: profile.status,
  });
}

/**
 * Register a new consumer user.
 */
export async function supabaseSignUp(
  email: string,
  password: string,
  displayName: string
): Promise<AuthUser | null> {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error || !data.user) return null;

  // Ensure profile exists (no DB trigger yet)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (!existing) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      display_name: displayName,
      email,
      role: "user",
      status: "active",
    });
  }

  return {
    id: data.user.id,
    email,
    role: "user",
    displayName,
    status: "active",
  };
}

/**
 * Change the current user's password.
 */
export async function supabaseChangePassword(
  newPassword: string
): Promise<boolean> {
  const supabase = await createSupabaseServer();
  if (!supabase) return false;

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return !error;
}
