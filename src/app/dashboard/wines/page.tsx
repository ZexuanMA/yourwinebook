"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, ExternalLink } from "lucide-react";
import { wines, winePrices } from "@/lib/mock-data";

interface Merchant {
  slug: string;
  name: string;
}

export default function DashboardWines() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMerchant);
  }, []);

  if (!merchant) {
    return <div className="animate-pulse h-64 bg-white rounded-2xl" />;
  }

  // All wines this merchant has pricing for
  const myWines = Object.entries(winePrices)
    .filter(([, prices]) => prices.some((p) => p.merchantSlug === merchant.slug))
    .map(([slug, prices]) => {
      const wine = wines.find((w) => w.slug === slug);
      const myPrice = prices.find((p) => p.merchantSlug === merchant.slug);
      return wine && myPrice ? { wine, price: myPrice.price, isBest: myPrice.isBest } : null;
    })
    .filter(Boolean) as { wine: (typeof wines)[0]; price: number; isBest: boolean }[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">酒款管理</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">共 {myWines.length} 款已上架比價</p>
        </div>
        <Link
          href="/dashboard/wines/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#6B1515] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          新增酒款
        </Link>
      </div>

      <div className="bg-white border border-[#E8E0D6] rounded-2xl overflow-hidden">
        {myWines.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🍷</p>
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">尚未有上架酒款</p>
            <p className="text-xs text-[#6B6B6B] mb-4">點擊「新增酒款」開始上架</p>
            <Link
              href="/dashboard/wines/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B1A1A] text-white rounded-lg text-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              新增酒款
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#FAF8F5] border-b border-[#E8E0D6]">
              <tr>
                <th className="text-left px-6 py-3.5 font-medium text-[#6B6B6B]">酒款</th>
                <th className="text-left px-6 py-3.5 font-medium text-[#6B6B6B]">類型</th>
                <th className="text-left px-6 py-3.5 font-medium text-[#6B6B6B]">產區</th>
                <th className="text-right px-6 py-3.5 font-medium text-[#6B6B6B]">價格 (HKD)</th>
                <th className="text-center px-6 py-3.5 font-medium text-[#6B6B6B]">狀態</th>
                <th className="text-right px-6 py-3.5 font-medium text-[#6B6B6B]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE2]">
              {myWines.map(({ wine, price, isBest }) => (
                <tr key={wine.slug} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{wine.emoji}</span>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{wine.name}</p>
                        {wine.vintage && (
                          <p className="text-xs text-[#6B6B6B]">{wine.vintage}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#6B6B6B] capitalize">{wine.type}</td>
                  <td className="px-6 py-4 text-[#6B6B6B] max-w-[160px] truncate">
                    {wine.region_en.split(" · ")[0]}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-[#1A1A1A]">
                    ${price}
                  </td>
                  <td className="px-6 py-4 text-center">
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
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/zh-HK/wines/${wine.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-[#8B1A1A] hover:underline"
                    >
                      查看頁面
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <span className="font-medium">Demo 模式：</span>
        目前僅顯示已有比價數據的酒款。連接 Supabase 後可管理所有上架酒款。
      </div>
    </div>
  );
}
