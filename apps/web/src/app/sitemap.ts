import type { MetadataRoute } from "next";
import { getAllWines } from "@/lib/wine-store";
import { getMerchants, getScenes } from "@/lib/queries";

const BASE_URL = "https://yourwinebook.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["zh-HK", "en"];

  // Static pages
  const staticPaths = [
    "",           // home
    "/search",
    "/merchants",
    "/ai",
    "/about",
    "/join",
    "/community",
    "/account/login",
    "/account/register",
    "/privacy",
    "/terms",
  ];

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? "daily" as const : "weekly" as const,
      priority: path === "" ? 1.0 : 0.7,
    }))
  );

  // Dynamic wine pages
  const wines = await getAllWines();
  const wineEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    wines.map((w) => ({
      url: `${BASE_URL}/${locale}/wines/${w.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  // Dynamic merchant pages
  const merchants = await getMerchants();
  const merchantEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    merchants.map((m) => ({
      url: `${BASE_URL}/${locale}/merchants/${m.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  // Scene pages
  const scenes = await getScenes();
  const sceneEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    scenes.map((s) => ({
      url: `${BASE_URL}/${locale}/scenes/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  return [...staticEntries, ...wineEntries, ...merchantEntries, ...sceneEntries];
}
