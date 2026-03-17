import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { merchants } from "@/lib/mock-data";

export default function MerchantsPage() {
  const t = useTranslations("partners");
  const locale = useLocale();
  const isZh = locale === "zh-HK";

  return (
    <>
      <div className="pt-28 pb-10 text-center">
        <div className="max-w-[1120px] mx-auto px-6">
          <h1 className="text-[32px] font-semibold mb-2">{t("sectionTitle")}</h1>
          <p className="text-base text-text-sub">
            {isZh ? "我們合作的優質酒商" : "Our trusted merchant partners"}
          </p>
        </div>
      </div>

      <section className="pb-20">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {merchants.map((m) => (
              <Link
                key={m.slug}
                href={`/merchants/${m.slug}`}
                className="block bg-white border border-wine-border rounded-2xl p-8 text-center hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(91,46,53,0.06)] transition-all"
              >
                <div className="w-16 h-16 bg-bg-card rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-wine-border">
                  🍷
                </div>
                <h3 className="font-en text-base font-semibold mb-1">{m.name}</h3>
                <p className="text-sm text-text-sub mb-2 line-clamp-2">
                  {isZh ? m.description_zh : m.description_en}
                </p>
                <div className="flex justify-center gap-4 text-xs text-text-sub mt-3">
                  <span>{m.winesListed} {isZh ? "款酒" : "wines"}</span>
                  <span>⭐ {m.rating}</span>
                </div>
                <p className="text-xs text-wine mt-2 font-medium">
                  {isZh ? "查看酒款 →" : "View wines →"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
