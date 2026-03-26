import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-6">🍷</p>
      <h1 className="text-2xl font-semibold text-text mb-3">{t("title")}</h1>
      <p className="text-sm text-text-sub max-w-md mb-8">{t("description")}</p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors"
        >
          {t("backHome")}
        </Link>
        <Link
          href="/search"
          className="px-5 py-2.5 border border-wine-border rounded-xl text-sm font-medium hover:bg-bg transition-colors text-text"
        >
          {t("backSearch")}
        </Link>
      </div>
    </div>
  );
}
