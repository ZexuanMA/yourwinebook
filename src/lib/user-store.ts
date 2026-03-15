/**
 * File-based persistent user store.
 * Reads/writes to data/users.json so new registrations survive
 * hot-reloads and server restarts during development.
 *
 * All functions are synchronous to keep call-sites simple.
 */

import fs from "fs";
import path from "path";

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

export function verifyCredentials(email: string, password: string): PublicUser | null {
  const u = readStore().find((u) => u.email === email && u.password === password);
  if (!u) return null;
  const { password: _, ...rest } = u; void _;
  return rest;
}

export function registerUser(name: string, email: string, password: string): PublicUser | null {
  const users = readStore();
  if (users.find((u) => u.email === email)) return null; // already exists
  const newUser: StoredUser = {
    id: `u${Date.now()}`,
    name,
    email,
    password,
    status: "active",
    preferredLang: "zh-HK",
    joinDate: new Date().toISOString().slice(0, 10),
    lastSeen: new Date().toISOString().slice(0, 10),
    bookmarks: [],
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

export function updateLastSeen(id: string): void {
  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return;
  users[idx].lastSeen = new Date().toISOString().slice(0, 10);
  writeStore(users);
}
