import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { wines } from "@/lib/mock-data";
import { getAllMergedPrices, getUpdatedMinPrice } from "@/lib/price-store";

export async function GET() {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get("wb_session")?.value;
  if (!sessionSlug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getMockAccount(sessionSlug);
  if (!account || account.role !== "merchant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return wines with updated minPrices + all merged price data
  const winesWithPrices = await Promise.all(
    wines.map(async (w) => {
      const updated = await getUpdatedMinPrice(w.slug);
      return updated !== null ? { ...w, minPrice: updated } : w;
    })
  );

  const winePrices = await getAllMergedPrices();

  return NextResponse.json({ wines: winesWithPrices, winePrices });
}
