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
} from "lucide-react";

interface Merchant {
  slug: string;
  name: string;
  email: string;
}

const navItems = [
  { href: "/dashboard",              label: "總覽",    icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/wines",        label: "酒款管理", icon: List,            exact: false },
  { href: "/dashboard/wines/new",    label: "新增酒款", icon: PlusCircle,      exact: true  },
  { href: "/dashboard/analytics",    label: "流量分析", icon: BarChart2,       exact: true  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMerchant)
      .catch(() => null);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && pathname !== "/dashboard";

  return (
    <aside className="w-64 bg-wine flex flex-col shrink-0 relative">
      {/* Dot texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Brand + Merchant */}
      <div className="relative px-6 pt-7 pb-5">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="text-xl">🍷</span>
          <span className="font-en text-sm font-bold text-white tracking-wide">Your Wine Book</span>
        </div>
        <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">當前帳號</p>
          <p className="text-white font-semibold text-sm truncate">
            {merchant?.name ?? "…"}
          </p>
          <p className="text-white/40 text-xs truncate mt-0.5">{merchant?.email}</p>
        </div>
      </div>

      <div className="mx-6 h-px bg-white/10" />

      {/* Nav items */}
      <nav className="relative flex-1 px-3 py-5 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact) || (exact && pathname === href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active ? "text-gold-light" : "text-white/35 group-hover:text-white/60"
                }`}
              />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-gold-light/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative px-3 pb-6 space-y-0.5">
        <div className="mx-3 h-px bg-white/10 mb-3" />
        <Link
          href="/zh-HK"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-white/35 hover:text-white/65 hover:bg-white/8 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          查看前台網站
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-white/35 hover:text-white/65 hover:bg-white/8 transition-all w-full cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          登出
        </button>
      </div>
    </aside>
  );
}

export function DashboardTopbar() {
  const pathname = usePathname();

  const currentLabel = navItems
    .slice()
    .reverse()
    .find(({ href, exact }) =>
      exact ? pathname === href : pathname.startsWith(href)
    )?.label ?? "";

  return (
    <div className="bg-white border-b border-wine-border px-8 py-4 flex items-center justify-between">
      <span className="text-sm font-semibold text-text">{currentLabel}</span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
        Demo 模式
      </span>
    </div>
  );
}
