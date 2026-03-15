import { NextRequest, NextResponse } from "next/server";
import { getSearchSuggestions, getRegions } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const action = searchParams.get("action");

  // Return available regions for filter dropdown
  if (action === "regions") {
    const regions = await getRegions();
    return NextResponse.json({ regions });
  }

  // Return search suggestions for autocomplete
  const suggestions = await getSearchSuggestions(q);
  return NextResponse.json({ suggestions });
}
