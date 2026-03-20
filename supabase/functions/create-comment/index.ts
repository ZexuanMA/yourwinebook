import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Rate limit: max 10 comments per minute per user
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(userId, recent);
    return false;
  }
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

interface RequestBody {
  post_id: string;
  content: string;
  idempotency_key: string;
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

  // ── Auth ────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return json({ error: "Missing authorization header" }, 401);
  }

  const userClient = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userId = user.id;

  // ── Rate limit ──────────────────────────────────────────────
  if (!checkRateLimit(userId)) {
    return json({ error: "Too many comments. Please wait a moment." }, 429);
  }

  // ── Parse body ──────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { post_id, content, idempotency_key } = body;

  // ── Validate ────────────────────────────────────────────────
  if (!post_id || typeof post_id !== "string") {
    return json({ error: "post_id is required" }, 400);
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return json({ error: "Content is required" }, 400);
  }
  if (content.length > 1000) {
    return json({ error: "Comment must be 1000 characters or less" }, 400);
  }
  if (!idempotency_key || typeof idempotency_key !== "string") {
    return json({ error: "idempotency_key is required" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Idempotency check ───────────────────────────────────────
  const { data: existing } = await admin
    .from("comments")
    .select("id, content, created_at, author_id")
    .eq("idempotency_key", idempotency_key)
    .eq("author_id", userId)
    .maybeSingle();

  if (existing) {
    // Return the existing comment (idempotent response)
    return json({ comment: existing, deduplicated: true });
  }

  // ── Verify post exists and is visible ───────────────────────
  const { data: postRow, error: postErr } = await admin
    .from("posts")
    .select("id")
    .eq("id", post_id)
    .eq("status", "visible")
    .maybeSingle();

  if (postErr || !postRow) {
    return json({ error: "Post not found or not visible" }, 404);
  }

  // ── Insert comment ──────────────────────────────────────────
  const { data: comment, error: insertErr } = await admin
    .from("comments")
    .insert({
      post_id,
      author_id: userId,
      content: content.trim(),
      idempotency_key,
    })
    .select("id, content, created_at, author_id")
    .single();

  if (insertErr) {
    console.error("Comment insert error:", insertErr);
    return json({ error: "Failed to create comment" }, 500);
  }

  // ── Increment comment_count on post (atomic via RPC) ──
  const { error: countErr } = await admin.rpc("increment_comment_count", {
    p_post_id: post_id,
  });

  if (countErr) {
    // Non-fatal: comment is created, count will be eventually consistent
    console.error("Comment count increment error:", countErr);
  }

  // ── Fetch author profile for response ───────────────────────
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", userId)
    .single();

  return json({
    comment: {
      ...comment,
      author_name: profile?.display_name ?? "",
      author_avatar: profile?.avatar_url ?? null,
    },
    deduplicated: false,
  });
});

// ── Helpers ─────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
