import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { updateWine, delistWine, getWineBySlug, type UpdateWineInput } from "@/lib/wine-store";

/**
 * PATCH /api/merchant/wines/[slug] — Edit wine info.
 * Immutable fields: slug, type.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get("wb_session")?.value;
  if (!sessionSlug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getMockAccount(sessionSlug);
  if (!account || account.role !== "merchant" || account.status !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  // Check wine exists
  const existing = await getWineBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Wine not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await updateWine(slug, input, account.slug);
  if (!updated) {
    return NextResponse.json({ error: "Failed to update wine" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, wine: updated });
}

/**
 * DELETE /api/merchant/wines/[slug] — Soft-delete (delist) a wine.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const cookieStore = await cookies();
  const sessionSlug = cookieStore.get("wb_session")?.value;
  if (!sessionSlug) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getMockAccount(sessionSlug);
  if (!account || account.role !== "merchant" || account.status !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const existing = await getWineBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Wine not found" }, { status: 404 });
  }

  const ok = await delistWine(slug, account.slug);
  if (!ok) {
    return NextResponse.json({ error: "Failed to delist wine" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
}
