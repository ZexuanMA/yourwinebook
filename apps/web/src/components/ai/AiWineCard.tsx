"use client";

import { Link } from "@/i18n/navigation";

interface AiWineCardProps {
  slug: string;
  name: string;
  region: string;
  type: string;
  minPrice: number;
  merchantCount: number;
  emoji?: string;
  reason?: string;
}

const typeEmoji: Record<string, string> = {
  red: "🍷",
  white: "🥂",
  sparkling: "🍾",
  rosé: "🌸",
  dessert: "🍯",
};

export function AiWineCard({
  slug,
  name,
  region,
  type,
  minPrice,
  merchantCount,
  emoji,
  reason,
}: AiWineCardProps) {
  return (
    <Link
      href={`/wines/${slug}`}
      className="block mt-2 p-3 bg-bg border border-wine-border rounded-xl hover:border-gold transition-colors"
    >
      <div className="flex items-start gap-2.5">
        <span className="text-2xl shrink-0">{emoji || typeEmoji[type] || "🍷"}</span>
        <div className="min-w-0 flex-1">
          <div className="font-en font-semibold text-sm">{name}</div>
          <div className="text-xs text-text-sub mt-0.5">{region}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-en text-sm font-bold text-wine">
              HK${minPrice}
            </span>
            <span className="text-xs text-gold">
              {merchantCount > 0 && `${merchantCount} merchants`}
            </span>
          </div>
          {reason && (
            <p className="text-[13px] text-text-sub mt-1.5 leading-relaxed">
              {reason}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
