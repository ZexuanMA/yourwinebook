import { DM_Sans, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-HK">
      <body
        className={`${dmSans.variable} ${notoSansTC.variable} font-zh bg-bg text-text leading-relaxed antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
