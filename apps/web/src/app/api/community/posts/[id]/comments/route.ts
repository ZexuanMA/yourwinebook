import { NextRequest, NextResponse } from "next/server";
import { getComments, addComment } from "@/lib/community-store";
import { getUserById } from "@/lib/user-store";
import { getMerchantBySlug } from "@/lib/merchant-store";
import { checkRateLimit, getClientIp, COMMENT_RATE_LIMIT } from "@/lib/rate-limit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await getComments(id);
  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`comment:${ip}`, COMMENT_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many comments. Please wait." }, { status: 429 });
  }

  const { id } = await params;
  const userId = request.cookies.get("wb_user_session")?.value;
  const merchantSlug = request.cookies.get("wb_session")?.value;

  let authorId: string;
  let authorType: "user" | "merchant";
  let authorName: string;

  if (userId) {
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
    authorId = user.id;
    authorType = "user";
    authorName = user.name;
  } else if (merchantSlug && merchantSlug !== "admin") {
    const merchant = await getMerchantBySlug(merchantSlug);
    if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 401 });
    authorId = merchant.slug;
    authorType = "merchant";
    authorName = merchant.name;
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await request.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const comment = await addComment({
    postId: id,
    authorId,
    authorType,
    authorName,
    content: content.trim(),
  });

  if (!comment) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json(comment, { status: 201 });
}
