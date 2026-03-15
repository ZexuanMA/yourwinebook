"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, Wine, MapPin, Grape, DollarSign, Link2 } from "lucide-react";
import Link from "next/link";

const WINE_TYPES = [
  { value: "red", label: "紅酒", emoji: "🍷" },
  { value: "white", label: "白酒", emoji: "🍾" },
  { value: "sparkling", label: "氣泡酒", emoji: "🥂" },
  { value: "rosé", label: "玫瑰酒", emoji: "🌸" },
  { value: "dessert", label: "甜酒", emoji: "🍯" },
] as const;

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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-text mb-1.5">
      {children}
      {required && <span className="text-wine ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-2.5 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all placeholder:text-text-sub/40 ${className}`}
      {...props}
    />
  );
}

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
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-text mb-2">提交成功！</h2>
        <p className="text-sm text-text-sub mb-1">
          酒款「<span className="font-medium text-text">{form.name}</span>」已提交。
        </p>
        <p className="text-sm text-text-sub mb-6">審核通過後將上架至平台比價列表。</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setForm(EMPTY); setSubmitted(false); }}
            className="px-5 py-2.5 border border-wine-border rounded-xl text-sm hover:bg-bg transition-colors cursor-pointer font-medium"
          >
            再新增一款
          </button>
          <Link
            href="/dashboard/wines"
            className="px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors"
          >
            返回酒款列表
          </Link>
        </div>
      </div>
    );
  }

  const selectedType = WINE_TYPES.find((t) => t.value === form.type);

  return (
    <div className="max-w-2xl">
      {/* Back nav */}
      <Link
        href="/dashboard/wines"
        className="inline-flex items-center gap-1.5 text-sm text-text-sub hover:text-text transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        返回酒款管理
      </Link>

      <h1 className="text-2xl font-semibold text-text mb-1">新增酒款</h1>
      <p className="text-sm text-text-sub mb-8">填寫酒款資料後提交審核，通過後自動上架比價</p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Wine type selector */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wine className="w-4 h-4 text-wine" />
            <h2 className="font-semibold text-text text-sm">酒款類型</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {WINE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("type", t.value)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  form.type === t.value
                    ? "bg-red-light border-wine text-wine shadow-sm"
                    : "bg-bg border-wine-border text-text-sub hover:border-gold hover:text-text"
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{selectedType?.emoji}</span>
            <h2 className="font-semibold text-text text-sm">基本資料</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldLabel required>酒款名稱（英文）</FieldLabel>
              <Input
                type="text"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Cloudy Bay Sauvignon Blanc 2023"
              />
            </div>
            <div>
              <FieldLabel required>年份 Vintage</FieldLabel>
              <Input
                type="number"
                required
                value={form.vintage}
                onChange={(e) => set("vintage", e.target.value)}
                placeholder="2023"
                min="1900"
                max="2030"
              />
            </div>
            <div>
              <FieldLabel>葡萄品種 Grape</FieldLabel>
              <div className="relative">
                <Grape className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/40" />
                <Input
                  type="text"
                  value={form.grape_variety}
                  onChange={(e) => set("grape_variety", e.target.value)}
                  placeholder="Sauvignon Blanc"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Region */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-wine" />
            <h2 className="font-semibold text-text text-sm">產區資料</h2>
          </div>
          <FieldLabel required>產區 Region</FieldLabel>
          <Input
            type="text"
            required
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            placeholder="e.g. New Zealand · Marlborough · Sauvignon Blanc"
          />
          <p className="text-xs text-text-sub mt-2">格式建議：國家 · 地區 · 子產區</p>
        </div>

        {/* Description */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <h2 className="font-semibold text-text text-sm mb-4">酒款描述（可選）</h2>
          <textarea
            value={form.description_zh}
            onChange={(e) => set("description_zh", e.target.value)}
            placeholder="用中文簡單描述這款酒的特色、口感、適合場景…"
            rows={4}
            className="w-full px-4 py-3 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all resize-none placeholder:text-text-sub/40"
          />
        </div>

        {/* Pricing */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-wine" />
            <h2 className="font-semibold text-text text-sm">定價資料</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>售價 (HKD)</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-sub font-medium">HK$</span>
                <Input
                  type="number"
                  required
                  value={form.price_hkd}
                  onChange={(e) => set("price_hkd", e.target.value)}
                  placeholder="138"
                  min="1"
                  className="pl-12"
                />
              </div>
            </div>
            <div>
              <FieldLabel>購買連結</FieldLabel>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/40" />
                <Input
                  type="url"
                  value={form.buy_url}
                  onChange={(e) => set("buy_url", e.target.value)}
                  placeholder="https://..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end pt-2">
          <Link
            href="/dashboard/wines"
            className="px-5 py-2.5 border border-wine-border rounded-xl text-sm font-medium hover:bg-bg transition-colors text-text-sub"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 cursor-pointer shadow-sm"
          >
            {loading ? "提交中…" : "提交審核"}
          </button>
        </div>
      </form>
    </div>
  );
}
