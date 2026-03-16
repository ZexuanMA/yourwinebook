import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { updatePrice } from "@/lib/price-store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get("wb_session")?.value;
  if (!sessionSlug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = getMockAccount(sessionSlug);
  if (!account || account.role !== "merchant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: wineSlug } = await params;
  const { price } = await request.json();

  if (typeof price !== "number" || price <= 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  updatePrice(wineSlug, account.slug, price);
  return NextResponse.json({ ok: true, wineSlug, merchantSlug: account.slug, price });
}
