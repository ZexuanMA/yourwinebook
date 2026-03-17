import { NextRequest, NextResponse } from "next/server";
import { toggleLike } from "@/lib/community-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.cookies.get("wb_user_session")?.value;
  const merchantSlug = request.cookies.get("wb_session")?.value;
  const actorId = userId ?? (merchantSlug !== "admin" ? merchantSlug : undefined);

  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = toggleLike(id, actorId);
  if (!result) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json(result);
}
