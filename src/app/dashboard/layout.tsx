import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_TC } from "next/font/google";
import { cookies } from "next/headers";
import { DashboardSidebar, DashboardTopbar } from "@/components/dashboard/DashboardSidebar";
import { DashboardLangProvider } from "@/lib/dashboard-lang-context";
import type { DashboardLang } from "@/lib/dashboard-i18n";
import "../globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto-sans-tc",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "後台管理 — Your Wine Book",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("wb_dash_lang")?.value ?? "zh-HK") as DashboardLang;

  return (
    <html lang={lang === "en" ? "en" : "zh-HK"}>
      <body
        className={`${dmSans.variable} ${notoSansTC.variable} font-zh bg-bg text-text antialiased`}
      >
        <DashboardLangProvider initial={lang}>
          <div className="min-h-screen flex">
            <DashboardSidebar />
            <main className="flex-1 min-w-0 flex flex-col overflow-auto">
              <DashboardTopbar />
              <div className="flex-1 p-8">{children}</div>
            </main>
          </div>
        </DashboardLangProvider>
      </body>
    </html>
  );
}
