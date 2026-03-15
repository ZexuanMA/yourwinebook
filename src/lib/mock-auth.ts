import {
  getMerchantBySlug,
  verifyMerchantCredentials,
  getAllMerchantsFromStore,
} from "./merchant-store";

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

const ADMIN: MockAccount & { password: string } = {
  slug: "admin",
  name: "平台管理員",
  email: "admin@yourwinebook.com",
  password: "admin123",
  role: "admin",
  status: "active",
  joinDate: "2024-01-01",
};

export function verifyCredentials(email: string, password: string): MockAccount | null {
  if (email === ADMIN.email && password === ADMIN.password) {
    const { password: _, ...rest } = ADMIN; void _;
    return rest;
  }
  const m = verifyMerchantCredentials(email, password);
  if (m) return { slug: m.slug, name: m.name, email: m.email, role: "merchant", status: m.status, phone: m.phone, website: m.website, joinDate: m.joinDate, description: m.description };
  return null;
}

export function getMockAccount(slug: string): MockAccount | null {
  if (slug === "admin") {
    const { password: _, ...rest } = ADMIN; void _;
    return rest;
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

// Still exported so login page compiles; merchant entries removed since accounts are real now
export const DEMO_ACCOUNTS = [
  { email: ADMIN.email, password: ADMIN.password, name: ADMIN.name, role: "admin" },
];

// Keep for compatibility
export interface MerchantApplication {
  id: string; companyName: string; contactName: string; email: string;
  phone: string; wineCount: number; website?: string; message?: string;
  status: "pending" | "contacted" | "approved" | "rejected"; submittedAt: string;
}
export const mockApplications: MerchantApplication[] = [];
