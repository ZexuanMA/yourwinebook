"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

const WINE_TYPES = ["red", "white", "sparkling", "rosé", "dessert"] as const;
const TYPE_LABELS: Record<string, string> = {
  red: "紅酒 Red",
  white: "白酒 White",
  sparkling: "氣泡酒 Sparkling",
  rosé: "玫瑰酒 Rosé",
  dessert: "甜酒 Dessert",
};

interface FormData {
  name: string;
  type: string;
  region: string;
  vintage: string;
  grape_variety: string;
  price_hkd: string;
  buy_url: string;
  description_zh: string;
}

const EMPTY: FormData = {
  name: "",
  type: "red",
  region: "",
  vintage: "",
  grape_variety: "",
  price_hkd: "",
  buy_url: "",
  description_zh: "",
};

export default function NewWinePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">提交成功！</h2>
        <p className="text-sm text-[#6B6B6B] mb-2">
          酒款「{form.name}」已提交，審核後將上架至平台。
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-6">
          Demo 模式：數據未實際保存。連接 Supabase 後將正式入庫。
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setForm(EMPTY); setSubmitted(false); }}
            className="px-4 py-2.5 border border-[#E8E0D6] rounded-xl text-sm hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            再新增一款
          </button>
          <Link
            href="/dashboard/wines"
            className="px-4 py-2.5 bg-[#8B1A1A] text-white rounded-xl text-sm hover:bg-[#6B1515] transition-colors"
          >
            返回酒款列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/wines"
          className="flex items-center gap-1 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          返回
        </Link>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">新增酒款</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <section className="bg-white border border-[#E8E0D6] rounded-2xl p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">基本資料</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                酒款名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Cloudy Bay Sauvignon Blanc 2023"
                className="w-full px-4 py-2.5 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                酒款類型 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors bg-white appearance-none"
              >
                {WINE_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                年份 Vintage
              </label>
              <input
                type="number"
                value={form.vintage}
                onChange={(e) => set("vintage", e.target.value)}
                placeholder="2023"
                min="1900"
                max="2030"
                className="w-full px-4 py-2.5 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                產區 Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
                placeholder="e.g. New Zealand · Marlborough"
                className="w-full px-4 py-2.5 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                葡萄品種 Grape
              </label>
              <input
                type="text"
                value={form.grape_variety}
                onChange={(e) => set("grape_variety", e.target.value)}
                placeholder="e.g. Sauvignon Blanc"
                className="w-full px-4 py-2.5 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                簡介（中文）
              </label>
              <textarea
                value={form.description_zh}
                onChange={(e) => set("description_zh", e.target.value)}
                placeholder="簡短描述這款酒的特色…"
                rows={3}
                className="w-full px-4 py-2.5 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors resize-none"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white border border-[#E8E0D6] rounded-2xl p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">定價資料</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                售價 (HKD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6B6B6B]">
                  HK$
                </span>
                <input
                  type="number"
                  required
                  value={form.price_hkd}
                  onChange={(e) => set("price_hkd", e.target.value)}
                  placeholder="138"
                  min="1"
                  className="w-full pl-12 pr-4 py-2.5 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                購買連結 Buy URL
              </label>
              <input
                type="url"
                value={form.buy_url}
                onChange={(e) => set("buy_url", e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-3 justify-end">
          <Link
            href="/dashboard/wines"
            className="px-5 py-2.5 border border-[#E8E0D6] rounded-xl text-sm hover:bg-[#FAF8F5] transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#6B1515] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "提交中…" : "提交審核"}
          </button>
        </div>
      </form>
    </div>
  );
}
