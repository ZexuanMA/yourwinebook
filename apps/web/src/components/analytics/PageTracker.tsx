"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = sessionStorage.getItem("wb_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("wb_sid", sid);
  }
  return sid;
}

const PAGE_LABELS: Record<string, string> = {
  "/zh-HK": "首頁", "/en": "Home",
  "/zh-HK/wines": "酒款列表", "/en/wines": "Wine List",
  "/zh-HK/merchants": "酒商列表", "/en/merchants": "Merchants",
  "/zh-HK/scenes": "推薦場景", "/en/scenes": "Scenes",
  "/zh-HK/search": "搜索頁", "/en/search": "Search",
  "/zh-HK/join": "入駐申請", "/en/join": "Join",
  "/zh-HK/about": "關於我們", "/en/about": "About",
};

function getPageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.includes("/wines/")) return "酒款詳情";
  if (path.includes("/merchants/")) return "酒商詳情";
  if (path.includes("/scenes/")) return "場景詳情";
  if (path.includes("/account/login")) return "用戶登入";
  if (path.includes("/account/register")) return "用戶注冊";
  if (path.includes("/account")) return "用戶中心";
  return path;
}

export function PageTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    if (!pathname || pathname === lastTracked.current) return;
    lastTracked.current = pathname;
    const sessionId = getOrCreateSessionId();
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pageview", path: pathname, pageLabel: getPageLabel(pathname), sessionId }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
