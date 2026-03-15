export type UserStatus = "active" | "suspended";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  preferredLang: "zh-HK" | "en";
  joinDate: string;
  lastSeen: string;
  bookmarks: string[];   // wine slugs
}

const MOCK_USERS: Array<MockUser & { password: string }> = [
  {
    id: "u1",
    name: "陳大文",
    email: "david@demo.com",
    password: "user123",
    status: "active",
    preferredLang: "zh-HK",
    joinDate: "2025-01-10",
    lastSeen: "2025-03-15",
    bookmarks: ["cloudy-bay-sauvignon-blanc-2023", "moet-chandon-brut-imperial", "whispering-angel-rose-2023"],
  },
  {
    id: "u2",
    name: "李美玲",
    email: "mary@demo.com",
    password: "user123",
    status: "active",
    preferredLang: "zh-HK",
    joinDate: "2025-02-03",
    lastSeen: "2025-03-14",
    bookmarks: ["penfolds-bin-389-2021", "masi-costasera-amarone-2018"],
  },
  {
    id: "u3",
    name: "James Wong",
    email: "james@demo.com",
    password: "user123",
    status: "active",
    preferredLang: "en",
    joinDate: "2025-02-18",
    lastSeen: "2025-03-13",
    bookmarks: ["cloudy-bay-sauvignon-blanc-2023", "santa-margherita-pinot-grigio"],
  },
  {
    id: "u4",
    name: "張志強",
    email: "zhang@demo.com",
    password: "user123",
    status: "suspended",
    preferredLang: "zh-HK",
    joinDate: "2025-01-25",
    lastSeen: "2025-02-28",
    bookmarks: [],
  },
  {
    id: "u5",
    name: "Sophie Lam",
    email: "sophie@demo.com",
    password: "user123",
    status: "active",
    preferredLang: "en",
    joinDate: "2025-03-01",
    lastSeen: "2025-03-15",
    bookmarks: ["moet-chandon-brut-imperial", "whispering-angel-rose-2023", "penfolds-bin-389-2021"],
  },
  {
    id: "u6",
    name: "王建國",
    email: "wang@demo.com",
    password: "user123",
    status: "active",
    preferredLang: "zh-HK",
    joinDate: "2025-03-08",
    lastSeen: "2025-03-14",
    bookmarks: ["cloudy-bay-sauvignon-blanc-2023"],
  },
];

export const DEMO_USERS = MOCK_USERS.map(({ email, password, name }) => ({ email, password, name }));

export function verifyUserCredentials(email: string, password: string): MockUser | null {
  const u = MOCK_USERS.find((u) => u.email === email && u.password === password);
  if (!u) return null;
  const { password: _, ...rest } = u; void _;
  return rest;
}

export function getMockUser(id: string): MockUser | null {
  const u = MOCK_USERS.find((u) => u.id === id);
  if (!u) return null;
  const { password: _, ...rest } = u; void _;
  return rest;
}

export function getAllUsers(): MockUser[] {
  return MOCK_USERS.map(({ password: _, ...rest }) => { void _; return rest; });
}

export function registerUser(name: string, email: string): MockUser | null {
  if (MOCK_USERS.find((u) => u.email === email)) return null; // already exists
  const newUser: MockUser & { password: string } = {
    id: `u${Date.now()}`,
    name,
    email,
    password: "demo123",
    status: "active",
    preferredLang: "zh-HK",
    joinDate: new Date().toISOString().slice(0, 10),
    lastSeen: new Date().toISOString().slice(0, 10),
    bookmarks: [],
  };
  MOCK_USERS.push(newUser);
  const { password: _, ...rest } = newUser; void _;
  return rest;
}
