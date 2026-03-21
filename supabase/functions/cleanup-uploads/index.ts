import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Shared secret to prevent unauthorized invocation
const CLEANUP_SECRET = Deno.env.get("CLEANUP_SECRET") || "cleanup-default-secret";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Verify secret (simple auth for cron jobs)
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (token !== CLEANUP_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Find expired pending uploads (expired > 1 hour ago to be safe)
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: expired, error: queryError } = await client
    .from("media_uploads")
    .select("id, bucket, path")
    .eq("status", "pending")
    .lt("expires_at", cutoff)
    .limit(100);

  if (queryError) {
    return json({ error: "Query failed", details: queryError.message }, 500);
  }

  if (!expired || expired.length === 0) {
    return json({ cleaned: 0, message: "No expired uploads found" });
  }

  let storageDeleted = 0;
  let dbDeleted = 0;
  const errors: string[] = [];

  // Group by bucket for batch storage deletion
  const byBucket: Record<string, string[]> = {};
  for (const record of expired) {
    if (!byBucket[record.bucket]) byBucket[record.bucket] = [];
    byBucket[record.bucket].push(record.path);
  }

  // Delete storage files per bucket
  for (const [bucket, paths] of Object.entries(byBucket)) {
    const { error: storageError } = await client.storage
      .from(bucket)
      .remove(paths);

    if (storageError) {
      errors.push(`Storage delete failed for ${bucket}: ${storageError.message}`);
    } else {
      storageDeleted += paths.length;
    }
  }

  // Delete DB records
  const expiredIds = expired.map((r) => r.id);
  const { error: deleteError, count } = await client
    .from("media_uploads")
    .delete()
    .in("id", expiredIds);

  if (deleteError) {
    errors.push(`DB delete failed: ${deleteError.message}`);
  } else {
    dbDeleted = count ?? expiredIds.length;
  }

  return json({
    cleaned: dbDeleted,
    storage_deleted: storageDeleted,
    errors: errors.length > 0 ? errors : undefined,
  });
});
