import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost } from "@/lib/community-store";
import { getUserById } from "@/lib/user-store";
import { getMerchantBySlug } from "@/lib/merchant-store";
import { checkRateLimit, getClientIp, POST_CREATE_RATE_LIMIT } from "@/lib/rate-limit";
import { communityPostsQuerySchema, createPostSchema, searchParamsToObject } from "@/lib/api-validation";
import { apiError, withErrorHandler } from "@/lib/api-response";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const raw = searchParamsToObject(request.nextUrl.searchParams);
  const parsed = communityPostsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("invalid_input", 400, request);
  }
  const { page, limit, authorId, authorType, wineSlug, tag } = parsed.data;

  const { posts, total } = await getAllPosts({ page, limit, authorId, authorType, wineSlug, tag });
  return NextResponse.json({ posts, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`post-create:${ip}`, POST_CREATE_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many posts. Please wait." }, { status: 429 });
  }

  // Check user or merchant session
  const userId = request.cookies.get("wb_user_session")?.value;
  const merchantSlug = request.cookies.get("wb_session")?.value;

  let authorId: string;
  let authorType: "user" | "merchant";
  let authorName: string;

  if (merchantSlug && merchantSlug !== "admin") {
    // B-side official post: validate merchant staff permission
    const merchant = await getMerchantBySlug(merchantSlug);
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 401 });
    }
    if (merchant.status !== "active") {
      return NextResponse.json(
        { error: "Merchant account is not active. Only active merchants can publish official posts." },
        { status: 403 }
      );
    }
    authorId = merchant.slug;
    authorType = "merchant";
    authorName = merchant.name;
  } else if (userId) {
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
    authorId = user.id;
    authorType = "user";
    authorName = user.name;
  } else {
    // Admin or unauthenticated — reject
    return NextResponse.json({ error: "Unauthorized. Only merchant staff or users can post." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalid_input", 400, request);
  }
  const { title, content, wineSlug, wineName, rating, tags } = parsed.data;

  const post = await createPost({
    authorId,
    authorType,
    authorName,
    title: title.trim(),
    content: content.trim(),
    wineSlug,
    wineName,
    rating,
    tags,
  });

  return NextResponse.json(post, { status: 201 });
});
