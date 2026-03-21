import { useTranslations } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("privacy");

  const sections = [
    { title: t("collectTitle"), content: t("collectDesc") },
    { title: t("useTitle"), content: t("useDesc") },
    { title: t("shareTitle"), content: t("shareDesc") },
    { title: t("cookieTitle"), content: t("cookieDesc") },
    { title: t("retentionTitle"), content: t("retentionDesc") },
    { title: t("rightsTitle"), content: t("rightsDesc") },
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
