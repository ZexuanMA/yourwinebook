import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { createSupabaseServer } from "@/lib/supabase-server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return null;
  const account = await getMockAccount(slug);
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";

  const supabase = await createSupabaseServer();
  if (!supabase) {
    // No Supabase configured — return empty list
    return NextResponse.json({ reports: [] });
  }

  let query = supabase
    .from("reports")
    .select(`
      id,
      reporter_id,
      target_type,
      target_id,
      reason,
      details,
      status,
      resolved_by,
      resolved_at,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }

  return NextResponse.json({ reports: data ?? [] });
}
