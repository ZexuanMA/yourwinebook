"use client";

import { Link } from "@/i18n/navigation";

interface PriceRow {
  merchant: string;
  merchantSlug: string;
  price: number;
  isBest: boolean;
}

interface AiPriceTableProps {
  wineName: string;
  prices: PriceRow[];
}

export function AiPriceTable({ wineName, prices }: AiPriceTableProps) {
  if (prices.length === 0) return null;

  return (
    <div className="mt-2 border border-wine-border rounded-xl overflow-hidden">
      <div className="px-3 py-2 bg-bg border-b border-wine-border text-xs font-semibold text-text-sub">
        {wineName}
      </div>
      <div className="divide-y divide-wine-border">
        {prices.map((p) => (
          <Link
            key={p.merchantSlug}
            href={`/merchants/${p.merchantSlug}`}
            className="flex items-center justify-between px-3 py-2 hover:bg-bg/50 transition-colors"
          >
            <span className="text-sm">{p.merchant}</span>
            <span
              className={`font-en text-sm font-semibold ${
                p.isBest ? "text-gold" : "text-text"
              }`}
            >
              HK${p.price}
              {p.isBest && (
                <span className="ml-1.5 text-[10px] font-normal bg-gold/10 text-gold px-1.5 py-0.5 rounded">
                  Best
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
