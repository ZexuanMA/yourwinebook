/**
 * File-based persistent community store.
 * Reads/writes to data/community.json for posts, comments, likes.
 */

import fs from "fs";
import path from "path";

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

// ── Posts ──

export function getAllPosts(options?: {
  page?: number;
  limit?: number;
  authorId?: string;
  authorType?: "user" | "merchant";
  wineSlug?: string;
  tag?: string;
}): { posts: CommunityPost[]; total: number } {
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

export function getPostById(id: string): CommunityPost | null {
  const data = readStore();
  return data.posts.find((p) => p.id === id) ?? null;
}

export function createPost(input: {
  authorId: string;
  authorType: "user" | "merchant";
  authorName: string;
  title: string;
  content: string;
  wineSlug?: string;
  wineName?: string;
  rating?: number;
  tags?: string[];
}): CommunityPost {
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

export function updatePost(
  id: string,
  authorId: string,
  updates: { title?: string; content?: string; tags?: string[]; rating?: number }
): CommunityPost | null {
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

export function deletePost(id: string, authorId: string): boolean {
  const data = readStore();
  const idx = data.posts.findIndex((p) => p.id === id && p.authorId === authorId);
  if (idx === -1) return false;
  data.posts.splice(idx, 1);
  data.comments = data.comments.filter((c) => c.postId !== id);
  writeStore(data);
  return true;
}

export function toggleLike(postId: string, actorId: string): { liked: boolean; likeCount: number } | null {
  const data = readStore();
  const idx = data.posts.findIndex((p) => p.id === postId);
  if (idx === -1) return null;
  const likes = data.posts[idx].likes;
  const has = likes.includes(actorId);
  data.posts[idx].likes = has ? likes.filter((id) => id !== actorId) : [...likes, actorId];
  writeStore(data);
  return { liked: !has, likeCount: data.posts[idx].likes.length };
}

// ── Comments ──

export function getComments(postId: string): CommunityComment[] {
  const data = readStore();
  return data.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addComment(input: {
  postId: string;
  authorId: string;
  authorType: "user" | "merchant";
  authorName: string;
  content: string;
}): CommunityComment | null {
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

export function deleteComment(commentId: string, authorId: string): boolean {
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

// ── Stats ──

export function getUserStats(userId: string): { postCount: number; commentCount: number; likeReceived: number } {
  const data = readStore();
  const postCount = data.posts.filter((p) => p.authorId === userId).length;
  const commentCount = data.comments.filter((c) => c.authorId === userId).length;
  const likeReceived = data.posts
    .filter((p) => p.authorId === userId)
    .reduce((sum, p) => sum + p.likes.length, 0);
  return { postCount, commentCount, likeReceived };
}

export function getMerchantMentions(merchantSlug: string): CommunityPost[] {
  const data = readStore();
  // Posts that mention this merchant's wines (by checking wine prices)
  // For now, return posts where the wineSlug matches merchant wines
  return data.posts.filter(
    (p) => p.authorId === merchantSlug || p.tags.includes(merchantSlug)
  );
}
