"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Eye, Users, MousePointerClick, TrendingUp, Clock, RefreshCw, ShoppingCart } from "lucide-react";
import type { AnalyticsSummary, MerchantAnalyticsSummary } from "@/lib/analytics-store";
import { useDashboardLang } from "@/lib/dashboard-lang-context";

const TooltipStyle = {
  contentStyle: { background: "#fff", border: "1px solid #E5E0DA", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  labelStyle: { color: "#6B6560", marginBottom: 4, fontWeight: 600 },
};

// ── Admin analytics view (stays Chinese) ─────────────────────────────────────

function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchantStats, setMerchantStats] = useState<{ slug: string; name: string; favoriteCount: number; priceClicks: number; wineViews: number }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, merchantRes] = await Promise.all([
        fetch("/api/admin/analytics"),
        fetch("/api/admin/analytics/merchants"),
      ]);
      if (analyticsRes.ok) setData(await analyticsRes.json());
      if (merchantRes.ok) {
        const list = await merchantRes.json();
        setMerchantStats([...list].sort((a: { favoriteCount: number }, b: { favoriteCount: number }) => b.favoriteCount - a.favoriteCount));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const last7 = data?.daily.slice(-7) ?? [];

  const statCards = [
    { label: "頁面瀏覽量",   value: data ? data.totals.pageViews.toLocaleString()      : "—", icon: Eye,               iconBg: "bg-red-light", iconColor: "text-wine"       },
    { label: "獨立訪客",     value: data ? data.totals.uniqueSessions.toLocaleString()  : "—", icon: Users,             iconBg: "bg-blue-50",   iconColor: "text-blue-600"   },
    { label: "酒款頁瀏覽",   value: data ? data.totals.wineViews.toLocaleString()       : "—", icon: TrendingUp,        iconBg: "bg-orange-50", iconColor: "text-orange-600" },
    { label: "比價點擊數",   value: data ? data.totals.priceClicks.toLocaleString()     : "—", icon: MousePointerClick, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
    { label: "今日瀏覽",     value: data ? (data.daily[data.daily.length - 1]?.pageViews ?? 0).toLocaleString() : "—", icon: Clock, iconBg: "bg-[#FDF6EC]", iconColor: "text-gold" },
    { label: "累計追蹤事件", value: data ? (data.totals.pageViews + data.totals.wineViews + data.totals.priceClicks).toLocaleString() : "—", icon: Eye, iconBg: "bg-green-50", iconColor: "text-green-600" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">流量分析</h1>
          <p className="text-sm text-text-sub mt-1">真實點擊數據 · 即時更新</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-wine-border rounded-xl text-xs text-text-sub hover:border-gold hover:text-text transition-all cursor-pointer disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white border border-wine-border rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${iconBg}`}>
                <Icon className={`${iconColor}`} style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text tracking-tight">{value}</p>
            <p className="text-sm text-text-sub mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-wine-border rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="font-semibold text-text">訪問趨勢</h2>
          <p className="text-xs text-text-sub mt-0.5">過去 30 天</p>
        </div>
        {loading ? (
          <div className="h-[220px] flex items-center justify-center text-text-sub text-sm">載入中…</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.daily ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE2" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9B9490" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "#9B9490" }} tickLine={false} axisLine={false} />
              <Tooltip {...TooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} formatter={(v) => v === "pageViews" ? "頁面瀏覽" : "獨立訪客"} />
              <Line type="monotone" dataKey="pageViews" stroke="#5B2E35" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="visitors" stroke="#B8956A" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-wine-border">
            <h2 className="font-semibold text-text">熱門酒商</h2>
            <p className="text-xs text-text-sub mt-0.5">按用戶收藏量排序</p>
          </div>
          {loading ? (
            <div className="py-12 text-center text-text-sub text-sm">載入中…</div>
          ) : merchantStats.length === 0 ? (
            <div className="py-12 text-center text-text-sub text-sm">暫無數據</div>
          ) : (
            <div className="divide-y divide-[#F5F0EA]">
              {merchantStats.map((m, i) => (
                <div key={m.slug} className="px-6 py-4 flex items-center gap-4 hover:bg-bg transition-colors">
                  <span className="text-xs text-text-sub/40 w-4 text-right shrink-0">{i + 1}</span>
                  <div className="w-9 h-9 bg-red-light rounded-xl flex items-center justify-center text-lg shrink-0">🍷</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{m.name}</p>
                    <p className="text-xs text-text-sub mt-0.5">{m.wineViews} 酒款瀏覽 · {m.priceClicks} 比價點擊</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-wine">{m.favoriteCount}</span>
                    <span className="text-xs text-text-sub">收藏</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-wine-border">
            <h2 className="font-semibold text-text">熱門酒款</h2>
            <p className="text-xs text-text-sub mt-0.5">按酒款頁面瀏覽量</p>
          </div>
          {loading || !data || data.wines.length === 0 ? (
            <div className="py-12 text-center text-text-sub text-sm">{loading ? "載入中…" : "暫無數據，訪問酒款詳情後將自動記錄"}</div>
          ) : (
            <div className="divide-y divide-[#F5F0EA]">
              {data.wines.map((w, i) => {
                const clickRate = w.views > 0 ? Math.round((w.clickouts / w.views) * 100) : 0;
                return (
                  <div key={w.slug} className="px-6 py-4 flex items-center gap-4 hover:bg-bg transition-colors">
                    <span className="text-xs text-text-sub/40 w-4 text-right shrink-0">{i + 1}</span>
                    <div className="w-9 h-9 bg-red-light rounded-xl flex items-center justify-center text-lg shrink-0">{w.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{w.name}</p>
                      <p className="text-xs text-text-sub mt-0.5">{w.views.toLocaleString()} 瀏覽 · {w.clickouts} 比價點擊</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${clickRate >= 10 ? "text-green-600" : "text-text"}`}>{clickRate}%</p>
                      <p className="text-[10px] text-text-sub">轉化率</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-wine-border rounded-2xl p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-text">本週每日瀏覽</h2>
          <p className="text-xs text-text-sub mt-0.5">頁面瀏覽量 vs 獨立訪客</p>
        </div>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center text-text-sub text-sm">載入中…</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE2" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9B9490" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9B9490" }} tickLine={false} axisLine={false} />
              <Tooltip {...TooltipStyle} />
              <Bar dataKey="pageViews" name="頁面瀏覽" fill="#5B2E35" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="visitors" name="獨立訪客" fill="#B8956A" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}

// ── Merchant analytics view (translated) ─────────────────────────────────────

function MerchantAnalytics() {
  const [data, setData] = useState<MerchantAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useDashboardLang();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/merchant/analytics");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalViews = data?.totals.wineViews ?? 0;
  const totalClicks = data?.totals.priceClicks ?? 0;
  const conversionRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

  const statCards = [
    { label: t("mAnalytics.wineViews"),      value: loading ? "—" : totalViews.toLocaleString(),  icon: Eye,           iconBg: "bg-red-light", iconColor: "text-wine"        },
    { label: t("mAnalytics.priceClicks"),     value: loading ? "—" : totalClicks.toLocaleString(), icon: ShoppingCart,  iconBg: "bg-green-50",  iconColor: "text-green-700"   },
    { label: t("mAnalytics.conversionRate"),  value: loading ? "—" : `${conversionRate}%`,         icon: TrendingUp,    iconBg: "bg-orange-50", iconColor: "text-orange-600"  },
    { label: t("mAnalytics.winesListed"),     value: loading ? "—" : (data?.wineStats.length ?? 0).toLocaleString(), icon: MousePointerClick, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">{t("mAnalytics.title")}</h1>
          <p className="text-sm text-text-sub mt-1">{t("mAnalytics.subtitle")}</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-wine-border rounded-xl text-xs text-text-sub hover:border-gold hover:text-text transition-all cursor-pointer disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("mAnalytics.refresh")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white border border-wine-border rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${iconBg}`}>
                <Icon className={iconColor} style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text tracking-tight">{value}</p>
            <p className="text-sm text-text-sub mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-wine breakdown */}
      <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-wine-border">
          <h2 className="font-semibold text-text">{t("mAnalytics.winePerformance")}</h2>
          <p className="text-xs text-text-sub mt-0.5">{t("mAnalytics.winePerformanceSub")}</p>
        </div>
        {loading ? (
          <div className="py-12 text-center text-text-sub text-sm">{t("mAnalytics.loading")}</div>
        ) : !data || data.wineStats.length === 0 ? (
          <div className="py-12 text-center text-text-sub text-sm">{t("mAnalytics.noData")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg border-b border-wine-border">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.wine")}</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("mAnalytics.views")}</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("mAnalytics.clicks")}</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("mAnalytics.rate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0EA]">
              {data.wineStats.map((w, i) => {
                const rate = w.views > 0 ? Math.round((w.clickouts / w.views) * 100) : 0;
                return (
                  <tr key={w.slug} className="hover:bg-bg transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-sub/40 w-4 text-right shrink-0">{i + 1}</span>
                        <div className="w-9 h-9 bg-red-light rounded-xl flex items-center justify-center text-lg shrink-0">{w.emoji}</div>
                        <p className="font-medium text-text truncate">{w.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-text">{w.views.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right text-text-sub">{w.clickouts.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${rate >= 10 ? "text-green-600" : "text-text-sub"}`}>{rate}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent clicks */}
      <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-wine-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-text">{t("mAnalytics.recentClicks")}</h2>
            <p className="text-xs text-text-sub mt-0.5">{t("mAnalytics.recentClicksSub")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            {t("mAnalytics.realtime")}
          </span>
        </div>
        {loading ? (
          <div className="py-12 text-center text-text-sub text-sm">{t("mAnalytics.loading")}</div>
        ) : !data || data.recentClicks.length === 0 ? (
          <div className="py-12 text-center text-text-sub text-sm">{t("mAnalytics.noClicks")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-bg border-b border-wine-border">
              <th className="text-left px-6 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("table.wine")}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">Session</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">{t("mAnalytics.time")}</th>
            </tr></thead>
            <tbody className="divide-y divide-[#F5F0EA]">
              {data.recentClicks.map((c, i) => (
                <tr key={i} className="hover:bg-bg transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{c.wineEmoji}</span>
                      <p className="font-medium text-text">{c.wineName || c.wineSlug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-text-sub">{c.sessionId.slice(0, 8)}…</td>
                  <td className="px-6 py-3.5 text-right text-text-sub text-xs">{new Date(c.timestamp).toLocaleTimeString("zh-HK")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Root: detect role ─────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [role, setRole] = useState<"admin" | "merchant" | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((acc) => setRole(acc?.role ?? null));
  }, []);

  if (!role) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-bg-card rounded-xl w-48" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-bg-card rounded-2xl" />)}
        </div>
        <div className="h-64 bg-bg-card rounded-2xl" />
      </div>
    );
  }

  return role === "admin" ? <AdminAnalytics /> : <MerchantAnalytics />;
}
