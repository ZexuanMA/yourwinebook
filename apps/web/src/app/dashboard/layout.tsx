import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DashboardSidebar, DashboardTopbar } from "@/components/dashboard/DashboardSidebar";
import { DashboardLangProvider } from "@/lib/dashboard-lang-context";
import type { DashboardLang } from "@/lib/dashboard-i18n";

export const metadata: Metadata = {
  title: "後台管理 — Your Wine Book",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("wb_dash_lang")?.value ?? "zh-HK") as DashboardLang;

  return (
    <DashboardLangProvider initial={lang}>
      <div className="min-h-screen flex" data-lang={lang === "en" ? "en" : "zh-HK"}>
        <DashboardSidebar />
        <main className="flex-1 min-w-0 flex flex-col overflow-auto">
          <DashboardTopbar />
          <div className="flex-1 p-8">{children}</div>
        </main>
      </div>
    </DashboardLangProvider>
  );
}
