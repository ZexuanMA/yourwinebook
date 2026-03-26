"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle, Wine, MapPin, Grape, DollarSign, Link2, AlertCircle } from "lucide-react";
import { useDashboardLang } from "@/lib/dashboard-lang-context";

interface FormData {
  name: string;
  type: string;
  region_zh: string;
  region_en: string;
  vintage: string;
  grape_variety: string;
  price_hkd: string;
  buy_url: string;
  description_zh: string;
  description_en: string;
}

const EMPTY: FormData = {
  name: "",
  type: "red",
  region_zh: "",
  region_en: "",
  vintage: "",
  grape_variety: "",
  price_hkd: "",
  buy_url: "",
  description_zh: "",
  description_en: "",
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
  const { t } = useDashboardLang();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const WINE_TYPES = [
    { value: "red", label: t("wines.typeRed"), emoji: "🍷" },
    { value: "white", label: t("wines.typeWhite"), emoji: "🍾" },
    { value: "sparkling", label: t("wines.typeSparkling"), emoji: "🥂" },
    { value: "rosé", label: t("wines.typeRosé"), emoji: "🌸" },
    { value: "dessert", label: t("wines.typeDessert"), emoji: "🍯" },
  ];

  const set = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/merchant/wines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          region_zh: form.region_zh.trim(),
          region_en: form.region_en.trim(),
          grape_variety: form.grape_variety.trim() || undefined,
          vintage: form.vintage ? parseInt(form.vintage) : undefined,
          description_zh: form.description_zh.trim() || undefined,
          description_en: form.description_en.trim() || undefined,
          price: parseFloat(form.price_hkd),
          buy_url: form.buy_url.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("newWine.error"));
        return;
      }

      setSubmitted(true);
    } catch {
      setError(t("newWine.error"));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-text mb-2">{t("newWine.success")}</h2>
        <p className="text-sm text-text-sub mb-1">
          {t("newWine.successMsg")}：「<span className="font-medium text-text">{form.name}</span>」
        </p>
        <p className="text-sm text-text-sub mb-6">{t("newWine.successReview")}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setForm(EMPTY); setSubmitted(false); }}
            className="px-5 py-2.5 border border-wine-border rounded-xl text-sm hover:bg-bg transition-colors cursor-pointer font-medium"
          >
            {t("newWine.addAnother")}
          </button>
          <Link
            href="/dashboard/wines"
            className="px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors"
          >
            {t("newWine.backToList")}
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
        {t("newWine.back")}
      </Link>

      <h1 className="text-2xl font-semibold text-text mb-1">{t("newWine.title")}</h1>
      <p className="text-sm text-text-sub mb-8">{t("newWine.subtitle")}</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Wine type selector */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wine className="w-4 h-4 text-wine" />
            <h2 className="font-semibold text-text text-sm">{t("newWine.wineType")}</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {WINE_TYPES.map((wt) => (
              <button
                key={wt.value}
                type="button"
                onClick={() => set("type", wt.value)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  form.type === wt.value
                    ? "bg-red-light border-wine text-wine shadow-sm"
                    : "bg-bg border-wine-border text-text-sub hover:border-gold hover:text-text"
                }`}
              >
                <span className="text-xl">{wt.emoji}</span>
                {wt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{selectedType?.emoji}</span>
            <h2 className="font-semibold text-text text-sm">{t("newWine.basicInfo")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldLabel required>{t("newWine.wineName")}</FieldLabel>
              <Input
                type="text"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Cloudy Bay Sauvignon Blanc 2023"
              />
            </div>
            <div>
              <FieldLabel>{t("newWine.vintage")}</FieldLabel>
              <Input
                type="number"
                value={form.vintage}
                onChange={(e) => set("vintage", e.target.value)}
                placeholder="2023"
                min="1900"
                max="2030"
              />
            </div>
            <div>
              <FieldLabel>{t("newWine.grape")}</FieldLabel>
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

        {/* Region — bilingual */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-wine" />
            <h2 className="font-semibold text-text text-sm">{t("newWine.regionInfo")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>{t("newWine.regionZh")}</FieldLabel>
              <Input
                type="text"
                required
                value={form.region_zh}
                onChange={(e) => set("region_zh", e.target.value)}
                placeholder="紐西蘭 · 馬爾堡羅 · 白酒"
              />
            </div>
            <div>
              <FieldLabel required>{t("newWine.regionEn")}</FieldLabel>
              <Input
                type="text"
                required
                value={form.region_en}
                onChange={(e) => set("region_en", e.target.value)}
                placeholder="New Zealand · Marlborough · White"
              />
            </div>
          </div>
          <p className="text-xs text-text-sub mt-2">{t("newWine.regionHint")}</p>
        </div>

        {/* Description — bilingual */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <h2 className="font-semibold text-text text-sm mb-4">{t("newWine.description")}</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel>{t("newWine.descZh")}</FieldLabel>
              <textarea
                value={form.description_zh}
                onChange={(e) => set("description_zh", e.target.value)}
                placeholder={t("newWine.descPlaceholderZh")}
                rows={3}
                className="w-full px-4 py-3 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all resize-none placeholder:text-text-sub/40"
              />
            </div>
            <div>
              <FieldLabel>{t("newWine.descEn")}</FieldLabel>
              <textarea
                value={form.description_en}
                onChange={(e) => set("description_en", e.target.value)}
                placeholder={t("newWine.descPlaceholderEn")}
                rows={3}
                className="w-full px-4 py-3 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all resize-none placeholder:text-text-sub/40"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-wine" />
            <h2 className="font-semibold text-text text-sm">{t("newWine.pricing")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>{t("newWine.price")}</FieldLabel>
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
              <FieldLabel>{t("newWine.buyUrl")}</FieldLabel>
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
            {t("newWine.cancel")}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 cursor-pointer shadow-sm"
          >
            {loading ? t("newWine.submitting") : t("newWine.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
