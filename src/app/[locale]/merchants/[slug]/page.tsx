"use client";

import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { WineCard } from "@/components/wine/WineCard";
import { wines, merchants } from "@/lib/mock-data";
import { toWineCard } from "@/lib/locale-helpers";

export default function MerchantPage() {
  const t = useTranslations("merchant");
  const tSearch = useTranslations("search");
  const locale = useLocale();
  const isZh = locale === "zh-HK";
  const params = useParams();
  const slug = params.slug as string;

  const merchant = merchants.find((m) => m.slug === slug) ?? merchants[0];
  const wineCards = wines.map((w) => toWineCard(w, locale));

  return (
    <>
      <section>
        <div className="max-w-[1120px] mx-auto px-6">
          {/* Hero */}
          <div className="flex items-center gap-8 pt-28 pb-12 max-md:flex-col max-md:text-center">
            <div className="w-[100px] h-[100px] bg-bg-card rounded-2xl flex items-center justify-center text-[40px] shrink-0 border border-wine-border">
              🍷
            </div>
            <div>
              <h1 className="font-en text-[28px] font-bold mb-1">{merchant.name}</h1>
              <p className="text-[15px] text-text-sub leading-7">
                {isZh ? merchant.description_zh : merchant.description_en}
              </p>
              <div className="flex gap-6 flex-wrap mt-2 text-[13px] text-text-sub">
                {(isZh ? merchant.details_zh : merchant.details_en).map((d) => (
                  <span key={d} className="flex items-center gap-1.5">{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white border border-wine-border rounded-xl p-5 text-center">
              <div className="font-en text-[28px] font-bold text-wine">{merchant.winesListed}</div>
              <div className="text-[13px] text-text-sub mt-1">{t("winesListed")}</div>
            </div>
            <div className="bg-white border border-wine-border rounded-xl p-5 text-center">
              <div className="font-en text-[28px] font-bold text-wine">{merchant.bestPrices}</div>
              <div className="text-[13px] text-text-sub mt-1">{t("bestPrices")}</div>
            </div>
            <div className="bg-white border border-wine-border rounded-xl p-5 text-center">
              <div className="font-en text-[28px] font-bold text-wine">{merchant.rating}</div>
              <div className="text-[13px] text-text-sub mt-1">{t("userRating")}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white pt-10">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-10 h-0.5 bg-gold mx-auto mb-5" />
            <h2 className="text-[28px] font-semibold">
              {isZh ? "店內酒款" : "Available Wines"}
            </h2>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap mb-8">
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">{tSearch("filterType")}</label>
              <select className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9">
                <option>{tSearch("allTypes")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">{tSearch("filterRegion")}</label>
              <select className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9">
                <option>{tSearch("allRegions")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">{tSearch("filterPrice")}</label>
              <select className="px-4 py-2.5 border border-wine-border rounded-[10px] text-sm bg-white cursor-pointer hover:border-gold transition-colors appearance-none pr-9">
                <option>{tSearch("allPrices")}</option>
              </select>
            </div>
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
