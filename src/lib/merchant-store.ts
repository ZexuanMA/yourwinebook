import fs from "fs";
import path from "path";
import { hashPassword, verifyPassword, isHashed } from "./password";

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

export function getAllMerchantsFromStore(): PublicMerchant[] {
  return readStore().map(toPublic);
}

export function getMerchantBySlug(slug: string): PublicMerchant | null {
  const m = readStore().find((m) => m.slug === slug);
  return m ? toPublic(m) : null;
}

export async function verifyMerchantCredentials(email: string, password: string): Promise<PublicMerchant | null> {
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

export function setMerchantStatus(slug: string, status: MerchantStatus): PublicMerchant | null {
  const merchants = readStore();
  const idx = merchants.findIndex((m) => m.slug === slug);
  if (idx === -1) return null;
  merchants[idx].status = status;
  writeStore(merchants);
  return toPublic(merchants[idx]);
}

export function updateMerchantPreferredLang(slug: string, lang: "zh-HK" | "en"): boolean {
  const merchants = readStore();
  const idx = merchants.findIndex((m) => m.slug === slug);
  if (idx === -1) return false;
  merchants[idx].preferredLang = lang;
  writeStore(merchants);
  return true;
}
