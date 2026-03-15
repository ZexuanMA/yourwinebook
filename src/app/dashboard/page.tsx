"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, TrendingDown, Package, Star, ArrowUpRight, Trophy } from "lucide-react";
import { wines, merchants, winePrices } from "@/lib/mock-data";

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

export default function DashboardHome() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMerchant);
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
  const myWines = Object.entries(winePrices)
    .filter(([, prices]) => prices.some((p) => p.merchantSlug === merchant.slug))
    .map(([slug, prices]) => {
      const wine = wines.find((w) => w.slug === slug);
      const myPrice = prices.find((p) => p.merchantSlug === merchant.slug);
      const lowestPrice = Math.min(...prices.map((p) => p.price));
      return wine && myPrice
        ? { wine, price: myPrice.price, isBest: myPrice.isBest, lowestPrice, totalMerchants: prices.length }
        : null;
    })
    .filter(Boolean) as {
      wine: (typeof wines)[0];
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
      label: "上架酒款",
      value: merchantInfo?.winesListed ?? myWines.length,
      sub: "款在平台比價",
      icon: Package,
      iconBg: "bg-red-light",
      iconColor: "text-wine",
      accent: "#5B2E35",
    },
    {
      label: "最低價酒款",
      value: bestPriceCount,
      sub: `共 ${myWines.length} 款中奪冠`,
      icon: TrendingDown,
      iconBg: "bg-green-50",
      iconColor: "text-green-700",
      accent: "#2D7A3A",
    },
    {
      label: "平台評分",
      value: merchantInfo?.rating?.toFixed(1) ?? "—",
      sub: "用戶綜合評分",
      icon: Star,
      iconBg: "bg-[#FDF6EC]",
      iconColor: "text-gold",
      accent: "#B8956A",
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
          <p className="text-sm text-text-sub mt-1">以下是你的帳號概覽</p>
        </div>
        <Link
          href="/dashboard/wines/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-all hover:-translate-y-0.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          新增酒款
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
            <p className="text-sm font-medium text-text">比價酒款平均定價</p>
            <p className="text-xs text-text-sub">基於你在平台上有比價數據的酒款</p>
          </div>
          <p className="text-2xl font-bold text-wine">HK${avgPrice}</p>
        </div>
      )}

      {/* Wine table */}
      <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-wine-border flex items-center justify-between">
          <h2 className="font-semibold text-text">比價酒款明細</h2>
          <Link
            href="/dashboard/wines"
            className="flex items-center gap-1 text-sm text-wine hover:underline font-medium"
          >
            全部管理 <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {myWines.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍷</p>
            <p className="text-sm font-medium text-text mb-1">尚未有比價數據</p>
            <p className="text-xs text-text-sub">新增酒款後將顯示在這裡</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-wine-border">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">酒款</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">類型</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">你的價格</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">市場最低</th>
                  <th className="text-center px-6 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">狀態</th>
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
                          <Trophy className="w-3 h-3" /> 最低價
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-card text-text-sub rounded-full text-xs">
                          已上架
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
