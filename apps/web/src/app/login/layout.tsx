import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DashboardLangProvider } from "@/lib/dashboard-lang-context";
import type { DashboardLang } from "@/lib/dashboard-i18n";

export const metadata: Metadata = {
  title: "登入 — Your Wine Book 酒商後台",
};

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("wb_dash_lang")?.value ?? "zh-HK") as DashboardLang;

  return (
    <DashboardLangProvider initial={lang}>
      <div data-lang={lang === "en" ? "en" : "zh-HK"}>{children}</div>
    </DashboardLangProvider>
  );
}
