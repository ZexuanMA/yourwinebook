"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { wines } from "@/lib/mock-data";
import type { MerchantPrice } from "@/lib/mock-data";
import WineDetailClient from "./WineDetailClient";

export default function WineDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [prices, setPrices] = useState<MerchantPrice[]>([]);

  const wine = wines.find((w) => w.slug === slug) ?? wines[0];
  const similarWines = wines
    .filter((w) => w.slug !== slug && w.type === wine.type)
    .slice(0, 3);

  useEffect(() => {
    fetch(`/api/wines/${slug}/prices`)
      .then((r) => r.ok ? r.json() : [])
      .then(setPrices)
      .catch(() => {});
  }, [slug]);

  return <WineDetailClient wine={wine} prices={prices} similarWines={similarWines} />;
}
