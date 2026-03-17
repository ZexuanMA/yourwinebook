import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { getAnalyticsSummary } from "@/lib/analytics-store";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return false;
  return (await getMockAccount(slug))?.role === "admin";
}

export async function GET(_request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(getAnalyticsSummary());
}
