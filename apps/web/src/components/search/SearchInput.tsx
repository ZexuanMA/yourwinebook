"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";

interface Suggestion {
  name: string;
  slug: string;
  type: string;
}

const typeEmoji: Record<string, string> = {
  red: "🍷",
  white: "🍾",
  sparkling: "🥂",
  rosé: "🌸",
  dessert: "🍯",
};

export function SearchInput({
  value,
  onChange,
  onSubmit,
  className = "",
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        router.push(`/wines/${suggestions[selectedIndex].slug}`);
        setShowSuggestions(false);
      } else {
        onSubmit(value);
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-white border border-wine-border rounded-xl text-base hover:border-gold hover:shadow-[0_2px_12px_rgba(184,149,106,0.1)] transition-all focus-within:border-gold focus-within:shadow-[0_2px_12px_rgba(184,149,106,0.15)]">
        <Search className="w-[18px] h-[18px] opacity-40 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent border-none outline-none text-base text-text placeholder:text-text-sub/50"
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="p-0.5 rounded hover:bg-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-text-sub" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-wine-border rounded-xl shadow-lg overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <button
              key={s.slug}
              onClick={() => {
                router.push(`/wines/${s.slug}`);
                setShowSuggestions(false);
              }}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left text-sm transition-colors cursor-pointer border-none ${
                i === selectedIndex
                  ? "bg-red-light"
                  : "hover:bg-bg"
              }`}
            >
              <span className="text-lg">{typeEmoji[s.type] ?? "🍷"}</span>
              <span className="font-en font-medium text-text">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
