import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export interface WineCardData {
  slug: string;
  name: string;
  region: string;
  tags: string[];
  description: string;
  minPrice: number;
  merchantCount: number;
  emoji: string;
  badge?: string;
}

export function WineCard({ wine }: { wine: WineCardData }) {
  const t = useTranslations("featured");

  return (
    <Link
      href={`/wines/${wine.slug}`}
      className="block bg-white border border-wine-border rounded-2xl overflow-hidden transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(91,46,53,0.06)] cursor-pointer"
    >
      <div className="h-[200px] bg-gradient-to-br from-[#E8E0D6] to-[#D4CBC0] flex items-center justify-center text-[56px] relative">
        {wine.emoji}
        {wine.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-wine text-white text-[11px] font-semibold rounded-md font-en">
            {wine.badge}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-en text-[15px] font-semibold mb-0.5">{wine.name}</h3>
        <p className="text-[13px] text-text-sub mb-2.5">{wine.region}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {wine.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2.5 py-0.5 bg-bg border border-wine-border rounded-full text-xs text-text-sub"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-sm text-text-sub leading-relaxed mb-3.5">
          {wine.description}
        </p>
        <div className="flex items-baseline justify-between pt-3.5 border-t border-wine-border">
          <strong className="font-en text-lg font-bold text-wine">
            HK${wine.minPrice}{" "}
            <span className="text-[13px] font-normal text-text-sub">
              {t("from")}
            </span>
          </strong>
          <span className="text-xs text-text-sub">
            {t("merchantCount", { count: wine.merchantCount })}
          </span>
        </div>
      </div>
    </Link>
  );
}
