import { useTranslations } from "next-intl";

export default function TermsPage() {
  const t = useTranslations("terms");

  const sections = [
    { title: t("acceptTitle"), content: t("acceptDesc") },
    { title: t("eligibilityTitle"), content: t("eligibilityDesc") },
    { title: t("accountTitle"), content: t("accountDesc") },
    { title: t("contentTitle"), content: t("contentDesc") },
    { title: t("pricingTitle"), content: t("pricingDesc") },
    { title: t("ipTitle"), content: t("ipDesc") },
    { title: t("disclaimerTitle"), content: t("disclaimerDesc") },
    { title: t("contactTitle"), content: t("contactDesc") },
  ];

  return (
    <>
      <div className="pt-28 pb-10 text-center">
        <div className="max-w-[1120px] mx-auto px-6">
          <h1 className="text-[32px] font-semibold">{t("pageTitle")}</h1>
          <p className="text-sm text-text-sub mt-2">{t("lastUpdated")}</p>
        </div>
      </div>

      <section className="pb-20 pt-5">
        <div className="max-w-[800px] mx-auto px-6">
          {sections.map((s, i) => (
            <div key={i} className="py-8 border-b border-wine-border last:border-b-0">
              <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-[15px] text-text-sub leading-8 whitespace-pre-line">{s.content}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
