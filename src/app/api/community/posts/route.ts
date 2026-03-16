import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost } from "@/lib/community-store";
import { getUserById } from "@/lib/user-store";
import { getMerchantBySlug } from "@/lib/merchant-store";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const authorId = url.searchParams.get("authorId") ?? undefined;
  const authorType = url.searchParams.get("authorType") as "user" | "merchant" | undefined;
  const wineSlug = url.searchParams.get("wineSlug") ?? undefined;
  const tag = url.searchParams.get("tag") ?? undefined;

  const { posts, total } = getAllPosts({ page, limit, authorId, authorType, wineSlug, tag });
  return NextResponse.json({ posts, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  // Check user or merchant session
  const userId = request.cookies.get("wb_user_session")?.value;
  const merchantSlug = request.cookies.get("wb_session")?.value;

  let authorId: string;
  let authorType: "user" | "merchant";
  let authorName: string;

  if (userId) {
    const user = getUserById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
    authorId = user.id;
    authorType = "user";
    authorName = user.name;
  } else if (merchantSlug && merchantSlug !== "admin") {
    const merchant = getMerchantBySlug(merchantSlug);
    if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 401 });
    authorId = merchant.slug;
    authorType = "merchant";
    authorName = merchant.name;
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, content, wineSlug, wineName, rating, tags } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const post = createPost({
    authorId,
    authorType,
    authorName,
    title: title.trim(),
    content: content.trim(),
    wineSlug,
    wineName,
    rating: rating ? Math.min(5, Math.max(1, Number(rating))) : undefined,
    tags: tags ?? [],
  });

  return NextResponse.json(post, { status: 201 });
}
