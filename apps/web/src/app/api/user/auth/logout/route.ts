import { NextResponse } from "next/server";
import { USE_SUPABASE_AUTH, supabaseSignOut } from "@/lib/supabase-auth";

export async function POST() {
  if (USE_SUPABASE_AUTH) {
    await supabaseSignOut();
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("wb_user_session");
  return res;
}
