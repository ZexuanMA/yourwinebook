export interface MockMerchant {
  slug: string;
  name: string;
  email: string;
}

const MOCK_ACCOUNTS: Array<MockMerchant & { password: string }> = [
  { slug: "watsons-wine",  name: "Watson's Wine", email: "watsons@demo.com",    password: "demo123" },
  { slug: "wine-and-co",   name: "Wine & Co",     email: "wineandco@demo.com",  password: "demo123" },
  { slug: "cellardoor",    name: "CellarDoor",    email: "cellardoor@demo.com", password: "demo123" },
  { slug: "vinhk",         name: "VinHK",         email: "vinhk@demo.com",      password: "demo123" },
  { slug: "grape-hk",      name: "Grape HK",      email: "grape@demo.com",      password: "demo123" },
  { slug: "bottleshop",    name: "BottleShop",    email: "bottle@demo.com",     password: "demo123" },
];

export function verifyCredentials(email: string, password: string): MockMerchant | null {
  const account = MOCK_ACCOUNTS.find(
    (a) => a.email === email && a.password === password
  );
  if (!account) return null;
  return { slug: account.slug, name: account.name, email: account.email };
}

export function getMockMerchant(slug: string): MockMerchant | null {
  const account = MOCK_ACCOUNTS.find((a) => a.slug === slug);
  if (!account) return null;
  return { slug: account.slug, name: account.name, email: account.email };
}

// For display on the login page
export const DEMO_ACCOUNTS = MOCK_ACCOUNTS.map(({ email, password, name }) => ({
  email,
  password,
  name,
}));
