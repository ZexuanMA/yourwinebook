import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createStoreSchema } from "@/lib/api-validation";
import { apiError, withErrorHandler } from "@/lib/api-response";

async function getMerchantAccount() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return null;
  const account = await getMockAccount(slug);
  if (!account || account.role !== "merchant") return null;
  return account;
}

export const GET = withErrorHandler(async (_request: NextRequest) => {
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

  // Extract lat/lng from PostGIS geography column
  const storesWithCoords = (stores ?? []).map((s) => {
    let lat: number | null = null;
    let lng: number | null = null;
    if (s.location) {
      // PostGIS returns GeoJSON: { type: "Point", coordinates: [lng, lat] }
      const loc = typeof s.location === "string" ? JSON.parse(s.location) : s.location;
      if (loc?.coordinates) {
        lng = loc.coordinates[0];
        lat = loc.coordinates[1];
      }
    }
    return { ...s, lat, lng };
  });

  return NextResponse.json({ stores: storesWithCoords });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
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
  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalid_input", 400, request);
  }
  const { name, address_zh, address_en, district_zh, district_en, phone, hours, lat, lng } = parsed.data;

  const row: Record<string, unknown> = {
    merchant_id: merchant.id,
    name,
    address_zh,
    address_en: address_en || null,
    district_zh: district_zh || null,
    district_en: district_en || null,
    phone: phone || null,
  };
  if (hours !== undefined) row.hours = hours;
  if (lat != null && lng != null) {
    row.location = `SRID=4326;POINT(${lng} ${lat})`;
  }

  const { data, error } = await sb
    .from("merchant_locations")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("[stores] POST error:", error.message);
    return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
  }

  return NextResponse.json({ store: data }, { status: 201 });
});
