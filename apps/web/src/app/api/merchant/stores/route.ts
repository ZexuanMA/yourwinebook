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

export async function GET() {
  const account = await getMerchantAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await createSupabaseServer();
  if (!sb) {
    return NextResponse.json({ stores: [], requireSupabase: true });
  }

  // Find merchant UUID by slug
  const { data: merchant } = await sb
    .from("merchants")
    .select("id")
    .eq("slug", account.slug)
    .single();

  if (!merchant) {
    return NextResponse.json({ stores: [] });
  }

  const { data: stores, error } = await sb
    .from("merchant_locations")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[stores] GET error:", error.message);
    return NextResponse.json({ stores: [] });
  }

  return NextResponse.json({ stores: stores ?? [] });
}

export async function POST(request: NextRequest) {
  const account = await getMerchantAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await createSupabaseServer();
  if (!sb) {
    return NextResponse.json({ error: "Supabase required" }, { status: 503 });
  }

  const { data: merchant } = await sb
    .from("merchants")
    .select("id")
    .eq("slug", account.slug)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, address_zh, address_en, district_zh, district_en, phone } = body;

  if (!name || !address_zh) {
    return NextResponse.json({ error: "name and address_zh are required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("merchant_locations")
    .insert({
      merchant_id: merchant.id,
      name,
      address_zh,
      address_en: address_en || null,
      district_zh: district_zh || null,
      district_en: district_en || null,
      phone: phone || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[stores] POST error:", error.message);
    return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
  }

  return NextResponse.json({ store: data }, { status: 201 });
}
