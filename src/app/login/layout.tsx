import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_TC } from "next/font/google";
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
  title: "登入 — Your Wine Book 酒商後台",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <body className={`${dmSans.variable} ${notoSansTC.variable} font-zh bg-bg text-text antialiased`}>
        {children}
      </body>
    </html>
  );
}
