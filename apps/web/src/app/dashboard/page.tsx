"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, TrendingDown, Package, Star, ArrowUpRight, Trophy, Heart } from "lucide-react";
import { merchants } from "@/lib/mock-data";
import type { Wine, MerchantPrice } from "@/lib/mock-data";
import { useDashboardLang } from "@/lib/dashboard-lang-context";

interface MerchantAccount {
  slug: string;
  name: string;
  favoriteCount?: number;
}

const TYPE_COLOR: Record<string, string> = {
  red: "bg-red-100 text-red-700",
  white: "bg-yellow-50 text-yellow-700",
  sparkling: "bg-blue-50 text-blue-700",
  "rosé": "bg-pink-50 text-pink-700",
  dessert: "bg-orange-50 text-orange-700",
};

export default function DashboardHome() {
  const [merchant, setMerchant] = useState<MerchantAccount | null>(null);
  const [wineData, setWineData] = useState<Wine[]>([]);
  const [priceData, setPriceData] = useState<Record<string, MerchantPrice[]>>({});
  const { t, tf } = useDashboardLang();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!m) return;
        setMerchant(m);
        fetch(`/api/merchants/${m.slug}/stats`)
          .then((r) => r.json())
          .then((d) => setMerchant((prev) => prev ? { ...prev, favoriteCount: d.favoriteCount } : prev))
          .catch(() => {});
        fetch("/api/merchant/wines")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data) {
              setWineData(data.wines);
              setPriceData(data.winePrices);
            }
          });
      });
  }, []);

  if (!merchant) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-bg-card rounded-xl w-64" />
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-bg-card rounded-2xl" />)}
        </div>
        <div className="h-72 bg-bg-card rounded-2xl" />
      </div>
    );
  }

  const merchantInfo = merchants.find((m) => m.slug === merchant.slug);
  const myWines = Object.entries(priceData)
    .filter(([, prices]) => prices.some((p) => p.merchantSlug === merchant.slug))
    .map(([slug, prices]) => {
      const wine = wineData.find((w) => w.slug === slug);
      const myPrice = prices.find((p) => p.merchantSlug === merchant.slug);
      if (!wine || !myPrice) return null;
      const lowestPrice = Math.min(...prices.map((p) => p.price));
      const isBest = myPrice.price <= lowestPrice;
      return { wine, price: myPrice.price, isBest, lowestPrice, totalMerchants: prices.length };
    })
    .filter(Boolean) as {
      wine: Wine;
      price: number;
      isBest: boolean;
      lowestPrice: number;
      totalMerchants: number;
    }[];

  const bestPriceCount = myWines.filter((w) => w.isBest).length;
  const avgPrice = myWines.length
    ? Math.round(myWines.reduce((s, w) => s + w.price, 0) / myWines.length)
    : 0;

  const stats = [
    {
      label: t("home.winesListed"),
      value: merchantInfo?.winesListed ?? myWines.length,
      sub: t("home.winesListedSub"),
      icon: Package,
      iconBg: "bg-red-light",
      iconColor: "text-wine",
    },
    {
      label: t("home.bestPrice"),
      value: bestPriceCount,
      sub: tf("home.bestPriceSub", { total: myWines.length }),
      icon: TrendingDown,
      iconBg: "bg-green-50",
      iconColor: "text-green-700",
    },
    {
      label: t("home.platformRating"),
      value: merchantInfo?.rating?.toFixed(1) ?? "—",
      sub: t("home.platformRatingSub"),
      icon: Star,
      iconBg: "bg-[#FDF6EC]",
      iconColor: "text-gold",
    },
    {
      label: t("home.favorites"),
      value: merchant.favoriteCount ?? "—",
      sub: t("home.favoritesSub"),
      icon: Heart,
      iconBg: "bg-red-light",
      iconColor: "text-wine",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">
            {merchant.name} <span className="text-text-sub font-normal">👋</span>
          </h1>
          <p className="text-sm text-text-sub mt-1">{t("home.accountOverview")}</p>
        </div>
        <Link
          href="/dashboard/wines/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-all hover:-translate-y-0.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          {t("home.addWine")}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white border border-wine-border rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-text mb-1">{value}</p>
            <p className="text-sm font-medium text-text">{label}</p>
            <p className="text-xs text-text-sub mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Average price banner */}
      {avgPrice > 0 && (
        <div className="bg-white border border-wine-border rounded-2xl px-6 py-5 flex items-center gap-4">
          <div className="p-3 bg-[#FDF6EC] rounded-xl">
            <Trophy className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text">{t("home.avgPricing")}</p>
            <p className="text-xs text-text-sub">{t("home.avgPricingSub")}</p>
          </div>
          <p className="text-2xl font-bold text-wine">HK${avgPrice}</p>
        </div>
      )}

      {/* Wine table */}
      <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-wine-border flex items-center justify-between">
          <h2 className="font-semibold text-text">{t("home.wineDetails")}</h2>
          <Link
            href="/dashboard/wines"
            className="flex items-center gap-1 text-sm text-wine hover:underline font-medium"
          >
            {t("home.manageAll")} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {myWines.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍷</p>
            <p className="text-sm font-medium text-text mb-1">{t("home.noData")}</p>
            <p className="text-xs text-text-sub">{t("home.noDataSub")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-wine-border">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.wine")}</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.type")}</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.yourPrice")}</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.marketLow")}</th>
                  <th className="text-center px-6 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0EA]">
                {myWines.map(({ wine, price, isBest, lowestPrice }) => (
                  <tr key={wine.slug} className="hover:bg-bg transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{wine.emoji}</span>
                        <div>
                          <p className="font-medium text-text leading-tight">{wine.name}</p>
                          {wine.vintage && (
                            <p className="text-xs text-text-sub">{wine.vintage} · {wine.region_en.split(" · ")[0]}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${TYPE_COLOR[wine.type] ?? "bg-bg-card text-text-sub"}`}>
                        {wine.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-text">HK${price}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-sm ${isBest ? "text-green-700 font-semibold" : "text-text-sub"}`}>
                        HK${lowestPrice}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isBest ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-semibold">
                          <Trophy className="w-3 h-3" /> {t("home.bestPriceTag")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-card text-text-sub rounded-full text-xs">
                          {t("home.listedTag")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
