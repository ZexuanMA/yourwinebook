"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { WineCard } from "@/components/wine/WineCard";
import { ChevronDown, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import type { Wine, MerchantPrice } from "@/lib/mock-data";
import { toWineCard, getFullRegion, getTastingNotes, getRegionStory } from "@/lib/locale-helpers";

interface Props {
  wine: Wine;
  prices: MerchantPrice[];
  similarWines: Wine[];
}

export default function WineDetailClient({ wine, prices, similarWines }: Props) {
  const t = useTranslations("wine");
  const locale = useLocale();
  const isZh = locale === "zh-HK";
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    fetch("/api/user/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => { if (u) setBookmarked((u.bookmarks ?? []).includes(wine.slug)); })
      .catch(() => {});
  }, [wine.slug]);

  const toggleBookmark = async () => {
    setBookmarkLoading(true);
    try {
      const res = await fetch("/api/user/bookmarks/wines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wineSlug: wine.slug }),
      });
      if (res.status === 401) { window.location.href = `/${locale}/account/login`; return; }
      if (res.ok) { const d = await res.json(); setBookmarked(d.bookmarked); }
    } finally {
      setBookmarkLoading(false);
    }
  };

  useEffect(() => {
    const sid = sessionStorage.getItem("wb_sid") ?? (Math.random().toString(36).slice(2) + Date.now().toString(36));
    sessionStorage.setItem("wb_sid", sid);
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "wine_view", wineSlug: wine.slug, wineName: wine.name, wineEmoji: wine.emoji, sessionId: sid }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wine.slug]);

  const fullRegion = getFullRegion(wine, locale);
  const tags = isZh ? wine.tags_zh : wine.tags_en;
  const description = isZh ? wine.description_zh : wine.description_en;
  const tastingNotes = getTastingNotes(wine, locale);
  const regionStory = getRegionStory(wine, locale);

  return (
    <>
      <section>
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-15 items-start pt-28 pb-15">
            {/* Image */}
            <div className="h-[420px] bg-gradient-to-br from-[#E8E0D6] to-[#D4CBC0] rounded-[20px] flex items-center justify-center text-[120px]">
              {wine.emoji}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h1 className="font-en text-[28px] font-bold">{wine.name}</h1>
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  <button
                    onClick={() => {
                      const url = window.location.href;
                      const title = `${wine.name}${wine.vintage ? ` ${wine.vintage}` : ""} — Your Wine Book`;
                      const text = isZh
                        ? `${wine.name} — ${fullRegion}${wine.minPrice ? ` · 最低 HK$${wine.minPrice}` : ""}`
                        : `${wine.name} — ${fullRegion}${wine.minPrice ? ` · From HK$${wine.minPrice}` : ""}`;
                      if (navigator.share) {
                        navigator.share({ title, text, url }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(url).then(() => {
                          // Brief visual feedback — button briefly changes color
                        }).catch(() => {});
                      }
                    }}
                    title={isZh ? "分享" : "Share"}
                    className="p-2.5 rounded-xl border border-wine-border bg-white text-text-sub hover:border-wine hover:text-wine transition-all cursor-pointer"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleBookmark}
                    disabled={bookmarkLoading}
                    title={bookmarked ? "取消收藏" : "收藏酒款"}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                      bookmarked
                        ? "bg-wine text-white border-wine"
                        : "bg-white text-text-sub border-wine-border hover:border-wine hover:text-wine"
                    }`}
                  >
                    {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <p className="text-[15px] text-text-sub mb-5">{fullRegion}</p>

              <div className="flex flex-wrap gap-2 mb-5">
                {tags.map((tag, i) => (
                  <span
                    key={tag}
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${
                      i < 3
                        ? "bg-red-light text-wine border-transparent"
                        : "bg-bg border border-wine-border text-text-sub"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-[15px] text-text-sub leading-7 mb-6">{description}</p>

              {/* Price Comparison */}
              {prices.length > 0 && (
                <div className="bg-white border border-wine-border rounded-2xl p-6 mb-6">
                  <h3 className="text-base font-semibold mb-4">
                    {isZh ? "價格對比" : "Compare Prices"}
                  </h3>
                  <table className="w-full border-collapse">
                    <tbody>
                      {prices.map((p) => (
                        <tr
                          key={p.merchant}
                          className="border-b border-wine-border last:border-b-0 hover:bg-bg transition-colors"
                        >
                          <td className="py-3.5 font-medium text-[15px]">{p.merchant}</td>
                          <td className="py-3.5 text-right">
                            <span className="font-en text-lg font-bold text-wine">
                              HK${p.price}
                            </span>
                            {p.isBest && (
                              <span className="inline-block ml-2 px-2 py-0.5 bg-gold text-white text-[11px] font-semibold rounded font-en">
                                {t("bestPrice")}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right w-[100px]">
                            <button
                              className="px-5 py-2 bg-wine text-white border-none rounded-lg text-[13px] font-medium cursor-pointer hover:bg-wine-dark transition-colors"
                              onClick={() => {
                                const sid = sessionStorage.getItem("wb_sid") ?? "";
                                fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ type: "price_click", wineSlug: wine.slug, wineName: wine.name, wineEmoji: wine.emoji, merchant: p.merchantSlug, sessionId: sid }),
                                }).catch(() => {});
                              }}
                            >
                              {t("buyBtn")} →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Expand toggle */}
              {(tastingNotes || regionStory) && (
                <>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1.5 py-3 text-sm font-medium text-wine cursor-pointer border-none bg-transparent hover:text-gold transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                    {t("expandTasting")}
                  </button>

                  {expanded && (
                    <div className="pt-6 border-t border-wine-border">
                      {regionStory && (
                        <>
                          <h3 className="text-lg font-semibold mb-3">{t("regionStory")}</h3>
                          <p className="text-sm text-text-sub leading-7 mb-6">{regionStory}</p>
                        </>
                      )}

                      {tastingNotes && (
                        <>
                          <h3 className="text-lg font-semibold mb-3">{t("tastingNotes")}</h3>
                          <p className="text-sm text-text-sub leading-7 mb-6">
                            {tastingNotes.appearance && (
                              <>
                                <strong>{t("appearance")}:</strong> {tastingNotes.appearance}
                                <br />
                              </>
                            )}
                            {tastingNotes.nose && (
                              <>
                                <strong>{t("nose")}:</strong> {tastingNotes.nose}
                                <br />
                              </>
                            )}
                            {tastingNotes.palate && (
                              <>
                                <strong>{t("palate")}:</strong> {tastingNotes.palate}
                              </>
                            )}
                          </p>

                          {tastingNotes.food && tastingNotes.food.length > 0 && (
                            <>
                              <h3 className="text-lg font-semibold mb-3">{t("bestFor")}</h3>
                              <div className="flex gap-2 flex-wrap">
                                {tastingNotes.food.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-block px-2.5 py-0.5 bg-bg border border-wine-border rounded-full text-xs text-text-sub"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Similar Wines */}
      {similarWines.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-[1120px] mx-auto px-6">
            <div className="text-center mb-12">
              <div className="w-10 h-0.5 bg-gold mx-auto mb-5" />
              <h2 className="text-[28px] font-semibold">{t("similarWines")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarWines.map((w) => (
                <WineCard key={w.slug} wine={toWineCard(w, locale)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
