"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wine, LayoutDashboard, List, PlusCircle, LogOut } from "lucide-react";

interface Merchant {
  slug: string;
  name: string;
  email: string;
}

const navItems = [
  { href: "/dashboard", label: "總覽", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/wines", label: "酒款管理", icon: List, exact: false },
  { href: "/dashboard/wines/new", label: "新增酒款", icon: PlusCircle, exact: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMerchant)
      .catch(() => setMerchant(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-[#E8E0D6] flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[#E8E0D6]">
          <Link href="/zh-HK" className="flex items-center gap-2 mb-4 group">
            <Wine className="w-5 h-5 text-[#8B1A1A]" />
            <span className="text-sm font-semibold text-[#1A1A1A]">Your Wine Book</span>
          </Link>
          <div className="bg-[#FAF8F5] rounded-xl px-3 py-2.5">
            <p className="text-xs text-[#6B6B6B]">登入身份</p>
            <p className="text-sm font-semibold text-[#1A1A1A] truncate">
              {merchant?.name ?? "Loading…"}
            </p>
            <p className="text-xs text-[#6B6B6B] truncate">{merchant?.email}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(href, exact)
                  ? "bg-[#8B1A1A] text-white"
                  : "text-[#3A3A3A] hover:bg-[#FAF8F5]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[#E8E0D6]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B6B6B] hover:bg-[#FAF8F5] hover:text-[#1A1A1A] transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            登出
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}
