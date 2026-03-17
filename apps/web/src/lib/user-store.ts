/**
 * User store — file-based (legacy) or Supabase (when USE_SUPABASE_AUTH=true).
 * External function signatures are unchanged for backward compatibility.
 */

import fs from "fs";
import path from "path";
import { hashPassword, verifyPassword, isHashed } from "./password";
import { USE_SUPABASE_AUTH } from "./supabase-auth";
import { createSupabaseServer } from "./supabase-server";

export type UserStatus = "active" | "suspended";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  status: UserStatus;
  preferredLang: "zh-HK" | "en";
  joinDate: string;
  lastSeen: string;
  bookmarks: string[];
  merchantBookmarks: string[];
}

export type PublicUser = Omit<StoredUser, "password">;

// ── Legacy file-based helpers ────────────────────────────────

const DATA_FILE = path.join(process.cwd(), "data", "users.json");

function readStore(): StoredUser[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeStore(users: StoredUser[]): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("[user-store] Failed to persist users:", err);
  }
}

// ── Supabase helpers ─────────────────────────────────────────

async function supabaseProfileToPublic(
  profile: {
    id: string;
    display_name: string;
    email: string;
    status: string;
    created_at: string;
  },
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServer>>>
): Promise<PublicUser> {
  // Fetch bookmarks
  const { data: wb } = await supabase
    .from("wine_bookmarks")
    .select("wines(slug)")
    .eq("user_id", profile.id);
  const bookmarks = (wb ?? [])
    .map((r) => {
      const w = r.wines as unknown as { slug: string } | null;
      return w?.slug;
    })
    .filter(Boolean) as string[];

  const { data: mb } = await supabase
    .from("merchant_bookmarks")
    .select("merchants(slug)")
    .eq("user_id", profile.id);
  const merchantBookmarks = (mb ?? [])
    .map((r) => {
      const m = r.merchants as unknown as { slug: string } | null;
      return m?.slug;
    })
    .filter(Boolean) as string[];

  return {
    id: profile.id,
    name: profile.display_name,
    email: profile.email,
    status: (profile.status === "active" ? "active" : "suspended") as UserStatus,
    preferredLang: "zh-HK",
    joinDate: profile.created_at?.slice(0, 10) ?? "",
    lastSeen: new Date().toISOString().slice(0, 10),
    bookmarks,
    merchantBookmarks,
  };
}

// ── Public API ───────────────────────────────────────────────

export async function getAllUsers(): Promise<PublicUser[]> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return [];

    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, email, status, created_at")
      .eq("role", "user")
      .order("created_at", { ascending: false });

    if (!data) return [];

    // For listing, skip bookmark lookups for performance
    return data.map((p) => ({
      id: p.id,
      name: p.display_name,
      email: p.email,
      status: (p.status === "active" ? "active" : "suspended") as UserStatus,
      preferredLang: "zh-HK" as const,
      joinDate: p.created_at?.slice(0, 10) ?? "",
      lastSeen: "",
      bookmarks: [],
      merchantBookmarks: [],
    }));
  }

  return readStore().map(({ password: _, ...rest }) => {
    void _;
    return rest;
  });
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, email, status, created_at")
      .eq("id", id)
      .single();

    if (!profile) return null;
    return supabaseProfileToPublic(profile, supabase);
  }

  const u = readStore().find((u) => u.id === id);
  if (!u) return null;
  const { password: _, ...rest } = u;
  void _;
  return rest;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<PublicUser | null> {
  // Supabase path handled by supabase-auth.ts signIn
  const users = readStore();
  for (const u of users) {
    if (u.email !== email) continue;
    const ok = await verifyPassword(password, u.password);
    if (ok) {
      if (!isHashed(u.password)) {
        u.password = await hashPassword(password);
        writeStore(users);
      }
      const { password: _, ...rest } = u;
      void _;
      return rest;
    }
  }
  return null;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<PublicUser | null> {
  // Supabase path handled by supabase-auth.ts signUp
  const users = readStore();
  if (users.find((u) => u.email === email)) return null;
  const newUser: StoredUser = {
    id: `u${Date.now()}`,
    name,
    email,
    password: await hashPassword(password),
    status: "active",
    preferredLang: "zh-HK",
    joinDate: new Date().toISOString().slice(0, 10),
    lastSeen: new Date().toISOString().slice(0, 10),
    bookmarks: [],
    merchantBookmarks: [],
  };
  users.push(newUser);
  writeStore(users);
  const { password: _, ...rest } = newUser;
  void _;
  return rest;
}

export async function setUserStatus(
  id: string,
  status: UserStatus
): Promise<PublicUser | null> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return null;

    const supaStatus = status === "suspended" ? "banned" : "active";
    const { error } = await supabase
      .from("profiles")
      .update({
        status: supaStatus,
        ...(supaStatus === "banned"
          ? { banned_at: new Date().toISOString(), ban_reason: "Admin action" }
          : { banned_at: null, ban_reason: null }),
      })
      .eq("id", id);

    if (error) return null;
    return getUserById(id);
  }

  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx].status = status;
  writeStore(users);
  const { password: _, ...rest } = users[idx];
  void _;
  return rest;
}

export async function toggleWineBookmark(
  id: string,
  wineSlug: string
): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return false;

    // Resolve wine UUID from slug
    const { data: wine } = await supabase
      .from("wines")
      .select("id")
      .eq("slug", wineSlug)
      .single();
    if (!wine) return false;

    // Check if bookmark exists
    const { data: existing } = await supabase
      .from("wine_bookmarks")
      .select("user_id")
      .eq("user_id", id)
      .eq("wine_id", wine.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("wine_bookmarks")
        .delete()
        .eq("user_id", id)
        .eq("wine_id", wine.id);
      return false; // removed
    } else {
      await supabase
        .from("wine_bookmarks")
        .insert({ user_id: id, wine_id: wine.id });
      return true; // added
    }
  }

  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  const bookmarks = users[idx].bookmarks ?? [];
  const has = bookmarks.includes(wineSlug);
  users[idx].bookmarks = has
    ? bookmarks.filter((s) => s !== wineSlug)
    : [...bookmarks, wineSlug];
  writeStore(users);
  return !has;
}

export async function toggleMerchantBookmark(
  id: string,
  merchantSlug: string
): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return false;

    // Resolve merchant UUID from slug
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", merchantSlug)
      .single();
    if (!merchant) return false;

    // Check if bookmark exists
    const { data: existing } = await supabase
      .from("merchant_bookmarks")
      .select("user_id")
      .eq("user_id", id)
      .eq("merchant_id", merchant.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("merchant_bookmarks")
        .delete()
        .eq("user_id", id)
        .eq("merchant_id", merchant.id);
      return false;
    } else {
      await supabase
        .from("merchant_bookmarks")
        .insert({ user_id: id, merchant_id: merchant.id });
      return true;
    }
  }

  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  const bookmarks = users[idx].merchantBookmarks ?? [];
  const has = bookmarks.includes(merchantSlug);
  users[idx].merchantBookmarks = has
    ? bookmarks.filter((s) => s !== merchantSlug)
    : [...bookmarks, merchantSlug];
  writeStore(users);
  return !has;
}

export async function getMerchantFavoriteCount(
  merchantSlug: string
): Promise<number> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return 0;

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", merchantSlug)
      .single();
    if (!merchant) return 0;

    const { count } = await supabase
      .from("merchant_bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchant.id);

    return count ?? 0;
  }

  return readStore().filter((u) =>
    (u.merchantBookmarks ?? []).includes(merchantSlug)
  ).length;
}

export async function verifyUserPassword(
  id: string,
  password: string
): Promise<boolean> {
  // Supabase path handled in change-password route directly
  const users = readStore();
  const u = users.find((u) => u.id === id);
  if (!u) return false;
  const ok = await verifyPassword(password, u.password);
  if (ok && !isHashed(u.password)) {
    u.password = await hashPassword(password);
    writeStore(users);
  }
  return ok;
}

export async function updateUserPassword(
  id: string,
  newPassword: string
): Promise<boolean> {
  // Supabase path handled in change-password route directly
  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users[idx].password = await hashPassword(newPassword);
  writeStore(users);
  return true;
}

export function updateLastSeen(id: string): void {
  // No-op for Supabase (auth session handles this)
  if (USE_SUPABASE_AUTH) return;

  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return;
  users[idx].lastSeen = new Date().toISOString().slice(0, 10);
  writeStore(users);
}
