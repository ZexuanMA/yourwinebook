/**
 * Admin store — file-based (legacy) or Supabase (when USE_SUPABASE_AUTH=true).
 * In Supabase mode, admin identity comes from profiles where role='admin'.
 * Auth functions (verify/update password) are handled by supabase-auth.ts.
 */

import fs from "fs";
import path from "path";
import { hashPassword, verifyPassword, isHashed } from "./password";
import { USE_SUPABASE_AUTH } from "./supabase-auth";
import { createSupabaseServer } from "./supabase-server";

interface AdminData {
  slug: string;
  name: string;
  email: string;
  password: string;
  joinDate: string;
}

// ── Legacy file-based helpers ────────────────────────────────

const DATA_FILE = path.join(process.cwd(), "data", "admin.json");

function readAdmin(): AdminData {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as AdminData;
  } catch {
    return { slug: "admin", name: "平台管理員", email: "admin@yourwinebook.com", password: "admin123", joinDate: new Date().toISOString().slice(0, 10) };
  }
}

function writeAdmin(admin: AdminData): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(admin, null, 2), "utf-8");
  } catch (err) {
    console.error("[admin-store] write error:", err);
  }
}

// ── Public API ───────────────────────────────────────────────

export async function getAdminPublic(): Promise<{
  slug: string;
  name: string;
  email: string;
  role: "admin";
  status: "active";
  joinDate: string;
}> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, email, created_at")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (profile) {
        return {
          slug: "admin",
          name: profile.display_name,
          email: profile.email,
          role: "admin",
          status: "active",
          joinDate: profile.created_at?.slice(0, 10) ?? "",
        };
      }
    }
  }

  const { password: _, ...rest } = readAdmin(); void _;
  return { ...rest, role: "admin" as const, status: "active" as const };
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  // Supabase mode: auth is handled by supabase-auth.ts signIn; this function is legacy-only
  if (USE_SUPABASE_AUTH) return false;

  const admin = readAdmin();
  if (admin.email !== email) return false;
  const ok = await verifyPassword(password, admin.password);
  if (ok && !isHashed(admin.password)) {
    admin.password = await hashPassword(password);
    writeAdmin(admin);
  }
  return ok;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  // Supabase mode: password verification is handled by verify-password route via supabase-auth.ts
  if (USE_SUPABASE_AUTH) return false;

  const admin = readAdmin();
  const ok = await verifyPassword(password, admin.password);
  if (ok && !isHashed(admin.password)) {
    admin.password = await hashPassword(password);
    writeAdmin(admin);
  }
  return ok;
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  // Supabase mode: password update is handled by verify-password route via supabaseChangePassword()
  if (USE_SUPABASE_AUTH) return;

  const admin = readAdmin();
  admin.password = await hashPassword(newPassword);
  writeAdmin(admin);
}
