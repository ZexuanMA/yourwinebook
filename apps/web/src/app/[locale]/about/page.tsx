import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <>
      <div className="pt-28 pb-10 text-center">
        <div className="max-w-[1120px] mx-auto px-6">
          <h1 className="text-[32px] font-semibold">{t("pageTitle")}</h1>
        </div>
      </div>

      <section className="pb-20 pt-5">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="py-10 border-b border-wine-border">
            <h3 className="text-xl font-semibold mb-3">{t("whoTitle")}</h3>
            <p className="text-[15px] text-text-sub leading-8">{t("whoDesc")}</p>
          </div>

          <div className="py-10 border-b border-wine-border">
            <h3 className="text-xl font-semibold mb-3">{t("whatTitle")}</h3>
            <p className="text-[15px] text-text-sub leading-8">
              <strong>{t("what1Title")}</strong> — {t("what1Desc")}
            </p>
            <p className="text-[15px] text-text-sub leading-8 mt-3">
              <strong>{t("what2Title")}</strong> — {t("what2Desc")}
            </p>
            <p className="text-[15px] text-text-sub leading-8 mt-3">
              <strong>{t("what3Title")}</strong> — {t("what3Desc")}
            </p>
          </div>

          <div className="py-10 border-b border-wine-border">
            <h3 className="text-xl font-semibold mb-3">{t("principlesTitle")}</h3>
            <p className="text-[15px] text-text-sub leading-8">
              <strong>{t("principle1")}</strong> — {t("principle1Desc")}
            </p>
            <p className="text-[15px] text-text-sub leading-8 mt-3">
              <strong>{t("principle2")}</strong> — {t("principle2Desc")}
            </p>
            <p className="text-[15px] text-text-sub leading-8 mt-3">
              <strong>{t("principle3")}</strong> — {t("principle3Desc")}
            </p>
          </div>

          <div className="py-10 text-center">
            <h3 className="text-xl font-semibold mb-3">{t("contactTitle")}</h3>
            <p className="text-[15px] text-text-sub leading-8">{t("contactDesc")}</p>
            <p className="mt-3">
              <a
                href="mailto:hello@yourwinebook.com"
                className="text-wine font-semibold border-b border-gold-light hover:border-wine transition-colors"
              >
                hello@yourwinebook.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
