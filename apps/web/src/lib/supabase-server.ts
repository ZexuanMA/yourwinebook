import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Returns null if env vars are not configured.
 *
 * Must be called within a request context (where `cookies()` is available).
 */
export async function createSupabaseServer(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll can fail when called from a Server Component.
          // This is expected — the middleware will refresh the session.
        }
      },
    },
  });
}

/**
 * Service-role client for admin operations (creating users, etc.).
 * Bypasses RLS. Returns null if SUPABASE_SERVICE_ROLE_KEY is not set.
 */
export function createSupabaseServiceRole(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
