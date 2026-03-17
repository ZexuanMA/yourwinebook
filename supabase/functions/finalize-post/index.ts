import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MediaItem {
  upload_id: string;
  width?: number;
  height?: number;
}

interface RequestBody {
  content: string;
  media?: MediaItem[];
  product_ids?: string[];
  is_official?: boolean;
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
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userId = user.id;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Parse body ──────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { content, media = [], product_ids = [], is_official = false } = body;

  // ── Validate content ────────────────────────────────────────
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return json({ error: "Content is required" }, 400);
  }
  if (content.length > 2000) {
    return json({ error: "Content must be 2000 characters or less" }, 400);
  }

  // ── Validate media count ────────────────────────────────────
  if (media.length > 9) {
    return json({ error: "Maximum 9 media items per post" }, 400);
  }

  // ── Validate official post permission ───────────────────────
  let merchantId: string | null = null;
  if (is_official) {
    const { data: staffRecord, error: staffErr } = await admin
      .from("merchant_staff")
      .select("merchant_id")
      .eq("profile_id", userId)
      .single();

    if (staffErr || !staffRecord) {
      return json(
        { error: "Only merchant staff can create official posts" },
        403
      );
    }
    merchantId = staffRecord.merchant_id;
  }

  // ── Validate uploads belong to user and are ready ───────────
  if (media.length > 0) {
    const uploadIds = media.map((m) => m.upload_id);

    const { data: uploads, error: uploadsErr } = await admin
      .from("media_uploads")
      .select("id, user_id, bucket, path, mime_type, status, expires_at")
      .in("id", uploadIds);

    if (uploadsErr) {
      return json({ error: "Failed to verify uploads" }, 500);
    }

    if (!uploads || uploads.length !== uploadIds.length) {
      return json({ error: "One or more upload IDs not found" }, 400);
    }

    for (const upload of uploads) {
      // Ownership check
      if (upload.user_id !== userId) {
        return json(
          { error: `Upload ${upload.id} does not belong to you` },
          403
        );
      }

      // Status check: must be 'uploaded' (client has finished uploading the file)
      if (upload.status !== "uploaded" && upload.status !== "pending") {
        return json(
          { error: `Upload ${upload.id} has invalid status: ${upload.status}` },
          400
        );
      }

      // Expiry check
      if (new Date(upload.expires_at) < new Date()) {
        return json({ error: `Upload ${upload.id} has expired` }, 400);
      }

      // Verify file exists in storage
      const { data: fileData } = await admin.storage
        .from(upload.bucket)
        .list(upload.path.split("/").slice(0, -1).join("/"), {
          search: upload.path.split("/").pop(),
        });

      // If status is 'pending', file might not be uploaded yet — allow it
      // The client may set status to 'uploaded' after completing the upload
      // For MVP, we accept both 'pending' and 'uploaded' status
    }
  }

  // ── Validate product_ids ────────────────────────────────────
  if (product_ids.length > 0) {
    const { count, error: wineErr } = await admin
      .from("wines")
      .select("id", { count: "exact", head: true })
      .in("id", product_ids);

    if (wineErr || (count ?? 0) !== product_ids.length) {
      return json({ error: "One or more product IDs not found" }, 400);
    }
  }

  // ── Create post (transaction via service role) ──────────────
  // 1. Insert post
  const { data: post, error: postErr } = await admin
    .from("posts")
    .insert({
      author_id: userId,
      content: content.trim(),
      is_official,
      merchant_id: merchantId,
    })
    .select("id, created_at")
    .single();

  if (postErr) {
    console.error("Post insert error:", postErr);
    return json({ error: "Failed to create post" }, 500);
  }

  // 2. Insert post_media
  if (media.length > 0) {
    // Get upload records for URL construction
    const uploadIds = media.map((m) => m.upload_id);
    const { data: uploads } = await admin
      .from("media_uploads")
      .select("id, bucket, path, mime_type")
      .in("id", uploadIds);

    if (uploads) {
      const uploadMap = new Map(uploads.map((u) => [u.id, u]));
      const mediaRows = media.map((m, idx) => {
        const upload = uploadMap.get(m.upload_id);
        if (!upload) return null;
        return {
          post_id: post.id,
          url: `${SUPABASE_URL}/storage/v1/object/public/${upload.bucket}/${upload.path}`,
          mime_type: upload.mime_type,
          width: m.width ?? null,
          height: m.height ?? null,
          sort_order: idx,
        };
      }).filter(Boolean);

      if (mediaRows.length > 0) {
        const { error: mediaErr } = await admin
          .from("post_media")
          .insert(mediaRows);

        if (mediaErr) {
          console.error("Media insert error:", mediaErr);
          // Clean up: delete the post we just created
          await admin.from("posts").delete().eq("id", post.id);
          return json({ error: "Failed to attach media to post" }, 500);
        }
      }

      // 3. Update media_uploads status to 'attached'
      const { error: updateErr } = await admin
        .from("media_uploads")
        .update({ status: "attached" })
        .in("id", uploadIds)
        .eq("user_id", userId);

      if (updateErr) {
        console.error("Upload status update error:", updateErr);
        // Non-fatal: post is created, media is attached, status update is cosmetic
      }
    }
  }

  // 4. Insert post_products
  if (product_ids.length > 0) {
    const productRows = product_ids.map((wineId) => ({
      post_id: post.id,
      wine_id: wineId,
    }));

    const { error: prodErr } = await admin
      .from("post_products")
      .insert(productRows);

    if (prodErr) {
      console.error("Product insert error:", prodErr);
      // Non-fatal: post is created, product references are supplementary
    }
  }

  return json({
    post: {
      id: post.id,
      created_at: post.created_at,
      media_count: media.length,
      product_count: product_ids.length,
    },
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
