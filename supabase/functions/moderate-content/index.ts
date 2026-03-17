import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Action =
  | "hide_post"
  | "unhide_post"
  | "hide_comment"
  | "unhide_comment"
  | "ban_user"
  | "unban_user";

interface RequestBody {
  action: Action;
  target_id: string;
  reason?: string;
}

Deno.serve(async (req) => {
  // ── CORS preflight ──────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ── Auth: must be admin ─────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return json({ error: "Missing authorization header" }, 401);
  }

  const userClient = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  // Check admin role via profiles
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return json({ error: "Admin access required" }, 403);
  }

  // ── Parse body ──────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { action, target_id, reason } = body;

  if (!target_id) {
    return json({ error: "target_id is required" }, 400);
  }

  // ── Execute action ──────────────────────────────────────────
  switch (action) {
    case "hide_post": {
      const { error } = await admin
        .from("posts")
        .update({
          status: "hidden",
          hidden_at: new Date().toISOString(),
          hidden_reason: reason || "Moderation action",
        })
        .eq("id", target_id);

      if (error) return json({ error: "Failed to hide post" }, 500);
      return json({ ok: true, action: "post_hidden" });
    }

    case "unhide_post": {
      const { error } = await admin
        .from("posts")
        .update({ status: "visible", hidden_at: null, hidden_reason: null })
        .eq("id", target_id);

      if (error) return json({ error: "Failed to unhide post" }, 500);
      return json({ ok: true, action: "post_unhidden" });
    }

    case "hide_comment": {
      const { error } = await admin
        .from("comments")
        .update({ status: "hidden" })
        .eq("id", target_id);

      if (error) return json({ error: "Failed to hide comment" }, 500);
      return json({ ok: true, action: "comment_hidden" });
    }

    case "unhide_comment": {
      const { error } = await admin
        .from("comments")
        .update({ status: "visible" })
        .eq("id", target_id);

      if (error) return json({ error: "Failed to unhide comment" }, 500);
      return json({ ok: true, action: "comment_unhidden" });
    }

    case "ban_user": {
      const { error: banError } = await admin
        .from("profiles")
        .update({
          status: "banned",
          banned_at: new Date().toISOString(),
          ban_reason: reason || "Moderation action",
        })
        .eq("id", target_id);

      if (banError) return json({ error: "Failed to ban user" }, 500);

      // Hide all visible posts
      await admin
        .from("posts")
        .update({
          status: "hidden",
          hidden_at: new Date().toISOString(),
          hidden_reason: `User banned: ${reason || "Moderation action"}`,
        })
        .eq("author_id", target_id)
        .eq("status", "visible");

      // Hide all visible comments
      await admin
        .from("comments")
        .update({ status: "hidden" })
        .eq("author_id", target_id)
        .eq("status", "visible");

      return json({ ok: true, action: "user_banned" });
    }

    case "unban_user": {
      const { error: unbanError } = await admin
        .from("profiles")
        .update({ status: "active", banned_at: null, ban_reason: null })
        .eq("id", target_id);

      if (unbanError) return json({ error: "Failed to unban user" }, 500);
      return json({ ok: true, action: "user_unbanned" });
    }

    default:
      return json({ error: `Unknown action: ${action}` }, 400);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
