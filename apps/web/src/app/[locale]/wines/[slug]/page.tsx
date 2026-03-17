"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { Wine, MerchantPrice } from "@/lib/mock-data";
import WineDetailClient from "./WineDetailClient";

export default function WineDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [wine, setWine] = useState<Wine | null>(null);
  const [prices, setPrices] = useState<MerchantPrice[]>([]);
  const [similarWines, setSimilarWines] = useState<Wine[]>([]);

  useEffect(() => {
    fetch(`/api/wines/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((w) => {
        if (!w) return;
        setWine(w);
        // Fetch similar wines by same type
        fetch(`/api/wines?type=${w.type}&limit=4`)
          .then((r) => (r.ok ? r.json() : { wines: [] }))
          .then((d) => setSimilarWines(d.wines.filter((sw: Wine) => sw.slug !== slug).slice(0, 3)));
      });
    fetch(`/api/wines/${slug}/prices`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setPrices);
  }, [slug]);

  if (!wine) {
    return <div className="max-w-[1120px] mx-auto px-6 pt-28 pb-20 animate-pulse"><div className="h-96 bg-bg-card rounded-2xl" /></div>;
  }

  return <WineDetailClient wine={wine} prices={prices} similarWines={similarWines} />;
}
