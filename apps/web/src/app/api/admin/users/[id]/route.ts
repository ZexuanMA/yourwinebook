import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { setUserStatus, UserStatus } from "@/lib/user-store";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return false;
  const account = getMockAccount(slug);
  return account?.role === "admin";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await request.json() as { status: UserStatus };

  if (status !== "active" && status !== "suspended") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const user = setUserStatus(id, status);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ ok: true, user });
}
