"use client";

import { useEffect, useState, use } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import {
  Heart,
  MessageCircle,
  ArrowLeft,
  Wine,
  Star,
  Store,
  Send,
  Trash2,
} from "lucide-react";
import { getDisplayInitial, normalizeDisplayName } from "@/lib/display-name";

interface Post {
  id: string;
  authorId: string;
  authorType: "user" | "merchant";
  authorName: string;
  title: string;
  content: string;
  wineSlug?: string;
  wineName?: string;
  rating?: number;
  tags: string[];
  likes: string[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorType: "user" | "merchant";
  authorName: string;
  content: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const isZh = locale === "zh-HK";
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/user/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          setUser(null);
          return;
        }

        setUser({
          id: data.id,
          name: normalizeDisplayName(data.name),
        });
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/community/posts/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/community/posts/${id}/comments`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([p, c]) => {
        setPost(p);
        setComments(c);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user || !post) return;
    const res = await fetch(`/api/community/posts/${post.id}/like`, { method: "POST" });
    if (res.ok) {
      const { liked } = await res.json();
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likes: liked
                ? [...prev.likes, user.id]
                : prev.likes.filter((lid) => lid !== user.id),
            }
          : prev
      );
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
        setPost((prev) => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm(isZh ? "確定要刪除這篇動態嗎？" : "Delete this post?")) return;
    const res = await fetch(`/api/community/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) router.push("/community");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(isZh ? "確定要刪除這條評論嗎？" : "Delete this comment?")) return;
    const res = await fetch(`/api/community/posts/${id}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev) => prev ? { ...prev, commentCount: prev.commentCount - 1 } : prev);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="bg-bg min-h-screen pt-24 pb-20">
        <div className="max-w-[760px] mx-auto px-6 animate-pulse space-y-4">
          <div className="h-8 bg-bg-card rounded w-1/3" />
          <div className="h-48 bg-bg-card rounded-2xl" />
          <div className="h-32 bg-bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-bg min-h-screen pt-24 pb-20">
        <div className="max-w-[760px] mx-auto px-6 text-center py-20">
          <p className="text-lg font-medium text-text mb-2">
            {isZh ? "找不到這篇動態" : "Post not found"}
          </p>
          <Link href="/community" className="text-sm text-wine hover:underline">
            {isZh ? "返回社區" : "Back to community"}
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && post.authorId === user.id;

  return (
    <div className="bg-bg min-h-screen pt-24 pb-20">
      <div className="max-w-[760px] mx-auto px-6">
        {/* Back */}
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-text-sub hover:text-wine transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isZh ? "返回社區" : "Back to community"}
        </Link>

        {/* Post */}
        <article className="bg-white border border-wine-border rounded-2xl p-6 md:p-8">
          {/* Author */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                post.authorType === "merchant" ? "bg-green" : "bg-wine"
              }`}
            >
              {getDisplayInitial(post.authorName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text">{post.authorName}</span>
                {post.authorType === "merchant" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green/10 text-green rounded-full text-[10px] font-semibold">
                    <Store className="w-2.5 h-2.5" />
                    {isZh ? "酒商" : "Merchant"}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-sub">{formatDate(post.createdAt)}</p>
            </div>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="p-2 text-text-sub hover:text-wine transition-colors cursor-pointer bg-transparent border-none"
                title={isZh ? "刪除" : "Delete"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <h1 className="text-xl font-bold text-text mb-4">{post.title}</h1>
          <div className="text-sm text-text leading-relaxed whitespace-pre-wrap mb-5">
            {post.content}
          </div>

          {/* Wine reference */}
          {post.wineSlug && (
            <Link
              href={`/wines/${post.wineSlug}`}
              className="flex items-center gap-2 px-4 py-3 bg-bg-card rounded-xl text-sm hover:bg-bg transition-colors mb-4"
            >
              <Wine className="w-4 h-4 text-wine" />
              <span className="text-text font-medium">{post.wineName}</span>
              {post.rating && (
                <span className="flex items-center gap-0.5 ml-auto">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < post.rating! ? "fill-gold text-gold" : "text-wine-border"}`}
                    />
                  ))}
                </span>
              )}
            </Link>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 bg-bg-card text-text-sub rounded-full text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Like button */}
          <div className="flex items-center gap-5 pt-4 border-t border-wine-border/50">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer bg-transparent border-none ${
                user && post.likes.includes(user.id)
                  ? "text-wine font-medium"
                  : "text-text-sub hover:text-wine"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${user && post.likes.includes(user.id) ? "fill-wine" : ""}`}
              />
              {post.likes.length} {isZh ? "個讚" : "likes"}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-text-sub">
              <MessageCircle className="w-4 h-4" />
              {comments.length} {isZh ? "條評論" : "comments"}
            </span>
          </div>
        </article>

        {/* Comments */}
        <div className="mt-6">
          <h2 className="text-base font-semibold text-text mb-4">
            {isZh ? `評論 (${comments.length})` : `Comments (${comments.length})`}
          </h2>

          {comments.length === 0 && (
            <div className="bg-white border border-wine-border rounded-2xl py-10 text-center mb-4">
              <MessageCircle className="w-8 h-8 text-text-sub/30 mx-auto mb-2" />
              <p className="text-sm text-text-sub">
                {isZh ? "還沒有評論，來說兩句？" : "No comments yet. Be the first!"}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-wine-border rounded-xl px-5 py-4"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${
                      c.authorType === "merchant" ? "bg-green" : "bg-wine"
                    }`}
                  >
                    {getDisplayInitial(c.authorName)}
                  </div>
                  <span className="text-sm font-semibold text-text">{c.authorName}</span>
                  {c.authorType === "merchant" && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green/10 text-green rounded-full text-[9px] font-semibold">
                      <Store className="w-2 h-2" />
                      {isZh ? "酒商" : "Merchant"}
                    </span>
                  )}
                  <span className="text-xs text-text-sub ml-auto">{formatDate(c.createdAt)}</span>
                  {user && c.authorId === user.id && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="p-1 text-text-sub/40 hover:text-wine transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-text leading-relaxed pl-9">
                  {c.content}
                </p>
              </div>
            ))}
          </div>

          {/* Comment form */}
          {user ? (
            <form onSubmit={handleComment} className="mt-4 flex gap-3">
              <div className="w-8 h-8 bg-wine rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                {getDisplayInitial(user.name)}
              </div>
              <div className="flex-1 relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isZh ? "寫下你的評論..." : "Write a comment..."}
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all resize-none pr-12"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="absolute right-3 bottom-3 p-2 bg-wine text-white rounded-lg hover:bg-wine-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 bg-bg-card rounded-xl p-4 text-center">
              <p className="text-sm text-text-sub">
                <Link href="/account/login" className="text-wine font-medium hover:underline">
                  {isZh ? "登入" : "Sign in"}
                </Link>
                {isZh ? " 後即可評論" : " to leave a comment"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
