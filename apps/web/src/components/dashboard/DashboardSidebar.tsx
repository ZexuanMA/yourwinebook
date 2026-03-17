"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  List,
  PlusCircle,
  BarChart2,
  LogOut,
  ExternalLink,
  ChevronRight,
  Users,
  ClipboardList,
  Settings,
  ShieldCheck,
  UserRound,
  Languages,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { useDashboardLang } from "@/lib/dashboard-lang-context";

interface Account {
  slug: string;
  name: string;
  email: string;
  role: "admin" | "merchant";
}

const merchantNavKeys = [
  { href: "/dashboard",              key: "nav.overview",   icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/wines",        key: "nav.wines",      icon: List,            exact: false },
  { href: "/dashboard/wines/new",    key: "nav.addWine",    icon: PlusCircle,      exact: true  },
  { href: "/dashboard/community",    key: "nav.community",  icon: MessageSquare,   exact: true  },
  { href: "/dashboard/analytics",    key: "nav.analytics",  icon: BarChart2,       exact: true  },
  { href: "/dashboard/account",      key: "nav.account",    icon: Settings,        exact: true  },
];

const adminNav = [
  { href: "/dashboard",                    label: "總覽",    icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/admin/accounts",     label: "酒商帳號", icon: Users,           exact: true  },
  { href: "/dashboard/admin/users",        label: "用戶管理", icon: UserRound,       exact: true  },
  { href: "/dashboard/admin/applications", label: "入駐申請", icon: ClipboardList,   exact: true  },
  { href: "/dashboard/admin/moderation",   label: "審核管理", icon: ShieldAlert,     exact: true  },
  { href: "/dashboard/community",          label: "社區動態", icon: MessageSquare,   exact: true  },
  { href: "/dashboard/analytics",          label: "流量分析", icon: BarChart2,       exact: true  },
  { href: "/dashboard/account",            label: "帳號設置", icon: Settings,        exact: true  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const { t, lang, setLang } = useDashboardLang();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccount)
      .catch(() => null);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isAdmin = account?.role === "admin";

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && pathname !== "/dashboard";

  return (
    <aside className="w-64 bg-wine flex flex-col shrink-0 relative">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      />

      {/* Brand + account badge */}
      <div className="relative px-6 pt-7 pb-5">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="text-xl">🍷</span>
          <span className="font-en text-sm font-bold text-white tracking-wide">Your Wine Book</span>
        </div>
        <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
          <div className="flex items-center gap-1.5 mb-1">
            {isAdmin && (
              <ShieldCheck className="w-3 h-3 text-gold-light" />
            )}
            <p className="text-white/40 text-[10px] uppercase tracking-wider">
              {isAdmin ? t("sidebar.admin") : t("sidebar.merchantAccount")}
            </p>
          </div>
          <p className="text-white font-semibold text-sm truncate">{account?.name ?? "…"}</p>
          <p className="text-white/40 text-xs truncate mt-0.5">{account?.email}</p>
        </div>
      </div>

      <div className="mx-6 h-px bg-white/10" />

      <nav className="relative flex-1 px-3 py-5 space-y-1">
        {isAdmin
          ? adminNav.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact) || (exact && pathname === href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-gold-light" : "text-white/35 group-hover:text-white/60"}`} />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-gold-light/60" />}
                </Link>
              );
            })
          : merchantNavKeys.map(({ href, key, icon: Icon, exact }) => {
              const active = isActive(href, exact) || (exact && pathname === href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-gold-light" : "text-white/35 group-hover:text-white/60"}`} />
                  <span className="flex-1">{t(key)}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-gold-light/60" />}
                </Link>
              );
            })
        }
      </nav>

      <div className="relative px-3 pb-6 space-y-0.5">
        <div className="mx-3 h-px bg-white/10 mb-3" />
        {!isAdmin && (
          <>
            <Link
              href="/zh-HK"
              target="_blank"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-white/35 hover:text-white/65 hover:bg-white/8 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              {t("nav.viewFrontend")}
            </Link>
            <button
              onClick={() => setLang(lang === "zh-HK" ? "en" : "zh-HK")}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-white/35 hover:text-white/65 hover:bg-white/8 transition-all w-full cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 shrink-0" />
              {lang === "zh-HK" ? "English" : "中文"}
            </button>
          </>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-white/35 hover:text-white/65 hover:bg-white/8 transition-all w-full cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {isAdmin ? "登出" : t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}

export function DashboardTopbar() {
  const pathname = usePathname();
  const [account, setAccount] = useState<Account | null>(null);
  const { t } = useDashboardLang();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccount);
  }, []);

  const isAdmin = account?.role === "admin";

  // Determine current page label
  const merchantLabels: Record<string, string> = {
    "/dashboard": t("nav.overview"),
    "/dashboard/wines": t("nav.wines"),
    "/dashboard/wines/new": t("nav.addWine"),
    "/dashboard/community": t("nav.community"),
    "/dashboard/analytics": t("nav.analytics"),
    "/dashboard/account": t("nav.account"),
  };

  const adminLabels: Record<string, string> = {
    "/dashboard": "總覽",
    "/dashboard/admin/accounts": "酒商帳號",
    "/dashboard/admin/users": "用戶管理",
    "/dashboard/admin/applications": "入駐申請",
    "/dashboard/admin/moderation": "審核管理",
    "/dashboard/community": "社區動態",
    "/dashboard/analytics": "流量分析",
    "/dashboard/account": "帳號設置",
  };

  const labels = isAdmin ? adminLabels : merchantLabels;
  const currentLabel = Object.entries(labels)
    .reverse()
    .find(([href]) => pathname === href || pathname.startsWith(href + "/"))?.[1] ?? "";

  return (
    <div className="bg-white border-b border-wine-border px-8 py-4 flex items-center justify-between">
      <span className="text-sm font-semibold text-text">{currentLabel}</span>
      <div className="flex items-center gap-2.5">
        {isAdmin && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-wine text-white rounded-full text-[11px] font-semibold">
            <ShieldCheck className="w-3 h-3" /> 管理員
          </span>
        )}
      </div>
    </div>
  );
}
