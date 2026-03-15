"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Search, X } from "lucide-react";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  const switchLocale = () => {
    const next = locale === "zh-HK" ? "en" : "zh-HK";
    router.replace(pathname, { locale: next });
  };

  const handleNavSearch = () => {
    if (navSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(navSearch.trim())}`);
      setSearchOpen(false);
      setNavSearch("");
    } else {
      router.push("/search");
      setSearchOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/92 backdrop-blur-md border-b border-wine-border">
      {/* Inline search bar */}
      {searchOpen && (
        <div className="absolute inset-0 bg-bg/95 backdrop-blur-md flex items-center px-6 z-10">
          <div className="max-w-[1120px] mx-auto w-full flex items-center gap-3">
            <Search className="w-4 h-4 text-text-sub shrink-0" />
            <input
              type="text"
              autoFocus
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNavSearch()}
              placeholder={locale === "zh-HK" ? "搜索酒名、產區..." : "Search wines..."}
              className="flex-1 bg-transparent border-none outline-none text-base text-text"
            />
            <button
              onClick={() => { setSearchOpen(false); setNavSearch(""); }}
              className="p-1 cursor-pointer bg-transparent border-none"
            >
              <X className="w-4 h-4 text-text-sub" />
            </button>
          </div>
        </div>
      )}
      <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-en font-bold text-lg tracking-tight text-wine">
          Your Wine Book
        </Link>
        <ul className="flex items-center gap-7 text-sm font-medium text-text-sub list-none">
          <li>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-wine-border rounded-lg text-[13px] text-text-sub hover:border-gold transition-colors cursor-pointer bg-transparent"
            >
              <Search className="w-3.5 h-3.5 opacity-50" />
              {t("search")}
            </button>
          </li>
          <li className="hidden md:block">
            <Link href="/search" className="hover:text-wine transition-colors">
              {t("explore")}
            </Link>
          </li>
          <li className="hidden md:block">
            <Link href="/merchants" className="hover:text-wine transition-colors">
              {t("merchants")}
            </Link>
          </li>
          <li className="hidden md:block">
            <Link href="/about" className="hover:text-wine transition-colors">
              {t("about")}
            </Link>
          </li>
          <li>
            <button
              onClick={switchLocale}
              className="font-en text-xs font-semibold px-2.5 py-1 border border-wine-border rounded hover:border-gold hover:text-wine transition-all cursor-pointer bg-transparent text-text-sub"
            >
              {t("langSwitch")}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
