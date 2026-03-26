import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { updatePrice } from "@/lib/price-store";
import { apiError } from "@/lib/api-errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get("wb_session")?.value;
  if (!sessionSlug) return apiError("UNAUTHORIZED");

  const account = await getMockAccount(sessionSlug);
  if (!account || account.role !== "merchant") return apiError("UNAUTHORIZED");

  const { slug: wineSlug } = await params;
  const { price } = await request.json();

  if (typeof price !== "number" || price <= 0) {
    return apiError("VALIDATION", "Invalid price");
  }

  await updatePrice(wineSlug, account.slug, price);
  return NextResponse.json({ ok: true, wineSlug, merchantSlug: account.slug, price });
}
