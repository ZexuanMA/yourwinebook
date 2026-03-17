/**
 * Merchant store — file-based (legacy) or Supabase (when USE_SUPABASE_AUTH=true).
 * External function signatures are unchanged for backward compatibility.
 */

import fs from "fs";
import path from "path";
import { hashPassword, verifyPassword, isHashed } from "./password";
import { USE_SUPABASE_AUTH } from "./supabase-auth";
import { createSupabaseServer, createSupabaseServiceRole } from "./supabase-server";

export type MerchantStatus = "active" | "inactive" | "pending";

export interface StoredMerchant {
  slug: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  website?: string;
  description?: string;
  status: MerchantStatus;
  joinDate: string;
  preferredLang?: "zh-HK" | "en";
}

export type PublicMerchant = Omit<StoredMerchant, "password"> & { role: "merchant" };

// ── Legacy file-based helpers ────────────────────────────────

const DATA_FILE = path.join(process.cwd(), "data", "merchants.json");

function readStore(): StoredMerchant[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as StoredMerchant[];
  } catch {
    return [];
  }
}

function writeStore(merchants: StoredMerchant[]): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(merchants, null, 2), "utf-8");
  } catch (err) {
    console.error("[merchant-store] write error:", err);
  }
}

function toPublic(m: StoredMerchant): PublicMerchant {
  const { password: _, ...rest } = m; void _;
  return { ...rest, role: "merchant" };
}

// ── Supabase helpers ─────────────────────────────────────────

/**
 * Map a Supabase merchant + staff profile join to PublicMerchant shape.
 */
function supabaseMerchantToPublic(merchant: {
  slug: string;
  name: string;
  website: string | null;
  description_zh: string | null;
  status: string;
  created_at: string | null;
}, staff?: {
  email: string;
  locale: string | null;
  phone?: string | null;
}): PublicMerchant {
  return {
    slug: merchant.slug,
    name: merchant.name,
    email: staff?.email ?? "",
    website: merchant.website ?? undefined,
    description: merchant.description_zh ?? undefined,
    status: (merchant.status ?? "active") as MerchantStatus,
    joinDate: merchant.created_at?.slice(0, 10) ?? "",
    preferredLang: (staff?.locale === "en" ? "en" : "zh-HK") as "zh-HK" | "en",
    role: "merchant",
  };
}

// ── Public API ───────────────────────────────────────────────

export async function getAllMerchantsFromStore(): Promise<PublicMerchant[]> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return [];

    const { data } = await supabase
      .from("merchants")
      .select("slug, name, website, description_zh, status, created_at, merchant_staff(profiles(email, locale))")
      .order("created_at", { ascending: false });

    if (!data) return [];

    return data.map((m) => {
      const staffArr = m.merchant_staff as unknown as { profiles: { email: string; locale: string | null } }[] | null;
      const staff = staffArr?.[0]?.profiles;
      return supabaseMerchantToPublic(m, staff ? { email: staff.email, locale: staff.locale } : undefined);
    });
  }

  return readStore().map(toPublic);
}

export async function getMerchantBySlug(slug: string): Promise<PublicMerchant | null> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return null;

    const { data: merchant } = await supabase
      .from("merchants")
      .select("slug, name, website, description_zh, status, created_at, merchant_staff(profiles(email, locale))")
      .eq("slug", slug)
      .single();

    if (!merchant) return null;

    const staffArr = merchant.merchant_staff as unknown as { profiles: { email: string; locale: string | null } }[] | null;
    const staff = staffArr?.[0]?.profiles;
    return supabaseMerchantToPublic(merchant, staff ? { email: staff.email, locale: staff.locale } : undefined);
  }

  const m = readStore().find((m) => m.slug === slug);
  return m ? toPublic(m) : null;
}

export async function verifyMerchantCredentials(email: string, password: string): Promise<PublicMerchant | null> {
  // Supabase path handled by supabase-auth.ts signIn
  const merchants = readStore();
  for (const m of merchants) {
    if (m.email !== email) continue;
    const ok = await verifyPassword(password, m.password);
    if (ok) {
      if (!isHashed(m.password)) {
        m.password = await hashPassword(password);
        writeStore(merchants);
      }
      return toPublic(m);
    }
  }
  return null;
}

export async function verifyMerchantPassword(slug: string, password: string): Promise<boolean> {
  // Supabase path handled in verify-password route directly
  const merchants = readStore();
  const m = merchants.find((m) => m.slug === slug);
  if (!m) return false;
  const ok = await verifyPassword(password, m.password);
  if (ok && !isHashed(m.password)) {
    m.password = await hashPassword(password);
    writeStore(merchants);
  }
  return ok;
}

export async function updateMerchantPassword(slug: string, newPassword: string): Promise<boolean> {
  // Supabase path handled in verify-password route directly
  const merchants = readStore();
  const idx = merchants.findIndex((m) => m.slug === slug);
  if (idx === -1) return false;
  merchants[idx].password = await hashPassword(newPassword);
  writeStore(merchants);
  return true;
}

export async function createMerchant(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  website?: string;
  description?: string;
}): Promise<PublicMerchant | null> {
  if (USE_SUPABASE_AUTH) {
    const serviceRole = createSupabaseServiceRole();
    if (!serviceRole) return null;

    // Check duplicate email
    const { data: existingProfile } = await serviceRole
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (existingProfile) return null;

    // 1. Create auth user
    const { data: authData, error: authError } = await serviceRole.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (authError || !authData.user) return null;

    // 2. Generate slug
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      + "-" + Date.now().toString(36);

    // 3. Create profile
    await serviceRole.from("profiles").insert({
      id: authData.user.id,
      display_name: data.name,
      email: data.email,
      role: "merchant_staff",
      status: "active",
    });

    // 4. Create merchant entity
    const { data: merchant, error: merchantError } = await serviceRole
      .from("merchants")
      .insert({
        slug,
        name: data.name,
        description_zh: data.description ?? "",
        description_en: "",
        website: data.website ?? null,
        status: "active",
      })
      .select("id")
      .single();

    if (merchantError || !merchant) return null;

    // 5. Link staff to merchant
    await serviceRole.from("merchant_staff").insert({
      profile_id: authData.user.id,
      merchant_id: merchant.id,
      role: "owner",
    });

    return {
      slug,
      name: data.name,
      email: data.email,
      website: data.website,
      description: data.description,
      status: "active",
      joinDate: new Date().toISOString().slice(0, 10),
      role: "merchant",
    };
  }

  const merchants = readStore();
  if (merchants.find((m) => m.email === data.email)) return null;
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    + "-" + Date.now().toString(36);
  const newMerchant: StoredMerchant = {
    slug,
    name: data.name,
    email: data.email,
    password: await hashPassword(data.password),
    phone: data.phone,
    website: data.website,
    description: data.description,
    status: "active",
    joinDate: new Date().toISOString().slice(0, 10),
  };
  merchants.push(newMerchant);
  writeStore(merchants);
  return toPublic(newMerchant);
}

export async function setMerchantStatus(slug: string, status: MerchantStatus): Promise<PublicMerchant | null> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return null;

    const { error } = await supabase
      .from("merchants")
      .update({ status })
      .eq("slug", slug);

    if (error) return null;
    return getMerchantBySlug(slug);
  }

  const merchants = readStore();
  const idx = merchants.findIndex((m) => m.slug === slug);
  if (idx === -1) return null;
  merchants[idx].status = status;
  writeStore(merchants);
  return toPublic(merchants[idx]);
}

export async function updateMerchantPreferredLang(slug: string, lang: "zh-HK" | "en"): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (!supabase) return false;

    // Find the merchant's staff profile and update locale
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", slug)
      .single();
    if (!merchant) return false;

    const { data: staff } = await supabase
      .from("merchant_staff")
      .select("profile_id")
      .eq("merchant_id", merchant.id)
      .limit(1)
      .single();
    if (!staff) return false;

    const { error } = await supabase
      .from("profiles")
      .update({ locale: lang })
      .eq("id", staff.profile_id);

    return !error;
  }

  const merchants = readStore();
  const idx = merchants.findIndex((m) => m.slug === slug);
  if (idx === -1) return false;
  merchants[idx].preferredLang = lang;
  writeStore(merchants);
  return true;
}
