"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, ExternalLink, Trophy, Search, Pencil, Check, X } from "lucide-react";
import { wines, winePrices } from "@/lib/mock-data";
import { useDashboardLang } from "@/lib/dashboard-lang-context";

interface Merchant {
  slug: string;
  name: string;
}

const TYPE_COLOR: Record<string, string> = {
  red: "bg-red-100 text-red-700",
  white: "bg-yellow-50 text-yellow-700",
  sparkling: "bg-blue-50 text-blue-700",
  "rosé": "bg-pink-50 text-pink-700",
  dessert: "bg-orange-50 text-orange-700",
};

export default function DashboardWines() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [search, setSearch] = useState("");
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const { t } = useDashboardLang();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMerchant);
  }, []);

  if (!merchant) {
    return <div className="animate-pulse h-96 bg-bg-card rounded-2xl" />;
  }

  const allMyWines = Object.entries(winePrices)
    .filter(([, prices]) => prices.some((p) => p.merchantSlug === merchant.slug))
    .map(([slug, prices]) => {
      const wine = wines.find((w) => w.slug === slug);
      const myPrice = prices.find((p) => p.merchantSlug === merchant.slug);
      const overridePrice = priceOverrides[slug];
      const effectivePrice = overridePrice ?? myPrice?.price ?? 0;
      const lowestPrice = Math.min(...prices.map((p) => {
        if (p.merchantSlug === merchant.slug && overridePrice !== undefined) return overridePrice;
        return p.price;
      }));
      const isBest = effectivePrice <= lowestPrice;
      return wine && myPrice
        ? { wine, price: effectivePrice, originalPrice: myPrice.price, isBest, lowestPrice, totalMerchants: prices.length }
        : null;
    })
    .filter(Boolean) as {
      wine: (typeof wines)[0];
      price: number;
      originalPrice: number;
      isBest: boolean;
      lowestPrice: number;
      totalMerchants: number;
    }[];

  const filtered = search
    ? allMyWines.filter(
        ({ wine }) =>
          wine.name.toLowerCase().includes(search.toLowerCase()) ||
          wine.type.toLowerCase().includes(search.toLowerCase())
      )
    : allMyWines;

  const bestCount = allMyWines.filter((w) => w.isBest).length;

  const handleSavePrice = async (wineSlug: string) => {
    const newPrice = parseInt(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) return;
    setSavingPrice(true);
    try {
      const res = await fetch(`/api/merchant/wines/${wineSlug}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: newPrice }),
      });
      if (res.ok) {
        setPriceOverrides((prev) => ({ ...prev, [wineSlug]: newPrice }));
        setEditingSlug(null);
      }
    } finally {
      setSavingPrice(false);
    }
  };

  const typeLabel = (type: string) => {
    const key = `wines.type${type.charAt(0).toUpperCase() + type.slice(1)}` as string;
    return t(key);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">{t("wines.title")}</h1>
          <p className="text-sm text-text-sub mt-1">
            {t("common.total")} <span className="font-semibold text-text">{allMyWines.length}</span> {t("wines.listed")} ·{" "}
            <span className="text-green-700 font-semibold">{bestCount}</span> {t("wines.bestPrice")}
          </p>
        </div>
        <Link
          href="/dashboard/wines/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-all hover:-translate-y-0.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          {t("wines.addWine")}
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("wines.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold transition-colors placeholder:text-text-sub/40"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm font-medium text-text mb-1">
              {search ? t("wines.noMatch") : t("wines.noWines")}
            </p>
            <p className="text-xs text-text-sub mb-5">
              {search ? t("wines.tryOther") : t("wines.addFirst")}
            </p>
            {!search && (
              <Link
                href="/dashboard/wines/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-wine text-white rounded-xl text-sm font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                {t("wines.addWine")}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-wine-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.wine")}</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.type")}</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("wines.region")}</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.yourPrice")}</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.marketLow")}</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("wines.ranking")}</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("wines.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0EA]">
                {filtered.map(({ wine, price, isBest, lowestPrice, totalMerchants }) => {
                  const priceDiff = price - lowestPrice;
                  const isEditing = editingSlug === wine.slug;
                  return (
                    <tr key={wine.slug} className="hover:bg-bg transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-light rounded-xl flex items-center justify-center text-xl shrink-0">
                            {wine.emoji}
                          </div>
                          <div>
                            <p className="font-medium text-text leading-tight">{wine.name}</p>
                            {wine.vintage && (
                              <p className="text-xs text-text-sub mt-0.5">{wine.vintage}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLOR[wine.type] ?? "bg-bg-card text-text-sub"}`}>
                          {typeLabel(wine.type)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-text-sub text-sm max-w-[140px] truncate">
                        {wine.region_en.split(" · ")[0]}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-text-sub">HK$</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 px-2 py-1 border border-gold rounded-lg text-sm text-right outline-none"
                              min="1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSavePrice(wine.slug);
                                if (e.key === "Escape") setEditingSlug(null);
                              }}
                            />
                            <button
                              onClick={() => handleSavePrice(wine.slug)}
                              disabled={savingPrice}
                              className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingSlug(null)}
                              className="p-1 text-text-sub hover:bg-bg rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingSlug(wine.slug); setEditPrice(String(price)); }}
                            className="inline-flex items-center gap-1.5 font-semibold text-text hover:text-wine transition-colors cursor-pointer group"
                          >
                            HK${price}
                            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`${isBest ? "text-green-700 font-semibold" : "text-text-sub"}`}>
                          HK${lowestPrice}
                        </span>
                        {!isBest && priceDiff > 0 && (
                          <p className="text-[11px] text-red-500">+HK${priceDiff}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isBest ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-semibold">
                            <Trophy className="w-3 h-3" /> {t("wines.rank1").replace("{total}", String(totalMerchants))}
                          </span>
                        ) : (
                          <span className="text-text-sub text-xs">
                            {t("wines.rankOther").replace("{total}", String(totalMerchants))}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/zh-HK/wines/${wine.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-light text-wine rounded-lg text-xs font-medium hover:bg-wine hover:text-white transition-all"
                        >
                          {t("wines.view")} <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
