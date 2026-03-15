import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { getAllMerchantsFromStore, createMerchant } from "@/lib/merchant-store";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return null;
  const account = getMockAccount(slug);
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const merchants = getAllMerchantsFromStore();
  return NextResponse.json({ merchants });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, email, password, phone, website, description } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email and password are required" }, { status: 400 });
  }

  const merchant = createMerchant({ name, email, password, phone, website, description });
  if (!merchant) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

  return NextResponse.json({ merchant }, { status: 201 });
}
