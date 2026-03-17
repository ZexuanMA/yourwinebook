import { NextRequest, NextResponse } from "next/server";
import { toggleMerchantBookmark } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  const id = request.cookies.get("wb_user_session")?.value;
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { merchantSlug } = await request.json();
  if (!merchantSlug) return NextResponse.json({ error: "Missing merchantSlug" }, { status: 400 });

  const bookmarked = await toggleMerchantBookmark(id, merchantSlug);
  return NextResponse.json({ bookmarked });
}
