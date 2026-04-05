import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { createSupabaseServer } from "@/lib/supabase-server";
import { moderateSchema } from "@/lib/api-validation";
import { apiError, withErrorHandler } from "@/lib/api-response";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return null;
  const account = await getMockAccount(slug);
  if (!account || account.role !== "admin") return null;
  return account;
}

/**
 * POST /api/admin/moderate
 * Actions: hide_post, unhide_post, hide_comment, unhide_comment
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
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

  const body = await request.json();
  const parsed = moderateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalid_input", 400, request);
  }
  const { action, target_id, reason } = parsed.data;

  switch (action) {
    case "hide_post": {
      const { error } = await supabase
        .from("posts")
        .update({
          status: "hidden",
          hidden_at: new Date().toISOString(),
          hidden_reason: reason || "Moderation action",
        })
        .eq("id", target_id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to hide post" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, action: "post_hidden" });
    }

    case "unhide_post": {
      const { error } = await supabase
        .from("posts")
        .update({
          status: "visible",
          hidden_at: null,
          hidden_reason: null,
        })
        .eq("id", target_id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to unhide post" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, action: "post_unhidden" });
    }

    case "hide_comment": {
      const { error } = await supabase
        .from("comments")
        .update({ status: "hidden" })
        .eq("id", target_id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to hide comment" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, action: "comment_hidden" });
    }

    case "unhide_comment": {
      const { error } = await supabase
        .from("comments")
        .update({ status: "visible" })
        .eq("id", target_id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to unhide comment" },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, action: "comment_unhidden" });
    }

    case "ban_user": {
      // Update profile status
      const { error: banError } = await supabase
        .from("profiles")
        .update({
          status: "banned",
          banned_at: new Date().toISOString(),
          ban_reason: reason || "Moderation action",
        })
        .eq("id", target_id);

      if (banError) {
        return NextResponse.json(
          { error: "Failed to ban user" },
          { status: 500 }
        );
      }

      // Hide all visible posts by this user
      await supabase
        .from("posts")
        .update({
          status: "hidden",
          hidden_at: new Date().toISOString(),
          hidden_reason: `User banned: ${reason || "Moderation action"}`,
        })
        .eq("author_id", target_id)
        .eq("status", "visible");

      // Hide all visible comments by this user
      await supabase
        .from("comments")
        .update({ status: "hidden" })
        .eq("author_id", target_id)
        .eq("status", "visible");

      return NextResponse.json({ ok: true, action: "user_banned" });
    }

    case "unban_user": {
      const { error: unbanError } = await supabase
        .from("profiles")
        .update({
          status: "active",
          banned_at: null,
          ban_reason: null,
        })
        .eq("id", target_id);

      if (unbanError) {
        return NextResponse.json(
          { error: "Failed to unban user" },
          { status: 500 }
        );
      }

      // Note: hidden posts are NOT automatically restored — admin must manually unhide
      return NextResponse.json({ ok: true, action: "user_unbanned" });
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
  }
});
