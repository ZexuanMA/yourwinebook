"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function HeroSearch() {
  const t = useTranslations("hero");
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <div
      className="flex items-center gap-2.5 px-6 py-3.5 bg-white border border-wine-border rounded-xl text-[15px] text-text-sub min-w-[320px] hover:border-gold hover:shadow-[0_2px_12px_rgba(184,149,106,0.1)] transition-all focus-within:border-gold focus-within:shadow-[0_2px_12px_rgba(184,149,106,0.15)] cursor-text"
    >
      <Search className="w-[18px] h-[18px] opacity-40 shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={t("searchPlaceholder")}
        className="flex-1 bg-transparent border-none outline-none text-base text-text placeholder:text-text-sub/60"
      />
    </div>
  );
}
