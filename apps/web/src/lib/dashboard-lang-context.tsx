"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { t as translate, tf as translateF, type DashboardLang } from "./dashboard-i18n";

interface DashboardLangCtx {
  lang: DashboardLang;
  setLang: (lang: DashboardLang) => void;
  t: (key: string) => string;
  tf: (key: string, params: Record<string, string | number>) => string;
}

const Ctx = createContext<DashboardLangCtx>({
  lang: "zh-HK",
  setLang: () => {},
  t: (k) => k,
  tf: (k) => k,
});

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export function DashboardLangProvider({ initial, children }: { initial?: DashboardLang; children: ReactNode }) {
  const [lang, setLangState] = useState<DashboardLang>(initial ?? "zh-HK");

  useEffect(() => {
    const saved = getCookie("wb_dash_lang") as DashboardLang | undefined;
    if (saved && (saved === "zh-HK" || saved === "en")) {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((newLang: DashboardLang) => {
    setLangState(newLang);
    setCookie("wb_dash_lang", newLang);
    // Persist to server
    fetch("/api/auth/lang", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: newLang }),
    }).catch(() => {});
  }, []);

  const tFn = useCallback((key: string) => translate(key, lang), [lang]);
  const tfFn = useCallback((key: string, params: Record<string, string | number>) => translateF(key, lang, params), [lang]);

  return (
    <Ctx.Provider value={{ lang, setLang, t: tFn, tf: tfFn }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDashboardLang() {
  return useContext(Ctx);
}
