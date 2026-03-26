import type { Metadata } from "next";
import { getWineBySlug } from "@/lib/queries";
import WineDetailLoader from "./WineDetailLoader";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const wine = await getWineBySlug(slug);
  if (!wine) {
    return { title: locale === "zh-HK" ? "找不到酒款" : "Wine Not Found" };
  }

  const isZh = locale === "zh-HK";
  const description = isZh
    ? `${wine.name} — ${wine.region_zh}${wine.vintage ? ` · ${wine.vintage}` : ""}${wine.minPrice ? ` · 最低 HK$${wine.minPrice}` : ""}`
    : `${wine.name} — ${wine.region_en}${wine.vintage ? ` · ${wine.vintage}` : ""}${wine.minPrice ? ` · From HK$${wine.minPrice}` : ""}`;

  const vintageInName = wine.vintage && wine.name.includes(String(wine.vintage));
  const title = `${wine.name}${wine.vintage && !vintageInName ? ` ${wine.vintage}` : ""} — Your Wine Book`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Your Wine Book",
      url: `https://yourwinebook.com/${locale}/wines/${slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function WineDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <WineDetailLoader slug={slug} />;
}
