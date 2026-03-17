import fs from "fs";
import path from "path";
import { hashPassword, verifyPassword, isHashed } from "./password";

interface AdminData {
  slug: string;
  name: string;
  email: string;
  password: string;
  joinDate: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "admin.json");

function readAdmin(): AdminData {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as AdminData;
  } catch {
    return { slug: "admin", name: "平台管理員", email: "Zexuan@admin.com", password: "ad7581jnP123!", joinDate: new Date().toISOString().slice(0, 10) };
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

export function getAdminPublic() {
  const { password: _, ...rest } = readAdmin(); void _;
  return { ...rest, role: "admin" as const, status: "active" as const };
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
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
  const admin = readAdmin();
  const ok = await verifyPassword(password, admin.password);
  if (ok && !isHashed(admin.password)) {
    admin.password = await hashPassword(password);
    writeAdmin(admin);
  }
  return ok;
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  const admin = readAdmin();
  admin.password = await hashPassword(newPassword);
  writeAdmin(admin);
}
