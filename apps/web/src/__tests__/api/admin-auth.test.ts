import { describe, it, expect, vi } from "vitest";

// Mock supabase-auth
vi.mock("@/lib/supabase-auth", () => ({
  USE_SUPABASE_AUTH: false,
}));

// Mock next/headers cookies — simulate different session states
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: (...args: unknown[]) => mockCookieGet(...args),
  }),
}));

import { GET as getAccounts } from "@/app/api/admin/accounts/route";

describe("Admin API permission boundaries", () => {
  it("GET /api/admin/accounts returns 401 without session", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const res = await getAccounts();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("GET /api/admin/accounts returns 401 for non-admin merchant", async () => {
    mockCookieGet.mockReturnValue({ value: "watsons-wine" });
    const res = await getAccounts();
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/accounts returns 200 for admin", async () => {
    mockCookieGet.mockReturnValue({ value: "admin" });
    const res = await getAccounts();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.merchants).toBeDefined();
    expect(Array.isArray(data.merchants)).toBe(true);
  });
});
