import { NextRequest, NextResponse } from "next/server";
import { getWinesPaginated } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filters = {
    type: searchParams.get("type") ?? undefined,
    region: searchParams.get("region") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    sort: (searchParams.get("sort") as "price_asc" | "price_desc" | "name_asc" | "name_desc" | "newest") ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  };
  const result = await getWinesPaginated(filters);
  return NextResponse.json(result);
}
