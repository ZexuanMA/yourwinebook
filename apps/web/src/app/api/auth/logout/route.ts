import { NextResponse } from "next/server";
import { USE_SUPABASE_AUTH, supabaseSignOut } from "@/lib/supabase-auth";

export async function POST() {
  if (USE_SUPABASE_AUTH) {
    await supabaseSignOut();
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("wb_session");
  response.cookies.delete("wb_role");
  return response;
}
