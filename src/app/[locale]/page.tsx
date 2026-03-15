import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { SceneCard } from "@/components/scene/SceneCard";
import { WineCard } from "@/components/wine/WineCard";
import { AiRecItem } from "@/components/ai/AiRecItem";
import { HeroSearch } from "@/components/search/HeroSearch";
import { wines, scenes, partners } from "@/lib/mock-data";
import { toWineCard, getSceneLocale } from "@/lib/locale-helpers";

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();

  const sceneCards = scenes.map((s) => getSceneLocale(s, locale));

  const featuredWines = wines
    .filter((w) => w.is_featured)
    .slice(0, 3)
    .map((w) => ({
      ...toWineCard(w, locale),
      badge: w.badge ? t("featured.editorsPick") : undefined,
    }));

  return (
    <>
      {/* Hero */}
      <section className="pt-40 pb-24 text-center">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="font-en text-sm font-semibold tracking-[2px] uppercase text-gold mb-4">
            {t("hero.tagline")}
          </div>
          <h1 className="font-en text-[clamp(36px,5vw,56px)] font-bold leading-[1.15] tracking-tight text-wine mb-2">
            {t("hero.title1")}
            <br />
            {t("hero.title2")}
          </h1>
          <p className="text-[clamp(18px,2.5vw,22px)] text-text-sub mb-10">
            {t("hero.subtitle")}
          </p>
          <p className="text-base text-text-sub leading-8 mb-12">
            {t("hero.desc1")}
            <br />
            {t("hero.desc2")}
            <br />
            {t("hero.desc3")}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <HeroSearch />
            <Link
              href="/ai"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-wine text-white text-[15px] font-medium rounded-xl hover:bg-wine-dark hover:-translate-y-0.5 transition-all"
            >
              {t("hero.ctaAI")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Scenes */}
      <section className="py-20">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-10 h-0.5 bg-gold mx-auto mb-5" />
            <h2 className="text-[28px] font-semibold">{t("scenes.sectionTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sceneCards.map((scene) => (
              <SceneCard
                key={scene.slug}
                scene={scene}
                exploreLabel={t("scenes.exploreBtn")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Wines */}
      <section className="py-20 bg-white">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-10 h-0.5 bg-gold mx-auto mb-5" />
            <h2 className="text-[28px] font-semibold mb-1">
              {t("featured.sectionTitle")}
            </h2>
            <span className="font-en text-sm font-medium text-gold tracking-wide">
              {t("featured.sectionSubtitle")}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredWines.map((wine) => (
              <WineCard key={wine.slug} wine={wine} />
            ))}
          </div>
        </div>
      </section>

      {/* AI Preview */}
      <section className="py-20">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-15 items-center">
            <div>
              <div className="w-10 h-0.5 bg-gold mb-5" />
              <h2 className="text-[32px] font-semibold mb-4">
                {t("ai.sectionTitle")}
                <br />
                {t("ai.sectionTitle2")}
              </h2>
              <p className="text-base text-text-sub leading-7 mb-7">
                {t("ai.sectionDesc")}
              </p>
              <Link
                href="/ai"
                className="inline-flex items-center gap-2 px-7 py-3 bg-wine text-white text-[15px] font-medium rounded-xl hover:bg-wine-dark hover:-translate-y-0.5 transition-all"
              >
                {t("ai.startBtn")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white border border-wine-border rounded-[20px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <div className="text-[13px] font-semibold text-gold mb-5 font-en tracking-wide uppercase">
                {t("ai.demoHeader")}
              </div>
              {/* User bubble */}
              <div className="bg-wine text-white p-3.5 rounded-[14px] rounded-br-sm text-sm leading-relaxed mb-3 max-w-[85%] ml-auto">
                {t("ai.demoUser")}
              </div>
              {/* AI bubble */}
              <div className="bg-white border border-wine-border p-3.5 rounded-[14px] rounded-bl-sm text-sm leading-relaxed mb-3 max-w-[85%]">
                {t("ai.demoAI")}
                <AiRecItem
                  name={t("ai.rec1Name")}
                  price={t("ai.rec1Price")}
                  reason={t("ai.rec1Reason")}
                />
                <AiRecItem
                  name={t("ai.rec2Name")}
                  price={t("ai.rec2Price")}
                  reason={t("ai.rec2Reason")}
                />
                <AiRecItem
                  name={t("ai.rec3Name")}
                  price={t("ai.rec3Price")}
                  reason={t("ai.rec3Reason")}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-15 bg-white border-t border-wine-border">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-10 h-0.5 bg-gold mx-auto mb-5" />
            <h2 className="text-[28px] font-semibold">{t("partners.sectionTitle")}</h2>
          </div>
          <div className="flex justify-center items-center gap-12 flex-wrap">
            {partners.map((name) => (
              <div
                key={name}
                className="w-[100px] h-12 bg-bg-card rounded-lg flex items-center justify-center font-en text-[11px] font-semibold text-text-sub tracking-wide"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Merchant CTA */}
      <section className="py-15 text-center border-t border-wine-border">
        <div className="max-w-[1120px] mx-auto px-6">
          <p className="text-[15px] text-text-sub leading-7">
            {t("merchantCta.text")}
            <br />
            {t("merchantCta.contact")}{" "}
            <a
              href="mailto:partner@yourwinebook.com"
              className="text-wine font-semibold border-b border-gold-light hover:border-wine transition-colors"
            >
              partner@yourwinebook.com
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
