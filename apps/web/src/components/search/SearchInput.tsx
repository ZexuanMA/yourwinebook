"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
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

/* ── Recent searches (localStorage) ── */
const RECENT_KEY = "wb_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : [];
  } catch { return []; }
}

function saveRecentSearch(q: string) {
  if (typeof window === "undefined" || !q.trim()) return;
  try {
    const existing = getRecentSearches().filter((s) => s !== q.trim());
    localStorage.setItem(RECENT_KEY, JSON.stringify([q.trim(), ...existing].slice(0, MAX_RECENT)));
  } catch { /* quota exceeded — ignore */ }
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
}

/* ── Hot search terms (static, bilingual) ── */
const HOT_TERMS: Record<string, string[]> = {
  "zh-HK": ["Sauvignon Blanc", "Pinot Noir", "Champagne", "波爾多", "紐西蘭"],
  en: ["Sauvignon Blanc", "Pinot Noir", "Champagne", "Bordeaux", "Burgundy"],
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load recent searches on mount
  useEffect(() => { setRecentSearches(getRecentSearches()); }, []);

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

  const doSubmit = (q: string) => {
    if (q.trim()) saveRecentSearch(q.trim());
    setRecentSearches(getRecentSearches());
    onSubmit(q);
    setShowDropdown(false);
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
        saveRecentSearch(suggestions[selectedIndex].name);
        router.push(`/wines/${suggestions[selectedIndex].slug}`);
        setShowDropdown(false);
      } else {
        doSubmit(value);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasSuggestions = value.length >= 2 && suggestions.length > 0;
  const showRecent = !hasSuggestions && recentSearches.length > 0;
  const showHot = !hasSuggestions && !showRecent;
  const hotTerms = HOT_TERMS[locale] ?? HOT_TERMS.en;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-white border border-wine-border rounded-xl text-base hover:border-gold hover:shadow-[0_2px_12px_rgba(184,149,106,0.1)] transition-all focus-within:border-gold focus-within:shadow-[0_2px_12px_rgba(184,149,106,0.15)]">
        <Search className="w-[18px] h-[18px] opacity-40 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
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

      {/* Dropdown: suggestions / recent / hot */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-wine-border rounded-xl shadow-lg overflow-hidden z-50">
          {/* Wine autocomplete suggestions */}
          {hasSuggestions && suggestions.map((s, i) => (
            <button
              key={s.slug}
              onClick={() => {
                saveRecentSearch(s.name);
                router.push(`/wines/${s.slug}`);
                setShowDropdown(false);
              }}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left text-sm transition-colors cursor-pointer border-none ${
                i === selectedIndex ? "bg-red-light" : "hover:bg-bg"
              }`}
            >
              <span className="text-lg">{typeEmoji[s.type] ?? "🍷"}</span>
              <span className="font-en font-medium text-text">{s.name}</span>
            </button>
          ))}

          {/* Recent searches */}
          {showRecent && (
            <>
              <div className="flex items-center justify-between px-5 pt-3 pb-1.5">
                <span className="text-xs font-medium text-text-sub flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {locale === "zh-HK" ? "最近搜索" : "Recent"}
                </span>
                <button onClick={handleClearRecent}
                  className="text-[11px] text-text-sub/50 hover:text-wine transition-colors cursor-pointer bg-transparent border-none">
                  {locale === "zh-HK" ? "清除" : "Clear"}
                </button>
              </div>
              {recentSearches.map((q) => (
                <button key={q}
                  onClick={() => { onChange(q); doSubmit(q); }}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-sm hover:bg-bg transition-colors cursor-pointer border-none">
                  <Clock className="w-3.5 h-3.5 text-text-sub/30 shrink-0" />
                  <span className="text-text">{q}</span>
                </button>
              ))}
            </>
          )}

          {/* Hot search terms */}
          {showHot && (
            <>
              <div className="px-5 pt-3 pb-1.5">
                <span className="text-xs font-medium text-text-sub flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />
                  {locale === "zh-HK" ? "熱門搜索" : "Trending"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 px-5 pb-3">
                {hotTerms.map((term) => (
                  <button key={term}
                    onClick={() => { onChange(term); doSubmit(term); }}
                    className="px-3 py-1.5 bg-bg rounded-lg text-xs text-text hover:bg-red-light hover:text-wine transition-colors cursor-pointer border-none">
                    {term}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
