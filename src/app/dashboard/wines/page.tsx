"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, ExternalLink, Trophy, Search } from "lucide-react";
import { wines, winePrices } from "@/lib/mock-data";

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

const TYPE_LABEL: Record<string, string> = {
  red: "紅酒",
  white: "白酒",
  sparkling: "氣泡酒",
  "rosé": "玫瑰酒",
  dessert: "甜酒",
};

export default function DashboardWines() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [search, setSearch] = useState("");

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

  const filtered = search
    ? allMyWines.filter(
        ({ wine }) =>
          wine.name.toLowerCase().includes(search.toLowerCase()) ||
          wine.type.toLowerCase().includes(search.toLowerCase())
      )
    : allMyWines;

  const bestCount = allMyWines.filter((w) => w.isBest).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">酒款管理</h1>
          <p className="text-sm text-text-sub mt-1">
            共 <span className="font-semibold text-text">{allMyWines.length}</span> 款上架 ·{" "}
            <span className="text-green-700 font-semibold">{bestCount}</span> 款最低價
          </p>
        </div>
        <Link
          href="/dashboard/wines/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-all hover:-translate-y-0.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          新增酒款
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索酒款名稱或類型…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold transition-colors placeholder:text-text-sub/40"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm font-medium text-text mb-1">
              {search ? "沒有符合的酒款" : "尚未有上架酒款"}
            </p>
            <p className="text-xs text-text-sub mb-5">
              {search ? "試試其他關鍵字" : "點擊「新增酒款」開始上架"}
            </p>
            {!search && (
              <Link
                href="/dashboard/wines/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-wine text-white rounded-xl text-sm font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                新增酒款
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-wine-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">酒款</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">類型</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">產區</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">你的價格</th>
                  <th className="text-right px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">市場最低</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">比價名次</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0EA]">
                {filtered.map(({ wine, price, isBest, lowestPrice, totalMerchants }) => {
                  const priceDiff = price - lowestPrice;
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
                          {TYPE_LABEL[wine.type] ?? wine.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-text-sub text-sm max-w-[140px] truncate">
                        {wine.region_en.split(" · ")[0]}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-text">HK${price}</span>
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
                            <Trophy className="w-3 h-3" /> 第 1 / {totalMerchants}
                          </span>
                        ) : (
                          <span className="text-text-sub text-xs">
                            / {totalMerchants} 家
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/zh-HK/wines/${wine.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-light text-wine rounded-lg text-xs font-medium hover:bg-wine hover:text-white transition-all"
                        >
                          查看 <ExternalLink className="w-3 h-3" />
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
