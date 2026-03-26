"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Wine, MapPin, Grape, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { useDashboardLang } from "@/lib/dashboard-lang-context";
import type { Wine as WineType } from "@/lib/mock-data";

interface FormData {
  name: string;
  region_zh: string;
  region_en: string;
  vintage: string;
  grape_variety: string;
  description_zh: string;
  description_en: string;
}

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

const TYPE_EMOJI: Record<string, string> = {
  red: "🍷",
  white: "🍾",
  sparkling: "🥂",
  rosé: "🌸",
  dessert: "🍯",
};

export default function EditWinePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { t } = useDashboardLang();

  const [wine, setWine] = useState<WineType | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showDelist, setShowDelist] = useState(false);
  const [delisting, setDelisting] = useState(false);

  useEffect(() => {
    // Fetch wine data
    fetch("/api/merchant/wines")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const found = data.wines.find((w: WineType) => w.slug === slug);
          if (found) {
            setWine(found);
            setForm({
              name: found.name,
              region_zh: found.region_zh,
              region_en: found.region_en,
              vintage: found.vintage ? String(found.vintage) : "",
              grape_variety: found.grape_variety || "",
              description_zh: found.description_zh || "",
              description_en: found.description_en || "",
            });
          }
        }
        setLoading(false);
      });
  }, [slug]);

  const set = (key: keyof FormData, value: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const body: Record<string, unknown> = {};
      if (form.name !== wine?.name) body.name = form.name.trim();
      if (form.region_zh !== wine?.region_zh) body.region_zh = form.region_zh.trim();
      if (form.region_en !== wine?.region_en) body.region_en = form.region_en.trim();
      const newVintage = form.vintage ? parseInt(form.vintage) : undefined;
      if (newVintage !== wine?.vintage) body.vintage = newVintage;
      if (form.grape_variety !== (wine?.grape_variety || "")) body.grape_variety = form.grape_variety.trim();
      if (form.description_zh !== (wine?.description_zh || "")) body.description_zh = form.description_zh.trim();
      if (form.description_en !== (wine?.description_en || "")) body.description_en = form.description_en.trim();

      if (Object.keys(body).length === 0) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return;
      }

      const res = await fetch(`/api/merchant/wines/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("editWine.error"));
        return;
      }

      const { wine: updated } = await res.json();
      setWine(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(t("editWine.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelist = async () => {
    setDelisting(true);
    try {
      const res = await fetch(`/api/merchant/wines/${slug}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/wines");
      } else {
        setError("Failed to delist");
        setShowDelist(false);
      }
    } catch {
      setError("Failed to delist");
      setShowDelist(false);
    } finally {
      setDelisting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-bg-card rounded-2xl" />;
  }

  if (!wine || !form) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-sm text-text-sub">{t("editWine.notFound")}</p>
        <Link href="/dashboard/wines" className="text-sm text-wine hover:underline mt-4 inline-block">
          {t("editWine.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Back nav */}
      <Link
        href="/dashboard/wines"
        className="inline-flex items-center gap-1.5 text-sm text-text-sub hover:text-text transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {t("editWine.back")}
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">{TYPE_EMOJI[wine.type] || "🍷"}</span>
        <h1 className="text-2xl font-semibold text-text">{t("editWine.title")}</h1>
      </div>
      <p className="text-sm text-text-sub mb-8">{t("editWine.subtitle")}</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {saved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-700">{t("editWine.saved")}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Wine type (read-only) */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Wine className="w-4 h-4 text-wine" />
            <h2 className="font-semibold text-text text-sm">{t("newWine.wineType")}</h2>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-bg rounded-xl">
            <span className="text-xl">{TYPE_EMOJI[wine.type] || "🍷"}</span>
            <span className="text-sm font-medium text-text">
              {t(`wines.type${wine.type.charAt(0).toUpperCase() + wine.type.slice(1)}`)}
            </span>
            <span className="text-xs text-text-sub ml-auto">slug: {wine.slug}</span>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{TYPE_EMOJI[wine.type] || "🍷"}</span>
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
              />
            </div>
            <div>
              <FieldLabel>{t("newWine.vintage")}</FieldLabel>
              <Input
                type="number"
                value={form.vintage}
                onChange={(e) => set("vintage", e.target.value)}
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
              />
            </div>
            <div>
              <FieldLabel required>{t("newWine.regionEn")}</FieldLabel>
              <Input
                type="text"
                required
                value={form.region_en}
                onChange={(e) => set("region_en", e.target.value)}
              />
            </div>
          </div>
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
                rows={3}
                className="w-full px-4 py-3 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all resize-none placeholder:text-text-sub/40"
              />
            </div>
            <div>
              <FieldLabel>{t("newWine.descEn")}</FieldLabel>
              <textarea
                value={form.description_en}
                onChange={(e) => set("description_en", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all resize-none placeholder:text-text-sub/40"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowDelist(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            {t("editWine.delist")}
          </button>
          <div className="flex gap-3">
            <Link
              href="/dashboard/wines"
              className="px-5 py-2.5 border border-wine-border rounded-xl text-sm font-medium hover:bg-bg transition-colors text-text-sub"
            >
              {t("newWine.cancel")}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 cursor-pointer shadow-sm"
            >
              {saving ? t("editWine.saving") : t("editWine.save")}
            </button>
          </div>
        </div>
      </form>

      {/* Delist confirmation dialog */}
      {showDelist && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-text text-center mb-2">{t("editWine.delist")}</h3>
            <p className="text-sm text-text-sub text-center mb-6">{t("editWine.delistConfirm")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelist(false)}
                className="flex-1 px-4 py-2.5 border border-wine-border rounded-xl text-sm font-medium hover:bg-bg transition-colors cursor-pointer"
              >
                {t("editWine.delistCancel")}
              </button>
              <button
                onClick={handleDelist}
                disabled={delisting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {delisting ? "..." : t("editWine.delistBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
