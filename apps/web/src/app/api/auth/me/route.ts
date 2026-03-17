import { NextRequest, NextResponse } from "next/server";
import { getMockAccount } from "@/lib/mock-auth";
import { USE_SUPABASE_AUTH, supabaseGetUser } from "@/lib/supabase-auth";

export async function GET(request: NextRequest) {
  if (USE_SUPABASE_AUTH) {
    const user = await supabaseGetUser();
    if (!user) return NextResponse.json(null, { status: 401 });

    // Map to the account shape expected by dashboard components
    return NextResponse.json({
      slug:
        user.role === "admin" ? "admin" : user.merchantSlug || user.id,
      name: user.displayName,
      email: user.email,
      role: user.role === "admin" ? "admin" : "merchant",
      status: user.status,
    });
  }

  // Legacy
  const slug = request.cookies.get("wb_session")?.value;
  if (!slug) return NextResponse.json(null, { status: 401 });
  const account = await getMockAccount(slug);
  if (!account) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(account);
}
