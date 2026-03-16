"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, Wine, Star, X, CheckCircle } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
}

interface WineOption {
  slug: string;
  name: string;
}

const TAG_OPTIONS = [
  "紅酒", "白酒", "氣泡酒", "粉紅酒",
  "日常自飲", "送禮", "聚餐", "配中菜",
  "求推薦", "知識分享", "新手友善", "品鑑會", "活動",
];

export default function NewPostPage() {
  const locale = useLocale();
  const router = useRouter();
  const isZh = locale === "zh-HK";
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wineSlug, setWineSlug] = useState("");
  const [wineName, setWineName] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [wines, setWines] = useState<WineOption[]>([]);
  const [wineSearch, setWineSearch] = useState("");
  const [showWineDropdown, setShowWineDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/user/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (!u) { router.push("/account/login"); return; }
        setUser(u);
      })
      .finally(() => setLoading(false));

    fetch("/api/wines?limit=100")
      .then((r) => r.json())
      .then((d) => setWines(d.wines.map((w: { slug: string; name: string }) => ({ slug: w.slug, name: w.name }))));
  }, [router]);

  const filteredWines = wines.filter((w) =>
    w.name.toLowerCase().includes(wineSearch.toLowerCase())
  ).slice(0, 8);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          wineSlug: wineSlug || undefined,
          wineName: wineName || undefined,
          rating: rating || undefined,
          tags,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/community"), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bg min-h-screen pt-24 pb-20">
        <div className="max-w-[640px] mx-auto px-6 animate-pulse space-y-4">
          <div className="h-8 bg-bg-card rounded w-1/3" />
          <div className="h-64 bg-bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (success) {
    return (
      <div className="bg-bg min-h-screen pt-24 pb-20">
        <div className="max-w-[640px] mx-auto px-6 text-center py-20">
          <CheckCircle className="w-12 h-12 text-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text mb-2">
            {isZh ? "發佈成功！" : "Published!"}
          </h2>
          <p className="text-sm text-text-sub">
            {isZh ? "正在跳轉到社區..." : "Redirecting to community..."}
          </p>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full px-4 py-2.5 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all";

  return (
    <div className="bg-bg min-h-screen pt-24 pb-20">
      <div className="max-w-[640px] mx-auto px-6">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-text-sub hover:text-wine transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isZh ? "返回社區" : "Back to community"}
        </Link>

        <h1 className="text-xl font-bold text-text mb-6">
          {isZh ? "發佈新動態" : "Create New Post"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              {isZh ? "標題" : "Title"} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isZh ? "例如：第一次試 Cloudy Bay，驚喜不錯" : "e.g. First time trying Cloudy Bay, great surprise"}
              className={inputCls}
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              {isZh ? "內容" : "Content"} *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isZh ? "分享你的品酒心得、推薦理由、搭配建議..." : "Share your tasting notes, recommendations, pairing suggestions..."}
              rows={6}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Wine reference */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              <Wine className="w-4 h-4 inline mr-1 text-wine" />
              {isZh ? "關聯酒款（可選）" : "Link a Wine (optional)"}
            </label>
            {wineSlug ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-wine-border rounded-xl">
                <Wine className="w-4 h-4 text-wine" />
                <span className="text-sm text-text font-medium flex-1">{wineName}</span>
                <button
                  type="button"
                  onClick={() => { setWineSlug(""); setWineName(""); setRating(0); }}
                  className="p-1 text-text-sub hover:text-wine cursor-pointer bg-transparent border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={wineSearch}
                  onChange={(e) => { setWineSearch(e.target.value); setShowWineDropdown(true); }}
                  onFocus={() => setShowWineDropdown(true)}
                  placeholder={isZh ? "搜索酒名..." : "Search wine name..."}
                  className={inputCls}
                />
                {showWineDropdown && wineSearch && filteredWines.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-wine-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredWines.map((w) => (
                      <button
                        key={w.slug}
                        type="button"
                        onClick={() => {
                          setWineSlug(w.slug);
                          setWineName(w.name);
                          setWineSearch("");
                          setShowWineDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-bg-card transition-colors cursor-pointer bg-transparent border-none"
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rating (only if wine selected) */}
          {wineSlug && (
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {isZh ? "評分" : "Rating"}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? 0 : n)}
                    className="p-1 cursor-pointer bg-transparent border-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        n <= rating ? "fill-gold text-gold" : "text-wine-border hover:text-gold"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-sm text-text-sub ml-2 self-center">{rating}/5</span>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {isZh ? "標籤（可多選）" : "Tags (multi-select)"}
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    tags.includes(tag)
                      ? "bg-wine text-white border-wine"
                      : "bg-white text-text-sub border-wine-border hover:border-gold"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/community"
              className="px-5 py-2.5 text-sm text-text-sub border border-wine-border rounded-xl hover:border-gold transition-colors"
            >
              {isZh ? "取消" : "Cancel"}
            </Link>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || submitting}
              className="px-6 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none"
            >
              {submitting ? (isZh ? "發佈中..." : "Publishing...") : (isZh ? "發佈" : "Publish")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
