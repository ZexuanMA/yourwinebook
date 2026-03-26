import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { getAllMergedPrices, getUpdatedMinPrice } from "@/lib/price-store";
import { getAllWines, createWine, type CreateWineInput } from "@/lib/wine-store";

export async function GET() {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get("wb_session")?.value;
  if (!sessionSlug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getMockAccount(sessionSlug);
  if (!account || account.role !== "merchant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return wines with updated minPrices + all merged price data
  const allWines = await getAllWines();
  const winesWithPrices = await Promise.all(
    allWines.map(async (w) => {
      const updated = await getUpdatedMinPrice(w.slug);
      return updated !== null ? { ...w, minPrice: updated } : w;
    })
  );

  const winePrices = await getAllMergedPrices();

  return NextResponse.json({ wines: winesWithPrices, winePrices });
}

const VALID_TYPES = ["red", "white", "sparkling", "rosé", "dessert"];

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get("wb_session")?.value;
  if (!sessionSlug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getMockAccount(sessionSlug);
  if (!account || account.role !== "merchant" || account.status !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate required fields
  const { name, type, region_zh, region_en, price } = body as {
    name?: string;
    type?: string;
    region_zh?: string;
    region_en?: string;
    price?: number;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!type || !VALID_TYPES.includes(type as string)) {
    return NextResponse.json({ error: "Invalid wine type" }, { status: 400 });
  }
  if (!region_zh || typeof region_zh !== "string") {
    return NextResponse.json({ error: "region_zh is required" }, { status: 400 });
  }
  if (!region_en || typeof region_en !== "string") {
    return NextResponse.json({ error: "region_en is required" }, { status: 400 });
  }
  if (typeof price !== "number" || price <= 0) {
    return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
  }

  const input: CreateWineInput = {
    name: name.trim(),
    name_zh: typeof body.name_zh === "string" ? body.name_zh.trim() : undefined,
    type: type as CreateWineInput["type"],
    region_zh: region_zh.trim(),
    region_en: region_en.trim(),
    grape_variety: typeof body.grape_variety === "string" ? body.grape_variety.trim() : undefined,
    vintage: typeof body.vintage === "number" ? body.vintage : undefined,
    description_zh: typeof body.description_zh === "string" ? body.description_zh.trim() : undefined,
    description_en: typeof body.description_en === "string" ? body.description_en.trim() : undefined,
    tags_zh: Array.isArray(body.tags_zh) ? body.tags_zh : undefined,
    tags_en: Array.isArray(body.tags_en) ? body.tags_en : undefined,
    tasting_notes: typeof body.tasting_notes === "object" && body.tasting_notes ? body.tasting_notes as CreateWineInput["tasting_notes"] : undefined,
    price,
    buy_url: typeof body.buy_url === "string" ? body.buy_url.trim() : undefined,
  };

  const wine = await createWine(input, account.slug, account.name);
  if (!wine) {
    return NextResponse.json({ error: "Failed to create wine" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, wine }, { status: 201 });
}
