import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock supabase-auth to disable Supabase path
vi.mock("@/lib/supabase-auth", () => ({
  USE_SUPABASE_AUTH: false,
  supabaseSignIn: vi.fn().mockResolvedValue(null),
  supabaseGetUser: vi.fn().mockResolvedValue(null),
}));

// Mock next/headers cookies for /me route
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

import { POST as loginPOST } from "@/app/api/auth/login/route";
import { GET as meGET } from "@/app/api/auth/me/route";

function makeLoginRequest(body: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  it("returns 401 for wrong credentials", async () => {
    const res = await loginPOST(
      makeLoginRequest({ email: "wrong@example.com", password: "wrong" })
    );
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 200 and sets cookie for valid merchant login", async () => {
    // Merchant accounts use bcrypt-hashed "demo123"
    const res = await loginPOST(
      makeLoginRequest({ email: "watsons@demo.com", password: "demo123" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.account).toBeDefined();
    expect(data.account.role).toBe("merchant");
    expect(data.account.slug).toBe("watsons-wine");
    // Check cookie is set
    const setCookie = res.headers.getSetCookie();
    expect(setCookie.some((c: string) => c.includes("wb_session=watsons-wine"))).toBe(true);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when no session cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/me");
    const res = await meGET(req);
    expect(res.status).toBe(401);
  });

  it("returns account data with valid session cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { cookie: "wb_session=admin" },
    });
    const res = await meGET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.slug).toBe("admin");
    expect(data.role).toBe("admin");
  });

  it("returns 401 for invalid session", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: { cookie: "wb_session=nonexistent" },
    });
    const res = await meGET(req);
    expect(res.status).toBe(401);
  });
});
