"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { LogOut, Bookmark, User, Settings, Eye, EyeOff, CheckCircle, Store, MessageSquare, Heart, MessageCircle, Trash2 } from "lucide-react";
import { merchants } from "@/lib/mock-data";
import type { Wine } from "@/lib/mock-data";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  status: string;
  preferredLang: string;
  joinDate: string;
  bookmarks: string[];
  merchantBookmarks: string[];
}

interface CommunityPost {
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

type Tab = "bookmarks" | "merchantBookmarks" | "posts" | "profile" | "security";

export default function UserAccountPage() {
  const router = useRouter();
  const locale = useLocale();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("bookmarks");
  const [allWines, setAllWines] = useState<Wine[]>([]);
  const [myPosts, setMyPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Profile form
  const [name, setName] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Password form
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    // Read tab from URL query
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab && ["bookmarks", "merchantBookmarks", "posts", "profile", "security"].includes(urlTab)) {
      setTab(urlTab as Tab);
    }

    fetch("/api/user/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (!u) { router.push("/account/login"); return; }
        setUser(u);
        setName(u.name);
      })
      .finally(() => setLoading(false));
    fetch("/api/wines?limit=100")
      .then((r) => (r.ok ? r.json() : { wines: [] }))
      .then((d) => setAllWines(d.wines));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/user/auth/logout", { method: "POST" });
    router.push("/account/login");
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise((r) => setTimeout(r, 600));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (!pw.current) { setPwError("請輸入當前密碼"); return; }
    if (pw.next.length < 6) { setPwError("新密碼至少 6 個字符"); return; }
    if (pw.next !== pw.confirm) { setPwError("兩次密碼不一致"); return; }
    try {
      const res = await fetch("/api/user/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error ?? "密碼修改失敗"); return; }
      setPwSaved(true);
      setPw({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 3000);
    } catch {
      setPwError("網絡錯誤，請稍後重試");
    }
  };

  if (loading) return (
    <div className="max-w-[1120px] mx-auto px-6 pt-28 pb-20 animate-pulse space-y-4">
      <div className="h-32 bg-bg-card rounded-2xl" />
      <div className="h-64 bg-bg-card rounded-2xl" />
    </div>
  );

  if (!user) return null;

  const bookmarkedWines = allWines.filter((w) => user.bookmarks.includes(w.slug));
  const bookmarkedMerchants = merchants.filter((m) => (user.merchantBookmarks ?? []).includes(m.slug));

  // Fetch user posts when posts tab is selected
  useEffect(() => {
    if (tab === "posts" && user && myPosts.length === 0) {
      setPostsLoading(true);
      fetch(`/api/community/posts?authorId=${user.id}&limit=50`)
        .then((r) => r.json())
        .then((d) => setMyPosts(d.posts ?? []))
        .finally(() => setPostsLoading(false));
    }
  }, [tab, user, myPosts.length]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("確定要刪除這篇動態嗎？")) return;
    const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "今天";
    if (days < 7) return `${days} 天前`;
    return d.toLocaleDateString("zh-HK");
  };

  const totalLikesReceived = myPosts.reduce((sum, p) => sum + p.likes.length, 0);
  const totalCommentsReceived = myPosts.reduce((sum, p) => sum + p.commentCount, 0);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "bookmarks",         label: `收藏酒款 (${bookmarkedWines.length})`,     icon: <Bookmark className="w-4 h-4" /> },
    { key: "merchantBookmarks", label: `收藏酒商 (${bookmarkedMerchants.length})`, icon: <Store    className="w-4 h-4" /> },
    { key: "posts",             label: `我的動態 (${myPosts.length})`,              icon: <MessageSquare className="w-4 h-4" /> },
    { key: "profile",           label: "個人資料",                                  icon: <User     className="w-4 h-4" /> },
    { key: "security",          label: "安全設置",                                  icon: <Settings className="w-4 h-4" /> },
  ];

  const inputCls = "w-full px-4 py-2.5 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all";

  return (
    <div className="bg-bg min-h-screen pt-24 pb-20">
      <div className="max-w-[1120px] mx-auto px-6">

        {/* Profile header */}
        <div className="bg-white border border-wine-border rounded-2xl p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-wine rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-text">{user.name}</h1>
            <p className="text-sm text-text-sub mt-0.5">{user.email}</p>
            <p className="text-xs text-text-sub/60 mt-1">
              加入於 {new Date(user.joinDate).toLocaleDateString("zh-HK")} · {bookmarkedWines.length} 款酒 · {bookmarkedMerchants.length} 家酒商 · {myPosts.length} 篇動態
            </p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-sub border border-wine-border rounded-xl hover:border-gold hover:text-text transition-all cursor-pointer bg-transparent">
            <LogOut className="w-4 h-4" /> 登出
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-wine-border rounded-2xl p-1.5 w-fit">
          {tabs.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                tab === key ? "bg-wine text-white shadow-sm" : "text-text-sub hover:text-text"
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Bookmarks */}
        {tab === "bookmarks" && (
          <div>
            {bookmarkedWines.length === 0 ? (
              <div className="bg-white border border-wine-border rounded-2xl py-20 text-center">
                <p className="text-4xl mb-3">🍷</p>
                <p className="text-sm font-medium text-text mb-1">還沒有收藏的酒款</p>
                <p className="text-xs text-text-sub mb-5">瀏覽酒款時點擊收藏按鈕</p>
                <Link href="/search" className="inline-flex items-center gap-2 px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-medium hover:bg-wine-dark transition-colors">
                  探索酒款
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {bookmarkedWines.map((wine) => (
                  <Link key={wine.slug} href={`/wines/${wine.slug}`}
                    className="bg-white border border-wine-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-light rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                        {wine.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text text-sm leading-tight group-hover:text-wine transition-colors truncate">
                          {wine.name}
                        </p>
                        <p className="text-xs text-text-sub mt-1">
                          {locale === "zh-HK" ? wine.region_zh : wine.region_en}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-sm font-bold text-wine">
                            HK${wine.minPrice}
                            <span className="text-xs text-text-sub font-normal ml-1">起</span>
                          </p>
                          <span className="text-xs text-text-sub">{wine.merchantCount} 家酒商</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Merchant Bookmarks */}
        {tab === "merchantBookmarks" && (
          <div>
            {bookmarkedMerchants.length === 0 ? (
              <div className="bg-white border border-wine-border rounded-2xl py-20 text-center">
                <p className="text-4xl mb-3">🏪</p>
                <p className="text-sm font-medium text-text mb-1">還沒有收藏的酒商</p>
                <p className="text-xs text-text-sub mb-5">瀏覽酒商頁面時點擊收藏按鈕</p>
                <Link href="/merchants" className="inline-flex items-center gap-2 px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-medium hover:bg-wine-dark transition-colors">
                  探索酒商
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {bookmarkedMerchants.map((m) => (
                  <Link key={m.slug} href={`/merchants/${m.slug}`}
                    className="bg-white border border-wine-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-bg-card rounded-xl flex items-center justify-center text-2xl shrink-0 border border-wine-border group-hover:scale-110 transition-transform">
                        🍷
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text text-sm leading-tight group-hover:text-wine transition-colors">
                          {m.name}
                        </p>
                        <p className="text-xs text-text-sub mt-1 line-clamp-2">
                          {locale === "zh-HK" ? m.description_zh : m.description_en}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs text-text-sub">{m.winesListed} 款酒</span>
                          <span className="text-xs text-text-sub">⭐ {m.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Posts */}
        {tab === "posts" && (
          <div>
            {/* Stats summary */}
            {myPosts.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-wine-border rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-wine">{myPosts.length}</p>
                  <p className="text-xs text-text-sub mt-1">發佈動態</p>
                </div>
                <div className="bg-white border border-wine-border rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-wine">{totalLikesReceived}</p>
                  <p className="text-xs text-text-sub mt-1">收到讚</p>
                </div>
                <div className="bg-white border border-wine-border rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-wine">{totalCommentsReceived}</p>
                  <p className="text-xs text-text-sub mt-1">收到評論</p>
                </div>
              </div>
            )}

            {postsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white border border-wine-border rounded-2xl p-5 h-32" />
                ))}
              </div>
            ) : myPosts.length === 0 ? (
              <div className="bg-white border border-wine-border rounded-2xl py-20 text-center">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-sm font-medium text-text mb-1">還沒有發佈動態</p>
                <p className="text-xs text-text-sub mb-5">分享你的品酒心得，和大家交流</p>
                <Link href="/community/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-medium hover:bg-wine-dark transition-colors">
                  發佈第一篇動態
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myPosts.map((post) => (
                  <div key={post.id} className="bg-white border border-wine-border rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/community/${post.id}`} className="group flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text group-hover:text-wine transition-colors truncate">
                          {post.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <span className="text-xs text-text-sub">{formatDate(post.createdAt)}</span>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-text-sub/40 hover:text-wine transition-colors cursor-pointer bg-transparent border-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-text-sub line-clamp-2 mb-3">{post.content}</p>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-bg-card text-text-sub rounded-full text-[10px]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-text-sub">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> {post.likes.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}
                      </span>
                      {post.wineName && (
                        <span className="text-wine text-[10px] ml-auto truncate max-w-[200px]">
                          {post.wineName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile */}
        {tab === "profile" && (
          <div className="bg-white border border-wine-border rounded-2xl p-6 max-w-lg">
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">暱稱</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Email（不可修改）</label>
                <input type="email" value={user.email} readOnly
                  className="w-full px-4 py-2.5 bg-bg-card border border-wine-border rounded-xl text-sm text-text-sub cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">慣用語言</label>
                <select className={`${inputCls} appearance-none`} defaultValue={user.preferredLang}>
                  <option value="zh-HK">繁體中文</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                {profileSaved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" /> 已保存
                  </span>
                )}
                <button type="submit"
                  className="px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors cursor-pointer">
                  保存更改
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security */}
        {tab === "security" && (
          <div className="bg-white border border-wine-border rounded-2xl p-6 max-w-lg">
            <form onSubmit={handlePasswordSave} className="space-y-4">
              {(["current", "next", "confirm"] as const).map((k) => {
                const labels = { current: "當前密碼", next: "新密碼", confirm: "確認新密碼" };
                return (
                  <div key={k}>
                    <label className="block text-sm font-medium text-text mb-1.5">{labels[k]}</label>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} value={pw[k]}
                        onChange={(e) => setPw((p) => ({ ...p, [k]: e.target.value }))}
                        placeholder="••••••••" className={`${inputCls} pr-11`} />
                      {k === "current" && (
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-sub hover:text-text transition-colors cursor-pointer">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {pwError && <p className="text-sm text-wine bg-red-light px-4 py-2.5 rounded-xl">⚠ {pwError}</p>}
              <div className="flex items-center justify-end gap-3 pt-2">
                {pwSaved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" /> 密碼已更新
                  </span>
                )}
                <button type="submit"
                  className="px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors cursor-pointer">
                  更新密碼
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
