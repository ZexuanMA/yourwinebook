import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { createSupabaseServer } from "@/lib/supabase-server";
import { withErrorHandler } from "@/lib/api-response";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return null;
  const account = await getMockAccount(slug);
  if (!account || account.role !== "admin") return null;
  return account;
}

/**
 * GET /api/admin/content?type=post|comment&id=...
 * Returns the original content for a reported target.
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "type and id are required" },
      { status: 400 }
    );
  }

  if (type === "post") {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        status,
        is_official,
        like_count,
        comment_count,
        created_at,
        hidden_at,
        hidden_reason,
        author_id
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Also fetch media
    const { data: media } = await supabase
      .from("post_media")
      .select("url, mime_type, sort_order")
      .eq("post_id", id)
      .order("sort_order");

    return NextResponse.json({
      type: "post",
      content: data,
      media: media ?? [],
    });
  }

  if (type === "comment") {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        status,
        post_id,
        author_id,
        created_at
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      type: "comment",
      content: data,
    });
  }

  if (type === "user") {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        display_name,
        email,
        role,
        status,
        created_at
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      type: "user",
      content: data,
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
});
