import { NextRequest, NextResponse } from "next/server";
import { toggleWineBookmark } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  const id = request.cookies.get("wb_user_session")?.value;
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wineSlug } = await request.json();
  if (!wineSlug) return NextResponse.json({ error: "Missing wineSlug" }, { status: 400 });

  const bookmarked = await toggleWineBookmark(id, wineSlug);
  return NextResponse.json({ bookmarked });
}
