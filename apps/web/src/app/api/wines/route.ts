import { NextRequest, NextResponse } from "next/server";
import { getWinesPaginated } from "@/lib/queries";
import { wineFiltersSchema, searchParamsToObject } from "@/lib/api-validation";
import { apiError, withErrorHandler } from "@/lib/api-response";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const raw = searchParamsToObject(request.nextUrl.searchParams);
  const parsed = wineFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("invalid_input", 400, request);
  }
  const result = await getWinesPaginated(parsed.data);
  return NextResponse.json(result);
});
