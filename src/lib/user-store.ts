/**
 * File-based persistent user store.
 * Reads/writes to data/users.json so new registrations survive
 * hot-reloads and server restarts during development.
 */

import fs from "fs";
import path from "path";
import { hashPassword, verifyPassword, isHashed } from "./password";

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

export function getAllUsers(): PublicUser[] {
  return readStore().map(({ password: _, ...rest }) => { void _; return rest; });
}

export function getUserById(id: string): PublicUser | null {
  const u = readStore().find((u) => u.id === id);
  if (!u) return null;
  const { password: _, ...rest } = u; void _;
  return rest;
}

export async function verifyCredentials(email: string, password: string): Promise<PublicUser | null> {
  const users = readStore();
  for (const u of users) {
    if (u.email !== email) continue;
    const ok = await verifyPassword(password, u.password);
    if (ok) {
      if (!isHashed(u.password)) {
        u.password = await hashPassword(password);
        writeStore(users);
      }
      const { password: _, ...rest } = u; void _;
      return rest;
    }
  }
  return null;
}

export async function registerUser(name: string, email: string, password: string): Promise<PublicUser | null> {
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
  const { password: _, ...rest } = newUser; void _;
  return rest;
}

export function setUserStatus(id: string, status: UserStatus): PublicUser | null {
  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx].status = status;
  writeStore(users);
  const { password: _, ...rest } = users[idx]; void _;
  return rest;
}

export function toggleWineBookmark(id: string, wineSlug: string): boolean {
  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  const bookmarks = users[idx].bookmarks ?? [];
  const has = bookmarks.includes(wineSlug);
  users[idx].bookmarks = has ? bookmarks.filter((s) => s !== wineSlug) : [...bookmarks, wineSlug];
  writeStore(users);
  return !has;
}

export function toggleMerchantBookmark(id: string, merchantSlug: string): boolean {
  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  const bookmarks = users[idx].merchantBookmarks ?? [];
  const has = bookmarks.includes(merchantSlug);
  users[idx].merchantBookmarks = has ? bookmarks.filter((s) => s !== merchantSlug) : [...bookmarks, merchantSlug];
  writeStore(users);
  return !has;
}

export function getMerchantFavoriteCount(merchantSlug: string): number {
  return readStore().filter((u) => (u.merchantBookmarks ?? []).includes(merchantSlug)).length;
}

export async function verifyUserPassword(id: string, password: string): Promise<boolean> {
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

export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users[idx].password = await hashPassword(newPassword);
  writeStore(users);
  return true;
}

export function updateLastSeen(id: string): void {
  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return;
  users[idx].lastSeen = new Date().toISOString().slice(0, 10);
  writeStore(users);
}
