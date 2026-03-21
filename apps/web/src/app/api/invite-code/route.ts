import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

/**
 * GET /api/invite-code?code=XXXX — validate an invite code
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ valid: false, error: "Code required" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    // If Supabase not configured, allow all registrations (legacy mode)
    return NextResponse.json({ valid: true });
  }

  const { data, error } = await supabase
    .from("invite_codes")
    .select("id, code, used_by, expires_at")
    .eq("code", code.toUpperCase())
    .is("used_by", null)
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, error: "Invalid or used invite code" });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "Invite code has expired" });
  }

  return NextResponse.json({ valid: true });
}
