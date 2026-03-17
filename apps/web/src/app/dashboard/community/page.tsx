"use client";

import { useEffect, useState, useCallback } from "react";
import { useDashboardLang } from "@/lib/dashboard-lang-context";
import { getDisplayInitial } from "@/lib/display-name";
import {
  Plus,
  Heart,
  MessageCircle,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Store,
  Star,
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

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorType: "user" | "merchant";
  authorName: string;
  content: string;
  createdAt: string;
}

interface Account {
  slug: string;
  name: string;
  role: "admin" | "merchant";
}

export default function DashboardCommunityPage() {
  const { t } = useDashboardLang();
  const [account, setAccount] = useState<Account | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  // New post form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccount);
  }, []);

  const fetchPosts = useCallback(() => {
    if (!account) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/community/posts?authorId=${account.slug}&limit=50`).then((r) => r.json()),
      fetch(`/api/community/posts?limit=20`).then((r) => r.json()),
    ])
      .then(([mine, all]) => {
        setMyPosts(mine.posts ?? []);
        setAllPosts(all.posts ?? []);
      })
      .finally(() => setLoading(false));
  }, [account]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const toggleExpand = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!postComments[postId]) {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      if (res.ok) {
        const comments = await res.json();
        setPostComments((prev) => ({ ...prev, [postId]: comments }));
      }
    }
  };

  const handleReply = async (postId: string) => {
    const text = replyText[postId]?.trim();
    if (!text || submittingReply) return;
    setSubmittingReply(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const comment = await res.json();
        setPostComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] ?? []), comment],
        }));
        setReplyText((prev) => ({ ...prev, [postId]: "" }));
        // Update comment count
        const updateCount = (posts: Post[]) =>
          posts.map((p) => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p);
        setMyPosts(updateCount);
        setAllPosts(updateCount);
      }
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm(t("community.confirmDelete"))) return;
    const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      setAllPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handleNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          tags: newTags,
        }),
      });
      if (res.ok) {
        const post = await res.json();
        setMyPosts((prev) => [post, ...prev]);
        setAllPosts((prev) => [post, ...prev]);
        setNewTitle("");
        setNewContent("");
        setNewTags([]);
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-HK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const totalLikes = myPosts.reduce((sum, p) => sum + p.likes.length, 0);
  const totalComments = myPosts.reduce((sum, p) => sum + p.commentCount, 0);

  const tagOptions = ["推薦", "新品", "春季", "活動", "品鑑會", "知識分享", "新手指南"];

  const inputCls =
    "w-full px-4 py-2.5 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all";

  const posts = activeTab === "mine" ? myPosts : allPosts;

  return (
    <div className="p-6 md:p-8 max-w-[960px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold text-text">{t("community.title")}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" />
          {t("community.newPost")}
        </button>
      </div>
      <p className="text-sm text-text-sub mb-6">{t("community.subtitle")}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-wine-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-wine">{myPosts.length}</p>
          <p className="text-xs text-text-sub mt-1">{t("community.totalPosts")}</p>
        </div>
        <div className="bg-white border border-wine-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-wine">{totalLikes}</p>
          <p className="text-xs text-text-sub mt-1">{t("community.totalLikes")}</p>
        </div>
        <div className="bg-white border border-wine-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-wine">{totalComments}</p>
          <p className="text-xs text-text-sub mt-1">{t("community.totalComments")}</p>
        </div>
      </div>

      {/* New post form */}
      {showForm && (
        <div className="bg-white border border-wine-border rounded-2xl p-6 mb-6">
          <form onSubmit={handleNewPost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("community.title") === "社區互動" ? "標題" : "Title"}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("community.title") === "社區互動" ? "例如：本週精選推薦" : "e.g. Weekly picks"}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t("community.title") === "社區互動" ? "內容" : "Content"}
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={t("community.title") === "社區互動" ? "分享推薦、活動資訊、選酒知識..." : "Share recommendations, events, wine knowledge..."}
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t("community.title") === "社區互動" ? "標籤" : "Tags"}
              </label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setNewTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      newTags.includes(tag)
                        ? "bg-wine text-white border-wine"
                        : "bg-white text-text-sub border-wine-border hover:border-gold"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-text-sub border border-wine-border rounded-xl hover:border-gold transition-colors cursor-pointer bg-transparent"
              >
                {t("community.title") === "社區互動" ? "取消" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim() || !newContent.trim() || submitting}
                className="px-5 py-2 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none"
              >
                {submitting
                  ? (t("community.title") === "社區互動" ? "發佈中..." : "Publishing...")
                  : (t("community.title") === "社區互動" ? "發佈" : "Publish")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex gap-1 mb-5 bg-white border border-wine-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("mine")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-none ${
            activeTab === "mine" ? "bg-wine text-white" : "text-text-sub hover:text-text bg-transparent"
          }`}
        >
          {t("community.myPosts")} ({myPosts.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-none ${
            activeTab === "all" ? "bg-wine text-white" : "text-text-sub hover:text-text bg-transparent"
          }`}
        >
          {t("community.mentions")}
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-wine-border rounded-2xl p-5 h-32" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-wine-border rounded-2xl py-16 text-center">
          <MessageCircle className="w-10 h-10 text-text-sub/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-text mb-1">{t("community.noPosts")}</p>
          <p className="text-xs text-text-sub">{t("community.noPostsHint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-wine-border rounded-2xl overflow-hidden"
            >
              <div className="p-5">
                {/* Author & meta */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                      post.authorType === "merchant" ? "bg-green" : "bg-wine"
                    }`}
                  >
                    {getDisplayInitial(post.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-text">{post.authorName}</span>
                      {post.authorType === "merchant" && (
                        <Store className="w-3 h-3 text-green" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-sub">{formatDate(post.createdAt)}</p>
                  </div>
                  {account && post.authorId === account.slug && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-text-sub/40 hover:text-wine transition-colors cursor-pointer bg-transparent border-none"
                      title={t("community.delete")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-text mb-1.5">{post.title}</h3>
                <p className="text-xs text-text-sub leading-relaxed line-clamp-3 mb-3">
                  {post.content}
                </p>

                {post.rating && (
                  <div className="flex items-center gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < post.rating! ? "fill-gold text-gold" : "text-wine-border"}`}
                      />
                    ))}
                  </div>
                )}

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-bg-card text-text-sub rounded-full text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 text-xs text-text-sub">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> {post.likes.length}
                  </span>
                  <button
                    onClick={() => toggleExpand(post.id)}
                    className="flex items-center gap-1 text-xs text-text-sub hover:text-wine transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}
                    {expandedPost === post.id ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded comments */}
              {expandedPost === post.id && (
                <div className="border-t border-wine-border bg-bg-card/50 p-5">
                  {(postComments[post.id] ?? []).length === 0 ? (
                    <p className="text-xs text-text-sub text-center py-3">
                      {t("community.title") === "社區互動" ? "暫無評論" : "No comments"}
                    </p>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {(postComments[post.id] ?? []).map((c) => (
                        <div key={c.id} className="flex gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5 ${
                              c.authorType === "merchant" ? "bg-green" : "bg-wine"
                            }`}
                          >
                            {getDisplayInitial(c.authorName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-text">{c.authorName}</span>
                              {c.authorType === "merchant" && (
                                <Store className="w-2.5 h-2.5 text-green" />
                              )}
                              <span className="text-[10px] text-text-sub ml-auto">{formatDate(c.createdAt)}</span>
                            </div>
                            <p className="text-xs text-text-sub mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText[post.id] ?? ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder={t("community.title") === "社區互動" ? "回覆..." : "Reply..."}
                      onKeyDown={(e) => e.key === "Enter" && handleReply(post.id)}
                      className="flex-1 px-3 py-2 bg-white border border-wine-border rounded-lg text-xs outline-none focus:border-gold transition-all"
                    />
                    <button
                      onClick={() => handleReply(post.id)}
                      disabled={!(replyText[post.id]?.trim()) || submittingReply === post.id}
                      className="p-2 bg-wine text-white rounded-lg hover:bg-wine-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
