import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { updateWine, delistWine, getWineBySlug, type UpdateWineInput } from "@/lib/wine-store";
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
  if (account.status !== "active") return apiError("MERCHANT_INACTIVE");

  const { slug } = await params;

  const existing = await getWineBySlug(slug);
  if (!existing) return apiError("NOT_FOUND", "Wine not found");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON");
  }

  const input: UpdateWineInput = {};
  if (typeof body.name === "string") input.name = body.name.trim();
  if (typeof body.region_zh === "string") input.region_zh = body.region_zh.trim();
  if (typeof body.region_en === "string") input.region_en = body.region_en.trim();
  if (typeof body.grape_variety === "string") input.grape_variety = body.grape_variety.trim();
  if (typeof body.vintage === "number") input.vintage = body.vintage;
  if (typeof body.description_zh === "string") input.description_zh = body.description_zh.trim();
  if (typeof body.description_en === "string") input.description_en = body.description_en.trim();
  if (Array.isArray(body.tags_zh)) input.tags_zh = body.tags_zh;
  if (Array.isArray(body.tags_en)) input.tags_en = body.tags_en;
  if (typeof body.tasting_notes === "object" && body.tasting_notes) {
    input.tasting_notes = body.tasting_notes as UpdateWineInput["tasting_notes"];
  }

  if (Object.keys(input).length === 0) {
    return apiError("VALIDATION", "No fields to update");
  }

  const updated = await updateWine(slug, input, account.slug);
  if (!updated) return apiError("INTERNAL", "Failed to update wine");

  return NextResponse.json({ ok: true, wine: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get("wb_session")?.value;
  if (!sessionSlug) return apiError("UNAUTHORIZED");

  const account = await getMockAccount(sessionSlug);
  if (!account || account.role !== "merchant") return apiError("UNAUTHORIZED");
  if (account.status !== "active") return apiError("MERCHANT_INACTIVE");

  const { slug } = await params;

  const existing = await getWineBySlug(slug);
  if (!existing) return apiError("NOT_FOUND", "Wine not found");

  const ok = await delistWine(slug, account.slug);
  if (!ok) return apiError("INTERNAL", "Failed to delist wine");

  return NextResponse.json({ ok: true, slug });
}
