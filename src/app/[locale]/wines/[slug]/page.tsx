"use client";

import { useParams } from "next/navigation";
import { wines, winePrices } from "@/lib/mock-data";
import WineDetailClient from "./WineDetailClient";

export default function WineDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const wine = wines.find((w) => w.slug === slug) ?? wines[0];
  const prices = winePrices[slug] ?? [];
  const similarWines = wines
    .filter((w) => w.slug !== slug && w.type === wine.type)
    .slice(0, 3);

  return <WineDetailClient wine={wine} prices={prices} similarWines={similarWines} />;
}
