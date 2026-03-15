import fs from "fs";
import path from "path";

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

export function verifyAdminCredentials(email: string, password: string): boolean {
  const admin = readAdmin();
  return admin.email === email && admin.password === password;
}

export function verifyAdminPassword(password: string): boolean {
  return readAdmin().password === password;
}

export function updateAdminPassword(newPassword: string): void {
  const admin = readAdmin();
  admin.password = newPassword;
  writeAdmin(admin);
}
