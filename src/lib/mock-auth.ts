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
  joinDate: string;    // ISO date string
  description?: string;
}

const MOCK_ACCOUNTS: Array<MockAccount & { password: string }> = [
  {
    slug: "admin",
    name: "平台管理員",
    email: "admin@yourwinebook.com",
    password: "admin123",
    role: "admin",
    status: "active",
    joinDate: "2024-01-01",
  },
  {
    slug: "watsons-wine",
    name: "Watson's Wine",
    email: "watsons@demo.com",
    password: "demo123",
    role: "merchant",
    status: "active",
    phone: "+852 2123 4567",
    website: "https://www.watsonswine.com",
    joinDate: "2024-03-12",
    description: "深耕香港葡萄酒市場超過二十年，全港最齊全的葡萄酒庫存之一。",
  },
  {
    slug: "wine-and-co",
    name: "Wine & Co",
    email: "wineandco@demo.com",
    password: "demo123",
    role: "merchant",
    status: "active",
    phone: "+852 2345 6789",
    website: "https://www.wineandco.hk",
    joinDate: "2024-04-01",
    description: "專注歐洲精品酒莊的進口商，主打法國、意大利小農酒。",
  },
  {
    slug: "cellardoor",
    name: "CellarDoor",
    email: "cellardoor@demo.com",
    password: "demo123",
    role: "merchant",
    status: "active",
    phone: "+852 3456 7890",
    website: "https://www.cellardoor.hk",
    joinDate: "2024-05-15",
    description: "新世代線上酒舖，以年輕化選酒和親民定價著稱。",
  },
  {
    slug: "vinhk",
    name: "VinHK",
    email: "vinhk@demo.com",
    password: "demo123",
    role: "merchant",
    status: "active",
    phone: "+852 4567 8901",
    website: "https://www.vinhk.com",
    joinDate: "2024-06-20",
    description: "主打自然酒和有機酒的專門店。",
  },
  {
    slug: "grape-hk",
    name: "Grape HK",
    email: "grape@demo.com",
    password: "demo123",
    role: "merchant",
    status: "inactive",
    phone: "+852 5678 9012",
    website: "https://www.grapehk.com",
    joinDate: "2024-07-08",
    description: "以批量採購壓低成本，提供極具競爭力的價格。",
  },
  {
    slug: "bottleshop",
    name: "BottleShop",
    email: "bottle@demo.com",
    password: "demo123",
    role: "merchant",
    status: "pending",
    phone: "+852 6789 0123",
    website: "https://www.bottleshop.hk",
    joinDate: "2024-09-30",
    description: "精選世界各地得獎酒款，每月推出主題酒單。",
  },
];

export const DEMO_ACCOUNTS = MOCK_ACCOUNTS.map(({ email, password, name, role }) => ({
  email, password, name, role,
}));

export function verifyCredentials(email: string, password: string): MockAccount | null {
  const a = MOCK_ACCOUNTS.find((a) => a.email === email && a.password === password);
  if (!a) return null;
  const { password: _, ...rest } = a;
  void _;
  return rest;
}

export function getMockAccount(slug: string): MockAccount | null {
  const a = MOCK_ACCOUNTS.find((a) => a.slug === slug);
  if (!a) return null;
  const { password: _, ...rest } = a;
  void _;
  return rest;
}

export function getAllMerchants(): MockAccount[] {
  return MOCK_ACCOUNTS
    .filter((a) => a.role === "merchant")
    .map(({ password: _, ...rest }) => { void _; return rest; });
}

// Mock pending applications (from the /join form)
export interface MerchantApplication {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  wineCount: number;
  website?: string;
  message?: string;
  status: "pending" | "contacted" | "approved" | "rejected";
  submittedAt: string;
}

export const mockApplications: MerchantApplication[] = [
  {
    id: "app-001",
    companyName: "Pacific Wine HK",
    contactName: "陳大文",
    email: "contact@pacificwine.hk",
    phone: "+852 9123 4567",
    wineCount: 45,
    website: "https://pacificwine.hk",
    message: "我們主要代理澳洲和新西蘭精品酒款，希望加入平台提升曝光率。",
    status: "pending",
    submittedAt: "2025-03-14T09:23:00Z",
  },
  {
    id: "app-002",
    companyName: "Le Sommelier",
    contactName: "李美玲",
    email: "info@lesommelier.hk",
    phone: "+852 9234 5678",
    wineCount: 120,
    website: "https://lesommelier.hk",
    message: "法國直接進口，專注勃艮第和波爾多名莊。",
    status: "contacted",
    submittedAt: "2025-03-12T14:45:00Z",
  },
  {
    id: "app-003",
    companyName: "Vino Express",
    contactName: "張志明",
    email: "hello@vinoexpress.hk",
    phone: "+852 9345 6789",
    wineCount: 30,
    message: "小型網上酒舖，主打$200以下親民價格。",
    status: "pending",
    submittedAt: "2025-03-10T11:12:00Z",
  },
  {
    id: "app-004",
    companyName: "Château Select",
    contactName: "王建國",
    email: "select@chateau.hk",
    phone: "+852 9456 7890",
    wineCount: 200,
    website: "https://chateau.hk",
    message: "香港高端葡萄酒零售商，服務高端客群20年。",
    status: "approved",
    submittedAt: "2025-03-05T08:30:00Z",
  },
  {
    id: "app-005",
    companyName: "Quick Sip",
    contactName: "林小燕",
    email: "hi@quicksip.hk",
    phone: "+852 9567 8901",
    wineCount: 8,
    message: "剛起步的小型酒商。",
    status: "rejected",
    submittedAt: "2025-03-01T16:00:00Z",
  },
];
