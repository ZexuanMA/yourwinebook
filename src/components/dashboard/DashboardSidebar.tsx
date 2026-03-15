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
} from "lucide-react";

interface Account {
  slug: string;
  name: string;
  email: string;
  role: "admin" | "merchant";
}

const merchantNav = [
  { href: "/dashboard",              label: "總覽",    icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/wines",        label: "酒款管理", icon: List,            exact: false },
  { href: "/dashboard/wines/new",    label: "新增酒款", icon: PlusCircle,      exact: true  },
  { href: "/dashboard/analytics",    label: "流量分析", icon: BarChart2,       exact: true  },
  { href: "/dashboard/account",      label: "帳號設置", icon: Settings,        exact: true  },
];

const adminNav = [
  { href: "/dashboard",                    label: "總覽",    icon: LayoutDashboard, exact: true  },
  { href: "/dashboard/admin/accounts",     label: "酒商帳號", icon: Users,           exact: true  },
  { href: "/dashboard/admin/users",        label: "用戶管理", icon: UserRound,       exact: true  },
  { href: "/dashboard/admin/applications", label: "入駐申請", icon: ClipboardList,   exact: true  },
  { href: "/dashboard/analytics",          label: "流量分析", icon: BarChart2,       exact: true  },
  { href: "/dashboard/account",            label: "帳號設置", icon: Settings,        exact: true  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);

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

  const navItems = account?.role === "admin" ? adminNav : merchantNav;

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
            {account?.role === "admin" && (
              <ShieldCheck className="w-3 h-3 text-gold-light" />
            )}
            <p className="text-white/40 text-[10px] uppercase tracking-wider">
              {account?.role === "admin" ? "管理員" : "酒商帳號"}
            </p>
          </div>
          <p className="text-white font-semibold text-sm truncate">{account?.name ?? "…"}</p>
          <p className="text-white/40 text-xs truncate mt-0.5">{account?.email}</p>
        </div>
      </div>

      <div className="mx-6 h-px bg-white/10" />

      <nav className="relative flex-1 px-3 py-5 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
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
        })}
      </nav>

      <div className="relative px-3 pb-6 space-y-0.5">
        <div className="mx-3 h-px bg-white/10 mb-3" />
        {account?.role === "merchant" && (
          <Link
            href="/zh-HK"
            target="_blank"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-white/35 hover:text-white/65 hover:bg-white/8 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            查看前台網站
          </Link>
        )}
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
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccount);
  }, []);

  const allNav = [...merchantNav, ...adminNav];
  const currentLabel = allNav
    .slice().reverse()
    .find(({ href, exact }) => exact ? pathname === href : pathname.startsWith(href))?.label ?? "";

  return (
    <div className="bg-white border-b border-wine-border px-8 py-4 flex items-center justify-between">
      <span className="text-sm font-semibold text-text">{currentLabel}</span>
      <div className="flex items-center gap-2.5">
        {account?.role === "admin" && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-wine text-white rounded-full text-[11px] font-semibold">
            <ShieldCheck className="w-3 h-3" /> 管理員
          </span>
        )}
      </div>
    </div>
  );
}
