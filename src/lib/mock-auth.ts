import {
  getMerchantBySlug,
  verifyMerchantCredentials,
  getAllMerchantsFromStore,
} from "./merchant-store";
import { getAdminPublic, verifyAdminCredentials } from "./admin-store";

export type UserRole = "admin" | "merchant";
export type AccountStatus = "active" | "inactive" | "pending";

export interface MockAccount {
  slug: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  phone?: string;
  website?: string;
  joinDate: string;
  description?: string;
}

export function verifyCredentials(email: string, password: string): MockAccount | null {
  if (verifyAdminCredentials(email, password)) {
    return getAdminPublic();
  }
  const m = verifyMerchantCredentials(email, password);
  if (m) return { slug: m.slug, name: m.name, email: m.email, role: "merchant", status: m.status, phone: m.phone, website: m.website, joinDate: m.joinDate, description: m.description };
  return null;
}

export function getMockAccount(slug: string): MockAccount | null {
  if (slug === "admin") {
    return getAdminPublic();
  }
  const m = getMerchantBySlug(slug);
  if (m) return { slug: m.slug, name: m.name, email: m.email, role: "merchant", status: m.status, phone: m.phone, website: m.website, joinDate: m.joinDate, description: m.description };
  return null;
}

export function getAllMerchants(): MockAccount[] {
  return getAllMerchantsFromStore().map((m) => ({
    slug: m.slug, name: m.name, email: m.email, role: "merchant" as UserRole,
    status: m.status, phone: m.phone, website: m.website, joinDate: m.joinDate,
    description: m.description,
  }));
}

// Keep for compatibility
export interface MerchantApplication {
  id: string; companyName: string; contactName: string; email: string;
  phone: string; wineCount: number; website?: string; message?: string;
  status: "pending" | "contacted" | "approved" | "rejected"; submittedAt: string;
}
export const mockApplications: MerchantApplication[] = [];
export const DEMO_ACCOUNTS: { email: string; password: string; name: string; role: string }[] = [];
