import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTracker } from "@/components/analytics/PageTracker";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";

export const metadata: Metadata = {
  title: {
    default: "Your Wine Book — Drink smarter. Discover more.",
    template: "%s",
  },
  description: "在香港，輕鬆喝對每一支。比價、推薦、一步到位。",
  openGraph: {
    type: "website",
    siteName: "Your Wine Book",
    title: "Your Wine Book — Drink smarter. Discover more.",
    description: "在香港，輕鬆喝對每一支。比價、推薦、一步到位。",
  },
  twitter: {
    card: "summary",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <PostHogProvider>
        <PageTracker />
        <Navbar />
        <main data-locale={locale}>{children}</main>
        <Footer />
      </PostHogProvider>
    </NextIntlClientProvider>
  );
}
