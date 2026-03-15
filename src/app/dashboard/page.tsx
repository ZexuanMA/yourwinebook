"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, TrendingDown, Package, Star } from "lucide-react";
import { wines, merchants, winePrices } from "@/lib/mock-data";

interface Merchant {
  slug: string;
  name: string;
}

export default function DashboardHome() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMerchant);
  }, []);

  if (!merchant) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-white rounded-xl w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Stats from mock data
  const merchantInfo = merchants.find((m) => m.slug === merchant.slug);
  const myWines = Object.entries(winePrices)
    .filter(([, prices]) => prices.some((p) => p.merchantSlug === merchant.slug))
    .map(([slug, prices]) => {
      const wine = wines.find((w) => w.slug === slug);
      const myPrice = prices.find((p) => p.merchantSlug === merchant.slug);
      return wine && myPrice ? { wine, price: myPrice.price, isBest: myPrice.isBest } : null;
    })
    .filter(Boolean) as { wine: (typeof wines)[0]; price: number; isBest: boolean }[];

  const bestPriceCount = myWines.filter((w) => w.isBest).length;

  const stats = [
    {
      label: "上架酒款",
      value: merchantInfo?.winesListed ?? myWines.length,
      icon: Package,
      color: "text-[#8B1A1A]",
      bg: "bg-red-50",
    },
    {
      label: "最低價酒款",
      value: bestPriceCount,
      icon: TrendingDown,
      color: "text-[#2D7A3A]",
      bg: "bg-green-50",
    },
    {
      label: "平台評分",
      value: merchantInfo?.rating?.toFixed(1) ?? "—",
      icon: Star,
      color: "text-[#B8956A]",
      bg: "bg-[#FDF6EC]",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">
            歡迎回來，{merchant.name} 👋
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">以下是你的帳號概覽</p>
        </div>
        <Link
          href="/dashboard/wines/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#6B1515] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          新增酒款
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-[#E8E0D6] rounded-2xl p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
            <p className="text-sm text-[#6B6B6B] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* My wines with prices */}
      <div className="bg-white border border-[#E8E0D6] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E0D6] flex items-center justify-between">
          <h2 className="font-semibold text-[#1A1A1A]">你的比價酒款</h2>
          <Link
            href="/dashboard/wines"
            className="text-sm text-[#8B1A1A] hover:underline"
          >
            查看全部
          </Link>
        </div>
        {myWines.length === 0 ? (
          <div className="text-center py-12 text-[#6B6B6B] text-sm">
            尚未有比價數據，請新增酒款
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#FAF8F5]">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-[#6B6B6B]">酒款</th>
                <th className="text-left px-6 py-3 font-medium text-[#6B6B6B]">類型</th>
                <th className="text-right px-6 py-3 font-medium text-[#6B6B6B]">你的價格</th>
                <th className="text-right px-6 py-3 font-medium text-[#6B6B6B]">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE2]">
              {myWines.map(({ wine, price, isBest }) => (
                <tr key={wine.slug} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{wine.emoji}</span>
                      <span className="font-medium text-[#1A1A1A]">{wine.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#6B6B6B] capitalize">{wine.type}</td>
                  <td className="px-6 py-4 text-right font-semibold text-[#1A1A1A]">
                    HK${price}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isBest ? (
                      <span className="inline-block px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        最低價 🏆
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 bg-[#FAF8F5] text-[#6B6B6B] rounded-full text-xs">
                        已上架
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mock mode notice */}
      <div className="mt-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <span className="font-medium">Demo 模式：</span>
        目前使用虛擬數據，連接 Supabase 後數據將真實保存。
      </div>
    </div>
  );
}
