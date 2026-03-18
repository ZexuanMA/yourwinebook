/**
 * Community store — file-based (legacy) or Supabase (when USE_SUPABASE_AUTH=true).
 *
 * In Supabase mode, posts/comments/likes map to relational tables with JOINs.
 * The adapter layer converts Supabase results back to CommunityPost/CommunityComment
 * so existing API routes and frontend pages require minimal changes.
 *
 * Author ID convention (both modes):
 *   - Users: profile UUID (in Supabase mode) or legacy ID (e.g. "u1")
 *   - Merchants: merchant slug (e.g. "watsons-wine")
 * The Supabase adapter resolves slugs to profile UUIDs for DB operations.
 */

import fs from "fs";
import path from "path";
import { USE_SUPABASE_AUTH } from "./supabase-auth";
import { createSupabaseServer } from "./supabase-server";

export interface CommunityPost {
  id: string;
  authorId: string;
  authorType: "user" | "merchant";
  authorName: string;
  title: string;
  content: string;
  wineSlug?: string;
  wineName?: string;
  rating?: number; // 1-5
  tags: string[];
  likes: string[]; // user/merchant IDs
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorType: "user" | "merchant";
  authorName: string;
  content: string;
  createdAt: string;
}

// ── Legacy file-based helpers ────────────────────────────────

interface CommunityData {
  posts: CommunityPost[];
  comments: CommunityComment[];
}

const DATA_FILE = path.join(process.cwd(), "data", "community.json");

function readStore(): CommunityData {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as CommunityData;
  } catch {
    return { posts: [], comments: [] };
  }
}

function writeStore(data: CommunityData): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[community-store] write error:", err);
  }
}

// ── Supabase helpers ─────────────────────────────────────────

/**
 * Resolve a Web-facing authorId to a Supabase profile UUID.
 * - Users: authorId is already the profile UUID → return as-is.
 * - Merchants: authorId is the merchant slug → look up merchant_staff profile_id.
 */
async function resolveProfileId(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServer>>>,
  authorId: string,
  authorType: "user" | "merchant"
): Promise<string | null> {
  if (authorType === "user") return authorId;

  // Merchant: slug → merchant → merchant_staff → profile_id
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("slug", authorId)
    .single();
  if (!merchant) return null;

  const { data: staff } = await supabase
    .from("merchant_staff")
    .select("profile_id")
    .eq("merchant_id", merchant.id)
    .limit(1)
    .single();

  return staff?.profile_id ?? null;
}

/**
 * Convert a Supabase profile UUID back to a Web-facing authorId.
 * - Users: return the UUID.
 * - Merchant staff: return the merchant slug.
 */
function toWebAuthorId(
  profileId: string,
  role: string,
  merchantSlug?: string | null
): string {
  if (role === "merchant_staff" && merchantSlug) return merchantSlug;
  return profileId;
}

interface SupaPostRow {
  id: string;
  author_id: string;
  content: string;
  title: string | null;
  tags: string[];
  rating: number | null;
  is_official: boolean;
  like_count: number;
  comment_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: { display_name: string; role: string } | null;
  merchant_staff?: { merchants: { slug: string } | null }[] | null;
}

function adaptPost(
  row: SupaPostRow,
  likes: string[],
  wine?: { slug: string; name_en: string } | null
): CommunityPost {
  const role = row.profiles?.role ?? "user";
  const merchantSlug =
    role === "merchant_staff"
      ? (row.merchant_staff?.[0]?.merchants as { slug: string } | null)?.slug
      : undefined;

  return {
    id: row.id,
    authorId: toWebAuthorId(row.author_id, role, merchantSlug),
    authorType: role === "merchant_staff" ? "merchant" : "user",
    authorName: row.profiles?.display_name ?? "Unknown",
    title: row.title ?? "",
    content: row.content,
    wineSlug: wine?.slug,
    wineName: wine?.name_en,
    rating: row.rating ?? undefined,
    tags: row.tags ?? [],
    likes,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Posts ────────────────────────────────────────────────────

export async function getAllPosts(options?: {
  page?: number;
  limit?: number;
  authorId?: string;
  authorType?: "user" | "merchant";
  wineSlug?: string;
  tag?: string;
}): Promise<{ posts: CommunityPost[]; total: number }> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      // Pre-filter by wineSlug: query post_products → wines to get matching
      // post IDs *before* the main posts query. This avoids fetching all posts
      // and filtering post-query (O(N) scan).
      let wineSlugPostIds: string[] | undefined;
      if (options?.wineSlug) {
        const { data: ppMatches } = await supabase
          .from("post_products")
          .select("post_id, wines!inner(slug)")
          .eq("wines.slug", options.wineSlug);
        wineSlugPostIds = ppMatches?.map((pp) => pp.post_id) ?? [];
        if (wineSlugPostIds.length === 0) {
          return { posts: [], total: 0 };
        }
      }

      // Build the query
      let query = supabase
        .from("posts")
        .select(
          "id, author_id, content, title, tags, rating, is_official, like_count, comment_count, status, created_at, updated_at, profiles!posts_author_id_fkey(display_name, role)",
          { count: "exact" }
        )
        .eq("status", "visible")
        .order("created_at", { ascending: false });

      // Filter by wineSlug (pre-resolved post IDs)
      if (wineSlugPostIds) {
        query = query.in("id", wineSlugPostIds);
      }

      // Filter by author
      if (options?.authorId) {
        // Resolve authorId to profile UUID if needed
        if (options.authorType === "merchant" || (options.authorId && !options.authorId.includes("-"))) {
          // Might be a merchant slug — try resolving
          const profileId = await resolveProfileId(
            supabase,
            options.authorId,
            options.authorType ?? "merchant"
          );
          if (profileId) {
            query = query.eq("author_id", profileId);
          } else {
            // Try as direct UUID
            query = query.eq("author_id", options.authorId);
          }
        } else {
          query = query.eq("author_id", options.authorId);
        }
      }

      // Filter by authorType
      if (options?.authorType === "merchant") {
        query = query.eq("is_official", true);
      } else if (options?.authorType === "user") {
        query = query.eq("is_official", false);
      }

      // Filter by tag
      if (options?.tag) {
        query = query.contains("tags", [options.tag]);
      }

      // Pagination
      const page = options?.page ?? 1;
      const limit = options?.limit ?? 20;
      const start = (page - 1) * limit;
      query = query.range(start, start + limit - 1);

      const { data: rows, count } = await query;
      if (!rows) return { posts: [], total: 0 };

      const postIds = rows.map((r) => r.id);

      // Batch: get merchant_staff for role resolution
      const { data: staffRows } = await supabase
        .from("merchant_staff")
        .select("profile_id, merchants(slug)")
        .in(
          "profile_id",
          rows.map((r) => r.author_id)
        );
      const staffMap = new Map<string, string>();
      if (staffRows) {
        for (const s of staffRows) {
          const m = s.merchants as unknown as { slug: string } | null;
          if (m?.slug) staffMap.set(s.profile_id, m.slug);
        }
      }

      // Batch: get likes
      const { data: likeRows } = await supabase
        .from("post_likes")
        .select("post_id, user_id")
        .in("post_id", postIds);
      const likesMap = new Map<string, string[]>();
      if (likeRows) {
        for (const l of likeRows) {
          if (!likesMap.has(l.post_id)) likesMap.set(l.post_id, []);
          likesMap.get(l.post_id)!.push(l.user_id);
        }
      }

      // Batch: get wine references
      const { data: ppRows } = await supabase
        .from("post_products")
        .select("post_id, wines(slug, name_en)")
        .in("post_id", postIds);
      const wineMap = new Map<string, { slug: string; name_en: string }>();
      if (ppRows) {
        for (const pp of ppRows) {
          if (!wineMap.has(pp.post_id)) {
            const w = pp.wines as unknown as { slug: string; name_en: string } | null;
            if (w) wineMap.set(pp.post_id, w);
          }
        }
      }

      const posts = rows.map((row) => {
        const role = (row.profiles as unknown as { display_name: string; role: string } | null)?.role ?? "user";
        const merchantSlug = role === "merchant_staff" ? staffMap.get(row.author_id) : undefined;
        const adapted: SupaPostRow = {
          ...row,
          profiles: row.profiles as unknown as { display_name: string; role: string } | null,
          merchant_staff: merchantSlug
            ? [{ merchants: { slug: merchantSlug } }]
            : undefined,
        };
        return adaptPost(
          adapted,
          likesMap.get(row.id) ?? [],
          wineMap.get(row.id)
        );
      });

      return { posts, total: count ?? 0 };
    }
  }

  // Legacy
  const data = readStore();
  let posts = [...data.posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (options?.authorId) {
    posts = posts.filter((p) => p.authorId === options.authorId);
  }
  if (options?.authorType) {
    posts = posts.filter((p) => p.authorType === options.authorType);
  }
  if (options?.wineSlug) {
    posts = posts.filter((p) => p.wineSlug === options.wineSlug);
  }
  if (options?.tag) {
    posts = posts.filter((p) => p.tags.includes(options.tag!));
  }

  const total = posts.length;
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const start = (page - 1) * limit;
  posts = posts.slice(start, start + limit);

  return { posts, total };
}

export async function getPostById(id: string): Promise<CommunityPost | null> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      const { data: row } = await supabase
        .from("posts")
        .select(
          "id, author_id, content, title, tags, rating, is_official, like_count, comment_count, status, created_at, updated_at, profiles!posts_author_id_fkey(display_name, role)"
        )
        .eq("id", id)
        .eq("status", "visible")
        .single();
      if (!row) return null;

      // Get merchant staff slug
      const role = (row.profiles as unknown as { display_name: string; role: string } | null)?.role ?? "user";
      let merchantSlug: string | undefined;
      if (role === "merchant_staff") {
        const { data: staff } = await supabase
          .from("merchant_staff")
          .select("merchants(slug)")
          .eq("profile_id", row.author_id)
          .single();
        const m = staff?.merchants as unknown as { slug: string } | null;
        merchantSlug = m?.slug;
      }

      // Get likes
      const { data: likeRows } = await supabase
        .from("post_likes")
        .select("user_id")
        .eq("post_id", id);
      const likes = likeRows?.map((l) => l.user_id) ?? [];

      // Get wine reference
      const { data: ppRow } = await supabase
        .from("post_products")
        .select("wines(slug, name_en)")
        .eq("post_id", id)
        .limit(1)
        .maybeSingle();
      const wine = ppRow?.wines as unknown as { slug: string; name_en: string } | null;

      const adapted: SupaPostRow = {
        ...row,
        profiles: row.profiles as unknown as { display_name: string; role: string } | null,
        merchant_staff: merchantSlug ? [{ merchants: { slug: merchantSlug } }] : undefined,
      };
      return adaptPost(adapted, likes, wine);
    }
  }

  // Legacy
  const data = readStore();
  return data.posts.find((p) => p.id === id) ?? null;
}

export async function createPost(input: {
  authorId: string;
  authorType: "user" | "merchant";
  authorName: string;
  title: string;
  content: string;
  wineSlug?: string;
  wineName?: string;
  rating?: number;
  tags?: string[];
}): Promise<CommunityPost> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      // Resolve author profile UUID
      const profileId = await resolveProfileId(supabase, input.authorId, input.authorType);
      if (!profileId) throw new Error("Author not found");

      // Determine merchant_id for official posts
      let merchantId: string | undefined;
      if (input.authorType === "merchant") {
        const { data: merchant } = await supabase
          .from("merchants")
          .select("id")
          .eq("slug", input.authorId)
          .single();
        merchantId = merchant?.id;
      }

      const { data: row, error } = await supabase
        .from("posts")
        .insert({
          author_id: profileId,
          content: input.content,
          title: input.title,
          tags: input.tags ?? [],
          rating: input.rating ?? null,
          is_official: input.authorType === "merchant",
          merchant_id: merchantId ?? null,
        })
        .select("id, author_id, content, title, tags, rating, is_official, like_count, comment_count, status, created_at, updated_at")
        .single();

      if (error || !row) throw new Error(error?.message ?? "Failed to create post");

      // Link wine reference if provided
      let wine: { slug: string; name_en: string } | undefined;
      if (input.wineSlug) {
        const { data: wineRow } = await supabase
          .from("wines")
          .select("id, slug, name_en")
          .eq("slug", input.wineSlug)
          .single();
        if (wineRow) {
          await supabase
            .from("post_products")
            .insert({ post_id: row.id, wine_id: wineRow.id });
          wine = { slug: wineRow.slug, name_en: wineRow.name_en };
        }
      }

      return {
        id: row.id,
        authorId: input.authorId,
        authorType: input.authorType,
        authorName: input.authorName,
        title: input.title,
        content: input.content,
        wineSlug: wine?.slug ?? input.wineSlug,
        wineName: wine?.name_en ?? input.wineName,
        rating: input.rating,
        tags: input.tags ?? [],
        likes: [],
        commentCount: 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
  }

  // Legacy
  const data = readStore();
  const now = new Date().toISOString();
  const post: CommunityPost = {
    id: `p${Date.now()}`,
    authorId: input.authorId,
    authorType: input.authorType,
    authorName: input.authorName,
    title: input.title,
    content: input.content,
    wineSlug: input.wineSlug,
    wineName: input.wineName,
    rating: input.rating,
    tags: input.tags ?? [],
    likes: [],
    commentCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  data.posts.unshift(post);
  writeStore(data);
  return post;
}

export async function updatePost(
  id: string,
  authorId: string,
  updates: { title?: string; content?: string; tags?: string[]; rating?: number }
): Promise<CommunityPost | null> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      // Verify ownership: resolve authorId if needed
      const { data: existing } = await supabase
        .from("posts")
        .select("author_id, profiles!posts_author_id_fkey(role)")
        .eq("id", id)
        .single();
      if (!existing) return null;

      const role = (existing.profiles as unknown as { role: string } | null)?.role;
      const isMerchant = role === "merchant_staff";

      // Check if the caller is the author
      if (isMerchant) {
        // authorId is merchant slug; resolve and compare
        const profileId = await resolveProfileId(supabase, authorId, "merchant");
        if (profileId !== existing.author_id) return null;
      } else {
        if (authorId !== existing.author_id) return null;
      }

      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.rating !== undefined) updateData.rating = updates.rating;

      await supabase.from("posts").update(updateData).eq("id", id);

      // Return updated post
      return getPostById(id);
    }
  }

  // Legacy
  const data = readStore();
  const idx = data.posts.findIndex((p) => p.id === id && p.authorId === authorId);
  if (idx === -1) return null;
  if (updates.title !== undefined) data.posts[idx].title = updates.title;
  if (updates.content !== undefined) data.posts[idx].content = updates.content;
  if (updates.tags !== undefined) data.posts[idx].tags = updates.tags;
  if (updates.rating !== undefined) data.posts[idx].rating = updates.rating;
  data.posts[idx].updatedAt = new Date().toISOString();
  writeStore(data);
  return data.posts[idx];
}

export async function deletePost(id: string, authorId: string): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      // Verify ownership
      const { data: existing } = await supabase
        .from("posts")
        .select("author_id, profiles!posts_author_id_fkey(role)")
        .eq("id", id)
        .single();
      if (!existing) return false;

      const role = (existing.profiles as unknown as { role: string } | null)?.role;
      if (role === "merchant_staff") {
        const profileId = await resolveProfileId(supabase, authorId, "merchant");
        if (profileId !== existing.author_id) return false;
      } else {
        if (authorId !== existing.author_id) return false;
      }

      // Soft delete (set status to 'deleted')
      const { error } = await supabase
        .from("posts")
        .update({ status: "deleted" })
        .eq("id", id);
      return !error;
    }
  }

  // Legacy
  const data = readStore();
  const idx = data.posts.findIndex((p) => p.id === id && p.authorId === authorId);
  if (idx === -1) return false;
  data.posts.splice(idx, 1);
  data.comments = data.comments.filter((c) => c.postId !== id);
  writeStore(data);
  return true;
}

export async function toggleLike(
  postId: string,
  actorId: string
): Promise<{ liked: boolean; likeCount: number } | null> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      // Check post exists
      const { data: post } = await supabase
        .from("posts")
        .select("id, like_count")
        .eq("id", postId)
        .eq("status", "visible")
        .single();
      if (!post) return null;

      // Check if already liked
      const { data: existing } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", actorId)
        .maybeSingle();

      if (existing) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", actorId);
        // Refresh count
        const { count } = await supabase
          .from("post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);
        return { liked: false, likeCount: count ?? 0 };
      } else {
        // Like
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: actorId });
        const { count } = await supabase
          .from("post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);
        return { liked: true, likeCount: count ?? 0 };
      }
    }
  }

  // Legacy
  const data = readStore();
  const idx = data.posts.findIndex((p) => p.id === postId);
  if (idx === -1) return null;
  const likes = data.posts[idx].likes;
  const has = likes.includes(actorId);
  data.posts[idx].likes = has ? likes.filter((id) => id !== actorId) : [...likes, actorId];
  writeStore(data);
  return { liked: !has, likeCount: data.posts[idx].likes.length };
}

// ── Comments ────────────────────────────────────────────────

export async function getComments(postId: string): Promise<CommunityComment[]> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      const { data: rows } = await supabase
        .from("comments")
        .select("id, post_id, author_id, content, status, created_at, profiles!comments_author_id_fkey(display_name, role)")
        .eq("post_id", postId)
        .eq("status", "visible")
        .order("created_at", { ascending: true });
      if (!rows) return [];

      // Batch resolve merchant slugs
      const authorIds = rows.map((r) => r.author_id);
      const { data: staffRows } = await supabase
        .from("merchant_staff")
        .select("profile_id, merchants(slug)")
        .in("profile_id", authorIds);
      const staffMap = new Map<string, string>();
      if (staffRows) {
        for (const s of staffRows) {
          const m = s.merchants as unknown as { slug: string } | null;
          if (m?.slug) staffMap.set(s.profile_id, m.slug);
        }
      }

      return rows.map((row) => {
        const profile = row.profiles as unknown as { display_name: string; role: string } | null;
        const role = profile?.role ?? "user";
        const merchantSlug = role === "merchant_staff" ? staffMap.get(row.author_id) : undefined;
        return {
          id: row.id,
          postId: row.post_id,
          authorId: toWebAuthorId(row.author_id, role, merchantSlug),
          authorType: (role === "merchant_staff" ? "merchant" : "user") as "user" | "merchant",
          authorName: profile?.display_name ?? "Unknown",
          content: row.content,
          createdAt: row.created_at,
        };
      });
    }
  }

  // Legacy
  const data = readStore();
  return data.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function addComment(input: {
  postId: string;
  authorId: string;
  authorType: "user" | "merchant";
  authorName: string;
  content: string;
}): Promise<CommunityComment | null> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      // Verify post exists
      const { data: post } = await supabase
        .from("posts")
        .select("id")
        .eq("id", input.postId)
        .eq("status", "visible")
        .single();
      if (!post) return null;

      // Resolve author profile UUID
      const profileId = await resolveProfileId(supabase, input.authorId, input.authorType);
      if (!profileId) return null;

      const { data: row, error } = await supabase
        .from("comments")
        .insert({
          post_id: input.postId,
          author_id: profileId,
          content: input.content,
        })
        .select("id, post_id, author_id, content, created_at")
        .single();

      if (error || !row) return null;

      return {
        id: row.id,
        postId: row.post_id,
        authorId: input.authorId,
        authorType: input.authorType,
        authorName: input.authorName,
        content: row.content,
        createdAt: row.created_at,
      };
    }
  }

  // Legacy
  const data = readStore();
  const postIdx = data.posts.findIndex((p) => p.id === input.postId);
  if (postIdx === -1) return null;
  const comment: CommunityComment = {
    id: `c${Date.now()}`,
    postId: input.postId,
    authorId: input.authorId,
    authorType: input.authorType,
    authorName: input.authorName,
    content: input.content,
    createdAt: new Date().toISOString(),
  };
  data.comments.push(comment);
  data.posts[postIdx].commentCount = data.comments.filter((c) => c.postId === input.postId).length;
  writeStore(data);
  return comment;
}

export async function deleteComment(commentId: string, authorId: string): Promise<boolean> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      // Verify ownership — need to resolve authorId
      const { data: existing } = await supabase
        .from("comments")
        .select("author_id, profiles!comments_author_id_fkey(role)")
        .eq("id", commentId)
        .single();
      if (!existing) return false;

      const role = (existing.profiles as unknown as { role: string } | null)?.role;
      if (role === "merchant_staff") {
        const profileId = await resolveProfileId(supabase, authorId, "merchant");
        if (profileId !== existing.author_id) return false;
      } else {
        if (authorId !== existing.author_id) return false;
      }

      // Soft delete
      const { error } = await supabase
        .from("comments")
        .update({ status: "deleted" })
        .eq("id", commentId);
      return !error;
    }
  }

  // Legacy
  const data = readStore();
  const idx = data.comments.findIndex((c) => c.id === commentId && c.authorId === authorId);
  if (idx === -1) return false;
  const postId = data.comments[idx].postId;
  data.comments.splice(idx, 1);
  const postIdx = data.posts.findIndex((p) => p.id === postId);
  if (postIdx !== -1) {
    data.posts[postIdx].commentCount = data.comments.filter((c) => c.postId === postId).length;
  }
  writeStore(data);
  return true;
}

// ── Stats ───────────────────────────────────────────────────

export async function getUserStats(
  userId: string
): Promise<{ postCount: number; commentCount: number; likeReceived: number }> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      const { count: postCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .eq("status", "visible");

      const { count: commentCount } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .eq("status", "visible");

      // Sum like_count from user's posts
      const { data: userPosts } = await supabase
        .from("posts")
        .select("like_count")
        .eq("author_id", userId)
        .eq("status", "visible");
      const likeReceived = userPosts?.reduce((sum, p) => sum + p.like_count, 0) ?? 0;

      return {
        postCount: postCount ?? 0,
        commentCount: commentCount ?? 0,
        likeReceived,
      };
    }
  }

  // Legacy
  const data = readStore();
  const postCount = data.posts.filter((p) => p.authorId === userId).length;
  const commentCount = data.comments.filter((c) => c.authorId === userId).length;
  const likeReceived = data.posts
    .filter((p) => p.authorId === userId)
    .reduce((sum, p) => sum + p.likes.length, 0);
  return { postCount, commentCount, likeReceived };
}

export async function getMerchantMentions(merchantSlug: string): Promise<CommunityPost[]> {
  if (USE_SUPABASE_AUTH) {
    const supabase = await createSupabaseServer();
    if (supabase) {
      // Resolve merchant slug to staff profile UUID
      const profileId = await resolveProfileId(supabase, merchantSlug, "merchant");
      if (!profileId) return [];

      const { posts } = await getAllPosts({ authorId: merchantSlug, authorType: "merchant", limit: 50 });
      return posts;
    }
  }

  // Legacy
  const data = readStore();
  return data.posts.filter(
    (p) => p.authorId === merchantSlug || p.tags.includes(merchantSlug)
  );
}
