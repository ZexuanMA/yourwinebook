import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { getAllUsers } from "@/lib/user-store";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return false;
  const account = getMockAccount(slug);
  return account?.role === "admin";
}

export async function GET(_request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ users: getAllUsers() });
}
