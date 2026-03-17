import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { setMerchantStatus, MerchantStatus } from "@/lib/merchant-store";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return null;
  const account = getMockAccount(slug);
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await request.json();
  const { status } = body as { status: MerchantStatus };

  if (!["active", "inactive", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const merchant = setMerchantStatus(slug, status);
  if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

  return NextResponse.json({ merchant });
}
