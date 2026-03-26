import type { Metadata } from "next";
import { getMerchantBySlug } from "@/lib/queries";
import MerchantDetailClient from "./MerchantDetailClient";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) {
    return { title: locale === "zh-HK" ? "找不到酒商" : "Merchant Not Found" };
  }

  const isZh = locale === "zh-HK";
  const name = merchant.name;
  const desc = isZh ? merchant.description_zh : merchant.description_en;
  const title = `${name} — Your Wine Book`;
  const description = desc || (isZh ? `${name} — 酒商詳情` : `${name} — Merchant details`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "Your Wine Book",
      url: `https://yourwinebook.com/${locale}/merchants/${slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function MerchantPage() {
  return <MerchantDetailClient />;
}
