"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { WineCard } from "@/components/wine/WineCard";
import { SearchInput } from "@/components/search/SearchInput";
import type { WineCardData } from "@/lib/locale-helpers";

interface WineRaw {
  slug: string;
  name: string;
  type: string;
  region_zh: string;
  region_en: string;
  tags_zh: string[];
  tags_en: string[];
  description_zh: string;
  description_en: string;
  minPrice: number;
  merchantCount: number;
  emoji: string;
  badge?: string;
}

interface ApiResponse {
  wines: WineRaw[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PRICE_RANGES = [
  { key: "all", min: undefined, max: undefined },
  { key: "under200", min: undefined, max: 200 },
  { key: "200to500", min: 200, max: 500 },
  { key: "500to1000", min: 500, max: 1000 },
  { key: "over1000", min: 1000, max: undefined },
];

const WINE_TYPES = ["red", "white", "sparkling", "rosé", "dessert"] as const;
const SORT_OPTIONS = ["name_asc", "name_desc", "price_asc", "price_desc", "newest"] as const;
const PAGE_SIZE = 12;

export default function SearchPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read filters from URL
  const urlSearch = searchParams.get("q") ?? "";
  const urlType = searchParams.get("type") ?? "";
  const urlRegion = searchParams.get("region") ?? "";
  const urlPrice = searchParams.get("price") ?? "all";
  const urlSort = searchParams.get("sort") ?? "name_asc";
  const urlPage = Number(searchParams.get("page") ?? "1");

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [wines, setWines] = useState<WineCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<string[]>([]);

  const isZh = locale === "zh-HK";

  // Map raw wine to locale-specific card data
  const toCard = useCallback(
    (w: WineRaw): WineCardData => ({
      slug: w.slug,
      name: w.name,
      region: isZh ? w.region_zh : w.region_en,
      tags: isZh ? w.tags_zh : w.tags_en,
      description: isZh ? w.description_zh : w.description_en,
      minPrice: w.minPrice,
      merchantCount: w.merchantCount,
      emoji: w.emoji,
      badge: w.badge,
    }),
    [isZh]
  );

  // Update URL params
  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      // Reset page when filters change (except page itself)
      if (key !== "page") params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  // Fetch regions for filter dropdown
  useEffect(() => {
    fetch("/api/search?action=regions")
      .then((r) => r.json())
      .then((d) => setRegions(d.regions ?? []))
      .catch(() => {});
  }, []);

  // Fetch wines when URL params change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (urlSearch) params.set("search", urlSearch);
    if (urlType) params.set("type", urlType);
    if (urlRegion) params.set("region", urlRegion);
    if (urlSort && urlSort !== "name_asc") params.set("sort", urlSort);
    params.set("page", String(urlPage));
    params.set("limit", String(PAGE_SIZE));

    // Price range
    const priceRange = PRICE_RANGES.find((p) => p.key === urlPrice);
    if (priceRange?.min) params.set("minPrice", String(priceRange.min));
    if (priceRange?.max) params.set("maxPrice", String(priceRange.max));

    fetch(`/api/wines?${params.toString()}`)
      .then((r) => r.json())
      .then((data: ApiResponse) => {
        setWines(data.wines.map(toCard));
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        setWines([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [urlSearch, urlType, urlRegion, urlPrice, urlSort, urlPage, toCard]);

  // Sync local search state with URL
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  const handleSearch = (v: string) => {
    setFilter("q", v);
  };

  const priceLabel = (key: string) => {
    const labels: Record<string, string> = isZh
      ? {
          all: "全部價格",
          under200: "HK$200 以下",
          "200to500": "HK$200 – $500",
          "500to1000": "HK$500 – $1,000",
          over1000: "HK$1,000 以上",
        }
      : {
          all: "All Prices",
          under200: "Under HK$200",
          "200to500": "HK$200 – $500",
          "500to1000": "HK$500 – $1,000",
          over1000: "Over HK$1,000",
        };
    return labels[key] ?? labels.all;
  };

  const sortLabel = (key: string) => {
    const labels: Record<string, string> = isZh
      ? {
          name_asc: "名稱 A-Z",
          name_desc: "名稱 Z-A",
          price_asc: "價格低到高",
          price_desc: "價格高到低",
          newest: "最新年份",
        }
      : {
          name_asc: "Name A-Z",
          name_desc: "Name Z-A",
          price_asc: "Price: Low to High",
          price_desc: "Price: High to Low",
          newest: "Newest Vintage",
        };
    return labels[key] ?? labels.name_asc;
  };

  const activeFilterCount = [urlType, urlRegion, urlPrice !== "all" ? urlPrice : ""].filter(Boolean).length;

  return (
    <>
      {/* Header */}
      <div className="pt-28 pb-10 text-center">
        <div className="max-w-[1120px] mx-auto px-6">
          <h1 className="text-[32px] font-semibold mb-2">{t("search.pageTitle")}</h1>
          <p className="text-base text-text-sub">{t("search.pageDesc")}</p>
          <div className="mt-6 max-w-[600px] mx-auto">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearch}
              autoFocus
            />
          </div>
        </div>
      </div>

      <section className="pb-20 pt-4">
        <div className="max-w-[1120px] mx-auto px-6">
          {/* Filters + Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap mb-8 items-start sm:items-end justify-between">
            <div className="flex gap-3 flex-wrap items-end">
              {/* Type filter */}
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">
                  {t("search.filterType")}
                </label>
                <select
                  value={urlType}
                  onChange={(e) => setFilter("type", e.target.value)}
                  className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9"
                >
                  <option value="">{t("search.allTypes")}</option>
                  {WINE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`search.${type === "rosé" ? "rose" : type}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region filter */}
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">
                  {t("search.filterRegion")}
                </label>
                <select
                  value={urlRegion}
                  onChange={(e) => setFilter("region", e.target.value)}
                  className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9"
                >
                  <option value="">{t("search.allRegions")}</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Price filter */}
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">
                  {t("search.filterPrice")}
                </label>
                <select
                  value={urlPrice}
                  onChange={(e) => setFilter("price", e.target.value)}
                  className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9"
                >
                  {PRICE_RANGES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {priceLabel(p.key)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (urlSearch) params.set("q", urlSearch);
                    router.replace(`${pathname}?${params.toString()}`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-wine hover:text-wine-dark transition-colors cursor-pointer bg-transparent border-none"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {isZh ? `清除篩選 (${activeFilterCount})` : `Clear filters (${activeFilterCount})`}
                </button>
              )}
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">
                <ArrowUpDown className="w-3 h-3 inline mr-1" />
                {isZh ? "排序" : "Sort"}
              </label>
              <select
                value={urlSort}
                onChange={(e) => setFilter("sort", e.target.value)}
                className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{sortLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-text-sub">
              {t("search.resultsCount", { count: total })}
            </p>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-wine-border rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="h-[200px] bg-gradient-to-br from-[#E8E0D6] to-[#D4CBC0]" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-bg-card rounded w-3/4" />
                    <div className="h-3 bg-bg-card rounded w-1/2" />
                    <div className="h-12 bg-bg-card rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : wines.length === 0 ? (
            /* Empty state with suggestions */
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium text-text mb-2">
                {t("search.noResults")}
              </p>
              <p className="text-sm text-text-sub mb-6">
                {t("search.noResultsHint")}
              </p>
              <div className="flex flex-col items-center gap-4">
                {/* Clear filters suggestion */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (urlSearch) params.set("q", urlSearch);
                      router.replace(`${pathname}?${params.toString()}`);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-medium hover:bg-wine-dark transition-colors cursor-pointer border-none"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {isZh ? "清除所有篩選條件" : "Clear all filters"}
                  </button>
                )}
                {/* Hot search suggestions */}
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="text-xs text-text-sub/60">{isZh ? "試試搜索：" : "Try searching:"}</span>
                  {(isZh
                    ? ["Sauvignon Blanc", "Pinot Noir", "Champagne", "波爾多"]
                    : ["Sauvignon Blanc", "Pinot Noir", "Champagne", "Bordeaux"]
                  ).map((term) => (
                    <button key={term}
                      onClick={() => { setSearchQuery(term); handleSearch(term); }}
                      className="px-3 py-1.5 bg-white border border-wine-border rounded-lg text-xs text-text hover:border-gold hover:text-wine transition-colors cursor-pointer">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Wine grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {wines.map((wine) => (
                <WineCard key={wine.slug} wine={wine} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setFilter("page", String(urlPage - 1))}
                disabled={urlPage <= 1}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-wine-border rounded-lg hover:border-gold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
                {isZh ? "上一頁" : "Prev"}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter("page", String(p))}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                    p === urlPage
                      ? "bg-wine text-white border-wine"
                      : "bg-white border-wine-border hover:border-gold"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setFilter("page", String(urlPage + 1))}
                disabled={urlPage >= totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-wine-border rounded-lg hover:border-gold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-white"
              >
                {isZh ? "下一頁" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
