import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { createSupabaseServer } from "@/lib/supabase-server";

async function getMerchantAccount() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return null;
  const account = await getMockAccount(slug);
  if (!account || account.role !== "merchant") return null;
  return account;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getMerchantAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await createSupabaseServer();
  if (!sb) {
    return NextResponse.json({ error: "Supabase required" }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json();

  // Verify ownership: store must belong to this merchant
  const { data: merchant } = await sb
    .from("merchants")
    .select("id")
    .eq("slug", account.slug)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const { data: existing } = await sb
    .from("merchant_locations")
    .select("merchant_id")
    .eq("id", id)
    .single();

  if (!existing || existing.merchant_id !== merchant.id) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Build update object with only provided fields
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.address_zh !== undefined) update.address_zh = body.address_zh;
  if (body.address_en !== undefined) update.address_en = body.address_en || null;
  if (body.district_zh !== undefined) update.district_zh = body.district_zh || null;
  if (body.district_en !== undefined) update.district_en = body.district_en || null;
  if (body.phone !== undefined) update.phone = body.phone || null;
  if (body.is_active !== undefined) update.is_active = body.is_active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("merchant_locations")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[stores] PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
  }

  return NextResponse.json({ store: data });
}
