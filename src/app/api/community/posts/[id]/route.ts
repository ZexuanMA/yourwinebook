import { NextRequest, NextResponse } from "next/server";
import { getPostById, updatePost, deletePost } from "@/lib/community-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = getPostById(id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.cookies.get("wb_user_session")?.value;
  const merchantSlug = request.cookies.get("wb_session")?.value;
  const authorId = userId ?? (merchantSlug !== "admin" ? merchantSlug : undefined);

  if (!authorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const post = updatePost(id, authorId, body);
  if (!post) return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.cookies.get("wb_user_session")?.value;
  const merchantSlug = request.cookies.get("wb_session")?.value;
  const authorId = userId ?? (merchantSlug !== "admin" ? merchantSlug : undefined);

  if (!authorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ok = deletePost(id, authorId);
  if (!ok) return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
