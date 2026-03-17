import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Rate limits ──────────────────────────────────────────────
const MAX_INTENTS_PER_HOUR = 30; // per user
const MAX_FILES_PER_REQUEST = 9;

// ── Allowed buckets & their constraints ──────────────────────
const BUCKET_CONFIG: Record<
  string,
  { maxSize: number; mimeTypes: string[] }
> = {
  posts: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ],
  },
  avatars: {
    maxSize: 2 * 1024 * 1024, // 2 MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  merchants: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  },
};

interface FileIntent {
  mime_type: string;
  size_bytes: number;
  filename?: string;
}

interface RequestBody {
  bucket: string;
  files: FileIntent[];
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

  // ── Auth: extract user from JWT ─────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return json({ error: "Missing authorization header" }, 401);
  }

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  // Create a client using the user's JWT to get their identity
  const userClient = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userId = user.id;

  // ── Parse body ──────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { bucket, files } = body;

  // ── Validate bucket ─────────────────────────────────────────
  const config = BUCKET_CONFIG[bucket];
  if (!config) {
    return json(
      { error: `Invalid bucket. Allowed: ${Object.keys(BUCKET_CONFIG).join(", ")}` },
      400
    );
  }

  // ── Validate files array ────────────────────────────────────
  if (!Array.isArray(files) || files.length === 0) {
    return json({ error: "files must be a non-empty array" }, 400);
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return json(
      { error: `Maximum ${MAX_FILES_PER_REQUEST} files per request` },
      400
    );
  }

  // ── Validate each file ──────────────────────────────────────
  for (const file of files) {
    if (!file.mime_type || !config.mimeTypes.includes(file.mime_type)) {
      return json(
        {
          error: `Invalid mime_type "${file.mime_type}". Allowed: ${config.mimeTypes.join(", ")}`,
        },
        400
      );
    }
    if (typeof file.size_bytes !== "number" || file.size_bytes <= 0) {
      return json({ error: "size_bytes must be a positive number" }, 400);
    }
    if (file.size_bytes > config.maxSize) {
      return json(
        {
          error: `File too large. Maximum ${config.maxSize / (1024 * 1024)} MB for ${bucket}`,
        },
        400
      );
    }
  }

  // ── Rate limit: count recent intents ────────────────────────
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("media_uploads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo);

  if (countError) {
    return json({ error: "Rate limit check failed" }, 500);
  }

  if ((count ?? 0) + files.length > MAX_INTENTS_PER_HOUR) {
    return json(
      {
        error: `Rate limit exceeded. Maximum ${MAX_INTENTS_PER_HOUR} uploads per hour.`,
      },
      429
    );
  }

  // ── Create upload intents ───────────────────────────────────
  const intents = [];

  for (const file of files) {
    const uploadId = crypto.randomUUID();
    const ext = mimeToExt(file.mime_type);
    const path = `${userId}/${uploadId}.${ext}`;

    // Insert media_upload record
    const { data: record, error: insertError } = await admin
      .from("media_uploads")
      .insert({
        id: uploadId,
        user_id: userId,
        bucket,
        path,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        status: "pending",
      })
      .select("id, path, bucket, expires_at")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return json({ error: "Failed to create upload intent" }, 500);
    }

    // Generate signed upload URL (valid for 1 hour to match expires_at)
    const { data: signedUrl, error: signError } = await admin.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (signError) {
      console.error("Sign error:", signError);
      // Clean up the record we just inserted
      await admin.from("media_uploads").delete().eq("id", uploadId);
      return json({ error: "Failed to generate upload URL" }, 500);
    }

    intents.push({
      id: record.id,
      path: record.path,
      bucket: record.bucket,
      upload_url: signedUrl.signedUrl,
      token: signedUrl.token,
      expires_at: record.expires_at,
    });
  }

  return json({ intents });
});

// ── Helpers ─────────────────────────────────────────────────

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? "bin";
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
