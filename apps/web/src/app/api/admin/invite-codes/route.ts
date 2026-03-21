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

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ codes: [], message: "Supabase not configured" });
  }

  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await request.json();
  const count = Math.min(body.count ?? 1, 20); // max 20 at a time
  const expiresInDays = body.expires_in_days ?? 30;

  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("invite_codes")
      .insert({
        code,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      continue; // Skip duplicates
    }
    codes.push(data);
  }

  return NextResponse.json({ codes, generated: codes.length }, { status: 201 });
}
