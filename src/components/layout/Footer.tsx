import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="py-10 border-t border-wine-border text-center">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="font-en font-bold text-base text-wine mb-4">
          Your Wine Book
        </div>
        <ul className="flex justify-center gap-8 list-none text-[13px] text-text-sub mb-5">
          <li>
            <Link href="/search" className="hover:text-wine transition-colors">
              {t("explore")}
            </Link>
          </li>
          <li>
            <Link href="/merchants" className="hover:text-wine transition-colors">
              {t("merchants")}
            </Link>
          </li>
          <li>
            <Link href="/community" className="hover:text-wine transition-colors">
              {t("community")}
            </Link>
          </li>
          <li>
            <Link href="/about" className="hover:text-wine transition-colors">
              {t("about")}
            </Link>
          </li>
          <li>
            <Link href="/join" className="hover:text-wine transition-colors">
              {t("join")}
            </Link>
          </li>
        </ul>
        <p className="text-xs text-text-sub font-en">{t("copyright")}</p>
      </div>
    </footer>
  );
}
