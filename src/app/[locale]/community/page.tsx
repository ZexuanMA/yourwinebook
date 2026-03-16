"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import {
  Heart,
  MessageCircle,
  Plus,
  Wine,
  Star,
  Store,
  User,
  Filter,
} from "lucide-react";

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
}

interface UserProfile {
  id: string;
  name: string;
}

const TAG_OPTIONS = [
  { value: "紅酒", label_zh: "紅酒", label_en: "Red Wine" },
  { value: "白酒", label_zh: "白酒", label_en: "White Wine" },
  { value: "氣泡酒", label_zh: "氣泡酒", label_en: "Sparkling" },
  { value: "粉紅酒", label_zh: "粉紅酒", label_en: "Rosé" },
  { value: "日常自飲", label_zh: "日常自飲", label_en: "Everyday" },
  { value: "送禮", label_zh: "送禮", label_en: "Gifting" },
  { value: "聚餐", label_zh: "聚餐", label_en: "Dinner" },
  { value: "求推薦", label_zh: "求推薦", label_en: "Seeking Recs" },
  { value: "知識分享", label_zh: "知識分享", label_en: "Knowledge" },
  { value: "新手友善", label_zh: "新手友善", label_en: "Beginner" },
];

export default function CommunityPage() {
  const locale = useLocale();
  const isZh = locale === "zh-HK";
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterType, setFilterType] = useState<"" | "user" | "merchant">("");
  const limit = 10;

  useEffect(() => {
    fetch("/api/user/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => null);
  }, []);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filterTag) params.set("tag", filterTag);
    if (filterType) params.set("authorType", filterType);
    fetch(`/api/community/posts?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.posts);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));
  }, [page, filterTag, filterType]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
    if (res.ok) {
      const { liked } = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes: liked ? [...p.likes, user.id] : p.likes.filter((id) => id !== user.id) }
            : p
        )
      );
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return isZh ? `${mins} 分鐘前` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isZh ? `${hours} 小時前` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return isZh ? `${days} 天前` : `${days}d ago`;
    return d.toLocaleDateString(locale);
  };

  return (
    <div className="bg-bg min-h-screen pt-24 pb-20">
      <div className="max-w-[860px] mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text">
              {isZh ? "酒友社區" : "Wine Community"}
            </h1>
            <p className="text-sm text-text-sub mt-1">
              {isZh ? "分享品酒心得，發現更多好酒" : "Share tasting notes, discover great wines"}
            </p>
          </div>
          <Link
            href="/community/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isZh ? "發佈動態" : "New Post"}
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setFilterType(""); setFilterTag(""); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              !filterTag && !filterType
                ? "bg-wine text-white border-wine"
                : "bg-white text-text-sub border-wine-border hover:border-gold"
            }`}
          >
            {isZh ? "全部" : "All"}
          </button>
          <button
            onClick={() => { setFilterType(filterType === "user" ? "" : "user"); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              filterType === "user"
                ? "bg-wine text-white border-wine"
                : "bg-white text-text-sub border-wine-border hover:border-gold"
            }`}
          >
            <User className="w-3 h-3" /> {isZh ? "用戶動態" : "Users"}
          </button>
          <button
            onClick={() => { setFilterType(filterType === "merchant" ? "" : "merchant"); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              filterType === "merchant"
                ? "bg-wine text-white border-wine"
                : "bg-white text-text-sub border-wine-border hover:border-gold"
            }`}
          >
            <Store className="w-3 h-3" /> {isZh ? "酒商動態" : "Merchants"}
          </button>
          <div className="w-px bg-wine-border mx-1" />
          {TAG_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setFilterTag(filterTag === t.value ? "" : t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                filterTag === t.value
                  ? "bg-gold text-white border-gold"
                  : "bg-white text-text-sub border-wine-border hover:border-gold"
              }`}
            >
              {isZh ? t.label_zh : t.label_en}
            </button>
          ))}
        </div>

        {/* Post list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-wine-border rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-bg-card rounded w-2/3 mb-3" />
                <div className="h-4 bg-bg-card rounded w-full mb-2" />
                <div className="h-4 bg-bg-card rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-wine-border rounded-2xl py-20 text-center">
            <Filter className="w-10 h-10 text-text-sub/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-text mb-1">
              {isZh ? "暫時還沒有動態" : "No posts yet"}
            </p>
            <p className="text-xs text-text-sub">
              {isZh ? "成為第一個分享的人" : "Be the first to share"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white border border-wine-border rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                {/* Author row */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                      post.authorType === "merchant" ? "bg-green" : "bg-wine"
                    }`}
                  >
                    {post.authorName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text">
                        {post.authorName}
                      </span>
                      {post.authorType === "merchant" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green/10 text-green rounded-full text-[10px] font-semibold">
                          <Store className="w-2.5 h-2.5" />
                          {isZh ? "酒商" : "Merchant"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-sub">{formatDate(post.createdAt)}</p>
                  </div>
                </div>

                {/* Title + content */}
                <Link href={`/community/${post.id}`} className="block group">
                  <h2 className="text-base font-semibold text-text group-hover:text-wine transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-text-sub leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </Link>

                {/* Wine reference + rating */}
                {post.wineSlug && (
                  <Link
                    href={`/wines/${post.wineSlug}`}
                    className="flex items-center gap-2 mt-3 px-3 py-2 bg-bg-card rounded-xl text-sm hover:bg-bg transition-colors"
                  >
                    <Wine className="w-4 h-4 text-wine" />
                    <span className="text-text font-medium">{post.wineName}</span>
                    {post.rating && (
                      <span className="flex items-center gap-0.5 ml-auto text-gold text-xs font-semibold">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < post.rating! ? "fill-gold text-gold" : "text-wine-border"}`}
                          />
                        ))}
                      </span>
                    )}
                  </Link>
                )}

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
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

                {/* Actions */}
                <div className="flex items-center gap-5 mt-4 pt-3 border-t border-wine-border/50">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer bg-transparent border-none ${
                      user && post.likes.includes(user.id)
                        ? "text-wine font-medium"
                        : "text-text-sub hover:text-wine"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${user && post.likes.includes(user.id) ? "fill-wine" : ""}`}
                    />
                    {post.likes.length}
                  </button>
                  <Link
                    href={`/community/${post.id}`}
                    className="flex items-center gap-1.5 text-sm text-text-sub hover:text-wine transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {post.commentCount}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-wine-border rounded-xl text-sm text-text-sub hover:border-gold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isZh ? "上一頁" : "Prev"}
            </button>
            <span className="text-sm text-text-sub">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-wine-border rounded-xl text-sm text-text-sub hover:border-gold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isZh ? "下一頁" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
