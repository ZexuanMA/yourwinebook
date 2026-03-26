"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Search, X, User, LogOut, Bookmark, Settings, Clock, TrendingUp } from "lucide-react";
import { getDisplayInitial, normalizeDisplayName } from "@/lib/display-name";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

function normalizeUserProfile(value: unknown): UserProfile | null {
  if (!value || typeof value !== "object") return null;

  const user = value as Partial<UserProfile>;
  if (typeof user.id !== "string" || typeof user.email !== "string") return null;

  return {
    id: user.id,
    email: user.email,
    name: normalizeDisplayName(user.name, user.email),
  };
}

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    fetch("/api/user/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(normalizeUserProfile(data)))
      .catch(() => null);
  }, [pathname]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLocale = () => {
    const next = locale === "zh-HK" ? "en" : "zh-HK";
    router.replace(pathname, { locale: next });
  };

  const getRecent = (): string[] => {
    try {
      const raw = localStorage.getItem("wb_recent_searches");
      return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : [];
    } catch { return []; }
  };

  const saveRecent = (q: string) => {
    if (!q.trim()) return;
    try {
      const existing = getRecent().filter((s) => s !== q.trim());
      localStorage.setItem("wb_recent_searches", JSON.stringify([q.trim(), ...existing].slice(0, 5)));
    } catch { /* ignore */ }
  };

  const handleNavSearch = (q?: string) => {
    const query = (q ?? navSearch).trim();
    if (query) {
      saveRecent(query);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/search");
    }
    setSearchOpen(false); setNavSearch("");
  };

  const handleLogout = async () => {
    await fetch("/api/user/auth/logout", { method: "POST" });
    setUser(null); setUserMenuOpen(false);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/92 backdrop-blur-md border-b border-wine-border">
      {searchOpen && (
        <div className="absolute inset-0 bg-bg/95 backdrop-blur-md flex items-center px-6 z-10">
          <div className="max-w-[1120px] mx-auto w-full">
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-text-sub shrink-0" />
              <input type="text" autoFocus value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNavSearch()}
                placeholder={locale === "zh-HK" ? "搜索酒名、產區..." : "Search wines..."}
                className="flex-1 bg-transparent border-none outline-none text-base text-text"
              />
              <button onClick={() => { setSearchOpen(false); setNavSearch(""); }}
                className="p-1 cursor-pointer bg-transparent border-none">
                <X className="w-4 h-4 text-text-sub" />
              </button>
            </div>
            {/* Recent + Hot terms below search */}
            {!navSearch && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {getRecent().length > 0 ? (
                  <>
                    <Clock className="w-3 h-3 text-text-sub/40" />
                    {getRecent().map((q) => (
                      <button key={q} onClick={() => handleNavSearch(q)}
                        className="px-2.5 py-1 bg-white/60 border border-wine-border rounded-lg text-xs text-text hover:border-gold transition-colors cursor-pointer">
                        {q}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3 text-text-sub/40" />
                    {(locale === "zh-HK"
                      ? ["Sauvignon Blanc", "Pinot Noir", "Champagne", "波爾多", "紐西蘭"]
                      : ["Sauvignon Blanc", "Pinot Noir", "Champagne", "Bordeaux", "Burgundy"]
                    ).map((q) => (
                      <button key={q} onClick={() => handleNavSearch(q)}
                        className="px-2.5 py-1 bg-white/60 border border-wine-border rounded-lg text-xs text-text hover:border-gold transition-colors cursor-pointer">
                        {q}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-en font-bold text-lg tracking-tight text-wine">
          Your Wine Book
        </Link>

        <ul className="flex items-center gap-6 text-sm font-medium text-text-sub list-none">
          <li>
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-wine-border rounded-lg text-[13px] text-text-sub hover:border-gold transition-colors cursor-pointer bg-transparent">
              <Search className="w-3.5 h-3.5 opacity-50" /> {t("search")}
            </button>
          </li>
          <li className="hidden md:block"><Link href="/search" className="hover:text-wine transition-colors">{t("explore")}</Link></li>
          <li className="hidden md:block"><Link href="/merchants" className="hover:text-wine transition-colors">{t("merchants")}</Link></li>
          <li className="hidden md:block"><Link href="/about" className="hover:text-wine transition-colors">{t("about")}</Link></li>
          <li>
            <button onClick={switchLocale}
              className="font-en text-xs font-semibold px-2.5 py-1 border border-wine-border rounded hover:border-gold hover:text-wine transition-all cursor-pointer bg-transparent text-text-sub">
              {t("langSwitch")}
            </button>
          </li>

          {/* User */}
          <li className="relative" ref={menuRef}>
            {user ? (
              <>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 cursor-pointer bg-transparent border-none">
                  <div className="w-8 h-8 bg-wine rounded-full flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-gold/40 transition-all">
                    {getDisplayInitial(user.name)}
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-wine-border rounded-2xl shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-wine-border">
                      <p className="text-sm font-semibold text-text truncate">{user.name}</p>
                      <p className="text-xs text-text-sub truncate">{user.email}</p>
                    </div>
                    <div className="py-1.5">
                      <Link href="/account" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors">
                        <Bookmark className="w-4 h-4 text-text-sub" /> 我的收藏
                      </Link>
                      <Link href="/account?tab=profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors">
                        <Settings className="w-4 h-4 text-text-sub" /> 帳號設置
                      </Link>
                    </div>
                    <div className="border-t border-wine-border py-1.5">
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors w-full cursor-pointer bg-transparent border-none">
                        <LogOut className="w-4 h-4 text-text-sub" /> 登出
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link href="/account/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-wine text-white rounded-lg text-[13px] font-medium hover:bg-wine-dark transition-colors">
                <User className="w-3.5 h-3.5" /> 登入
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
