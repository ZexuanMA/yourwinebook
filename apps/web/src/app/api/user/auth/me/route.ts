import { NextRequest, NextResponse } from "next/server";
import { getMockUser } from "@/lib/mock-users";
import { USE_SUPABASE_AUTH, supabaseGetUser } from "@/lib/supabase-auth";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  // ── Supabase Auth path ──
  if (USE_SUPABASE_AUTH) {
    const authUser = await supabaseGetUser();
    if (!authUser) return NextResponse.json(null, { status: 401 });

    // Fetch bookmarks
    const supabase = await createSupabaseServer();
    let bookmarks: string[] = [];
    let merchantBookmarks: string[] = [];

    if (supabase) {
      const { data: wb } = await supabase
        .from("wine_bookmarks")
        .select("wines(slug)")
        .eq("user_id", authUser.id);
      if (wb) {
        bookmarks = wb
          .map((r) => {
            const w = r.wines as unknown as { slug: string } | null;
            return w?.slug;
          })
          .filter(Boolean) as string[];
      }

      const { data: mb } = await supabase
        .from("merchant_bookmarks")
        .select("merchants(slug)")
        .eq("user_id", authUser.id);
      if (mb) {
        merchantBookmarks = mb
          .map((r) => {
            const m = r.merchants as unknown as { slug: string } | null;
            return m?.slug;
          })
          .filter(Boolean) as string[];
      }
    }

    return NextResponse.json({
      id: authUser.id,
      name: authUser.displayName,
      email: authUser.email,
      status: authUser.status,
      bookmarks,
      merchantBookmarks,
    });
  }

  // ── Legacy path ──
  const id = request.cookies.get("wb_user_session")?.value;
  if (!id) return NextResponse.json(null, { status: 401 });
  const user = getMockUser(id);
  if (!user) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(user);
}
