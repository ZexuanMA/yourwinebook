"use client";

import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { WineCard } from "@/components/wine/WineCard";
import { scenes } from "@/lib/mock-data";
import type { Wine } from "@/lib/mock-data";
import { toWineCard, getSceneLocale } from "@/lib/locale-helpers";

export default function ScenePage() {
  const t = useTranslations("scene");
  const tSearch = useTranslations("search");
  const locale = useLocale();
  const isZh = locale === "zh-HK";
  const params = useParams();
  const slug = params.slug as string;

  const scene = scenes.find((s) => s.slug === slug) ?? scenes[0];
  const localized = getSceneLocale(scene, locale);

  const [sceneWineList, setSceneWineList] = useState<Wine[]>([]);

  useEffect(() => {
    fetch(`/api/scenes/${slug}/wines`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Wine[]) => setSceneWineList(data))
      .catch(() => {});
  }, [slug]);

  const wineCards = sceneWineList.map((w) => ({
    ...toWineCard(w, locale),
    badge: w.slug === sceneWineList[0]?.slug ? "Top Pick" : undefined,
  }));

  const tabs = [
    t("all"), t("hotpot"), t("bbq"), t("chinese"), t("western"), t("japanese"),
  ];

  return (
    <>
      <div className="pt-28 pb-10 text-center">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-5xl mb-4">{localized.emoji}</div>
          <h1 className="text-[32px] font-semibold mb-2">{localized.title}</h1>
          <p className="text-base text-text-sub max-w-[500px] mx-auto">
            {localized.description}
          </p>
        </div>
      </div>

      <section className="pb-20">
        <div className="max-w-[1120px] mx-auto px-6">
          {/* Scene tabs */}
          <div className="flex justify-center gap-3 flex-wrap mb-10">
            {tabs.map((tab, i) => (
              <span
                key={tab}
                className={`px-5 py-2.5 border rounded-3xl text-sm font-medium cursor-pointer transition-all ${
                  i === 0
                    ? "border-wine text-wine bg-red-light"
                    : "border-wine-border text-text-sub bg-white hover:border-wine hover:text-wine hover:bg-red-light"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap mb-8">
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">{t("groupSize")}</label>
              <select className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9">
                <option>{isZh ? "不限" : "Any"}</option>
                <option>2 {isZh ? "人" : "people"}</option>
                <option>3–6 {isZh ? "人" : "people"}</option>
                <option>6+ {isZh ? "人" : "people"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">{t("budgetPerBottle")}</label>
              <select className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9">
                <option>{isZh ? "不限" : "Any"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">{t("type")}</label>
              <select className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9">
                <option>{tSearch("allTypes")}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-text-sub">
              {t("resultsCount", { count: wineCards.length })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wineCards.map((wine) => (
              <WineCard key={wine.slug} wine={wine} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
